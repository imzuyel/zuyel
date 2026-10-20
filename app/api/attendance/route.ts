import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const sessionCode = searchParams.get("sessionCode") || searchParams.get("pin");
    const classIdParam = searchParams.get("classId");
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (action === "quiz_eligibility") {
      const targetClassId = classIdParam ? parseInt(classIdParam) : 4; // Default Class 9 (SSC Vocational)

      // 1. Check today's or most recent attendance record for this class
      let record = institutionalDb.attendanceRecords.find(
        (r) => r.classId === targetClassId && r.date === dateParam
      );

      // If not found for today's exact date, find the latest available attendance record
      if (!record) {
        const recordsForClass = institutionalDb.attendanceRecords
          .filter((r) => r.classId === targetClassId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        record = recordsForClass[0];
      }

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
          const participants = institutionalDb.liveParticipants.filter(
            (p) => p.sessionId === session.id && (p.status === "JOINED" || p.connectionStatus === "online")
          );
          participants.forEach((p) => {
            if (p.studentId) joinedStudentIds.add(p.studentId);
            if (p.displayName) {
              joinedNames.add(p.displayName.trim().toLowerCase());
              // Clean up formatted name e.g. "আরিয়ান খান (রোল: ১০১)" -> "আরিয়ান খান"
              const baseName = p.displayName.split("(")[0].trim().toLowerCase();
              joinedNames.add(baseName);
            }
          });
        }
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
            className: studentProfile?.className || record?.className || "Class 9 (SSC Vocational)",
            attendanceStatus: entry.status === "P" ? "উপস্থিত (Present)" : "বিলম্বে উপস্থিত (Late)",
            statusCode: entry.status,
            attendanceRate: studentProfile?.attendanceRate ?? 95,
            isJoined: isJoined,
          };
        });
      } else {
        // Fallback: active students for this class or general active students
        const studentsInClass = institutionalDb.students.filter(
          (s) => (s.classId === targetClassId || targetClassId === 4) && s.status === "Active"
        );

        eligibleStudents = (studentsInClass.length > 0 ? studentsInClass : institutionalDb.students.slice(0, 25)).map(
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
              className: s.className || "Class 9 (SSC Vocational)",
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
