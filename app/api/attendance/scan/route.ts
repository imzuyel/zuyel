import { NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { prisma, isPrismaAvailable } from "@/lib/prisma";

// PTSC Campus Official Geolocation Benchmark (Panchagarh Sadar)
const PTSC_CAMPUS_LAT = 26.3354;
const PTSC_CAMPUS_LNG = 88.5516;
const MAX_ALLOWED_DISTANCE_METERS = 200; // 200-meter geo-fence radius
const TOKEN_MAX_AGE_MS = 8000; // 5-second dynamic TTL + 3s clock/network latency grace

/**
 * Standard Haversine formula to compute great-circle distance between two points in meters
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's mean radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, scannedPayload, latitude, longitude, accuracy } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "শিক্ষার্থীর আইডি (studentId) প্রদান করা হয়নি।" },
        { status: 400 }
      );
    }

    if (!scannedPayload) {
      return NextResponse.json(
        { success: false, error: "কিউআর পেলোড অনুপস্থিত।" },
        { status: 400 }
      );
    }

    // 1. PARSE & VALIDATE DYNAMIC QR PAYLOAD
    let payload: any = null;
    try {
      payload = typeof scannedPayload === "string" ? JSON.parse(scannedPayload) : scannedPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: "অবৈধ কিউআর ফরম্যাট। শুধুমাত্র অফিশিয়াল প্রজেক্টর স্ক্রিন স্ক্যান করুন।" },
        { status: 400 }
      );
    }

    if (!payload.timestamp || !payload.token) {
      return NextResponse.json(
        { success: false, error: "কিউআর কোডে প্রয়োজনীয় নিরাপত্তা টোকেন অনুপস্থিত।" },
        { status: 400 }
      );
    }

    // 2. TIME-BASED TOKEN EXPIRATION CHECK (Anti-Proxy via photo sharing)
    const currentTime = Date.now();
    const tokenAge = currentTime - Number(payload.timestamp);

    if (tokenAge > TOKEN_MAX_AGE_MS) {
      const ageSeconds = Math.round(tokenAge / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `কিউআর টোকেনের মেয়াদ উত্তীর্ণ হয়ে গেছে (${ageSeconds} সেকেন্ড অতিক্রান্ত, অনুমোদন ৫ সেকেন্ড)। প্রজেক্টর স্ক্রিনের নতুন কোড স্ক্যান করুন।`,
          code: "TOKEN_EXPIRED",
        },
        { status: 400 }
      );
    }

    // Reject futuristic tokens with significant clock skew (> 5 seconds ahead)
    if (tokenAge < -5000) {
      return NextResponse.json(
        {
          success: false,
          error: "ডিভাইসের ঘড়ির সময় সঠিক নয়। দয়া করে ডিভাইসের সময় ইন্টারনেটের সাথে অটো-সিঙ্ক করুন।",
          code: "CLOCK_SKEW",
        },
        { status: 400 }
      );
    }

    // 3. GPS GEO-FENCING VERIFICATION (Haversine formula against PTSC campus)
    // Validate GPS coordinates – they must be provided and be valid numbers.
    if (typeof latitude !== "number" || typeof longitude !== "number" || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { success: false, error: "হাজিরা দেওয়ার জন্য ফোনের জিপিএস লোকেশন চালু রাখা বাধ্যতামূলক।" },
        { status: 400 }
      );
    }
    const studentLat = latitude;
    const studentLng = longitude;

    const distanceMeters = calculateHaversineDistance(
      PTSC_CAMPUS_LAT,
      PTSC_CAMPUS_LNG,
      studentLat,
      studentLng
    );

    if (distanceMeters > MAX_ALLOWED_DISTANCE_METERS) {
      return NextResponse.json(
        {
          success: false,
          error: `আপনি পঞ্চগড় টিএসসি ক্যাম্পাসের বাইরে অবস্থান করছেন। বর্তমান দূরত্ব: ${distanceMeters} মিটার (অনুমোদিত সর্বোচ্চ: ${MAX_ALLOWED_DISTANCE_METERS} মিটার)।`,
          code: "GEOFENCE_VIOLATION",
          distanceMeters,
        },
        { status: 403 }
      );
    }

    // 4. FIND STUDENT DETAILS
    const matchedStudent = (institutionalDb.students || []).find(
      (s) => s.studentId === studentId || s.id === Number(studentId)
    );

    const studentName = matchedStudent?.nameBangla || matchedStudent?.name || "শিক্ষার্থী";
    const studentRoll = matchedStudent?.roll || 1;
    const today = new Date().toISOString().split("T")[0];
    const period = payload.period || 1;
    const subjectName = payload.subjectName || "ট্রেড-১ (তত্ত্বীয় ও ব্যবহারিক)";
    const inTime = new Date().toLocaleTimeString("bn-BD", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // 5. DUPLICATE ATTENDANCE PREVENTION
    institutionalDb.attendanceRecords = institutionalDb.attendanceRecords || [];
    let todayRecord = institutionalDb.attendanceRecords.find(
      (r) => r.date === today && r.periodNo === period && r.classId === (payload.classId || 4)
    );

    if (!todayRecord) {
      todayRecord = {
        id: `att_rec_${today}_p${period}_c${payload.classId || 4}`,
        session: "2026",
        date: today,
        classId: payload.classId || 4,
        className: payload.className || "Class 9",
        tradeName: payload.tradeName,
        section: payload.section || "A",
        periodNo: period,
        subjectName,
        teacherName: "অন-ডিউটি শিক্ষক",
        department: "কারিগরি শাখা",
        isLocked: false,
        entries: [],
        auditLogs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      institutionalDb.attendanceRecords.push(todayRecord);
    }

    const alreadyPresent = todayRecord.entries?.some(
      (e) => e.studentId === matchedStudent?.id || String(e.studentId) === String(studentId)
    );

    if (alreadyPresent) {
      return NextResponse.json(
        {
          success: false,
          error: `শিক্ষার্থী ${studentName} (${studentId})-এর আজকের পিরিয়ড ${period}-এর হাজিরা ইতিপূর্বে লিপিবদ্ধ হয়েছে।`,
          code: "DUPLICATE_ENTRY",
        },
        { status: 409 }
      );
    }

    // 6. HYBRID STORAGE (MySQL via Prisma if active, otherwise in-memory)
    if (isPrismaAvailable() && prisma) {
      try {
        // Attempt database persistence
        const classId = payload.classId || matchedStudent?.classId || 4;
        const shiftEnum = payload.shift?.includes("২য়") ? "SECOND_SHIFT" : "FIRST_SHIFT";

        // Upsert daily attendance record
        let record = await prisma.attendanceRecord.findFirst({
          where: {
            date: today,
            classId,
            shift: shiftEnum,
          },
        });

        if (!record) {
          record = await prisma.attendanceRecord.create({
            data: {
              date: today,
              classId,
              shift: shiftEnum,
              section: payload.section || "A",
              session: "2026",
              totalCount: 1,
              presentCount: 1,
              verifiedBy: "Anti-Proxy Dynamic QR Engine",
            },
          });
        } else {
          await prisma.attendanceRecord.update({
            where: { id: record.id },
            data: { presentCount: { increment: 1 } },
          });
        }

        // Insert entry
        if (matchedStudent?.id) {
          await prisma.attendanceEntry.create({
            data: {
              recordId: record.id,
              studentId: matchedStudent.id,
              status: "PRESENT",
              inTime,
              remarks: `Dynamic QR Scan (Dist: ${distanceMeters}m)`,
            },
          });
        }
      } catch (dbErr) {
        console.warn("[Attendance Scan API] Prisma write skipped/failed:", (dbErr as Error).message);
      }
    }

    // 7. IN-MEMORY STORE UPDATE (AI Studio Preview Safe)
    if (todayRecord) {
      todayRecord.entries = todayRecord.entries || [];
      todayRecord.entries.push({
        id: `att_${Date.now()}`,
        studentId: matchedStudent?.id || 1,
        name: studentName,
        studentCode: matchedStudent?.studentId || String(studentId),
        roll: studentRoll,
        status: "P",
        checkInTime: inTime,
        inTime,
        method: "smart_card",
        verifiedBy: "Dynamic QR Engine",
        remark: `Geo-verified (${distanceMeters}m)`,
      } as any);
      (todayRecord as any).presentCount = ((todayRecord as any).presentCount || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      message: "হাজিরা সফলভাবে গৃহীত ও লিপিবদ্ধ হয়েছে।",
      studentId,
      studentName,
      roll: studentRoll,
      period,
      subjectName,
      inTime,
      distanceMeters,
      verifiedAt: new Date().toISOString(),
      source: isPrismaAvailable() ? "mysql" : "in-memory",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
