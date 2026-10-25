import { NextRequest, NextResponse } from "next/server";
import {
  getSubjectMasters,
  getSubjectMasterById,
  createSubjectMaster,
  updateSubjectMaster,
  deleteSubjectMaster,
  getSubjectMappings,
  saveSubjectMapping,
  removeSubjectMapping,
  previewCopyConfiguration,
  executeCopyConfiguration,
  getTeacherSubjectAssignments,
  assignTeacherToSubject,
  removeTeacherAssignment,
  getTeacherAcademicProfile,
  getSubject360View,
  getSubjectTopics,
  saveSubjectTopic,
  checkSubjectRoutineAlignment,
  validateSubjectEligibility,
  getSubjectAuditLogs,
  exportAcademicSubjectsDataset,
  importAcademicSubjectsDataset,
  logSubjectAudit,
} from "@/lib/subjectEngine";
import { ACADEMIC_CLASSES, ALL_TRADES, parseClassNumeric, doesClassHaveTrade } from "@/lib/academicStructure";
import { institutionalDb } from "@/lib/database";
import { requireTeacherOrAdmin, requireAdmin } from "@/lib/serverAuthGuard";

// ==========================================
// GET HANDLER
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "context";

    // 1. Subject Master Catalog
    if (action === "master") {
      const search = searchParams.get("search") || undefined;
      const status = searchParams.get("status") || undefined;
      const type = searchParams.get("type") || undefined;
      const id = searchParams.get("id");

      if (id) {
        const subject = getSubjectMasterById(Number(id));
        if (!subject) {
          return NextResponse.json({ success: false, error: "Subject not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, subject });
      }

      const subjects = getSubjectMasters({ search, status, type });
      return NextResponse.json({
        success: true,
        count: subjects.length,
        subjects,
      });
    }

    // 2. Class & Trade Subject Mappings
    if (action === "mapping") {
      const academicYear = searchParams.get("academicYear") || "2026";
      const classId = searchParams.get("classId") ? Number(searchParams.get("classId")) : undefined;
      const tradeId = searchParams.get("tradeId") ? Number(searchParams.get("tradeId")) : undefined;
      const section = searchParams.get("section") || undefined;
      const status = searchParams.get("status") || undefined;

      const mappings = getSubjectMappings({
        academicYear,
        classId,
        tradeId,
        section,
        status,
      });

      return NextResponse.json({
        success: true,
        academicYear,
        count: mappings.length,
        mappings,
      });
    }

    // 3. Teacher Subject Assignments
    if (action === "teachers") {
      const academicYear = searchParams.get("academicYear") || "2026";
      const teacherId = searchParams.get("teacherId") ? Number(searchParams.get("teacherId")) : undefined;
      const classId = searchParams.get("classId") ? Number(searchParams.get("classId")) : undefined;
      const tradeId = searchParams.get("tradeId") ? Number(searchParams.get("tradeId")) : undefined;
      const subjectId = searchParams.get("subjectId") ? Number(searchParams.get("subjectId")) : undefined;

      const assignments = getTeacherSubjectAssignments({
        academicYear,
        teacherId,
        classId,
        tradeId,
        subjectId,
      });

      const sanitizedFaculty = (institutionalDb.faculty || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        nameBangla: f.nameBangla || f.name,
        designation: f.designation,
        department: f.department,
        tradeCode: f.tradeCode || null,
        type: f.type || "faculty",
      }));

      return NextResponse.json({
        success: true,
        count: assignments.length,
        assignments,
        facultyList: sanitizedFaculty,
      });
    }

    // 4. Teacher 360° Academic Profile & Workload
    if (action === "teacher_profile") {
      const teacherId = searchParams.get("teacherId");
      const academicYear = searchParams.get("academicYear") || "2026";

      if (!teacherId) {
        return NextResponse.json({ success: false, error: "teacherId is required" }, { status: 400 });
      }

      const profile = getTeacherAcademicProfile(Number(teacherId), academicYear);
      if (!profile) {
        return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, profile });
    }

    // 5. Subject 360° Analytics (Routine, Attendance, Quiz, Results)
    if (action === "subject_360") {
      const subjectId = searchParams.get("subjectId");
      const academicYear = searchParams.get("academicYear") || "2026";

      if (!subjectId) {
        return NextResponse.json({ success: false, error: "subjectId is required" }, { status: 400 });
      }

      const view = getSubject360View(Number(subjectId), academicYear);
      if (!view) {
        return NextResponse.json({ success: false, error: "Subject not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: view });
    }

    // 6. Topics & Chapters (Quiz / Syllabus)
    if (action === "topics") {
      const subjectId = searchParams.get("subjectId");
      if (!subjectId) {
        return NextResponse.json({ success: false, error: "subjectId is required" }, { status: 400 });
      }

      const topics = getSubjectTopics(Number(subjectId));
      return NextResponse.json({ success: true, topics });
    }

    // 7. Copy Configuration Preview
    if (action === "copy_preview") {
      const sourceYear = searchParams.get("sourceYear") || "2026";
      const targetYear = searchParams.get("targetYear") || "2027";
      const classId = Number(searchParams.get("classId") || 4);
      const tradeId = searchParams.get("tradeId") ? Number(searchParams.get("tradeId")) : undefined;

      const preview = previewCopyConfiguration({ sourceYear, targetYear, classId, tradeId });
      return NextResponse.json({ success: true, preview });
    }

    // 8. Routine Alignment Check (Required vs Scheduled weekly periods)
    if (action === "routine_alignment") {
      const academicYear = searchParams.get("academicYear") || "2026";
      const classId = searchParams.get("classId") ? Number(searchParams.get("classId")) : undefined;
      const tradeId = searchParams.get("tradeId") ? Number(searchParams.get("tradeId")) : undefined;

      const alignment = checkSubjectRoutineAlignment({ academicYear, classId, tradeId });
      return NextResponse.json({ success: true, alignment });
    }

    // 9. Audit History
    if (action === "audit") {
      const limit = Number(searchParams.get("limit") || 50);
      const logs = getSubjectAuditLogs(limit);
      return NextResponse.json({ success: true, count: logs.length, logs });
    }

    // 10. Export Full Dataset
    if (action === "export") {
      const dataset = exportAcademicSubjectsDataset();
      return NextResponse.json({ success: true, dataset });
    }

    // Default: Overall Academic Context & Summary
    const masterList = getSubjectMasters();
    const mappings2026 = getSubjectMappings({ academicYear: "2026" });
    const teacherAssignments2026 = getTeacherSubjectAssignments({ academicYear: "2026" });

    return NextResponse.json({
      success: true,
      context: {
        academicYears: ["2025", "2026", "2027", "2028"],
        activeYear: "2026",
        classes: ACADEMIC_CLASSES,
        trades: ALL_TRADES,
        facultyCount: institutionalDb.faculty.length,
        totalSubjectMasters: masterList.length,
        totalMappings2026: mappings2026.length,
        totalTeacherAssignments2026: teacherAssignments2026.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ==========================================
// POST HANDLER (Create / Save / Assign / Copy / Import)
// ==========================================
export async function POST(req: NextRequest) {
  const guard = requireTeacherOrAdmin(req, "/api/academic/subjects");
  if (!guard.authorized) {
    return guard.errorResponse!;
  }

  try {
    const body = await req.json();
    const { action = "create_master" } = body;
    const user = guard.identity.userName || guard.identity.userEmail || "Staff";

    // 1. Create Subject Master
    if (action === "create_master") {
      const { code, name, nameBangla, nameEnglish, shortName, subjectType, creditHours, fullMarks, passMarks, theoryMarks, practicalMarks, vivaMarks, continuousMarks, status, displayOrder, description, btebCurriculumRef } = body;

      if (!code || !name) {
        return NextResponse.json({ success: false, error: "বিষয় কোড ও নাম বাধ্যতামূলক।" }, { status: 400 });
      }

      const result = createSubjectMaster(
        {
          code,
          name,
          nameBangla: nameBangla || name,
          nameEnglish: nameEnglish || name,
          shortName: shortName || code,
          subjectType: subjectType || "Theory",
          creditHours: Number(creditHours) || 3.0,
          fullMarks: Number(fullMarks) || 100,
          passMarks: Number(passMarks) || 33,
          theoryMarks: Number(theoryMarks) || 100,
          practicalMarks: Number(practicalMarks) || 0,
          vivaMarks: Number(vivaMarks) || 0,
          continuousMarks: Number(continuousMarks) || 40,
          status: status || "Active",
          displayOrder: Number(displayOrder) || 10,
          description: description || "",
          btebCurriculumRef: btebCurriculumRef || "",
          createdBy: user,
          updatedBy: user,
        },
        user
      );

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "বিষয় সফলভাবে তৈরি হয়েছে।", subject: result.subject });
    }

    // 2. Save Subject Mapping
    if (action === "save_mapping") {
      const { academicYear, classId, className, section, tradeId, tradeCode, tradeName, subjectId, subjectCode, subjectName, subjectNameBangla, subjectType, isOptional, weeklyPeriods, theoryPeriods, practicalPeriods, labPeriods, requiredWeeklyHours, fullMarks, passMarks, theoryMarks, practicalMarks, vivaMarks, continuousMarks, displayOrder, status } = body;

      if (!academicYear || !classId || !subjectId) {
        return NextResponse.json({ success: false, error: "শিক্ষাবর্ষ, শ্রেণি এবং বিষয় আইডি আবশ্যক।" }, { status: 400 });
      }

      const numericCls = parseClassNumeric(classId);
      if (!doesClassHaveTrade(numericCls) && tradeId && Number(tradeId) !== 0) {
        return NextResponse.json({ success: false, error: "৬ষ্ঠ-৮ম শ্রেণির জন্য কোনো ভোকেশনাল ট্রেড প্রযোজ্য নয়।" }, { status: 400 });
      }

      const fMarks = Number(fullMarks) || 100;
      const tMarks = theoryMarks !== undefined ? Number(theoryMarks) : (fullMarks ? Number(fullMarks) : 100);
      const pMarks = practicalMarks !== undefined ? Number(practicalMarks) : 0;
      const pPass = Number(passMarks) || 33;

      if (fMarks <= 0 || fMarks > 300) {
        return NextResponse.json({ success: false, error: "মোট নম্বর ১ থেকে ৩০০ এর মধ্যে হতে হবে।" }, { status: 400 });
      }
      if (tMarks + pMarks > fMarks) {
        return NextResponse.json({ success: false, error: `তত্ত্বীয় (${tMarks}) ও ব্যবহারিক (${pMarks}) নম্বরের যোগফল মোট নম্বরের (${fMarks}) চেয়ে বেশি হতে পারে না।` }, { status: 400 });
      }
      if (pPass > fMarks) {
        return NextResponse.json({ success: false, error: "পাস নম্বর মোট নম্বরের চেয়ে বেশি হতে পারে না।" }, { status: 400 });
      }

      const result = saveSubjectMapping(
        {
          academicYear,
          classId: Number(classId),
          className: className || `Class ${classId}`,
          numericClass: parseClassNumeric(classId),
          section: section || "all",
          tradeId: tradeId ? Number(tradeId) : undefined,
          tradeCode,
          tradeName,
          subjectId: Number(subjectId),
          subjectCode: subjectCode || String(subjectId),
          subjectName: subjectName || "Subject",
          subjectNameBangla: subjectNameBangla || subjectName || "বিষয়",
          subjectType: subjectType || "Theory",
          isOptional: !!isOptional,
          weeklyPeriods: Number(weeklyPeriods) || 4,
          theoryPeriods: Number(theoryPeriods) || 4,
          practicalPeriods: Number(practicalPeriods) || 0,
          labPeriods: Number(labPeriods) || 0,
          requiredWeeklyHours: Number(requiredWeeklyHours) || 3.0,
          fullMarks: Number(fullMarks) || 100,
          passMarks: Number(passMarks) || 33,
          theoryMarks: Number(theoryMarks) || 100,
          practicalMarks: Number(practicalMarks) || 0,
          vivaMarks: Number(vivaMarks) || 0,
          continuousMarks: Number(continuousMarks) || 40,
          displayOrder: Number(displayOrder) || 1,
          status: status || "Active",
        },
        user
      );

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "ম্যাপিং সফলভাবে সংরক্ষণ হয়েছে।", mapping: result.mapping });
    }

    // 3. Bulk Assign Subjects to Class/Trade
    if (action === "bulk_assign_subjects") {
      const { academicYear, classId, tradeId, subjectIds } = body;

      if (!academicYear || !classId || !Array.isArray(subjectIds) || subjectIds.length === 0) {
        return NextResponse.json({ success: false, error: "শিক্ষাবর্ষ, শ্রেণি এবং বিষয়সমূহ নির্বাচন করুন।" }, { status: 400 });
      }

      const numericClass = parseClassNumeric(classId);
      const academicClass = ACADEMIC_CLASSES.find((c) => c.numericValue === numericClass || c.id === Number(classId));
      const tradeObj = tradeId ? ALL_TRADES.find((t) => t.id === Number(tradeId)) : undefined;

      let savedCount = 0;
      const errors: string[] = [];

      for (const sId of subjectIds) {
        const subject = getSubjectMasterById(Number(sId));
        if (!subject) continue;

        const res = saveSubjectMapping(
          {
            academicYear,
            classId: academicClass?.id || Number(classId),
            className: academicClass?.name || `Class ${numericClass}`,
            numericClass,
            section: "all",
            tradeId: tradeObj?.id,
            tradeCode: tradeObj?.code,
            tradeName: tradeObj?.name,
            subjectId: subject.id,
            subjectCode: subject.code,
            subjectName: subject.name,
            subjectNameBangla: subject.nameBangla,
            subjectType: subject.subjectType,
            isOptional: false,
            weeklyPeriods: subject.subjectType === "Lab" || subject.subjectType === "Workshop" ? 6 : 4,
            theoryPeriods: subject.theoryMarks > 0 ? 3 : 0,
            practicalPeriods: subject.practicalMarks > 0 ? 3 : 0,
            labPeriods: subject.subjectType === "Lab" ? 3 : 0,
            requiredWeeklyHours: 3.5,
            fullMarks: subject.fullMarks,
            passMarks: subject.passMarks,
            theoryMarks: subject.theoryMarks,
            practicalMarks: subject.practicalMarks,
            vivaMarks: subject.vivaMarks,
            continuousMarks: subject.continuousMarks,
            displayOrder: subject.displayOrder,
            status: "Active",
          },
          user
        );

        if (res.success) {
          savedCount++;
        } else if (res.error) {
          errors.push(res.error);
        }
      }

      return NextResponse.json({
        success: savedCount > 0,
        savedCount,
        errors,
        message: `${savedCount}টি বিষয় সফলভাবে ম্যাপিং করা হয়েছে।`,
      });
    }

    // 4. Assign Teacher to Subject
    if (action === "assign_teacher") {
      const { academicYear, classId, tradeId, section, subjectId, teacherId, role, weeklyAssignedPeriods, isClassTeacher } = body;

      if (!academicYear || !classId || !subjectId || !teacherId) {
        return NextResponse.json({ success: false, error: "শিক্ষাবর্ষ, শ্রেণি, বিষয় ও শিক্ষক নির্বাচন বাধ্যতামূলক।" }, { status: 400 });
      }

      const result = assignTeacherToSubject(
        {
          academicYear,
          classId: Number(classId),
          tradeId: tradeId ? Number(tradeId) : undefined,
          section: section || "all",
          subjectId: Number(subjectId),
          teacherId: Number(teacherId),
          role: role || "Primary Teacher",
          weeklyAssignedPeriods: weeklyAssignedPeriods ? Number(weeklyAssignedPeriods) : 4,
          isClassTeacher: !!isClassTeacher,
        },
        user
      );

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "শিক্ষক সফলভাবে বিষয়ের সাথে যুক্ত হয়েছেন।", assignment: result.assignment });
    }

    // 5. Execute Copy Configuration / Year Rollover
    if (action === "copy_config") {
      const { sourceYear, targetYear, classId, tradeId, copyTeacherAssignments, overwriteConflicts } = body;

      if (!sourceYear || !targetYear || !classId) {
        return NextResponse.json({ success: false, error: "উৎস শিক্ষাবর্ষ, লক্ষ্য শিক্ষাবর্ষ এবং শ্রেণি আবশ্যক।" }, { status: 400 });
      }

      const result = executeCopyConfiguration({
        sourceYear,
        targetYear,
        classId: Number(classId),
        tradeId: tradeId ? Number(tradeId) : undefined,
        copyTeacherAssignments: !!copyTeacherAssignments,
        overwriteConflicts: !!overwriteConflicts,
        user,
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.message }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    // 6. Save Topic / Chapter
    if (action === "save_topic") {
      const { subjectId, chapterNumber, chapterName, chapterNameBangla, topicName, topicNameBangla, serialOrder, estimatedHours, learningOutcomes, status, hasQuizAvailable, hasLabJob } = body;

      if (!subjectId || !chapterNumber || !topicName) {
        return NextResponse.json({ success: false, error: "বিষয় আইডি, অধ্যায় নম্বর ও টপিক নাম আবশ্যক।" }, { status: 400 });
      }

      const result = saveSubjectTopic(
        {
          subjectId: Number(subjectId),
          chapterNumber: Number(chapterNumber),
          chapterName: chapterName || `Chapter ${chapterNumber}`,
          chapterNameBangla: chapterNameBangla || `অধ্যায় ${chapterNumber}`,
          topicName,
          topicNameBangla: topicNameBangla || topicName,
          serialOrder: Number(serialOrder) || 1,
          estimatedHours: Number(estimatedHours) || 2,
          learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
          status: status || "Active",
          hasQuizAvailable: !!hasQuizAvailable,
          hasLabJob: !!hasLabJob,
        },
        user
      );

      return NextResponse.json({ success: true, message: "টপিক সফলভাবে সংরক্ষণ হয়েছে।", topic: result.topic });
    }

    // 7. Validate Eligibility (Reusable Server-Side Guard)
    if (action === "validate_eligibility") {
      const { academicYear, classId, tradeId, subjectId, teacherId } = body;
      const valResult = validateSubjectEligibility({
        academicYear: academicYear || "2026",
        classId,
        tradeId,
        subjectId,
        teacherId,
      });

      return NextResponse.json({
        success: true,
        valid: valResult.valid,
        errors: valResult.errors,
        warnings: valResult.warnings,
      });
    }

    // 8. Import Dataset
    if (action === "import") {
      const { dataset } = body;
      const result = importAcademicSubjectsDataset(dataset, user);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: `অজানা অ্যাকশন: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ==========================================
// PUT HANDLER (Update Master / Mapping)
// ==========================================
export async function PUT(req: NextRequest) {
  const guard = requireTeacherOrAdmin(req, "/api/academic/subjects");
  if (!guard.authorized) {
    return guard.errorResponse!;
  }

  try {
    const body = await req.json();
    const { action = "update_master", id, updates } = body;
    const user = guard.identity.userName || guard.identity.userEmail || "Staff";

    if (action === "update_master") {
      if (!id) {
        return NextResponse.json({ success: false, error: "বিষয় আইডি প্রদান করুন।" }, { status: 400 });
      }

      const result = updateSubjectMaster(Number(id), updates || body, user);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "বিষয় তথ্য সফলভাবে হালনাগাদ করা হয়েছে।", subject: result.subject });
    }

    return NextResponse.json({ success: false, error: `অজানা অ্যাকশন: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ==========================================
// DELETE HANDLER (Archive Master / Remove Mapping / Remove Teacher)
// ==========================================
export async function DELETE(req: NextRequest) {
  const guard = requireAdmin(req, "/api/academic/subjects");
  if (!guard.authorized) {
    return guard.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "delete_master";
    const id = searchParams.get("id");
    const user = guard.identity.userName || guard.identity.userEmail || "Admin";

    if (!id) {
      return NextResponse.json({ success: false, error: "আইডি প্যারামিটার আবশ্যক।" }, { status: 400 });
    }

    // 1. Delete / Archive Subject Master
    if (action === "delete_master") {
      const result = deleteSubjectMaster(Number(id), user);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.message }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    // 2. Remove Subject Mapping
    if (action === "remove_mapping") {
      const result = removeSubjectMapping(id, user);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.message }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    // 3. Remove Teacher Assignment
    if (action === "remove_teacher") {
      const result = removeTeacherAssignment(id, user);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.message }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: `অজানা অ্যাকশন: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
