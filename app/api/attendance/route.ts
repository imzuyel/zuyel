import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, AttendanceRecord } from "@/lib/database";
import { parseClassNumeric, ALL_TRADES, doesClassHaveTrade } from "@/lib/academicStructure";
import { prisma, isPrismaAvailable, markPrismaFailure } from "@/lib/prisma";
import {
  getHybridAttendanceRecords,
  saveHybridAttendanceRecords,
  getHybridStore,
} from "@/lib/hybridStorageEngine";

function toPrismaStatus(s: string): "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" {
  const up = String(s || "P").toUpperCase();
  if (up === "A" || up === "ABSENT") return "ABSENT";
  if (up === "L" || up === "LATE") return "LATE";
  if (up === "E" || up === "EXCUSED" || up === "LEAVE") return "EXCUSED";
  return "PRESENT";
}

function matchesClass(c1: any, c2: any): boolean {
  if (c1 === c2 || String(c1) === String(c2)) return true;
  const n1 = parseClassNumeric(c1);
  const n2 = parseClassNumeric(c2);
  return n1 > 0 && n2 > 0 && n1 === n2;
}

function matchesTrade(t1: any, t2: any): boolean {
  if (!t2 || t2 === "all") return true;
  if (!t1) return false;
  if (t1 === t2 || String(t1).toLowerCase() === String(t2).toLowerCase()) return true;
  const n1 = Number(t1);
  const n2 = Number(t2);
  if (!isNaN(n1) && !isNaN(n2)) {
    if (n1 === n2) return true;
    if ((n1 === 101 && n2 === 1) || (n1 === 1 && n2 === 101)) return true;
    if ((n1 === 102 && n2 === 2) || (n1 === 2 && n2 === 102)) return true;
    if ((n1 === 103 && n2 === 3) || (n1 === 3 && n2 === 103)) return true;
    if ((n1 === 104 && n2 === 4) || (n1 === 4 && n2 === 104)) return true;
  }
  return false;
}

function getAllAttendanceRecords(): any[] {
  const hybridRecords = getHybridAttendanceRecords();
  const dbRecords = institutionalDb.attendanceRecords || [];
  const map = new Map<string, any>();

  dbRecords.forEach((r) => {
    const key = r.id ? String(r.id) : `${r.date}_${r.classId}_${r.section}_${r.periodNo}`;
    map.set(key, r);
  });

  hybridRecords.forEach((r: any) => {
    const key = r.id ? String(r.id) : `${r.date}_${r.classId}_${r.section}_${r.periodNo}`;
    map.set(key, { ...(map.get(key) || {}), ...r });
  });

  return Array.from(map.values());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const sessionCode = searchParams.get("sessionCode") || searchParams.get("pin");
    const classIdParam = searchParams.get("classId");
    const tradeIdParam = searchParams.get("tradeId");
    const sectionParam = searchParams.get("section");
    const periodParam = searchParams.get("periodNo");
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const recordId = searchParams.get("recordId");

    const allRecords = getAllAttendanceRecords();

    // 1. Fetch by recordId
    if (recordId) {
      const found = allRecords.find((r) => String(r.id) === String(recordId));
      if (found) {
        return NextResponse.json({ success: true, record: found });
      }
      return NextResponse.json({ success: false, error: "রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
    }

    // 1.5. PAGINATED STUDENTS FOR DIGITAL ATTENDANCE REGISTER
    if (action === "students_paged") {
      const targetClassId = classIdParam ? Number(classIdParam) : 4;
      const targetTradeId = tradeIdParam && tradeIdParam !== "0" && tradeIdParam !== "all" ? Number(tradeIdParam) : undefined;
      const searchQ = (searchParams.get("search") || "").trim().toLowerCase();
      const pageNum = Math.max(1, Number(searchParams.get("page") || 1));
      const limitNum = Math.max(1, Math.min(200, Number(searchParams.get("limit") || 50)));
      const hasTrade = doesClassHaveTrade(targetClassId);

      // Try MySQL first when live
      if (isPrismaAvailable() && prisma) {
        try {
          const where: any = { status: "ACTIVE", classId: targetClassId };
          if (hasTrade && targetTradeId) {
            where.tradeId = targetTradeId;
          }
          if (sectionParam && sectionParam !== "all") {
            where.section = sectionParam;
          }
          if (searchQ) {
            const numericRoll = Number(searchQ);
            where.OR = [
              { name: { contains: searchQ } },
              { nameBangla: { contains: searchQ } },
              { studentId: { contains: searchQ } },
              ...(!Number.isNaN(numericRoll) ? [{ roll: numericRoll }] : []),
            ];
          }
          const [total, rows] = await Promise.all([
            prisma.student.count({ where }),
            prisma.student.findMany({
              where,
              include: { class: true, trade: true },
              orderBy: { roll: "asc" },
              skip: (pageNum - 1) * limitNum,
              take: limitNum,
            }),
          ]);
          if (total > 0 || rows.length > 0) {
            const items = rows.map((s: any) => ({
              id: s.id,
              studentId: s.studentId,
              admissionNo: s.admissionNo,
              roll: s.roll,
              name: s.name,
              nameBangla: s.nameBangla || s.name,
              classId: s.classId,
              className: s.class?.name || `Class ${s.classId}`,
              tradeId: s.tradeId || undefined,
              tradeName: s.trade?.name || undefined,
              tradeNameBangla: s.trade?.nameBangla || undefined,
              section: s.section || "A",
              session: s.session || "2026",
              photoUrl: s.photoUrl || "",
              guardianMobile: s.guardianMobile || "",
              status: "Active",
            }));
            return NextResponse.json({
              success: true,
              items,
              total,
              totalPages: Math.max(1, Math.ceil(total / limitNum)),
              page: pageNum,
              limit: limitNum,
              source: "mysql",
            });
          }
        } catch (dbErr: any) {
          const msg = dbErr?.message || String(dbErr);
          if (msg.includes("P1001") || msg.includes("ECONNREFUSED") || msg.includes("timed out")) {
            markPrismaFailure();
          }
        }
      }

      // Fast In-Memory / Hybrid fallback
      const hybridList = getHybridStore().students || [];
      const sourceStudents = hybridList.length > 0 ? hybridList : institutionalDb.students;
      let filteredStudents = sourceStudents.filter((s: any) => {
        if (!matchesClass(s.classId, targetClassId)) return false;
        if (hasTrade && targetTradeId && !matchesTrade(s.tradeId, targetTradeId)) return false;
        if (sectionParam && sectionParam !== "all" && s.section && s.section !== sectionParam) return false;
        if (searchQ) {
          const matchName = (s.name || "").toLowerCase().includes(searchQ) || (s.nameBangla || "").toLowerCase().includes(searchQ);
          const matchRoll = String(s.roll || "").includes(searchQ);
          const matchId = (s.studentId || "").toLowerCase().includes(searchQ);
          if (!matchName && !matchRoll && !matchId) return false;
        }
        return true;
      });

      filteredStudents.sort((a: any, b: any) => Number(a.roll || 0) - Number(b.roll || 0));
      const total = filteredStudents.length;
      const totalPages = Math.max(1, Math.ceil(total / limitNum));
      const paged = filteredStudents.slice((pageNum - 1) * limitNum, pageNum * limitNum).map((s: any) => ({
        ...s,
        id: Number(String(s.id).replace(/\D/g, "")) || Number(s.roll) || 1,
        photoUrl: s.photoUrl || s.avatar || "",
      }));

      return NextResponse.json({
        success: true,
        items: paged,
        total,
        totalPages,
        page: pageNum,
        limit: limitNum,
        source: "hybrid",
      });
    }

    // 2. QUIZ ELIGIBILITY ACTION
    if (action === "quiz_eligibility") {
      let targetClassId = classIdParam ? parseInt(classIdParam) : 4; // Default Class 9
      let targetTradeId = tradeIdParam ? parseInt(tradeIdParam) : undefined;

      const joinedStudentIds = new Set<number>();
      const joinedNames = new Set<string>();

      if (sessionCode) {
        const rawCode = sessionCode.toString().trim();
        const digitsOnly = rawCode.replace(/\D/g, "");
        const session = institutionalDb.liveSessions.find(
          (s) =>
            s.sessionCode === rawCode ||
            s.pinCode === rawCode ||
            (digitsOnly.length >= 4 && (s.sessionCode === digitsOnly || s.pinCode === digitsOnly))
        );

        if (session) {
          if (session.classId) {
            targetClassId = Number(session.classId);
          }
          if (session.tradeId) {
            targetTradeId = Number(session.tradeId);
          } else if (session.tradeName) {
            const trd = ALL_TRADES.find(
              (t) => t.name.toLowerCase() === session.tradeName?.toLowerCase() || t.nameBangla === session.tradeName
            );
            if (trd) targetTradeId = trd.id;
          }
          const participants = institutionalDb.liveParticipants.filter(
            (p) => p.sessionId === session.id && (p.status === "JOINED" || p.connectionStatus === "online")
          );
          participants.forEach((p) => {
            if (p.studentId) joinedStudentIds.add(p.studentId);
            if (p.displayName) {
              joinedNames.add(p.displayName.trim().toLowerCase());
              const baseName = p.displayName.split("(")[0].trim().toLowerCase();
              joinedNames.add(baseName);
            }
          });
        }
      }

      // Check today's or most recent attendance record
      let record = allRecords.find(
        (r) => matchesClass(r.classId, targetClassId) && (!targetTradeId || matchesTrade(r.tradeId, targetTradeId)) && r.date === dateParam
      );

      if (!record) {
        const recordsForClass = allRecords
          .filter((r) => matchesClass(r.classId, targetClassId) && (!targetTradeId || matchesTrade(r.tradeId, targetTradeId)))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        record = recordsForClass[0];
      }

      let eligibleStudents: any[] = [];

      if (record && record.entries && record.entries.length > 0) {
        const presentEntries = record.entries.filter(
          (e: any) => e.status === "P" || e.status === "L" || e.status === "PRESENT" || e.status === "LATE"
        );

        eligibleStudents = presentEntries.map((entry: any) => {
          const studentProfile = institutionalDb.students.find((s) => s.id === entry.studentId);
          const name = studentProfile?.nameBangla || studentProfile?.name || entry.name;
          const cleanNameLower = name.trim().toLowerCase();
          const isJoined = joinedStudentIds.has(entry.studentId) || joinedNames.has(cleanNameLower);

          return {
            id: entry.studentId,
            studentId: studentProfile?.studentId || entry.studentCode || `PTSC-${entry.studentId}`,
            roll: entry.roll,
            name: name,
            nameEnglish: studentProfile?.name || entry.name,
            trade: studentProfile?.tradeNameBangla || studentProfile?.tradeName || record?.tradeName || "IT Support & IoT",
            tradeId: studentProfile?.tradeId || record?.tradeId,
            className: studentProfile?.className || record?.className || "Class 9 (SSC Vocational)",
            classId: studentProfile?.classId || record?.classId,
            attendanceStatus: (entry.status === "P" || entry.status === "PRESENT") ? "উপস্থিত (Present)" : "বিলম্বে উপস্থিত (Late)",
            statusCode: entry.status === "PRESENT" ? "P" : entry.status,
            attendanceRate: studentProfile?.attendanceRate ?? 95,
            isJoined: isJoined,
          };
        });

        if (targetTradeId) {
          const filteredByTrade = eligibleStudents.filter((s) => matchesTrade(s.tradeId, targetTradeId));
          if (filteredByTrade.length > 0) eligibleStudents = filteredByTrade;
        }
      } else {
        const studentsInClass = institutionalDb.students.filter(
          (s) => matchesClass(s.classId, targetClassId) && (!targetTradeId || matchesTrade(s.tradeId, targetTradeId)) && s.status === "Active"
        );

        eligibleStudents = (studentsInClass.length > 0 ? studentsInClass : institutionalDb.students.filter((s) => matchesClass(s.classId, targetClassId))).map(
          (s) => {
            const cleanNameLower = (s.nameBangla || s.name).trim().toLowerCase();
            const isJoined = joinedStudentIds.has(s.id) || joinedNames.has(cleanNameLower);
            return {
              id: s.id,
              studentId: s.studentId,
              roll: s.roll,
              name: s.nameBangla || s.name,
              nameEnglish: s.name,
              trade: s.tradeNameBangla || s.tradeName || "IT Support & IoT",
              tradeId: s.tradeId,
              className: s.className || "Class 9 (SSC Vocational)",
              classId: s.classId,
              attendanceStatus: "উপস্থিত (Present)",
              statusCode: "P",
              attendanceRate: s.attendanceRate ?? 96,
              isJoined: isJoined,
            };
          }
        );
      }

      return NextResponse.json({
        success: true,
        action: "quiz_eligibility",
        date: record?.date || dateParam,
        className: record?.className || "Class 9 (SSC Vocational)",
        tradeName: record?.tradeName || "IT Support & IoT",
        totalEligible: eligibleStudents.length,
        students: eligibleStudents,
      });
    }

    // 3. FILTERED QUERY (Class, Section, Period, Date)
    let filtered = allRecords;
    if (dateParam) {
      filtered = filtered.filter((r) => r.date === dateParam);
    }
    if (classIdParam) {
      filtered = filtered.filter((r) => matchesClass(r.classId, classIdParam));
    }
    if (tradeIdParam && tradeIdParam !== "all") {
      filtered = filtered.filter((r) => matchesTrade(r.tradeId, tradeIdParam));
    }
    if (sectionParam && sectionParam !== "all") {
      filtered = filtered.filter((r) => r.section === sectionParam);
    }
    if (periodParam) {
      filtered = filtered.filter((r) => String(r.periodNo) === String(periodParam));
    }

    return NextResponse.json({
      success: true,
      records: filtered,
      record: filtered[0] || null,
      total: filtered.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id || `att_rec_${Date.now()}`;
    const date = body.date || new Date().toISOString().split("T")[0];
    const periodNo = Number(body.periodNo || 1);
    const classId = Number(body.classId || 4);
    const tradeId = body.tradeId ? Number(body.tradeId) : undefined;
    const section = body.section || "A";
    const session = body.session || "2026";
    const entries = Array.isArray(body.entries) ? body.entries : [];

    const existingIndex = institutionalDb.attendanceRecords.findIndex(
      (r) => String(r.id) === String(id) || (r.date === date && Number(r.periodNo) === periodNo && Number(r.classId) === classId && r.section === section)
    );

    const newRecord: AttendanceRecord = {
      id: existingIndex >= 0 ? institutionalDb.attendanceRecords[existingIndex].id : id,
      session,
      date,
      classId,
      className: body.className || `Class ${classId}`,
      tradeId,
      tradeName: body.tradeName,
      section,
      periodNo,
      subjectCode: body.subjectCode,
      subjectName: body.subjectName || "ট্রেড ও সাধারণ বিষয়",
      teacherName: body.teacherName || "অন-ডিউটি শিক্ষক",
      department: body.department || "কারিগরি শাখা",
      status: body.status || "submitted",
      isLocked: Boolean(body.isLocked),
      entries: entries.map((e: any) => ({
        id: e.id || `ent_${Date.now()}_${e.studentId}`,
        studentId: Number(e.studentId),
        studentCode: e.studentCode || String(e.studentId),
        roll: Number(e.roll || 1),
        name: e.name || "শিক্ষার্থী",
        status: e.status || "P",
        inTime: e.inTime || new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }),
        remark: e.remark,
      })),
      auditLogs: [],
      createdAt: existingIndex >= 0 ? institutionalDb.attendanceRecords[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      institutionalDb.attendanceRecords[existingIndex] = newRecord;
    } else {
      institutionalDb.attendanceRecords.unshift(newRecord);
    }

    // Write-through to Hybrid Storage
    const hybridRecords = getHybridAttendanceRecords();
    const hIdx = hybridRecords.findIndex((r: any) => String(r.id) === String(newRecord.id));
    if (hIdx >= 0) {
      hybridRecords[hIdx] = newRecord;
    } else {
      hybridRecords.unshift(newRecord);
    }
    saveHybridAttendanceRecords(hybridRecords);

    // Strict MySQL Write-Through (Period-Wise AttendanceRecord + AttendanceEntry)
    let source = "hybrid";
    if (isPrismaAvailable() && prisma) {
      try {
        const presentCount = newRecord.entries.filter((e) => e.status === "P").length;
        const absentCount = newRecord.entries.filter((e) => e.status === "A").length;
        const lateCount = newRecord.entries.filter((e) => e.status === "L").length;
        const leaveCount = newRecord.entries.filter((e) => e.status === "E").length;

        const existingDb = await prisma.attendanceRecord.findFirst({
          where: {
            date,
            classId,
            tradeId: tradeId || null,
            section,
            session,
            periodNo,
          },
        });

        let dbRecordId: number;
        if (existingDb) {
          const updated = await prisma.attendanceRecord.update({
            where: { id: existingDb.id },
            data: {
              totalCount: newRecord.entries.length,
              presentCount,
              absentCount,
              lateCount,
              leaveCount,
              verifiedBy: newRecord.teacherName,
            },
          });
          dbRecordId = updated.id;
          await prisma.attendanceEntry.deleteMany({ where: { recordId: dbRecordId } });
        } else {
          const created = await prisma.attendanceRecord.create({
            data: {
              date,
              classId,
              tradeId: tradeId || null,
              section,
              session,
              periodNo,
              totalCount: newRecord.entries.length,
              presentCount,
              absentCount,
              lateCount,
              leaveCount,
              verifiedBy: newRecord.teacherName,
            },
          });
          dbRecordId = created.id;
        }

        if (newRecord.entries.length > 0) {
          await prisma.attendanceEntry.createMany({
            data: newRecord.entries.map((e) => ({
              recordId: dbRecordId,
              studentId: Number(e.studentId),
              status: toPrismaStatus(e.status),
              remarks: e.remark || null,
            })),
            skipDuplicates: true,
          });
        }
        source = "mysql";
      } catch (dbErr: any) {
        const msg = dbErr?.message || String(dbErr);
        const code = String(dbErr?.code || "");
        if (["P1001", "P1002", "P1008", "P1017", "P2024"].includes(code) || msg.includes("ECONNREFUSED") || msg.includes("timed out")) {
          markPrismaFailure();
        } else {
          console.error("[MySQL Attendance Write Error]:", dbErr);
          return NextResponse.json(
            { success: false, error: `MySQL হাজিরা সংরক্ষণ ব্যর্থ: ${msg}`, code },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "হাজিরা সফলভাবে সংরক্ষিত হয়েছে।",
      record: newRecord,
      source,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { recordId, studentId, newStatus, remark, reason, changedBy = "Faculty" } = body;

    if (!recordId || !studentId || !newStatus) {
      return NextResponse.json(
        { success: false, error: "রেকর্ড আইডি, শিক্ষার্থী আইডি ও নতুন স্ট্যাটাস আবশ্যক।" },
        { status: 400 }
      );
    }

    const allRecords = getAllAttendanceRecords();
    const record = allRecords.find((r) => String(r.id) === String(recordId));

    if (!record) {
      return NextResponse.json({ success: false, error: "হাজিরা রেকর্ডটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    record.entries = record.entries || [];
    const entry = record.entries.find((e: any) => Number(e.studentId) === Number(studentId));

    if (entry) {
      entry.status = newStatus;
      if (remark) entry.remark = remark;
    } else {
      record.entries.push({
        id: `ent_${Date.now()}_${studentId}`,
        studentId: Number(studentId),
        studentCode: String(studentId),
        roll: 1,
        name: "শিক্ষার্থী",
        status: newStatus,
        remark: remark || reason,
      });
    }

    record.auditLogs = record.auditLogs || [];
    record.auditLogs.push({
      timestamp: new Date().toISOString(),
      changedBy,
      field: `student_${studentId}_status`,
      oldValue: entry?.status || "N/A",
      newValue: newStatus,
      reason: reason || "সরাসরি সংশোধন",
    });
    record.updatedAt = new Date().toISOString();

    // Update in-memory & hybrid
    const dbIdx = institutionalDb.attendanceRecords.findIndex((r) => String(r.id) === String(recordId));
    if (dbIdx >= 0) institutionalDb.attendanceRecords[dbIdx] = record;

    const hybridRecords = getHybridAttendanceRecords();
    const hIdx = hybridRecords.findIndex((r: any) => String(r.id) === String(recordId));
    if (hIdx >= 0) hybridRecords[hIdx] = record;
    else hybridRecords.unshift(record);
    saveHybridAttendanceRecords(hybridRecords);

    return NextResponse.json({
      success: true,
      message: "হাজিরা সফলভাবে হালনাগাদ করা হয়েছে।",
      record,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { recordId, isLocked, userRole, changedBy = "Principal" } = body;

    if (!recordId) {
      return NextResponse.json({ success: false, error: "রেকর্ড আইডি আবশ্যক।" }, { status: 400 });
    }

    const allRecords = getAllAttendanceRecords();
    const record = allRecords.find((r) => String(r.id) === String(recordId));

    if (!record) {
      return NextResponse.json({ success: false, error: "হাজিরা রেকর্ডটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    record.isLocked = Boolean(isLocked);
    record.status = isLocked ? "finalized" : "draft";
    record.updatedAt = new Date().toISOString();
    record.auditLogs = record.auditLogs || [];
    record.auditLogs.push({
      timestamp: new Date().toISOString(),
      changedBy,
      field: "isLocked",
      oldValue: !isLocked,
      newValue: isLocked,
      reason: isLocked ? "লক করা হয়েছে" : "আনলক করা হয়েছে",
    });

    const dbIdx = institutionalDb.attendanceRecords.findIndex((r) => String(r.id) === String(recordId));
    if (dbIdx >= 0) institutionalDb.attendanceRecords[dbIdx] = record;

    const hybridRecords = getHybridAttendanceRecords();
    const hIdx = hybridRecords.findIndex((r: any) => String(r.id) === String(recordId));
    if (hIdx >= 0) hybridRecords[hIdx] = record;
    saveHybridAttendanceRecords(hybridRecords);

    return NextResponse.json({
      success: true,
      message: isLocked ? "হাজিরা রেকর্ড সফলভাবে লক করা হয়েছে।" : "হাজিরা রেকর্ড আনলক করা হয়েছে।",
      record,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json({ success: false, error: "রেকর্ড আইডি প্রদান করা হয়নি।" }, { status: 400 });
    }

    institutionalDb.attendanceRecords = institutionalDb.attendanceRecords.filter(
      (r) => String(r.id) !== String(recordId)
    );

    const hybridRecords = getHybridAttendanceRecords().filter((r: any) => String(r.id) !== String(recordId));
    saveHybridAttendanceRecords(hybridRecords);

    return NextResponse.json({
      success: true,
      message: "হাজিরা রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
