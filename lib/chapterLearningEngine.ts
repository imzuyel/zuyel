// Chapter Learning Path Engine for Panchagarh Govt. Technical School & College (PTSC) ERP
// Core Hierarchy: Class → Trade → Subject → Course → Chapter → Ordered Content Items (Blog Parts & Quizzes)
// Supports MySQL / Prisma integration with 100% resilient fallback for live preview

import { prisma, isPrismaAvailable } from "@/lib/prisma";

export interface QuizQuestionItem {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  marks: number;
}

export type ContentItemType = "BLOG_PART" | "QUIZ";
export type UnlockRuleType = "PREVIOUS_ITEM_COMPLETED" | "UNLOCKED" | "MIN_SCORE";
export type ChapterUnlockRule = "IMMEDIATE" | "PREVIOUS_COMPLETED";

export interface ChapterContentItemData {
  id: number;
  chapterId: number;
  orderIndex: number; // 1, 2, 3... defines sequential path
  itemType: ContentItemType;
  title: string;
  titleBangla: string;
  isPublished: boolean;
  isMandatory: boolean; // Progression blocked if not completed/passed
  xpReward: number; // XP granted on success
  unlockRule: UnlockRuleType;
  minScoreToUnlockNext: number; // % score required to unlock next item
  attemptLimit: number; // 0 = unlimited, or 1, 2, 3...
  passingScore: number; // % required to pass (e.g. 60)
  durationMinutes: number; // Estimated time

  // Blog Part specific attributes
  blogPartNumber?: number;
  contentMarkdown?: string;
  summary?: string;
  keyTakeaways?: string[];
  readTimeMinutes?: number;

  // Quiz specific attributes
  quizId?: number;
  quizQuestions?: QuizQuestionItem[];
  timeLimitSeconds?: number;
  shuffleQuestions?: boolean;
  showCorrectAnswersAfter?: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CourseChapterItem {
  id: number;
  courseId: number;
  chapterNumber: number;
  title: string;
  titleBangla: string;
  description: string;
  orderIndex: number;
  isPublished: boolean;
  unlockRule: ChapterUnlockRule;
  requiredMinXp: number;
  items: ChapterContentItemData[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseItem {
  id: number;
  code: string; // e.g. "CRS-VOC-EE-901"
  title: string;
  titleBangla: string;
  description: string;
  classId: number; // 6, 7, 8, 9, 10, 11, 12
  className: string;
  numericClass: number;
  tradeId: number | null;
  tradeCode: string | null; // "GE", "IT-IoT", "EE", "AMB" or null
  tradeName: string | null;
  subjectId: number | null;
  subjectCode: string | null;
  subjectName: string | null;
  thumbnailUrl: string;
  badgeGradient: string;
  isPublished: boolean;
  orderIndex: number;
  totalXp: number;
  estimatedHours: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  chapters: CourseChapterItem[];
  createdAt: string;
  updatedAt: string;
}

export type StudentItemStatus = "LOCKED" | "UNLOCKED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface StudentItemProgressData {
  id: number;
  studentRoll: string;
  studentName?: string;
  itemId: number;
  status: StudentItemStatus;
  attemptsCount: number;
  bestScore: number;
  lastScore: number;
  isPassed: boolean;
  xpEarned: number;
  completedAt?: string;
  timeSpentSeconds: number;
  answers?: Record<string, number>;
}

export interface EnrichedContentItem extends ChapterContentItemData {
  isLocked: boolean;
  lockReason?: string;
  progress: StudentItemProgressData | null;
  attemptsRemaining: number | null; // null if unlimited
  canAttempt: boolean;
  isCurrentNextStep: boolean;
}

export interface EnrichedCourseChapter extends Omit<CourseChapterItem, "items"> {
  isLocked: boolean;
  lockReason?: string;
  completedItemsCount: number;
  totalItemsCount: number;
  progressPercentage: number;
  items: EnrichedContentItem[];
}

export interface EnrichedCourse extends Omit<CourseItem, "chapters"> {
  chapters: EnrichedCourseChapter[];
  totalCourseItems: number;
  completedCourseItems: number;
  courseProgressPercentage: number;
  totalEarnedXp: number;
  isCompleted: boolean;
}

// ==========================================
// SEED DATA: BTEB VOCATIONAL & PRE-VOCATIONAL COURSES
// ==========================================

const INITIAL_COURSES: CourseItem[] = [
  {
    id: 1,
    code: "CRS-EE-901",
    title: "Electrical Safety & Circuit Analysis (Ohm's Law)",
    titleBangla: "ইলেকট্রিক্যাল সেফটি, সার্কিট বিশ্লেষণ ও ওহমের সূত্র",
    description: "বাংলাদেশ কারিগরি শিক্ষা বোর্ডের নবম শ্রেণির শিক্ষার্থীদের জন্য ওহমের সূত্র, সার্কিট উপাদান, সিরিজ-প্যারালাল সংযোগ ও ল্যাব সেফটি প্রটোকলের পূর্ণাঙ্গ সিকোয়েন্সিয়াল লার্নিং পথ।",
    classId: 9,
    className: "Class 9 (Vocational)",
    numericClass: 9,
    tradeId: 1,
    tradeCode: "EE",
    tradeName: "Electrical Works (ইলেকট্রিক্যাল)",
    subjectId: 101,
    subjectCode: "EE-101",
    subjectName: "ইলেকট্রিক্যাল ওয়ার্কস ও সেফটি-১",
    thumbnailUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&auto=format&fit=crop&q=80",
    badgeGradient: "from-amber-600 to-orange-700",
    isPublished: true,
    orderIndex: 1,
    totalXp: 450,
    estimatedHours: 8.5,
    difficulty: "Intermediate",
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    chapters: [
      {
        id: 101,
        courseId: 1,
        chapterNumber: 1,
        title: "Basic Electrical Circuit Elements & Ohm's Law Foundations",
        titleBangla: "অধ্যায় ১: বেসিক সার্কিট উপাদান ও ওহমের সূত্রের ভিত্তি",
        description: "সার্কিটের ৪টি প্রধান উপাদান, বিভব পার্থক্য, প্রবাহ ও ওহমের সূত্রের প্রয়োগ বিধি।",
        orderIndex: 1,
        isPublished: true,
        unlockRule: "IMMEDIATE",
        requiredMinXp: 0,
        createdAt: "2026-01-10T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        items: [
          {
            id: 1001,
            chapterId: 101,
            orderIndex: 1,
            itemType: "BLOG_PART",
            title: "Part 1: Fundamentals of Electric Current, Voltage & Closed Circuits",
            titleBangla: "১.১ ব্লগ পার্ট ১: বিদ্যুৎ প্রবাহ, বিভব পার্থক্য ও আদর্শ সার্কিট",
            isPublished: true,
            isMandatory: true,
            xpReward: 50,
            unlockRule: "UNLOCKED",
            minScoreToUnlockNext: 0,
            attemptLimit: 0,
            passingScore: 100,
            durationMinutes: 6,
            blogPartNumber: 1,
            readTimeMinutes: 5,
            summary: "একটি সম্পূর্ণ বৈদ্যুতিক সার্কিট সোর্স, পরিবাহী, লোড ও নিয়ন্ত্রণকারী উপাদানের সমন্বয়ে গঠিত।",
            keyTakeaways: [
              "সার্কিটের ৪টি মৌলিক উপাদান: বিদ্যুৎ উৎস, পরিবাহী তার, লোড (বাতি/ফ্যান), এবং সুইচ।",
              "কারেন্ট (Current) হলো ইলেকট্রনের প্রবাহ, যার একক অ্যাম্পিয়ার (Ampere, A)।",
              "ভোল্টেজ (Voltage) হলো বিভব পার্থক্য বা ইলেকট্রনকে ঠেলে নেওয়ার চাপ, একক ভোল্ট (Volt, V)।",
              "ওহমের সূত্র: নির্দিষ্ট তাপমাত্রায় V = I × R।"
            ],
            contentMarkdown: `# ১.১ বেসিক সার্কিট উপাদান ও বিদ্যুৎ প্রবাহের মূলনীতি

## পাঠের উদ্দেশ্য
কারিগরি শিক্ষায় যেকোনো ইলেকট্রিক্যাল প্র্যাক্টিক্যাল কাজ শুরুর আগে সার্কিটের মূল উপাদানসমূহ এবং বিদ্যুৎ প্রবাহের মৌলিক বৈশিষ্ট্য অনুধাবন করা আবশ্যক।

---

## ১. বৈদ্যুতিক সার্কিটের সংজ্ঞা ও উপাদান
একটি সম্পূর্ণ বৈদ্যুতিক সার্কিট (Closed Electric Circuit) তৈরি হতে ন্যূনতম ৪টি মৌলিক উপাদান প্রয়োজন:

1. **পাওয়ার সোর্স (Source):** ব্যাটারি বা জেনারেটর যা ইলেকট্রন প্রবাহের জন্য বিভব পার্থক্য (Voltage) সরবরাহ করে।
2. **পরিবাহী পথ (Conductor):** তামা বা অ্যালুমিনিয়ামের অন্তরিত তার যা বিদ্যুৎ প্রবাহে নগণ্য বাধা দেয়।
3. **বৈদ্যুতিক লোড (Load):** বাতি, হিটার বা বৈদ্যুতিক মোটর যা বিদ্যুৎ শক্তিকে আলো, তাপ বা যান্ত্রিক শক্তিতে রূপান্তরিত করে।
4. **নিয়ন্ত্রণ ব্যবস্থা (Control Device):** এসপিএসটি সুইচ বা সার্কিট ব্রেকার যা সার্কিটকে ইচ্ছা অনুযায়ী অন/অফ করতে পারে।

---

## ২. ভোল্টেজ, কারেন্ট ও রেজিস্ট্যান্স
- **কারেন্ট ($I$):** পরিবাহীর কোনো প্রস্থচ্ছেদের মধ্য দিয়ে প্রতি সেকেন্ডে চার্জ প্রবাহের হার।
- **ভোল্টেজ ($V$):** দুটি বিন্দুর মধ্যে একক ধনাত্মক চার্জ স্থানান্তরে যে পরিমাণ কাজ করতে হয়।
- **রেজিস্ট্যান্স ($R$):** পরিবাহীর যে ধর্মের জন্য বিদ্যুৎ প্রবাহ বাধাগ্রস্ত হয়, একক ওহম ($\Omega$)।

> **স্মরণীয় টিপস:** সার্কিটের সুইচ বন্ধ (Closed) না থাকলে কোনো কারেন্ট প্রবাহিত হতে পারে না; তখন তাকে **Open Circuit** বলা হয়।`,
            createdAt: "2026-01-10T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 1002,
            chapterId: 101,
            orderIndex: 2,
            itemType: "QUIZ",
            title: "Quiz 1: Circuit Foundations & Basic Units Diagnostic",
            titleBangla: "১.২ কুইজ ১: সার্কিট উপাদান ও ওহমের সূত্র যাচাই পরীক্ষা",
            isPublished: true,
            isMandatory: true,
            xpReward: 60,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 60,
            attemptLimit: 3,
            passingScore: 60,
            durationMinutes: 5,
            timeLimitSeconds: 300,
            shuffleQuestions: true,
            showCorrectAnswersAfter: true,
            quizQuestions: [
              {
                id: "q-1002-1",
                questionText: "একটি আদর্শ বৈদ্যুতিক সার্কিটের প্রধান ৪টি উপাদানের অন্তর্ভুক্ত নয় কোনটি?",
                options: ["বিদ্যুৎ উৎস (Source)", "পরিবাহী তার (Conductor)", "লোড (Load)", "ইনসুলেশন টেপ (Insulating Tape)"],
                correctOptionIndex: 3,
                explanation: "ইনসুলেশন টেপ একটি সুরক্ষামূলক অনুষঙ্গ, তবে আদর্শ সার্কিট গঠনের ৪টি অপরিহার্য উপাদান হলো উৎস, পরিবাহী, লোড এবং সুইচ।",
                marks: 1
              },
              {
                id: "q-1002-2",
                questionText: "ওহমের সূত্রানুসারে নিচের কোন সমীকরণটি সঠিক?",
                options: ["V = I × R", "I = V × R", "R = V × I", "V = I / R"],
                correctOptionIndex: 0,
                explanation: "ওহমের সূত্র অনুযায়ী বিভব পার্থক্য V = I × R, অথবা I = V / R।",
                marks: 1
              },
              {
                id: "q-1002-3",
                questionText: "বিদ্যুৎ প্রবাহের (Electric Current) আন্তর্জাতিক একক কোনটি?",
                options: ["ভোল্ট (Volt)", "অ্যাম্পিয়ার (Ampere)", "ওহম (Ohm)", "ওয়াট (Watt)"],
                correctOptionIndex: 1,
                explanation: "কারেন্টের আন্তর্জাতিক এসআই একক হলো অ্যাম্পিয়ার (A)।",
                marks: 1
              },
              {
                id: "q-1002-4",
                questionText: "সার্কিটে সুইচ অন করলে সার্কিটটির অবস্থা কী হয়?",
                options: ["Open Circuit", "Closed Circuit", "Short Circuit", "Overload Circuit"],
                correctOptionIndex: 1,
                explanation: "সুইচ অন করলে পরিবাহী পথ সংযুক্ত হয় এবং সার্কিটটি ক্লোজড সার্কিট (Closed Circuit) হয়।",
                marks: 1
              }
            ],
            createdAt: "2026-01-10T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 1003,
            chapterId: 101,
            orderIndex: 3,
            itemType: "BLOG_PART",
            title: "Part 2: Series and Parallel Circuit Analysis with Practical Math",
            titleBangla: "১.৩ ব্লগ পার্ট ২: সিরিজ ও প্যারালাল সার্কিট বিশ্লেষণ এবং গাণিতিক সমাধান",
            isPublished: true,
            isMandatory: true,
            xpReward: 50,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 0,
            attemptLimit: 0,
            passingScore: 100,
            durationMinutes: 7,
            blogPartNumber: 2,
            readTimeMinutes: 6,
            summary: "সিরিজ সার্কিটে কারেন্ট সমান কিন্তু ভোল্টেজ ভাগ হয়; প্যারালাল সার্কিটে ভোল্টেজ সমান কিন্তু কারেন্ট ভাগ হয়।",
            keyTakeaways: [
              "সিরিজ সার্কিটে সমতুল্য রোধ: R_eq = R1 + R2 + R3 + ...",
              "প্যারালাল সার্কিটে সমতুল্য রোধ: 1/R_eq = 1/R1 + 1/R2 + 1/R3 + ...",
              "বাসাবাড়ির ওয়্যারিং সবসময় প্যারালাল সংযোগে করা হয় যাতে প্রতিটি অ্যাপ্লায়েন্স পূর্ণ ২২০V পায়।"
            ],
            contentMarkdown: `# ১.৩ সিরিজ ও প্যারালাল সার্কিট বিশ্লেষণ

## ১. সিরিজ সার্কিট (Series Circuit)
যখন একাধিক লোড বা রোধক একের পর এক এমনভাবে যুক্ত থাকে যে বিদ্যুৎ প্রবাহের জন্য কেবল **একটি মাত্র পথ** থাকে, তাকে সিরিজ সার্কিট বলে।

- **কারেন্ট:** $I_{total} = I_1 = I_2 = I_3$
- **ভোল্টেজ:** $V_{total} = V_1 + V_2 + V_3$
- **সমতুল্য রোধ:** $R_{eq} = R_1 + R_2 + R_3$

---

## ২. প্যারালাল সার্কিট (Parallel Circuit)
যখন একাধিক রোধক দুটি সাধারণ নোডের মধ্যে যুক্ত থাকে এবং কারেন্ট চলার একাধিক শাখা পথ থাকে, তাকে প্যারালাল সার্কিট বলে।

- **ভোল্টেজ:** প্রতিটি শাখার ভোল্টেজ সমান ($V_{total} = V_1 = V_2$)
- **কারেন্ট:** $I_{total} = I_1 + I_2$
- **সমতুল্য রোধ:** $\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2}$

---

## ৩. বাস্তব গাণিতিক উদাহরণ
যদি $R_1 = 10\\Omega$ এবং $R_2 = 10\\Omega$ প্যারালালে যুক্ত থাকে এবং ২৪ ভোল্ট সাপ্লাই দেওয়া হয়:
$$R_{eq} = \\frac{10 \\times 10}{10 + 10} = 5\\Omega$$
$$I_{total} = \\frac{V}{R_{eq}} = \\frac{24}{5} = 4.8 \\text{ Amperes}$$`,
            createdAt: "2026-01-10T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 1004,
            chapterId: 101,
            orderIndex: 4,
            itemType: "QUIZ",
            title: "Quiz 2: Series-Parallel Math Calculation & Voltage Divider Check",
            titleBangla: "১.৪ কুইজ ২: সিরিজ ও প্যারালাল রোধ ও ভোল্টেজ ড্রপ মূল্যায়ন",
            isPublished: true,
            isMandatory: true,
            xpReward: 70,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 60,
            attemptLimit: 3,
            passingScore: 60,
            durationMinutes: 6,
            timeLimitSeconds: 360,
            shuffleQuestions: true,
            showCorrectAnswersAfter: true,
            quizQuestions: [
              {
                id: "q-1004-1",
                questionText: "দুটি ১০ ওহম (10 Ω) রোধ সিরিজে যুক্ত করলে সমতুল্য রোধ কত হবে?",
                options: ["৫ ওহম (5 Ω)", "১০ ওহম (10 Ω)", "২০ ওহম (20 Ω)", "১০০ ওহম (100 Ω)"],
                correctOptionIndex: 2,
                explanation: "সিরিজ সংযোগে মোট রোধ R_eq = R1 + R2 = 10 + 10 = 20 ওহম।",
                marks: 1
              },
              {
                id: "q-1004-2",
                questionText: "বাসাবাড়ির বৈদ্যুতিক ওয়্যারিং কোন সংযোগে করা হয়?",
                options: ["সিরিজ সংযোগে", "প্যারালাল সংযোগে", "মিক্সড হাইব্রিড সিরিজ", "ওপেন সংযোগে"],
                correctOptionIndex: 1,
                explanation: "প্যারালাল সংযোগে প্রতিটি অ্যাপ্লায়েন্স স্বাধীনভাবে চালনা করা যায় এবং সবাই পূর্ণ ২২০ ভোল্ট পায়।",
                marks: 1
              },
              {
                id: "q-1004-3",
                questionText: "একটি ২০ ওহম রোধে ২২০ ভোল্ট প্রয়োগ করলে কত কারেন্ট প্রবাহিত হবে?",
                options: ["২.২ অ্যাম্পিয়ার", "১১ অ্যাম্পিয়ার", "২০ অ্যাম্পিয়ার", "৪৪০০ অ্যাম্পিয়ার"],
                correctOptionIndex: 1,
                explanation: "ওহমের সূত্রানুসারে I = V / R = 220 / 20 = 11 Ampere।",
                marks: 1
              }
            ],
            createdAt: "2026-01-10T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 1005,
            chapterId: 101,
            orderIndex: 5,
            itemType: "BLOG_PART",
            title: "Part 3: Technical Lab Workshop Safety Standards & Earthing Rules",
            titleBangla: "১.৫ ব্লগ পার্ট ৩: কারিগরি ওয়ার্কশপ সেফটি স্ট্যান্ডার্ড ও আর্থিং গাইডলাইন",
            isPublished: true,
            isMandatory: true,
            xpReward: 50,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 0,
            attemptLimit: 0,
            passingScore: 100,
            durationMinutes: 5,
            blogPartNumber: 3,
            readTimeMinutes: 5,
            summary: "ওয়ার্কশপে ব্যক্তিগত সুরক্ষা সরঞ্জাম (PPE), সঠিক আর্থিং ও জরুরি শক প্রতিরোধ বিধি।",
            keyTakeaways: [
              "ইলেকট্রিক্যাল ল্যাবে কাজ করার সময় রাবার সোল জুতো ও ইনসুলেটেড টুলস ব্যবহার বাধ্যতামূলক।",
              "আর্থিংয়ের উদ্দেশ্য হলো অপ্রত্যাশিত শর্ট-সার্কিটে মানুষকে শক লাগা থেকে রক্ষা করা।",
              "কোনো ব্যক্তি বিদ্যুতায়িত হলে প্রথমে মেইন সুইচ বন্ধ করতে হবে।"
            ],
            contentMarkdown: `# ১.৫ কারিগরি ওয়ার্কশপ সেফটি স্ট্যান্ডার্ড ও আর্থিং

## ১. ল্যাব সেফটির মূল বিধিমালা
কারিগরি শিক্ষা অধিদপ্তরের (DTE) নীতিমালা অনুযায়ী ইলেকট্রিক্যাল ওয়ার্কশপে দুর্ঘটনা প্রতিরোধে নিম্নলিখিত নিয়মাবলি মেনে চলতে হবে:

1. **পিপিই (Personal Protective Equipment):**
   - সুতি কাপড় পরিধান করুন (সিনথেটিক কাপড় পরিহার্য)।
   - রাবার সোলের শকপ্রুফ জুতো পরিধান বাধ্যতামূলক।
   - চোখে সেফটি গগলস রাখুন।
2. **টুলস ব্যবহার:**
   - সর্বদা অন্তরিত হাতলযুক্ত (Insulated handle, 1000V rated) প্লায়ার্স, স্ক্রু-ড্রাইভার ও কাটার ব্যবহার করুন।
3. **আর্থিং (Earthing):**
   - ধাতব যন্ত্রপাতি যেমন মোটর ও ট্রান্সফরমারের কেসিংকে মাটির সাথে সুসংযুক্ত রাখা।`,
            createdAt: "2026-01-10T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 1006,
            chapterId: 101,
            orderIndex: 6,
            itemType: "QUIZ",
            title: "Final Chapter Quiz: Comprehensive Electrical Circuits & Lab Safety",
            titleBangla: "১.৬ ফাইনাল কুইজ: অধ্যায় সমাপনী কম্প্রিহেনসিভ অ্যাসেসমেন্ট",
            isPublished: true,
            isMandatory: true,
            xpReward: 120,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 70,
            attemptLimit: 2,
            passingScore: 70,
            durationMinutes: 8,
            timeLimitSeconds: 480,
            shuffleQuestions: true,
            showCorrectAnswersAfter: true,
            quizQuestions: [
              {
                id: "q-1006-1",
                questionText: "কোনো ব্যক্তি বৈদ্যুতিক শকে আক্রান্ত হলে সর্বপ্রথম পদক্ষেপ কী হওয়া উচিত?",
                options: [
                  "তাৎক্ষণিকভাবে খালি হাতে তাকে টেনে সরানো",
                  "মেইন সুইচ বা পাওয়ার সাপ্লাই অবিলম্বে বন্ধ করা",
                  "তার শরীরে পানি ঢালা",
                  "অধ্যক্ষকে ফোন করার জন্য রুম থেকে বেরিয়ে যাওয়া"
                ],
                correctOptionIndex: 1,
                explanation: "সর্বপ্রথম জরুরি পদক্ষেপ হলো মেইন সুইচ বন্ধ করে পাওয়ার বিচ্ছিন্ন করা।",
                marks: 2
              },
              {
                id: "q-1006-2",
                questionText: "বৈদ্যুতিক যন্ত্রপাতিতে আর্থিং (Earthing) করার মূল উদ্দেশ্য কী?",
                options: [
                  "বিদ্যুৎ বিল কমানো",
                  "যন্ত্রের গতি বৃদ্ধি করা",
                  "লিকেজ কারেন্ট মাটিতে নিষ্কাশন করে ব্যবহারকারীকে শক থেকে বাঁচানো",
                  "যন্ত্রের ওজন বৃদ্ধি করা"
                ],
                correctOptionIndex: 2,
                explanation: "আর্থিং লিকেজ কারেন্ট নিরাপদে মাটিতে পাঠিয়ে ফিউজ বা ব্রেকার ট্রিপ করায় এবং মানুষের জীবন বাঁচায়।",
                marks: 2
              },
              {
                id: "q-1006-3",
                questionText: "একটি ১২ ভোল্টের ব্যাটারিতে ৪ ওহমের লোড যুক্ত থাকলে সার্কিটের বিদ্যুৎ প্রবাহ কত?",
                options: ["৩ অ্যাম্পিয়ার (3 A)", "৪৮ অ্যাম্পিয়ার (48 A)", "০.৩৩ অ্যাম্পিয়ার", "৮ অ্যাম্পিয়ার"],
                correctOptionIndex: 0,
                explanation: "I = V / R = 12 / 4 = 3 Ampere।",
                marks: 2
              }
            ],
            createdAt: "2026-01-10T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          }
        ]
      }
    ]
  },
  {
    id: 2,
    code: "CRS-IT-1001",
    title: "Computer Hardware Architecture, IoT & Troubleshooting",
    titleBangla: "কম্পিউটার হার্ডওয়্যার আর্কিটেকচার, আইওটি ও ট্রাবলশুটিং",
    description: "দশম শ্রেণির শিক্ষার্থীদের জন্য কম্পিউটার মাদারবোর্ড আর্কিটেকচার, মাইক্রোপ্রসেসর বাস ও আইওটি মাইক্রোকন্ট্রোলার ট্রাবলশুটিং পাথ।",
    classId: 10,
    className: "Class 10 (Vocational)",
    numericClass: 10,
    tradeId: 2,
    tradeCode: "IT-IoT",
    tradeName: "Computer & IoT (কম্পিউটার ও আইওটি)",
    subjectId: 201,
    subjectCode: "IT-201",
    subjectName: "কম্পিউটার ও আইওটি অ্যাপ্লিকেশন-২",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    badgeGradient: "from-cyan-600 to-blue-700",
    isPublished: true,
    orderIndex: 2,
    totalXp: 400,
    estimatedHours: 9.0,
    difficulty: "Intermediate",
    createdAt: "2026-01-12T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    chapters: [
      {
        id: 201,
        courseId: 2,
        chapterNumber: 1,
        title: "Motherboard Architecture, Bus Speed & Chipset Controls",
        titleBangla: "অধ্যায় ১: মাদারবোর্ড আর্কিটেকচার, বাস স্পিড ও চিপসেট নিয়ন্ত্রণ",
        description: "মাদারবোর্ডের বিভিন্ন চিপসেট, র‍্যাম বাস স্পিড ও ট্রাবলশুটিং প্রসেস।",
        orderIndex: 1,
        isPublished: true,
        unlockRule: "IMMEDIATE",
        requiredMinXp: 0,
        createdAt: "2026-01-12T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        items: [
          {
            id: 2001,
            chapterId: 201,
            orderIndex: 1,
            itemType: "BLOG_PART",
            title: "Part 1: Motherboard Form Factors, Chipset Architecture & PCIe Lanes",
            titleBangla: "১.১ ব্লগ পার্ট ১: মাদারবোর্ড ফর্ম ফ্যাক্টর ও চিপসেট আর্কিটেকচার",
            isPublished: true,
            isMandatory: true,
            xpReward: 50,
            unlockRule: "UNLOCKED",
            minScoreToUnlockNext: 0,
            attemptLimit: 0,
            passingScore: 100,
            durationMinutes: 6,
            blogPartNumber: 1,
            readTimeMinutes: 5,
            summary: "মাদারবোর্ডের বিভিন্ন সাইজ (ATX, Micro-ATX) এবং প্রসেসরের সাথে দ্রুতগতির PCIe যোগাযোগ কাঠামো।",
            keyTakeaways: [
              "ফর্ম ফ্যাক্টর নির্ধারণ করে মাদারবোর্ডের আকার ও ক্যাসিং সামঞ্জস্য।",
              "চিপসেট প্রসেসর, র‍্যাম এবং স্টোরেজ ডিভাইসের মধ্যে ট্র্যাফিক পরিচালনা করে।",
              "PCIe (Peripheral Component Interconnect Express) হলো গ্রাফিক্স কার্ড ও হাইস্পিড SSD-র প্রধান বাস।"
            ],
            contentMarkdown: `# ১.১ মাদারবোর্ড ফর্ম ফ্যাক্টর ও চিপসেট আর্কিটেকচার

মাদারবোর্ড হলো যেকোনো কম্পিউটারের কেন্দ্রীয় প্রিন্টেড সার্কিট বোর্ড (PCB)। 

## ১. প্রধান ফর্ম ফ্যাক্টরসমূহ
- **Standard ATX:** পূর্ণাঙ্গ গেমিং বা ওয়ার্কস্টেশন মাদারবোর্ড (305 × 244 mm)।
- **Micro-ATX:** কমপ্যাক্ট অফিসের কম্পিউটারে বহুল ব্যবহৃত (244 × 244 mm)।
- **Mini-ITX:** অত্যন্ত ক্ষুদ্র ও হালকা ডিভাইসে উপযোগী (170 × 170 mm)।`,
            createdAt: "2026-01-12T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 2002,
            chapterId: 201,
            orderIndex: 2,
            itemType: "QUIZ",
            title: "Quiz 1: Motherboard Bus Speed & Form Factor Diagnostic",
            titleBangla: "১.২ কুইজ ১: মাদারবোর্ড ফর্ম ফ্যাক্টর ও আর্কিটেকচার যাচাই",
            isPublished: true,
            isMandatory: true,
            xpReward: 60,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 60,
            attemptLimit: 3,
            passingScore: 60,
            durationMinutes: 5,
            timeLimitSeconds: 300,
            shuffleQuestions: true,
            showCorrectAnswersAfter: true,
            quizQuestions: [
              {
                id: "q-2002-1",
                questionText: "সাধারণ ডেস্কটপ কম্পিউটারের আদর্শ বড় সাইজের মাদারবোর্ড ফর্ম ফ্যাক্টর কোনটি?",
                options: ["Standard ATX", "Mini-ITX", "Nano-ATX", "Micro-SIM"],
                correctOptionIndex: 0,
                explanation: "Standard ATX (305 × 244 mm) হলো বহুল ব্যবহৃত ফুল-সাইজ ফর্ম ফ্যাক্টর।",
                marks: 1
              },
              {
                id: "q-2002-2",
                questionText: "মাদারবোর্ডে গ্রাফিক্স কার্ড বা NVMe SSD লাগাতে কোন বাস ব্যবহৃত হয়?",
                options: ["PCIe (PCI Express)", "VGA Bus", "Floppy Ribbon", "PS/2 Port"],
                correctOptionIndex: 0,
                explanation: "PCIe বাস দ্রুতগতির ডেটা আদান-প্রদানে ব্যবহৃত হয়।",
                marks: 1
              }
            ],
            createdAt: "2026-01-12T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          }
        ]
      }
    ]
  },
  {
    id: 3,
    code: "CRS-AMB-901",
    title: "Automobile Engine Mechanics & Internal Combustion Engines",
    titleBangla: "অটোমোবাইল ইঞ্জিন মেকানিক্স ও লুব্রিকেশন সিস্টেম",
    description: "নবম শ্রেণির অটোমোবাইল ট্রেডের শিক্ষার্থীদের জন্য ফোর-স্ট্রোক ও টু-স্ট্রোক ইন্টারনাল কম্বাশন ইঞ্জিন এবং লুব্রিকেশন সিস্টেমের অধ্যায়ভিত্তিক পাঠ্যক্রম।",
    classId: 9,
    className: "Class 9 (Vocational)",
    numericClass: 9,
    tradeId: 4,
    tradeCode: "AMB",
    tradeName: "Automobile (অটোমোবাইল)",
    subjectId: 301,
    subjectCode: "AMB-101",
    subjectName: "অটোমোবাইল বেসিক্স ও ইঞ্জিন-১",
    thumbnailUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80",
    badgeGradient: "from-rose-600 to-red-800",
    isPublished: true,
    orderIndex: 3,
    totalXp: 350,
    estimatedHours: 7.5,
    difficulty: "Intermediate",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    chapters: [
      {
        id: 301,
        courseId: 3,
        chapterNumber: 1,
        title: "Four-Stroke Internal Combustion Engine Operating Cycle",
        titleBangla: "অধ্যায় ১: ফোর-স্ট্রোক আইসি ইঞ্জিন অপারেটিং সাইকেল",
        description: "সাকশন, কম্প্রেশন, পাওয়ার ও এগজস্ট স্ট্রোকের ধারাবাহিক পর্যায়।",
        orderIndex: 1,
        isPublished: true,
        unlockRule: "IMMEDIATE",
        requiredMinXp: 0,
        createdAt: "2026-01-15T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        items: [
          {
            id: 3001,
            chapterId: 301,
            orderIndex: 1,
            itemType: "BLOG_PART",
            title: "Part 1: The Four Strokes of an Internal Combustion Engine",
            titleBangla: "১.১ ব্লগ পার্ট ১: ফোর-স্ট্রোক ইঞ্জিনের চারটি প্রধান ধাপ",
            isPublished: true,
            isMandatory: true,
            xpReward: 50,
            unlockRule: "UNLOCKED",
            minScoreToUnlockNext: 0,
            attemptLimit: 0,
            passingScore: 100,
            durationMinutes: 6,
            blogPartNumber: 1,
            readTimeMinutes: 5,
            summary: "সাকশন, কম্প্রেশন, পাওয়ার এবং এগজস্ট—এই ৪টি স্ট্রোকে ক্র্যাঙ্কশ্যাফট দুইবার (৭২০ ডিগ্রি) ঘুরে একটি সাইকেল সম্পন্ন করে।",
            keyTakeaways: [
              "১. সাকশন স্ট্রোক: পিস্টন TDC থেকে BDC-তে নামে, ফুয়েল-এয়ার মিক্সচার সিলিন্ডারে প্রবেশ করে।",
              "২. কম্প্রেশন স্ট্রোক: ভালভ বন্ধ থাকে, মিশ্রণকে সংকুচিত করা হয়।",
              "৩. পাওয়ার স্ট্রোক: স্পার্ক প্লাগ স্পার্ক করে, উচ্চ চাপে পিস্টন নিচে নামে।",
              "৪. এগজস্ট স্ট্রোক: পোড়া গ্যাস বের হয়ে যায়।"
            ],
            contentMarkdown: `# ১.১ ফোর-স্ট্রোক আইসি ইঞ্জিন সাইকেল

ইন্টারনাল কম্বাশন (IC) ইঞ্জিনে রাসায়নিক শক্তি তাপ শক্তিতে এবং অতঃপর যান্ত্রিক শক্তিতে রূপান্তরিত হয়।

## ৪টি স্ট্রোকের বিবরণ
1. **সাকশন স্ট্রোক (Suction Stroke):** পিস্টন TDC (Top Dead Center) হতে BDC (Bottom Dead Center)-এ আসে।
2. **কম্প্রেশন স্ট্রোক (Compression Stroke):** উভয় ভালভ বন্ধ থাকে এবং গ্যাস সংকুচিত হয়।
3. **পাওয়ার স্ট্রোক (Power Stroke):** কম্বাশন ঘটে পিস্টনকে প্রচণ্ড শক্তিতে ধাক্কা দেয়।
4. **এগজস্ট স্ট্রোক (Exhaust Stroke):** পোড়া ধোঁয়া সিলিন্ডার ত্যাগ করে।`,
            createdAt: "2026-01-15T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 3002,
            chapterId: 301,
            orderIndex: 2,
            itemType: "QUIZ",
            title: "Quiz 1: Engine Stroke Cycle Diagnostic",
            titleBangla: "১.২ কুইজ ১: ইঞ্জিন স্ট্রোক ও পিস্টন মোশন যাচাই",
            isPublished: true,
            isMandatory: true,
            xpReward: 60,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 60,
            attemptLimit: 3,
            passingScore: 60,
            durationMinutes: 5,
            timeLimitSeconds: 300,
            shuffleQuestions: true,
            showCorrectAnswersAfter: true,
            quizQuestions: [
              {
                id: "q-3002-1",
                questionText: "ফোর-স্ট্রোক ইঞ্জিনে পাওয়ার স্ট্রোকে পিস্টন কোন দিকে যায়?",
                options: ["TDC হতে BDC এর দিকে (নিচে)", "BDC হতে TDC এর দিকে (উপরে)", "স্থির থাকে", "ডানে-বামে ঘোরে"],
                correctOptionIndex: 0,
                explanation: "জ্বালানি প্রজ্বলনের ফলে উচ্চ চাপে পিস্টন ওপর থেকে নিচের দিকে (TDC to BDC) নামে।",
                marks: 1
              },
              {
                id: "q-3002-2",
                questionText: "ফোর-স্ট্রোক সাইকেলে ক্র্যাঙ্কশ্যাফট কত ডিগ্রি ঘোরে?",
                options: ["৩৬০ ডিগ্রি", "৭২০ ডিগ্রি", "১৮০ ডিগ্রি", "৫৪০ ডিগ্রি"],
                correctOptionIndex: 1,
                explanation: "৪টি স্ট্রোকে পিস্টন ৪ বার ওঠানামা করে এবং ক্র্যাঙ্কশ্যাফট ২ বার পূর্ণ আবর্তন (৭২০ ডিগ্রি) সম্পন্ন করে।",
                marks: 1
              }
            ],
            createdAt: "2026-01-15T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          }
        ]
      }
    ]
  },
  {
    id: 4,
    code: "CRS-ICT-601",
    title: "Pre-Vocational Digital Literacy & Cyber Safety",
    titleBangla: "প্রাক-কারিগরি ডিজিটাল সাক্ষরতা ও সাইবার নিরাপত্তা",
    description: "৬ষ্ঠ থেকে ৮ম শ্রেণির শিক্ষার্থীদের জন্য কম্পিউটার বেসিক, ইন্টারনেট ব্রাউজিং ও সাইবার নিরাপত্তা পরিচিতি।",
    classId: 6,
    className: "Class 6",
    numericClass: 6,
    tradeId: null,
    tradeCode: null,
    tradeName: "সাধারণ প্রাক-কারিগরি",
    subjectId: 401,
    subjectCode: "ICT-601",
    subjectName: "তথ্য ও যোগাযোগ প্রযুক্তি",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    badgeGradient: "from-emerald-600 to-teal-700",
    isPublished: true,
    orderIndex: 4,
    totalXp: 300,
    estimatedHours: 6.0,
    difficulty: "Beginner",
    createdAt: "2026-01-20T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    chapters: [
      {
        id: 401,
        courseId: 4,
        chapterNumber: 1,
        title: "Internet Basics & Strong Password Hygiene",
        titleBangla: "অধ্যায় ১: ইন্টারনেট ব্রাউজিং ও শক্তিশালী পাসওয়ার্ড সুরক্ষা",
        description: "সুরক্ষিত ইন্টারনেট ব্যবহারের কৌশল ও ডিজিটাল ফুটপ্রিন্ট।",
        orderIndex: 1,
        isPublished: true,
        unlockRule: "IMMEDIATE",
        requiredMinXp: 0,
        createdAt: "2026-01-20T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        items: [
          {
            id: 4001,
            chapterId: 401,
            orderIndex: 1,
            itemType: "BLOG_PART",
            title: "Part 1: How the Internet Works and Staying Safe Online",
            titleBangla: "১.১ ব্লগ পার্ট ১: ইন্টারনেট কী এবং অনলাইনে নিরাপদ থাকার উপায়",
            isPublished: true,
            isMandatory: true,
            xpReward: 40,
            unlockRule: "UNLOCKED",
            minScoreToUnlockNext: 0,
            attemptLimit: 0,
            passingScore: 100,
            durationMinutes: 5,
            blogPartNumber: 1,
            readTimeMinutes: 4,
            summary: "ইন্টারনেট হলো বিশ্বব্যাপী কম্পিউটার নেটওয়ার্কের জাল। ব্যক্তিগত পাসওয়ার্ড কাউকে শেয়ার করা যাবে না।",
            keyTakeaways: [
              "শক্তিশালী পাসওয়ার্ডে বড় হাতের অক্ষর, ছোট হাতের অক্ষর, সংখ্যা ও স্পেশাল ক্যারেক্টার থাকা আবশ্যক।",
              "অপরিচিত কোনো লিংকে ক্লিক করা যাবে না।"
            ],
            contentMarkdown: `# ১.১ ইন্টারনেট ও সাইবার সুরক্ষা

ইন্টারনেট হলো গোটা বিশ্বের কোটি কোটি কম্পিউটারের আন্তঃসংযুক্ত নেটওয়ার্ক।

## নিরাপদ থাকার নিয়ম
1. কখনোই নিজের জন্মতারিখ বা মোবাইল নম্বর দিয়ে পাসওয়ার্ড তৈরি করবেন না।
2. কোনো পপ-আপ মেসেজে ব্যক্তিগত তথ্য দেবেন না।`,
            createdAt: "2026-01-20T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 4002,
            chapterId: 401,
            orderIndex: 2,
            itemType: "QUIZ",
            title: "Quiz 1: Password Safety & Internet Etiquette",
            titleBangla: "১.২ কুইজ ১: পাসওয়ার্ড নিরাপত্তা ও ইন্টারনেট সাধারণ জ্ঞান",
            isPublished: true,
            isMandatory: true,
            xpReward: 50,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 60,
            attemptLimit: 3,
            passingScore: 60,
            durationMinutes: 4,
            timeLimitSeconds: 240,
            shuffleQuestions: true,
            showCorrectAnswersAfter: true,
            quizQuestions: [
              {
                id: "q-4002-1",
                questionText: "নিচের কোন পাসওয়ার্ডটি সবচেয়ে শক্তিশালী?",
                options: ["123456", "password", "Ptsc#2026!Tech", "bangladesh"],
                correctOptionIndex: 2,
                explanation: "Ptsc#2026!Tech পাসওয়ার্ডটিতে বড়-ছোট অক্ষর, সংখ্যা এবং স্পেশাল ক্যারেক্টার সংমিশ্রিত রয়েছে।",
                marks: 1
              }
            ],
            createdAt: "2026-01-20T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          }
        ]
      }
    ]
  },
  {
    id: 5,
    code: "CRS-PV-701",
    title: "Pre-Vocational Technical Drawing & Workshop Tools Fundamentals",
    titleBangla: "প্রাক-কারিগরি টেকনিক্যাল ড্রয়িং ও ওয়ার্কশপ হ্যান্ড টুলস",
    description: "৭ম শ্রেণির শিক্ষার্থীদের জন্য অর্থোগ্রাফিক ড্রয়িং, স্কেল ব্যবহার ও সাধারণ কারিগরি ওয়ার্কশপ হ্যান্ড টুলস পরিচিতি।",
    classId: 7,
    className: "Class 7",
    numericClass: 7,
    tradeId: null,
    tradeCode: null,
    tradeName: "সাধারণ প্রাক-কারিগরি (ট্রেড প্রযোজ্য নয়)",
    subjectId: 501,
    subjectCode: "PVD-701",
    subjectName: "বেসিক টেকনিক্যাল ড্রয়িং",
    thumbnailUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    badgeGradient: "from-blue-600 to-indigo-800",
    isPublished: true,
    orderIndex: 5,
    totalXp: 280,
    estimatedHours: 5.5,
    difficulty: "Beginner",
    createdAt: "2026-01-22T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    chapters: [
      {
        id: 501,
        courseId: 5,
        chapterNumber: 1,
        title: "Introduction to Technical Drawing Instruments & Lines",
        titleBangla: "অধ্যায় ১: টেকনিক্যাল ড্রয়িং সরঞ্জাম ও বিভিন্ন রেখা পরিচিতি",
        description: "টি-স্কেল, সেট-স্কয়ার, কম্পাস এবং বিভিন্ন থিকনেস রেখার সঠিক প্রয়োগ।",
        orderIndex: 1,
        isPublished: true,
        unlockRule: "IMMEDIATE",
        requiredMinXp: 0,
        createdAt: "2026-01-22T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        items: [
          {
            id: 5001,
            chapterId: 501,
            orderIndex: 1,
            itemType: "BLOG_PART",
            title: "Part 1: Essential Engineering Drawing Tools & Sheet Layout",
            titleBangla: "১.১ ব্লগ পার্ট ১: ড্রয়িং শিট লেআউট ও মূল সরঞ্জামসমূহ",
            isPublished: true,
            isMandatory: true,
            xpReward: 40,
            unlockRule: "UNLOCKED",
            minScoreToUnlockNext: 0,
            attemptLimit: 0,
            passingScore: 100,
            durationMinutes: 5,
            blogPartNumber: 1,
            readTimeMinutes: 4,
            summary: "টেকনিক্যাল ড্রয়িং হলো কারিগরি শিক্ষার সার্বজনীন ভাষা। টি-স্কেল দিয়ে অনুভূমিক ও সেট-স্কয়ার দিয়ে উলম্ব রেখা আঁকা হয়।",
            keyTakeaways: [
              "টেকনিক্যাল ড্রয়িংকে কারিগরি জগতের সার্বজনীন ভাষা (Universal Language of Engineers) বলা হয়।",
              "ড্রয়িং পেন্সিলের মধ্যে 2H ও H সূক্ষ্ম ও হালকা রেখা আঁকতে ব্যবহৃত হয়।",
              "টাইটেল ব্লকে প্রতিষ্ঠানের নাম, ড্রয়িংয়ের নাম, স্কেল ও ড্রয়ারের স্বাক্ষর থাকে।"
            ],
            contentMarkdown: `# ১.১ টেকনিক্যাল ড্রয়িং শিট লেআউট ও সরঞ্জাম

কারিগরি শিক্ষার ৭ম শ্রেণির প্রাক-কারিগরি (Pre-Vocational) পাঠে ড্রয়িংয়ের মৌলিক নিয়মাবলি অত্যন্ত গুরুত্বপূর্ণ।

## ১. প্রধান ড্রয়িং সরঞ্জাম
- **টি-স্কেল (T-Square):** ড্রয়িং বোর্ডের বাম প্রান্তে খাঁজ লাগিয়ে অনুভূমিক সমান্তরাল রেখা আঁকতে সাহায্য করে।
- **সেট-স্কয়ার (Set Squares):** ৩০°-৬০° এবং ৪৫°-৪৫° কোণের সেট-স্কয়ার ব্যবহার করে সমকোণ ও কৌণিক রেখা আঁকা হয়।
- **পেন্সিল গ্রেড:** 2H (হালকা নির্মাণ রেখা), HB (বর্ডার ও টাইটেল)।`,
            createdAt: "2026-01-22T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 5002,
            chapterId: 501,
            orderIndex: 2,
            itemType: "QUIZ",
            title: "Quiz 1: Drawing Tools & Line Conventions Evaluation",
            titleBangla: "১.২ কুইজ ১: টেকনিক্যাল ড্রয়িং সরঞ্জাম ও লাইন যাচাই",
            isPublished: true,
            isMandatory: true,
            xpReward: 50,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 60,
            attemptLimit: 3,
            passingScore: 60,
            durationMinutes: 4,
            timeLimitSeconds: 240,
            shuffleQuestions: true,
            showCorrectAnswersAfter: true,
            quizQuestions: [
              {
                id: "q-5002-1",
                questionText: "ড্রয়িং বোর্ডে অনুভূমিক (Horizontal) সমান্তরাল রেখা টানতে কোন সরঞ্জামটি ব্যবহার করা হয়?",
                options: ["টি-স্কেল (T-Square)", "প্রোটেক্টর (চাঁদা)", "ফ্রেঞ্চ কার্ভ", "ডিভাইডার"],
                correctOptionIndex: 0,
                explanation: "টি-স্কেল ড্রয়িং বোর্ডের পাশে আটকে নির্ভুল অনুভূমিক রেখা আঁকতে ব্যবহৃত হয়।",
                marks: 1
              },
              {
                id: "q-5002-2",
                questionText: "হালকা নির্মাণ রেখা (Construction lines) আঁকার জন্য কোন পেন্সিলটি উপযুক্ত?",
                options: ["2H বা 3H", "6B", "HB", "2B"],
                correctOptionIndex: 0,
                explanation: "2H/3H পেন্সিল শক্ত এবং পরিষ্কার হালকা রেখা তৈরি করে।",
                marks: 1
              }
            ],
            createdAt: "2026-01-22T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          }
        ]
      }
    ]
  },
  {
    id: 6,
    code: "CRS-PV-801",
    title: "Pre-Vocational Basic Electricity & Everyday Workshop Safety",
    titleBangla: "প্রাক-কারিগরি বেসিক ইলেকট্রিসিটি ও ওয়ার্কশপ নিরাপত্তা",
    description: "৮ম শ্রেণির সাধারণ পাঠ্যক্রমের জন্য বিদ্যুতের মূল ধারণা, সার্কিট উপাদান ও হ্যান্ড টুলস ব্যবহার বিধি।",
    classId: 8,
    className: "Class 8",
    numericClass: 8,
    tradeId: null,
    tradeCode: null,
    tradeName: "সাধারণ প্রাক-কারিগরি (ট্রেড প্রযোজ্য নয়)",
    subjectId: 601,
    subjectCode: "PVE-801",
    subjectName: "বেসিক ইলেকট্রিসিটি ও টুলস",
    thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
    badgeGradient: "from-amber-600 to-yellow-700",
    isPublished: true,
    orderIndex: 6,
    totalXp: 300,
    estimatedHours: 6.0,
    difficulty: "Beginner",
    createdAt: "2026-01-25T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    chapters: [
      {
        id: 601,
        courseId: 6,
        chapterNumber: 1,
        title: "Basic Electrical Quantities: Voltage, Current and Resistance",
        titleBangla: "অধ্যায় ১: প্রাথমিক বৈদ্যুতিক রাশি: ভোল্টেজ, কারেন্ট ও রেজিস্ট্যান্স",
        description: "বৈদ্যুতিক প্রবাহের উৎস, পরিবাহী-অপরিবাহী ও সরল সার্কিটের গঠন।",
        orderIndex: 1,
        isPublished: true,
        unlockRule: "IMMEDIATE",
        requiredMinXp: 0,
        createdAt: "2026-01-25T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        items: [
          {
            id: 6001,
            chapterId: 601,
            orderIndex: 1,
            itemType: "BLOG_PART",
            title: "Part 1: What is Electricity and Types of Electric Circuits",
            titleBangla: "১.১ ব্লগ পার্ট ১: বিদ্যুৎ কী ও সাধারণ সার্কিটের মূল উপাদান",
            isPublished: true,
            isMandatory: true,
            xpReward: 45,
            unlockRule: "UNLOCKED",
            minScoreToUnlockNext: 0,
            attemptLimit: 0,
            passingScore: 100,
            durationMinutes: 5,
            blogPartNumber: 1,
            readTimeMinutes: 4,
            summary: "একটি সম্পূর্ণ বৈদ্যুতিক সার্কিটে পাওয়ার সোর্স, পরিবাহী তার, সুইচ ও লোড থাকে।",
            keyTakeaways: [
              "ইলেকট্রন প্রবাহের হারকেই কারেন্ট (Current) বলে, একক অ্যাম্পিয়ার (A)।",
              "কারেন্ট প্রবাহিত করতে যে চাপের সৃষ্টি হয় তাকে ভোল্টেজ (Voltage) বলে।",
              "তামা (Copper) হলো সর্বোত্তম সাধারণ বৈদ্যুতিক পরিবাহী।"
            ],
            contentMarkdown: `# ১.১ বিদ্যুৎ ও সাধারণ সার্কিটের উপাদান

৮ম শ্রেণির প্রাক-কারিগরি সাধারণ বিজ্ঞান ও টেকনিক্যাল ক্লাসে বিদ্যুৎ একটি আবশ্যক বিষয়।

## সার্কিটের প্রধান ৪টি উপাদান
1. **উৎস (Source):** ব্যাটারি বা জেনারেটর যা ভোল্টেজ সরবরাহ করে।
2. **পরিবাহী (Conductor):** কপার বা তামার তার যার মধ্য দিয়ে ইলেকট্রন ছুটে যায়।
3. **কন্ট্রোলিং ডিভাইস (Control):** সুইচ যা সার্কিট বন্ধ বা চালু করে।
4. **লোড (Load):** বাতি, ফ্যান বা হিটার যা বিদ্যুৎ খরচ করে কাজ সম্পন্ন করে।`,
            createdAt: "2026-01-25T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 6002,
            chapterId: 601,
            orderIndex: 2,
            itemType: "QUIZ",
            title: "Quiz 1: Electric Current & Circuit Fundamentals",
            titleBangla: "১.২ কুইজ ১: বিদ্যুৎ ও সার্কিট উপাদান মূল্যায়ন",
            isPublished: true,
            isMandatory: true,
            xpReward: 55,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 60,
            attemptLimit: 3,
            passingScore: 60,
            durationMinutes: 4,
            timeLimitSeconds: 240,
            shuffleQuestions: true,
            showCorrectAnswersAfter: true,
            quizQuestions: [
              {
                id: "q-6002-1",
                questionText: "বৈদ্যুতিক কারেন্টের আন্তর্জাতিক একক (SI Unit) কোনটি?",
                options: ["অ্যাম্পিয়ার (Ampere)", "ভোল্ট (Volt)", "ওহম (Ohm)", "ওয়াট (Watt)"],
                correctOptionIndex: 0,
                explanation: "কারেন্টের একক অ্যাম্পিয়ার (A)।",
                marks: 1
              },
              {
                id: "q-6002-2",
                questionText: "নিচের কোনটি বিদ্যুৎ অপরিবাহী (Insulator)?",
                options: ["শুকনো কাঠ ও রাবার", "তামার তার", "লোহার পেরেক", "অ্যালুমিনিয়াম শিট"],
                correctOptionIndex: 0,
                explanation: "শুকনো কাঠ, রাবার ও প্লাস্টিকের ভেতর দিয়ে বিদ্যুৎ প্রবাহিত হতে পারে না।",
                marks: 1
              }
            ],
            createdAt: "2026-01-25T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          }
        ]
      }
    ]
  },
  {
    id: 7,
    code: "CRS-HSC-1101",
    title: "Advanced IoT Architecture, Microcontrollers & Python Control",
    titleBangla: "উচ্চতর আইওটি সিস্টেম, মাইক্রোকন্ট্রোলার ও পাইথন অটোমেশন",
    description: "১১শ শ্রেণির এইচএসসি ভোকেশনাল শিক্ষার্থীদের জন্য ESP32 সেন্সর ইন্টারফেসিং ও ক্লাউড ডাটাবেস কমিউনিকেশন।",
    classId: 11,
    className: "Class 11 (HSC Vocational)",
    numericClass: 11,
    tradeId: 201,
    tradeCode: "HSC-T1",
    tradeName: "Computer & IoT System (কম্পিউটার অ্যান্ড আইওটি সিস্টেম)",
    subjectId: 701,
    subjectCode: "IOT-1101",
    subjectName: "এডভান্সড আইওটি ও এমবেডেড সিস্টেম",
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    badgeGradient: "from-cyan-600 to-indigo-800",
    isPublished: true,
    orderIndex: 7,
    totalXp: 450,
    estimatedHours: 10.0,
    difficulty: "Advanced",
    createdAt: "2026-01-28T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    chapters: [
      {
        id: 701,
        courseId: 7,
        chapterNumber: 1,
        title: "ESP32 Wi-Fi Architecture & MQTT Protocol Fundamentals",
        titleBangla: "অধ্যায় ১: ESP32 ওয়াই-ফাই আর্কিটেকচার ও MQTT প্রোটোকল",
        description: "ডুয়াল-কোর মাইক্রোকন্ট্রোলারের পিন কনফিগারেশন ও ক্লাউড ব্রোকার সংযোগ।",
        orderIndex: 1,
        isPublished: true,
        unlockRule: "IMMEDIATE",
        requiredMinXp: 0,
        createdAt: "2026-01-28T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        items: [
          {
            id: 7001,
            chapterId: 701,
            orderIndex: 1,
            itemType: "BLOG_PART",
            title: "Part 1: The Publish-Subscribe Pattern in IoT Messaging",
            titleBangla: "১.১ ব্লগ পার্ট ১: আইওটি নেটওয়ার্কে MQTT পাবলিশ-সাবস্ক্রাইব মডেল",
            isPublished: true,
            isMandatory: true,
            xpReward: 60,
            unlockRule: "UNLOCKED",
            minScoreToUnlockNext: 0,
            attemptLimit: 0,
            passingScore: 100,
            durationMinutes: 6,
            blogPartNumber: 1,
            readTimeMinutes: 5,
            summary: "MQTT হলো হালকা ওজনের বাইনারি মেসেজিং প্রোটোকল যা সেন্সর থেকে ক্লাউডে সর্বনিম্ন ব্যান্ডউইথে ডেটা পাঠায়।",
            keyTakeaways: [
              "MQTT (Message Queuing Telemetry Transport) ক্লায়েন্ট-সার্ভার নয় বরং পাবলিশার-ব্রোকার-সাবস্ক্রাইবার মডেলে চলে।",
              "টপিক ভিত্তিক মেসেজ রাউটিং (e.g., ptsc/lab1/temperature) ব্যবহৃত হয়।",
              "QoS (Quality of Service) লেভেল ০, ১ ও ২ দ্বারা মেসেজ ডেলিভারি নিশ্চিত করা হয়।"
            ],
            contentMarkdown: `# ১.১ আইওটি ও MQTT আর্কিটেকচার

এইচএসসি ভোকেশনাল ১১শ শ্রেণির শিক্ষার্থীদের জন্য আইওটি প্রোটোকল অত্যন্ত গুরুত্বপূর্ণ।

## MQTT-র মূল বৈশিষ্ট্য
- **লাইটওয়েট হেডার:** মাত্র ২ বাইটের ফিক্সড হেডার থাকে।
- **পাব/সাব আর্কিটেকচার:** সেন্সর কোনো নির্দিষ্ট ডিভাইসকে না পাঠিয়ে সেন্ট্রাল ব্রোকারে 'Topic' অনুযায়ী পাবলিশ করে।
- **রিয়েল-টাইম অটোমেশন:** ব্রাউজার ও মোবাইল অ্যাপ সরাসরি ডেটা রিসিভ করতে পারে।`,
            createdAt: "2026-01-28T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 7002,
            chapterId: 701,
            orderIndex: 2,
            itemType: "QUIZ",
            title: "Quiz 1: IoT Communication Protocols & ESP32 Diagnostic",
            titleBangla: "১.২ কুইজ ১: আইওটি প্রোটোকল ও মাইক্রোকন্ট্রোলার যাচাই",
            isPublished: true,
            isMandatory: true,
            xpReward: 70,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 60,
            attemptLimit: 3,
            passingScore: 60,
            durationMinutes: 5,
            timeLimitSeconds: 300,
            shuffleQuestions: true,
            showCorrectAnswersAfter: true,
            quizQuestions: [
              {
                id: "q-7002-1",
                questionText: "আইওটি ডিভাইসে সেন্সর ডেটা ক্লাউডে পাঠাতে কোন লাইটওয়েট প্রোটোকলটি সবচেয়ে জনপ্রিয়?",
                options: ["MQTT", "FTP", "Telnet", "SMTP"],
                correctOptionIndex: 0,
                explanation: "MQTT অতি ক্ষুদ্র ব্যান্ডউইথ ও লো-পাওয়ার ডিভাইসের জন্য আদর্শ।",
                marks: 1
              },
              {
                id: "q-7002-2",
                questionText: "ESP32 মাইক্রোকন্ট্রোলারে বিল্ট-ইন কোন বেতার প্রযুক্তিগুলো থাকে?",
                options: ["Wi-Fi ও Bluetooth (BLE)", "শুধু ইনফ্রারেড", "কেবলমাত্র 2G সিম স্লট", "স্যাটেলাইট রেডিও"],
                correctOptionIndex: 0,
                explanation: "ESP32-তে বিল্ট-ইন 2.4 GHz Wi-Fi ও ব্লুটুথ ৪.২/BLE রয়েছে।",
                marks: 1
              }
            ],
            createdAt: "2026-01-28T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          }
        ]
      }
    ]
  },
  {
    id: 8,
    code: "CRS-HSC-1201",
    title: "PLC Automation, Relay Logic & Industrial Electronic Control",
    titleBangla: "পিএলসি অটোমেশন, রিলে লজিক ও শিল্প ইলেকট্রনিক নিয়ন্ত্রণ",
    description: "১২শ শ্রেণির শিক্ষার্থীদের জন্য লেডার লজিক প্রোগ্রামিং, ইন্ডাস্ট্রিয়াল সেন্সর ও ভিএফডি মোটর স্পিড কন্ট্রোল।",
    classId: 12,
    className: "Class 12 (HSC Vocational)",
    numericClass: 12,
    tradeId: 203,
    tradeCode: "HSC-T3",
    tradeName: "Electronic Control & Communication (ইলেকট্রনিক কন্ট্রোল)",
    subjectId: 801,
    subjectCode: "PLC-1201",
    subjectName: "ইন্ডাস্ট্রিয়াল কন্ট্রোল ও পিএলসি",
    thumbnailUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
    badgeGradient: "from-purple-600 to-indigo-900",
    isPublished: true,
    orderIndex: 8,
    totalXp: 500,
    estimatedHours: 12.0,
    difficulty: "Advanced",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    chapters: [
      {
        id: 801,
        courseId: 8,
        chapterNumber: 1,
        title: "Programmable Logic Controllers (PLC) Architecture & Ladder Diagram",
        titleBangla: "অধ্যায় ১: পিএলসি আর্কিটেকচার ও লেডার লজিক ডায়াগ্রাম",
        description: "NO/NC কন্টাক্ট, টাইমার ও কাউন্টার ভিত্তিক মোটর স্টার্ট-স্টপ ইন্টারলকিং।",
        orderIndex: 1,
        isPublished: true,
        unlockRule: "IMMEDIATE",
        requiredMinXp: 0,
        createdAt: "2026-02-01T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        items: [
          {
            id: 8001,
            chapterId: 801,
            orderIndex: 1,
            itemType: "BLOG_PART",
            title: "Part 1: Basic Ladder Logic Symbols & Motor Interlocking",
            titleBangla: "১.১ ব্লগ পার্ট ১: পিএলসি লেডার লজিক প্রতীক ও মোটর ইন্টারলকিং",
            isPublished: true,
            isMandatory: true,
            xpReward: 65,
            unlockRule: "UNLOCKED",
            minScoreToUnlockNext: 0,
            attemptLimit: 0,
            passingScore: 100,
            durationMinutes: 6,
            blogPartNumber: 1,
            readTimeMinutes: 5,
            summary: "ইন্ডাস্ট্রিয়াল কারখানায় তারের রিলে প্যানেলের বদলে সফটওয়্যার প্রোগ্রামিং দিয়ে মেশিন পরিচালনা করতে পিএলসি ব্যবহৃত হয়।",
            keyTakeaways: [
              "PLC-র পূর্ণরূপ Programmable Logic Controller।",
              "লেডার ডায়াগ্রামে বাম পাশের ভার্টিক্যাল লাইন হলো পাওয়ার রেল এবং ডান পাশ নিউট্রাল রেল।",
              "NO (Normally Open) কন্টাক্ট ইনপুট সিগন্যাল পেলে ক্লোজ হয়।"
            ],
            contentMarkdown: `# ১.১ পিএলসি লেডার ডায়াগ্রামের মূলনীতি

শিল্প কারখানার অটোমেশনে ১২শ শ্রেণির ইলেকট্রনিক্স শিক্ষার্থীদের জন্য পিএলসি অপরিহার্য।

## মূল উপাদানসমূহ
1. **ইনপুট মডিউল:** পুশ বাটন, লিমিট সুইচ, প্রক্সিমিটি সেন্সর।
2. **সিপিইউ (CPU):** প্রোগ্রাম মেমোরি অনুযায়ী লজিক স্ক্যান করে আউটপুট নির্ধারণ করে।
3. **আউটপুট মডিউল:** রিলে, ম্যাগনেটিক কন্টাক্টর, সোলেনয়েড ভালভ।`,
            createdAt: "2026-02-01T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          },
          {
            id: 8002,
            chapterId: 801,
            orderIndex: 2,
            itemType: "QUIZ",
            title: "Quiz 1: Industrial Automation & PLC Logic Diagnostic",
            titleBangla: "১.২ কুইজ ১: পিএলসি ও লেডার লজিক মূল্যায়ন",
            isPublished: true,
            isMandatory: true,
            xpReward: 75,
            unlockRule: "PREVIOUS_ITEM_COMPLETED",
            minScoreToUnlockNext: 60,
            attemptLimit: 3,
            passingScore: 60,
            durationMinutes: 5,
            timeLimitSeconds: 300,
            shuffleQuestions: true,
            showCorrectAnswersAfter: true,
            quizQuestions: [
              {
                id: "q-8002-1",
                questionText: "PLC-র পূর্ণরূপ কী?",
                options: [
                  "Programmable Logic Controller",
                  "Power Line Connector",
                  "Permanent Laser Circuit",
                  "Public Light Company"
                ],
                correctOptionIndex: 0,
                explanation: "Programmable Logic Controller হলো শিল্প কারখানায় ব্যবহৃত ডিজিটাল কম্পিউটার।",
                marks: 1
              },
              {
                id: "q-8002-2",
                questionText: "লেডার লজিকে সাধারণ অবস্থায় খোলা থাকে এমন সুইচ কন্টাক্টকে কী বলা হয়?",
                options: ["NO (Normally Open)", "NC (Normally Closed)", "Timer Coil", "Ground"],
                correctOptionIndex: 0,
                explanation: "NO কন্টাক্ট বাটন চাপলে বা সিগন্যাল পেলেই কেবল বিদ্যুৎ সঞ্চালন করে।",
                marks: 1
              }
            ],
            createdAt: "2026-02-01T00:00:00.000Z",
            updatedAt: "2026-02-01T00:00:00.000Z",
          }
        ]
      }
    ]
  }
];

// In-Memory Database Store (singleton persistence in Node process)
class ChapterLearningStore {
  private courses: CourseItem[] = JSON.parse(JSON.stringify(INITIAL_COURSES));
  private progressStore: Map<string, StudentItemProgressData[]> = new Map(); // studentRoll -> progresses

  constructor() {
    this.seedSampleStudentProgress();
  }

  private seedSampleStudentProgress() {
    // Seed sample progress for demonstration student "10" / "PTSC-2026-9-001"
    const roll = "10";
    const sampleProgress: StudentItemProgressData[] = [
      {
        id: 1,
        studentRoll: roll,
        studentName: "রিপন আহমেদ",
        itemId: 1001,
        status: "COMPLETED",
        attemptsCount: 1,
        bestScore: 100,
        lastScore: 100,
        isPassed: true,
        xpEarned: 50,
        completedAt: "2026-10-10T12:00:00.000Z",
        timeSpentSeconds: 320,
      },
      {
        id: 2,
        studentRoll: roll,
        studentName: "রিপন আহমেদ",
        itemId: 1002,
        status: "COMPLETED",
        attemptsCount: 1,
        bestScore: 100,
        lastScore: 100,
        isPassed: true,
        xpEarned: 60,
        completedAt: "2026-10-10T12:15:00.000Z",
        timeSpentSeconds: 180,
      }
    ];
    this.progressStore.set(roll, sampleProgress);
  }

  // ==========================================
  // COURSE MANAGEMENT
  // ==========================================

  public getAllCourses(filters?: {
    classId?: number;
    tradeCode?: string;
    tradeId?: number;
    search?: string;
    isPublished?: boolean;
  }): CourseItem[] {
    let result = [...this.courses];

    if (filters) {
      if (filters.classId) {
        result = result.filter(c => c.classId === Number(filters.classId) || c.numericClass === Number(filters.classId));
      }
      if (filters.tradeCode && filters.tradeCode !== "all") {
        result = result.filter(c => c.tradeCode === filters.tradeCode || (!c.tradeCode && filters.tradeCode === "General"));
      }
      if (filters.tradeId !== undefined && filters.tradeId !== null) {
        result = result.filter(c => c.tradeId === Number(filters.tradeId));
      }
      if (filters.isPublished !== undefined) {
        result = result.filter(c => c.isPublished === filters.isPublished);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(c => 
          c.title.toLowerCase().includes(q) ||
          c.titleBangla.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
          (c.subjectName && c.subjectName.toLowerCase().includes(q))
        );
      }
    }

    return result.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public getCourseById(id: number): CourseItem | null {
    return this.courses.find(c => c.id === Number(id)) || null;
  }

  public createCourse(data: Partial<CourseItem>): CourseItem {
    const nextId = this.courses.length > 0 ? Math.max(...this.courses.map(c => c.id)) + 1 : 1;
    const now = new Date().toISOString();

    const newCourse: CourseItem = {
      id: nextId,
      code: data.code || `CRS-VOC-${Date.now().toString().slice(-4)}`,
      title: data.title || "New Technical Course",
      titleBangla: data.titleBangla || "নতুন কারিগরি কোর্স",
      description: data.description || "",
      classId: data.classId || 9,
      className: data.className || "Class 9 (Vocational)",
      numericClass: data.numericClass || (data.classId || 9),
      tradeId: data.tradeId ?? null,
      tradeCode: data.tradeCode ?? null,
      tradeName: data.tradeName ?? null,
      subjectId: data.subjectId ?? null,
      subjectCode: data.subjectCode ?? null,
      subjectName: data.subjectName ?? null,
      thumbnailUrl: data.thumbnailUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
      badgeGradient: data.badgeGradient || "from-indigo-600 to-cyan-600",
      isPublished: data.isPublished ?? true,
      orderIndex: data.orderIndex || this.courses.length + 1,
      totalXp: data.totalXp || 300,
      estimatedHours: data.estimatedHours || 10.0,
      difficulty: data.difficulty || "Intermediate",
      chapters: [],
      createdAt: now,
      updatedAt: now,
    };

    this.courses.push(newCourse);
    return newCourse;
  }

  public updateCourse(id: number, updates: Partial<CourseItem>): CourseItem | null {
    const courseIndex = this.courses.findIndex(c => c.id === Number(id));
    if (courseIndex === -1) return null;

    this.courses[courseIndex] = {
      ...this.courses[courseIndex],
      ...updates,
      id: Number(id), // Protect ID
      updatedAt: new Date().toISOString(),
    };

    return this.courses[courseIndex];
  }

  public deleteCourse(id: number): boolean {
    const initialLen = this.courses.length;
    this.courses = this.courses.filter(c => c.id !== Number(id));
    return this.courses.length < initialLen;
  }

  // ==========================================
  // CHAPTER MANAGEMENT
  // ==========================================

  public createChapter(courseId: number, data: Partial<CourseChapterItem>): CourseChapterItem | null {
    const course = this.getCourseById(courseId);
    if (!course) return null;

    const allChapterIds = this.courses.flatMap(c => c.chapters.map(ch => ch.id));
    const nextChapterId = allChapterIds.length > 0 ? Math.max(...allChapterIds) + 1 : 101;
    const now = new Date().toISOString();

    const newChapter: CourseChapterItem = {
      id: nextChapterId,
      courseId: Number(courseId),
      chapterNumber: data.chapterNumber || course.chapters.length + 1,
      title: data.title || "New Chapter",
      titleBangla: data.titleBangla || `অধ্যায় ${course.chapters.length + 1}: নতুন পাঠ`,
      description: data.description || "",
      orderIndex: data.orderIndex || course.chapters.length + 1,
      isPublished: data.isPublished ?? true,
      unlockRule: data.unlockRule || "PREVIOUS_COMPLETED",
      requiredMinXp: data.requiredMinXp || 0,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    course.chapters.push(newChapter);
    course.updatedAt = now;
    return newChapter;
  }

  public getChapterById(chapterId: number): { chapter: CourseChapterItem; course: CourseItem } | null {
    for (const course of this.courses) {
      const chapter = course.chapters.find(ch => ch.id === Number(chapterId));
      if (chapter) {
        return { chapter, course };
      }
    }
    return null;
  }

  public updateChapter(chapterId: number, updates: Partial<CourseChapterItem>): CourseChapterItem | null {
    for (const course of this.courses) {
      const idx = course.chapters.findIndex(ch => ch.id === Number(chapterId));
      if (idx !== -1) {
        course.chapters[idx] = {
          ...course.chapters[idx],
          ...updates,
          id: Number(chapterId),
          courseId: course.id,
          updatedAt: new Date().toISOString(),
        };
        return course.chapters[idx];
      }
    }
    return null;
  }

  public deleteChapter(chapterId: number): boolean {
    for (const course of this.courses) {
      const initial = course.chapters.length;
      course.chapters = course.chapters.filter(ch => ch.id !== Number(chapterId));
      if (course.chapters.length < initial) {
        // Re-index remaining chapters
        course.chapters.forEach((ch, idx) => {
          ch.orderIndex = idx + 1;
        });
        return true;
      }
    }
    return false;
  }

  public reorderCourseChapters(courseId: number, chapterIdsInOrder: number[]): boolean {
    const course = this.getCourseById(courseId);
    if (!course) return false;

    const chapterMap = new Map(course.chapters.map(ch => [ch.id, ch]));
    const reordered: CourseChapterItem[] = [];

    chapterIdsInOrder.forEach((id, index) => {
      const ch = chapterMap.get(id);
      if (ch) {
        ch.orderIndex = index + 1;
        reordered.push(ch);
      }
    });

    // Add any missing chapters at the end
    course.chapters.forEach(ch => {
      if (!chapterIdsInOrder.includes(ch.id)) {
        ch.orderIndex = reordered.length + 1;
        reordered.push(ch);
      }
    });

    course.chapters = reordered;
    course.updatedAt = new Date().toISOString();
    return true;
  }

  // ==========================================
  // CONTENT ITEMS (BLOG PARTS & QUIZZES)
  // ==========================================

  public createContentItem(chapterId: number, data: Partial<ChapterContentItemData>): ChapterContentItemData | null {
    for (const course of this.courses) {
      const chapter = course.chapters.find(ch => ch.id === Number(chapterId));
      if (chapter) {
        const allItemIds = this.courses.flatMap(c => c.chapters.flatMap(ch => ch.items.map(it => it.id)));
        const nextItemId = allItemIds.length > 0 ? Math.max(...allItemIds) + 1 : 1001;
        const now = new Date().toISOString();

        const itemType = data.itemType || "BLOG_PART";
        const blogPartNum = itemType === "BLOG_PART" 
          ? (data.blogPartNumber || chapter.items.filter(i => i.itemType === "BLOG_PART").length + 1)
          : undefined;

        const newItem: ChapterContentItemData = {
          id: nextItemId,
          chapterId: Number(chapterId),
          orderIndex: data.orderIndex || chapter.items.length + 1,
          itemType,
          title: data.title || (itemType === "BLOG_PART" ? `Part ${blogPartNum}: Lesson Text` : "Interactive Assessment Quiz"),
          titleBangla: data.titleBangla || (itemType === "BLOG_PART" ? `ব্লগ পার্ট ${blogPartNum}: পাঠ্য বিষয়` : "কুইজ মূল্যায়ন"),
          isPublished: data.isPublished ?? true,
          isMandatory: data.isMandatory ?? true,
          xpReward: data.xpReward ?? (itemType === "BLOG_PART" ? 50 : 75),
          unlockRule: data.unlockRule || "PREVIOUS_ITEM_COMPLETED",
          minScoreToUnlockNext: data.minScoreToUnlockNext ?? (itemType === "QUIZ" ? 60 : 0),
          attemptLimit: data.attemptLimit ?? (itemType === "QUIZ" ? 3 : 0),
          passingScore: data.passingScore ?? 60,
          durationMinutes: data.durationMinutes || (itemType === "BLOG_PART" ? 6 : 5),

          blogPartNumber: blogPartNum,
          contentMarkdown: data.contentMarkdown || (itemType === "BLOG_PART" ? "# পাঠের শিরোনাম\n\nএখানে বিস্তারিত টেকনিক্যাল আলোচনা লিখুন..." : undefined),
          summary: data.summary || "",
          keyTakeaways: data.keyTakeaways || [],
          readTimeMinutes: data.readTimeMinutes || 5,

          quizId: data.quizId,
          quizQuestions: data.quizQuestions || (itemType === "QUIZ" ? [
            {
              id: `q-${nextItemId}-1`,
              questionText: "একটি আদর্শ নমুনা প্রশ্ন?",
              options: ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
              correctOptionIndex: 0,
              explanation: "সঠিক উত্তরের ব্যাখ্যা এখানে প্রদান করা হয়েছে।",
              marks: 1
            }
          ] : undefined),
          timeLimitSeconds: data.timeLimitSeconds || 300,
          shuffleQuestions: data.shuffleQuestions ?? true,
          showCorrectAnswersAfter: data.showCorrectAnswersAfter ?? true,

          createdAt: now,
          updatedAt: now,
        };

        chapter.items.push(newItem);
        chapter.updatedAt = now;
        course.updatedAt = now;
        return newItem;
      }
    }
    return null;
  }

  public updateContentItem(itemId: number, updates: Partial<ChapterContentItemData>): ChapterContentItemData | null {
    for (const course of this.courses) {
      for (const chapter of course.chapters) {
        const idx = chapter.items.findIndex(it => it.id === Number(itemId));
        if (idx !== -1) {
          chapter.items[idx] = {
            ...chapter.items[idx],
            ...updates,
            id: Number(itemId),
            chapterId: chapter.id,
            updatedAt: new Date().toISOString(),
          };
          chapter.updatedAt = new Date().toISOString();
          course.updatedAt = new Date().toISOString();
          return chapter.items[idx];
        }
      }
    }
    return null;
  }

  public deleteContentItem(itemId: number): boolean {
    for (const course of this.courses) {
      for (const chapter of course.chapters) {
        const initial = chapter.items.length;
        chapter.items = chapter.items.filter(it => it.id !== Number(itemId));
        if (chapter.items.length < initial) {
          // Re-index remaining items
          chapter.items.forEach((it, idx) => {
            it.orderIndex = idx + 1;
          });
          return true;
        }
      }
    }
    return false;
  }

  public reorderChapterItems(chapterId: number, itemIdsInOrder: number[]): boolean {
    for (const course of this.courses) {
      const chapter = course.chapters.find(ch => ch.id === Number(chapterId));
      if (chapter) {
        const itemMap = new Map(chapter.items.map(it => [it.id, it]));
        const reordered: ChapterContentItemData[] = [];

        itemIdsInOrder.forEach((id, index) => {
          const item = itemMap.get(id);
          if (item) {
            item.orderIndex = index + 1;
            reordered.push(item);
          }
        });

        // Add any items not in array to the end
        chapter.items.forEach(it => {
          if (!itemIdsInOrder.includes(it.id)) {
            it.orderIndex = reordered.length + 1;
            reordered.push(it);
          }
        });

        chapter.items = reordered;
        chapter.updatedAt = new Date().toISOString();
        return true;
      }
    }
    return false;
  }

  // ==========================================
  // PROGRESS & SEQUENTIAL UNLOCKING ENGINE
  // ==========================================

  public getStudentProgressList(studentRoll: string): StudentItemProgressData[] {
    return this.progressStore.get(studentRoll) || [];
  }

  public getStudentItemProgress(studentRoll: string, itemId: number): StudentItemProgressData | null {
    const list = this.getStudentProgressList(studentRoll);
    return list.find(p => p.itemId === Number(itemId)) || null;
  }

  public setStudentItemProgress(studentRoll: string, data: StudentItemProgressData): void {
    const list = this.getStudentProgressList(studentRoll);
    const existingIdx = list.findIndex(p => p.itemId === data.itemId);
    if (existingIdx !== -1) {
      list[existingIdx] = { ...list[existingIdx], ...data };
    } else {
      list.push(data);
    }
    this.progressStore.set(studentRoll, list);

    // Asynchronous background persistence to Prisma MySQL if available
    if (isPrismaAvailable()) {
      try {
        prisma.studentItemProgress.upsert({
          where: {
            studentRoll_itemId: {
              studentRoll: data.studentRoll,
              itemId: data.itemId,
            },
          },
          update: {
            status: data.status,
            attemptsCount: data.attemptsCount,
            bestScore: data.bestScore,
            lastScore: data.lastScore,
            isPassed: data.isPassed,
            xpEarned: data.xpEarned,
            timeSpentSeconds: data.timeSpentSeconds,
            answers: data.answers ? JSON.stringify(data.answers) : null,
            completedAt: data.completedAt ? new Date(data.completedAt) : null,
          },
          create: {
            studentRoll: data.studentRoll,
            studentName: data.studentName,
            itemId: data.itemId,
            status: data.status,
            attemptsCount: data.attemptsCount,
            bestScore: data.bestScore,
            lastScore: data.lastScore,
            isPassed: data.isPassed,
            xpEarned: data.xpEarned,
            timeSpentSeconds: data.timeSpentSeconds,
            answers: data.answers ? JSON.stringify(data.answers) : null,
            completedAt: data.completedAt ? new Date(data.completedAt) : null,
          },
        }).catch((err: any) => {
          console.warn("[Prisma Progress Sync]", err?.message);
        });
      } catch (err: any) {
        console.warn("[Prisma Progress Catch]", err?.message);
      }
    }
  }

  /**
   * Enriches a course with strict sequential unlocking logic for a student.
   * Enforces rules both across chapters and across items within each chapter.
   */
  public evaluateStudentCourseProgress(course: CourseItem, studentRoll: string): EnrichedCourse {
    const studentProgressMap = new Map<number, StudentItemProgressData>();
    const progresses = this.getStudentProgressList(studentRoll);
    progresses.forEach(p => studentProgressMap.set(p.itemId, p));

    let totalCourseItems = 0;
    let completedCourseItems = 0;
    let totalEarnedXp = 0;

    let previousChapterCompleted = true; // Chapter 1 starts unlocked
    let firstPendingItemMarked = false;

    const enrichedChapters: EnrichedCourseChapter[] = course.chapters
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((chapter, chapterIdx) => {
        const isChapterLocked = chapter.unlockRule === "PREVIOUS_COMPLETED" && chapterIdx > 0 && !previousChapterCompleted;
        const chapterLockReason = isChapterLocked ? `পূর্ববর্তী অধ্যায় ${chapterIdx} সম্পূর্ণ করতে হবে` : undefined;

        let chapterAllMandatoryCompleted = true;
        let previousItemSatisfied = !isChapterLocked; // First item in chapter is unlocked if chapter is unlocked
        let completedInChapter = 0;

        const enrichedItems: EnrichedContentItem[] = chapter.items
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((item, itemIdx) => {
            totalCourseItems++;
            const progress = studentProgressMap.get(item.id) || null;

            if (progress && (progress.status === "COMPLETED" || progress.isPassed)) {
              completedInChapter++;
              completedCourseItems++;
              totalEarnedXp += progress.xpEarned;
            }

            // Determine locked state
            let isItemLocked = false;
            let itemLockReason: string | undefined;

            if (isChapterLocked) {
              isItemLocked = true;
              itemLockReason = chapterLockReason;
            } else if (itemIdx === 0) {
              // First item of chapter
              isItemLocked = false;
            } else {
              // Sequential item
              if (!previousItemSatisfied) {
                isItemLocked = true;
                const prevItem = chapter.items[itemIdx - 1];
                if (prevItem.itemType === "BLOG_PART") {
                  itemLockReason = `পূর্ববর্তী পাঠ '${prevItem.titleBangla}' সম্পন্ন করতে হবে`;
                } else {
                  itemLockReason = `পূর্ববর্তী কুইজে '${prevItem.titleBangla}' ন্যূনতম ${prevItem.minScoreToUnlockNext}% পেয়ে পাস করতে হবে`;
                }
              }
            }

            // Calculate attempt limits for quizzes
            const attemptsCount = progress ? progress.attemptsCount : 0;
            const attemptsRemaining = item.itemType === "QUIZ" && item.attemptLimit > 0
              ? Math.max(0, item.attemptLimit - attemptsCount)
              : null;

            const canAttempt = !isItemLocked && (attemptsRemaining === null || attemptsRemaining > 0);

            // Is this the student's next actionable step?
            let isCurrentNextStep = false;
            if (!isItemLocked && (!progress || progress.status !== "COMPLETED") && !firstPendingItemMarked) {
              isCurrentNextStep = true;
              firstPendingItemMarked = true;
            }

            // Update status for the next item in the chain
            const isThisItemPassed = progress ? (progress.status === "COMPLETED" || progress.isPassed) : false;
            if (item.isMandatory) {
              if (!isThisItemPassed) {
                previousItemSatisfied = false;
                chapterAllMandatoryCompleted = false;
              }
            }

            return {
              ...item,
              isLocked: isItemLocked,
              lockReason: itemLockReason,
              progress,
              attemptsRemaining,
              canAttempt,
              isCurrentNextStep,
            };
          });

        previousChapterCompleted = chapterAllMandatoryCompleted;

        return {
          ...chapter,
          isLocked: isChapterLocked,
          lockReason: chapterLockReason,
          completedItemsCount: completedInChapter,
          totalItemsCount: chapter.items.length,
          progressPercentage: chapter.items.length > 0 ? Math.round((completedInChapter / chapter.items.length) * 100) : 0,
          items: enrichedItems,
        };
      });

    const courseProgressPercentage = totalCourseItems > 0 
      ? Math.round((completedCourseItems / totalCourseItems) * 100) 
      : 0;

    return {
      ...course,
      chapters: enrichedChapters,
      totalCourseItems,
      completedCourseItems,
      courseProgressPercentage,
      totalEarnedXp,
      isCompleted: totalCourseItems > 0 && completedCourseItems >= totalCourseItems,
    };
  }

  /**
   * BACKEND ENFORCEMENT: Student marks a blog part as read/completed.
   * Validates prerequisites strictly on backend!
   */
  public completeBlogPart(
    itemId: number,
    studentRoll: string,
    studentName?: string,
    timeSpentSeconds: number = 60
  ): { success: boolean; error?: string; progress?: StudentItemProgressData; xpAwarded?: number } {
    let targetItem: ChapterContentItemData | null = null;
    let targetCourse: CourseItem | null = null;

    for (const course of this.courses) {
      for (const chapter of course.chapters) {
        const item = chapter.items.find(i => i.id === Number(itemId));
        if (item) {
          targetItem = item;
          targetCourse = course;
          break;
        }
      }
      if (targetItem) break;
    }

    if (!targetItem || !targetCourse) {
      return { success: false, error: "Content item not found" };
    }

    if (targetItem.itemType !== "BLOG_PART") {
      return { success: false, error: "Item is not a blog part" };
    }

    // STRICT BACKEND ACCESS VERIFICATION
    const enriched = this.evaluateStudentCourseProgress(targetCourse, studentRoll);
    let isItemAccessible = false;

    for (const ch of enriched.chapters) {
      const it = ch.items.find(i => i.id === Number(itemId));
      if (it) {
        if (!it.isLocked) {
          isItemAccessible = true;
        } else {
          return {
            success: false,
            error: `প্রবেশাধিকার সংরক্ষিত: ${it.lockReason || "পূর্ববর্তী প্রয়োজনীয় পাঠ এখনও সম্পন্ন করা হয়নি।"}`
          };
        }
        break;
      }
    }

    if (!isItemAccessible) {
      return { success: false, error: "Access Denied: This step is locked." };
    }

    const existingProgress = this.getStudentItemProgress(studentRoll, Number(itemId));
    const alreadyCompleted = existingProgress && existingProgress.status === "COMPLETED";

    const nextProgressId = Date.now();
    const updatedProgress: StudentItemProgressData = {
      id: existingProgress ? existingProgress.id : nextProgressId,
      studentRoll,
      studentName: studentName || existingProgress?.studentName || "Student",
      itemId: Number(itemId),
      status: "COMPLETED",
      attemptsCount: (existingProgress?.attemptsCount || 0) + 1,
      bestScore: 100,
      lastScore: 100,
      isPassed: true,
      xpEarned: alreadyCompleted ? existingProgress.xpEarned : targetItem.xpReward,
      completedAt: new Date().toISOString(),
      timeSpentSeconds: (existingProgress?.timeSpentSeconds || 0) + timeSpentSeconds,
    };

    this.setStudentItemProgress(studentRoll, updatedProgress);

    return {
      success: true,
      progress: updatedProgress,
      xpAwarded: alreadyCompleted ? 0 : targetItem.xpReward,
    };
  }

  /**
   * BACKEND ENFORCEMENT: Student submits quiz answers.
   * Evaluates score server-side, checks attempts limit and unlocks progression.
   */
  public submitQuizAttempt(
    itemId: number,
    studentRoll: string,
    answers: Record<string, number>, // questionId -> selectedOptionIndex
    studentName?: string,
    timeSpentSeconds: number = 60,
    tabSwitchedQuestionIds: string[] = []
  ): {
    success: boolean;
    error?: string;
    isPassed?: boolean;
    scorePercentage?: number;
    correctCount?: number;
    disqualifiedCount?: number;
    disqualifiedQuestionIds?: string[];
    totalQuestions?: number;
    xpAwarded?: number;
    progress?: StudentItemProgressData;
    attemptsRemaining?: number | null;
  } {
    let targetItem: ChapterContentItemData | null = null;
    let targetCourse: CourseItem | null = null;

    for (const course of this.courses) {
      for (const chapter of course.chapters) {
        const item = chapter.items.find(i => i.id === Number(itemId));
        if (item) {
          targetItem = item;
          targetCourse = course;
          break;
        }
      }
      if (targetItem) break;
    }

    if (!targetItem || !targetCourse) {
      return { success: false, error: "Quiz item not found" };
    }

    if (targetItem.itemType !== "QUIZ") {
      return { success: false, error: "Target is not a quiz" };
    }

    // STRICT BACKEND ACCESS VERIFICATION
    const enriched = this.evaluateStudentCourseProgress(targetCourse, studentRoll);
    let enrichedItem: EnrichedContentItem | null = null;

    for (const ch of enriched.chapters) {
      const it = ch.items.find(i => i.id === Number(itemId));
      if (it) {
        enrichedItem = it;
        break;
      }
    }

    if (!enrichedItem || enrichedItem.isLocked) {
      return {
        success: false,
        error: `কুইজ লক রয়েছে: ${enrichedItem?.lockReason || "পূর্ববর্তী অধ্যায় বা পাঠ সম্পন্ন করতে হবে।"}`
      };
    }

    const existingProgress = this.getStudentItemProgress(studentRoll, Number(itemId));
    const currentAttempts = existingProgress ? existingProgress.attemptsCount : 0;

    // Check attempt limit
    if (targetItem.attemptLimit > 0 && currentAttempts >= targetItem.attemptLimit) {
      return {
        success: false,
        error: `সর্বোচ্চ প্রচেষ্টার সীমা (${targetItem.attemptLimit} বার) শেষ হয়ে গেছে। পুনরায় অংশগ্রহণের সুযোগ নেই।`
      };
    }

    // Server-side scoring evaluation with strict Tab-Switch Anti-Cheat rule
    const questions = targetItem.quizQuestions || [];
    let correctCount = 0;
    const disqualifiedQuestionIds: string[] = [];

    questions.forEach(q => {
      const selected = answers[q.id];
      const isTabSwitched = Array.isArray(tabSwitchedQuestionIds) && tabSwitchedQuestionIds.includes(q.id);

      if (isTabSwitched) {
        // Tab was switched while this question was active:
        // Rule: Marks for this specific question MUST be 0 (zero), even if correct!
        disqualifiedQuestionIds.push(q.id);
      } else {
        // Other questions score normally
        if (selected !== undefined && selected === q.correctOptionIndex) {
          correctCount++;
        }
      }
    });

    const totalQuestions = questions.length;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isPassed = scorePercentage >= targetItem.passingScore;

    const newAttemptsCount = currentAttempts + 1;
    const bestScore = Math.max(existingProgress?.bestScore || 0, scorePercentage);
    const wasAlreadyPassed = existingProgress?.isPassed || false;

    const xpEarned = isPassed && !wasAlreadyPassed
      ? targetItem.xpReward
      : (existingProgress?.xpEarned || 0);

    const updatedProgress: StudentItemProgressData = {
      id: existingProgress ? existingProgress.id : Date.now(),
      studentRoll,
      studentName: studentName || existingProgress?.studentName || "Student",
      itemId: Number(itemId),
      status: isPassed ? "COMPLETED" : "FAILED",
      attemptsCount: newAttemptsCount,
      bestScore,
      lastScore: scorePercentage,
      isPassed: isPassed || wasAlreadyPassed,
      xpEarned,
      completedAt: isPassed ? new Date().toISOString() : existingProgress?.completedAt,
      timeSpentSeconds: (existingProgress?.timeSpentSeconds || 0) + timeSpentSeconds,
      answers,
    };

    this.setStudentItemProgress(studentRoll, updatedProgress);

    const attemptsRemaining = targetItem.attemptLimit > 0
      ? Math.max(0, targetItem.attemptLimit - newAttemptsCount)
      : null;

    return {
      success: true,
      isPassed,
      scorePercentage,
      correctCount,
      disqualifiedCount: disqualifiedQuestionIds.length,
      disqualifiedQuestionIds,
      totalQuestions,
      xpAwarded: isPassed && !wasAlreadyPassed ? targetItem.xpReward : 0,
      progress: updatedProgress,
      attemptsRemaining,
    };
  }

  /**
   * Computes student's total XP and overall stats across all courses.
   */
  public getStudentOverallStats(studentRoll: string): {
    totalXp: number;
    completedItemsCount: number;
    completedQuizzesCount: number;
    passedQuizzesCount: number;
    totalCoursesCount: number;
    completedCoursesCount: number;
    coursesProgress: {
      courseId: number;
      courseTitle: string;
      courseCode: string;
      percentage: number;
      isCompleted: boolean;
      totalItems: number;
      completedItems: number;
    }[];
  } {
    const list = this.getStudentProgressList(studentRoll);
    let totalXp = 0;
    let completedItemsCount = 0;
    let completedQuizzesCount = 0;
    let passedQuizzesCount = 0;

    list.forEach(p => {
      totalXp += p.xpEarned;
      if (p.status === "COMPLETED") completedItemsCount++;
      if (p.attemptsCount > 0) completedQuizzesCount++;
      if (p.isPassed) passedQuizzesCount++;
    });

    const coursesProgress = this.courses.map(course => {
      const enriched = this.evaluateStudentCourseProgress(course, studentRoll);
      return {
        courseId: course.id,
        courseTitle: course.titleBangla,
        courseCode: course.code,
        percentage: enriched.courseProgressPercentage,
        isCompleted: enriched.isCompleted,
        totalItems: enriched.totalCourseItems,
        completedItems: enriched.completedCourseItems,
      };
    });

    const completedCoursesCount = coursesProgress.filter(c => c.isCompleted).length;

    return {
      totalXp,
      completedItemsCount,
      completedQuizzesCount,
      passedQuizzesCount,
      totalCoursesCount: this.courses.length,
      completedCoursesCount,
      coursesProgress,
    };
  }
}

// Global Singleton to maintain state across Hot Module Reloads and API routes
declare global {
  // eslint-disable-next-line no-var
  var globalChapterLearningStore: ChapterLearningStore | undefined;
}

export const chapterLearningStore: ChapterLearningStore =
  globalThis.globalChapterLearningStore || (globalThis.globalChapterLearningStore = new ChapterLearningStore());
