import { GoogleGenAI } from "@google/genai";
import { generateWithFailover, GenerationOptions } from "./aiFailoverPipeline";
import { getEnabledProviders } from "./aiConfigStore";
import { safeParseAiQuestions } from "./safeJsonParser";

export interface BtebQuizQuestion {
  id: string | number;
  type?: "mcq_single" | "mcq_multiple" | "true_false" | "matching" | "ordering" | "fill_blank" | "short_answer" | "image_choice" | "poll";
  question: string;
  options?: string[];
  correctAnswer?: number | boolean; // index for MCQ single, or boolean for True/False
  correctIndices?: number[]; // for MCQ multiple
  pairs?: { left: string; right: string }[]; // for matching
  items?: string[]; // for ordering
  acceptedAnswers?: string[]; // for fill in the blanks
  caseSensitive?: boolean;
  expectedAnswerKeyword?: string; // for short answer
  explanation: string;
  timeLimit?: number; // 20 to 60 seconds
  difficulty?: "Easy" | "Medium" | "Hard";
  trade?: string;
  topic?: string;
  points?: number;
  questionData?: any;
}

export interface QuizAiGeneratorParams {
  trade: string;
  gradeLevel: string; // e.g. "Class 9", "Class 10", "SSC Vocational", "HSC Vocational"
  topic: string;
  subjectCode?: string;
  questionCount?: number; // default: 5, supports exact counts (5, 10, 20, up to 30)
  difficulty?: "Easy" | "Medium" | "Hard" | "Mixed";
  language?: "Bangla" | "English" | "Bilingual";
  questionType?: "mcq_single" | "mcq_multiple" | "matching" | "fill_blank" | "true_false" | "short_answer" | "ordering" | "mixed";
  customInstructions?: string;
  referencePdfTitle?: string;
  referencePdfId?: string;
  referenceText?: string;
  bloomLevel?: "Knowledge" | "Comprehension" | "Application" | "Analysis" | "Mixed";
}

export interface QuizAiGeneratorResult {
  success: boolean;
  questions: BtebQuizQuestion[];
  isFallback: boolean;
  message: string;
  provider: "gemini_ai" | "bteb_offline_engine";
  modelUsed?: string;
  timestamp: string;
}

// BTEB Comprehensive Mock Questions for Offline & Quota Fallback
const BTEB_PREVIEW_QUESTION_SETS: Record<string, BtebQuizQuestion[]> = {
  it_support: [
    {
      id: "it-1",
      question: "কম্পিউটার নেটওয়ার্কে ক্লাস-সি (Class C) আইপি অ্যাড্রেসের ডিফল্ট সাবনেট মাস্ক কোনটি?",
      options: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.255"],
      correctAnswer: 2,
      explanation: "ক্লাস-সি নেটওয়ার্কে প্রথম ২৪ বিট নেটওয়ার্ক আইডি এবং শেষ ৮ বিট হোস্ট আইডির জন্য নির্ধারিত, তাই ডিফল্ট সাবনেট মাস্ক ২৫৫.২৫৫.২৫৫.০।",
      timeLimit: 30,
      difficulty: "Medium",
      trade: "IT Support & IoT",
      topic: "কম্পিউটার নেটওয়ার্কিং",
      points: 100
    },
    {
      id: "it-2",
      question: "মাদারবোর্ডে প্রসেসর এবং র্যামের (RAM) মধ্যে অত্যন্ত দ্রুতগতির ডেটা আদান-প্রদানে ব্যবহৃত হয় কোন বাস?",
      options: ["PCI Bus", "Front Side Bus (FSB)", "USB Bus", "SATA Bus"],
      correctAnswer: 1,
      explanation: "Front Side Bus (FSB) সিপিইউ কোর ও নর্থব্রিজের মাধ্যমে প্রধান মেমোরির মধ্যে সরাসরি হাই-স্পিড চ্যানেল সরবরাহ করে।",
      timeLimit: 30,
      difficulty: "Medium",
      trade: "IT Support & IoT",
      topic: "কম্পিউটার হার্ডওয়্যার",
      points: 100
    },
    {
      id: "it-3",
      question: "IoT সিস্টেমে লো-পাওয়ার ও দূরপাল্লার ওয়্যারলেস ডেটা প্রেরণে সর্বাধিক ব্যবহৃত প্রযুক্তি কোনটি?",
      options: ["Bluetooth Low Energy (BLE)", "LoRaWAN", "Ethernet Cat6", "NFC"],
      correctAnswer: 1,
      explanation: "LoRaWAN হলো লং রেঞ্জ লো-পাওয়ার ওয়াইড এরিয়া নেটওয়ার্কিং প্রোটোকল, যা ১০-১৫ কিমি পর্যন্ত কম ব্যাটারিতে কাজ করে।",
      timeLimit: 35,
      difficulty: "Hard",
      trade: "IT Support & IoT",
      topic: "আইওটি ও সেন্সর",
      points: 120
    },
    {
      id: "it-4",
      question: "অপারেটিং সিস্টেমে ডেডলক (Deadlock) প্রতিরোধের অন্যতম কার্যকর শর্ত কোনটি?",
      options: ["Mutual Exclusion দূর করা", "Hold and Wait অনুমোদন করা", "Circular Wait সৃষ্টি করা", "Non-preemption বজায় রাখা"],
      correctAnswer: 0,
      explanation: "কফম্যানের চারটি শর্তের যেকোনো একটি (যেমন মিউচুয়াল এক্সক্লুশন বা হোল্ড অ্যান্ড ওয়েট) ভঙ্গ করলে ডেডলক প্রতিরোধ করা যায়।",
      timeLimit: 40,
      difficulty: "Hard",
      trade: "IT Support & IoT",
      topic: "অপারেটিং সিস্টেম",
      points: 120
    },
    {
      id: "it-5",
      question: "আরজে-৪৫ (RJ-45) কানেক্টরে T568B স্ট্যান্ডার্ড অনুযায়ী ১ ও ২ নম্বর পিনের তারের রং কী হয়?",
      options: ["হোয়াইট-গ্রিন ও গ্রিন", "হোয়াইট-অরেঞ্জ ও অরেঞ্জ", "হোয়াইট-ব্লু ও ব্লু", "হোয়াইট-ব্রাউন ও ব্রাউন"],
      correctAnswer: 1,
      explanation: "T568B স্ট্যান্ডার্ড কালার কোড হলো: ১. হোয়াইট-অরেঞ্জ, ২. অরেঞ্জ, ৩. হোয়াইট-গ্রিন, ৪. ব্লু, ৫. হোয়াইট-ব্লু, ৬. গ্রিন, ৭. হোয়াইট-ব্রাউন, ৮. ব্রাউন।",
      timeLimit: 30,
      difficulty: "Easy",
      trade: "IT Support & IoT",
      topic: "ক্যাবলিং ও কানেক্টিভিটি",
      points: 80
    },
    {
      id: "it-6",
      question: "ওয়েব সার্ভারে সুরক্ষিত ডেটা স্থানান্তরের জন্য ব্যবহৃত প্রোটোকল এবং ডিফল্ট পোর্ট নম্বর কোনটি?",
      options: ["HTTP (Port 80)", "FTP (Port 21)", "HTTPS (Port 443)", "SSH (Port 22)"],
      correctAnswer: 2,
      explanation: "HTTPS প্রোটোকল TLS/SSL এনক্রিপশন ব্যবহার করে পোর্ট ৪৪৩-এ নিরাপদ ব্রাউজিং সংযোগ প্রদান করে।",
      timeLimit: 25,
      difficulty: "Easy",
      trade: "IT Support & IoT",
      topic: "ওয়েব ও ক্লাউড প্রযুক্তি",
      points: 80
    }
  ],
  electrical: [
    {
      id: "elec-1",
      question: "ওহমের সূত্র (Ohm's Law) নিচের কোন সার্কিট উপাদানের ক্ষেত্রে প্রযোজ্য নয়?",
      options: ["কার্বন রেজিস্টর", "মেটাল কন্ডাক্টর", "সেমিকন্ডাক্টর ডায়োড", "কপার ওয়্যার"],
      correctAnswer: 2,
      explanation: "ওহমের সূত্র কেবল রৈখিক (Linear) কন্ডাক্টরের জন্য প্রযোজ্য; সেমিকন্ডাক্টর ডায়োড ও ট্রানজিস্টর হলো নন-লিনিয়ার ডিভাইস।",
      timeLimit: 30,
      difficulty: "Medium",
      trade: "Electrical Installation",
      topic: "ওহমের সূত্র ও সার্কিট",
      points: 100
    },
    {
      id: "elec-2",
      question: "একটি স্টেপ-ডাউন ট্রান্সফরমারে প্রাথমিক ও মাধ্যমিক কয়েলের সাথে সম্পর্ক কোনটি সঠিক?",
      options: ["Np > Ns এবং Vp < Vs", "Np > Ns এবং Vp > Vs", "Np < Ns এবং Vp > Vs", "Np = Ns এবং Vp = Vs"],
      correctAnswer: 1,
      explanation: "স্টেপ-ডাউন ট্রান্সফরমারে প্রাইমারি প্যাঁচ সংখ্যা (Np) সেকেন্ডারি (Ns) এর চেয়ে বেশি থাকে, ফলে ভোল্টেজ হ্রাস পায় (Vp > Vs)।",
      timeLimit: 35,
      difficulty: "Medium",
      trade: "Electrical Installation",
      topic: "ট্রান্সফরমার",
      points: 100
    },
    {
      id: "elec-3",
      question: "আবাসিক ভবনে বিদ্যুৎস্পৃষ্ট হওয়া থেকে মানবজীবন রক্ষার জন্য কোন সুরক্ষামূলক ব্রেকার বাধ্যতামূলক?",
      options: ["MCB (Miniature Circuit Breaker)", "MCCB (Molded Case)", "RCCB / ELCB (Earth Leakage)", "HRC Fuse"],
      correctAnswer: 2,
      explanation: "RCCB/ELCB ৩০ মিলি-অ্যাম্পিয়ারের সামান্য আর্থ লিকেজ কারেন্ট শনাক্ত করলেই মিলিসেকেন্ডে সার্কিট ট্রিপ করে জীবন রক্ষা করে।",
      timeLimit: 25,
      difficulty: "Easy",
      trade: "Electrical Installation",
      topic: "হাউজ ওয়্যারিং ও নিরাপত্তা",
      points: 80
    },
    {
      id: "elec-4",
      question: "একটি থ্রি-ফেজ মোটরের সিনক্রোনাস স্পিড (Ns) নির্ণয়ের সঠিক সূত্র কোনটি?",
      options: ["Ns = 120 * f / P", "Ns = 120 * P / f", "Ns = 60 * f / P", "Ns = 60 * P / f"],
      correctAnswer: 0,
      explanation: "সিনক্রোনাস গতি Ns = (১২০ * ফ্রিকোয়েন্সি) / পোল সংখ্যা (P)। যেখানে ফ্রিকোয়েন্সি f হার্টজে এবং গতি RPM এ হিসাব হয়।",
      timeLimit: 30,
      difficulty: "Medium",
      trade: "Electrical Installation",
      topic: "এসি মোটর ও ড্রাইভ",
      points: 100
    },
    {
      id: "elec-5",
      question: "একটি এসি সার্কিটে পাওয়ার ফ্যাক্টরের (Power Factor) মান শূন্য হলে সক্রিয় ক্ষমতা (Real Power) কত হবে?",
      options: ["সর্বোচ্চ (Maximum)", "অসীম (Infinite)", "শূন্য (Zero)", "৫০ শতাংশ"],
      correctAnswer: 2,
      explanation: "সক্রিয় ক্ষমতা P = VI cos(θ); পাওয়ার ফ্যাক্টর cos(θ) = ০ হলে মোট সক্রিয় পাওয়ার খরচ শূন্য ওয়াট হয়।",
      timeLimit: 30,
      difficulty: "Hard",
      trade: "Electrical Installation",
      topic: "পাওয়ার ফ্যাক্টর ও গ্রিড",
      points: 120
    }
  ],
  civil: [
    {
      id: "civ-1",
      question: "স্ট্যান্ডার্ড বিটিইবি কোড অনুযায়ী সাধারণ আরসিসি (RCC) ঢালাইয়ের ক্ষেত্রে সিমেন্ট, বালি ও খোয়ার আদর্শ অনুপাত কোনটি?",
      options: ["১ : ১ : ২", "১ : ১.৫ : ৩", "১ : ২ : ৪", "১ : ৩ : ৬"],
      correctAnswer: 1,
      explanation: "সাধারণ আবাসিক ছাদ ও বিমের আরসিসি কংক্রিট ঢালাইয়ে এম-২০ গ্রেডের সমতুল্য ১ : ১.৫ : ৩ অনুপাত সবচেয়ে বেশি ব্যবহৃত ও টেকসই।",
      timeLimit: 25,
      difficulty: "Easy",
      trade: "Civil Drafting & Construction",
      topic: "আরসিসি ডিজাইন ও নির্মাণ",
      points: 80
    },
    {
      id: "civ-2",
      question: "সিমেন্টের প্রাথমিক জমাটবদ্ধতা সময় (Initial Setting Time) সর্বনিম্ন কত মিনিট হওয়া আবশ্যক?",
      options: ["১৫ মিনিট", "৩০ মিনিট", "৬০ মিনিট", "৬০০ মিনিট"],
      correctAnswer: 1,
      explanation: "স্ট্যান্ডার্ড পোর্টল্যান্ড সিমেন্টের প্রাথমিক সেটিং টাইম কমপক্ষে ৩০ মিনিট এবং চূড়ান্ত সেটিং টাইম সর্বোচ্চ ১০ ঘণ্টা (৬০০ মিনিট)।",
      timeLimit: 25,
      difficulty: "Easy",
      trade: "Civil Drafting & Construction",
      topic: "বিল্ডিং ম্যাটেরিয়ালস",
      points: 80
    },
    {
      id: "civ-3",
      question: "থিওডোলাইট দিয়ে মূলত কোন ধরনের পরিমাপ সূক্ষ্মভাবে সম্পন্ন করা হয়?",
      options: ["শুধুমাত্র অনুভূমিক কোণ", "শুধুমাত্র উল্লম্ব কোণ", "অনুভূমিক ও উল্লম্ব উভয় কোণ", "ভূগর্ভস্থ পানির চাপ"],
      correctAnswer: 2,
      explanation: "থিওডোলাইট হলো একটি অপটিক্যাল জরিপ যন্ত্র যা একই সাথে সুনির্দিষ্ট আনুভূমিক (Horizontal) ও উল্লম্ব (Vertical) কোণ পরিমাপ করে।",
      timeLimit: 30,
      difficulty: "Medium",
      trade: "Civil Drafting & Construction",
      topic: "সার্ভে ও লেভেলিং",
      points: 100
    },
    {
      id: "civ-4",
      question: "কংক্রিটের স্লাম্প টেস্ট (Slump Test) দ্বারা মূলত কী পরিমাপ করা হয়?",
      options: ["কংক্রিটের কম্প্রেসিভ স্ট্রেন্থ", "কংক্রিটের কার্যোপযোগিতা (Workability)", "জমাট বাঁধার দ্রুততা", "বালির আর্দ্রতার পরিমাণ"],
      correctAnswer: 1,
      explanation: "স্লাম্প টেস্টের মাধ্যমে তাজা কংক্রিটের ঘনত্ব, প্রবাহমানতা এবং কার্যকর কর্মক্ষমতা (Workability) যাচাই করা হয়।",
      timeLimit: 30,
      difficulty: "Medium",
      trade: "Civil Drafting & Construction",
      topic: "কংক্রিট প্রযুক্তি",
      points: 100
    },
    {
      id: "civ-5",
      question: "কলামের টাই-রড (Ties / Stirrups) ব্যবহারের প্রধান উদ্দেশ্য কোনটি?",
      options: ["কলামের উচ্চতা বৃদ্ধি", "প্রধান রডকে সঠিক অবস্থানে ধরে রাখা ও শিয়ার বল প্রতিরোধ", "সিমেন্টের সাশ্রয় করা", "পানি শোষণ রোধ করা"],
      correctAnswer: 1,
      explanation: "টাই রড কলামের প্রধান লংগিটিউডিনাল বারকে বাকলিং (Buckling) হতে রক্ষা করে এবং পার্শ্ববর্তী শিয়ার লোড বহন করে।",
      timeLimit: 35,
      difficulty: "Hard",
      trade: "Civil Drafting & Construction",
      topic: "স্ট্রাকচারাল মেকানিক্স",
      points: 120
    }
  ],
  automotive: [
    {
      id: "auto-1",
      question: "ফোর-স্ট্রোক আইসি (IC) ইঞ্জিনের ক্র্যাঙ্কশ্যাফট কয় বার ঘুরলে একটি পূর্ণ শক্তি চক্র সম্পন্ন হয়?",
      options: ["১ বার (৩৬০°)", "২ বার (৭২০°)", "৩ বার (১০৮০°)", "৪ বার (১৪৪০°)"],
      correctAnswer: 1,
      explanation: "ফোর-স্ট্রোক ইঞ্জিনে চারটি স্ট্রোক (সাকশন, কম্প্রেশন, পাওয়ার, এক্সহস্ট) সম্পন্ন হতে ক্র্যাঙ্কশ্যাফট ২ বার বা ৭২০ ডিগ্রি ঘোরে।",
      timeLimit: 30,
      difficulty: "Easy",
      trade: "Automotive & Mechanical",
      topic: "ইঞ্জিন ফান্ডামেন্টাল",
      points: 80
    },
    {
      id: "auto-2",
      question: "ডিজেল ইঞ্জিনে সিলিন্ডারের ভেতরে জ্বালানি প্রজ্বলন (Ignition) কীভাবে ঘটে?",
      options: ["স্পার্ক প্লাগের স্ফুলিঙ্গে", "উচ্চ চাপে উত্তপ্ত বাতাসের তাপে", "ব্যাটারির সরাসরি কারেন্টে", "কার্বুরেটরের মিশ্রণে"],
      correctAnswer: 1,
      explanation: "ডিজেল ইঞ্জিনে বাতাসকে উচ্চ অনুপাতে সংকুচিত করে প্রচণ্ড উত্তপ্ত করা হয়, এরপর ডিজেল স্প্রে করলেই স্বতঃস্ফূর্তভাবে আগুন ধরে।",
      timeLimit: 30,
      difficulty: "Medium",
      trade: "Automotive & Mechanical",
      topic: "ডিজেল ও পেট্রোল ইঞ্জিন",
      points: 100
    },
    {
      id: "auto-3",
      question: "গাড়ির অ্যান্টি-লক ব্রেকিং সিস্টেমের (ABS) মূল সুবিধা কোনটি?",
      options: ["ইঞ্জিন দ্রুত স্টার্ট হওয়া", "জরুরি ব্রেকিংয়ে চাকা লক হওয়া রোধ করে স্টিয়ারিং নিয়ন্ত্রণ রাখা", "জ্বালানি খরচ অর্ধেক কমানো", "হর্নের শব্দ বাড়ানো"],
      correctAnswer: 1,
      explanation: "ABS সিস্টেম ভেজা বা পিচ্ছিল রাস্তায় হঠাৎ ব্রেক কষলে চাকা যাতে স্কিড করে পুরোপুরি লক না হয় তা সেন্সরের মাধ্যমে সেকেন্ডে বহুবার মডুলেট করে।",
      timeLimit: 30,
      difficulty: "Medium",
      trade: "Automotive & Mechanical",
      topic: "ব্রেকিং ও সাসপেনশন",
      points: 100
    },
    {
      id: "auto-4",
      question: "ইঞ্জিন অয়েলের ভিস্কোসিটি রেটিং 'SAE 20W-50' এ 'W' অক্ষরটি কী নির্দেশ করে?",
      options: ["Weight (ওজন)", "Winter (শীতকালীন সান্দ্রতা)", "Watt (শক্তি)", "Waterproof (জলরোধী)"],
      correctAnswer: 1,
      explanation: "SAE রেটিংয়ে 'W' মানে হলো 'Winter', যা কম তাপমাত্রায় তেল জমে না গিয়ে কতটা সহজে প্রবাহিত হতে পারে তা প্রকাশ করে।",
      timeLimit: 25,
      difficulty: "Easy",
      trade: "Automotive & Mechanical",
      topic: "লুব্রিকেশন ও কুলিং",
      points: 80
    },
    {
      id: "auto-5",
      question: "অটোমোবাইল ট্রান্সমিশনে ডিফারেনশিয়ালের (Differential) প্রধান কাজ কী?",
      options: ["ইঞ্জিন ঠান্ডা রাখা", "বাঁক নেওয়ার সময় পেছনের দুই চাকাকে ভিন্ন গতিতে ঘুরতে সাহায্য করা", "ব্যাটারি রিচার্জ করা", "গিয়ার অয়েল ফিল্টার করা"],
      correctAnswer: 1,
      explanation: "গাড়ি যখন মোড় ঘোরে তখন বাইরের চাকাটিকে ভেতরের চাকার চেয়ে দীর্ঘ পথ অতিক্রম করতে হয়, ডিফারেনশিয়াল গিয়ারের মাধ্যমে উভয় চাকায় গতি সমন্বয় করে।",
      timeLimit: 35,
      difficulty: "Hard",
      trade: "Automotive & Mechanical",
      topic: "পাওয়ার ট্রেন ও গিয়ারবক্স",
      points: 120
    }
  ],
  rac: [
    {
      id: "rac-1",
      question: "ভ্যাপার কম্প্রেশন রেফ্রিজারেশন সাইকেলে কোন যন্ত্রাংশ তরল রেফ্রিজারেন্টের চাপ ও তাপমাত্রা নাটকীয়ভাবে হ্রাস করে?",
      options: ["কম্প্রেসর", "কনডেন্সার", "এক্সপ্যানশন ভালভ / ক্যাপিলারি টিউব", "ইভাপোরেটর"],
      correctAnswer: 2,
      explanation: "ক্যাপিলারি টিউব বা থার্মোস্ট্যাটিক এক্সপ্যানশন ভালভ হাই-প্রেসার তরলকে সংকুচিত পথ দিয়ে চালনা করে নিম্ন চাপ ও তাপমাত্রার তরলে পরিণত করে।",
      timeLimit: 30,
      difficulty: "Medium",
      trade: "Refrigeration & AC",
      topic: "রেফ্রিজারেশন সাইকেল",
      points: 100
    },
    {
      id: "rac-2",
      question: "বর্তমানে পরিবেশবান্ধব এয়ার কন্ডিশনারে ওজোন ক্ষয়রোধে কোন রেফ্রিজারেন্ট গ্যাস সর্বাধিক ব্যবহৃত হচ্ছে?",
      options: ["R-11", "R-12", "R-22", "R-32 ও R-410A"],
      correctAnswer: 3,
      explanation: "R-32 এবং R-410A হলো হাইড্রোফ্লুরোকার্বন (HFC) যা ওজোন স্তরের কোনো ক্ষতি করে না (Zero ODP) এবং উচ্চ দক্ষতা প্রদান করে।",
      timeLimit: 30,
      difficulty: "Easy",
      trade: "Refrigeration & AC",
      topic: "রেফ্রিজারেন্ট ও পরিবেশ",
      points: 80
    },
    {
      id: "rac-3",
      question: "রেফ্রিজারেটরের ইভাপোরেটর কয়েলে অত্যধিক বরফ (Frost) জমে বাতাস চলাচলে বাধা দিলে কোন অংশ পরীক্ষা করা উচিত?",
      options: ["ডিফ্রস্ট থার্মোস্ট্যাট ও হিটার", "কনডেন্সার ফ্যান", "রানিং ক্যাপাসিটর", "ড্রায়ার ফিল্টার"],
      correctAnswer: 0,
      explanation: "ফ্রস্ট-ফ্রি রেফ্রিজারেটরে ডিফ্রস্ট টাইমার বা ডিফ্রস্ট বায়োমেটাল হিটার বিকল হলে নিয়মিত বরফ গলানো সম্ভব হয় না।",
      timeLimit: 35,
      difficulty: "Hard",
      trade: "Refrigeration & AC",
      topic: "ট্রাবলশুটিং ও ইলেকট্রিক্যাল কন্ট্রোল",
      points: 120
    }
  ],
  general: [
    {
      id: "gen-1",
      question: "ভার্নিয়ার ক্যালিপার্সের ভার্নিয়ার ধ্রুবক (Vernier Constant) নির্ণয়ের সঠিক সূত্র কোনটি?",
      options: ["VC = ১ প্রধান স্কেল ভাগ / মোট ভার্নিয়ার ভাগ", "VC = ১ প্রধান স্কেল ভাগ - ১ ভার্নিয়ার স্কেল ভাগ", "VC = পিচ / বৃত্তাকার স্কেলের ভাগ", "VC = মোট দৈর্ঘ্য * ওজন"],
      correctAnswer: 1,
      explanation: "ভার্নিয়ার ধ্রুবক হলো প্রধান স্কেলের ক্ষুদ্রতম এক ভাগ এবং ভার্নিয়ার স্কেলের এক ভাগের দৈর্ঘ্যের পার্থক্য (1 MSD - 1 VSD)।",
      timeLimit: 30,
      difficulty: "Medium",
      trade: "General Science & Math",
      topic: "পরিমাপ ও পদার্থবিজ্ঞান",
      points: 100
    },
    {
      id: "gen-2",
      question: "একটি বৈদ্যুতিক হিটারের ক্ষমতা ১০০০ ওয়াট, এটি দৈনিক ২ ঘণ্টা করে ৩০ দিন চললে মোট বিদ্যুৎ খরচ কত ইউনিট (kWh)?",
      options: ["৩০ ইউনিট", "৬০ ইউনিট", "১২০ ইউনিট", "৬০০ ইউনিট"],
      correctAnswer: 1,
      explanation: "মোট শক্তি = (১০০০ W * ২ ঘণ্টা * ৩০ দিন) / ১০০০ = ৬০ কিলোওয়াট-ঘণ্টা বা ৬০ ইউনিট।",
      timeLimit: 35,
      difficulty: "Medium",
      trade: "General Science & Math",
      topic: "কারিগরি বিজ্ঞান ও ফলিত গণিত",
      points: 100
    }
  ]
};

/**
 * Normalizes user trade string to match bank category
 */
function normalizeTradeKey(trade: string): string {
  const t = (trade || "").toLowerCase();
  if (t.includes("it") || t.includes("computer") || t.includes("আইটি") || t.includes("কম্পিউটার")) return "it_support";
  if (t.includes("elec") || t.includes("ইলেকট্রিক")) return "electrical";
  if (t.includes("civ") || t.includes("ড্রাফটিং") || t.includes("সিভিল")) return "civil";
  if (t.includes("auto") || t.includes("মেকানিক") || t.includes("অটো")) return "automotive";
  if (t.includes("rac") || t.includes("ref") || t.includes("এসি") || t.includes("শীতাতপ")) return "rac";
  return "general";
}

/**
 * Generate preview-safe fallback questions if Gemini API is offline, throttled, or missing
 */
export function getOfflineMockQuestions(params: QuizAiGeneratorParams): BtebQuizQuestion[] {
  const key = normalizeTradeKey(params.trade);
  const pool = [...(BTEB_PREVIEW_QUESTION_SETS[key] || []), ...BTEB_PREVIEW_QUESTION_SETS.general];
  
  // Filter or match topic if available
  let matched = pool;
  if (params.topic && params.topic.trim()) {
    const qTopic = params.topic.toLowerCase();
    const specific = pool.filter(q => 
      (q.topic && q.topic.toLowerCase().includes(qTopic)) ||
      q.question.toLowerCase().includes(qTopic)
    );
    if (specific.length >= 3) {
      matched = specific;
    }
  }

  // Desired count
  const count = Math.min(Math.max(params.questionCount || 5, 1), 30);
  const result: BtebQuizQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const base = matched[i % matched.length];
    const qType = params.questionType;

    if (qType === "matching") {
      result.push({
        id: `mock-matching-${key}-${Date.now()}-${i + 1}`,
        type: "matching",
        question: `${params.topic || base.topic || params.trade}: বাম পাশের সাথে ডান পাশের সঠিক তথ্য মিলকরণ করো`,
        pairs: [
          { left: `বাম আইটেম ১ (${base.options?.[0]?.slice(0, 20) || "ক"})`, right: "সংশ্লিষ্ট সঠিক বিবরণ বা কাজ ১" },
          { left: `বাম আইটেম ২ (${base.options?.[1]?.slice(0, 20) || "খ"})`, right: "সংশ্লিষ্ট সঠিক বিবরণ বা কাজ ২" },
          { left: `বাম আইটেম ৩ (${base.options?.[2]?.slice(0, 20) || "গ"})`, right: "সংশ্লিষ্ট সঠিক বিবরণ বা কাজ ৩" },
          { left: `বাম আইটেম ৪ (${base.options?.[3]?.slice(0, 20) || "ঘ"})`, right: "সংশ্লিষ্ট সঠিক বিবরণ বা কাজ ৪" },
        ],
        explanation: base.explanation || "কারিগরি পাঠ্যসূচি অনুযায়ী ডান-বাম জোড়া মিলকরণ সম্পন্ন হয়েছে।",
        timeLimit: 45,
        difficulty: (params.difficulty && params.difficulty !== "Mixed") ? params.difficulty : "Medium",
        trade: params.trade || base.trade,
        topic: params.topic || base.topic,
      });
    } else if (qType === "true_false") {
      const isTrue = i % 2 === 0;
      result.push({
        id: `mock-tf-${key}-${Date.now()}-${i + 1}`,
        type: "true_false",
        question: `নিচের বক্তব্যটি বিবেচনা করো: "${base.question.replace(/\?$/, "")}" — এটি সত্য নাকি মিথ্যা?`,
        correctAnswer: isTrue,
        explanation: base.explanation,
        timeLimit: 25,
        difficulty: (params.difficulty && params.difficulty !== "Mixed") ? params.difficulty : base.difficulty,
        trade: params.trade || base.trade,
        topic: params.topic || base.topic,
      });
    } else if (qType === "fill_blank") {
      const correctText = base.options?.[typeof base.correctAnswer === "number" ? base.correctAnswer : 0] || "মূল তথ্য";
      result.push({
        id: `mock-fill-${key}-${Date.now()}-${i + 1}`,
        type: "fill_blank",
        question: `${base.question.replace(/\?$/, "")} এর ক্ষেত্রে সঠিক উত্তর হলো ___।`,
        acceptedAnswers: [correctText, correctText.toLowerCase()],
        explanation: base.explanation,
        timeLimit: 30,
        difficulty: (params.difficulty && params.difficulty !== "Mixed") ? params.difficulty : base.difficulty,
        trade: params.trade || base.trade,
        topic: params.topic || base.topic,
      });
    } else if (qType === "ordering") {
      result.push({
        id: `mock-order-${key}-${Date.now()}-${i + 1}`,
        type: "ordering",
        question: `${params.topic || base.topic || params.trade}: সঠিক কর্মপদ্ধতির ধাপগুলো ধারাবাহিকভাবে সাজাও`,
        items: [
          "ধাপ ১: প্রাথমিক নিরাপত্তা ও প্রস্তুতি গ্রহণ",
          "ধাপ ২: সরঞ্জাম ও সার্কিট সংযোগ পরীক্ষা",
          "ধাপ ৩: মূল কারিগরি প্রক্রিয়া বা পরিমাপ সম্পন্নকরণ",
          "ধাপ ৪: ফলাফল যাচাই ও সংযোগ বিচ্ছিন্নকরণ"
        ],
        explanation: "কারিগরি মানদণ্ড অনুযায়ী ধারাবাহিক কার্যপ্রণালী。",
        timeLimit: 45,
        difficulty: (params.difficulty && params.difficulty !== "Mixed") ? params.difficulty : "Medium",
        trade: params.trade || base.trade,
        topic: params.topic || base.topic,
      });
    } else {
      // Clone and provide unique id with index
      result.push({
        ...base,
        type: "mcq_single",
        id: `mock-${key}-${Date.now()}-${i + 1}`,
        trade: params.trade || base.trade,
        topic: params.topic || base.topic,
        difficulty: (params.difficulty && params.difficulty !== "Mixed") ? params.difficulty : base.difficulty
      });
    }
  }

  return result;
}

/**
 * Main AI Quiz Generator Engine using Google GenAI SDK with graceful offline fallback
 */
export async function generateBtebQuizQuestions(
  params: QuizAiGeneratorParams
): Promise<QuizAiGeneratorResult> {
  const count = Math.min(Math.max(params.questionCount || 5, 1), 30);
  
  const providers = getEnabledProviders();

  // If no providers enabled, use offline fallback
  if (providers.length === 0) {
    const fallbackQuestions = getOfflineMockQuestions(params);
    return {
      success: true,
      questions: fallbackQuestions,
      isFallback: true,
      message: "কোনো AI প্রোভাইডার কনফিগার করা নেই। বিটিইবি অফলাইন স্ট্যান্ডার্ড প্রশ্নব্যাংক থেকে প্রস্তুত করা হয়েছে।",
      provider: "bteb_offline_engine",
      timestamp: new Date().toISOString()
    };
  }

  const qType = params.questionType || "mcq_single";
  let typeDescription = "বহুনির্বাচনী প্রশ্ন (MCQ - 4 options with single correctIndex)";
  if (qType === "matching") {
    typeDescription = "বাম-ডান মিলকরণ প্রশ্ন (Matching - pairs array with left and right texts, minimum 3 to 4 pairs)";
  } else if (qType === "fill_blank") {
    typeDescription = "শূন্যস্থান পূরণ প্রশ্ন (Fill in the blanks - question with '___' placeholder and acceptedAnswers array of strings)";
  } else if (qType === "true_false") {
    typeDescription = "সত্য / মিথ্যা প্রশ্ন (True/False - statement with correctAnswer boolean true/false)";
  } else if (qType === "short_answer") {
    typeDescription = "সংক্ষিপ্ত প্রশ্ন (Short Answer - question with expectedAnswerKeyword and model explanation)";
  } else if (qType === "ordering") {
    typeDescription = "ক্রম বিন্যাস প্রশ্ন (Ordering - items array in correct step-by-step sequence)";
  } else if (qType === "mixed") {
    typeDescription = "মিশ্র প্রশ্ন সেট (Mixed question set: MCQ, Matching pairs, Fill in blanks, True/False, and Short answer questions)";
  }

  const langPrompt =
    params.language === "English"
      ? "Language: Standard English with clear technical terminology."
      : params.language === "Bilingual"
      ? "Language: Bilingual (প্রশ্ন বাংলায় সাথে বন্ধনীতে ইংরেজি টেকনিক্যাল টার্ম এবং অপশনগুলো দ্বিভাষিক)।"
      : "Language: প্রমিত কারিগরি বাংলা (বাংলা বর্ণনার সাথে বহুল প্রচলিত টেকনিক্যাল টার্ম)।";

  const systemPrompt = `তুমি বাংলাদেশ কারিগরি শিক্ষা বোর্ডের (BTEB) একজন অভিজ্ঞ চিফ এক্সাম কন্ট্রোলার ও টেকনিক্যাল কারিকুলাম বিশেষজ্ঞ।`;
  
  const userPrompt = `নিচের স্পেসিফিকেশন অনুযায়ী কারিগরি শিক্ষার্থীদের জন্য সর্বোচ্চ মানের প্রশ্ন প্রস্তুত করো:

- ট্রেড / প্রযুক্তি: ${params.trade}
- শ্রেণী / শিক্ষাবর্ষ: ${params.gradeLevel || "Class 10 / SSC Vocational"}
- অধ্যায় / মূল টপিক: ${params.topic}
${params.subjectCode ? `- বিষয় কোড: ${params.subjectCode}` : ""}
- প্রশ্নের সংখ্যা: সঠিক ঠিক ${count} টি (Exact Count: ${count})
- প্রশ্নের ধরন: ${typeDescription} (type key: "${qType}")
- কাঠিন্য স্তর (Difficulty): ${params.difficulty || "Mixed"}
${params.bloomLevel ? `- কগনিティブ লেভেল (Bloom's Taxonomy): ${params.bloomLevel}` : ""}
${params.referencePdfTitle ? `- রেফারেন্স পাঠ্যপুস্তক / সিলেবাস পিডিএফ: ${params.referencePdfTitle}` : ""}
${params.referenceText ? `- সিলেবাসের রেফারেন্স টেক্সট:\n"""\n${params.referenceText.slice(0, 1500)}\n"""` : ""}
- ভাষা নির্দেশিকা: ${langPrompt}
${params.customInstructions ? `- অতিরিক্ত নির্দেশনা: ${params.customInstructions}` : ""}

কঠোর আউটপুট নির্দেশনা:
১. ${langPrompt}
২. প্রতিটি প্রশ্নের ধরন (type) নির্ধারণ করবে: "mcq_single", "mcq_multiple", "matching", "fill_blank", "true_false", "short_answer", অথবা "ordering"।
৩. টাইপ অনুযায়ী সঠিক ফিল্ড অন্তর্ভুক্ত করবে:
   - mcq_single: options (৪টি অপশন), correctAnswer (০-ভিত্তিক সূচক), explanation
   - matching: pairs (যেমন [{"left": "ওহমের সূত্র", "right": "V = IR"}, {"left": "পাওয়ার", "right": "P = VI"}]), explanation
   - fill_blank: question-এ '___' ব্ল্যাঙ্ক থাকবে, acceptedAnswers (যেমন ["ওহম", "Ohm", "Ω"]), explanation
   - true_false: correctAnswer (true অথবা false), explanation
   - short_answer: expectedAnswerKeyword (মূল কি-ওয়ার্ড), explanation (আদর্শ উত্তর)
   - ordering: items (সঠিক ক্রমানুসারে সাজানো ধাপসমূহ)
৪. সময় সীমা (timeLimit): প্রশ্নভেদে ২০ থেকে ৪৫ সেকেন্ডের মধ্যে হবে।
৫. আউটপুট অবশ্যই কেবল একটি বৈধ ও বিশুদ্ধ JSON অ্যারে (JSON Array) হতে হবে। কোনো অতিরিক্ত ভূমিকা বা ব্যাকটিকের বাইরে কোনো লেখা থাকবে না।

JSON ফরম্যাট নমুনা:
[
  {
    "id": 1,
    "type": "${qType === 'mixed' ? 'mcq_single' : qType}",
    "question": "টেকনিক্যাল প্রশ্ন...",
    "options": ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
    "correctAnswer": 0,
    "pairs": [{"left": "বাম পাশ ১", "right": "ডান পাশ ১"}],
    "acceptedAnswers": ["সঠিক উত্তর"],
    "items": ["ধাপ ১", "ধাপ ২"],
    "expectedAnswerKeyword": "মূল কিওয়ার্ড",
    "explanation": "১ লাইনের সংক্ষিপ্ত কারিগরি ব্যাখ্যা বা আদর্শ সমাধান।",
    "timeLimit": 30,
    "difficulty": "Medium"
  }
]`;

  try {
    const result = await generateWithFailover({
      prompt: userPrompt,
      systemPrompt: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.3
    });

    const responseText = result.text || "";
    let parsed: any[] = [];

    try {
      parsed = safeParseAiQuestions(responseText);
    } catch (jsonErr) {
      console.error("[QuizAiGenerator] JSON Parse Error:", jsonErr);
      throw new Error("Invalid AI Response Format");
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      let formattedQuestions: BtebQuizQuestion[] = parsed.map((q, idx) => {
        const detectedType = q.type || (q.pairs ? "matching" : q.acceptedAnswers ? "fill_blank" : typeof q.correctAnswer === "boolean" ? "true_false" : qType !== "mixed" ? qType : "mcq_single");
        
        return {
          id: `ai-${Date.now()}-${idx + 1}`,
          type: detectedType as any,
          question: q.question || `টেকনিক্যাল প্রশ্ন ${idx + 1}`,
          options: Array.isArray(q.options) && q.options.length >= 2 
            ? q.options.map((opt: any) => String(opt).trim())
            : ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
          correctAnswer: typeof q.correctAnswer === "boolean"
            ? q.correctAnswer
            : typeof q.correctAnswer === "number" && q.correctAnswer >= 0
            ? q.correctAnswer
            : 0,
          correctIndices: Array.isArray(q.correctIndices) ? q.correctIndices : undefined,
          pairs: Array.isArray(q.pairs) && q.pairs.length > 0 ? q.pairs : undefined,
          items: Array.isArray(q.items) && q.items.length > 0 ? q.items : undefined,
          acceptedAnswers: Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0 ? q.acceptedAnswers : undefined,
          expectedAnswerKeyword: q.expectedAnswerKeyword || undefined,
          caseSensitive: !!q.caseSensitive,
          explanation: q.explanation || "কারিগরি পাঠ্যসূচি অনুযায়ী সঠিক উত্তর নির্বাচন করা হয়েছে।",
          timeLimit: q.timeLimit && q.timeLimit >= 15 && q.timeLimit <= 90 ? q.timeLimit : 30,
          difficulty: q.difficulty || (params.difficulty && params.difficulty !== "Mixed" ? params.difficulty : "Medium"),
          trade: params.trade,
          topic: params.topic,
          points: 100,
          questionData: {
            options: q.options,
            correctIndex: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
            correctAnswer: q.correctAnswer,
            pairs: q.pairs,
            items: q.items,
            acceptedAnswers: q.acceptedAnswers,
            expectedAnswerKeyword: q.expectedAnswerKeyword,
            caseSensitive: q.caseSensitive,
            explanation: q.explanation
          }
        };
      });

      // Enforce exact requested question count
      if (formattedQuestions.length > count) {
        formattedQuestions = formattedQuestions.slice(0, count);
      } else if (formattedQuestions.length < count) {
        const fillers = getOfflineMockQuestions({ ...params, questionCount: count - formattedQuestions.length });
        formattedQuestions = [...formattedQuestions, ...fillers];
      }

      return {
        success: true,
        questions: formattedQuestions,
        isFallback: false,
        message: `${result.providerId} (${result.modelName}) সফলভাবে ${formattedQuestions.length}টি BTEB প্রশ্ন তৈরি করেছে।`,
        provider: "gemini_ai",
        modelUsed: result.modelName,
        timestamp: new Date().toISOString()
      };
    }
  } catch (err: any) {
    console.error("[QuizAiGenerator] Multi-AI Pipeline failed:", err?.message || err);
  }

  // Final fallback to offline engine
  const fallbackQuestions = getOfflineMockQuestions(params);
  return {
    success: true,
    questions: fallbackQuestions,
    isFallback: true,
    message: "এআই সিস্টেম বা নেটওয়ার্ক সীমাবদ্ধতার কারণে BTEB অফলাইন কারিকুলাম প্রশ্নব্যাংক থেকে অবিলম্বে জেনারেট করা হয়েছে।",
    provider: "bteb_offline_engine",
    timestamp: new Date().toISOString()
  };
}
