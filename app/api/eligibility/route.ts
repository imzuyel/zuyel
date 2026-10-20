import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, EligibilityPolicy, EligibilityException, EligibilityOverride, EligibilityDecision, EligibilityAuditLog } from "@/lib/database";
import { checkEligibility, resolveApplicablePolicy, calculateBulkEligibility } from "@/lib/eligibilityEngine";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.nextUrl);
    const action = searchParams.get("action");

    if (action === "get_policies") {
      return NextResponse.json({
        success: true,
        policies: institutionalDb.eligibilityPolicies
      });
    }

    if (action === "get_exceptions") {
      return NextResponse.json({
        success: true,
        exceptions: institutionalDb.eligibilityExceptions
      });
    }

    if (action === "get_audit_logs") {
      return NextResponse.json({
        success: true,
        logs: institutionalDb.eligibilityAuditLogs
      });
    }

    if (action === "check_eligibility") {
      const quizId = searchParams.get("quizId") || "quiz-1";
      const classIdStr = searchParams.get("classId");
      const section = searchParams.get("section") || "A";
      const tradeIdStr = searchParams.get("tradeId");

      // Find the quiz
      const quiz = institutionalDb.quizzes.find(q => q.id === quizId);
      if (!quiz) {
        return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
      }

      // Filter students by class & section
      let classFiltered = institutionalDb.students;
      if (classIdStr) {
        classFiltered = classFiltered.filter(s => String(s.classId) === String(classIdStr));
      }
      if (section) {
        classFiltered = classFiltered.filter(s => s.section === section);
      }
      if (tradeIdStr && tradeIdStr !== "all" && tradeIdStr !== "0") {
        classFiltered = classFiltered.filter(s => String(s.tradeId) === String(tradeIdStr));
      }

      const { decisions, summary } = calculateBulkEligibility(quiz, classFiltered, undefined, "Teacher");
      return NextResponse.json({
        success: true,
        decisions,
        summary,
        totalStudentsCount: classFiltered.length
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Eligibility GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Missing action parameter" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    // 1. CREATE POLICY
    if (action === "create_policy") {
      const { name, description, type, scope, scopeId, minAttendancePercentage, calculationWindow, subjectSpecific, priority } = body;

      if (!name || !type || !scope) {
        return NextResponse.json({ success: false, error: "Missing required policy fields" }, { status: 400 });
      }

      const newPolicy: EligibilityPolicy = {
        id: `policy-${uuidv4()}`,
        name,
        description,
        type,
        scope,
        scopeId,
        minAttendancePercentage: Number(minAttendancePercentage) || 75,
        calculationWindow: calculationWindow || "current_academic_year",
        subjectSpecific: !!subjectSpecific,
        priority: Number(priority) || 1,
        version: 1,
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp
      };

      institutionalDb.eligibilityPolicies.unshift(newPolicy);

      // Save version log
      institutionalDb.eligibilityPolicyVersions.push({
        id: `version-${uuidv4()}`,
        policyId: newPolicy.id,
        version: 1,
        policySnapshot: newPolicy,
        changedBy: "Admin",
        reason: "Initial policy creation",
        createdAt: timestamp
      });

      // Audit Log
      institutionalDb.eligibilityAuditLogs.unshift({
        id: `audit-${uuidv4()}`,
        eventType: "POLICY_CREATED",
        message: `নীতিমালা [${name}] সফলভাবে তৈরি ও সক্রিয় করা হয়েছে।`,
        performedBy: "Admin",
        timestamp
      });

      return NextResponse.json({ success: true, policy: newPolicy });
    }

    // 2. UPDATE POLICY
    if (action === "update_policy") {
      const { id, name, description, minAttendancePercentage, calculationWindow, subjectSpecific, priority, status } = body;

      const idx = institutionalDb.eligibilityPolicies.findIndex(p => p.id === id);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Policy not found" }, { status: 404 });
      }

      const oldPolicy = institutionalDb.eligibilityPolicies[idx];
      const nextVersion = oldPolicy.version + 1;

      const updatedPolicy: EligibilityPolicy = {
        ...oldPolicy,
        name: name || oldPolicy.name,
        description: description || oldPolicy.description,
        minAttendancePercentage: minAttendancePercentage !== undefined ? Number(minAttendancePercentage) : oldPolicy.minAttendancePercentage,
        calculationWindow: calculationWindow || oldPolicy.calculationWindow,
        subjectSpecific: subjectSpecific !== undefined ? !!subjectSpecific : oldPolicy.subjectSpecific,
        priority: priority !== undefined ? Number(priority) : oldPolicy.priority,
        status: status || oldPolicy.status,
        version: nextVersion,
        updatedAt: timestamp
      };

      // Store old version in history
      institutionalDb.eligibilityPolicyVersions.push({
        id: `version-${uuidv4()}`,
        policyId: oldPolicy.id,
        version: oldPolicy.version,
        policySnapshot: oldPolicy,
        changedBy: "Admin",
        reason: "Policy updated",
        createdAt: timestamp
      });

      // Update in active array
      institutionalDb.eligibilityPolicies[idx] = updatedPolicy;

      // Audit Log
      institutionalDb.eligibilityAuditLogs.unshift({
        id: `audit-${uuidv4()}`,
        eventType: "POLICY_UPDATED",
        message: `নীতিমালা [${updatedPolicy.name}] সংস্করণ ${nextVersion}-এ হালনাগাদ করা হয়েছে।`,
        performedBy: "Admin",
        timestamp
      });

      return NextResponse.json({ success: true, policy: updatedPolicy });
    }

    // 3. CREATE EXCEPTION
    if (action === "create_exception") {
      const { studentId, scope, scopeId, effectiveDate, expiryDate, approvedBy, reason, reference } = body;

      if (!studentId || !scope || !effectiveDate || !expiryDate || !approvedBy || !reason) {
        return NextResponse.json({ success: false, error: "Missing required exemption fields" }, { status: 400 });
      }

      const student = institutionalDb.students.find(s => s.id === Number(studentId));
      if (!student) {
        return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
      }

      const newException: EligibilityException = {
        id: `exception-${uuidv4()}`,
        studentId: Number(studentId),
        scope,
        scopeId,
        effectiveDate,
        expiryDate,
        approvedBy,
        reason,
        reference,
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp
      };

      institutionalDb.eligibilityExceptions.unshift(newException);

      // Audit Log
      institutionalDb.eligibilityAuditLogs.unshift({
        id: `audit-${uuidv4()}`,
        eventType: "EXCEPTION_APPROVED",
        message: `শিক্ষার্থী ${student.name} (রোল ${student.roll})-এর জন্য বিশেষ উপস্থিতি অব্যাহতি অনুমোদন করা হয়েছে।`,
        performedBy: approvedBy,
        timestamp
      });

      return NextResponse.json({ success: true, exception: newException });
    }

    // 4. CREATE OVERRIDE (Teacher Decision Bypass)
    if (action === "create_override") {
      const { studentId, quizId, originalDecision, newDecision, reason, reference, performedBy } = body;

      if (!studentId || !quizId || !newDecision || !reason || !performedBy) {
        return NextResponse.json({ success: false, error: "Missing required override parameters" }, { status: 400 });
      }

      const student = institutionalDb.students.find(s => s.id === Number(studentId));
      if (!student) {
        return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
      }

      // Check if already overriden
      const existingIdx = institutionalDb.eligibilityOverrides.findIndex(o => o.studentId === Number(studentId) && o.quizId === quizId);

      const overrideObj: EligibilityOverride = {
        id: `override-${uuidv4()}`,
        studentId: Number(studentId),
        quizId,
        originalDecision: originalDecision || "NOT_ELIGIBLE",
        newDecision,
        reason,
        reference,
        performedBy,
        createdAt: timestamp
      };

      if (existingIdx !== -1) {
        institutionalDb.eligibilityOverrides[existingIdx] = overrideObj;
      } else {
        institutionalDb.eligibilityOverrides.push(overrideObj);
      }

      // Audit Log
      institutionalDb.eligibilityAuditLogs.unshift({
        id: `audit-${uuidv4()}`,
        eventType: "OVERRIDE_CREATED",
        message: `শিক্ষক [${performedBy}] শিক্ষার্থী ${student.name}-এর কুইজ যোগ্যতা পরিবর্তন করেছেন: ${newDecision} (কারণ: ${reason})`,
        performedBy,
        timestamp
      });

      return NextResponse.json({ success: true, override: overrideObj });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Eligibility POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
