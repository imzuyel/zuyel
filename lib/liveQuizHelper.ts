import { institutionalDb } from "./database";

export interface LiveQuestionSnapshot {
  id: string;
  questionText: string;
  question?: string;
  type: string;
  options: string[];
  questionData?: any;
  timeLimit: number;
  correctAnswer: any;
  explanation?: string;
}

export interface QuizQuestionSequenceState {
  phase: "LOBBY" | "READY" | "COUNTDOWN" | "QUESTION_PREVIEW" | "QUESTION_ACTIVE" | "QUESTION_ENDED" | "COMPLETED" | "CANCELLED";
  countdownSecondsRemaining: number;
  previewSecondsRemaining: number;
  mainTimerSecondsRemaining: number;
  isOptionsRevealed: boolean;
  canSubmitAnswer: boolean;
  activeQuestionIndex: number;
  totalQuestions: number;
  sequenceStartedAt?: string;
  readyEndsAt?: string;
  countdownEndsAt?: string;
  previewEndsAt?: string;
  questionEndsAt?: string;
}

export function computeQuizSequenceState(session: any, questionTimeLimit = 30): QuizQuestionSequenceState {
  const isStarted = session?.isQuizModeStarted || (session?.status !== "LOBBY" && session?.status !== "CREATED");

  if (!session || session.status === "LOBBY" || session.status === "CREATED" || !isStarted) {
    return {
      phase: "LOBBY",
      countdownSecondsRemaining: 0,
      previewSecondsRemaining: 0,
      mainTimerSecondsRemaining: 0,
      isOptionsRevealed: false,
      canSubmitAnswer: false,
      activeQuestionIndex: session?.currentQuestionIndex || 0,
      totalQuestions: session?.totalQuestions || 0
    };
  }

  if (session.status === "COMPLETED" || session.status === "CANCELLED" || session.status === "EXPIRED") {
    return {
      phase: session.status,
      countdownSecondsRemaining: 0,
      previewSecondsRemaining: 0,
      mainTimerSecondsRemaining: 0,
      isOptionsRevealed: true,
      canSubmitAnswer: false,
      activeQuestionIndex: session.currentQuestionIndex || 0,
      totalQuestions: session.totalQuestions || 0
    };
  }

  const now = Date.now();
  const readyEndsAt = session.readyEndsAt ? new Date(session.readyEndsAt).getTime() : 0;
  const countdownEndsAt = session.countdownEndsAt ? new Date(session.countdownEndsAt).getTime() : 0;
  const previewEndsAt = session.previewEndsAt ? new Date(session.previewEndsAt).getTime() : 0;
  const questionEndsAt = session.questionEndsAt ? new Date(session.questionEndsAt).getTime() : 0;

  // Step 1 (Phase 1): Get Ready!
  if (readyEndsAt && now < readyEndsAt) {
    return {
      phase: "READY",
      countdownSecondsRemaining: 3,
      previewSecondsRemaining: 0,
      mainTimerSecondsRemaining: questionTimeLimit,
      isOptionsRevealed: false,
      canSubmitAnswer: false,
      activeQuestionIndex: session.currentQuestionIndex || 0,
      totalQuestions: session.totalQuestions || 0,
      sequenceStartedAt: session.sequenceStartedAt,
      readyEndsAt: session.readyEndsAt,
      countdownEndsAt: session.countdownEndsAt,
      previewEndsAt: session.previewEndsAt,
      questionEndsAt: session.questionEndsAt
    };
  }

  // Step 2 (Phase 2): Countdown (3 -> 2 -> 1 -> GO!)
  if (countdownEndsAt && now < countdownEndsAt) {
    const remaining = Math.max(1, Math.ceil((countdownEndsAt - now) / 1000));
    return {
      phase: "COUNTDOWN",
      countdownSecondsRemaining: remaining,
      previewSecondsRemaining: 3,
      mainTimerSecondsRemaining: questionTimeLimit,
      isOptionsRevealed: false,
      canSubmitAnswer: false,
      activeQuestionIndex: session.currentQuestionIndex || 0,
      totalQuestions: session.totalQuestions || 0,
      sequenceStartedAt: session.sequenceStartedAt,
      countdownEndsAt: session.countdownEndsAt,
      previewEndsAt: session.previewEndsAt,
      questionEndsAt: session.questionEndsAt
    };
  }

  // Step 2: Question Preview (Question text visible, options hidden, timer stopped)
  if (previewEndsAt && now < previewEndsAt) {
    const remaining = Math.max(1, Math.ceil((previewEndsAt - now) / 1000));
    return {
      phase: "QUESTION_PREVIEW",
      countdownSecondsRemaining: 0,
      previewSecondsRemaining: remaining,
      mainTimerSecondsRemaining: questionTimeLimit,
      isOptionsRevealed: false,
      canSubmitAnswer: false,
      activeQuestionIndex: session.currentQuestionIndex || 0,
      totalQuestions: session.totalQuestions || 0,
      sequenceStartedAt: session.sequenceStartedAt,
      countdownEndsAt: session.countdownEndsAt,
      previewEndsAt: session.previewEndsAt,
      questionEndsAt: session.questionEndsAt
    };
  }

  // Step 3 & 4: Options Revealed & Main Question Timer Active
  if (questionEndsAt && now < questionEndsAt) {
    const remaining = Math.max(0, Math.ceil((questionEndsAt - now) / 1000));
    return {
      phase: "QUESTION_ACTIVE",
      countdownSecondsRemaining: 0,
      previewSecondsRemaining: 0,
      mainTimerSecondsRemaining: remaining,
      isOptionsRevealed: true,
      canSubmitAnswer: true,
      activeQuestionIndex: session.currentQuestionIndex || 0,
      totalQuestions: session.totalQuestions || 0,
      sequenceStartedAt: session.sequenceStartedAt,
      countdownEndsAt: session.countdownEndsAt,
      previewEndsAt: session.previewEndsAt,
      questionEndsAt: session.questionEndsAt
    };
  }

  // Step 5: Question Ended / Result
  return {
    phase: "QUESTION_ENDED",
    countdownSecondsRemaining: 0,
    previewSecondsRemaining: 0,
    mainTimerSecondsRemaining: 0,
    isOptionsRevealed: true,
    canSubmitAnswer: false,
    activeQuestionIndex: session.currentQuestionIndex || 0,
    totalQuestions: session.totalQuestions || 0,
    sequenceStartedAt: session.sequenceStartedAt,
    countdownEndsAt: session.countdownEndsAt,
    previewEndsAt: session.previewEndsAt,
    questionEndsAt: session.questionEndsAt
  };
}

const PRELOADED_QUIZZES = [
  {
    id: "comp-iot",
    title: "কম্পিউটার ও আইওটি (Computer & IoT Basics)",
    questions: [
      {
        id: "comp-iot-1",
        question: "আইওটি (IoT) এর সঠিক পূর্ণরূপ বা Elaborated Form কোনটি?",
        options: [
          "Internet of Things",
          "Input Output Technology",
          "Internal Operating Tool",
          "Internet of Technology"
        ],
        correctAnswer: 0,
        explanation: "IoT এর পূর্ণরূপ হলো 'Internet of Things'। এটি বিশ্বজুড়ে নেটওয়ার্কযুক্ত ডিভাইসের পারস্পরিক সংযোগ নির্দেশ করে।"
      },
      {
        id: "comp-iot-2",
        question: "কম্পিউটার নেটওয়ার্কে IPv4 এড্রেস কত বিটের হয়ে থাকে?",
        options: [
          "১৬ বিট (16 bits)",
          "৩২ বিট (32 bits)",
          "৬৪ বিট (64 bits)",
          "১২৮ বিট (128 bits)"
        ],
        correctAnswer: 1,
        explanation: "IPv4 এড্রেস ৩২ বিটের হয়ে থাকে যা ডটেড-ডেসিমেল পদ্ধতিতে প্রকাশ করা হয় (যেমন: 192.168.1.1)।"
      },
      {
        id: "comp-iot-3",
        question: "কোন কারিগরি নেটওয়ার্ক ডিভাইসটি এনালগ সংকেতকে ডিজিটালে এবং বিপরীত রূপান্তর করে?",
        options: [
          "হাব (Hub)",
          "রাউটার (Router)",
          "মডেম (Modem)",
          "সুইচ (Switch)"
        ],
        correctAnswer: 2,
        explanation: "মডেম (Modulation-Demodulation) এনালগ সংকেতকে ডিজিটাল এবং ডিজিটালকে এনালগ সংকেতে রূপান্তর করে।"
      },
      {
        id: "comp-iot-4",
        question: "কোন প্রোগ্রামিং ল্যাঙ্গুয়েজটি আরডুইনো (Arduino) মাইক্রোকন্ট্রোলার কোডিংয়ে মূলত ব্যবহৃত হয়?",
        options: [
          "Python",
          "HTML / CSS",
          "C / C++ (Arduino IDE)",
          "Java"
        ],
        correctAnswer: 2,
        explanation: "আরডুইনো মাইক্রোকন্ট্রোলার বোর্ডে প্রোগ্রাম লোড করার জন্য C/C++ এর ওপর ভিত্তি করে তৈরি আরডুইনো স্কেচ ভাষা ব্যবহার করা হয়।"
      }
    ]
  },
  {
    id: "elec-works",
    title: "ইলেকট্রিক্যাল ওয়ার্কস ও সার্কিট (Electrical Works & Safety)",
    questions: [
      {
        id: "elec-works-1",
        question: "আন্তর্জাতিক নিয়ম অনুযায়ী বিদ্যুৎ প্রবাহের (Electric Current) পরিমাপের একক কী?",
        options: [
          "ভোল্ট (Volt)",
          "অ্যাম্পিয়ার (Ampere)",
          "ওহম (Ohm)",
          "ওয়াট (Watt)"
        ],
        correctAnswer: 1,
        explanation: "বিদ্যুৎ প্রবাহ বা কারেন্টের পরিমাপের আন্তর্জাতিক একক অ্যাম্পিয়ার (A)।"
      },
      {
        id: "elec-works-2",
        question: "বৈদ্যুতিক সার্কিটে কোনো পরিবাহীর রেজিস্ট্যান্স (রোধ) পরিমাপের জন্য কোন যন্ত্র ব্যবহৃত হয়?",
        options: [
          "ওহমমিটার (Ohmeter)",
          "ভোল্টমিটার (Voltmeter)",
          "অ্যামিটার (Ammeter)",
          "ওয়াটমিটার (Wattmeter)"
        ],
        correctAnswer: 0,
        explanation: "রোধ বা রেজিস্ট্যান্স পরিমাপের জন্য ওহমমিটার এবং কারেন্ট ও ভোল্টেজ একসাথে পরিমাপের জন্য মাল্টিমিটার ব্যবহৃত হয়।"
      },
      {
        id: "elec-works-3",
        question: "নিচের কোন উপাদানটি অতি উৎকৃষ্ট বিদ্যুৎ সুপরিবাহী পদার্থ হিসেবে সমাদৃত?",
        options: [
          "শুকনো কাঠ (Dry Wood)",
          "কাঁচ (Glass)",
          "তামা (Copper)",
          "রাবার (Rubber)"
        ],
        correctAnswer: 2,
        explanation: "তামা (Copper) ধাতুটি চমৎকার সুপরিবাহী এবং সহজে নমনীয় হওয়ায় বৈদ্যুতিক ক্যাবল ও কন্ডাক্টর হিসেবে সর্বাধিক ব্যবহৃত হয়।"
      }
    ]
  },
  {
    id: "fourth-ir",
    title: "চতুর্থ শিল্পবিপ্লব ও সাধারণ কারিগরি জ্ঞান",
    questions: [
      {
        id: "fourth-ir-1",
        question: "চতুর্থ শিল্পবিপ্লব (4th Industrial Revolution) এর মূল চালিকাশক্তি বা ভিত্তি কোনটি?",
        options: [
          "বাষ্পীয় ইঞ্জিন ও যান্ত্রিকীকরণ",
          "বিদ্যুৎ আবিষ্কার ও গণ-উৎপাদন",
          "কৃত্রিম বুদ্ধিমত্তা, আইওটি ও ক্লাউড কম্পিউটিং",
          "মুদ্রণ যন্ত্র ও সংবাদপত্র শিল্পের বিকাশ"
        ],
        correctAnswer: 2,
        explanation: "চতুর্থ শিল্পবিপ্লবের মূল ভিত্তি হলো সাইবার-ফিজিক্যাল সিস্টেম, এআই (AI), বিগ ডাটা, ক্লাউড কম্পিউটিং এবং আইওটি।"
      },
      {
        id: "fourth-ir-2",
        question: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) কত সালে রাষ্ট্রীয় আইন দ্বারা প্রতিষ্ঠিত হয়?",
        options: [
          "১৯৬৭ সালে",
          "১৯৭২ সালে",
          "১৯৮৫ সালে",
          "১৯৯৯ সালে"
        ],
        correctAnswer: 0,
        explanation: "১৯৬৭ সালের কারিগরি শিক্ষা বোর্ড আইন অনুযায়ী বাংলাদেশে কারিগরি শিক্ষার উন্নয়ন ও নিয়ন্ত্রণে এই স্বায়ত্তশাসিত বোর্ডটি গঠিত হয়।"
      }
    ]
  }
];

export function getSessionQuestions(quizId: string): LiveQuestionSnapshot[] {
  const targetId = String(quizId || "").trim().toLowerCase();

  // 1. Check preloaded trade quizzes
  const preloaded = PRELOADED_QUIZZES.find(q => String(q.id).toLowerCase() === targetId);
  if (preloaded) {
    return preloaded.questions.map(q => ({
      id: String(q.id),
      questionText: q.question,
      type: "mcq_single",
      options: q.options,
      timeLimit: 30, // 30s default
      correctAnswer: q.correctAnswer
    }));
  }

  // 2. Fetch standard quiz questions from DB (matching String)
  const dbQuestions = institutionalDb.quizQuestions
    ?.filter(qq => String(qq.quizId).toLowerCase() === targetId)
    .sort((a, b) => a.orderIndex - b.orderIndex) || [];

  if (dbQuestions.length > 0) {
    return dbQuestions.map(qq => {
      const snap = qq.questionSnapshot || {};
      const type = qq.questionType || "mcq_single";
      
      let options: string[] = [];
      let correctAnswer: any = null;

      if (type === "mcq_single" || type === "mcq_multiple" || type === "image_choice" || type === "poll") {
        options = snap.options || [];
        correctAnswer = snap.correctIndex !== undefined ? snap.correctIndex : snap.correctAnswers;
      } else if (type === "true_false") {
        options = ["সত্য (True)", "মিথ্যা (False)"];
        correctAnswer = snap.correctAnswer;
      } else if (type === "matching") {
        options = snap.pairs?.map((p: any) => `${p.left} ➔ ${p.right}`) || [];
        correctAnswer = snap.pairs;
      } else if (type === "ordering") {
        options = snap.items || [];
        correctAnswer = snap.correctOrder || snap.items;
      } else {
        options = [];
        correctAnswer = snap.correctAnswer || snap.answer;
      }

      return {
        id: String(qq.id),
        questionText: snap.questionText || (qq as any).questionText || "টেকনিক্যাল কুইজ প্রশ্ন",
        type,
        options: options.length > 0 ? options : ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
        questionData: snap,
        timeLimit: qq.timeLimit || 30,
        correctAnswer: correctAnswer ?? 0
      };
    });
  }

  // 3. Search in institutionalDb.quizzes for embedded questions
  const dbQuiz = institutionalDb.quizzes?.find(q => String(q.id).toLowerCase() === targetId);
  if (dbQuiz && (dbQuiz as any).questions && Array.isArray((dbQuiz as any).questions) && (dbQuiz as any).questions.length > 0) {
    return (dbQuiz as any).questions.map((q: any, idx: number) => ({
      id: String(q.id || `q-${idx}`),
      questionText: q.question || q.questionText || "টেকনিক্যাল প্রশ্ন",
      type: q.type || "mcq_single",
      options: q.options && q.options.length > 0 ? q.options : ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
      questionData: q,
      timeLimit: q.timeLimit || 30,
      correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0
    }));
  }

  // 4. Fallback: If quizQuestions exists in DB for any quiz
  if (institutionalDb.quizQuestions && institutionalDb.quizQuestions.length > 0) {
    const fallbackQuestions = institutionalDb.quizQuestions.slice(0, 10);
    return fallbackQuestions.map((qq) => {
      const snap = qq.questionSnapshot || {};
      return {
        id: String(qq.id),
        questionText: snap.questionText || "টেকনিক্যাল প্রশ্ন",
        type: qq.questionType || "mcq_single",
        options: snap.options || ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
        questionData: snap,
        timeLimit: qq.timeLimit || 30,
        correctAnswer: snap.correctIndex ?? 0
      };
    });
  }

  // 5. Ultimate Fallback to PRELOADED_QUIZZES[0]
  return PRELOADED_QUIZZES[0].questions.map(q => ({
    id: String(q.id),
    questionText: q.question,
    type: "mcq_single",
    options: q.options,
    timeLimit: 30,
    correctAnswer: q.correctAnswer
  }));
}
