import { NextRequest } from "next/server";
import { institutionalDb } from "@/lib/database";
import { extractRequestIdentity } from "@/lib/serverAuthGuard";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { ALL_TRADES } from "@/lib/academicStructure";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get("q") || "";
    const typeFilter = searchParams.get("type") || "all";
    const limitPerGroup = Math.min(10, Math.max(1, Number(searchParams.get("limit") || 5)));

    // 1. Sanitize query string
    const query = rawQuery
      .replace(/[<>{}[\]\\\/]/g, "")
      .trim()
      .toLowerCase()
      .slice(0, 80);

    if (!query || query.length < 1) {
      return apiSuccess([], {
        extraKeys: { results: [], categorized: {} },
        message: "অনুসন্ধান করতে অন্তত ১টি অক্ষর লিখুন",
      });
    }

    // 2. Check identity for privacy protection
    const identity = extractRequestIdentity(req);
    const isAuthenticated = identity.isAuthenticated;
    const isStaffOrAdmin =
      identity.userRole === "super_admin" ||
      identity.userRole === "admin" ||
      identity.userRole === "principal" ||
      identity.userRole === "vice_principal" ||
      identity.userRole === "teacher";

    const categorized: Record<string, any[]> = {
      students: [],
      faculty: [],
      notices: [],
      subjects: [],
      quizzes: [],
      navigation: [],
    };

    // 3. Search Students (PROTECTED: Only authenticated staff/admin can search student PII)
    if ((typeFilter === "all" || typeFilter === "student" || typeFilter === "students") && isStaffOrAdmin) {
      const matchedStudents = institutionalDb.students
        .filter((s) => {
          const nameMatch = s.name?.toLowerCase().includes(query);
          const idMatch = s.studentId?.toLowerCase().includes(query);
          const rollMatch = String(s.roll || "").includes(query);
          const regMatch = s.birthRegNo?.toLowerCase().includes(query);
          return nameMatch || idMatch || rollMatch || regMatch;
        })
        .slice(0, limitPerGroup)
        .map((s) => ({
          id: `stu-${s.id}`,
          type: "student",
          category: "শিক্ষার্থী",
          title: s.name,
          subtitle: `${s.className} (${s.section || "ক"}) • রোল: ${s.roll} • ট্রেড: ${s.tradeName || "সাধারণ"}`,
          link: `/admin?tab=students&id=${s.id}`,
          badge: s.status === "Active" ? "নিয়মিত" : "অন্যান্য",
        }));
      categorized.students = matchedStudents;
    }

    // 4. Search Faculty & Staff (Public Directory)
    if (typeFilter === "all" || typeFilter === "faculty" || typeFilter === "teacher") {
      const matchedFaculty = institutionalDb.faculty
        .filter((f) => {
          const name = f.name?.toLowerCase().includes(query);
          const nameBn = f.nameBangla?.toLowerCase().includes(query);
          const dept = f.department?.toLowerCase().includes(query);
          const desig = f.designation?.toLowerCase().includes(query);
          return name || nameBn || dept || desig;
        })
        .slice(0, limitPerGroup)
        .map((f) => ({
          id: `fac-${f.id}`,
          type: "faculty",
          category: "শিক্ষক ও কর্মকর্তা",
          title: f.nameBangla || f.name,
          subtitle: `${f.designation} • ${f.department}`,
          link: `/faculty?id=${f.id}`,
          badge: f.type === "faculty" ? "শিক্ষক" : "কর্মকর্তা",
        }));
      categorized.faculty = matchedFaculty;
    }

    // 5. Search Notices
    if (typeFilter === "all" || typeFilter === "notice" || typeFilter === "notices") {
      const matchedNotices = institutionalDb.notices
        .filter((n) => {
          const title = n.title?.toLowerCase().includes(query);
          const titleBn = n.titleBangla?.toLowerCase().includes(query);
          const content = n.content?.toLowerCase().includes(query);
          const cat = n.category?.toLowerCase().includes(query);
          return title || titleBn || content || cat;
        })
        .slice(0, limitPerGroup)
        .map((n) => ({
          id: `not-${n.id}`,
          type: "notice",
          category: "নোটিশ",
          title: n.titleBangla || n.title,
          subtitle: `${n.publishedAt} • ${n.categoryBangla || "সাধারণ"}`,
          link: `/notices/${n.id}`,
          badge: n.isUrgent ? "জরুরি" : undefined,
        }));
      categorized.notices = matchedNotices;
    }

    // 6. Search Subjects & Trades
    if (typeFilter === "all" || typeFilter === "subject" || typeFilter === "trade") {
      const matchedTrades = ALL_TRADES.filter((t) =>
        t.name.toLowerCase().includes(query) ||
        t.nameBangla.toLowerCase().includes(query) ||
        t.code.toLowerCase().includes(query)
      ).slice(0, 3).map((t) => ({
        id: `trade-${t.code}`,
        type: "trade",
        category: "ট্রেড ও কারিকুলাম",
        title: t.nameBangla,
        subtitle: `ট্রেড কোড: ${t.code} • স্তর: ${t.level}`,
        link: `/academic?trade=${t.code}`,
        badge: "BTEB",
      }));

      categorized.subjects = matchedTrades;
    }

    // 7. Search Quizzes & Live Sessions
    if (typeFilter === "all" || typeFilter === "quiz" || typeFilter === "quizzes") {
      const matchedQuizzes = institutionalDb.liveSessions
        .filter((q) => {
          const codeMatch = q.sessionCode?.toLowerCase().includes(query);
          const pinMatch = q.pinCode?.toLowerCase().includes(query);
          return codeMatch || pinMatch;
        })
        .slice(0, limitPerGroup)
        .map((q) => ({
          id: `quiz-${q.id}`,
          type: "quiz",
          category: "লাইভ কুইজ",
          title: `লাইভ কুইজ সেশন (${q.sessionCode})`,
          subtitle: `রুম পিন: ${q.pinCode || q.sessionCode} • স্ট্যাটাস: ${q.status}`,
          link: `/quiz/live?pin=${q.pinCode || q.sessionCode}`,
          badge: q.status === "QUESTION_ACTIVE" ? "চলমান" : "প্রস্তুত",
        }));
      categorized.quizzes = matchedQuizzes;
    }

    // 8. Flatten into single combined results array
    const combinedResults = [
      ...categorized.students,
      ...categorized.faculty,
      ...categorized.notices,
      ...categorized.subjects,
      ...categorized.quizzes,
    ];

    return apiSuccess(combinedResults, {
      extraKeys: {
        results: combinedResults,
        categorized,
        totalFound: combinedResults.length,
        query,
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "অনুসন্ধান প্রক্রিয়ায় সমস্যা হয়েছে" });
  }
}
