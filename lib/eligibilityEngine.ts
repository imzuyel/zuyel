import { institutionalDb, Student, Quiz, EligibilityPolicy, EligibilityException, EligibilityOverride, EligibilityDecision, AttendanceRecord, AttendanceEntry } from "./database";
import { parseClassNumeric, doesClassHaveTrade, isTradeValidForClass } from "./academicStructure";

/**
 * Resolves the single most specific active policy for a student and quiz context.
 */
export function resolveApplicablePolicy(
  student: Student,
  quiz: Quiz
): { policy: EligibilityPolicy; resolutionReason: string } {
  const policies = institutionalDb.eligibilityPolicies.filter(p => p.status === "active");
  const studentClassNum = parseClassNumeric(student.classId);

  let bestPolicy: EligibilityPolicy | null = null;
  let bestScore = -1;
  let resolutionReason = "Default Global Policy Applied";

  for (const policy of policies) {
    let matches = false;
    let specificityScore = 0;

    switch (policy.scope) {
      case "quiz":
        if (policy.scopeId === quiz.id) {
          matches = true;
          specificityScore = 100;
        }
        break;

      case "subject":
        if (quiz.mode === "academic" && quiz.subjectId && String(policy.scopeId) === String(quiz.subjectId)) {
          matches = true;
          specificityScore = 80;
        }
        break;

      case "trade":
        if (student.tradeId && String(policy.scopeId) === String(student.tradeId)) {
          matches = true;
          specificityScore = 60;
        }
        break;

      case "class":
        if (String(policy.scopeId) === String(student.classId)) {
          matches = true;
          specificityScore = 40;
        }
        break;

      case "academic_year":
        if (String(policy.scopeId) === String(student.session)) {
          matches = true;
          specificityScore = 20;
        }
        break;

      case "global":
        matches = true;
        specificityScore = 1;
        break;
    }

    if (matches) {
      // Score is a combination of policy priority and its specificity scope
      const totalScore = (policy.priority * 100) + specificityScore;
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestPolicy = policy;
        resolutionReason = `Resolved via scope [${policy.scope}] with priority ${policy.priority}`;
      }
    }
  }

  // Fallback to global policy if none matches, or create a virtual fallback
  if (!bestPolicy) {
    bestPolicy = institutionalDb.eligibilityPolicies.find(p => p.id === "policy-global") || {
      id: "policy-fallback",
      name: "বিটিইবি সিস্টেম ডিফল্ট নীতি (System Default Fallback)",
      type: "attendance_percentage",
      scope: "global",
      minAttendancePercentage: 75,
      calculationWindow: "current_academic_year",
      subjectSpecific: false,
      priority: 0,
      version: 1,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  return { policy: bestPolicy, resolutionReason };
}

/**
 * Calculates attendance metrics for a student based on policy parameters.
 */
export function calculateAttendanceMetrics(
  student: Student,
  policy: EligibilityPolicy,
  quiz: Quiz
): { totalClasses: number; presentClasses: number; percentage: number; log: string } {
  const records = institutionalDb.attendanceRecords;
  const today = new Date();
  
  // 1. Determine calculation window date range
  let startDate = new Date(today.getFullYear(), 0, 1); // Academic Year start
  let endDate = today;

  if (policy.calculationWindow === "current_day") {
    startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  } else if (policy.calculationWindow === "current_week") {
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // start on Monday
    startDate = new Date(today.setDate(diff));
  } else if (policy.calculationWindow === "current_month") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (policy.calculationWindow === "custom_date_range" && policy.customStartDate && policy.customEndDate) {
    startDate = new Date(policy.customStartDate);
    endDate = new Date(policy.customEndDate);
  }

  // 2. Filter attendance records based on academic context & policy rules
  const studentClassNum = parseClassNumeric(student.classId);
  const filteredRecords = records.filter(r => {
    // Basic context check
    if (String(r.classId) !== String(student.classId)) return false;
    if (r.section !== student.section) return false;
    
    // Date window check
    const rDate = new Date(r.date);
    if (rDate < startDate || rDate > endDate) return false;

    // Subject specificity rule
    if (policy.subjectSpecific || quiz.mode === "academic") {
      if (quiz.subjectId && r.subjectCode && String(r.subjectCode) !== String(quiz.subjectId)) {
        return false;
      }
    }

    return true;
  });

  // 3. Count total and present/late classes
  let totalClasses = filteredRecords.length;
  let presentClasses = 0;

  filteredRecords.forEach(r => {
    const entry = r.entries.find(e => e.studentId === student.id);
    if (entry && (entry.status === "P" || entry.status === "L")) {
      presentClasses++;
    }
  });

  // Default to 100% if no records exist yet in the window (safety rule)
  const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;
  
  const log = `Found ${totalClasses} classes in window [${policy.calculationWindow}], student attended ${presentClasses}`;

  return { totalClasses, presentClasses, percentage, log };
}

/**
 * Main Eligibility Engine calculator. Executes all academic placement validations,
 * attendance thresholds, active exceptions, and teacher overrides.
 */
export function checkEligibility(
  student: Student,
  quiz: Quiz,
  quizSessionId?: string,
  callerName: string = "Authorized Staff"
): EligibilityDecision {
  const calculatedAt = new Date().toISOString();
  
  // 1. Initial State
  const studentClassNum = parseClassNumeric(student.classId);
  const academicContext = {
    academicYear: Number(student.session || "2026"),
    classId: Number(student.classId),
    section: student.section,
    tradeId: student.tradeId,
    subjectId: quiz.subjectId,
  };

  const attendanceContext = {
    totalClasses: 0,
    presentClasses: 0,
    attendancePercentage: 100,
    window: "current_academic_year"
  };

  const decisionObj: EligibilityDecision = {
    id: `decision-${student.id}-${quiz.id}-${Date.now()}`,
    studentId: student.id,
    quizId: quiz.id,
    quizSessionId,
    academicContext,
    attendanceContext,
    policyUsed: { id: "default", name: "System Policy", version: 1, threshold: 75 },
    finalDecision: "NOT_ELIGIBLE",
    decisionReason: "Initializing",
    calculatedAt
  };

  // 2. Validate Academic Placement Match with Quiz
  if (quiz.mode === "academic") {
    // If Quiz has ClassId/TradeId restrictions, validate student matches
    if (quiz.classId && String(quiz.classId) !== String(student.classId)) {
      decisionObj.finalDecision = "NOT_ELIGIBLE";
      decisionObj.decisionReason = `Student class [${student.className}] does not match quiz class context.`;
      return decisionObj;
    }

    if (quiz.tradeId && String(quiz.tradeId) !== String(student.tradeId)) {
      decisionObj.finalDecision = "NOT_ELIGIBLE";
      decisionObj.decisionReason = `Student trade mismatch. Quiz expects [${quiz.tradeId}] trade.`;
      return decisionObj;
    }
  }

  // 3. Class 6-8 Special Trade Rule
  if (!doesClassHaveTrade(studentClassNum)) {
    if (student.tradeId) {
      decisionObj.finalDecision = "NOT_ELIGIBLE";
      decisionObj.decisionReason = "শ্রেণি ৬-৮-এর জন্য কোনো কারিগরি ট্রেড গ্রহণযোগ্য নয় (Pre-Vocational Trade constraint violated).";
      return decisionObj;
    }
  } else {
    // Class 9-12 requires valid trade mapping
    if (student.tradeId && !isTradeValidForClass(studentClassNum, student.tradeId)) {
      decisionObj.finalDecision = "NOT_ELIGIBLE";
      decisionObj.decisionReason = `ট্রেড আইডি [${student.tradeId}] শ্রেণি ${studentClassNum}-এর জন্য অনুমোদিত নয়।`;
      return decisionObj;
    }
  }

  // 4. Student Status check (e.g. Inactive, Transferred cannot participate)
  if (student.status !== "Active") {
    decisionObj.finalDecision = "NOT_ELIGIBLE";
    decisionObj.decisionReason = `শিক্ষার্থী বর্তমানে নিষ্ক্রিয় বা স্থানান্তরিত (Status: ${student.status}).`;
    return decisionObj;
  }

  // 5. Policy Resolution (Most Specific Applicable Policy)
  const { policy, resolutionReason } = resolveApplicablePolicy(student, quiz);
  const threshold = policy.minAttendancePercentage || 75;

  decisionObj.policyUsed = {
    id: policy.id,
    name: policy.name,
    version: policy.version,
    threshold
  };

  // 6. Calculate Attendance
  const metrics = calculateAttendanceMetrics(student, policy, quiz);
  decisionObj.attendanceContext = {
    totalClasses: metrics.totalClasses,
    presentClasses: metrics.presentClasses,
    attendancePercentage: metrics.percentage,
    window: policy.calculationWindow
  };

  // Apply default eligibility based on threshold
  if (metrics.percentage >= threshold) {
    decisionObj.finalDecision = "ELIGIBLE";
    decisionObj.decisionReason = "হাজিরা শর্ত পূরণ হয়েছে (Attendance requirement satisfied).";
  } else {
    decisionObj.finalDecision = "NOT_ELIGIBLE";
    decisionObj.decisionReason = `প্রয়োজনীয় হাজিরা অনুপস্থিত (উপস্থিতি ${metrics.percentage}%, ন্যূনতম প্রয়োজন ${threshold}%).`;
  }

  // 7. Check Exception System (Medical / Official Duty exemption)
  const exceptions = institutionalDb.eligibilityExceptions.filter(e => e.studentId === student.id && e.status === "active");
  const todayStr = new Date().toISOString().split("T")[0];

  const activeException = exceptions.find(e => {
    const isDateValid = todayStr >= e.effectiveDate && todayStr <= e.expiryDate;
    if (!isDateValid) return false;

    // Check scope match
    if (e.scope === "quiz" && e.scopeId !== quiz.id) return false;
    if (e.scope === "subject" && quiz.subjectId && String(e.scopeId) !== String(quiz.subjectId)) return false;

    return true;
  });

  if (activeException) {
    decisionObj.exceptionApplied = {
      id: activeException.id,
      reason: activeException.reason,
      approvedBy: activeException.approvedBy
    };
    decisionObj.finalDecision = "ELIGIBLE";
    decisionObj.decisionReason = `অনুমোদিত বিশেষ অব্যাহতি সক্রিয়: ${activeException.reason} (Approved Exception Active).`;
  }

  // 8. Check Override System (Teacher Override wins)
  const override = institutionalDb.eligibilityOverrides.find(o => 
    o.studentId === student.id && o.quizId === quiz.id
  );

  if (override) {
    decisionObj.overrideApplied = {
      performedBy: override.performedBy,
      reason: override.reason,
      timestamp: override.createdAt
    };
    decisionObj.finalDecision = override.newDecision;
    decisionObj.decisionReason = `শিক্ষক/অ্যাডমিন কর্তৃক ম্যানুয়ালি পরিবর্তিত সিদ্ধান্ত: ${override.reason} (Manually Overridden by ${override.performedBy}).`;
  }

  return decisionObj;
}

/**
 * Calculates eligibility for all students in a batch or filtered group.
 * Optimized to perform single pass filters where possible.
 */
export function calculateBulkEligibility(
  quiz: Quiz,
  students: Student[],
  quizSessionId?: string,
  callerName: string = "Authorized Staff"
): { decisions: EligibilityDecision[]; summary: { total: number; eligible: number; notEligible: number; exception: number; override: number } } {
  const decisions = students.map(s => checkEligibility(s, quiz, quizSessionId, callerName));
  
  const summary = {
    total: decisions.length,
    eligible: decisions.filter(d => d.finalDecision === "ELIGIBLE").length,
    notEligible: decisions.filter(d => d.finalDecision === "NOT_ELIGIBLE").length,
    exception: decisions.filter(d => d.exceptionApplied).length,
    override: decisions.filter(d => d.overrideApplied).length
  };

  return { decisions, summary };
}

// Section 40 Standard Service API Helpers
export const calculateEligibility = checkEligibility;

export function getEligibilityDecision(studentId: number, quizId: string): EligibilityDecision | undefined {
  const student = institutionalDb.students.find(s => s.id === studentId);
  const quiz = institutionalDb.quizzes.find(q => q.id === quizId);
  if (!student || !quiz) return undefined;
  return checkEligibility(student, quiz);
}

export function getEligibilityPolicy(policyId: string): EligibilityPolicy | undefined {
  return institutionalDb.eligibilityPolicies.find(p => p.id === policyId);
}

export function freezeEligibility(sessionId: string, performedBy: string = "Quiz System"): boolean {
  const session = institutionalDb.liveSessions.find(s => s.id === sessionId);
  if (!session) return false;
  (session as any).eligibilityFrozen = true;
  institutionalDb.eligibilityAuditLogs.unshift({
    id: `freeze-audit-${sessionId}-${Date.now()}`,
    eventType: "QUIZ_SESSION_ELIGIBILITY_FROZEN",
    message: `সেশন ${session.sessionCode} শুরু হওয়ায় কুইজ যোগ্যতা তালিকা স্থবির করা হয়েছে।`,
    performedBy,
    timestamp: new Date().toISOString()
  });
  return true;
}

export function recalculateEligibility(
  quiz: Quiz,
  students: Student[],
  quizSessionId?: string,
  callerName: string = "Teacher"
) {
  const session = quizSessionId ? institutionalDb.liveSessions.find(s => s.id === quizSessionId) : undefined;
  if (session && (session as any).eligibilityFrozen && session.status !== "LOBBY") {
    throw new Error("লাইভ সেশন চলাকালীন রিক্যালকুলেশন অনুমোদিত নয় (Session is active and eligibility is frozen).");
  }

  const result = calculateBulkEligibility(quiz, students, quizSessionId, callerName);
  institutionalDb.eligibilityAuditLogs.unshift({
    id: `recalc-audit-${Date.now()}`,
    eventType: "ELIGIBILITY_RECALCULATED",
    message: `কুইজ [${quiz.title}]-এর জন্য ${students.length} জন শিক্ষার্থীর যোগ্যতা পুনঃগণনা সম্পন্ন হয়েছে।`,
    performedBy: callerName,
    timestamp: new Date().toISOString()
  });
  return result;
}

export function overrideEligibility(
  studentId: number,
  quizId: string,
  originalDecision: "ELIGIBLE" | "NOT_ELIGIBLE",
  newDecision: "ELIGIBLE" | "NOT_ELIGIBLE",
  reason: string,
  reference?: string,
  performedBy: string = "Instructor"
): EligibilityOverride {
  const existingIdx = institutionalDb.eligibilityOverrides.findIndex(
    o => o.studentId === studentId && o.quizId === quizId
  );
  const now = new Date().toISOString();
  const overrideRecord: EligibilityOverride = {
    id: `override-${studentId}-${quizId}-${Date.now()}`,
    studentId,
    quizId,
    originalDecision,
    newDecision,
    reason,
    reference,
    performedBy,
    createdAt: now
  };

  if (existingIdx !== -1) {
    institutionalDb.eligibilityOverrides[existingIdx] = overrideRecord;
  } else {
    institutionalDb.eligibilityOverrides.push(overrideRecord);
  }

  institutionalDb.eligibilityAuditLogs.unshift({
    id: `audit-ovr-${Date.now()}`,
    eventType: "OVERRIDE_APPLIED",
    message: `শিক্ষার্থী আইডি ${studentId}-এর জন্য কুইজ [${quizId}]-এ ম্যানুয়াল ওভাররাইড প্রয়োগ (${originalDecision} -> ${newDecision}): ${reason}`,
    performedBy,
    timestamp: now
  });

  return overrideRecord;
}
