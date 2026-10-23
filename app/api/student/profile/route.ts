import { NextRequest, NextResponse } from "next/server";
import { requireStudentAuth, createApiErrorResponse } from "@/lib/serverAuthGuard";
import { institutionalDb, Student } from "@/lib/database";
import { safePrismaQuery, isPrismaAvailable } from "@/lib/prisma";
import { getRegisteredStudents, saveRegisteredStudents } from "@/lib/studentIntelligenceStore";

// Disallowed fields that students are NEVER permitted to modify
const FORBIDDEN_STUDENT_MUTATION_FIELDS = new Set([
  "roll",
  "studentId",
  "admissionNo",
  "gpa",
  "marks",
  "grade",
  "resultStatus",
  "attendanceRate",
  "status",
  "classId",
  "className",
  "tradeId",
  "tradeName",
  "session",
  "section",
  "shift",
  "shiftBangla",
  "role",
  "userRole",
  "permissions",
  "isAdmitted",
]);

function getAuthenticatedStudentRoll(req: NextRequest, identityUserId: string | number): string {
  const cookieRoll = req.cookies.get("ptsc_student_roll")?.value;
  const headerRoll = req.headers.get("x-student-roll");
  const rawId = String(identityUserId || "").trim();
  if (cookieRoll && cookieRoll.trim()) return cookieRoll.trim();
  if (headerRoll && headerRoll.trim()) return headerRoll.trim();
  if (rawId && rawId !== "4" && rawId !== "student") return rawId;
  return "101"; // Fallback to demo student roll 101
}

export async function GET(request: NextRequest) {
  // 1. Strict student-only authentication check
  const guard = requireStudentAuth(request, "/api/student/profile");
  if (!guard.authorized) {
    return guard.errorResponse!;
  }

  try {
    const studentRoll = getAuthenticatedStudentRoll(request, guard.identity.userId);

    // 2. Query Prisma or institutionalDb fallback
    let dbRecord = await safePrismaQuery(async (p) => {
      const numericRoll = parseInt(studentRoll, 10);
      return await p.student.findFirst({
        where: {
          OR: [
            { roll: isNaN(numericRoll) ? -1 : numericRoll },
            { studentId: studentRoll },
          ],
        },
        include: {
          class: true,
          trade: true,
        },
      });
    }, null);

    // If not in Prisma, check institutionalDb in-memory store
    if (!dbRecord) {
      const match = institutionalDb.students.find(
        (s) => String(s.roll) === studentRoll || s.studentId === studentRoll
      );
      if (match) {
        dbRecord = match as any;
      }
    }

    // 3. Fallback to registered students in intelligence store or default profile
    const registered = getRegisteredStudents().find((s) => s.rollNumber === studentRoll);

    const studentProfile = {
      id: dbRecord?.id || 101,
      studentId: dbRecord?.studentId || `PTSC-2026-VOC-${studentRoll.padStart(4, "0")}`,
      admissionNo: dbRecord?.admissionNo || `ADM-2026-${studentRoll.padStart(4, "0")}`,
      roll: dbRecord?.roll || parseInt(studentRoll, 10) || 101,
      name: dbRecord?.name || registered?.studentName || guard.identity.userName || "Kazi Tanvir Hasan",
      nameBangla: dbRecord?.nameBangla || registered?.studentName || "কাজী তানভীর হাসান",
      gender: dbRecord?.gender || "Male",
      dob: dbRecord?.dob || "2009-04-12",
      dobBangla: dbRecord?.dobBangla || "১২ এপ্রিল ২০০৯",
      bloodGroup: dbRecord?.bloodGroup || "B+",
      birthRegNo: dbRecord?.birthRegNo || "20091234567890123",
      fatherName: dbRecord?.fatherName || "মোঃ রফিকুল ইসলাম",
      motherName: dbRecord?.motherName || "মোসাম্মাৎ তাহমিনা বেগম",
      guardianMobile: dbRecord?.guardianMobile || "01711-000005",
      studentMobile: dbRecord?.studentMobile || "01711-000004",
      email: dbRecord?.email || guard.identity.userEmail || "student@pgtsc.gov.bd",
      presentAddress: dbRecord?.presentAddress || "পূর্ব জালাসী, পঞ্চগড় সদর, পঞ্চগড়",
      permanentAddress: dbRecord?.permanentAddress || "পূর্ব জালাসী, পঞ্চগড় সদর, পঞ্চগড়",
      photoUrl:
        dbRecord?.photoUrl ||
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80",
      className: dbRecord?.class?.nameBangla || dbRecord?.className || registered?.classLevel || "নবম শ্রেণি (ভোকেশনাল)",
      tradeName: dbRecord?.trade?.nameBangla || dbRecord?.tradeNameBangla || registered?.trade || "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
      shiftBangla: dbRecord?.shiftBangla || "১ম শিফট",
      section: dbRecord?.section || "A",
      session: dbRecord?.session || "2026",
      status: dbRecord?.status || "Active",
      attendanceRate: dbRecord?.attendanceRate ?? 92.5,
      gpa: dbRecord?.gpa || "4.85",
      resultStatus: dbRecord?.resultStatus || "PASSED",
      emergencyContact: dbRecord?.emergencyContact || "01711-000005",
      nationality: dbRecord?.nationality || "বাংলাদেশি",
    };

    return NextResponse.json({
      success: true,
      student: studentProfile,
      allowedEditableFields: [
        "name",
        "nameBangla",
        "studentMobile",
        "guardianMobile",
        "presentAddress",
        "permanentAddress",
        "bloodGroup",
        "emergencyContact",
        "photoUrl",
      ],
    });
  } catch (error) {
    return createApiErrorResponse(error, "শিক্ষার্থী প্রোফাইল ডেটা লোড করতে ব্যর্থ হয়েছে।", 500);
  }
}

export async function PUT(request: NextRequest) {
  // 1. Strict student-only authentication check
  const guard = requireStudentAuth(request, "/api/student/profile");
  if (!guard.authorized) {
    return guard.errorResponse!;
  }

  try {
    const body = await request.json();

    // 2. Reject any attempt to modify administrative / academic records
    const attemptedForbiddenFields = Object.keys(body).filter((key) =>
      FORBIDDEN_STUDENT_MUTATION_FIELDS.has(key)
    );

    if (attemptedForbiddenFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          code: "ILLEGAL_FIELD_MUTATION",
          error: `অননুমোদিত ফিল্ড পরিবর্তনের চেষ্টা প্রতিহত: শিক্ষার্থীরা [${attemptedForbiddenFields.join(
            ", "
          )}] পরিবর্তন করতে পারবে না। ফলাফল, শ্রেণি, ট্রেড বা রোল নম্বর পরিবর্তন কেবল অনুমোদিত শিক্ষক ও অ্যাডমিনদের দ্বারা সম্ভব।`,
        },
        { status: 400 }
      );
    }

    const studentRoll = getAuthenticatedStudentRoll(request, guard.identity.userId);

    // 3. Extract and sanitize allowed fields
    const updates: Partial<Student> = {};
    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.nameBangla === "string" && body.nameBangla.trim()) updates.nameBangla = body.nameBangla.trim();
    if (typeof body.studentMobile === "string") updates.studentMobile = body.studentMobile.trim();
    if (typeof body.guardianMobile === "string") updates.guardianMobile = body.guardianMobile.trim();
    if (typeof body.presentAddress === "string") updates.presentAddress = body.presentAddress.trim();
    if (typeof body.permanentAddress === "string") updates.permanentAddress = body.permanentAddress.trim();
    if (typeof body.bloodGroup === "string") updates.bloodGroup = body.bloodGroup.trim();
    if (typeof body.emergencyContact === "string") updates.emergencyContact = body.emergencyContact.trim();
    if (typeof body.photoUrl === "string" && body.photoUrl.trim()) updates.photoUrl = body.photoUrl.trim();

    // 4. Update in-memory institutionalDb
    let updatedStudent: any = null;
    const dbIndex = institutionalDb.students.findIndex(
      (s) => String(s.roll) === studentRoll || s.studentId === studentRoll
    );

    if (dbIndex !== -1) {
      institutionalDb.students[dbIndex] = {
        ...institutionalDb.students[dbIndex],
        ...updates,
      };
      updatedStudent = institutionalDb.students[dbIndex];
    } else {
      // Create new student entry in institutionalDb if not yet seeded
      const newEntry: Student = {
        id: parseInt(studentRoll, 10) || 101,
        studentId: `PTSC-2026-VOC-${studentRoll.padStart(4, "0")}`,
        admissionNo: `ADM-2026-${studentRoll.padStart(4, "0")}`,
        roll: parseInt(studentRoll, 10) || 101,
        name: updates.name || guard.identity.userName || "Kazi Tanvir Hasan",
        nameBangla: updates.nameBangla || "কাজী তানভীর হাসান",
        gender: "Male",
        dob: "2009-04-12",
        dobBangla: "১২ এপ্রিল ২০০৯",
        bloodGroup: updates.bloodGroup || "B+",
        birthRegNo: "20091234567890123",
        fatherName: "মোঃ রফিকুল ইসলাম",
        motherName: "মোসাম্মাৎ তাহমিনা বেগম",
        guardianMobile: updates.guardianMobile || "01711-000005",
        studentMobile: updates.studentMobile || "01711-000004",
        email: guard.identity.userEmail || "student@pgtsc.gov.bd",
        presentAddress: updates.presentAddress || "পূর্ব জালাসী, পঞ্চগড় সদর",
        permanentAddress: updates.permanentAddress || "পূর্ব জালাসী, পঞ্চগড় সদর",
        photoUrl:
          updates.photoUrl ||
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80",
        classId: 4,
        className: "নবম শ্রেণি (ভোকেশনাল)",
        tradeId: 2,
        tradeName: "IT Support and IoT Basics",
        tradeNameBangla: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
        shift: "First Shift",
        shiftBangla: "১ম শিফট",
        section: "A",
        session: "2026",
        status: "Active",
        attendanceRate: 92.5,
        gpa: "4.85",
        resultStatus: "Passed",
        emergencyContact: updates.emergencyContact || "01711-000005",
        nationality: "বাংলাদেশি",
      };
      institutionalDb.students.push(newEntry);
      updatedStudent = newEntry;
    }

    // 5. Update registered student list in studentIntelligenceStore
    const registered = getRegisteredStudents();
    const regIdx = registered.findIndex((s) => s.rollNumber === studentRoll);
    if (regIdx !== -1) {
      registered[regIdx] = {
        ...registered[regIdx],
        studentName: updates.nameBangla || updates.name || registered[regIdx].studentName,
      };
      saveRegisteredStudents(registered);
    }

    // 6. Update Prisma if database is available
    if (isPrismaAvailable()) {
      await safePrismaQuery(async (p) => {
        const numRoll = parseInt(studentRoll, 10);
        return await p.student.updateMany({
          where: {
            OR: [{ roll: isNaN(numRoll) ? -1 : numRoll }, { studentId: studentRoll }],
          },
          data: {
            ...(updates.name && { name: updates.name }),
            ...(updates.nameBangla && { nameBangla: updates.nameBangla }),
            ...(updates.studentMobile && { studentMobile: updates.studentMobile }),
            ...(updates.guardianMobile && { guardianMobile: updates.guardianMobile }),
            ...(updates.presentAddress && { presentAddress: updates.presentAddress }),
            ...(updates.permanentAddress && { permanentAddress: updates.permanentAddress }),
            ...(updates.bloodGroup && { bloodGroup: updates.bloodGroup }),
            ...(updates.emergencyContact && { emergencyContact: updates.emergencyContact }),
            ...(updates.photoUrl && { photoUrl: updates.photoUrl }),
          },
        });
      }, null);
    }

    return NextResponse.json({
      success: true,
      message: "আপনার প্রোফাইল তথ্য সফলভাবে সংরক্ষণ ও আপডেট করা হয়েছে।",
      student: updatedStudent,
    });
  } catch (error) {
    return createApiErrorResponse(error, "প্রোফাইল তথ্য আপডেট করতে সমস্যা হয়েছে।", 500);
  }
}
