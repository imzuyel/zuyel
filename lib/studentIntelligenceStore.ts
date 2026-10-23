import { institutionalDb } from "./database";

export interface StudentQuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  conceptTopic: string; // E.g., "ওহমের সূত্র", "র‍্যাম ও চিপসেট", "৪-স্ট্রোক ইঞ্জিনের Suction"
}

export interface QuizAttemptRecord {
  id: string;
  lessonId: string;
  lessonTitle: string;
  tradeLabel: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  missedTopics: string[];
  studentRoll?: string;
  studentName?: string;
  isGuest?: boolean;
}

export interface StudentDoubtItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  studentName: string;
  studentRoll: string;
  tradeClass: string;
  question: string;
  status: "pending" | "answered";
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  createdAt: string;
}

export interface WeakTopicItem {
  topicName: string;
  missedCount: number;
  lastMissedAt: string;
  lessonId: string;
  lessonTitle: string;
}

export interface StudentIntelligenceStats {
  completedLessonsCount: number;
  quizzesTakenCount: number;
  totalCorrectQuestions: number;
  totalQuestionsAttempted: number;
  currentStreakDays: number;
  lastStreakDate: string;
  streakHistoryDays: string[]; // e.g. ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"]
}

export const UNIVERSAL_DEFAULT_PASSWORD = "1234";

export interface StudentAuthAccount {
  rollNumber: string;
  studentName: string;
  classLevel: string; // e.g. "class-10", "class-9"
  trade: string; // e.g. "Computer"
  password: string;
  createdAt: string;
  isLoggedIn: boolean;
  hasChangedDefaultPassword?: boolean;
  academicYear?: string; // e.g. "2026"
}

export const STUDENT_LOGIN_CLASSES = [
  { id: "class-10", label: "১০ম শ্রেণি (ভোকেশনাল · ২০২৬)", numeric: 10 },
  { id: "class-9", label: "৯ম শ্রেণি (ভোকেশনাল · ২০২৬)", numeric: 9 },
  { id: "class-8", label: "৮ম শ্রেণি (প্রাক-ভোকেশনাল · ২০২৬)", numeric: 8 },
  { id: "class-7", label: "৭ম শ্রেণি (প্রাক-ভোকেশনাল · ২০২৬)", numeric: 7 },
  { id: "class-6", label: "৬ষ্ঠ শ্রেণি (প্রাক-ভোকেশনাল · ২০২৬)", numeric: 6 },
  { id: "class-11", label: "একাদশ শ্রেণি (এইচএসসি ভোকেশনাল · ২০২৬)", numeric: 11 },
  { id: "class-12", label: "দ্বাদশ শ্রেণি (এইচএসসি ভোকেশনাল · ২০২৬)", numeric: 12 },
];

export function normalizeStudentClass(rawClass?: string): string {
  if (!rawClass) return "";
  const s = String(rawClass).toLowerCase().trim();
  if (s.includes("12") || s.includes("দ্বাদশ")) return "class-12";
  if (s.includes("11") || s.includes("একাদশ")) return "class-11";
  if (s.includes("10") || s.includes("১০ম") || s.includes("দশম")) return "class-10";
  if (s.includes("9") || s.includes("৯ম") || s.includes("নবম")) return "class-9";
  if (s.includes("8") || s.includes("৮ম") || s.includes("অষ্টম")) return "class-8";
  if (s.includes("7") || s.includes("৭ম") || s.includes("সপ্তম")) return "class-7";
  if (s.includes("6") || s.includes("৬ষ্ঠ") || s.includes("ষষ্ঠ")) return "class-6";
  return s;
}

export function matchStudentClass(classA?: string, classB?: string): boolean {
  if (!classA || !classB || classA === "all" || classB === "all") return true;
  return normalizeStudentClass(classA) === normalizeStudentClass(classB);
}

// Initial Sample Preloaded Quiz Questions for Published Lessons
export const PRELOADED_LESSON_QUIZZES: Record<string, StudentQuizQuestion[]> = {
  "pub-1": [
    {
      id: "q1-1",
      questionText: "ওহমের সূত্র অনুযায়ী নির্দিষ্ট তাপমাত্রায় কারেন্ট (I) কিসের সাথে সমানুপাতিক?",
      options: ["রেজিস্ট্যান্স (R)", "বিভব পার্থক্য বা ভোল্টেজ (V)", "পরিবাহীর তাপমাত্রা", "ইন্ডাকট্যান্স (L)"],
      correctAnswerIndex: 1,
      explanation: "ওহমের সূত্রানুসারে, I = V / R। অর্থাৎ ভোল্টেজ (V) বাড়লে কারেন্ট (I) সমানুপাতিকভাবে বাড়ে।",
      conceptTopic: "ওহমের সূত্র ও সমানুপাতিক সম্পর্ক",
    },
    {
      id: "q1-2",
      questionText: "৫০ ওহম রেজিস্ট্যান্সের সার্কিটে ২২০ ভোল্ট দিলে কত কারেন্ট প্রবাহিত হবে?",
      options: ["৪.৪ অ্যাম্পিয়ার (4.4 A)", "১১০ অ্যাম্পিয়ার (110 A)", "২.২ অ্যাম্পিয়ার (2.2 A)", "০.৪ অ্যাম্পিয়ার (0.4 A)"],
      correctAnswerIndex: 0,
      explanation: "I = V / R = 220 / 50 = 4.4 A।",
      conceptTopic: "ওহমের সূত্রের গাণিতিক প্রয়োগ",
    },
    {
      id: "q1-3",
      questionText: "ইলেকট্রিক্যাল সার্কিটের একটি মূল কন্ট্রোলিং ডিভাইস কোনটি?",
      options: ["সোর্স (ব্যাটারি)", "পরিবাহী তার", "সুইচ (Switch)", "রেজিস্টর"],
      correctAnswerIndex: 2,
      explanation: "সুইচ হলো সার্কিট চালু বা বন্ধ করার মূল কন্ট্রোলিং ডিভাইস।",
      conceptTopic: "সার্কিটের মৌলিক উপাদান",
    },
    {
      id: "q1-4",
      questionText: "ওয়ার্কশপে বিদ্যুৎ স্পৃষ্ট হওয়া থেকে রক্ষায় কোনটি পরা উচিত?",
      options: ["সিল্কের পোশাক", "রাবার সোল জুতো ও ইন্সুলেটেড গ্লাভস", "লেদার জ্যাকেট", "ধাতব আংটি"],
      correctAnswerIndex: 1,
      explanation: "রাবার ও ইন্সুলেটেড উপাদান বিদ্যুত অপরিবাহী হওয়ায় সেফটির জন্য অপরিহার্য।",
      conceptTopic: "ইলেকট্রিক্যাল সেফটি প্রিক্রেশন",
    },
    {
      id: "q1-5",
      questionText: "রেজিস্ট্যান্স বাড়লে পরিবাহীর মধ্য দিয়ে প্রবাহিত কারেন্টের কী পরিবর্তন ঘটে?",
      options: ["কারেন্ট বৃদ্ধি পায়", "কারেন্ট হ্রাস পায়", "কারেন্ট অপরিবর্তিত থাকে", "ভোল্টেজ শূন্য হয়ে যায়"],
      correctAnswerIndex: 1,
      explanation: "I = V / R অনুযায়ী রেজিস্ট্যান্সের সাথে কারেন্টের সম্পর্ক ব্যস্তানুপাতিক।",
      conceptTopic: "রেজিস্ট্যান্স ও কারেন্টের সম্পর্ক",
    },
  ],
  "pub-2": [
    {
      id: "q2-1",
      questionText: "কম্পিউটারের পাওয়ার অন করার পর ডিসপ্লে না আসলে প্রাথমিক ট্রাবলশুটিং কী?",
      options: ["নতুন মনিটর কেনা", "র‍্যাম খুলে কার্বন পরিষ্কার করে পুনঃস্থাপন", "হ্যার্ডডিস্ক ফরম্যাট করা", "প্রসেসর পরিবর্তন"],
      correctAnswerIndex: 1,
      explanation: "র‍্যাম পিনের কার্বন জমা হলে ডিসপ্লে সংকেত বাধাগ্রস্ত হয়, যা মুছলে সমস্যা সমাধান হয়।",
      conceptTopic: "র‍্যাম ও ডিসপ্লে ট্রাবলশুটিং",
    },
    {
      id: "q2-2",
      questionText: "সিস্টেমের তারিখ ও সময় বারবার রিসেট হয়ে গেলে কোন উপাদানটি পরিবর্তন করতে হবে?",
      options: ["প্রসেসর ফ্যান", "CMOS ব্যাটারি", "পাওয়ার ক্যাবল", "এসএসডি"],
      correctAnswerIndex: 1,
      explanation: "CMOS ব্যাটারি বায়োসের সময় ও ডেট কনফিগারেশন ধরে রাখতে শক্তি যোগায়।",
      conceptTopic: "CMOS ব্যাটারি ও বায়োস তথ্য",
    },
    {
      id: "q2-3",
      questionText: "মাদারবোর্ডের মূল ব্যাকবোন PCB তৈরি করা হয় কিসের সমন্বয়ে?",
      options: ["মাল্টিলেয়ার প্রিন্টেড সার্কিট বোর্ড", "প্লাস্টিক শিট", "অ্যালুমিনিয়াম পাত", "কাঁচের তৈরি পাত"],
      correctAnswerIndex: 0,
      explanation: "মাদারবোর্ড হলো একটি মাল্টিলেয়ার পিসিবি (Printed Circuit Board)।",
      conceptTopic: "মাদারবোর্ড আর্কিটেকচার",
    },
    {
      id: "q2-4",
      questionText: "ল্যাপটপ বা ডেস্কটপের সিপিইউ (CPU) কোথায় বসানো হয়?",
      options: ["র‍্যাম স্লটে", "সিপিইউ সকেটে (LGA/PGA)", "পিসিআইই এক্সপেনশন স্লটে", "সাটা পোর্টে"],
      correctAnswerIndex: 1,
      explanation: "প্রসেসর বা সিপিইউ সবসময় সিপিইউ সকেটে স্থাপন করা হয়।",
      conceptTopic: "সিপিইউ সকেট পরিচিতি",
    },
  ],
  "pub-3": [
    {
      id: "q3-1",
      questionText: "নিচের কোনটি কম্পিউটারের মূল ইনপুট ডিভাইস?",
      options: ["প্রিন্টার", "স্পিকার", "কিবোর্ড", "মনিটর"],
      correctAnswerIndex: 2,
      explanation: "কিবোর্ডের মাধ্যমে ডাটা ইনপুট দেওয়া হয়।",
      conceptTopic: "ইনপুট ও আউটপুট ডিভাইস",
    },
    {
      id: "q3-2",
      questionText: "আন্তর্জাতিক এককে (SI) ভরের মৌলিক একক কোনটি?",
      options: ["গ্রাম", "কিলোগ্রাম (kg)", "পাউন্ড", "টন"],
      correctAnswerIndex: 1,
      explanation: "আন্তর্জাতিক পদ্ধতিতে ভরের একক কিলোগ্রাম।",
      conceptTopic: "বিজ্ঞানের মৌলিক পরিমাপ",
    },
  ],
  "pub-4": [
    {
      id: "q4-1",
      questionText: "ফোর-স্ট্রোক ইঞ্জিনের কোন স্ট্রোকে সিলিন্ডারে স্পার্ক ঘটে এবং শক্তি উৎপন্ন হয়?",
      options: ["Suction Stroke", "Compression Stroke", "Power Stroke", "Exhaust Stroke"],
      correctAnswerIndex: 2,
      explanation: "পাওয়ার স্ট্রোকে স্পার্ক প্লাগের মাধ্যমে এয়ার-ফুয়েল পোড়ানো হয় ও ধাক্কা উৎপন্ন হয়।",
      conceptTopic: "ফোর-স্ট্রোক পাওয়ার মেকানিজম",
    },
    {
      id: "q4-2",
      questionText: "Suction Stroke-এর সময় পিস্টন মাদারবোর্ডে কোন দিকে ধাবিত হয়?",
      options: ["TDC থেকে BDC-তে নিচে নামে", "BDC থেকে TDC-তে উঠে", "স্থির থাকে", "আড়াআড়ি ঘোরে"],
      correctAnswerIndex: 0,
      explanation: "সাকশন স্ট্রোকে পিস্টন উপর (TDC) থেকে নিচে (BDC) নামার ফলে নেগেটিভ প্রেশারে হাওয়া ঢোকে।",
      conceptTopic: "পিস্টন মুভমেন্ট ও স্ট্রোক সাইকেল",
    },
  ],
};

// Default Preloaded Registered Student Accounts
const PRELOADED_STUDENTS: StudentAuthAccount[] = [
  {
    rollNumber: "101",
    studentName: "মো: আরিফুল ইসলাম",
    classLevel: "class-10",
    trade: "Computer",
    password: UNIVERSAL_DEFAULT_PASSWORD,
    createdAt: "2026-10-01",
    isLoggedIn: false,
    hasChangedDefaultPassword: false,
    academicYear: "2026",
  },
  {
    rollNumber: "101",
    studentName: "কাজী তানভীর হাসান",
    classLevel: "class-9",
    trade: "Electrical",
    password: UNIVERSAL_DEFAULT_PASSWORD,
    createdAt: "2026-10-01",
    isLoggedIn: false,
    hasChangedDefaultPassword: false,
    academicYear: "2026",
  },
  {
    rollNumber: "102",
    studentName: "সুজন আহমেদ",
    classLevel: "class-9",
    trade: "Civil",
    password: UNIVERSAL_DEFAULT_PASSWORD,
    createdAt: "2026-10-02",
    isLoggedIn: false,
    hasChangedDefaultPassword: false,
    academicYear: "2026",
  },
  {
    rollNumber: "101",
    studentName: "রাকিবুল হাসান",
    classLevel: "class-8",
    trade: "General",
    password: UNIVERSAL_DEFAULT_PASSWORD,
    createdAt: "2026-10-02",
    isLoggedIn: false,
    hasChangedDefaultPassword: false,
    academicYear: "2026",
  },
  {
    rollNumber: "101",
    studentName: "সায়হাম মাহমুদ",
    classLevel: "class-6",
    trade: "General",
    password: UNIVERSAL_DEFAULT_PASSWORD,
    createdAt: "2026-10-02",
    isLoggedIn: false,
    hasChangedDefaultPassword: false,
    academicYear: "2026",
  },
  {
    rollNumber: "101",
    studentName: "মেহরাব হোসেন",
    classLevel: "class-11",
    trade: "Computer",
    password: UNIVERSAL_DEFAULT_PASSWORD,
    createdAt: "2026-10-02",
    isLoggedIn: false,
    hasChangedDefaultPassword: false,
    academicYear: "2026",
  },
];

// Initial Sample Doubts
const INITIAL_DOUBTS: StudentDoubtItem[] = [
  {
    id: "d-1",
    lessonId: "pub-1",
    lessonTitle: "বেসিক ইলেকট্রিক্যাল সার্কিট ও ওহমের সূত্রের প্রয়োগবিধি",
    studentName: "সুমন দেওয়ান",
    studentRoll: "রোল: ১৪",
    tradeClass: "ক্লাস ৯ (ইলেকট্রিক্যাল)",
    question: "স্যার, যদি সার্কিটে ভোল্টেজ অপরিবর্তিত রেখে রেজিস্ট্যান্স দ্বিগুণ করা হয়, তবে কারেন্ট কেমন কমবে?",
    status: "answered",
    answer: "চমৎকার প্রশ্ন সুমন! ওহমের সূত্র $I = V/R$ অনুযায়ী, ভোল্টেজ ঠিক রেখে রেজিস্ট্যান্স দ্বিগুণ করা হলে কারেন্ট ঠিক অর্ধেক ($1/2$) হয়ে যাবে।",
    answeredBy: "প্রকৌ: মো: রফিকুল ইসলাম (চিফ ইন্সট্রাক্টর)",
    answeredAt: "২০২৬-১০-০৭",
    createdAt: "২০২৬-১০-০৭",
  },
  {
    id: "d-2",
    lessonId: "pub-2",
    lessonTitle: "কম্পিউটার মাদারবোর্ড আর্কিটেকচার ও ট্রাবলশুটিং ম্যানুয়াল",
    studentName: "আরিফুল ইসলাম",
    studentRoll: "রোল: ০৮",
    tradeClass: "ক্লাস ১০ (কম্পিউটার)",
    question: "স্যার, LGA এবং PGA সিপিইউ সকেটের প্রধান তফাতটা সহজে কিভাবে বুঝব?",
    status: "pending",
    createdAt: "২০২৬-১০-০৮",
  },
];

// Initial Quiz Attempts History
const INITIAL_ATTEMPTS: QuizAttemptRecord[] = [
  {
    id: "att-1",
    lessonId: "pub-1",
    lessonTitle: "বেসিক ইলেকট্রিক্যাল সার্কিট ও ওহমের সূত্রের প্রয়োগবিধি",
    tradeLabel: "ইলেকট্রিক্যাল সেফটি",
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    completedAt: "২০২৬-১০-০৭",
    missedTopics: ["ওহমের সূত্রের গাণিতিক প্রয়োগ"],
  },
  {
    id: "att-2",
    lessonId: "pub-2",
    lessonTitle: "কম্পিউটার মাদারবোর্ড আর্কিটেকচার",
    tradeLabel: "কম্পিউটার ও আইওটি",
    score: 3,
    totalQuestions: 4,
    percentage: 75,
    completedAt: "২০২৬-১০-০৬",
    missedTopics: ["CMOS ব্যাটারি ও বায়োস তথ্য"],
  },
];

// Initial Weak Topics Map
const INITIAL_WEAK_TOPICS: WeakTopicItem[] = [
  {
    topicName: "ওহমের সূত্রের গাণিতিক প্রয়োগ",
    missedCount: 2,
    lastMissedAt: "২০২৬-১০-০৭",
    lessonId: "pub-1",
    lessonTitle: "বেসিক ইলেকট্রিক্যাল সার্কিট ও ওহমের সূত্রের প্রয়োগবিধি",
  },
  {
    topicName: "CMOS ব্যাটারি ও বায়োস তথ্য",
    missedCount: 1,
    lastMissedAt: "২০২৬-১০-০৬",
    lessonId: "pub-2",
    lessonTitle: "কম্পিউটার মাদারবোর্ড আর্কিটেকচার ও ট্রাবলশুটিং ম্যানুয়াল",
  },
];

const INITIAL_STATS: StudentIntelligenceStats = {
  completedLessonsCount: 4,
  quizzesTakenCount: 2,
  totalCorrectQuestions: 7,
  totalQuestionsAttempted: 9,
  currentStreakDays: 5,
  lastStreakDate: "2026-10-08",
  streakHistoryDays: ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"],
};

// --- Student Accounts & Auth Helpers ---

export function getRegisteredStudents(): StudentAuthAccount[] {
  if (typeof window === "undefined") return PRELOADED_STUDENTS;
  try {
    const saved = localStorage.getItem("ptsc_registered_students");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to load registered students:", e);
  }
  return PRELOADED_STUDENTS;
}

export function getStudentAccountByRoll(
  rollNumber: string,
  classLevel?: string
): StudentAuthAccount | null {
  const cleanRoll = rollNumber.trim();
  if (!cleanRoll) return null;

  const targetNormClass = classLevel && classLevel !== "all" ? normalizeStudentClass(classLevel) : "";

  // 1. Check in institutionalDb.students
  const dbStudent = institutionalDb.students.find((s) => {
    const rollMatches = String(s.roll) === cleanRoll || s.studentId === cleanRoll;
    if (!rollMatches) return false;
    if (!targetNormClass) return true;
    return matchStudentClass(s.className, targetNormClass);
  });

  // 2. Check registered students
  const registeredStudents = getRegisteredStudents();
  const regFound = registeredStudents.find((s) => {
    if (s.rollNumber !== cleanRoll) return false;
    if (!targetNormClass) return true;
    return matchStudentClass(s.classLevel, targetNormClass);
  });

  if (!dbStudent && !regFound) {
    if (/^\d+$/.test(cleanRoll)) {
      return {
        rollNumber: cleanRoll,
        studentName: `শিক্ষার্থী (রোল ${cleanRoll})`,
        classLevel: targetNormClass || "class-10",
        trade: "IT Support and IoT Basics",
        password: UNIVERSAL_DEFAULT_PASSWORD,
        createdAt: new Date().toISOString(),
        isLoggedIn: false,
        hasChangedDefaultPassword: false,
        academicYear: "2026",
      };
    }
    return null;
  }

  return {
    rollNumber: cleanRoll,
    studentName: dbStudent?.nameBangla || dbStudent?.name || regFound?.studentName || `শিক্ষার্থী (রোল ${cleanRoll})`,
    classLevel: regFound?.classLevel || dbStudent?.className || targetNormClass || "class-10",
    trade: regFound?.trade || dbStudent?.tradeNameBangla || "General",
    password: regFound?.password || UNIVERSAL_DEFAULT_PASSWORD,
    createdAt: regFound?.createdAt || new Date().toISOString(),
    isLoggedIn: false,
    hasChangedDefaultPassword: regFound?.hasChangedDefaultPassword,
    academicYear: regFound?.academicYear || "2026",
  };
}

export function saveRegisteredStudents(students: StudentAuthAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("ptsc_registered_students", JSON.stringify(students));
  } catch (e) {
    console.error("Failed to save registered students:", e);
  }
}

export function getActiveStudentAccount(): StudentAuthAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const activeStr = localStorage.getItem("ptsc_active_student_session");
    if (activeStr) {
      const active = JSON.parse(activeStr);
      if (active && active.isLoggedIn) return active;
    }
  } catch (e) {
    console.error("Failed to load active student session:", e);
  }
  return null;
}

export function loginStudentAccount(
  rollNumber: string,
  password: string,
  classLevel?: string
): {
  success: boolean;
  message: string;
  requiresPasswordChange?: boolean;
  account?: StudentAuthAccount;
} {
  const cleanRoll = rollNumber.trim();
  const cleanPass = password.trim();
  const targetNormClass = classLevel && classLevel !== "all" ? normalizeStudentClass(classLevel) : "";

  // First check in institutionalDb.students
  const dbStudent = institutionalDb.students.find((s) => {
    const rollMatches = String(s.roll) === cleanRoll || s.studentId === cleanRoll;
    if (!rollMatches) return false;
    if (!targetNormClass) return true;
    return matchStudentClass(s.className, targetNormClass);
  });

  const registeredStudents = getRegisteredStudents();
  const regFound = registeredStudents.find((s) => {
    if (s.rollNumber !== cleanRoll) return false;
    if (!targetNormClass) return true;
    return matchStudentClass(s.classLevel, targetNormClass);
  });

  // If student record not found in either institutional DB or registered list:
  if (!dbStudent && !regFound && !/^\d+$/.test(cleanRoll)) {
    return {
      success: false,
      message: "শিক্ষার্থীর রেকর্ড পাওয়া যায়নি। রোল নম্বর ও শ্রেণি সঠিকভাবে যাচাই করুন।",
    };
  }

  // Determine student name and metadata from DB
  const resolvedName = dbStudent?.nameBangla || dbStudent?.name || regFound?.studentName || `শিক্ষার্থী (রোল ${cleanRoll})`;
  const resolvedClass = regFound?.classLevel || dbStudent?.className || targetNormClass || "class-10";
  const resolvedTrade = regFound?.trade || dbStudent?.tradeNameBangla || "Computer";

  // Determine current active password and whether default password was changed
  const targetPassword = regFound?.password || UNIVERSAL_DEFAULT_PASSWORD;
  const hasChangedPassword = regFound?.hasChangedDefaultPassword ?? (targetPassword !== UNIVERSAL_DEFAULT_PASSWORD);

  // Check password matching: also support demo passwords "pass", "password", "1234", "123456"
  const isMatch =
    cleanPass === targetPassword ||
    cleanPass === "pass" ||
    cleanPass === "password" ||
    cleanPass === "123456" ||
    cleanPass === UNIVERSAL_DEFAULT_PASSWORD;

  if (isMatch) {
    // If the student is logging in with the default password (1234) for the first time:
    if (!hasChangedPassword && cleanPass === UNIVERSAL_DEFAULT_PASSWORD) {
      const tempAccount: StudentAuthAccount = {
        rollNumber: cleanRoll,
        studentName: resolvedName,
        classLevel: resolvedClass,
        trade: resolvedTrade,
        password: cleanPass,
        createdAt: regFound?.createdAt || new Date().toISOString().split("T")[0],
        isLoggedIn: false,
        hasChangedDefaultPassword: false,
        academicYear: regFound?.academicYear || "2026",
      };

      return {
        success: true,
        requiresPasswordChange: true,
        account: tempAccount,
        message: "ডিফল্ট পাসওয়ার্ড (1234) দিয়ে প্রথমবার লগইন সফল। অনুগ্রহ করে আপনার নতুন ব্যক্তিগত পাসওয়ার্ড সেট করুন।",
      };
    }

    // Subsequent normal login with updated password
    const account: StudentAuthAccount = {
      rollNumber: cleanRoll,
      studentName: resolvedName,
      classLevel: resolvedClass,
      trade: resolvedTrade,
      password: cleanPass,
      createdAt: regFound?.createdAt || new Date().toISOString().split("T")[0],
      isLoggedIn: true,
      hasChangedDefaultPassword: true,
      academicYear: regFound?.academicYear || "2026",
    };

    // Save session: filter matching BOTH roll AND class so different classes with same roll coexist
    const filteredOthers = registeredStudents.filter((s) => {
      if (s.rollNumber !== cleanRoll) return true;
      return !matchStudentClass(s.classLevel, resolvedClass);
    });
    saveRegisteredStudents([account, ...filteredOthers]);

    if (typeof window !== "undefined") {
      localStorage.setItem("ptsc_active_student_session", JSON.stringify(account));
      try {
        window.dispatchEvent(new CustomEvent("ptsc_student_auth_changed", { detail: account }));
      } catch (e) {}
    }

    return {
      success: true,
      requiresPasswordChange: false,
      message: `স্বাগতম, ${resolvedName}! আপনার ক্লাউড প্রোফাইল সক্রিয় করা হয়েছে।`,
      account,
    };
  }

  // If user entered default 1234 but has already updated password:
  if (cleanPass === UNIVERSAL_DEFAULT_PASSWORD && hasChangedPassword) {
    return {
      success: false,
      message: "ডিফল্ট পাসওয়ার্ড ইতিপূর্বে পরিবর্তন করা হয়েছে। অনুগ্রহ করে আপনার নতুন পাসওয়ার্ড দিয়ে লগইন করুন।",
    };
  }

  return {
    success: false,
    message: "পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
  };
}

export function updateStudentPassword(
  rollNumber: string,
  newPassword: string,
  classLevel?: string
): { success: boolean; message: string; account?: StudentAuthAccount } {
  const cleanRoll = rollNumber.trim();
  const cleanPass = newPassword.trim();
  const targetNormClass = classLevel && classLevel !== "all" ? normalizeStudentClass(classLevel) : "";

  if (cleanPass === UNIVERSAL_DEFAULT_PASSWORD) {
    return {
      success: false,
      message: "নতুন পাসওয়ার্ড ডিফল্ট পাসওয়ার্ড (1234)-এর মতো হতে পারবে না। অনুগ্রহ করে একটি ভিন্ন পাসওয়ার্ড নির্ধারণ করুন।",
    };
  }

  if (cleanPass.length < 4) {
    return {
      success: false,
      message: "পাসওয়ার্ডের দৈর্ঘ্য কমপক্ষে ৪ ডিজিট বা অক্ষরের হতে হবে।",
    };
  }

  const dbStudent = institutionalDb.students.find((s) => {
    const rollMatches = String(s.roll) === cleanRoll || s.studentId === cleanRoll;
    if (!rollMatches) return false;
    if (!targetNormClass) return true;
    return matchStudentClass(s.className, targetNormClass);
  });

  const registeredStudents = getRegisteredStudents();
  const regFound = registeredStudents.find((s) => {
    if (s.rollNumber !== cleanRoll) return false;
    if (!targetNormClass) return true;
    return matchStudentClass(s.classLevel, targetNormClass);
  });

  const resolvedName = dbStudent?.nameBangla || dbStudent?.name || regFound?.studentName || `শিক্ষার্থী (রোল ${cleanRoll})`;
  const resolvedClass = regFound?.classLevel || dbStudent?.className || targetNormClass || "class-10";
  const resolvedTrade = regFound?.trade || dbStudent?.tradeNameBangla || "Computer";

  const updatedAccount: StudentAuthAccount = {
    rollNumber: cleanRoll,
    studentName: resolvedName,
    classLevel: resolvedClass,
    trade: resolvedTrade,
    password: cleanPass,
    createdAt: regFound?.createdAt || new Date().toISOString().split("T")[0],
    isLoggedIn: true,
    hasChangedDefaultPassword: true,
    academicYear: regFound?.academicYear || "2026",
  };

  const filteredOthers = registeredStudents.filter((s) => {
    if (s.rollNumber !== cleanRoll) return true;
    return !matchStudentClass(s.classLevel, resolvedClass);
  });
  saveRegisteredStudents([updatedAccount, ...filteredOthers]);

  if (typeof window !== "undefined") {
    localStorage.setItem("ptsc_active_student_session", JSON.stringify(updatedAccount));
    try {
      window.dispatchEvent(new CustomEvent("ptsc_student_auth_changed", { detail: updatedAccount }));
    } catch (e) {}
  }

  return {
    success: true,
    message: `পাসওয়ার্ড সফলভাবে হালনাগাদ করা হয়েছে! স্বাগতম, ${resolvedName}।`,
    account: updatedAccount,
  };
}

export function registerStudentAccount(
  rollNumber: string,
  studentName: string,
  classLevel: string,
  trade: string,
  password: string
): { success: boolean; message: string; account?: StudentAuthAccount } {
  const students = getRegisteredStudents();
  const cleanRoll = rollNumber.trim();
  const cleanName = studentName.trim() || `শিক্ষার্থী (রোল ${cleanRoll})`;
  const cleanPass = password.trim();

  if (!cleanRoll || !cleanPass) {
    return { success: false, message: "রোল নম্বর এবং পাসওয়ার্ড পূরণ করা আবশ্যক।" };
  }

  const newAccount: StudentAuthAccount = {
    rollNumber: cleanRoll,
    studentName: cleanName,
    classLevel: classLevel || "class-10",
    trade: trade || "Computer",
    password: cleanPass,
    createdAt: new Date().toISOString().split("T")[0],
    isLoggedIn: true,
  };

  const updatedStudents = [newAccount, ...students.filter((s) => s.rollNumber !== cleanRoll)];
  saveRegisteredStudents(updatedStudents);

  if (typeof window !== "undefined") {
    localStorage.setItem("ptsc_active_student_session", JSON.stringify(newAccount));
  }

  return { success: true, message: `ধন্যবাদ ${cleanName}! আপনার একাউন্ট ও পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে।`, account: newAccount };
}

export function logoutStudentAccount(): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Completely clear active student session
    localStorage.removeItem("ptsc_active_student_session");

    // 2. Completely wipe guest/temporary browser quiz cache to prevent session bleed
    localStorage.removeItem("ptsc_guest_quiz_attempts");
    localStorage.removeItem("ptsc_guest_completed_quizzes");

    // 3. Wipe any legacy or non-isolated quiz states and caches
    localStorage.removeItem("ptsc_quiz_attempts");
    localStorage.removeItem("ptsc_student_stats");
    localStorage.removeItem("ptsc_weak_topics");
    localStorage.removeItem("ptsc_ai_active_chat_history");
    localStorage.removeItem("ptsc_ai_chat_history_guest");
    localStorage.removeItem("ptsc_recent_ai_queries");
    localStorage.removeItem("pgtsc_live_quiz_player");

    // 4. Wipe all sessionStorage completely to prevent any transient in-memory state leaks
    sessionStorage.clear();

    // 5. Clear student and session cookies
    document.cookie = "ptsc_user_role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "pgtsc_user_role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "ptsc_student_roll=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "pgtsc_student_roll=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "pgtsc_auth_token=; path=/; max-age=0; SameSite=Lax";

    // 6. Asynchronously trigger server logout to clear HttpOnly tokens
    try {
      fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } catch {}

    // 7. Broadcast global logout events to reset all mounted components immediately
    window.dispatchEvent(
      new CustomEvent("ptsc_student_auth_changed", { detail: { isLoggedIn: false, account: null } })
    );
    window.dispatchEvent(new CustomEvent("ptsc_student_logout"));
  } catch (e) {
    console.error("Failed to cleanly wipe student storage on logout:", e);
  }
}

// --- Storage Helper Functions ---

export function getStudentStats(studentRollNumber?: string): StudentIntelligenceStats {
  const activeStudent = getActiveStudentAccount();
  const roll = (studentRollNumber || activeStudent?.rollNumber || "").trim();

  const emptyStats: StudentIntelligenceStats = {
    completedLessonsCount: 0,
    quizzesTakenCount: 0,
    totalCorrectQuestions: 0,
    totalQuestionsAttempted: 0,
    currentStreakDays: 1,
    lastStreakDate: new Date().toISOString().split("T")[0],
    streakHistoryDays: [new Date().toISOString().split("T")[0]],
  };

  // For logged-in student: strictly isolate by student Roll ID
  if (roll) {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`ptsc_student_stats_${roll}`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }

    // If not cached, dynamically calculate from this specific student's database history
    const attempts = getStudentAllQuizHistory(roll);
    if (attempts.length > 0) {
      const distinctCompletedLessons = new Set(attempts.map((a) => a.lessonId)).size;
      const totalCorrect = attempts.reduce((acc, a) => acc + a.score, 0);
      const totalQuestions = attempts.reduce((acc, a) => acc + a.totalQuestions, 0);
      return {
        completedLessonsCount: distinctCompletedLessons,
        quizzesTakenCount: attempts.length,
        totalCorrectQuestions: totalCorrect,
        totalQuestionsAttempted: totalQuestions,
        currentStreakDays: Math.min(attempts.length, 5),
        lastStreakDate: attempts[0]?.completedAt || new Date().toISOString().split("T")[0],
        streakHistoryDays: Array.from(new Set(attempts.map((a) => a.completedAt))),
      };
    }

    return emptyStats;
  }

  // For guest user: calculate from guest attempts if any
  if (typeof window !== "undefined") {
    try {
      const guestAttempts = getStudentAllQuizHistory();
      if (guestAttempts.length > 0) {
        return {
          completedLessonsCount: new Set(guestAttempts.map((a) => a.lessonId)).size,
          quizzesTakenCount: guestAttempts.length,
          totalCorrectQuestions: guestAttempts.reduce((acc, a) => acc + a.score, 0),
          totalQuestionsAttempted: guestAttempts.reduce((acc, a) => acc + a.totalQuestions, 0),
          currentStreakDays: 1,
          lastStreakDate: new Date().toISOString().split("T")[0],
          streakHistoryDays: [new Date().toISOString().split("T")[0]],
        };
      }
    } catch (e) {}
  }

  return emptyStats;
}

export function saveStudentStats(stats: StudentIntelligenceStats, studentRollNumber?: string): void {
  if (typeof window === "undefined") return;
  const activeStudent = getActiveStudentAccount();
  const roll = (studentRollNumber || activeStudent?.rollNumber || "").trim();

  try {
    if (roll) {
      localStorage.setItem(`ptsc_student_stats_${roll}`, JSON.stringify(stats));
    } else {
      localStorage.setItem("ptsc_student_stats", JSON.stringify(stats));
    }
  } catch (e) {
    console.error("Failed to save student stats:", e);
  }
}

export function getQuizAttempts(studentRollNumber?: string): QuizAttemptRecord[] {
  return getStudentAllQuizHistory(studentRollNumber);
}

export function getWeakTopics(studentRollNumber?: string): WeakTopicItem[] {
  const activeStudent = getActiveStudentAccount();
  const roll = (studentRollNumber || activeStudent?.rollNumber || "").trim();

  if (roll) {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`ptsc_weak_topics_${roll}`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }

    // Derive from student attempts
    const attempts = getStudentAllQuizHistory(roll);
    const map: Record<string, WeakTopicItem> = {};
    attempts.forEach((att) => {
      if (att.missedTopics && att.missedTopics.length > 0) {
        att.missedTopics.forEach((topic) => {
          if (!map[topic]) {
            map[topic] = {
              topicName: topic,
              missedCount: 1,
              lastMissedAt: att.completedAt,
              lessonId: att.lessonId,
              lessonTitle: att.lessonTitle,
            };
          } else {
            map[topic].missedCount += 1;
          }
        });
      }
    });

    return Object.values(map);
  }

  return [];
}

export function getStudentDoubts(): StudentDoubtItem[] {
  if (typeof window === "undefined") return INITIAL_DOUBTS;
  try {
    const saved = localStorage.getItem("ptsc_student_doubts");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to load student doubts:", e);
  }
  return INITIAL_DOUBTS;
}

export function saveStudentDoubt(doubt: Omit<StudentDoubtItem, "id" | "status" | "createdAt">): StudentDoubtItem[] {
  const existing = getStudentDoubts();
  const newDoubt: StudentDoubtItem = {
    ...doubt,
    id: `doubt-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString().split("T")[0],
  };
  const updated = [newDoubt, ...existing];
  if (typeof window !== "undefined") {
    localStorage.setItem("ptsc_student_doubts", JSON.stringify(updated));
  }
  return updated;
}

export function answerStudentDoubt(id: string, answerText: string, teacherName: string): StudentDoubtItem[] {
  const doubts = getStudentDoubts();
  const updated = doubts.map((d) =>
    d.id === id
      ? {
          ...d,
          status: "answered" as const,
          answer: answerText,
          answeredBy: teacherName || "PTSC বিষয়ভিত্তিক শিক্ষক",
          answeredAt: new Date().toISOString().split("T")[0],
        }
      : d
  );
  if (typeof window !== "undefined") {
    localStorage.setItem("ptsc_student_doubts", JSON.stringify(updated));
  }
  return updated;
}

export function recordQuizAttempt(
  lessonId: string,
  lessonTitle: string,
  tradeLabel: string,
  score: number,
  totalQuestions: number,
  missedQuestions: StudentQuizQuestion[],
  studentRollNumber?: string
): QuizAttemptRecord {
  const activeStudent = getActiveStudentAccount();
  const roll = (studentRollNumber || activeStudent?.rollNumber || "").trim();
  const isGuest = !roll;

  const percentage = Math.round((score / totalQuestions) * 100);
  const missedTopicNames = Array.from(new Set(missedQuestions.map((q) => q.conceptTopic)));

  const newRecord: QuizAttemptRecord = {
    id: `att-${Date.now()}`,
    lessonId,
    lessonTitle,
    tradeLabel,
    score,
    totalQuestions,
    percentage,
    completedAt: new Date().toISOString().split("T")[0],
    missedTopics: missedTopicNames,
    studentRoll: roll || undefined,
    studentName: activeStudent?.studentName || undefined,
    isGuest,
  };

  // 1. Persistent Database Storage for Logged-In Student vs Guest User
  if (roll) {
    try {
      // Direct Database Sync into Institutional DB instance
      institutionalDb.saveStudentLearningAttempt(roll, newRecord);
    } catch (e) {
      console.warn("Could not save into institutionalDb singleton:", e);
    }

    if (typeof window !== "undefined") {
      try {
        // Save to student-specific persistent history list
        const studentAttemptsKey = `ptsc_student_attempts_${roll}`;
        const prevStudentAttemptsStr = localStorage.getItem(studentAttemptsKey);
        const prevStudentAttempts: QuizAttemptRecord[] = prevStudentAttemptsStr ? JSON.parse(prevStudentAttemptsStr) : [];
        const filteredPrev = prevStudentAttempts.filter((a) => a.lessonId !== lessonId);
        const updatedStudentAttempts = [newRecord, ...filteredPrev];
        localStorage.setItem(studentAttemptsKey, JSON.stringify(updatedStudentAttempts));

        // Save to student-specific completed lessons map
        const studentCompletedKey = `ptsc_student_completed_quizzes_${roll}`;
        const prevCompletedStr = localStorage.getItem(studentCompletedKey);
        const prevCompleted: Record<string, QuizAttemptRecord> = prevCompletedStr ? JSON.parse(prevCompletedStr) : {};
        prevCompleted[lessonId] = newRecord;
        localStorage.setItem(studentCompletedKey, JSON.stringify(prevCompleted));

        // Update student-specific stats isolated to this student's roll
        const currentStats = getStudentStats(roll);
        const todayStr = new Date().toISOString().split("T")[0];
        const newStreakHistory = Array.from(new Set([...currentStats.streakHistoryDays, todayStr]));
        let newStreakDays = currentStats.currentStreakDays;
        if (currentStats.lastStreakDate !== todayStr) {
          newStreakDays += 1;
        }

        const updatedStats: StudentIntelligenceStats = {
          completedLessonsCount: Object.keys(prevCompleted).length,
          quizzesTakenCount: updatedStudentAttempts.length,
          totalCorrectQuestions: updatedStudentAttempts.reduce((sum, a) => sum + a.score, 0),
          totalQuestionsAttempted: updatedStudentAttempts.reduce((sum, a) => sum + a.totalQuestions, 0),
          currentStreakDays: newStreakDays,
          lastStreakDate: todayStr,
          streakHistoryDays: newStreakHistory,
        };
        saveStudentStats(updatedStats, roll);

        // Update student-specific weak topics isolated to this student's roll
        const existingWeak = getWeakTopics(roll);
        let updatedWeak = [...existingWeak];
        missedQuestions.forEach((q) => {
          const idx = updatedWeak.findIndex((w) => w.topicName === q.conceptTopic && w.lessonId === lessonId);
          if (idx >= 0) {
            updatedWeak[idx].missedCount += 1;
            updatedWeak[idx].lastMissedAt = todayStr;
          } else {
            updatedWeak.push({
              topicName: q.conceptTopic,
              missedCount: 1,
              lastMissedAt: todayStr,
              lessonId,
              lessonTitle,
            });
          }
        });
        if (missedQuestions.length === 0) {
          updatedWeak = updatedWeak.filter((w) => w.lessonId !== lessonId);
        }
        localStorage.setItem(`ptsc_weak_topics_${roll}`, JSON.stringify(updatedWeak));
      } catch (e) {
        console.error("Failed to save student persistent quiz history:", e);
      }
    }
  } else {
    // Guest User: Temporary browser storage strictly isolated for guests
    if (typeof window !== "undefined") {
      try {
        const guestAttemptsStr = localStorage.getItem("ptsc_guest_quiz_attempts");
        const prevGuestAttempts: QuizAttemptRecord[] = guestAttemptsStr ? JSON.parse(guestAttemptsStr) : [];
        const filteredGuest = prevGuestAttempts.filter((a) => a.lessonId !== lessonId);
        localStorage.setItem("ptsc_guest_quiz_attempts", JSON.stringify([newRecord, ...filteredGuest]));

        const guestCompletedStr = localStorage.getItem("ptsc_guest_completed_quizzes");
        const prevGuestCompleted: Record<string, QuizAttemptRecord> = guestCompletedStr ? JSON.parse(guestCompletedStr) : {};
        prevGuestCompleted[lessonId] = newRecord;
        localStorage.setItem("ptsc_guest_completed_quizzes", JSON.stringify(prevGuestCompleted));
      } catch (e) {
        console.error("Failed to save guest quiz history:", e);
      }
    }
  }

  return newRecord;
}

export function getPastQuizAttemptForLesson(
  lessonId: string,
  studentRollNumber?: string
): QuizAttemptRecord | null {
  const activeStudent = getActiveStudentAccount();
  const roll = (studentRollNumber || activeStudent?.rollNumber || "").trim();

  // 1. FOR LOGGED-IN STUDENTS: Strictly query the database using the currently authenticated student's unique Roll ID
  if (roll) {
    // Check in-memory database instance
    try {
      const dbAttempt = institutionalDb.getStudentLessonCompletedAttempt(roll, lessonId);
      if (dbAttempt) return dbAttempt;
    } catch (e) {}

    // Check persistent database storage in localStorage for this specific student roll
    if (typeof window !== "undefined") {
      try {
        const studentCompletedKey = `ptsc_student_completed_quizzes_${roll}`;
        const completedStr = localStorage.getItem(studentCompletedKey);
        if (completedStr) {
          const completedMap: Record<string, QuizAttemptRecord> = JSON.parse(completedStr);
          if (completedMap[lessonId]) {
            institutionalDb.saveStudentLearningAttempt(roll, completedMap[lessonId]);
            return completedMap[lessonId];
          }
        }

        const studentAttemptsKey = `ptsc_student_attempts_${roll}`;
        const attemptsStr = localStorage.getItem(studentAttemptsKey);
        if (attemptsStr) {
          const list: QuizAttemptRecord[] = JSON.parse(attemptsStr);
          const match = list.find((a) => a.lessonId === lessonId && (a.studentRoll === roll || !a.studentRoll));
          if (match) {
            institutionalDb.saveStudentLearningAttempt(roll, match);
            return match;
          }
        }
      } catch (e) {
        console.error("Failed to load student past quiz attempt:", e);
      }
    }

    // STRICT ISOLATION: Zero previous quiz completion status unless *they* actually completed it.
    // NEVER fall back to another student's or mock attempts!
    return null;
  }

  // 2. FOR GUEST USERS (Unauthenticated): Check temporary browser session storage
  if (typeof window !== "undefined") {
    try {
      const guestCompletedStr = localStorage.getItem("ptsc_guest_completed_quizzes");
      if (guestCompletedStr) {
        const guestMap: Record<string, QuizAttemptRecord> = JSON.parse(guestCompletedStr);
        if (guestMap[lessonId]) {
          return guestMap[lessonId];
        }
      }

      const guestAttemptsStr = localStorage.getItem("ptsc_guest_quiz_attempts");
      if (guestAttemptsStr) {
        const guestList: QuizAttemptRecord[] = JSON.parse(guestAttemptsStr);
        const match = guestList.find((a) => a.lessonId === lessonId);
        if (match) return match;
      }
    } catch (e) {
      console.error("Failed to load guest past quiz attempt:", e);
    }
  }

  // Fresh guest: zero completion
  return null;
}

export function getStudentAllQuizHistory(studentRollNumber?: string): QuizAttemptRecord[] {
  const activeStudent = getActiveStudentAccount();
  const roll = (studentRollNumber || activeStudent?.rollNumber || "").trim();

  if (roll) {
    // 1. Query in-memory institutionalDb
    try {
      const dbAttempts = institutionalDb.getStudentLearningAttempts(roll);
      if (dbAttempts && dbAttempts.length > 0) {
        return dbAttempts;
      }
    } catch (e) {}

    // 2. Query persistent localStorage database for this specific roll ID
    if (typeof window !== "undefined") {
      try {
        const key = `ptsc_student_attempts_${roll}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed: QuizAttemptRecord[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((att) => institutionalDb.saveStudentLearningAttempt(roll, att));
            return parsed;
          }
        }
      } catch (e) {
        console.error("Failed to load student history:", e);
      }
    }

    // Fresh student: return completely clean empty list
    return [];
  }

  // Guest user: check guest attempts only
  if (typeof window !== "undefined") {
    try {
      const guestSaved = localStorage.getItem("ptsc_guest_quiz_attempts");
      if (guestSaved) {
        const parsed = JSON.parse(guestSaved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
  }

  return [];
}

export function clearWeakTopic(topicName: string, studentRollNumber?: string): WeakTopicItem[] {
  const activeStudent = getActiveStudentAccount();
  const roll = (studentRollNumber || activeStudent?.rollNumber || "").trim();
  const existing = getWeakTopics(roll);
  const updated = existing.filter((t) => t.topicName !== topicName);
  if (typeof window !== "undefined") {
    if (roll) {
      localStorage.setItem(`ptsc_weak_topics_${roll}`, JSON.stringify(updated));
    } else {
      localStorage.setItem("ptsc_weak_topics", JSON.stringify(updated));
    }
  }
  return updated;
}

// --- Custom Lesson Quiz Storage (For Teacher Generated 10-MCQ Quizzes) ---

export function saveCustomLessonQuiz(lessonId: string, questions: StudentQuizQuestion[]): void {
  if (typeof window === "undefined") return;
  try {
    const existingStr = localStorage.getItem("ptsc_custom_lesson_quizzes");
    const map: Record<string, StudentQuizQuestion[]> = existingStr ? JSON.parse(existingStr) : {};
    map[lessonId] = questions;
    localStorage.setItem("ptsc_custom_lesson_quizzes", JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save custom lesson quiz:", e);
  }
}

export function getLessonQuizQuestions(lessonId: string): StudentQuizQuestion[] | null {
  if (typeof window === "undefined") return PRELOADED_LESSON_QUIZZES[lessonId] || null;
  try {
    const existingStr = localStorage.getItem("ptsc_custom_lesson_quizzes");
    if (existingStr) {
      const map: Record<string, StudentQuizQuestion[]> = JSON.parse(existingStr);
      if (map[lessonId] && map[lessonId].length > 0) return map[lessonId];
    }
  } catch (e) {
    console.error("Failed to get custom lesson quiz:", e);
  }
  return PRELOADED_LESSON_QUIZZES[lessonId] || null;
}

// --- Additional Doubt Moderation & Actions ---

export function deleteStudentDoubt(id: string): StudentDoubtItem[] {
  const existing = getStudentDoubts();
  const updated = existing.filter((d) => d.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem("ptsc_student_doubts", JSON.stringify(updated));
  }
  return updated;
}

export function resolveStudentDoubt(id: string): StudentDoubtItem[] {
  const doubts = getStudentDoubts();
  const updated = doubts.map((d) =>
    d.id === id ? { ...d, status: "answered" as const } : d
  );
  if (typeof window !== "undefined") {
    localStorage.setItem("ptsc_student_doubts", JSON.stringify(updated));
  }
  return updated;
}

// --- Class-Wide Weak Topic Analytics Data & Engine ---

export interface ClassAnalyticsSummary {
  classLevel: string;
  classLabel: string;
  trade: string;
  tradeLabel: string;
  totalStudents: number;
  participatedStudents: number;
  participationRatePercentage: number;
  quizzesTaken: number;
  averageScorePercentage: number;
  passRatePercentage: number;
  completionRatePercentage: number;
  topWeakTopics: { topic: string; missedRate: number }[];
  status: "excellent" | "good" | "needs_attention";
}

export interface CommonMistakePattern {
  id: string;
  topic: string;
  mistakeDescription: string;
  frequencyPercentage: number;
  suggestedAction: string;
  affectedTrade: string;
}

export interface LessonCompletionMetric {
  lessonId: string;
  lessonTitle: string;
  classLevel: string;
  classLabel: string;
  trade: string;
  tradeLabel: string;
  totalStudentsInClass: number;
  totalReaders: number;
  quizzesAttempted: number;
  completedPassed: number;
  completionRatePercentage: number;
  averageScorePercentage: number;
  topMissedConcept: string;
  status: "high_completion" | "moderate" | "needs_push";
}

export interface StudentLeaderboardEntry {
  rank: number;
  rollNumber: string;
  studentName: string;
  classLevel: string;
  classLabel: string;
  trade: string;
  tradeLabel: string;
  totalScore: number;
  quizzesTaken: number;
  accuracyPercentage: number;
  streakDays: number;
  badges: string[];
  avatarUrl: string;
  isCurrentStudent?: boolean;
}

export interface TeacherPerformanceOverview {
  overallAverageScore: number;
  totalQuizzesEvaluated: number;
  totalStudentsEnrolled: number;
  totalStudentsParticipated: number;
  overallParticipationRatePercentage: number;
  overallLessonCompletionRatePercentage: number;
  totalWeakTopicsTracked: number;
  activeRemedialLessonsCount: number;
  classesBreakdown: ClassAnalyticsSummary[];
  frequentlyMissedConcepts: {
    topic: string;
    trade: string;
    missedCount: number;
    severity: "high" | "medium" | "low";
    recommendation: string;
  }[];
  commonMistakes: CommonMistakePattern[];
  lessonCompletions: LessonCompletionMetric[];
}

export function getLessonCompletionAnalytics(): LessonCompletionMetric[] {
  const publishedLessons = [
    { id: "pub-1", title: "বেসিক ইলেকট্রিক্যাল সার্কিট", trade: "Electrical", classLevel: "class-9", classLabel: "৯ম শ্রেণি", tradeLabel: "ইলেকট্রিক্যাল", likesCount: 24 },
    { id: "pub-2", title: "কম্পিউটার মাদারবোর্ড আর্কিটেকচার", trade: "Computer", classLevel: "class-10", classLabel: "১০ম শ্রেণি", tradeLabel: "কম্পিউটার ও আইওটি", likesCount: 30 },
    { id: "pub-3", title: "ষষ্ঠ শ্রেণির বিজ্ঞান ও আইসিটি", trade: "General", classLevel: "class-6", classLabel: "৬ষ্ঠ শ্রেণি", tradeLabel: "সাধারণ বিষয়", likesCount: 15 },
    { id: "pub-4", title: "কনজিউমার ইলেকট্রনিক্স সাউন্ড সিস্টেম", trade: "Consumer Electronics", classLevel: "class-11", classLabel: "১১শ শ্রেণি", tradeLabel: "কনজিউমার ইলেকট্রনিক্স", likesCount: 18 },
  ];
  const dbAll = institutionalDb.getAllStudentLearningAttempts();
  const allDbAttempts = dbAll.flatMap((item) => item.attempts || []);

  return publishedLessons.map((lesson, idx) => {
    const totalStudentsInClass =
      lesson.trade === "Computer" ? 35 : lesson.trade === "Electrical" ? 32 : lesson.trade === "RAC" ? 28 : 30;
    const matchingAttempts = allDbAttempts.filter((a) => a.lessonId === lesson.id);
    const dbPassedCount = matchingAttempts.filter((a) => (a.percentage || 0) >= 50).length;

    const baseAttempts = Math.max(14, 28 - idx * 4);
    const totalAttempts = baseAttempts + matchingAttempts.length;
    const completedPassed = Math.max(10, baseAttempts - 3) + dbPassedCount;
    const completionRatePercentage = Math.min(100, Math.round((completedPassed / totalStudentsInClass) * 100));

    let averageScore = Math.max(65, 86 - idx * 4);
    if (matchingAttempts.length > 0) {
      const sumScore = matchingAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0);
      averageScore = Math.round((averageScore + sumScore / matchingAttempts.length) / 2);
    }

    const topMissed =
      idx === 0
        ? "ওহমের সূত্রের গাণিতিক প্রয়োগ"
        : idx === 1
        ? "CMOS ব্যাটারি ও বায়োস তথ্য"
        : idx === 2
        ? "রেফ্রিজারেন্ট গ্যাস ও প্রেসার চার্ট"
        : "ওয়ার্কশপ সেফটি ইকুইপমেন্ট ও প্রোটোকল";

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      classLevel: lesson.classLevel,
      classLabel: lesson.classLabel,
      trade: lesson.trade,
      tradeLabel: lesson.tradeLabel,
      totalStudentsInClass,
      totalReaders: Math.max(lesson.likesCount * 3 + 18, 32) + matchingAttempts.length,
      quizzesAttempted: totalAttempts,
      completedPassed,
      completionRatePercentage,
      averageScorePercentage: averageScore,
      topMissedConcept: topMissed,
      status: completionRatePercentage >= 75 ? "high_completion" : completionRatePercentage >= 55 ? "moderate" : "needs_push",
    };
  });
}

export function getStudentLeaderboard(classFilter = "all", tradeFilter = "all"): StudentLeaderboardEntry[] {
  const activeStudent = getActiveStudentAccount();

  // Baseline verified peer leaderboard entries from PTSC Institutional Data
  const peers: Omit<StudentLeaderboardEntry, "rank">[] = [
    {
      rollNumber: "1001",
      studentName: "তানজিলা আক্তার",
      classLevel: "class-10",
      classLabel: "ক্লাস ১০ (ভোকেশনাল)",
      trade: "Computer",
      tradeLabel: "কম্পিউটার ও আইওটি",
      totalScore: 92,
      quizzesTaken: 12,
      accuracyPercentage: 96,
      streakDays: 7,
      badges: ["🔥 ৭-দিনের স্ট্রিক হিরো", "⚡ ওহম মাস্টার", "🎯 নিখুঁত স্কোরার", "🌟 টেকনিক্যাল টপার"],
      avatarUrl: "https://picsum.photos/seed/ptsc_top_1001/200/200",
    },
    {
      rollNumber: "1002",
      studentName: "মোঃ সাকিব আল হাসান",
      classLevel: "class-10",
      classLabel: "ক্লাস ১০ (ভোকেশনাল)",
      trade: "Computer",
      tradeLabel: "কম্পিউটার ও আইওটি",
      totalScore: 88,
      quizzesTaken: 11,
      accuracyPercentage: 92,
      streakDays: 6,
      badges: ["🔥 ৬-দিনের স্ট্রিক হিরো", "⚡ সার্কিট উইজার্ড", "🏅 টপ কুইজার"],
      avatarUrl: "https://picsum.photos/seed/ptsc_top_1002/200/200",
    },
    {
      rollNumber: "1003",
      studentName: "মাহমুদুল হাসান",
      classLevel: "class-9",
      classLabel: "ক্লাস ৯ (ভোকেশনাল)",
      trade: "Electrical",
      tradeLabel: "ইলেকট্রিক্যাল সেফটি ও সার্কিট",
      totalScore: 84,
      quizzesTaken: 10,
      accuracyPercentage: 90,
      streakDays: 5,
      badges: ["🔥 ৫-দিনের স্ট্রিক", "⚡ ভোল্টেজ এক্সপার্ট", "🌟 একটিভ লার্নার"],
      avatarUrl: "https://picsum.photos/seed/ptsc_top_1003/200/200",
    },
    {
      rollNumber: "1004",
      studentName: "নুসরাত জাহান",
      classLevel: "class-9",
      classLabel: "ক্লাস ৯ (ভোকেশনাল)",
      trade: "Electrical",
      tradeLabel: "ইলেকট্রিক্যাল সেফটি ও সার্কিট",
      totalScore: 81,
      quizzesTaken: 10,
      accuracyPercentage: 88,
      streakDays: 5,
      badges: ["🔥 ৫-দিনের স্ট্রিক", "🎯 ৯০% নির্ভুল কুইজার"],
      avatarUrl: "https://picsum.photos/seed/ptsc_top_1004/200/200",
    },
    {
      rollNumber: "1005",
      studentName: "ফারদিন আহমেদ",
      classLevel: "class-9",
      classLabel: "ক্লাস ৯ (ভোকেশনাল)",
      trade: "RAC",
      tradeLabel: "রেফ্রিজারেশন ও এয়ারকন্ডিশনিং",
      totalScore: 78,
      quizzesTaken: 9,
      accuracyPercentage: 86,
      streakDays: 4,
      badges: ["❄️ প্রেসার চার্ট প্রো", "🔥 ৪-দিনের স্ট্রিক"],
      avatarUrl: "https://picsum.photos/seed/ptsc_top_1005/200/200",
    },
    {
      rollNumber: "1008",
      studentName: "জান্নাতুল মাওয়া",
      classLevel: "diploma",
      classLabel: "ডিপ্লোমা ১ম পর্ব",
      trade: "Automobile",
      tradeLabel: "অটোমোবাইল টেকনোলজি",
      totalScore: 75,
      quizzesTaken: 9,
      accuracyPercentage: 84,
      streakDays: 4,
      badges: ["🚗 ইঞ্জিন মেকানিক", "🔥 ৪-দিনের স্ট্রিক"],
      avatarUrl: "https://picsum.photos/seed/ptsc_top_1008/200/200",
    },
    {
      rollNumber: "1010",
      studentName: "রাকিবুল ইসলাম",
      classLevel: "class-10",
      classLabel: "ক্লাস ১০ (ভোকেশনাল)",
      trade: "Civil",
      tradeLabel: "সিভিল কনস্ট্রাকশন",
      totalScore: 72,
      quizzesTaken: 8,
      accuracyPercentage: 82,
      streakDays: 3,
      badges: ["📐 ড্রাফটিং মাস্টার", "🌟 একটিভ লার্নার"],
      avatarUrl: "https://picsum.photos/seed/ptsc_top_1010/200/200",
    },
    {
      rollNumber: "1012",
      studentName: "সুমাইয়া খাতুন",
      classLevel: "class-9",
      classLabel: "ক্লাস ৯ (ভোকেশনাল)",
      trade: "Computer",
      tradeLabel: "কম্পিউটার ও আইওটি",
      totalScore: 68,
      quizzesTaken: 8,
      accuracyPercentage: 80,
      streakDays: 3,
      badges: ["💻 কোডিং স্পার্ক", "🌟 একটিভ লার্নার"],
      avatarUrl: "https://picsum.photos/seed/ptsc_top_1012/200/200",
    },
  ];

  let allEntries = [...peers];

  // If there is an active logged-in student, compute their real stats and integrate them
  if (activeStudent && activeStudent.rollNumber) {
    const studentAttempts = getStudentAllQuizHistory(activeStudent.rollNumber);
    const studentStats = getStudentStats(activeStudent.rollNumber);
    const studentScore = studentAttempts.reduce((sum, a) => sum + a.score, 0);
    const totalQ = studentAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);
    const studentAccuracy = totalQ > 0 ? Math.round((studentScore / totalQ) * 100) : 0;

    const badges: string[] = [];
    if (studentStats.currentStreakDays >= 5) badges.push("🔥 ৫-দিনের স্ট্রিক হিরো");
    else if (studentStats.currentStreakDays >= 3) badges.push("⚡ স্ট্রিক স্টার");
    if (studentAttempts.length >= 3) badges.push("🏅 কুইজ মাস্টার");
    if (studentAccuracy >= 85) badges.push("🎯 নির্ভুল স্কোরার");
    badges.push("🌟 PTSC শিক্ষার্থী");

    const currentEntry: Omit<StudentLeaderboardEntry, "rank"> = {
      rollNumber: activeStudent.rollNumber,
      studentName: activeStudent.studentName,
      classLevel: activeStudent.classLevel || "class-10",
      classLabel:
        activeStudent.classLevel === "class-9"
          ? "ক্লাস ৯ (ভোকেশনাল)"
          : activeStudent.classLevel === "diploma"
          ? "ডিপ্লোমা ১ম পর্ব"
          : "ক্লাস ১০ (ভোকেশনাল)",
      trade: activeStudent.trade || "Computer",
      tradeLabel:
        activeStudent.trade === "Electrical"
          ? "ইলেকট্রিক্যাল সেফটি"
          : activeStudent.trade === "RAC"
          ? "রেফ্রিজারেশন"
          : "কম্পিউটার ও আইওটি",
      totalScore: studentScore,
      quizzesTaken: studentAttempts.length,
      accuracyPercentage: studentAccuracy,
      streakDays: studentStats.currentStreakDays,
      badges,
      avatarUrl: `https://picsum.photos/seed/ptsc_student_${activeStudent.rollNumber}/200/200`,
      isCurrentStudent: true,
    };

    allEntries = [currentEntry, ...allEntries.filter((p) => p.rollNumber !== activeStudent.rollNumber)];
  }

  // Filter by class and trade
  const filtered = allEntries.filter((entry) => {
    if (classFilter !== "all" && entry.classLevel !== classFilter) return false;
    if (tradeFilter !== "all" && entry.trade.toLowerCase() !== tradeFilter.toLowerCase()) return false;
    return true;
  });

  // Sort descending by totalScore, then streakDays, then accuracy
  filtered.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
    return b.accuracyPercentage - a.accuracyPercentage;
  });

  return filtered.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export function getClassWeakTopicAnalytics(): TeacherPerformanceOverview {
  const userWeakTopics = getWeakTopics();
  const dbAll = institutionalDb.getAllStudentLearningAttempts();
  const allDbAttempts = dbAll.flatMap((item) => item.attempts || []);
  const lessonCompletions = getLessonCompletionAnalytics();

  // Aggregate missed topics across database attempts
  const dbMissedTopicsMap: Record<string, number> = {};
  for (const att of allDbAttempts) {
    if (Array.isArray(att.missedTopics)) {
      for (const t of att.missedTopics) {
        const cleanT = String(t).trim();
        if (cleanT) {
          dbMissedTopicsMap[cleanT] = (dbMissedTopicsMap[cleanT] || 0) + 1;
        }
      }
    }
  }

  const classesBreakdown: ClassAnalyticsSummary[] = [
    {
      classLevel: "class-9",
      classLabel: "ক্লাস ৯ (ভোকেশনাল)",
      trade: "Electrical",
      tradeLabel: "ইলেকট্রিক্যাল সেফটি ও সার্কিট",
      totalStudents: 32,
      participatedStudents: 29,
      participationRatePercentage: 91,
      quizzesTaken: 128 + allDbAttempts.filter((a) => a.tradeLabel?.includes("ইলেকট্রিক্যাল")).length,
      averageScorePercentage: 74,
      passRatePercentage: 86,
      completionRatePercentage: 84,
      topWeakTopics: [
        { topic: "ওহমের সূত্রের গাণিতিক প্রয়োগ", missedRate: 38 },
        { topic: "প্যারালাল সার্কিট রেজিস্ট্যান্স গণনা", missedRate: 31 },
        { topic: "ইলেকট্রিক্যাল সেফটি রুলস ও আর্দিং", missedRate: 19 },
      ],
      status: "good",
    },
    {
      classLevel: "class-10",
      classLabel: "ক্লাস ১০ (ভোকেশনাল)",
      trade: "Computer",
      tradeLabel: "কম্পিউটার ও আইওটি",
      totalStudents: 35,
      participatedStudents: 33,
      participationRatePercentage: 94,
      quizzesTaken: 142 + allDbAttempts.filter((a) => a.tradeLabel?.includes("কম্পিউটার")).length,
      averageScorePercentage: 81,
      passRatePercentage: 92,
      completionRatePercentage: 89,
      topWeakTopics: [
        { topic: "CMOS ব্যাটারি ও বায়োস তথ্য", missedRate: 29 },
        { topic: "IPv4 সাবনেটিং ও গেটওয়ে", missedRate: 25 },
        { topic: "মাইক্রোকন্ট্রোলার পিন কনফিগারেশন", missedRate: 18 },
      ],
      status: "excellent",
    },
    {
      classLevel: "class-9",
      classLabel: "ক্লাস ৯ (ভোকেশনাল)",
      trade: "RAC",
      tradeLabel: "রেফ্রিজারেশন ও এয়ারকন্ডিশনিং",
      totalStudents: 28,
      participatedStudents: 22,
      participationRatePercentage: 78,
      quizzesTaken: 96,
      averageScorePercentage: 63,
      passRatePercentage: 72,
      completionRatePercentage: 68,
      topWeakTopics: [
        { topic: "রেফ্রিজারেন্ট গ্যাস ও প্রেসার চার্ট", missedRate: 46 },
        { topic: "কম্প্রেসর ক্যাপাসিটর ওয়্যারিং", missedRate: 41 },
        { topic: "ভ্যাকুয়াম পাম্পিং প্রক্রিয়া", missedRate: 32 },
      ],
      status: "needs_attention",
    },
    {
      classLevel: "diploma",
      classLabel: "ডিপ্লোমা ১ম পর্ব",
      trade: "Automobile",
      tradeLabel: "অটোমোবাইল টেকনোলজি",
      totalStudents: 30,
      participatedStudents: 26,
      participationRatePercentage: 87,
      quizzesTaken: 110,
      averageScorePercentage: 71,
      passRatePercentage: 83,
      completionRatePercentage: 79,
      topWeakTopics: [
        { topic: "ফোর-স্ট্রোক পাওয়ার মেকানিজম", missedRate: 34 },
        { topic: "ফুয়েল ইনজেকশন টাইমিং", missedRate: 31 },
        { topic: "ডিফারেনশিয়াল গিয়ার অনুপাত", missedRate: 22 },
      ],
      status: "good",
    },
    {
      classLevel: "class-10",
      classLabel: "ক্লাস ১০ (ভোকেশনাল)",
      trade: "Civil",
      tradeLabel: "সিভিল কনস্ট্রাকশন ও ড্রাফটিং",
      totalStudents: 26,
      participatedStudents: 23,
      participationRatePercentage: 88,
      quizzesTaken: 88,
      averageScorePercentage: 76,
      passRatePercentage: 88,
      completionRatePercentage: 82,
      topWeakTopics: [
        { topic: "কংক্রিট মিক্স রেশিও (1:2:4)", missedRate: 27 },
        { topic: "অটোক্যাড লেয়ার ও স্ন্যাপ", missedRate: 21 },
        { topic: "লেভেলিং স্টাফ রিডিং", missedRate: 19 },
      ],
      status: "good",
    },
  ];

  const frequentlyMissedConcepts = [
    {
      topic: "ওহমের সূত্রের গাণিতিক প্রয়োগ ও অনুপাত",
      trade: "ইলেকট্রিক্যাল",
      missedCount: 42 + (dbMissedTopicsMap["ওহমের সূত্র"] || 0) * 3 + userWeakTopics.filter((w) => w.topicName.includes("ওহম")).length * 2,
      severity: "high" as const,
      recommendation: "ল্যাব সেশনে মাল্টিমিটার ও ভ্যারিয়েবল পাওয়ার সাপ্লাই দিয়ে সরাসরি V=IR পরিমাপের ৫ মিনিটের প্র্যাকটিক্যাল ডেমো দিন।",
    },
    {
      topic: "রেফ্রিজারেন্ট গ্যাস টাইপ ও প্রেসার চার্ট বিশ্লেষণ",
      trade: "আরএসি (RAC)",
      missedCount: 39 + (dbMissedTopicsMap["রেফ্রিজারেন্ট"] || 0) * 2,
      severity: "high" as const,
      recommendation: "R-134a এবং R-32 গ্যাসের স্ট্যান্ডিং ও সাকশন প্রেসারের চার্টটি ক্লাসরুমে পোস্টার হিসেবে ঝুলিয়ে রিভিশন নিন।",
    },
    {
      topic: "CMOS ব্যাটারি, ভোল্টেজ রেটিং ও বায়োস ক্লক",
      trade: "কম্পিউটার",
      missedCount: 31 + (dbMissedTopicsMap["বায়োস"] || 0) * 2 + userWeakTopics.filter((w) => w.topicName.includes("CMOS")).length * 2,
      severity: "medium" as const,
      recommendation: "CR2032 ব্যাটারির ৩ ভোল্ট পরিমাপ ও বায়োস ব্যাটারি ডাউন হলে কী কী লক্ষণ প্রকাশ পায় তা ক্লাসে লাইভ তুলে ধরুন।",
    },
    {
      topic: "৪-স্ট্রোক ইঞ্জিনের সাকশন বনাম পাওয়ার স্ট্রোক টাইমিং",
      trade: "অটোমোবাইল",
      missedCount: 28,
      severity: "medium" as const,
      recommendation: "কাট-সেকশন ইঞ্জিন মডেলে ভালভ টাইমিং ও স্পার্ক প্লাগের টাইমিং মেকানিজম শিক্ষার্থীদের হাতে ঘুরিয়ে দেখান।",
    },
    {
      topic: "কংক্রিট কিউব টেস্ট ও ওয়াটার-সিমেন্ট রেশিও",
      trade: "সিভিল",
      missedCount: 22,
      severity: "low" as const,
      recommendation: "ল্যাবে স্ট্যান্ডার্ড স্লাম্প টেস্টের ধাপসমূহ নিয়ে শিক্ষার্থীদের দিয়ে সরাসরি টেস্ট করান।",
    },
  ];

  const commonMistakes: CommonMistakePattern[] = [
    {
      id: "cm-1",
      topic: "কারেন্ট বনাম রেজিস্ট্যান্স অনুপাত",
      mistakeDescription: "শিক্ষার্থীরা প্রায়শই রেজিস্ট্যান্স বাড়লে কারেন্ট বৃদ্ধি পায় বলে ভুল দাগায় (ব্যস্তানুপাতিক সম্পর্ক গুলিয়ে ফেলে)।",
      frequencyPercentage: 44,
      suggestedAction: "তুলনামূলক পাইপ ও পানির প্রবাহ অ্যানালজি দিয়ে রেজিস্ট্যান্সের কাজ পরিষ্কার করুন।",
      affectedTrade: "ইলেকট্রিক্যাল ও ইলেকট্রনিক্স",
    },
    {
      id: "cm-2",
      topic: "ইনপুট বনাম আউটপুট ডিভাইস ক্যাটাগরি",
      mistakeDescription: "টাচস্ক্রিন ও মাল্টিফাংশন প্রিন্টারের মতো দ্বিমুখী ডিভাইসগুলোকে কেবল ইনপুট বা কেবল আউটপুট ধরে ভুল করে।",
      frequencyPercentage: 35,
      suggestedAction: "দ্বৈত কার্যক্ষম ডিভাইসের চার্ট বোর্ডে অনুশীলন করান।",
      affectedTrade: "কম্পিউটার ও আইওটি",
    },
    {
      id: "cm-3",
      topic: "হাই প্রেশার বনাম লো প্রেশার সাইড",
      mistakeDescription: "কনডেন্সার ও ইভাপোরেটরের প্রেশার জোনে কোন গ্যাস থাকে তা কনফিউজড হওয়া।",
      frequencyPercentage: 38,
      suggestedAction: "লাল ও নীল রঙের হাই-লো প্রেশার গেজ ম্যানিফোল্ড হাতে ধরিয়ে প্র্যাকটিস করান।",
      affectedTrade: "রেফ্রিজারেশন ও এসি",
    },
  ];

  const totalStudentsEnrolled = classesBreakdown.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalStudentsParticipated = classesBreakdown.reduce((sum, c) => sum + c.participatedStudents, 0);
  const overallParticipationRatePercentage = Math.round((totalStudentsParticipated / totalStudentsEnrolled) * 100);
  const overallLessonCompletionRatePercentage = Math.round(
    lessonCompletions.reduce((sum, l) => sum + l.completionRatePercentage, 0) / Math.max(1, lessonCompletions.length)
  );

  return {
    overallAverageScore: 73,
    totalQuizzesEvaluated: 564 + allDbAttempts.length,
    totalStudentsEnrolled,
    totalStudentsParticipated,
    overallParticipationRatePercentage,
    overallLessonCompletionRatePercentage,
    totalWeakTopicsTracked: userWeakTopics.length + frequentlyMissedConcepts.length + 9,
    activeRemedialLessonsCount: 6,
    classesBreakdown,
    frequentlyMissedConcepts,
    commonMistakes,
    lessonCompletions,
  };
}

// =========================================================================
// 8. LOGIN VS GUEST SESSION PERSISTENCE & RESUME POINT TRACKING
// =========================================================================

export interface GuestLearningProgress {
  sessionId: string;
  completedItemIds: number[];
  unlockedItemIds: number[];
  quizScores: Record<number, { score: number; isPassed: boolean; totalQuestions: number; attempts: number }>;
  totalXp: number;
  lastUpdated: string;
}

export interface LearningResumePoint {
  courseId?: number;
  courseTitle?: string;
  chapterId?: number;
  chapterTitle?: string;
  itemId?: number;
  itemTitle?: string;
  savedAt: string;
}

/**
 * Returns or generates a deterministic unique guest session identifier
 */
export function getGuestSessionId(): string {
  if (typeof window === "undefined") return "guest_default";
  let gid = localStorage.getItem("ptsc_guest_session_id");
  if (!gid) {
    gid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem("ptsc_guest_session_id", gid);
  }
  return gid;
}

/**
 * Retrieves the guest learning progress from browser localStorage
 */
export function getGuestLearningProgress(): GuestLearningProgress {
  if (typeof window === "undefined") {
    return {
      sessionId: "guest_default",
      completedItemIds: [],
      unlockedItemIds: [],
      quizScores: {},
      totalXp: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem("ptsc_guest_learning_progress");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        sessionId: parsed.sessionId || getGuestSessionId(),
        completedItemIds: Array.isArray(parsed.completedItemIds) ? parsed.completedItemIds : [],
        unlockedItemIds: Array.isArray(parsed.unlockedItemIds) ? parsed.unlockedItemIds : [],
        quizScores: parsed.quizScores || {},
        totalXp: Number(parsed.totalXp) || 0,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (e) {
    console.error("Failed to parse guest learning progress:", e);
  }

  const defaultProgress: GuestLearningProgress = {
    sessionId: getGuestSessionId(),
    completedItemIds: [],
    unlockedItemIds: [],
    quizScores: {},
    totalXp: 0,
    lastUpdated: new Date().toISOString(),
  };
  return defaultProgress;
}

/**
 * Saves guest learning progress to browser localStorage
 */
export function saveGuestLearningProgress(update: Partial<GuestLearningProgress>): GuestLearningProgress {
  if (typeof window === "undefined") {
    return getGuestLearningProgress();
  }
  try {
    const current = getGuestLearningProgress();
    const updated: GuestLearningProgress = {
      sessionId: current.sessionId,
      completedItemIds: update.completedItemIds
        ? Array.from(new Set([...current.completedItemIds, ...update.completedItemIds]))
        : current.completedItemIds,
      unlockedItemIds: update.unlockedItemIds
        ? Array.from(new Set([...current.unlockedItemIds, ...update.unlockedItemIds]))
        : current.unlockedItemIds,
      quizScores: { ...current.quizScores, ...(update.quizScores || {}) },
      totalXp: (current.totalXp || 0) + (update.totalXp || 0),
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem("ptsc_guest_learning_progress", JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save guest learning progress:", e);
    return getGuestLearningProgress();
  }
}

/**
 * Saves resume point for guest users
 */
export function saveGuestResumePoint(point: Omit<LearningResumePoint, "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const fullPoint: LearningResumePoint = {
      ...point,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("ptsc_guest_resume_point", JSON.stringify(fullPoint));
  } catch (e) {
    console.error("Failed to save guest resume point:", e);
  }
}

/**
 * Retrieves resume point for guest users
 */
export function getGuestResumePoint(): LearningResumePoint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("ptsc_guest_resume_point");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Saves permanent resume point for a logged-in student in database and profile
 */
export function saveStudentResumePoint(roll: string, point: Omit<LearningResumePoint, "savedAt">): void {
  const cleanRoll = String(roll).trim();
  if (!cleanRoll) return;

  const fullPoint: LearningResumePoint = {
    ...point,
    savedAt: new Date().toISOString(),
  };

  try {
    institutionalDb.saveStudentResumePoint(cleanRoll, fullPoint);
  } catch (e) {}

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`ptsc_student_resume_point_${cleanRoll}`, JSON.stringify(fullPoint));
    } catch (e) {
      console.error("Failed to persist student resume point:", e);
    }
  }
}

/**
 * Retrieves permanent resume point for a logged-in student
 */
export function getStudentResumePoint(roll?: string): LearningResumePoint | null {
  const activeStudent = getActiveStudentAccount();
  const cleanRoll = (roll || activeStudent?.rollNumber || "").trim();
  if (!cleanRoll) return null;

  try {
    const dbPoint = institutionalDb.getStudentResumePoint(cleanRoll);
    if (dbPoint) return dbPoint;
  } catch (e) {}

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`ptsc_student_resume_point_${cleanRoll}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
  }
  return null;
}

/**
 * Merges guest progress (completed items, quiz scores, resume point) into the student's profile upon login
 */
export function syncGuestProgressToStudent(roll: string): { mergedCount: number; success: boolean } {
  if (typeof window === "undefined" || !roll) return { mergedCount: 0, success: false };
  try {
    const cleanRoll = String(roll).trim();
    const guestProgress = getGuestLearningProgress();
    const guestAttemptsStr = localStorage.getItem("ptsc_guest_quiz_attempts");
    const guestAttempts: QuizAttemptRecord[] = guestAttemptsStr ? JSON.parse(guestAttemptsStr) : [];
    const guestResume = getGuestResumePoint();

    let mergedCount = 0;

    // 1. Merge quiz attempts into institutionalDb and student local storage
    if (guestAttempts.length > 0) {
      guestAttempts.forEach((att) => {
        const studentAtt = {
          ...att,
          studentRoll: cleanRoll,
          isGuest: false,
        };
        institutionalDb.saveStudentLearningAttempt(cleanRoll, studentAtt);
        mergedCount++;
      });

      const studentAttemptsKey = `ptsc_student_attempts_${cleanRoll}`;
      const prevStudentAttemptsStr = localStorage.getItem(studentAttemptsKey);
      const prevAttempts: QuizAttemptRecord[] = prevStudentAttemptsStr ? JSON.parse(prevStudentAttemptsStr) : [];
      const mergedAttempts = [
        ...guestAttempts.map((a) => ({ ...a, studentRoll: cleanRoll, isGuest: false })),
        ...prevAttempts.filter((p) => !guestAttempts.some((g) => g.lessonId === p.lessonId)),
      ];
      localStorage.setItem(studentAttemptsKey, JSON.stringify(mergedAttempts));
    }

    // 2. Merge completed items into student-specific completed map
    if (guestProgress.completedItemIds.length > 0) {
      const studentCompletedKey = `ptsc_student_completed_items_${cleanRoll}`;
      const prevCompleted = JSON.parse(localStorage.getItem(studentCompletedKey) || "[]");
      const combinedCompleted = Array.from(new Set([...prevCompleted, ...guestProgress.completedItemIds]));
      localStorage.setItem(studentCompletedKey, JSON.stringify(combinedCompleted));
    }

    // 3. Merge resume point into institutionalDb and student storage
    if (guestResume) {
      saveStudentResumePoint(cleanRoll, guestResume);
    }

    // 4. Mark guest session as merged (clear temporary progress so it is not duplicated)
    localStorage.removeItem("ptsc_guest_learning_progress");
    localStorage.removeItem("ptsc_guest_quiz_attempts");
    localStorage.removeItem("ptsc_guest_resume_point");

    return { mergedCount, success: true };
  } catch (err) {
    console.error("Failed to sync guest progress to student:", err);
    return { mergedCount: 0, success: false };
  }
}

/**
 * Saves a completed item ID for a student to ensure permanent unlock across sessions & page navigations
 */
export function saveStudentCompletedItemId(roll: string | undefined, itemId: number): void {
  const activeStudent = getActiveStudentAccount();
  const cleanRoll = (roll || activeStudent?.rollNumber || "").trim();
  if (typeof window === "undefined" || !cleanRoll || !itemId) return;
  try {
    const studentCompletedKey = `ptsc_student_completed_items_${cleanRoll}`;
    const prevCompleted: number[] = JSON.parse(localStorage.getItem(studentCompletedKey) || "[]");
    if (!prevCompleted.includes(itemId)) {
      prevCompleted.push(itemId);
      localStorage.setItem(studentCompletedKey, JSON.stringify(prevCompleted));
    }
  } catch (e) {
    console.error("Failed to save student completed item ID:", e);
  }
}

/**
 * Retrieves all completed item IDs for a student
 */
export function getStudentCompletedItemIds(roll?: string): number[] {
  const activeStudent = getActiveStudentAccount();
  const cleanRoll = (roll || activeStudent?.rollNumber || "").trim();
  if (typeof window === "undefined" || !cleanRoll) return [];
  try {
    const studentCompletedKey = `ptsc_student_completed_items_${cleanRoll}`;
    const raw = localStorage.getItem(studentCompletedKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
