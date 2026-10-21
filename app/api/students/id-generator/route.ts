import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, Student, StudentIdAuditLog, StudentIdConfig } from "@/lib/database";
import {
  previewBatchStudentIds,
  scanInstitutionIdIntegrity,
  buildStudentIdString,
  getPatternPreview,
} from "@/lib/studentIdEngine";
import { doesClassHaveTrade, parseClassNumeric } from "@/lib/academicStructure";
import { verifyBackendAuthorization } from "@/lib/serverAuthGuard";


// GET: Institutional ID System Status, Integrity Scan, Config, and Audit Logs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classIdParam = searchParams.get("classId");
    const searchParam = (searchParams.get("search") || "").trim().toLowerCase();
    const statusParam = searchParams.get("status"); // "all" | "missing" | "duplicate" | "valid"

    const allStudents = institutionalDb.students;
    const integrityReport = scanInstitutionIdIntegrity(allStudents);

    let filtered = [...allStudents];

    if (classIdParam && classIdParam !== "all") {
      const clsNum = Number(classIdParam);
      filtered = filtered.filter((s) => s.classId === clsNum);
    }

    if (statusParam === "missing") {
      const missingSet = new Set(integrityReport.missingIds.map((m) => m.id));
      filtered = filtered.filter((s) => missingSet.has(s.id));
    } else if (statusParam === "duplicate") {
      const dupStudentIdSet = new Set<number>();
      integrityReport.duplicateIds.forEach((d) => {
        d.students.forEach((ds) => dupStudentIdSet.add(ds.id));
      });
      filtered = filtered.filter((s) => dupStudentIdSet.has(s.id));
    }

    if (searchParam) {
      filtered = filtered.filter(
        (s) =>
          s.studentId?.toLowerCase().includes(searchParam) ||
          s.name?.toLowerCase().includes(searchParam) ||
          s.nameBangla?.includes(searchParam) ||
          s.admissionNo?.toLowerCase().includes(searchParam) ||
          String(s.roll) === searchParam
      );
    }

    return NextResponse.json({
      success: true,
      config: institutionalDb.idConfig,
      previewPattern: getPatternPreview(institutionalDb.idConfig),
      integrityReport,
      auditLogs: [...institutionalDb.idAuditLogs].reverse(),
      students: filtered,
      totalCount: allStudents.length,
      filteredCount: filtered.length,
    });
  } catch (error: any) {
    console.error("Failed to load Student ID state:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Actions for Preview, Bulk Generation, Single Generation, Config Update, and Duplicate Auto-fix
export async function POST(req: NextRequest) {
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "manage_students",
    endpointName: "/api/students/id-generator (POST)",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const action = body.action;


    // 1. PREVIEW: Pre-flight dry-run generation
    if (action === "preview") {
      const {
        classId,
        tradeId,
        section,
        session = "2026",
        allowOverwriteExisting = false,
        configOverride,
        missingOnly = false,
      } = body;

      const activeConfig: StudentIdConfig = {
        ...institutionalDb.idConfig,
        ...(configOverride || {}),
      };

      // Filter target students
      let targets = [...institutionalDb.students];

      if (classId && classId !== "all") {
        targets = targets.filter((s) => s.classId === Number(classId));
      }

      const clsNumeric = parseClassNumeric(classId);
      const hasTrades = doesClassHaveTrade(clsNumeric);

      if (hasTrades && tradeId && tradeId !== "all") {
        targets = targets.filter((s) => Number(s.tradeId) === Number(tradeId));
      }

      if (section && section !== "all") {
        targets = targets.filter((s) => s.section === section);
      }

      if (session && session !== "all") {
        targets = targets.filter((s) => (s.session || "2026") === String(session));
      }

      if (missingOnly) {
        targets = targets.filter((s) => !s.studentId || s.studentId === "—" || s.studentId === "MISSING");
      }

      // Sort by roll ascending
      targets.sort((a, b) => (Number(a.roll) || 0) - (Number(b.roll) || 0));

      // Collect existing IDs across whole database
      const existingDbIds = new Set(
        institutionalDb.students
          .map((s) => (s.studentId || "").trim().toUpperCase())
          .filter((id) => id && id !== "—" && id !== "MISSING")
      );

      const previewItems = previewBatchStudentIds(targets, activeConfig, existingDbIds, {
        allowOverwriteExisting,
      });

      const newCount = previewItems.filter((p) => p.status === "new").length;
      const unchangedCount = previewItems.filter((p) => p.status === "unchanged").length;
      const overwriteCount = previewItems.filter((p) => p.status === "overwrite").length;
      const collisionCount = previewItems.filter((p) => p.status === "collision").length;

      return NextResponse.json({
        success: true,
        previewItems,
        summary: {
          total: previewItems.length,
          newCount,
          unchangedCount,
          overwriteCount,
          collisionCount,
        },
      });
    }

    // 2. BULK GENERATE: Apply generated IDs to database
    if (action === "bulk_generate") {
      const {
        items, // Array of { internalId: number; proposedId: string; allowOverwrite?: boolean }
        reason = "বাল্ক আইডি প্রদান (Bulk Student ID Assignment)",
        changedBy = "Admin / Principal",
      } = body;

      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { success: false, error: "আইডি প্রদানের জন্য কোন শিক্ষার্থী নির্বাচিত হয়নি।" },
          { status: 400 }
        );
      }

      // Validate proposed IDs for collisions
      const idMap = new Map<number, Student>();
      institutionalDb.students.forEach((s) => idMap.set(s.id, s));

      const updatedIds: { id: number; oldId: string; newId: string }[] = [];
      const newLogs: StudentIdAuditLog[] = [];

      for (const item of items) {
        const student = idMap.get(item.internalId);
        if (!student) continue;

        const cleanProposed = (item.proposedId || "").trim();
        if (!cleanProposed) continue;

        const currentId = (student.studentId || "").trim();

        // Check if ID is already assigned to someone else in the database
        const collisionStudent = institutionalDb.students.find(
          (s) => s.id !== student.id && s.studentId?.toUpperCase() === cleanProposed.toUpperCase()
        );

        if (collisionStudent) {
          return NextResponse.json(
            {
              success: false,
              error: `আইডি সংঘর্ষ: ${cleanProposed} ইতিমধ্যে ${collisionStudent.nameBangla || collisionStudent.name} (রোল ${collisionStudent.roll}) এর জন্য নির্ধারিত।`,
            },
            { status: 400 }
          );
        }

        // If student already had a valid ID and it's changing, record previous ID
        if (currentId !== cleanProposed) {
          student.studentId = cleanProposed;
          updatedIds.push({ id: student.id, oldId: currentId, newId: cleanProposed });

          newLogs.push({
            id: `log-${Date.now()}-${student.id}`,
            studentId: student.id,
            studentName: student.nameBangla || student.name,
            roll: student.roll,
            className: student.className,
            previousStudentId: currentId || "—",
            newStudentId: cleanProposed,
            changedBy,
            reason,
            timestamp: new Date().toISOString(),
            actionType: "bulk_generate",
          });
        }
      }

      // Append new audit logs
      institutionalDb.idAuditLogs.push(...newLogs);

      return NextResponse.json({
        success: true,
        message: `${updatedIds.length} জন শিক্ষার্থীর স্টুডেন্ট আইডি সফলভাবে ডাটাবেসে সংরক্ষিত হয়েছে।`,
        updatedCount: updatedIds.length,
        logs: newLogs,
      });
    }

    // 3. SINGLE GENERATE / REGENERATE: Individual student ID assignment
    if (action === "single_generate") {
      const {
        internalId,
        newStudentId,
        reason = "একক আইডি পরিবর্তন / প্রদান",
        changedBy = "System Administrator",
        forceOverride = false,
      } = body;

      const student = institutionalDb.students.find((s) => s.id === Number(internalId));
      if (!student) {
        return NextResponse.json({ success: false, error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
      }

      const cleanNewId = (newStudentId || "").trim();
      if (!cleanNewId) {
        return NextResponse.json({ success: false, error: "স্টুডেন্ট আইডি ফাঁকা হতে পারে না।" }, { status: 400 });
      }

      const currentId = (student.studentId || "").trim();

      // Check collision
      const collisionStudent = institutionalDb.students.find(
        (s) => s.id !== student.id && s.studentId?.toUpperCase() === cleanNewId.toUpperCase()
      );

      if (collisionStudent) {
        return NextResponse.json(
          {
            success: false,
            error: `আইডি সংঘর্ষ: ${cleanNewId} ইতিমধ্যে ${collisionStudent.nameBangla || collisionStudent.name} (শ্রেণি: ${collisionStudent.className}, রোল: ${collisionStudent.roll}) এর জন্য ব্যবহৃত।`,
          },
          { status: 400 }
        );
      }

      // Check if existing ID is being replaced
      if (currentId && currentId !== cleanNewId && !forceOverride) {
        return NextResponse.json(
          {
            success: false,
            needsConfirmation: true,
            currentId,
            proposedId: cleanNewId,
            message: `শিক্ষার্থীর বর্তমান আইডি (${currentId}) ইতিমধ্যে বিদ্যমান। এটি প্রতিস্থাপন করতে অনুমতি ও কারণ উল্লেখ করুন।`,
          },
          { status: 400 }
        );
      }

      const log: StudentIdAuditLog = {
        id: `log-${Date.now()}-${student.id}`,
        studentId: student.id,
        studentName: student.nameBangla || student.name,
        roll: student.roll,
        className: student.className,
        previousStudentId: currentId || "—",
        newStudentId: cleanNewId,
        changedBy,
        reason,
        timestamp: new Date().toISOString(),
        actionType: currentId ? "correction" : "single_generate",
      };

      student.studentId = cleanNewId;
      institutionalDb.idAuditLogs.push(log);

      return NextResponse.json({
        success: true,
        student,
        log,
        message: "শিক্ষার্থীর আইডি সফলভাবে হালনাগাদ করা হয়েছে।",
      });
    }

    // 4. UPDATE CONFIGURATION: Institutional ID format rules
    if (action === "update_config") {
      const { config } = body;
      if (!config) {
        return NextResponse.json({ success: false, error: "কনফিগারেশন ডাটা পাওয়া যায়নি।" }, { status: 400 });
      }

      institutionalDb.idConfig = {
        ...institutionalDb.idConfig,
        ...config,
      };

      return NextResponse.json({
        success: true,
        config: institutionalDb.idConfig,
        previewPattern: getPatternPreview(institutionalDb.idConfig),
        message: "স্টুডেন্ট আইডি ফরম্যাট কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে।",
      });
    }

    // 5. FIX DUPLICATE / AUTO-RESOLVE COLLISION
    if (action === "fix_duplicate") {
      const {
        studentId: targetInternalId,
        reason = "ডুপ্লিকেট আইডি বিরোধ নিরসন (Collision Auto-Fix)",
        changedBy = "Audit Engine",
      } = body;

      const student = institutionalDb.students.find((s) => s.id === Number(targetInternalId));
      if (!student) {
        return NextResponse.json({ success: false, error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
      }

      const currentId = student.studentId || "—";
      const existingIds = new Set(
        institutionalDb.students.map((s) => (s.studentId || "").trim().toUpperCase())
      );

      // Generate next guaranteed unique ID for this student
      let candidate = "";
      for (let seq = 1; seq <= 99999; seq++) {
        const testId = buildStudentIdString(student, institutionalDb.idConfig, seq);
        if (!existingIds.has(testId.toUpperCase())) {
          candidate = testId;
          break;
        }
      }

      if (!candidate) {
        candidate = `PTSC-${student.session || "2026"}-${Date.now().toString().slice(-6)}`;
      }

      student.studentId = candidate;

      const log: StudentIdAuditLog = {
        id: `log-${Date.now()}-${student.id}`,
        studentId: student.id,
        studentName: student.nameBangla || student.name,
        roll: student.roll,
        className: student.className,
        previousStudentId: currentId,
        newStudentId: candidate,
        changedBy,
        reason,
        timestamp: new Date().toISOString(),
        actionType: "duplicate_fix",
      };

      institutionalDb.idAuditLogs.push(log);

      return NextResponse.json({
        success: true,
        newId: candidate,
        student,
        message: `শিক্ষার্থী ${student.nameBangla || student.name} কে নতুন স্বতন্ত্র আইডি (${candidate}) বরাদ্দ করা হয়েছে।`,
      });
    }

    return NextResponse.json({ success: false, error: "অজানা অ্যাকশন।" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/students/id-generator error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
