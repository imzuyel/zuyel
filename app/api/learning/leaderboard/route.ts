import { NextRequest, NextResponse } from "next/server";
import { isPrismaAvailable, safePrismaQuery } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classFilter = searchParams.get("class") || "all";
    const tradeFilter = searchParams.get("trade") || "all";

    if (!isPrismaAvailable()) {
      return NextResponse.json({
        success: true,
        count: 0,
        leaderboard: [],
      });
    }

    // 1. Fetch real student item progress records from MySQL
    const dbProgress = await safePrismaQuery(async (p) => {
      return await p.studentItemProgress.findMany({
        include: {
          item: {
            include: {
              chapter: {
                include: {
                  course: true,
                },
              },
            },
          },
        },
      });
    }, []);

    // 2. Fetch real students from MySQL for profile details
    const dbStudents = await safePrismaQuery(async (p) => {
      return await p.student.findMany({
        include: {
          class: true,
          trade: true,
        },
      });
    }, []);

    const studentMapByRoll = new Map<string, any>();
    for (const s of dbStudents || []) {
      studentMapByRoll.set(String(s.roll), s);
      if (s.studentId) studentMapByRoll.set(String(s.studentId), s);
    }

    // 3. Aggregate performance by studentRoll
    const studentAggregates: Record<
      string,
      {
        studentRoll: string;
        studentName: string;
        classLevel: string;
        classLabel: string;
        trade: string;
        tradeLabel: string;
        quizzesTaken: number;
        totalXp: number;
        scores: number[];
        starsEarned: number;
        avatarUrl?: string;
      }
    > = {};

    for (const progress of dbProgress || []) {
      const roll = String(progress.studentRoll || "").trim();
      if (!roll) continue;

      if (!studentAggregates[roll]) {
        const studentProfile = studentMapByRoll.get(roll);
        const course = progress.item?.chapter?.course;
        const clsNumeric = studentProfile?.class?.numericValue || course?.numericClass || 9;
        const clsLabel = studentProfile?.class?.nameBangla || course?.className || `${clsNumeric}ম শ্রেণি`;
        const tradeCode = studentProfile?.trade?.code || course?.tradeCode || "General";
        const tradeName = studentProfile?.trade?.nameBangla || course?.tradeName || "সাধারণ";

        studentAggregates[roll] = {
          studentRoll: roll,
          studentName: studentProfile?.nameBangla || studentProfile?.name || progress.studentName || `শিক্ষার্থী (${roll})`,
          classLevel: `class-${clsNumeric}`,
          classLabel: clsLabel,
          trade: tradeCode,
          tradeLabel: tradeName,
          quizzesTaken: 0,
          totalXp: 0,
          scores: [],
          starsEarned: 0,
          avatarUrl: studentProfile?.photoUrl || undefined,
        };
      }

      studentAggregates[roll].totalXp += progress.xpEarned || 0;
      studentAggregates[roll].starsEarned += progress.stars || 0;

      if (progress.item?.itemType === "QUIZ" || progress.bestScore > 0) {
        studentAggregates[roll].quizzesTaken += progress.attemptsCount || 1;
        studentAggregates[roll].scores.push(progress.bestScore || 0);
      }
    }

    // Also include any registered students who have not yet taken quizzes (score: 0)
    for (const s of dbStudents || []) {
      const roll = String(s.roll);
      if (!studentAggregates[roll]) {
        const clsNumeric = s.class?.numericValue || 9;
        studentAggregates[roll] = {
          studentRoll: roll,
          studentName: s.nameBangla || s.name || `শিক্ষার্থী (${roll})`,
          classLevel: `class-${clsNumeric}`,
          classLabel: s.class?.nameBangla || `${clsNumeric}ম শ্রেণি`,
          trade: s.trade?.code || "General",
          tradeLabel: s.trade?.nameBangla || "সাধারণ",
          quizzesTaken: 0,
          totalXp: 0,
          scores: [],
          starsEarned: 0,
          avatarUrl: s.photoUrl || undefined,
        };
      }
    }

    // 4. Transform into ranked leaderboard entries
    const leaderboardList = Object.values(studentAggregates).map((entry) => {
      const avgScore =
        entry.scores.length > 0
          ? Math.round(entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length)
          : 0;

      const accuracyPercentage = avgScore;
      const streakDays = Math.max(1, Math.min(30, entry.quizzesTaken));

      const badges: string[] = [];
      if (entry.totalXp >= 200) badges.push("🌟 এক্সপি মাস্টার");
      if (accuracyPercentage >= 90) badges.push("🎯 নিখুঁত স্কোরার");
      if (entry.quizzesTaken >= 5) badges.push("⚡ কুইজ নিনজা");
      if (streakDays >= 3) badges.push(`🔥 ${streakDays}-দিনের স্ট্রিক`);

      return {
        rollNumber: entry.studentRoll,
        studentName: entry.studentName,
        classLevel: entry.classLevel,
        classLabel: entry.classLabel,
        trade: entry.trade,
        tradeLabel: entry.tradeLabel,
        totalScore: entry.totalXp > 0 ? entry.totalXp : avgScore,
        quizzesTaken: entry.quizzesTaken,
        accuracyPercentage,
        streakDays,
        badges,
        avatarUrl: entry.avatarUrl,
      };
    });

    // 5. Apply filters
    const filtered = leaderboardList.filter((entry) => {
      if (classFilter !== "all") {
        const matchClass =
          entry.classLevel === classFilter ||
          entry.classLevel === `class-${classFilter}` ||
          entry.classLabel.includes(classFilter);
        if (!matchClass) return false;
      }

      if (tradeFilter !== "all") {
        const matchTrade =
          entry.trade.toLowerCase() === tradeFilter.toLowerCase() ||
          entry.tradeLabel.toLowerCase().includes(tradeFilter.toLowerCase());
        if (!matchTrade) return false;
      }

      return true;
    });

    // 6. Sort by totalScore descending and assign rank
    filtered.sort((a, b) => b.totalScore - a.totalScore || b.accuracyPercentage - a.accuracyPercentage);

    const rankedLeaderboard = filtered.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));

    return NextResponse.json({
      success: true,
      count: rankedLeaderboard.length,
      leaderboard: rankedLeaderboard,
    });
  } catch (error: any) {
    console.error("GET /api/learning/leaderboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load leaderboard data" },
      { status: 500 }
    );
  }
}
