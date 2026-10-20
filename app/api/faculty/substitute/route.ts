import { NextRequest, NextResponse } from "next/server";
import {
  institutionalDb,
  SubstituteDutyRecord,
  WeekDay,
  RoutineItem,
} from "@/lib/database";
import {
  findSubstituteTeachers,
  evaluateTeacherAvailability,
  WEEK_DAYS,
} from "@/lib/routineEngine";

const DAY_NAMES: WeekDay[] = [
  "Sunday", // 0
  "Monday", // 1
  "Tuesday", // 2
  "Wednesday", // 3
  "Thursday", // 4
  "Friday", // 5
  "Saturday", // 6
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const teacherId = searchParams.get("teacherId");
    const status = searchParams.get("status");
    const action = searchParams.get("action");

    // 1. CANDIDATE LOOKUP ACTION: Find free teachers for an affected routine slot
    if (action === "find_candidates") {
      const routineId = searchParams.get("routineId");
      const targetDate = date || new Date().toISOString().split("T")[0];
      const periodNo = searchParams.get("periodNo");
      const classId = searchParams.get("classId");
      const tradeCode = searchParams.get("tradeCode") || undefined;
      const subjectCode = searchParams.get("subjectCode") || "";
      const originalTeacherId = searchParams.get("originalTeacherId");

      let targetRoutine: RoutineItem | undefined;

      if (routineId) {
        targetRoutine = institutionalDb.routines.find((r) => r.id === Number(routineId));
      }

      if (!targetRoutine) {
        // Derive target routine info from day of week and period
        const dateObj = new Date(targetDate);
        const dayName = DAY_NAMES[dateObj.getDay()] || "Wednesday";

        targetRoutine = institutionalDb.routines.find(
          (r) =>
            r.day === dayName &&
            r.periodNo === Number(periodNo || 1) &&
            (classId ? r.classId === Number(classId) : true)
        ) || {
          id: Date.now(),
          academicYear: "2026",
          classId: Number(classId || 5),
          className: "Class 10 (SSC Vocational)",
          tradeCode: tradeCode || "EE",
          tradeName: "General Electrical Works",
          section: "A",
          day: dayName,
          periodNo: Number(periodNo || 1),
          periodType: "regular",
          startTime: "09:00 AM",
          endTime: "09:45 AM",
          durationMinutes: 45,
          subjectCode: subjectCode || "EE-1001",
          subjectName: "Electrical Circuits",
          subjectNameBangla: "ইলেকট্রিক্যাল সার্কিট",
          teacherId: Number(originalTeacherId || 3),
          teacherName: "Assigned Teacher",
          roomNo: "Room-204",
          isLab: false,
        };
      }

      const candidates = findSubstituteTeachers(
        targetRoutine as any,
        institutionalDb.routines as any
      );

      return NextResponse.json({
        success: true,
        date: targetDate,
        targetRoutine,
        candidates,
        totalCandidates: candidates.length,
      });
    }

    // 2. QUERY AFFECTED CLASSES FOR AN ABSENT TEACHER ON A GIVEN DATE
    if (action === "affected_classes") {
      const targetDate = date || new Date().toISOString().split("T")[0];
      const targetTeacherId = Number(teacherId);

      const teacher = institutionalDb.faculty.find((f) => f.id === targetTeacherId);
      if (!teacher) {
        return NextResponse.json({ success: false, error: "শিক্ষক খুঁজে পাওয়া যায়নি।" }, { status: 404 });
      }

      const dateObj = new Date(targetDate);
      const dayName = DAY_NAMES[dateObj.getDay()];

      // Find all routines taught by this teacher on this day
      const affectedRoutines = institutionalDb.routines.filter(
        (r) =>
          r.day === dayName &&
          (r.teacherId === targetTeacherId ||
            (r.teacherName && r.teacherName.toLowerCase() === teacher.name.toLowerCase()))
      );

      // Check which ones already have a substitute assigned
      const assignments = institutionalDb.substituteDuties.filter(
        (s) => s.date === targetDate && s.originalTeacherId === targetTeacherId
      );

      const routinesWithSubStatus = affectedRoutines.map((routine) => {
        const assignedSub = assignments.find((a) => a.periodNo === routine.periodNo);
        return {
          ...routine,
          hasSubstitute: !!assignedSub,
          substituteAssignment: assignedSub,
        };
      });

      return NextResponse.json({
        success: true,
        date: targetDate,
        day: dayName,
        teacher,
        affectedClasses: routinesWithSubStatus,
        totalAffected: affectedRoutines.length,
        coveredCount: assignments.length,
      });
    }

    // 3. STANDARD LIST OF SUBSTITUTE DUTIES
    let list = [...institutionalDb.substituteDuties];

    if (date) {
      list = list.filter((s) => s.date === date);
    }

    if (teacherId) {
      const tId = Number(teacherId);
      list = list.filter((s) => s.originalTeacherId === tId || s.substituteTeacherId === tId);
    }

    if (status && status !== "all") {
      list = list.filter((s) => s.status === status);
    }

    return NextResponse.json({
      success: true,
      duties: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      total: list.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      date,
      periodNo,
      classId,
      className,
      section = "A",
      tradeCode,
      subjectCode,
      subjectName,
      originalTeacherId,
      substituteTeacherId,
      reason,
      authorizedBy = "অধ্যক্ষ",
      userRole = "admin",
    } = body;

    const isAdmin = ["admin", "principal", "superadmin", "super_admin", "head_master"].includes(
      String(userRole).toLowerCase()
    );

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "বিকল্প শিক্ষক বরাদ্দ করার অনুমতি শুধুমাত্র অধ্যক্ষ ও প্রশাসন শাখার রয়েছে।" },
        { status: 403 }
      );
    }

    if (!date || !periodNo || !classId || !originalTeacherId || !substituteTeacherId) {
      return NextResponse.json(
        { success: false, error: "তারিখ, পিরিয়ড, শ্রেণি, মূল শিক্ষক এবং বিকল্প শিক্ষক আবশ্যক।" },
        { status: 400 }
      );
    }

    if (Number(originalTeacherId) === Number(substituteTeacherId)) {
      return NextResponse.json(
        { success: false, error: "মূল শিক্ষক ও বিকল্প শিক্ষক একই ব্যক্তি হতে পারেন না।" },
        { status: 400 }
      );
    }

    const origTeacher = institutionalDb.faculty.find((f) => f.id === Number(originalTeacherId));
    const subTeacher = institutionalDb.faculty.find((f) => f.id === Number(substituteTeacherId));

    if (!origTeacher || !subTeacher) {
      return NextResponse.json({ success: false, error: "শিক্ষক ডাটাবেসে পাওয়া যায়নি।" }, { status: 404 });
    }

    // Check conflict: Is the substitute teacher already assigned to another class during this period?
    const dateObj = new Date(date);
    const dayName = DAY_NAMES[dateObj.getDay()] || "Wednesday";

    const conflictingRoutine = institutionalDb.routines.find(
      (r) =>
        r.day === dayName &&
        r.periodNo === Number(periodNo) &&
        (r.teacherId === subTeacher.id ||
          (r.teacherName && r.teacherName.toLowerCase() === subTeacher.name.toLowerCase()))
    );

    if (conflictingRoutine) {
      return NextResponse.json(
        {
          success: false,
          error: `বিকল্প শিক্ষক ${subTeacher.nameBangla || subTeacher.name} এই পিরিয়ডে ইতিমধ্যে ${conflictingRoutine.className}-এ ক্লাস নিচ্ছেন। অন্য মুক্ত শিক্ষক নির্বাচন করুন।`,
        },
        { status: 400 }
      );
    }

    // Check duplicate substitute record for this date and period
    const existingDuty = institutionalDb.substituteDuties.find(
      (s) =>
        s.date === date &&
        s.periodNo === Number(periodNo) &&
        s.classId === Number(classId) &&
        s.status === "assigned"
    );

    if (existingDuty) {
      // Overwrite/update duty
      existingDuty.substituteTeacherId = subTeacher.id;
      existingDuty.substituteTeacherName = subTeacher.nameBangla || subTeacher.name;
      existingDuty.reason = reason || existingDuty.reason;
      existingDuty.authorizedBy = authorizedBy;

      return NextResponse.json({
        success: true,
        message: "বিকল্প শিক্ষকের দায়িত্ব সফলভাবে হালনাগাদ করা হয়েছে।",
        duty: existingDuty,
      });
    }

    const newDuty: SubstituteDutyRecord = {
      id: `SUB-${new Date().getFullYear()}-${String(institutionalDb.substituteDuties.length + 1).padStart(3, "0")}`,
      date,
      day: dayName,
      periodNo: Number(periodNo),
      classId: Number(classId),
      className: className || `Class ${classId}`,
      section: section || "A",
      tradeCode: tradeCode || undefined,
      subjectCode: subjectCode || "GEN-01",
      subjectName: subjectName || "General Subject",
      originalTeacherId: origTeacher.id,
      originalTeacherName: origTeacher.nameBangla || origTeacher.name,
      substituteTeacherId: subTeacher.id,
      substituteTeacherName: subTeacher.nameBangla || subTeacher.name,
      reason: reason || "অনুপস্থিতির কারণে বিকল্প শিক্ষক বরাদ্দ",
      authorizedBy,
      status: "assigned",
      createdAt: new Date().toISOString(),
    };

    institutionalDb.substituteDuties.unshift(newDuty);

    return NextResponse.json({
      success: true,
      message: `বিকল্প শিক্ষক হিসেবে ${subTeacher.nameBangla || subTeacher.name} কে সফলভাবে বরাদ্দ করা হয়েছে।`,
      duty: newDuty,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, remarks, authorizedBy } = body;

    const idx = institutionalDb.substituteDuties.findIndex((s) => s.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "বিকল্প দায়িত্ব রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
    }

    institutionalDb.substituteDuties[idx] = {
      ...institutionalDb.substituteDuties[idx],
      status: status || institutionalDb.substituteDuties[idx].status,
      reason: remarks ? `${institutionalDb.substituteDuties[idx].reason} (${remarks})` : institutionalDb.substituteDuties[idx].reason,
      authorizedBy: authorizedBy || institutionalDb.substituteDuties[idx].authorizedBy,
    };

    return NextResponse.json({
      success: true,
      message: `বিকল্প দায়িত্ব স্থিতি '${status}' এ পরিবর্তন করা হয়েছে।`,
      duty: institutionalDb.substituteDuties[idx],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "আইডি আবশ্যক।" }, { status: 400 });

    const idx = institutionalDb.substituteDuties.findIndex((s) => s.id === id);
    if (idx === -1) return NextResponse.json({ success: false, error: "রেকর্ড পাওয়া যায়নি।" }, { status: 404 });

    institutionalDb.substituteDuties.splice(idx, 1);

    return NextResponse.json({
      success: true,
      message: "বিকল্প দায়িত্ব বরাদ্দ সফলভাবে বাতিল করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
