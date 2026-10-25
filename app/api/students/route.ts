import { NextResponse } from "next/server";
import { institutionalDb, Student } from "@/lib/database";
import { formatAdmissionNo, generateUniqueStudentId } from "@/lib/utils";
import {
  doesClassHaveTrade,
  isTradeValidForClass,
  parseClassNumeric,
  doesStudentMatchTrade,
} from "@/lib/academicStructure";
import { prisma, isPrismaAvailable } from "@/lib/prisma";
import { extractRequestIdentity, requireAdmin } from "@/lib/serverAuthGuard";
import { isAuthorizedStaff } from "@/lib/rbac";

// Redact sensitive personal identifiable information for public or unprivileged callers
function sanitizeStudentRecord(s: Student, allowFullAccess: boolean): Student {
  if (allowFullAccess) return s;
  return {
    ...s,
    birthRegNo: "",
    fatherName: "",
    motherName: "",
    guardianMobile: "",
    studentMobile: "",
    email: "",
    presentAddress: "",
    permanentAddress: "",
    emergencyContact: "",
    guardianName: "",
  };
}

// Helper to format Prisma Student record to standard frontend shape
function mapPrismaStudentToClient(s: any): Student {
  const shiftText = s.shift === "SECOND_SHIFT" ? "Second Shift" : "First Shift";
  const shiftBanglaText = s.shift === "SECOND_SHIFT" ? "২য় শিফট" : "১ম শিফট";
  const statusText =
    s.status === "ACTIVE"
      ? "Active"
      : s.status === "INACTIVE"
      ? "Inactive"
      : s.status === "ARCHIVED"
      ? "Archived"
      : s.status === "TRANSFERRED"
      ? "Transferred"
      : s.status === "DROPPED"
      ? "Dropped"
      : s.status || "Active";

  return {
    id: s.id,
    studentId: s.studentId,
    admissionNo: s.admissionNo,
    roll: s.roll,
    name: s.name,
    nameBangla: s.nameBangla || s.name,
    gender: s.gender || "Male",
    dob: s.dob,
    dobBangla: s.dobBangla || undefined,
    bloodGroup: s.bloodGroup || "B+",
    birthRegNo: s.birthRegNo || "",
    fatherName: s.fatherName || "",
    motherName: s.motherName || "",
    guardianMobile: s.guardianMobile || "",
    studentMobile: s.studentMobile || "",
    email: s.email || "",
    presentAddress: s.presentAddress || "",
    permanentAddress: s.permanentAddress || "",
    classId: s.classId,
    className: s.class?.name || `Class ${s.classId}`,
    tradeId: s.tradeId || undefined,
    tradeName: s.trade?.name || undefined,
    tradeNameBangla: s.trade?.nameBangla || undefined,
    shift: shiftText as "First Shift" | "Second Shift",
    shiftBangla: shiftBanglaText,
    section: s.section || "A",
    session: s.session || "2026",
    status: statusText as any,
    photoUrl:
      s.photoUrl ||
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
    attendanceRate: s.attendanceRate ?? 100.0,
    gpa: s.gpa || "0.00",
    resultStatus: (s.resultStatus === "FAILED" ? "Failed" : "Passed") as "Passed" | "Failed",
    nationality: s.nationality || "Bangladeshi",
    guardianName: s.guardianName || s.fatherName || "",
    guardianRelationship: s.guardianRelationship || "Father",
    emergencyContact: s.emergencyContact || s.guardianMobile || "",
    admissionDate: s.admissionDate || "",
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const classIdParam = searchParams.get("classId");
    const rawTradeId = searchParams.get("tradeId");
    const shift = searchParams.get("shift");
    const status = searchParams.get("status") || "Active";
    const studentIdParam = searchParams.get("studentId");

    const identity = extractRequestIdentity(req);
    const isPrivileged = identity.isAuthenticated && isAuthorizedStaff(identity.userRole);

    // 1. HYBRID EXECUTION: Check if Prisma / MySQL is active
    if (isPrismaAvailable() && prisma) {
      try {
        if (studentIdParam) {
          const studentRecord = await prisma.student.findFirst({
            where: {
              OR: [
                { studentId: studentIdParam },
                ...(Number.isNaN(Number(studentIdParam)) ? [] : [{ id: Number(studentIdParam) }]),
              ],
            },
            include: {
              class: true,
              trade: true,
            },
          });

          if (studentRecord) {
            const clientShape = mapPrismaStudentToClient(studentRecord);
            const isSelf =
              identity.isAuthenticated &&
              (String(identity.userId) === String(clientShape.id) ||
                String(identity.userId) === String(clientShape.roll) ||
                identity.userEmail?.toLowerCase() === clientShape.email.toLowerCase());

            return NextResponse.json({
              success: true,
              student: sanitizeStudentRecord(clientShape, isPrivileged || isSelf),
              source: "mysql",
            });
          }
          return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
        }

        const whereClause: any = {};

        if (status !== "all") {
          const upperStatus = status.toUpperCase();
          if (["ACTIVE", "INACTIVE", "ARCHIVED", "TRANSFERRED", "DROPPED"].includes(upperStatus)) {
            whereClause.status = upperStatus;
          }
        }

        const classId = classIdParam && classIdParam !== "all" ? Number(classIdParam) : null;
        if (classId) {
          whereClause.classId = classId;
        }

        const tradeApplicable = classId ? doesClassHaveTrade(classId) : true;
        if (tradeApplicable && rawTradeId && rawTradeId !== "all" && rawTradeId !== "0") {
          const numericTradeId = Number(rawTradeId);
          if (!Number.isNaN(numericTradeId)) {
            whereClause.tradeId = numericTradeId;
          }
        }

        if (shift && shift !== "all") {
          whereClause.shift = shift === "Second Shift" ? "SECOND_SHIFT" : "FIRST_SHIFT";
        }

        if (search) {
          whereClause.OR = [
            { name: { contains: search } },
            { nameBangla: { contains: search } },
            { studentId: { contains: search } },
            { admissionNo: { contains: search } },
            { fatherName: { contains: search } },
            { guardianMobile: { contains: search } },
          ];
        }

        const prismaStudents = await prisma.student.findMany({
          where: whereClause,
          include: {
            class: true,
            trade: true,
          },
          orderBy: [{ classId: "asc" }, { roll: "asc" }],
        });

        const formatted = prismaStudents
          .map(mapPrismaStudentToClient)
          .map((s: Student) => sanitizeStudentRecord(s, isPrivileged));

        return NextResponse.json({
          success: true,
          students: formatted,
          items: formatted,
          source: "mysql",
        });
      } catch (dbError) {
        console.warn(
          "[Hybrid API] MySQL query failed, automatically falling back to institutionalDb in-memory store:",
          (dbError as Error).message
        );
        // Fall through to in-memory store
      }
    }

    // 2. IN-MEMORY FALLBACK (AI Studio Preview Safe)
    let list = [...institutionalDb.students];

    if (studentIdParam) {
      const found = list.find((s) => s.id === Number(studentIdParam) || s.studentId === studentIdParam);
      if (found) {
        const isSelf =
          identity.isAuthenticated &&
          (String(identity.userId) === String(found.id) ||
            String(identity.userId) === String(found.roll) ||
            identity.userEmail?.toLowerCase() === found.email?.toLowerCase());

        return NextResponse.json({
          success: true,
          student: sanitizeStudentRecord(found, isPrivileged || isSelf),
          source: "in-memory",
        });
      }
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    if (status !== "all") {
      list = list.filter((s) => s.status.toLowerCase() === status.toLowerCase());
    }

    const classId = classIdParam && classIdParam !== "all" ? Number(classIdParam) : null;
    if (classId) {
      list = list.filter((s) => s.classId === classId);
    }

    // Strict Academic Rule: Class 6, 7, 8 = GENERAL, NO TRADE
    const tradeApplicable = classId ? doesClassHaveTrade(classId) : true;
    if (tradeApplicable && rawTradeId && rawTradeId !== "all" && rawTradeId !== "0") {
      list = list.filter((s) => doesStudentMatchTrade(s.tradeId, s.tradeName, rawTradeId));
    }

    if (shift && shift !== "all") {
      list = list.filter((s) => s.shift === shift);
    }

    if (search) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          (s.nameBangla && s.nameBangla.includes(search)) ||
          s.studentId.toLowerCase().includes(search) ||
          s.admissionNo.toLowerCase().includes(search) ||
          String(s.roll) === search ||
          (s.guardianMobile && s.guardianMobile.includes(search)) ||
          (s.fatherName && s.fatherName.toLowerCase().includes(search))
      );
    }

    const sanitizedList = list.map((s) => sanitizeStudentRecord(s, isPrivileged));

    return NextResponse.json({
      success: true,
      students: sanitizedList,
      items: sanitizedList,
      source: "in-memory",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireAdmin(req, "/api/students (POST)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const currentYear = new Date().getFullYear();
    const classId = Number(body.classId) || 4;
    const session = body.session || String(currentYear);

    const matchedClass = institutionalDb.classes.find((c) => c.id === classId) || institutionalDb.classes[3];
    const clsNum = parseClassNumeric(classId);

    // 1. Strict Academic Validation (Class 6-8: No trade allowed; Class 9-12: Trade mandatory)
    const hasTrades = doesClassHaveTrade(clsNum);
    let tradeId: number | undefined = undefined;
    let tradeName: string | undefined = undefined;
    let tradeNameBangla: string | undefined = undefined;

    if (hasTrades) {
      if (!body.tradeId) {
        return NextResponse.json(
          { success: false, error: "কারিগরি নবম-দ্বাদশ শ্রেণিতে ট্রেড নির্বাচন করা আবশ্যক।" },
          { status: 400 }
        );
      }
      const tId = Number(body.tradeId);
      if (!isTradeValidForClass(clsNum, tId)) {
        return NextResponse.json(
          { success: false, error: "নির্বাচিত কারিগরি ট্রেডটি এই শ্রেণির জন্য প্রযোজ্য নয়।" },
          { status: 400 }
        );
      }
      const matchedTrade = institutionalDb.trades.find((t) => t.id === tId);
      if (matchedTrade) {
        tradeId = matchedTrade.id;
        tradeName = matchedTrade.name;
        tradeNameBangla = matchedTrade.nameBangla;
      }
    }

    // 2. Central Duplication Checks
    // A. Unique Student ID
    if (body.studentId) {
      const duplicateId = institutionalDb.students.some(
        (s) => s.studentId.toUpperCase() === body.studentId.toUpperCase()
      );
      if (duplicateId) {
        return NextResponse.json(
          { success: false, error: `স্টুডেন্ট আইডি (${body.studentId}) ইতিপূর্বে অন্য শিক্ষার্থীকে বরাদ্দ করা হয়েছে।` },
          { status: 400 }
        );
      }
    }

    // B. Unique Admission Number
    if (body.admissionNo) {
      const duplicateAdmission = institutionalDb.students.some(
        (s) => s.admissionNo.toUpperCase() === body.admissionNo.toUpperCase()
      );
      if (duplicateAdmission) {
        return NextResponse.json(
          { success: false, error: `ভর্তি নম্বর (${body.admissionNo}) ইতিপূর্বে ডাটাবেসে ব্যবহার করা হয়েছে।` },
          { status: 400 }
        );
      }
    }

    // C. Class + Session + Section + Roll unique check
    const rollNo = Number(body.roll);
    if (rollNo) {
      const duplicateRoll = institutionalDb.students.some(
        (s) =>
          s.classId === classId &&
          s.session === session &&
          s.section === (body.section || "A") &&
          Number(s.roll) === rollNo
      );
      if (duplicateRoll) {
        return NextResponse.json(
          { success: false, error: `এই শ্রেণি, শাখা ও সেশনে রোল নম্বর ${rollNo} ইতিমধ্যেই অন্য শিক্ষার্থীকে দেওয়া হয়েছে।` },
          { status: 400 }
        );
      }
    }

    // D. Fuzzy duplicate detection (warn first unless bypassed with force flag)
    if (body.name && body.dob && !body.force) {
      const fuzzyDuplicate = institutionalDb.students.some(
        (s) =>
          s.name.trim().toLowerCase() === body.name.trim().toLowerCase() &&
          s.dob === body.dob
      );
      if (fuzzyDuplicate) {
        return NextResponse.json(
          {
            success: false,
            isWarning: true,
            error: `সতর্কতা: একই নাম (${body.name}) ও জন্ম তারিখ (${body.dob}) বিশিষ্ট একজন শিক্ষার্থী ইতিমধ্যেই ডাটাবেসে রয়েছে।`,
          },
          { status: 400 }
        );
      }
    }

    // Guaranteed Unique Student ID Generation if not provided
    const existingIds = institutionalDb.students.map((s) => s.studentId);
    const uniqueStudentId = body.studentId || generateUniqueStudentId(session, classId, existingIds);

    const nextSerial = institutionalDb.students.length + 1;
    const admissionNo = body.admissionNo || formatAdmissionNo("ADM", currentYear, nextSerial);

    const newStudent: Student = {
      id: Date.now(),
      studentId: uniqueStudentId,
      admissionNo,
      roll: rollNo || nextSerial,
      name: body.name,
      nameBangla: body.nameBangla || body.name,
      gender: body.gender || "Male",
      dob: body.dob || "2009-01-01",
      bloodGroup: body.bloodGroup || "B+",
      birthRegNo: body.birthRegNo || "",
      fatherName: body.fatherName || "",
      motherName: body.motherName || "",
      guardianMobile: body.guardianMobile || "01700-000000",
      studentMobile: body.studentMobile || "",
      email: body.email || "",
      presentAddress: body.presentAddress || "Panchagarh Sadar, Panchagarh",
      permanentAddress: body.permanentAddress || "Panchagarh Sadar, Panchagarh",
      classId: matchedClass.id,
      className: matchedClass.name,
      tradeId,
      tradeName,
      tradeNameBangla,
      shift: body.shift || "First Shift",
      shiftBangla: body.shift === "Second Shift" ? "২য় শিফট" : "১ম শিফট",
      section: body.section || "A",
      session,
      status: body.status || "Active",
      photoUrl:
        body.photoUrl ||
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
      attendanceRate: 100.0,
      gpa: "0.00",
      resultStatus: "Passed",
      nationality: body.nationality || "Bangladeshi",
      guardianName: body.guardianName || body.fatherName || "",
      guardianRelationship: body.guardianRelationship || "Father",
      emergencyContact: body.emergencyContact || body.guardianMobile || "",
      admissionDate: body.admissionDate || new Date().toISOString().split("T")[0],
    };

    // 3. HYBRID WRITE: Persist to MySQL if Prisma is available
    if (isPrismaAvailable() && prisma) {
      try {
        const createdInDb = await prisma.student.create({
          data: {
            studentId: newStudent.studentId,
            admissionNo: newStudent.admissionNo,
            roll: newStudent.roll,
            name: newStudent.name,
            nameBangla: newStudent.nameBangla,
            gender: newStudent.gender,
            dob: newStudent.dob,
            bloodGroup: newStudent.bloodGroup,
            birthRegNo: newStudent.birthRegNo,
            fatherName: newStudent.fatherName,
            motherName: newStudent.motherName,
            guardianMobile: newStudent.guardianMobile,
            studentMobile: newStudent.studentMobile,
            email: newStudent.email,
            presentAddress: newStudent.presentAddress,
            permanentAddress: newStudent.permanentAddress,
            photoUrl: newStudent.photoUrl,
            classId: newStudent.classId,
            tradeId: newStudent.tradeId || null,
            shift: newStudent.shift === "Second Shift" ? "SECOND_SHIFT" : "FIRST_SHIFT",
            shiftBangla: newStudent.shiftBangla,
            section: newStudent.section,
            session: newStudent.session,
            status: "ACTIVE",
            attendanceRate: 100.0,
            gpa: "0.00",
            resultStatus: "PASSED",
            nationality: newStudent.nationality,
            guardianName: newStudent.guardianName,
            guardianRelationship: newStudent.guardianRelationship,
            emergencyContact: newStudent.emergencyContact,
            admissionDate: newStudent.admissionDate,
          },
          include: {
            class: true,
            trade: true,
          },
        });

        // Also sync into in-memory store for cache consistency
        institutionalDb.students.unshift(mapPrismaStudentToClient(createdInDb));

        return NextResponse.json({
          success: true,
          student: mapPrismaStudentToClient(createdInDb),
          message: "নতুন শিক্ষার্থী সফলভাবে ডাটাবেসে (MySQL) সংরক্ষিত হয়েছে।",
          source: "mysql",
        });
      } catch (dbError) {
        console.warn(
          "[Hybrid API] MySQL student insertion failed, falling back to in-memory store:",
          (dbError as Error).message
        );
        // Fall back to in-memory store insertion below
      }
    }

    // 4. In-Memory Store Insertion
    institutionalDb.students.unshift(newStudent);

    return NextResponse.json({
      success: true,
      student: newStudent,
      message: "নতুন শিক্ষার্থী সফলভাবে ডাটাবেসে সংরক্ষিত হয়েছে।",
      source: "in-memory",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = requireAdmin(req, "/api/students (PUT)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const idx = institutionalDb.students.findIndex((s) => s.id === Number(body.id));
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const classId = Number(body.classId) || institutionalDb.students[idx].classId;
    const session = body.session || institutionalDb.students[idx].session;
    const clsNum = parseClassNumeric(classId);

    const hasTrades = doesClassHaveTrade(clsNum);
    let tradeId: number | undefined = undefined;
    let tradeName: string | undefined = undefined;
    let tradeNameBangla: string | undefined = undefined;

    if (hasTrades) {
      if (!body.tradeId) {
        return NextResponse.json(
          { success: false, error: "কারিগরি নবম-দ্বাদশ শ্রেণিতে ট্রেড নির্বাচন করা আবশ্যক।" },
          { status: 400 }
        );
      }
      const tId = Number(body.tradeId);
      if (!isTradeValidForClass(clsNum, tId)) {
        return NextResponse.json(
          { success: false, error: "নির্বাচিত কারিগরি ট্রেডটি এই শ্রেণির জন্য প্রযোজ্য নয়।" },
          { status: 400 }
        );
      }
      const matchedTrade = institutionalDb.trades.find((t) => t.id === tId);
      if (matchedTrade) {
        tradeId = matchedTrade.id;
        tradeName = matchedTrade.name;
        tradeNameBangla = matchedTrade.nameBangla;
      }
    }

    // Unique checks on update
    if (body.studentId && body.studentId.toUpperCase() !== institutionalDb.students[idx].studentId.toUpperCase()) {
      const duplicateId = institutionalDb.students.some(
        (s) => s.id !== Number(body.id) && s.studentId.toUpperCase() === body.studentId.toUpperCase()
      );
      if (duplicateId) {
        return NextResponse.json(
          { success: false, error: `স্টুডেন্ট আইডি (${body.studentId}) ইতিপূর্বে অন্য শিক্ষার্থীকে দেওয়া হয়েছে।` },
          { status: 400 }
        );
      }
    }

    const matchedClass = institutionalDb.classes.find((c) => c.id === classId) || institutionalDb.classes[3];

    const updatedStudent: Student = {
      ...institutionalDb.students[idx],
      ...body,
      classId: matchedClass.id,
      className: matchedClass.name,
      tradeId,
      tradeName,
      tradeNameBangla,
      shiftBangla: body.shift === "Second Shift" ? "২য় শিফট" : "১ম শিফট",
    };

    if (isPrismaAvailable() && prisma) {
      try {
        await prisma.student.update({
          where: { id: Number(body.id) },
          data: {
            name: updatedStudent.name,
            nameBangla: updatedStudent.nameBangla,
            roll: updatedStudent.roll,
            classId: updatedStudent.classId,
            tradeId: updatedStudent.tradeId || null,
            shift: updatedStudent.shift === "Second Shift" ? "SECOND_SHIFT" : "FIRST_SHIFT",
            shiftBangla: updatedStudent.shiftBangla,
            section: updatedStudent.section,
            session: updatedStudent.session,
            fatherName: updatedStudent.fatherName,
            motherName: updatedStudent.motherName,
            guardianMobile: updatedStudent.guardianMobile,
            presentAddress: updatedStudent.presentAddress,
            permanentAddress: updatedStudent.permanentAddress,
          },
        });
      } catch (dbErr) {
        console.warn("[Hybrid API] Prisma update skipped/failed:", (dbErr as Error).message);
      }
    }

    institutionalDb.students[idx] = updatedStudent;

    return NextResponse.json({
      success: true,
      student: updatedStudent,
      message: "শিক্ষার্থীর তথ্য সফলভাবে আপডেট করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req, "/api/students (DELETE)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const numId = Number(id);

    if (isPrismaAvailable() && prisma) {
      try {
        await prisma.student.delete({
          where: { id: numId },
        });
      } catch (dbErr) {
        console.warn("[Hybrid API] Prisma delete skipped/failed:", (dbErr as Error).message);
      }
    }

    institutionalDb.students = institutionalDb.students.filter((s) => s.id !== numId);

    return NextResponse.json({
      success: true,
      message: "শিক্ষার্থীর রেকর্ড সফলভাবে অপসারিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
