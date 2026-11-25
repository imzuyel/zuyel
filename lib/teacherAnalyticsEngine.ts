import { getHybridStore, HybridStudent } from "./hybridStorageEngine";
import { isPrismaAvailable, safePrismaQuery } from "./prisma";
import { doesClassHaveTrade } from "./academicStructure";
import { chapterLearningStore } from "./chapterLearningEngine";
import { normalizeTradeForMatching, resolveStudentIdentity } from "./studentEntityResolver";

export interface TeacherAnalyticsFilters {
  className?: string;
  trade?: string;
  subject?: string;
}

export interface WeakTopicItem {
  id: string;
  topic: string;
  subject: string;
  class: string;
  trade: string;
  failureRate: number;
  accuracy: number;
  studentCount: number;
  attemptsCount: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
  recommendation: string;
  sampleQuestions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>;
}

export interface AtRiskStudent {
  id: string;
  studentId: string;
  name: string;
  roll: number;
  className: string;
  trade: string;
  phone: string;
  guardianPhone: string;
  attendanceRate: number;
  avgScore: number;
  issue: string;
  severity: "HIGH" | "MEDIUM";
  primaryWeakTopic: string;
  lastActive: string;
  recommendedAction: string;
}

export interface TopPerformer {
  id: string;
  name: string;
  roll: number;
  className: string;
  trade: string;
  avgScore: number;
  attendanceRate: number;
  rank: number;
}

export interface StudentMatrixRecord {
  id: string;
  studentId: string;
  name: string;
  roll: number;
  className: string;
  trade: string;
  avatarUrl?: string;
  phone: string;
  guardianPhone: string;
  attendanceRate: number;
  avgScore: number;
  category: "TOP_PERFORMER" | "STEADY_LEARNER" | "AT_RISK";
  categoryLabel: string;
  primaryWeakTopic: string;
  weakestSubject: string;
  lastActive: string;
  recommendedAction: string;
}

export interface TeacherAnalyticsData {
  overallAverageScore: number;
  totalQuizzesEvaluated: number;
  totalStudentsEnrolled: number;
  totalStudentsParticipated: number;
  overallParticipationRatePercentage: number;
  overallLessonCompletionRatePercentage: number;
  totalWeakTopicsTracked: number;
  activeRemedialLessonsCount: number;
  availableSubjects: string[];
  classesBreakdown: any[];
  weakTopics: WeakTopicItem[];
  atRiskStudents: AtRiskStudent[];
  topPerformers: TopPerformer[];
  steadyLearners: StudentMatrixRecord[];
  studentMatrix: StudentMatrixRecord[];
  lessonCompletions: any[];
  frequentlyMissedConcepts: any[];
  commonMistakes: any[];
  timestamp: string;
}

function extractNumericClass(val?: string | number | null): number | null {
  if (val === undefined || val === null) return null;
  const s = String(val)
    .toLowerCase()
    .replace(/৬/g, "6")
    .replace(/৭/g, "7")
    .replace(/৮/g, "8")
    .replace(/৯/g, "9")
    .replace(/১০/g, "10")
    .replace(/১১/g, "11")
    .replace(/১২/g, "12");
  const m = s.match(/\b(6|7|8|9|10|11|12)\b/);
  if (m) return Number(m[1]);
  if (s.includes("six")) return 6;
  if (s.includes("seven")) return 7;
  if (s.includes("eight")) return 8;
  if (s.includes("nine")) return 9;
  if (s.includes("ten")) return 10;
  if (s.includes("eleven")) return 11;
  if (s.includes("twelve")) return 12;
  return null;
}

function matchesFilters(
  itemClass: string | number | undefined,
  itemTrade: string | undefined,
  itemSubject: string | undefined,
  filters?: TeacherAnalyticsFilters
): boolean {
  if (!filters) return true;

  const filterNumCls =
    filters.className && filters.className !== "all"
      ? extractNumericClass(filters.className)
      : null;

  if (filters.className && filters.className !== "all") {
    const itemNumCls = extractNumericClass(itemClass);
    if (filterNumCls !== null && itemNumCls !== null) {
      if (filterNumCls !== itemNumCls) return false;
    } else if (
      itemClass &&
      !String(itemClass).toLowerCase().includes(filters.className.toLowerCase())
    ) {
      return false;
    }
  }

  // Class 6-8 has NO Trade/Department: skip trade filter
  const classAllowsTrade = filterNumCls === null || doesClassHaveTrade(filterNumCls);
  if (classAllowsTrade && filters.trade && filters.trade !== "all") {
    const reqTrade = normalizeTradeForMatching(filters.trade);
    const curTrade = normalizeTradeForMatching(itemTrade);
    if (
      curTrade &&
      reqTrade &&
      curTrade !== reqTrade &&
      !String(itemTrade || "")
        .toLowerCase()
        .includes(filters.trade.toLowerCase())
    ) {
      return false;
    }
  }

  if (filters.subject && filters.subject !== "all") {
    if (
      itemSubject &&
      !String(itemSubject).toLowerCase().includes(filters.subject.toLowerCase())
    ) {
      return false;
    }
  }

  return true;
}

export async function getTeacherAnalytics(
  filters?: TeacherAnalyticsFilters
): Promise<TeacherAnalyticsData> {
  const store = getHybridStore();
  const allStudents: HybridStudent[] = Array.isArray(store.students) ? store.students : [];
  const filteredStudents = allStudents.filter((s) =>
    matchesFilters(s.className || s.classId, s.trade, undefined, filters)
  );

  // Pull real optional Prisma records ONLY when DB circuit breaker reports online
  const prismaItemProgress = isPrismaAvailable()
    ? await safePrismaQuery<any[]>(
        (p) =>
          p.studentItemProgress.findMany({
            include: {
              item: {
                include: {
                  chapter: { include: { course: true } },
                },
              },
            },
          }),
        []
      )
    : [];

  // Map courses & content items by ID for fast metadata lookup
  const allCourses = chapterLearningStore.getAllCourses();
  const itemMetaMap = new Map<
    number,
    { itemTitle: string; itemType: string; chapterTitle: string; subject: string; className: string; trade: string }
  >();
  const courseSubjectSet = new Set<string>();
  for (const c of allCourses) {
    if (c.subjectName || c.titleBangla) courseSubjectSet.add(c.subjectName || c.titleBangla);
    for (const ch of c.chapters || []) {
      for (const it of ch.items || []) {
        itemMetaMap.set(Number(it.id), {
          itemTitle: it.titleBangla || it.title,
          itemType: it.itemType,
          chapterTitle: ch.titleBangla || ch.title,
          subject: c.subjectName || c.titleBangla || c.title,
          className: c.className || `Class ${c.numericClass || 9}`,
          trade:
            c.numericClass && !doesClassHaveTrade(c.numericClass)
              ? "General"
              : c.tradeName || c.tradeCode || "General",
        });
      }
    }
  }

  // Build real per-student metrics from Attendance, Chapter Quizzes, Live Sessions & Mistake Bank
  const attendanceStatsByStudent = new Map<string, { present: number; total: number }>();
  for (const rec of store.attendanceRecords || []) {
    const entries = Array.isArray(rec.entries) ? rec.entries : [];
    for (const ent of entries) {
      const key = String(ent.studentId || ent.roll || "").trim();
      if (!key) continue;
      const cur = attendanceStatsByStudent.get(key) || { present: 0, total: 0 };
      cur.total += 1;
      if (ent.status === "PRESENT" || ent.status === "LATE") {
        cur.present += 1;
      }
      attendanceStatsByStudent.set(key, cur);
    }
  }

  const quizScoresByRoll = new Map<string, number[]>();
  const completedLessonsByRoll = new Map<string, number>();
  const totalLessonsAssigned = Math.max(
    1,
    allCourses.reduce(
      (acc, c) =>
        acc + (c.chapters || []).reduce((ca, ch) => ca + (ch.items || []).length, 0),
      0
    )
  );

  type TopicAccumulator = {
    topic: string;
    subject: string;
    className: string;
    trade: string;
    totalAttempts: number;
    correctWeight: number;
    wrongStudents: Set<string>;
    latestQuestions: any[];
  };
  const topicBuckets = new Map<string, TopicAccumulator>();

  const upsertTopicScore = (
    topicName: string,
    subject: string,
    cls: string,
    trade: string,
    studentRoll: string,
    accuracyPct: number,
    isWrongAttempt: boolean
  ) => {
    if (!matchesFilters(cls, trade, subject, filters)) return;
    if (subject) courseSubjectSet.add(subject);
    const key = `${topicName.trim().toLowerCase()}::${extractNumericClass(cls) || cls}`;
    const bucket = topicBuckets.get(key) || {
      topic: topicName,
      subject: subject || topicName,
      className: cls || "Class 9",
      trade: trade || "General",
      totalAttempts: 0,
      correctWeight: 0,
      wrongStudents: new Set<string>(),
      latestQuestions: [],
    };
    bucket.totalAttempts += 1;
    bucket.correctWeight += Math.max(0, Math.min(100, accuracyPct)) / 100;
    if (isWrongAttempt || accuracyPct < 75) {
      bucket.wrongStudents.add(studentRoll);
    }
    topicBuckets.set(key, bucket);
  };

  let totalQuizzesEvaluated = 0;
  let totalQuizAccuracySum = 0;

  // Merge Hybrid Chapter Progress + Prisma Progress
  const seenProgressKeys = new Set<string>();
  const hybridProgMap = store.learningProgress || {};
  for (const [rollKey, list] of Object.entries(hybridProgMap)) {
    for (const p of Array.isArray(list) ? list : []) {
      const dedupeKey = `${rollKey}::${p.itemId}`;
      seenProgressKeys.add(dedupeKey);
      const meta = itemMetaMap.get(Number(p.itemId));
      const cls = meta?.className || "Class 9";
      const trade = meta?.trade || "General";
      const subject = meta?.subject || "কারিগরি শিক্ষা";
      if (!matchesFilters(cls, trade, subject, filters)) continue;

      if (p.status === "COMPLETED" || p.isPassed) {
        completedLessonsByRoll.set(rollKey, (completedLessonsByRoll.get(rollKey) || 0) + 1);
      }

      if (meta?.itemType === "QUIZ" || p.lastScore !== undefined || p.bestScore !== undefined) {
        const score = Number(p.lastScore ?? p.bestScore ?? 0);
        const listScores = quizScoresByRoll.get(rollKey) || [];
        listScores.push(score);
        quizScoresByRoll.set(rollKey, listScores);
        totalQuizzesEvaluated += 1;
        totalQuizAccuracySum += score;

        upsertTopicScore(
          meta?.itemTitle || `কুইজ #${p.itemId}`,
          subject,
          cls,
          trade,
          rollKey,
          score,
          score < 60
        );
      }
    }
  }

  for (const p of prismaItemProgress || []) {
    const rollKey = String(p.studentRoll || "");
    const dedupeKey = `${rollKey}::${p.itemId}`;
    if (seenProgressKeys.has(dedupeKey)) continue;
    const item = p.item;
    const course = item?.chapter?.course;
    const cls = course?.className || "Class 9";
    const trade = course?.tradeName || "General";
    const subject = course?.subjectName || course?.titleBangla || "কারিগরি শিক্ষা";
    if (!matchesFilters(cls, trade, subject, filters)) continue;

    if (p.status === "COMPLETED" || p.isPassed) {
      completedLessonsByRoll.set(rollKey, (completedLessonsByRoll.get(rollKey) || 0) + 1);
    }

    const score = Number(p.lastScore ?? p.bestScore ?? 0);
    const listScores = quizScoresByRoll.get(rollKey) || [];
    listScores.push(score);
    quizScoresByRoll.set(rollKey, listScores);
    totalQuizzesEvaluated += 1;
    totalQuizAccuracySum += score;

    upsertTopicScore(
      item?.titleBangla || item?.title || `কুইজ #${p.itemId}`,
      subject,
      cls,
      trade,
      rollKey,
      score,
      score < 60
    );
  }

  // Merge Live Quiz Sessions from Hybrid Store
  const liveSessionsMap = store.liveSessions || {};
  for (const session of Object.values(liveSessionsMap)) {
    if (!session || typeof session !== "object") continue;
    const sClass = session.className || "Class 9";
    const sTrade = session.trade || "General";
    const sSubject = session.subjectName || session.subject || session.title || "লাইভ কুইজ";
    if (!matchesFilters(sClass, sTrade, sSubject, filters)) continue;

    const slides = Array.isArray(session.slides) ? session.slides : [];
    const answersBySlide = session.answers || {};

    for (const [slideIdxStr, playerAnswers] of Object.entries(answersBySlide)) {
      const slideIdx = Number(slideIdxStr);
      const slide = slides[slideIdx];
      const topicLabel = slide?.topic || slide?.title || session.title || sSubject;
      for (const [pId, ans] of Object.entries((playerAnswers as Record<string, any>) || {})) {
        const player = session.players?.[pId];
        const rollKey = String(player?.roll && player.roll !== "—" ? player.roll : pId);
        const pct = ans?.isCorrect ? 100 : 0;
        const arr = quizScoresByRoll.get(rollKey) || [];
        arr.push(pct);
        quizScoresByRoll.set(rollKey, arr);
        totalQuizzesEvaluated += 1;
        totalQuizAccuracySum += pct;
        upsertTopicScore(topicLabel, sSubject, sClass, sTrade, rollKey, pct, !ans?.isCorrect);
      }
    }
  }

  // Merge Mistake Bank entries for accurate failure tracking & common mistakes
  const mistakes = (store.mistakeBank || []).filter((m) =>
    matchesFilters(m.className, m.trade, m.subject || m.topic, filters)
  );
  const weakTopicByStudentRoll = new Map<string, string>();
  const commonMistakeCounter = new Map<
    string,
    { question: string; topic: string; count: number; correctAnswer: string }
  >();

  for (const m of mistakes) {
    if (!weakTopicByStudentRoll.has(String(m.studentRoll))) {
      weakTopicByStudentRoll.set(String(m.studentRoll), m.topic || m.sourceTitle || "অধ্যায়ভিত্তিক কুইজ");
    }
    // Register into topic buckets only if not already counted exclusively via progress
    upsertTopicScore(
      m.topic || m.sourceTitle || m.questionText.slice(0, 48),
      m.subject || m.topic || "সাধারণ",
      m.className,
      m.trade,
      String(m.studentRoll),
      0,
      true
    );

    const qKey = m.questionText.trim();
    const cur = commonMistakeCounter.get(qKey) || {
      question: m.questionText,
      topic: m.topic || m.sourceTitle || "কুইজ",
      count: 0,
      correctAnswer: m.correctAnswer,
    };
    cur.count += m.wrongCount || 1;
    commonMistakeCounter.set(qKey, cur);
  }

  // Finalize WeakTopics with strict bands: <55% HIGH, 55-75% MEDIUM, >75% LOW
  const weakTopics: WeakTopicItem[] = Array.from(topicBuckets.values())
    .map((b, idx) => {
      const accuracy =
        b.totalAttempts > 0 ? Math.round((b.correctWeight / b.totalAttempts) * 100) : 0;
      const failureRate = Math.max(0, 100 - accuracy);
      const severity: "HIGH" | "MEDIUM" | "LOW" =
        accuracy < 55 ? "HIGH" : accuracy <= 75 ? "MEDIUM" : "LOW";

      const recommendation =
        severity === "HIGH"
          ? `'${b.topic}' বিষয়ে শিক্ষার্থীদের সঠিক উত্তরের হার মাত্র ${accuracy}%। ক্লাসে ১৫ মিনিটের রিভিউ এবং রিমেডিয়াল কুইজ নেওয়া জরুরি।`
          : severity === "MEDIUM"
          ? `'${b.topic}' বিষয়ে মাঝারি দুর্বলতা রয়েছে (${accuracy}% নির্ভুলতা)। অনুশীলন শিট ও উদাহরণ পুনরায় দেখান।`
          : `'${b.topic}' বিষয়ে শিক্ষার্থীরা ভালো দক্ষতা অর্জন করেছে (${accuracy}% নির্ভুলতা)।`;

      return {
        id: `wt-${idx + 1}`,
        topic: b.topic,
        subject: b.subject,
        class: b.className,
        trade: doesClassHaveTrade(extractNumericClass(b.className) || 9) ? b.trade : "General",
        failureRate,
        accuracy,
        studentCount: b.wrongStudents.size,
        attemptsCount: b.totalAttempts,
        severity,
        recommendation,
        sampleQuestions: [],
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);

  // Build Student Matrix, At-Risk Students (<70% attendance OR <45% avg quiz accuracy), & Top Performers
  const studentMatrix: StudentMatrixRecord[] = [];
  const atRiskStudents: AtRiskStudent[] = [];
  const participatedRolls = new Set<string>();

  for (const s of filteredStudents) {
    const rollStr = String(s.roll);
    const attStat = attendanceStatsByStudent.get(s.id) || attendanceStatsByStudent.get(rollStr);
    const attendanceRate = attStat && attStat.total > 0
      ? Math.round((attStat.present / attStat.total) * 100)
      : Number(s.attendanceRate ?? 0);

    const studentScores = quizScoresByRoll.get(rollStr) || quizScoresByRoll.get(s.studentId) || [];
    const hasQuizAttempts = studentScores.length > 0;
    if (hasQuizAttempts) participatedRolls.add(rollStr);

    const avgScore = hasQuizAttempts
      ? Math.round(studentScores.reduce((sum, v) => sum + v, 0) / studentScores.length)
      : Number(s.avgScore ?? 0);

    const primaryWeak =
      weakTopicByStudentRoll.get(rollStr) ||
      (avgScore < 45 ? "কুইজ নির্ভুলতা বাড়ানো প্রয়োজন" : "স্বাভাবিক অগ্রগতি");

    const isLowAttendance = attendanceRate < 70;
    const isLowQuizAccuracy = hasQuizAttempts ? avgScore < 45 : (s.avgScore > 0 && s.avgScore < 45);
    const isAtRisk = isLowAttendance || isLowQuizAccuracy;

    let category: "TOP_PERFORMER" | "STEADY_LEARNER" | "AT_RISK" = "STEADY_LEARNER";
    let categoryLabel = "নিয়মিত শিক্ষার্থী (Steady)";
    if (isAtRisk) {
      category = "AT_RISK";
      categoryLabel = "ঝুঁকিপূর্ণ (At-Risk)";
    } else if (avgScore >= 75 && attendanceRate >= 75) {
      category = "TOP_PERFORMER";
      categoryLabel = "সেরা পারফর্মার (Top)";
    }

    const guardianPhone = s.guardianMobile || "";
    const numCls = extractNumericClass(s.className || s.classId);
    const displayTrade = numCls !== null && !doesClassHaveTrade(numCls) ? "সাধারণ (General)" : s.trade;

    const record: StudentMatrixRecord = {
      id: s.id,
      studentId: s.studentId,
      name: s.nameBangla || s.name,
      roll: s.roll,
      className: s.className,
      trade: displayTrade,
      avatarUrl: s.avatar,
      phone: guardianPhone,
      guardianPhone,
      attendanceRate,
      avgScore,
      category,
      categoryLabel,
      primaryWeakTopic: primaryWeak,
      weakestSubject: primaryWeak,
      lastActive: "আজকে",
      recommendedAction: isAtRisk ? "অভিভাবকের সাথে যোগাযোগ ও রিমেডিয়াল সাপোর্ট" : "স্বাভাবিক অনুশীলন",
    };

    studentMatrix.push(record);

    if (isAtRisk) {
      const reasons: string[] = [];
      if (isLowAttendance) reasons.push(`কম উপস্থিতি (${attendanceRate}%)`);
      if (isLowQuizAccuracy) reasons.push(`কুইজ নির্ভুলতা কম (${avgScore}%)`);

      atRiskStudents.push({
        id: s.id,
        studentId: s.studentId,
        name: s.nameBangla || s.name,
        roll: s.roll,
        className: s.className,
        trade: displayTrade,
        phone: guardianPhone,
        guardianPhone,
        attendanceRate,
        avgScore,
        issue: reasons.join(" ও ") || "অতিরিক্ত সহায়তা প্রয়োজন",
        severity: attendanceRate < 60 || avgScore < 35 ? "HIGH" : "MEDIUM",
        primaryWeakTopic: primaryWeak,
        lastActive: "সাম্প্রতিক",
        recommendedAction: "অভিভাবককে SMS অ্যালার্ট ও রিমেডিয়াল কুইজ বরাদ্দ করুন",
      });
    }
  }

  atRiskStudents.sort((a, b) => a.attendanceRate + a.avgScore - (b.attendanceRate + b.avgScore));

  const topPerformers: TopPerformer[] = studentMatrix
    .filter((s) => s.category === "TOP_PERFORMER")
    .sort((a, b) => b.avgScore + b.attendanceRate - (a.avgScore + a.attendanceRate))
    .slice(0, 12)
    .map((s, idx) => ({
      id: s.id,
      name: s.name,
      roll: s.roll,
      className: s.className,
      trade: s.trade,
      avgScore: s.avgScore,
      attendanceRate: s.attendanceRate,
      rank: idx + 1,
    }));

  const steadyLearners = studentMatrix.filter((s) => s.category === "STEADY_LEARNER");

  // Group real Class & Trade breakdown from filteredStudents
  const breakdownMap = new Map<
    string,
    {
      classLabel: string;
      tradeLabel: string;
      studentCount: number;
      scoreSum: number;
      scoreCount: number;
      attSum: number;
      completedSum: number;
    }
  >();

  for (const s of filteredStudents) {
    const numCls = extractNumericClass(s.className || s.classId);
    const tradeLabel =
      numCls !== null && !doesClassHaveTrade(numCls) ? "সাধারণ (General)" : s.trade || "কারিগরি";
    const key = `${s.className}::${tradeLabel}`;
    const entry = breakdownMap.get(key) || {
      classLabel: s.className,
      tradeLabel,
      studentCount: 0,
      scoreSum: 0,
      scoreCount: 0,
      attSum: 0,
      completedSum: 0,
    };
    entry.studentCount += 1;
    const mat = studentMatrix.find((m) => m.id === s.id);
    if (mat) {
      entry.attSum += mat.attendanceRate;
      if (mat.avgScore > 0) {
        entry.scoreSum += mat.avgScore;
        entry.scoreCount += 1;
      }
    }
    entry.completedSum += completedLessonsByRoll.get(String(s.roll)) || 0;
    breakdownMap.set(key, entry);
  }

  const classesBreakdown = Array.from(breakdownMap.values()).map((b) => {
    const avgAccuracy = b.scoreCount > 0 ? Math.round(b.scoreSum / b.scoreCount) : 0;
    const avgAtt = b.studentCount > 0 ? Math.round(b.attSum / b.studentCount) : 0;
    const status = avgAccuracy >= 75 ? "excellent" : avgAccuracy >= 55 ? "good" : "needs_attention";
    const relatedWeak = weakTopics
      .filter((w) => w.class.toLowerCase().includes(b.classLabel.toLowerCase().replace("class ", "")))
      .slice(0, 2)
      .map((w) => ({ topic: w.topic, missedRate: w.failureRate }));

    return {
      classLabel: b.classLabel,
      tradeLabel: b.tradeLabel,
      studentCount: b.studentCount,
      avgAccuracy,
      avgAttendance: avgAtt,
      status,
      topWeakTopics: relatedWeak,
    };
  });

  // Overall real KPI calculations (0 dummy defaults!)
  const totalStudentsEnrolled = filteredStudents.length;
  const totalStudentsParticipated = participatedRolls.size;
  const overallParticipationRatePercentage =
    totalStudentsEnrolled > 0
      ? Math.round((totalStudentsParticipated / totalStudentsEnrolled) * 100)
      : 0;

  const overallAverageScore =
    totalQuizzesEvaluated > 0
      ? Math.round(totalQuizAccuracySum / totalQuizzesEvaluated)
      : filteredStudents.filter((s) => s.avgScore > 0).length > 0
      ? Math.round(
          filteredStudents
            .filter((s) => s.avgScore > 0)
            .reduce((acc, s) => acc + s.avgScore, 0) /
            filteredStudents.filter((s) => s.avgScore > 0).length
        )
      : 0;

  const totalCompletedAcrossStudents = Array.from(completedLessonsByRoll.values()).reduce(
    (a, b) => a + b,
    0
  );
  const overallLessonCompletionRatePercentage =
    totalStudentsEnrolled > 0
      ? Math.min(
          100,
          Math.round((totalCompletedAcrossStudents / (totalStudentsEnrolled * Math.min(5, totalLessonsAssigned))) * 100)
        )
      : 0;

  const trackedWeakOnly = weakTopics.filter((w) => w.accuracy <= 75);
  const commonMistakes = Array.from(commonMistakeCounter.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    overallAverageScore,
    totalQuizzesEvaluated,
    totalStudentsEnrolled,
    totalStudentsParticipated,
    overallParticipationRatePercentage,
    overallLessonCompletionRatePercentage,
    totalWeakTopicsTracked: trackedWeakOnly.length,
    activeRemedialLessonsCount: trackedWeakOnly.filter((w) => w.severity === "HIGH").length,
    availableSubjects: Array.from(courseSubjectSet),
    classesBreakdown,
    weakTopics,
    atRiskStudents,
    topPerformers,
    steadyLearners,
    studentMatrix,
    lessonCompletions: classesBreakdown,
    frequentlyMissedConcepts: commonMistakes,
    commonMistakes,
    timestamp: new Date().toISOString(),
  };
}

export function generateRemedialQuizDeck(
  topicName: string,
  classLevel = "Class 9",
  trade = "General"
) {
  const numCls = extractNumericClass(classLevel);
  const effectiveTrade = numCls !== null && !doesClassHaveTrade(numCls) ? "General" : trade;
  const now = new Date().toISOString();

  return {
    id: `remedial_${Date.now()}`,
    title: `রিমেডিয়াল কুইজ: ${topicName}`,
    className: classLevel,
    trade: effectiveTrade,
    subject: topicName,
    questionCount: 3,
    timeLimit: 20,
    slides: [
      {
        id: `rem-q-1`,
        type: "MCQ",
        question: `${topicName} সম্পর্কিত মৌলিক ধারণা কোনটি?`,
        options: [
          `${topicName}-এর সঠিক নীতি ও ব্যবহার`,
          "অপ্রাসঙ্গিক বিকল্প ২",
          "অপ্রাসঙ্গিক বিকল্প ৩",
          "উপরের কোনোটিই নয়",
        ],
        correctAnswer: 0,
        explanation: `${topicName}-এর মূল ধারণা ও শ্রেণিকক্ষের আলোচ্য নিয়ম অনুসরণ করুন।`,
      },
      {
        id: `rem-q-2`,
        type: "MCQ",
        question: `${topicName} ব্যবহারিক ল্যাবে অনুশীলনের সময় প্রধান সতর্কতা কোনটি?`,
        options: [
          "নিরাপত্তা নির্দেশিকা (PPE) ও সঠিক ধাপ অনুসরণ করা",
          "নির্দেশনা ছাড়া কাজ শুরু করা",
          "পরিমাপ যন্ত্র পরীক্ষা না করা",
          "কোনোটিই নয়",
        ],
        correctAnswer: 0,
        explanation: "সর্বদা কর্মশালা নিরাপত্তা ও নির্ধারিত ব্যবহারিক ধাপ অনুসরণ করা উচিত।",
      },
      {
        id: `rem-q-3`,
        type: "MCQ",
        question: `${topicName} বিষয়ে নির্ভুলতা বাড়াতে সবচেয়ে কার্যকর উপায় কী?`,
        options: [
          "ব্যাখ্যাসহ ভুল প্রশ্নগুলো পুনরায় অনুশীলন করা",
          "অনুশীলন বাদ দেওয়া",
          "মুখস্থ করে পরীক্ষা দেওয়া",
          "কোনোটিই নয়",
        ],
        correctAnswer: 0,
        explanation: "ভুলের কারণ বুঝে পুনরায় অনুশীলন করলে বিষয়ের ওপর দক্ষতা দ্রুত বাড়ে।",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function generateRevisionNote(
  topicName: string,
  classLevel = "Class 9",
  trade = "General"
) {
  const numCls = extractNumericClass(classLevel);
  const effectiveTrade = numCls !== null && !doesClassHaveTrade(numCls) ? "সাধারণ শাখা" : trade;

  return {
    id: `note_${Date.now()}`,
    title: `দ্রুত রিভিশন নোট: ${topicName}`,
    className: classLevel,
    trade: effectiveTrade,
    summary: `${classLevel} (${effectiveTrade})-এর শিক্ষার্থীদের জন্য '${topicName}' অধ্যায়ের দুর্বলতা কাটিয়ে ওঠার সংক্ষিপ্ত পাঠ নির্দেশিকা।`,
    keyPoints: [
      `'${topicName}' বিষয়ের মূল সংজ্ঞা, সূত্র ও কারিগরি পরিভাষা চিহ্নিত করুন।`,
      "ভুল হওয়া প্রশ্নগুলোর সঠিক উত্তর ও ১-লাইনের বাংলা ব্যাখ্যা খাতায় নোট করুন।",
      "অধ্যায়ের ব্যবহারিক / ল্যাব প্র্যাকটিক্যাল ধাপগুলো ধাপে ধাপে অনুশীলন করুন।",
    ],
    commonTrap: `শিক্ষার্থীরা প্রায়ই '${topicName}' সংক্রান্ত একক রূপান্তর বা শর্ত যাচাইয়ে তাড়াহুড়ো করে ভুল করে।`,
    instructorTip: "পরবর্তী ক্লাসের শুরুতে ১০ মিনিট এই টপিকের ওপর দ্রুত রিমেডিয়াল কুইজ পরিচালনা করুন।",
    generatedAt: new Date().toISOString(),
  };
}
