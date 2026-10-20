import { NextRequest, NextResponse } from "next/server";
import { generateJsonWithFailover } from "@/lib/aiFailoverPipeline";

export async function POST(req: NextRequest) {
  try {
    const {
      targetClass,
      trade,
      presentationTitle,
      slideRange,
      customNotes,
    } = await req.json();

    const title = presentationTitle || "কারিগরি ব্যবহারিক পাঠ";
    const cls = targetClass || "ক্লাস ৯ (ভোকেশনাল)";
    const trd = trade || "ইলেকট্রিক্যাল সেফটি ও সার্কিট";
    const range = slideRange || "স্লাইড ১ থেকে ১৫";

    const prompt = `You are a Chief Technical Instructor & Curriculum Specialist at Panchagarh Government Technical School & College (PTSC), Bangladesh.
We need an integrated "Prepare My Class" comprehensive teacher instructional package for our BTEB Vocational students.

Input Details:
- Target Class: ${cls}
- Trade / Technology: ${trd}
- Presentation / Topic: ${title}
- Slide Range: ${range}
${customNotes ? `- Teacher Notes / Focus: ${customNotes}` : ""}

Please output ONLY a valid JSON object (no markdown code blocks, or pure JSON without extra text) with the following exact schema:
{
  "lessonSummary": {
    "briefOverview": "সংক্ষিপ্ত ২-৩ লাইনের সারসংক্ষেপ",
    "objectives": [
      "১ম শিখনফল",
      "২য় শিখনফল",
      "৩য় শিখনফল"
    ],
    "keyConcepts": [
      "১ম তাত্ত্বিক পয়েন্ট",
      "২য় তাত্ত্বিক পয়েন্ট",
      "৩য় তাত্ত্বিক পয়েন্ট",
      "৪র্থ তাত্ত্বিক পয়েন্ট"
    ],
    "labPracticalGuidance": [
      "ব্যবহারিক ল্যাব গাইড ১",
      "ব্যবহারিক ল্যাব গাইড ২",
      "ব্যবহারিক ল্যাব গাইড ৩"
    ],
    "safetyTips": [
      "ওয়ার্কশপ সেফটি সতর্কতা ১",
      "ওয়ার্কশপ সেফটি সতর্কতা ২",
      "ওয়ার্কশপ সেফটি সতর্কতা ৩"
    ]
  },
  "blogPost": {
    "title": "${title}",
    "estimatedReadMinutes": 7,
    "markdownContent": "সম্পূর্ণ বিস্তারিত ও সমৃদ্ধ বাংলা মার্কডাউন ব্লগ আর্টিকেল। এতে হেডিং (##), বুলেট পয়েন্ট, গাণিতিক সমীকরণ বা সূত্র, ট্রাবলশুটিং গাইড, এবং প্র্যাকটিক্যাল টিপস সুন্দরভাবে সাজানো থাকবে।"
  },
  "quizSet": [
    {
      "id": "q1",
      "questionText": "১ম প্রশ্ন (বাংলায়)",
      "options": ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
      "correctAnswerIndex": 0,
      "explanation": "সঠিক উত্তরের বিশদ ব্যাখ্যা",
      "conceptTopic": "নির্দিষ্ট সাব-টপিক/কনসেপ্ট নাম"
    }
    // EXACTLY 10 questions total (q1 to q10) with conceptTopic for each
  ]
}

Ensure all questions are practical, relevant to BTEB curriculum, with exactly 4 options and valid 0-3 index. Provide EXACTLY 10 questions.`;

    // Attempt AI call with multi-key failover pipeline
    try {
      const { data: parsed, result } = await generateJsonWithFailover<any>({
        prompt,
        temperature: 0.3,
      });

      if (parsed && parsed.lessonSummary && parsed.blogPost && Array.isArray(parsed.quizSet)) {
        return NextResponse.json({
          success: true,
          source: "ai_multi_key_pipeline",
          providerUsed: `${result.keyAlias} (${result.modelName})`,
          data: parsed,
        });
      }
    } catch (aiErr: any) {
      console.warn("Multi-key AI call for prepare-class had an issue, falling back to rich curriculum engine:", aiErr.message);
    }

    // High quality intelligent curriculum fallback
    const fallbackPackage = generateCurriculumFallbackPackage(title, cls, trd, range);
    return NextResponse.json({
      success: true,
      source: "fallback",
      data: fallbackPackage,
    });
  } catch (error: any) {
    console.error("Error in prepare-class API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate class package" },
      { status: 500 }
    );
  }
}

function generateCurriculumFallbackPackage(
  title: string,
  cls: string,
  trade: string,
  range: string
) {
  const isElec = trade.toLowerCase().includes("electric") || title.includes("ইলেকট্রিক") || title.includes("সার্কিট");
  const isComp = trade.toLowerCase().includes("comp") || title.includes("কম্পিউটার") || title.includes("হার্ডওয়্যার");
  const isAuto = trade.toLowerCase().includes("auto") || title.includes("ইঞ্জিন") || title.includes("অটোমোবাইল");

  let summary = {
    briefOverview: `এই পাঠে '${title}' বিষয়ের ${range}-এর মূল তাত্ত্বিক ও ব্যবহারিক দিকসমূহ BTEB কারিকুলাম অনুযায়ী শিক্ষার্থীদের বোধগম্য করে উপস্থাপন করা হয়েছে।`,
    objectives: [
      `${title}-এর মৌলিক সংজ্ঞা, কার্যকরী মূলনীতি ও উপাদানসমূহ চিহ্নিত করতে পারা।`,
      `ব্যবহারিক কর্মশালায় প্রয়োজনীয় ইকুইপমেন্ট ও টুলস নিরাপদে ব্যবহার করতে শেখা।`,
      `বাস্তব প্রজেক্টে সার্কিট বা সিস্টেম টেস্ট করে ত্রুটি (Troubleshooting) নির্ণয় করা।`,
      `কারিগরি কর্মক্ষেত্রে বাংলাদেশ কারিগরি শিক্ষা বোর্ডের স্ট্যান্ডার্ড সেফটি নিশ্চিত করা।`,
    ],
    keyConcepts: [
      `মৌলিক মূলনীতি: সিস্টেমের প্রধান কার্যকরী ব্লক এবং তাদের পারস্পরিক সম্পর্ক।`,
      `গাণিতিক সমীকরণ ও সূত্র প্রয়োগের মাধ্যমে প্রয়োজনীয় প্যারামিটার নির্ণয়।`,
      `প্রধান যন্ত্রাংশের কালার কোডিং, স্পেসিফিকেশন এবং রেটিং যাচাই।`,
      `সাধারণ যান্ত্রিক বা বৈদ্যুতিক ত্রুটির কারণ ও প্রতিকারের সহজ পদ্ধতি।`,
    ],
    labPracticalGuidance: [
      `ল্যাব শুরুর পূর্বে ওয়ার্কবেঞ্চে নির্ধারিত টুলকিট গুছিয়ে রাখুন।`,
      `পরিমাপক যন্ত্র দিয়ে ভ্যালু চেক করে প্রাথমিক রিডিং খাতায় লিপিবদ্ধ করুন।`,
      `প্র্যাকটিক্যাল সার্কিট/মডেল সংযোগ শেষে শিক্ষককে দেখিয়ে অনুমোদন নিন।`,
    ],
    safetyTips: [
      `ল্যাবে কাজের সময় আবশ্যিকভাবে পার্সোনাল প্রোটেক্টিভ ইকুইপমেন্ট (PPE) পরিধান করুন।`,
      `পাওয়ার বা পাওয়ার টুলস অন করার পূর্বে চারপাশের সহপাঠীদের সতর্ক করুন।`,
      `যেকোনো অস্বাভাবিক শব্দ বা গন্ধ পাওয়া মাত্রই তাৎক্ষণিক মেইন সুইচ অফ করুন।`,
    ],
  };

  let blogMarkdown = `# ${title} (${range})

## ১. পাঠের ভূমিকা ও উদ্দেশ্য
বাংলাদেশ কারিগরি শিক্ষা বোর্ডের (BTEB) ভোকেশনাল ও ডিপ্লোমা শিক্ষার্থীদের জন্য **${title}** বিষয়টি অত্যন্ত গুরুত্বপূর্ণ। বাস্তব কর্মক্ষেত্রে দক্ষতা অর্জনের জন্য এই অধ্যায়ের তাত্ত্বিক এবং ব্যবহারিক জ্ঞান সমানভাবে প্রয়োজন।

> **লক্ষ্যমাত্রা:** এই পাঠ শেষে শিক্ষার্থীরা বিষয়টির মূল কার্যপ্রণালী আত্মস্থ করবে এবং ল্যাবরেটরিতে সরাসরি হাতে-কলমে কাজ করতে পারবে।

---

## ২. মূল তাত্ত্বিক বিষয়বস্তু ও স্লাইড সারসংক্ষেপ (${range})
${range}-এ আলোচিত মূল বিষয়গুলোকে নিচে কাঠামোগতভাবে সাজানো হলো:

1. **উপাদান পরিচিতি ও গঠন:** সিস্টেমে ব্যবহৃত প্রধান উপাদানসমূহের কার্যকারিতা এবং তাদের অভ্যন্তরীণ গঠন।
2. **গাণিতিক ভিত্তি ও সূত্র:** কারিগরি হিসাব-নিকাশ করার জন্য প্রয়োজনীয় স্ট্যান্ডার্ড ফর্মুলা এবং প্রয়োগ।
3. **ব্লক ডায়াগ্রাম ও কানেকশন:** ইনপুট থেকে আউটপুটে সিগন্যাল বা শক্তি প্রবাহের সুনির্দিষ্ট পথ।
4. **টেস্টিং মেথডোলজি:** অ্যানালগ ও ডিজিটাল মিটার ব্যবহার করে সঠিক মান যাচাই।

---

## ৩. ব্যবহারিক ল্যাব কর্মশালা ও প্র্যাকটিক্যাল গাইড
ব্যবহারিক ক্লাসে শিক্ষার্থীদের নিচের ধাপগুলো সুনির্দিষ্টভাবে অনুসরণ করতে হবে:

| ধাপ | কার্যক্রম | প্রয়োজনীয় টুলস |
| :--- | :--- | :--- |
| **ধাপ ১** | যন্ত্রাংশ পরীক্ষা ও রেটিং চেক | মাল্টিমিটার / টেস্ট ল্যাম্প |
| **ধাপ ২** | স্ট্যান্ডার্ড লেআউট অনুযায়ী সেটআপ | স্ক্রু-ড্রাইভার, প্লায়ার্স, কানেক্টিং ওয়্যার |
| **ধাপ ৩** | প্রাথমিক পরিমাপ ও রিডিং গ্রহণ | অ্যানালগ/ডিজিটাল গেজ |
| **ধাপ ৪** | অপারেশন টেস্ট ও ফাইনাল রেকর্ড | ল্যাব শিট ও সাইন-অফ |

---

## ৪. ওয়ার্কশপ নিরাপত্তা ও সতর্কতা (Safety First)
* ল্যাবে কাজ করার সময় খোলা তার বা অনাবৃত ধাতু স্পর্শ করবেন না।
* ইন্সুলেটেড টুলস ছাড়া লাইভ লাইনে কোনো কাজ করা কঠোরভাবে নিষিদ্ধ।
* কাজ শেষে সমস্ত যন্ত্রাংশ নির্ধারিত র্যাকে পরিষ্কার করে সংরক্ষণ করুন।

---

## ৫. পর্যালোচনা ও বাড়ির কাজ
১. আজ ক্লাসে শেখানো মূল তিনটি পয়েন্ট নিজের ভাষায় লিখ।
২. ল্যাব শিটে দেওয়া সমস্যাটির গাণিতিক সমাধান খাতায় সম্পন্ন করে আগামী ক্লাসে জমা দাও।`;

  // Generate 10 standard MCQs based on trade
  let quizSet = [];

  if (isElec) {
    quizSet = [
      {
        id: "mcq-1",
        questionText: "ওহমের সূত্র অনুযায়ী স্থির তাপমাত্রায় পরিবাহীর মধ্য দিয়ে প্রবাহিত কারেন্ট (I) কিসের সমানুপাতিক?",
        options: ["রেজিস্ট্যান্স (R)", "বিভব পার্থক্য বা ভোল্টেজ (V)", "পরিবাহীর ঘনত্ব", "ক্যাপাসিট্যান্স (C)"],
        correctAnswerIndex: 1,
        explanation: "I = V / R অনুযায়ী ভোল্টেজ বৃদ্ধি পেলে কারেন্ট সমানুপাতিক হারে বাড়ে।",
        conceptTopic: "ওহমের সূত্রের সমানুপাতিক নীতি",
      },
      {
        id: "mcq-2",
        questionText: "১০০ ওহম রেজিস্ট্যান্সের মধ্য দিয়ে ২ অ্যাম্পিয়ার কারেন্ট প্রবাহিত হলে ভোল্টেজ ড্রপ কত হবে?",
        options: ["৫০ ভোল্ট", "২০০ ভোল্ট", "১০০ ভোল্ট", "২৫ ভোল্ট"],
        correctAnswerIndex: 1,
        explanation: "V = I × R = 2 A × 100 Ω = 200 V।",
        conceptTopic: "ওহমের সূত্রের গাণিতিক প্রয়োগ",
      },
      {
        id: "mcq-3",
        questionText: "সিরিজ সার্কিটে সংযুক্ত একাধিক লোডের মধ্য দিয়ে প্রবাহিত কারেন্টের মান কেমন থাকে?",
        options: ["প্রতিটি লোডে আলাদা হয়", "সর্বত্র একই থাকে", "শুরুর লোডে বেশি থাকে", "শূন্য হয়ে যায়"],
        correctAnswerIndex: 1,
        explanation: "সিরিজ সংযোগে কারেন্ট প্রবাহের একটিমাত্র পথ থাকায় সব লোডে একই কারেন্ট প্রবাহিত হয়।",
        conceptTopic: "সিরিজ সার্কিটের কারেন্ট বৈশিষ্ট্য",
      },
      {
        id: "mcq-4",
        questionText: "প্যারালাল সার্কিটে প্রতিটি শাখার আড়াআড়িতে কোনটির মান সমান থাকে?",
        options: ["কারেন্ট", "ভোল্টেজ", "রেজিস্ট্যান্স", "পাওয়ার ফ্যাক্টর"],
        correctAnswerIndex: 1,
        explanation: "প্যারালাল সার্কিটের সমস্ত প্যারালাল ব্র্যাঞ্চে ভোল্টেজ সমান থাকে।",
        conceptTopic: "প্যারালাল সার্কিটের ভোল্টেজ নীতি",
      },
      {
        id: "mcq-5",
        questionText: "বৈদ্যুতিক পাওয়ার বা ক্ষমতার আন্তর্জাতিক একক (SI Unit) কোনটি?",
        options: ["জুল (Joule)", "ওয়াট (Watt)", "ভোল্ট (Volt)", "কুলম্ব (Coulomb)"],
        correctAnswerIndex: 1,
        explanation: "ক্ষমতার একক হলো ওয়াট (P = V × I)।",
        conceptTopic: "বৈদ্যুতিক পাওয়ার ও ওয়াট",
      },
      {
        id: "mcq-6",
        questionText: "সার্কিটকে ওভারলোড বা শর্ট সার্কিট থেকে রক্ষার প্রাথমিক সুরক্ষা ডিভাইস কোনটি?",
        options: ["সুইচ", "ফিউজ / সার্কিট ব্রেকার", "রেজিস্টর", "ট্রান্সফরমার"],
        correctAnswerIndex: 1,
        explanation: "ফিউজ বা সার্কিট ব্রেকার অতিরিক্ত কারেন্ট প্রবাহিত হলে স্বয়ংক্রিয়ভাবে লাইন বিচ্ছিন্ন করে।",
        conceptTopic: "সার্কিট প্রোটেকশন ও ফিউজ",
      },
      {
        id: "mcq-7",
        questionText: "মাল্টিমিটার দিয়ে ভোল্টেজ পরিমাপের সময় মিটারটিকে সার্কিটের সাথে কীভাবে সংযোগ করতে হয়?",
        options: ["সিরিজে", "প্যারালালে", "গ্রাউন্ড ছাড়াই সরাসরি", "কোনো সংযোগ ছাড়াই"],
        correctAnswerIndex: 1,
        explanation: "ভোল্টমিটার সবসময় লাইনের দুই প্রান্তের প্যারালালে সংযুক্ত করতে হয়।",
        conceptTopic: "ভোল্টমিটার ব্যবহারের নিয়ম",
      },
      {
        id: "mcq-8",
        questionText: "বৈদ্যুতিক শর্ট সার্কিটের ক্ষেত্রে সার্কিটের মোট রেজিস্ট্যান্স কত হয়?",
        options: ["অসীম (Infinity)", "প্রায় শূন্য (Zero)", "১০০ ওহম", "দ্বিগুণ"],
        correctAnswerIndex: 1,
        explanation: "শর্ট সার্কিটে সরাসরি ফেজ ও নিউট্রাল যুক্ত হওয়ায় রেজিস্ট্যান্স শূন্যের কাছাকাছি চলে যায়।",
        conceptTopic: "শর্ট সার্কিট ও শূন্য রেজিস্ট্যান্স",
      },
      {
        id: "mcq-9",
        questionText: "ওয়ার্কশপে বিদ্যুৎ স্পৃষ্ট ব্যক্তিকে মুক্ত করার তাৎক্ষণিক প্রথম পদক্ষেপ কোনটি?",
        options: ["হাত দিয়ে টেনে ধরা", "মেইন সুইচ দ্রুত বন্ধ করা বা কাঠের কাঠি ব্যবহার", "পানি ঢালা", "চিৎকার করা"],
        correctAnswerIndex: 1,
        explanation: "তড়িৎ সরবরাহ বন্ধ করা অথবা অপরিবাহী বস্তু দিয়ে আক্রান্ত ব্যক্তিকে সংযোগ বিচ্ছিন্ন করাই প্রথম কাজ।",
        conceptTopic: "ইলেকট্রিক্যাল সেফটি ও ফার্স্ট এইড",
      },
      {
        id: "mcq-10",
        questionText: "আর্দিং (Earthing) করার প্রধান উদ্দেশ্য কী?",
        options: ["বিদ্যুৎ বিল কমানো", "যন্ত্রপাতি ও মানবদেহকে লিকেজ কারেন্ট শক থেকে রক্ষা", "ভোল্টেজ বাড়ানো", "কারেন্ট সঞ্চয় করা"],
        correctAnswerIndex: 1,
        explanation: "আর্দিং লিকেজ কারেন্টকে নিরাপদে মাটিতে প্রবাহিত করে জীবনের নিরাপত্তা নিশ্চিত করে।",
        conceptTopic: "আর্দিং ও মানব নিরাপত্তা",
      },
    ];
  } else if (isComp) {
    quizSet = [
      {
        id: "mcq-1",
        questionText: "কম্পিউটারের মূল প্রিন্টেড সার্কিট বোর্ডকে কী বলা হয়?",
        options: ["পাওয়ার সাপ্লাই", "মাদারবোর্ড (Motherboard)", "হার্ডডিস্ক ড্রাইভ", "সাউন্ড কার্ড"],
        correctAnswerIndex: 1,
        explanation: "মাদারবোর্ড হলো কম্পিউটারের মূল কেন্দ্রীয় সার্কিট বোর্ড।",
        conceptTopic: "মাদারবোর্ড বেসিক স্ট্রাকচার",
      },
      {
        id: "mcq-2",
        questionText: "মাদারবোর্ডে প্রসেসর স্থাপন করার সকেটকে কী বলা হয়?",
        options: ["DDR স্লট", "CPU সকেট (LGA/PGA)", "PCIe স্লট", "SATA পোর্ট"],
        correctAnswerIndex: 1,
        explanation: "সেন্ট্রাল প্রসেসিং ইউনিট (CPU) সবসময় সিপিইউ সকেটে বসানো হয়।",
        conceptTopic: "সিপিইউ সকেট ও পিন আর্কিটেকচার",
      },
      {
        id: "mcq-3",
        questionText: "সিস্টেমের সময় ও বায়োস সেটিংস ধরে রাখতে কোন ব্যাটারি ব্যবহৃত হয়?",
        options: ["লিথিয়াম আয়ন ৯V", "CR2032 ৩V কয়েন ব্যাটারি", "পেন্সিল ব্যাটারি", "কার ব্যাটারি"],
        correctAnswerIndex: 1,
        explanation: "CMOS চিপ সক্রিয় রাখতে ৩ ভোল্টের CR2032 ব্যাটারি ব্যবহার করা হয়।",
        conceptTopic: "CMOS ব্যাটারি ও বায়োস ক্লক",
      },
      {
        id: "mcq-4",
        questionText: "পাওয়ার অন করার পর ডিসপ্লে না আসলে প্রাথমিক ট্রাবলশুটিং কী?",
        options: ["নতুন মনিটর লাগানো", "র‍্যামের সোনালী পিনের কার্বন ইরেজার দিয়ে মুছে পুনঃস্থাপন", "উইন্ডোজ রি-ইনস্টল", "মাউস পরিবর্তন"],
        correctAnswerIndex: 1,
        explanation: "র‍্যামের পিনের কার্বন বা ধুলাবালি ডিসপ্লে বাধাগ্রস্ত করার প্রধান কারণ।",
        conceptTopic: "র‍্যাম ও ডিসপ্লে ট্রাবলশুটিং",
      },
      {
        id: "mcq-5",
        questionText: "কম্পিউটার চালু হওয়ার সময় প্রথম কোন প্রোগ্রামটি হার্ডওয়্যার পরীক্ষা করে?",
        options: ["অপারেটিং সিস্টেম", "BIOS / UEFI (POST)", "গুগল ক্রোম", "অ্যান্টিভাইরাস"],
        correctAnswerIndex: 1,
        explanation: "POST (Power-On Self-Test) বায়োসের মাধ্যমে সমস্ত ডিভাইস পরীক্ষা করে।",
        conceptTopic: "বায়োস ও পোস্ট প্রক্রিয়া",
      },
      {
        id: "mcq-6",
        questionText: "হাই-স্পিড গ্রাফিক্স কার্ড বা জিপিইউ মাদারবোর্ডের কোন স্লটে লাগানো হয়?",
        options: ["PCIe x16 স্লট", "SATA 3 স্লট", "M.2 স্লট", "IDE পোর্ট"],
        correctAnswerIndex: 0,
        explanation: "PCI Express x16 স্লট সর্বোচ্চ ব্যান্ডউইথ থাকায় জিপিইউ এর জন্য উপযুক্ত।",
        conceptTopic: "PCIe বাস ও গ্রাফিক্স স্লট",
      },
      {
        id: "mcq-7",
        questionText: "র‍্যাম (RAM) কোন ধরনের মেমোরি হিসেবে পরিচিত?",
        options: ["নন-ভোলাটাইল স্থায়ী মেমোরি", "ভোলাটাইল বা অস্থায়ী মেমোরি", "অপটিক্যাল মেমোরি", "ম্যাগনেটিক মেমোরি"],
        correctAnswerIndex: 1,
        explanation: "বিদ্যুৎ সরবরাহ বন্ধ হলে র‍্যামের ডাটা মুছে যায়, তাই এটি ভোলাটাইল।",
        conceptTopic: "র‍্যাম ও ভোলাটাইল মেমোরি",
      },
      {
        id: "mcq-8",
        questionText: "প্রসেসর অতিরিক্ত গরম হওয়া রোধে প্রসেসর ও কুলারের মাঝে কী দেওয়া হয়?",
        options: ["তেল", "থার্মাল পেস্ট (Thermal Paste)", "প্লাস্টিক ফিল্ম", "পানি"],
        correctAnswerIndex: 1,
        explanation: "থার্মাল পেস্ট হিট সিঙ্কের সাথে নিখুঁত তাপ পরিবহণ নিশ্চিত করে।",
        conceptTopic: "থার্মাল পেস্ট ও কুলিং সিস্টেম",
      },
      {
        id: "mcq-9",
        questionText: "এসএসডি (SSD) হার্ডডিস্কের চেয়ে দ্রুতগতির হওয়ার মূল কারণ কী?",
        options: ["ঘূর্ণায়মান ডিস্ক আছে", "ফ্ল্যাশ মেমোরি চিপের ব্যবহার (কোনো মুভিং পার্টস নেই)", "ভারী অ্যালুমিনিয়াম বডি", "বেশি বিদ্যুৎ খায়"],
        correctAnswerIndex: 1,
        explanation: "এসএসডি সলিড স্টেট ফ্ল্যাশ মেমোরি ব্যবহার করায় এর ল্যাটেন্সি প্রায় শূন্য।",
        conceptTopic: "স্টোরেজ টেকনোলজি ও এসএসডি",
      },
      {
        id: "mcq-10",
        questionText: "কম্পিউটার হার্ডওয়্যারে কাজ করার সময় স্ট্যাটিক ইলেকট্রিসিটি এড়াতে কী পরা উচিত?",
        options: ["উলের সোয়েটার", "অ্যান্টি-স্ট্যাটিক রিস্ট ব্যান্ড", "ধাতুর ঘড়ি", "প্লাস্টিক টুপি"],
        correctAnswerIndex: 1,
        explanation: "অ্যান্টি-স্ট্যাটিক রিস্ট স্ট্র্যাপ ইলেকট্রোস্ট্যাটিক ডিসচার্জ (ESD) থেকে সূক্ষ্ম চিপ রক্ষা করে।",
        conceptTopic: "হার্ডওয়্যার সেফটি ও ESD প্রটেকশন",
      },
    ];
  } else {
    // General technical / vocational questions
    quizSet = [
      {
        id: "mcq-1",
        questionText: `${title}-এর মূল ব্যবহারিক উদ্দেশ্য কোনটি?`,
        options: ["তাত্ত্বিক সূত্র মুখস্থ রাখা", "বাস্তব কর্মক্ষেত্রে নিরাপদ ও নির্ভুল দক্ষতা প্রদর্শন", "কেবল নম্বর পাওয়া", "যন্ত্রপাতি আলাদা করে রাখা"],
        correctAnswerIndex: 1,
        explanation: "কারিগরি শিক্ষার মূল লক্ষ্য হলো বাস্তব কর্মক্ষেত্রে ব্যবহারিক দক্ষতা অর্জন।",
        conceptTopic: `${title} উদ্দেশ্য ও নীতি`,
      },
      {
        id: "mcq-2",
        questionText: "কারিগরি ল্যাবরেটরিতে ব্যক্তিগত সুরক্ষার জন্য অপরিহার্য সরঞ্জাম কোনটি?",
        options: ["PPE (Personal Protective Equipment)", "ক্যাজুয়াল জুতো", "খোলা কাপড়", "হেডফোন"],
        correctAnswerIndex: 0,
        explanation: "PPE ল্যাবের ঝুঁকি থেকে শিক্ষার্থীকে সুরক্ষিত রাখে।",
        conceptTopic: "ল্যাব সেফটি ও PPE",
      },
      {
        id: "mcq-3",
        questionText: "যন্ত্রাংশ পরিমাপ করার পূর্বে মিটারের জিরো-এরর (Zero Error) পরীক্ষা কেন জরুরি?",
        options: ["মিটার সুন্দর দেখানোর জন্য", "পরিমাপে নির্ভুলতা নিশ্চিত করতে", "ব্যাটারি দ্রুত শেষ করার জন্য", "কোনো কারণ নেই"],
        correctAnswerIndex: 1,
        explanation: "জিরো এরর সংশোধন না করলে পরিমাপের মানে ধারাবাহিক ভুল থেকে যায়।",
        conceptTopic: "পরিমাপক যন্ত্রের ক্যালিব্রেশন",
      },
      {
        id: "mcq-4",
        questionText: `${range}-এ নির্দেশিত প্রধান কার্যকরী উপাদান কয়টি?`,
        options: ["২টি", "৩টি", "৪টি", "৫টি"],
        correctAnswerIndex: 2,
        explanation: "পাঠ্যসূচির স্ট্যান্ডার্ড কাঠামো অনুযায়ী ৪টি মূল উপাদান শনাক্ত করা হয়েছে।",
        conceptTopic: "উপাদান শ্রেণিবিভাগ",
      },
      {
        id: "mcq-5",
        questionText: "টুলস ব্যবহারের পর ওয়ার্কশপে সঠিক রক্ষণাবেক্ষণ পদ্ধতি কোনটি?",
        options: ["মেঝেতে ফেলে রাখা", "পরিষ্কার করে যথাস্থানে র্যাকে গুছিয়ে রাখা", "পানিতে ভিজিয়ে রাখা", "রোদে ফেলে রাখা"],
        correctAnswerIndex: 1,
        explanation: "টুলস সঠিক স্থানে গুছিয়ে রাখলে কর্মক্ষেত্রের নিরাপত্তা ও টুলসের আয়ু বৃদ্ধি পায়।",
        conceptTopic: "টুলস রক্ষণাবেক্ষণ ও 5S",
      },
      {
        id: "mcq-6",
        questionText: "সিস্টেমে অতিরিক্ত লোড বা অস্বাভাবিক আচরণ দেখা দিলে তাৎক্ষণিক করণীয় কী?",
        options: ["পাওয়ার বিচ্ছিন্ন করা ও ইন্সট্রাক্টরকে জানানো", "আরও জোর দেওয়া", "উপেক্ষা করা", "টুলস দিয়ে আঘাত করা"],
        correctAnswerIndex: 0,
        explanation: "দুর্ঘটনা প্রতিরোধে দ্রুত পাওয়ার অফ করাই স্ট্যান্ডার্ড প্রটোকল।",
        conceptTopic: "জরুরি প্রটোকল ও নিয়ন্ত্রণ",
      },
      {
        id: "mcq-7",
        questionText: "আন্তর্জাতিক মানের কারিগরি ড্রয়িং ও স্পেসিফিকেশনে কোন পরিমাপ পদ্ধতি অগ্রাধিকার পায়?",
        options: ["SI পদ্ধতি (মেট্রিক)", "এফপিএস পদ্ধতি", "মনগড়া পরিমাপ", "প্রাচীন গজ-ফুট"],
        correctAnswerIndex: 0,
        explanation: "আধুনিক ইঞ্জিনিয়ারিংয়ে এসআই (SI) বা মেট্রিক পদ্ধতি সর্বজনীনভাবে গৃহীত।",
        conceptTopic: "আন্তর্জাতিক পরিমাপ মানদণ্ড",
      },
      {
        id: "mcq-8",
        questionText: "যেকোনো প্রজেক্ট শুরু করার আগে প্রথম ধাপ কোনটি?",
        options: ["সরাসরি সুইচ অন করা", "সার্কিট বা প্ল্যান ডায়াগ্রাম ভালো করে পর্যালোচনা করা", "বক্স খুলে ফেলা", "তার কেটে ফেলা"],
        correctAnswerIndex: 1,
        explanation: "স্কিম্যাটিক বা প্ল্যান পর্যালোচনা না করে কাজ শুরু করলে ভুলের সম্ভাবনা থাকে।",
        conceptTopic: "পরিকল্পনা ও ব্লু-প্রিন্ট স্টাডি",
      },
      {
        id: "mcq-9",
        questionText: "ত্রুটি নির্ণয়ের জন্য নিচের কোন পদ্ধতিটি বিজ্ঞানসম্মত?",
        options: ["ধাপে ধাপে ইনপুট থেকে আউটপুট টেস্ট করা (Troubleshooting)", "অনুমানের ভিত্তিতে অংশ বদলানো", "সব ফেলে দেওয়া", "কেবল শেষ অংশ দেখা"],
        correctAnswerIndex: 0,
        explanation: "ধাপে ধাপে টেস্ট করলেই নির্ভুলভাবে সমস্যার উৎস খুঁজে পাওয়া সম্ভব।",
        conceptTopic: "সিস্টেমেটিক ট্রাবলশুটিং",
      },
      {
        id: "mcq-10",
        questionText: "BTEB ভোকেশনাল কারিকুলামে নিয়মিত ব্যবহারিক মূল্যায়নের গুরুত্ব কী?",
        options: ["বাস্তব ইন্ডাস্ট্রির উপযোগী দক্ষ জনশক্তি গড়ে তোলা", "সময় কাটানো", "তাত্ত্বিক পাঠ ভুলে যাওয়া", "কোনো গুরুত্ব নেই"],
        correctAnswerIndex: 0,
        explanation: "ব্যবহারিক দক্ষতার মাধ্যমেই একজন কারিগরি শিক্ষার্থী দক্ষ টেকনিশিয়ান হিসেবে গড়ে ওঠে।",
        conceptTopic: "কারিগরি শিক্ষার লক্ষ্য ও ইন্ডাস্ট্রি স্ট্যান্ডার্ড",
      },
    ];
  }

  return {
    lessonSummary: summary,
    blogPost: {
      title,
      estimatedReadMinutes: 7,
      markdownContent: blogMarkdown,
    },
    quizSet,
  };
}
