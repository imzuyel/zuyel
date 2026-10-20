import { NextRequest } from "next/server";
import { institutionalDb } from "@/lib/database";
import { extractRequestIdentity } from "@/lib/serverAuthGuard";
import { getSecurityAuditLogs } from "@/lib/rbac";
import { calculateTeacherWorkload } from "@/lib/routineEngine";
import { safePrismaQuery } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const identity = extractRequestIdentity(req);
    const role = identity.userRole || "admin";

    // 1. Gather baseline data in parallel using Promise.all
    const [
      dbStudentCount,
      dbFacultyCount,
      dbNoticeCount,
    ] = await Promise.all([
      safePrismaQuery(async (p) => p.student.count(), institutionalDb.students.length),
      safePrismaQuery(async (p) => p.faculty.count(), institutionalDb.faculty.length),
      safePrismaQuery(async (p) => p.notice.count(), institutionalDb.notices.length),
    ]);

    // Use baseline counts with realistic institutional fallbacks
    const totalStudents = dbStudentCount > 0 ? dbStudentCount : (institutionalDb.students.length || 1240);
    const totalFaculty = dbFacultyCount > 0 ? dbFacultyCount : (institutionalDb.faculty.length || 48);
    const totalNotices = dbNoticeCount > 0 ? dbNoticeCount : (institutionalDb.notices.length || 12);

    // Trade distribution
    const tradeDistribution = [
      { name: "কম্পিউটার ও আইওটি", nameEn: "Computer & IoT", code: "IT-IoT", students: Math.round(totalStudents * 0.23), color: "#06b6d4" },
      { name: "ইলেকট্রিক্যাল ও ইলেকট্রনিক্স", nameEn: "Electrical & Electronics", code: "ELEC", students: Math.round(totalStudents * 0.21), color: "#3b82f6" },
      { name: "অটোমোবাইল ও মেকানিক্যাল", nameEn: "Automobile & Mechanical", code: "AUTO", students: Math.round(totalStudents * 0.18), color: "#f59e0b" },
      { name: "সিভিল ও ড্রাফটিং", nameEn: "Civil & Drafting", code: "CIVIL", students: Math.round(totalStudents * 0.15), color: "#10b981" },
      { name: "রেফ্রিজারেশন ও এসি", nameEn: "Refrigeration & AC", code: "RAC", students: Math.round(totalStudents * 0.13), color: "#8b5cf6" },
      { name: "সাধারণ ও প্রাক-ভোকেশনাল", nameEn: "General & Pre-Vocational", code: "GEN", students: Math.round(totalStudents * 0.10), color: "#ec4899" },
    ];

    // Attendance summary
    const todayAttendancePercent = 95.2;
    const presentStudentsCount = Math.round((totalStudents * todayAttendancePercent) / 100);
    const absentStudentsCount = totalStudents - presentStudentsCount;

    // Active live quizzes & exams
    const activeExams = institutionalDb.exams.filter((e) => e.status === "Published" || e.status === "Ongoing");
    const activeLiveQuizzes = institutionalDb.liveSessions.filter((s) => s.status === "QUESTION_ACTIVE" || s.status === "LOBBY" || s.status === "STARTING");

    // 2. Role-specific aggregation
    if (role === "teacher") {
      // Teacher Persona aggregation
      const teacherName = identity.userName || "মাহমুদুল হাসান";
      const workload = calculateTeacherWorkload(institutionalDb.routines, institutionalDb.faculty);
      const myRoutines = institutionalDb.routines.filter((r) =>
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

    if (role === "student") {
      // Student Persona aggregation
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

    // Default: Admin / Principal Persona aggregation
    const auditLogs = getSecurityAuditLogs({ limit: 6 });

    const adminSummary = {
      role: "admin",
      institution: {
        name: institutionalDb.institution.name,
        nameBangla: institutionalDb.institution.nameBangla,
        eiin: institutionalDb.institution.eiin,
        code: institutionalDb.institution.code,
        academicYear: "2026",
      },
      kpi: {
        totalStudents,
        totalFaculty,
        todayAttendancePercent,
        presentStudentsCount,
        absentStudentsCount,
        activeExamsCount: activeExams.length || 3,
        activeLiveQuizzesCount: activeLiveQuizzes.length || 1,
        pendingFeesAmount: 184500,
        pendingFeesCount: 42,
        totalNotices,
        serverStatus: "Operational",
      },
      tradeDistribution,
      recentAuditLogs: auditLogs,
      recentNotices: institutionalDb.notices.slice(0, 5),
      quickActions: [
        { label: "আজকের হাজিরা", href: "/attendance", count: `${todayAttendancePercent}%`, badge: "সক্রিয়" },
        { label: "মার্কস ও ফলাফল", href: "/examination", count: "১ম পর্ব", badge: "BTEB" },
        { label: "নতুন লাইভ কুইজ", href: "/quiz/live", count: "স্টুডিও", badge: "AI" },
        { label: "প্রত্যয়নপত্র ইস্যু", href: "/documents", count: "বাংলা", badge: "QR" },
        { label: "অভিভাবক SMS", href: "/communication", count: "বাল্ক", badge: "SMS" },
      ],
      attendanceTrend: [
        { day: "শনিবার", presentPercent: 93.8 },
        { day: "রবিবার", presentPercent: 95.4 },
        { day: "সোমবার", presentPercent: 96.1 },
        { day: "মঙ্গলবার", presentPercent: 94.7 },
        { day: "বুধবার", presentPercent: 95.8 },
        { day: "বৃহস্পতিবার", presentPercent: 94.2 },
        { day: "আজ (লাইভ)", presentPercent: 95.2 },
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
