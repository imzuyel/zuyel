import { NextRequest, NextResponse } from "next/server";
import { generateWithFailover } from "@/lib/aiFailoverPipeline";

export async function POST(req: NextRequest) {
  try {
    const { presentationTitle, startSlide, endSlide, targetClass, blogTone } = await req.json();

    const prompt = `You are an expert vocational and technical education teacher at Panchagarh Government Technical School & College (PTSC).
Generate a structured, engaging lesson blog in Bengali based on the presentation titled "${presentationTitle}", specifically covering slides ${startSlide} to ${endSlide}.
Target Audience / Class: ${targetClass}
Tone / Style: ${blogTone}

Please output in well-formatted Markdown with clear sections:
1. পাঠের শিরোনাম ও উদ্দেশ্য (Lesson Title & Objectives)
2. মূল বিষয়বস্তু ও স্লাইড সারসংক্ষেপ (Core Content & Slide Summary)
3. ব্যবহারিক কর্মশালা ও সেফটি প্রিক্রেশন (Workshop & Safety Guidelines)
4. মূল্যায়ন প্রশ্ন ও বাড়ির কাজ (Assessment & Homework)

Keep it highly educational, professional, and directly usable for students and teachers in BTEB vocational curriculum.`;

    const result = await generateWithFailover({
      prompt,
      temperature: 0.5,
    });

    return NextResponse.json({
      text: result.text,
      providerUsed: `${result.keyAlias} (${result.modelName})`,
    });
  } catch (error: any) {
    console.error("AI Slide-to-Blog Error:", error);

    // Fallback static structured blog article if all AI calls fail
    const fallbackArticle = `# পাঠের শিরোনাম: কারিগরি পাঠ্য ও ব্যবহারিক নির্দেশিকা
> **PTSC কারিগরি শিক্ষা সেল্ফ-লার্নিং রিসোর্স**

## ১. পাঠের উদ্দেশ্য
- কারিগরি বিষয়ের মৌলিক নীতি ও যন্ত্রাংশ শনাক্ত করতে পারা।
- ব্যবহারিক ক্লাসে সঠিক নিরাপত্তা প্রটোকল মেনে কাজ করা।

## ২. মূল বিষয়বস্তু ও সারসংক্ষেপ
পাঠ্যবই ও স্লাইডের আলোকের প্রধান শিখনফলসমূহ সুন্দরভাবে সাজিয়ে অনুশীলন করুন।

## ৩. সেফটি প্রিক্রেশন
- ল্যাবে কাজ শুরু করার পূর্বে গ্লাভস ও ইনসুলেটেড সরঞ্জাম ব্যবহার করুন।
- শর্ট সার্কিট এড়াতে মেন সুইচ বন্ধ রাখুন।

*(বি.দ্র. AI প্রসেসিং অফলাইনে থাকায় মূল কারিকুলাম ব্যাকআপ প্রদর্শন করা হচ্ছে)*`;

    return NextResponse.json({
      text: fallbackArticle,
      isFallback: true,
    });
  }
}
