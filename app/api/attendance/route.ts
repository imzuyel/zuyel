import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { parseClassNumeric, ALL_TRADES } from "@/lib/academicStructure";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const sessionCode = searchParams.get("sessionCode") || searchParams.get("pin");
    const classIdParam = searchParams.get("classId");
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (action === "quiz_eligibility") {
      let targetClassId = classIdParam ? parseInt(classIdParam) : 4; // Default Class 9 (SSC Vocational)
      let targetTradeId = searchParams.get("tradeId") ? parseInt(searchParams.get("tradeId")!) : undefined;

      // Check which students are already joined in the active live session
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

      // 1. Check today's or most recent attendance record for this class & trade
      let record = institutionalDb.attendanceRecords.find(
        (r) => matchesClass(r.classId, targetClassId) && (!targetTradeId || matchesTrade(r.tradeId, targetTradeId)) && r.date === dateParam
      );

      // If not found for today's exact date, find the latest available attendance record
      if (!record) {
        const recordsForClass = institutionalDb.attendanceRecords
          .filter((r) => matchesClass(r.classId, targetClassId) && (!targetTradeId || matchesTrade(r.tradeId, targetTradeId)))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        record = recordsForClass[0];
      }

      let eligibleStudents: any[] = [];

      if (record && record.entries && record.entries.length > 0) {
        // Filter students with Present ("P") or Late ("L")
        const presentEntries = record.entries.filter(
          (e) => e.status === "P" || e.status === "L"
        );

        eligibleStudents = presentEntries.map((entry) => {
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
            attendanceStatus: entry.status === "P" ? "উপস্থিত (Present)" : "বিলম্বে উপস্থিত (Late)",
            statusCode: entry.status,
            attendanceRate: studentProfile?.attendanceRate ?? 95,
            isJoined: isJoined,
          };
        });

        if (targetTradeId) {
          const filteredByTrade = eligibleStudents.filter((s) => matchesTrade(s.tradeId, targetTradeId));
          if (filteredByTrade.length > 0) eligibleStudents = filteredByTrade;
        }
      } else {
        // Fallback: active students for this class or general active students
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

    // Default attendance summary / fallback
    return NextResponse.json({
      success: true,
      records: institutionalDb.attendanceRecords.slice(0, 20),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}
