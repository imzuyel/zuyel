import { NextRequest } from "next/server";
import { institutionalDb } from "@/lib/database";
import { extractRequestIdentity } from "@/lib/serverAuthGuard";
import { getSecurityAuditLogs } from "@/lib/rbac";
import { calculateTeacherWorkload } from "@/lib/routineEngine";
import { safePrismaQuery } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const viewParam = searchParams.get("view"); // e.g. "admin" | "teacher" | "student"
    const identity = extractRequestIdentity(req);
    const userRole = identity.userRole || "admin";
    const effectiveRole = viewParam || userRole;

    // 1. Gather live baseline metrics in parallel directly from DB & institutionalDb
    const [
      dbStudentCount,
      dbFacultyCount,
      dbNoticeCount,
      tradeGroupCounts,
      dbTrades,
      allAttendanceRecords,
      activeLiveSessionsCount,
      activeQuizzesCount,
      recentPrismaLogs,
    ] = await Promise.all([
      safePrismaQuery(async (p) => p.student.count(), institutionalDb.students.length || 0),
      safePrismaQuery(async (p) => p.faculty.count(), institutionalDb.faculty.length || 0),
      safePrismaQuery(async (p) => p.notice.count(), institutionalDb.notices.length || 0),
      safePrismaQuery(
        async (p) =>
          p.student.groupBy({
            by: ["tradeId"],
            _count: { id: true },
          }),
        []
      ),
      safePrismaQuery(
        async (p) =>
          p.trade.findMany({
            select: { id: true, code: true, name: true, nameBangla: true },
            orderBy: { id: "asc" },
          }),
        institutionalDb.trades || []
      ),
      safePrismaQuery(
        async (p) =>
          p.attendanceRecord.findMany({
            take: 60,
            orderBy: { date: "desc" },
            include: { class: true },
          }),
        institutionalDb.attendanceRecords || []
      ),
      safePrismaQuery(
        async (p) =>
          p.liveSession.count({
            where: { status: { in: ["ACTIVE", "WAITING", "IN_PROGRESS"] } },
          }),
        institutionalDb.liveSessions.filter(
          (s) => s.status === "QUESTION_ACTIVE" || s.status === "LOBBY" || s.status === "STARTING"
        ).length
      ),
      safePrismaQuery(
        async (p) =>
          p.quiz.count({
            where: { status: "ACTIVE" },
          }),
        institutionalDb.quizzes.filter(
          (q) => (q.status as string) === "published" || (q.status as string) === "active"
        ).length
      ),
      safePrismaQuery(
        async (p) =>
          p.securityAuditEntry.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
          }),
        []
      ),
    ]);

    const totalStudents = dbStudentCount;
    const totalFaculty = dbFacultyCount > 0 ? dbFacultyCount : (institutionalDb.faculty.length || 0);
    const totalNotices = dbNoticeCount;
    const activeExams = institutionalDb.exams.filter((e) => e.status === "Published" || e.status === "Ongoing");
    const activeLiveQuizzesCountTotal = activeLiveSessionsCount + activeQuizzesCount;

    // 2. Dynamic Trade Distribution from Database
    const tradeColorPalette: Record<string, string> = {
      "IT-IoT": "#06b6d4",
      "GE": "#3b82f6",
      "EE": "#f59e0b",
      "AMB": "#ec4899",
      "GEN": "#8b5cf6",
    };

    const tradeDistribution: Array<{
      id: number;
      name: string;
      nameEn: string;
      code: string;
      students: number;
      color: string;
    }> = [];

    // Map trades with specific student counts
    for (const t of dbTrades) {
      const match = tradeGroupCounts.find((g: any) => g.tradeId === t.id);
      const count = match ? match._count.id : 0;
      tradeDistribution.push({
        id: t.id,
        name: t.nameBangla || t.name,
        nameEn: t.name,
        code: t.code,
        students: count,
        color: tradeColorPalette[t.code] || "#10b981",
      });
    }

    // Map Class 6-8 Pre-Vocational students (where tradeId is null)
    const generalMatch = tradeGroupCounts.find((g: any) => g.tradeId === null);
    const generalCount = generalMatch ? generalMatch._count.id : 0;
    if (generalCount > 0 || tradeDistribution.length === 0) {
      tradeDistribution.push({
        id: 0,
        name: "সাধারণ ও প্রাক-ভোকেশনাল (৬ষ্ঠ-৮ম)",
        nameEn: "General & Pre-Vocational",
        code: "GEN",
        students: generalCount,
        color: tradeColorPalette["GEN"],
      });
    }

    // 3. Dynamic 7-Day Attendance Trend & Today's Calculation from Database
    const banglaDayNames = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
    const now = new Date();
    const attendanceTrend = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const dayName = banglaDayNames[d.getDay()];
      const label = i === 0 ? "আজ (সক্রিয়)" : dayName;

      // Find records for dateStr
      const dayRecords = allAttendanceRecords.filter((r: any) => r.date === dateStr);
      if (dayRecords.length > 0) {
        const totalInDay = dayRecords.reduce(
          (sum: number, r: any) => sum + (r.totalCount || r.entries?.length || 0),
          0
        );
        const presentInDay = dayRecords.reduce(
          (sum: number, r: any) =>
            sum +
            (r.presentCount ||
              r.entries?.filter(
                (e: any) => e.status === "P" || e.status === "PRESENT" || e.status === "L"
              ).length ||
              0),
          0
        );
        const absentInDay = Math.max(0, totalInDay - presentInDay);
        const presentPercent = totalInDay > 0 ? Number(((presentInDay / totalInDay) * 100).toFixed(1)) : 0;

        attendanceTrend.push({
          day: label,
          date: dateStr,
          presentPercent,
          present: presentInDay,
          absent: absentInDay,
          hasData: true,
        });
      } else {
        // Strict adherence: If no data in DB for this date, show 0
        attendanceTrend.push({
          day: label,
          date: dateStr,
          presentPercent: 0,
          present: 0,
          absent: 0,
          hasData: false,
        });
      }
    }

    const todayTrend = attendanceTrend[attendanceTrend.length - 1];
    const todayAttendancePercent = todayTrend.hasData ? todayTrend.presentPercent : 0;
    const presentStudentsCount = todayTrend.hasData ? todayTrend.present : 0;
    const absentStudentsCount = todayTrend.hasData ? todayTrend.absent : 0;
    const hasRecordedToday = todayTrend.hasData;

    // 4. Dynamic Recent Institutional Activity Logs
    const rbacAuditLogs = getSecurityAuditLogs({ limit: 6 });
    const activityLogs: any[] = [];

    // Prisma Audit Entries
    for (const log of recentPrismaLogs) {
      activityLogs.push({
        id: `prisma-audit-${log.id}`,
        title: log.detailsBangla || log.actionType || "নিরাপত্তা অডিট লগ",
        desc: `${log.actorName || "সিস্টেম"} (${log.actorRole || "প্রশাসনিক"}) • ${log.routePath || "/admin"}`,
        time: log.createdAt ? new Date(log.createdAt).toLocaleTimeString("bn-BD") : "কিছুক্ষণ আগে",
        timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
        type: log.status === "BLOCKED" || log.status === "DENIED" ? "security" : "audit",
        status: log.status || "অডিট",
        badge: log.status === "BLOCKED" ? "ব্লকড" : "ভেরিফাইড",
      });
    }

    // In-memory / localStorage RBAC Logs
    for (const rlog of rbacAuditLogs) {
      if (!activityLogs.some((a) => a.id === rlog.id)) {
        activityLogs.push({
          id: rlog.id,
          title: rlog.detailsBangla || rlog.details || "নিরাপত্তা ইভেন্ট",
          desc: `${rlog.actorName} (${rlog.actorRole}) • ${rlog.routePath || "/admin"}`,
          time: rlog.timestamp ? new Date(rlog.timestamp).toLocaleTimeString("bn-BD") : "কিছুক্ষণ আগে",
          timestamp: rlog.timestamp,
          type: rlog.status === "BLOCKED" ? "security" : "audit",
          status: rlog.status || "অডিট",
          badge: rlog.status === "BLOCKED" ? "ব্লকড" : "ভেরিফাইড",
        });
      }
    }

    // Real Attendance Records
    for (const att of allAttendanceRecords.slice(0, 3)) {
      activityLogs.push({
        id: `att-record-${att.id}`,
        title: `হাজিরা রেজিস্টার সংরক্ষিত (${att.date})`,
        desc: `${att.className || "শ্রেণি"} • মোট: ${att.totalCount || 0}, উপস্থিত: ${att.presentCount || 0}`,
        time: att.updatedAt ? new Date(att.updatedAt).toLocaleTimeString("bn-BD") : "আজ",
        timestamp: att.updatedAt ? new Date(att.updatedAt).toISOString() : new Date().toISOString(),
        type: "attendance",
        status: "VERIFIED",
        badge: "হাজিরা",
      });
    }

    // Sort by newest timestamp
    activityLogs.sort(
      (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );

    // 5. Complete KPI Package
    const kpi = {
      totalStudents,
      totalFaculty,
      todayAttendancePercent,
      presentStudentsCount,
      absentStudentsCount,
      hasRecordedToday,
      activeExamsCount: activeExams.length,
      activeLiveQuizzesCount: activeLiveQuizzesCountTotal,
      totalNotices,
      serverStatus: "Operational",
    };

    // 6. Role-specific conditional responses (preserving existing endpoints)
    if (effectiveRole === "teacher" && viewParam !== "admin") {
      const teacherName = identity.userName || "মাহমুদুল হাসান";
      const workload = calculateTeacherWorkload(institutionalDb.routines, institutionalDb.faculty);
      const myRoutines = institutionalDb.routines.filter(
        (r) =>
          (r.teacherName && r.teacherName.toLowerCase().includes(teacherName.toLowerCase())) ||
          (r.teacherId && String(r.teacherId) === String(identity.userId))
      );

      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
      const currentDay = days[new Date().getDay()] || "Sunday";
      const todayClasses = myRoutines.filter((r) => r.day === currentDay);

      const teacherSummary = {
        role: "teacher",
        teacherName,
        userId: identity.userId,
        department: "কম্পিউটার ও আইওটি",
        workload: {
          weeklyClasses: myRoutines.length || 18,
          weeklyCapacity: 24,
          workloadPercent: Math.round(((myRoutines.length || 18) / 24) * 100),
          status: "Optimal Workload",
          statusBangla: "সুষম কাজের চাপ (১৮ পিরিয়ড/সপ্তাহ)",
          todayClassesCount: todayClasses.length || 4,
          todayClasses,
        },
        pendingTasks: {
          marksEntryPending: 2,
          attendancePendingToday: todayClasses.length > 0 ? 1 : 0,
          studentDoubtsPending: 4,
        },
        weakTopicAlerts: [
          { topic: "ওহমের সূত্রের গাণিতিক প্রয়োগ", trade: "ইলেকট্রিক্যাল", severity: "high", missedPercent: 38 },
          { topic: "CMOS ব্যাটারি ও বায়োস তথ্য", trade: "কম্পিউটার", severity: "medium", missedPercent: 29 },
          { topic: "রেফ্রিজারেন্ট গ্যাস প্রেসার চার্ট", trade: "আরএসি", severity: "high", missedPercent: 46 },
        ],
        kpi,
        tradeDistribution,
        attendanceTrend,
        recentAuditLogs: activityLogs.slice(0, 6),
        recentNotices: institutionalDb.notices.slice(0, 4),
        quickActions: [
          { label: "আজকের হাজিরা নিন", href: "/attendance", badge: "জরুরি", icon: "CalendarCheck" },
          { label: "মার্কস এন্ট্রি", href: "/examination", badge: "২টি বাকি", icon: "FileSpreadsheet" },
          { label: "লাইভ কুইজ শুরু করুন", href: "/quiz/live", badge: "লাইভ", icon: "Zap" },
          { label: "রুটিন দেখুন", href: "/routine", badge: "রুটিন", icon: "Clock" },
        ],
      };

      return apiSuccess(teacherSummary, {
        message: "শিক্ষক ড্যাশবোর্ড সামারি সফলভাবে প্রস্তুত হয়েছে",
      });
    }

    if (effectiveRole === "student" && viewParam !== "admin") {
      const studentSummary = {
        role: "student",
        studentName: identity.userName || "তানভীর হাসান",
        studentRoll: "১০১",
        classLevel: "১০ম শ্রেণি",
        trade: "কম্পিউটার ও আইওটি",
        attendance: {
          percentage: 92.4,
          status: "Eligible (নিয়মিত)",
          minimumRequired: 80,
          totalPresentDays: 85,
          totalWorkingDays: 92,
        },
        kpi,
        upcomingExams: activeExams.slice(0, 3),
        activeQuizzes: [
          { title: "বেসিক আইওটি ও সেন্সর টেস্ট", code: "PTSC-977653", duration: "২০ মিনিট", status: "active" },
        ],
        learningStreak: {
          currentStreakDays: 5,
          totalPoints: 1240,
          completedLessons: 18,
          rank: 4,
        },
        recentNotices: institutionalDb.notices.slice(0, 5),
        quickActions: [
          { label: "কুইজে অংশ নিন", href: "/quiz/join", badge: "চলমান", icon: "Sparkles" },
          { label: "লার্নিং হাব", href: "/learning", badge: "নতুন লেসন", icon: "BookOpen" },
          { label: "ফলাফল পোর্টাল", href: "/results", badge: "২০২৬", icon: "Award" },
        ],
      };

      return apiSuccess(studentSummary, {
        message: "শিক্ষার্থী ড্যাশবোর্ড সামারি প্রস্তুত হয়েছে",
      });
    }

    // Default: Admin / Institutional Overview
    const adminSummary = {
      role: "admin",
      institution: {
        name: institutionalDb.institution.name,
        nameBangla: institutionalDb.institution.nameBangla,
        eiin: institutionalDb.institution.eiin,
        code: institutionalDb.institution.code,
        academicYear: "2026",
      },
      kpi,
      tradeDistribution,
      attendanceTrend,
      recentAuditLogs: activityLogs.slice(0, 8),
      recentNotices: institutionalDb.notices.slice(0, 5),
      quickActions: [
        { label: "আজকের হাজিরা", href: "/attendance", count: `${todayAttendancePercent}%`, badge: "সক্রিয়" },
        { label: "মার্কস ও ফলাফল", href: "/examination", count: "১ম পর্ব", badge: "BTEB" },
        { label: "নতুন লাইভ কুইজ", href: "/quiz/live", count: "স্টুডিও", badge: "AI" },
        { label: "প্রত্যয়নপত্র ইস্যু", href: "/documents", count: "বাংলা", badge: "QR" },
        { label: "অভিভাবক SMS", href: "/communication", count: "বাল্ক", badge: "SMS" },
      ],
      timestamp: new Date().toISOString(),
    };

    return apiSuccess(adminSummary, {
      message: "ইনস্টিটিউশনাল ড্যাশবোর্ড সামারি সফলভাবে প্রস্তুত হয়েছে",
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "ড্যাশবোর্ড সামারি লোড করতে সমস্যা হয়েছে" });
  }
}
