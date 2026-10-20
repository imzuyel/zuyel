import { NextRequest, NextResponse } from "next/server";
import { generateJsonWithFailover } from "@/lib/aiFailoverPipeline";
import { institutionalDb } from "@/lib/database";

export interface AnalyticsRecommendationRequest {
  studentName: string;
  quizTitle: string;
  totalScore: number;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  classId?: number;
  trade?: string;
  topicBreakdown: Array<{
    topic: string;
    total: number;
    correct: number;
    percentage: number;
  }>;
  weakQuestions: Array<{
    question: string;
    studentAnswer: string;
    correctAnswer: string;
    explanation?: string;
    topic?: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyticsRecommendationRequest = await req.json();
    const {
      studentName = "শিক্ষার্থী",
      quizTitle = "কারিগরি মূল্যায়ন পরীক্ষা",
      totalScore = 0,
      accuracy = 0,
      totalQuestions = 10,
      correctAnswers = 5,
      wrongAnswers = 5,
      classId = 4,
      trade = "Technical / Vocational",
      topicBreakdown = [],
      weakQuestions = [],
    } = body;

    // Match relevant curriculum PDFs from institutional database
    const matchingPdfs = institutionalDb.pdfDocuments
      .filter((doc) => !classId || doc.classId === Number(classId) || doc.classId === 4)
      .slice(0, 4)
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        chapter: doc.chapter || "Relevant Chapter",
        topic: doc.topic || "Core Curriculum",
        tags: doc.tags || [],
      }));

    const prompt = `তুমি পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের (PTSC) একজন অভিজ্ঞ কারিগরি শিক্ষা বিশেষজ্ঞ ও এআই পেডাগজি মেন্টর।
নিচে একজন শিক্ষার্থীর লাইভ কুইজ পরীক্ষার ফলাফল দেওয়া হলো:

- শিক্ষার্থীর নাম: ${studentName}
- কুইজের শিরোনাম: ${quizTitle}
- শ্রেণি / কোর্স: Class ${classId} (${trade})
- মোট নম্বর: ${totalScore}
- সঠিকতা: ${accuracy}% (সঠিক: ${correctAnswers}, ভুল: ${wrongAnswers}, মোট: ${totalQuestions})

টপিকভিত্তিক দক্ষতা (Topic Mastery Breakdown):
${JSON.stringify(topicBreakdown, null, 2)}

ভুল করা প্রশ্নসমূহ ও ধারণাগত দুর্বলতা:
${JSON.stringify(weakQuestions.slice(0, 6), null, 2)}

উপলব্ধ পাঠ্যবই / রেফারেন্স পিডিএফ সংগ্রহশালা:
${JSON.stringify(matchingPdfs, null, 2)}

নির্দেশনা:
১. শিক্ষার্থীর ভুল করা প্রশ্ন ও টপিকগুলো নিবিড়ভাবে বিশ্লেষণ করে সুনির্দিষ্ট দুর্বলতা (Concept Gaps) ও ভুল বোঝার পেছনের কারণ চিহ্নিত করো।
২. শিক্ষার্থীর জন্য ৫ দিনের একটি সুনির্দিষ্ট ও কার্যকর রিভিশন রোডম্যাপ (৫-Day Remedial Action Plan) তৈরি করো।
৩. দুর্বল টপিকগুলোর সমাধানের জন্য উপরে উল্লেখিত সংশ্লিষ্ট পাঠ্যবই ও অধ্যায়ের সাথে লিংক করে দাও।
৪. আউটপুট অবশ্যই বিশুদ্ধ JSON ফরম্যাটে হতে হবে।

প্রত্যাশিত JSON ফরম্যাট নমুনা:
{
  "executiveSummary": "শিক্ষার্থীর পারফরম্যান্সের গভীর পর্যবেক্ষণ ও সামগ্রিক বিশ্লেষণ...",
  "masteryLevel": "Developing" | "Proficient" | "Needs Remediation" | "Expert",
  "topStrengths": [
    { "topic": "টপিকের নাম", "feedback": "এই অংশে শিক্ষার্থীর চমৎকার নির্ভুলতা রয়েছে..." }
  ],
  "criticalWeaknesses": [
    { "topic": "টপিকের নাম", "gapAnalysis": "শিক্ষার্থীর মূল ধারণাগত ঘাটতি...", "suggestedFix": "যেভাবে সংশোধন করতে হবে..." }
  ],
  "remedialRoadmap": [
    { "day": 1, "focusTopic": "টপিক ও মূল সূত্র", "actionItem": "পাঠ্যবইয়ের অধ্যায় ৩ মনোযোগ দিয়ে পড়া ও সারসংক্ষেপ তৈরি", "estimatedHours": 1.5 },
    { "day": 2, "focusTopic": "গাণিতিক বা ধারণাগত সমস্যা সমাধান", "actionItem": "১০টি প্র্যাকটিস এমসিকিউ সমাধান করা", "estimatedHours": 2.0 },
    { "day": 3, "focusTopic": "সার্কিট / মেজারমেন্ট ডায়াগ্রাম রিভিউ", "actionItem": "হাতে-কলমে ডায়াগ্রাম আঁকা ও ল্যাব ম্যানুয়াল দেখা", "estimatedHours": 1.5 },
    { "day": 4, "focusTopic": "সেলফ-অ্যাসেসমেন্ট টেস্ট", "actionItem": "টাইমড মক কুইজে অংশগ্রহণ করা", "estimatedHours": 1.0 },
    { "day": 5, "focusTopic": "চূড়ান্ত রিভিশন ও শিক্ষক আলোচনা", "actionItem": "অস্পষ্ট বিষয়গুলো শ্রেণি শিক্ষকের সাথে ঝালাই করা", "estimatedHours": 1.0 }
  ],
  "curriculumPdfRecommendations": [
    { "docId": "doc-1", "docTitle": "বইয়ের নাম", "chapter": "অধ্যায়", "actionNote": "পৃষ্ঠা ১৫-১৮ এর সারসংক্ষেপ রিভিশন করুন" }
  ],
  "motivationalQuote": "কারিগরি দক্ষতায় ধারাবাহিক অনুশীলনই সফলতার মূল চাবিকাঠি।"
}`;

    try {
      const { data: parsedData, result } = await generateJsonWithFailover<any>({
        prompt,
        temperature: 0.3,
      });

      if (parsedData && parsedData.executiveSummary) {
        return NextResponse.json({
          success: true,
          isFallback: false,
          modelUsed: `${result.keyAlias} (${result.modelName})`,
          data: parsedData,
        });
      }
    } catch (err: any) {
      console.warn("[Analytics Recommendations] Multi-key AI pipeline failed, returning offline remedial plan:", err?.message);
    }

    // Fallback if all models fail
    return NextResponse.json({
      success: true,
      isFallback: true,
      data: getOfflineRemedialPlan(body, matchingPdfs),
    });
  } catch (error: any) {
    console.error("[API ANALYTICS ERROR]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to generate AI analytics" },
      { status: 500 }
    );
  }
}

function getOfflineRemedialPlan(
  body: AnalyticsRecommendationRequest,
  matchingPdfs: Array<{ id: string; title: string; chapter: string; topic: string }>
) {
  const isHighScorer = body.accuracy >= 80;
  const isModerate = body.accuracy >= 50;

  const weakTopics = body.topicBreakdown
    .filter((t) => t.percentage < 70)
    .map((t) => t.topic);

  const primaryWeakTopic = weakTopics[0] || "কারিগরি মৌলিক সূত্র ও পরিমাপ নীতি";

  return {
    executiveSummary: `${body.studentName}, পরীক্ষায় আপনার অর্জিত নির্ভুলতা ${body.accuracy}%। মৌলিক ধারণাগুলো ভালো হলেও কিছু সুনির্দিষ্ট প্রয়োগ ও সূত্রের ক্ষেত্রে আরও কিছুটা নিয়মিত রিভিশন প্রয়োজন।`,
    masteryLevel: isHighScorer ? "Expert" : isModerate ? "Proficient" : "Developing",
    topStrengths: [
      {
        topic: body.topicBreakdown[0]?.topic || "প্রাথমিক কারিগরি জ্ঞান",
        feedback: "মৌলিক সংজ্ঞামূলক প্রশ্নে নির্ভুল ও দ্রুততম সময়ে সঠিক উত্তর চিহ্নিত করতে পেরেছেন।",
      },
      {
        topic: "সময়ানুবর্তিতা ও সক্রিয় অংশগ্রহণ",
        feedback: "প্রশ্নের উত্তর দেওয়ার গড় গতি ও একাগ্রতা প্রশংসনীয়।",
      },
    ],
    criticalWeaknesses: [
      {
        topic: primaryWeakTopic,
        gapAnalysis: "সূত্রের প্রত্যক্ষ প্রয়োগ ও বিকল্প অপশনগুলোর মধ্যকার সূক্ষ্ম পার্থক্য অনুধাবনে কিছুটা বিভ্রান্তি দেখা গেছে।",
        suggestedFix: "অধ্যায়ের মূল সূত্রাবলি খাতায় নোট লিখে পুনরাবৃত্তি করুন এবং বাস্তবসম্মত প্রয়োগ সমাধান করুন।",
      },
    ],
    remedialRoadmap: [
      {
        day: 1,
        focusTopic: `${primaryWeakTopic} — মৌলিক তত্ত্ব পাঠ`,
        actionItem: "পাঠ্যপুস্তকের সংশ্লিষ্ট অধ্যায় মনোযোগ দিয়ে পড়া ও গুরুত্বপূর্ণ পরিভাষা চিহ্নিত করা",
        estimatedHours: 1.5,
      },
      {
        day: 2,
        focusTopic: "গাণিতিক ও ব্যবহারিক সূত্র সমাধান",
        actionItem: "অন্তত ১০টি বোর্ড স্ট্যান্ডার্ড বহুনির্বাচনী প্রশ্ন নিজ হাতে ব্যাখ্যাসহ সমাধান করা",
        estimatedHours: 2.0,
      },
      {
        day: 3,
        focusTopic: "ল্যাব ও ডায়াগ্রাম পর্যালোচনা",
        actionItem: "ওয়ার্কশপ বা ল্যাব সংক্রান্ত ব্যবহারিক ডায়াগ্রাম ও সতর্কতাবিধি পুনরাবৃত্তি করা",
        estimatedHours: 1.5,
      },
      {
        day: 4,
        focusTopic: "সেলফ-টেস্ট ও স্পিড ড্রিল",
        actionItem: "লাইভ কুইজ হাব থেকে ৫ মিনিটের একটি টাইমড মক টেস্ট দেওয়া",
        estimatedHours: 1.0,
      },
      {
        day: 5,
        focusTopic: "চূড়ান্ত মূল্যায়ন ও শিক্ষক ফিডব্যাক",
        actionItem: "সংশ্লিষ্ট বিষয় শিক্ষকের সাথে অমীমাংসিত প্রশ্নগুলো নিয়ে আলোচনা করা",
        estimatedHours: 1.0,
      },
    ],
    curriculumPdfRecommendations: matchingPdfs.map((pdf) => ({
      docId: pdf.id,
      docTitle: pdf.title,
      chapter: pdf.chapter,
      actionNote: "সংশ্লিষ্ট অধ্যায়ের মূল টেক্সট ও অনুশীলনীর প্রশ্নাবলি পুনরায় দেখুন।",
    })),
    motivationalQuote: "ভুল থেকেই শেখার প্রকৃত যাত্রা শুরু হয়। কারিগরি শিক্ষায় অধ্যবসায়ই এনে দেয় কর্মক্ষেত্রের শ্রেষ্ঠত্ব।",
  };
}
