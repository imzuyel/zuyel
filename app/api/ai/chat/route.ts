import { NextRequest, NextResponse } from "next/server";
import { retrieveTechnicalContext } from "@/lib/technicalKnowledgeBase";
import { generateWithFailover, AIChatMessage } from "@/lib/aiFailoverPipeline";

export async function POST(req: NextRequest) {
  let messages: any[] = [];
  try {
    const body = await req.json().catch(() => ({}));
    messages = Array.isArray(body.messages) ? body.messages : [];
    const {
      currentLessonTitle,
      selectedModel,
      temperature,
      systemPrompt: customSystemPrompt,
      useKnowledgeBase = true,
      enableGrounding = true,
    } = body;

    const groundingOn = useKnowledgeBase !== false && enableGrounding !== false;

    // Retrieve last user query for Knowledge Base context matching (if grounding enabled)
    const lastUserQuery = messages.length > 0 ? messages[messages.length - 1].text : "";
    const { contextText, matchedEntries } = groundingOn
      ? retrieveTechnicalContext(lastUserQuery)
      : { contextText: "", matchedEntries: [] };

    const defaultSystemInstruction = `You are an expert, encouraging, and friendly vocational and technical education AI tutor at Panchagarh Government Technical School & College (PTSC), Bangladesh. 
You specialize in BTEB vocational subjects: Electrical Works, Computer & IoT, Electronics, Automobile, Civil, and General Science.
Your role is to help students understand their lessons clearly, answer questions simply and directly in Bengali, provide practical examples, and guide them safely.
Current lesson context: "${currentLessonTitle || "General Studies"}".
${contextText ? `\n[VERIFIED PTSC TECHNICAL KNOWLEDGE BASE ENTRIES ATTACHED]:\n${contextText}\nPRIORITIZE using these accurate PTSC technical details in your response.` : ""}
IMPORTANT: Keep answers very concise, clear, direct, and fast. Avoid unnecessary filler words.`;

    const systemInstruction = customSystemPrompt
      ? `${customSystemPrompt}\n${contextText ? `\n[VERIFIED KNOWLEDGE BASE ATTACHED]:\n${contextText}` : ""}`
      : defaultSystemInstruction;

    const chatMessages: AIChatMessage[] = messages.slice(-10).map((m: any) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text || m.content || "",
    }));

    const result = await generateWithFailover({
      messages: chatMessages,
      systemPrompt: systemInstruction,
      temperature: typeof temperature === "number" ? temperature : 0.6,
      maxTokens: 1000,
      model: selectedModel || "gemini-flash-latest",
    });

    return NextResponse.json({
      text: result.text || "আপনার প্রশ্নটির উত্তর: কারিগরি পাঠ্যক্রমের এই বিষয়টি বেশ গুরুত্বপূর্ণ। বিষয়টিকে সহজভাবে বুঝতে আপনার টেক্সটবুক ও প্র্যাকটিক্যাল ল্যাবের সহায়িকা অনুসরণ করুন।",
      matchedKnowledge: matchedEntries.map((e) => e.title),
      providerUsed: `${result.keyAlias} (${result.modelName})`,
    });
  } catch (error: any) {
    console.error("Student AI Chat Error:", error);

    // Fallback response based on last user question
    const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1].text : "";
    let fallbackAnswer = "আপনার প্রশ্নের উত্তরটি সংক্ষেপে: কারিগরি শিক্ষা ও বিটিইবি সিলেবাসের এই মূল বিষয়টি ল্যাব প্র্যাকটিক্যাল ও বইয়ের রেফারেন্স অনুযায়ী অনুশীলন করা উচিত।";

    if (lastMsg.includes("ওহম") || lastMsg.includes("Ohm")) {
      fallbackAnswer = "👉 **ওহমের সূত্র (Ohm's Law):** স্থির তাপমাত্রায় কোনো পরিবাহীর মধ্য দিয়ে প্রবাহিত বিদ্যুৎ প্রবাহ (I) ওই পরিবাহীর দুই প্রান্তের বিভব পার্থক্যের (V) সমানুপাতিক এবং রেজিস্ট্যান্সের (R) ব্যস্তানুপাতিক। সূত্র: **V = I × R**।";
    } else if (lastMsg.includes("সেফটি") || lastMsg.includes("Safety")) {
      fallbackAnswer = "👉 **কারিগরি সেফটি রুলস:**\n১. ল্যাবে কাজ করার সময় পিপিই (ইনসুলেটেড জুতো, গ্লাভস, গগলস) পরিধান করুন।\n২. পাওয়ার অফ না করে কোনো সার্কিটে হাত দেবেন না।\n৩. আর্দিং এবং ফিউজ সঠিকভাবে চেক করুন।";
    } else if (lastMsg.includes("কম্পিউটার") || lastMsg.includes("Computer") || lastMsg.includes("নেটওয়ার্ক")) {
      fallbackAnswer = "👉 **কম্পিউটার নেটওয়ার্ক:** একাধিক কম্পিউটারকে তথ্য ও রিসোর্স শেয়ার করার উদ্দেশ্যে তার বা তারবিহীন মাধ্যমে যুক্ত করাকে কম্পিউটার নেটওয়ার্ক বলে (যেমন: LAN, WAN, Wi-Fi)।";
    } else if (lastMsg.includes("ইলেকট্রিক্যাল") || lastMsg.includes("Electrical") || lastMsg.includes("পাওয়ার")) {
      fallbackAnswer = "👉 **ইলেকট্রিক্যাল পাওয়ার (P):** বৈদ্যুতিক শক্তি ব্যবহারের হারকে পাওয়ার বলে। ফর্মুলা: **P = V × I** (বা **P = I²R**), যার একক ওয়াট (Watt)।";
    } else if (lastMsg.includes("বাস্তব উদাহরণ") || lastMsg.includes("উদাহরণ")) {
      fallbackAnswer = "👉 **বাস্তব উদাহরণ:** যেমন আপনার ঘরের একটি ১০০ ওয়াটের বাল্ব ২২০ ভোল্ট লাইনে চললে এতে প্রায় ০.৪৫ অ্যাম্পিয়ার কারেন্ট প্রবাহিত হয়।";
    } else if (lastMsg.includes("সহজ করে")) {
      fallbackAnswer = "👉 **সহজ ব্যাখ্যা:** যেকোনো টেকনিক্যাল বিষয়কে ছোট ছোট ধাপে ভাগ করে প্র্যাকটিক্যাল উদাহরণের মাধ্যমে মনে রাখলে বিষয়টি সবচেয়ে সহজ হয়ে যায়।";
    }

    return NextResponse.json({
      text: `${fallbackAnswer}\n\n*(PTSC AI টিউটর অফলাইন কারিকুলাম সাড়াদান)*`,
      isFallback: true,
    });
  }
}
