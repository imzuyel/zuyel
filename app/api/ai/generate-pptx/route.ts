import { Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import pptxgen from "pptxgenjs";
import { getPresentationThemeById } from "@/lib/presentationThemes";
import { generateWithFailover } from "@/lib/aiFailoverPipeline";

export async function POST(req: NextRequest) {
  try {
    const { topic, className, trade, notes, theme = "dark", requestedSlideCount } = await req.json();
    const slideCount = Math.min(Math.max(Number(requestedSlideCount) || 5, 3), 20);

    if (!topic || !className) {
      return NextResponse.json(
        { success: false, error: "টপিক এবং শ্রেণি প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a senior TVET curriculum specialist at Panchagarh Govt. Technical School & College (PTSC), Bangladesh.
Generate a structured, professional ${slideCount}-slide lesson presentation in Bengali for PowerPoint (.pptx).`;

    const userPrompt = `Input Context:
- Topic: ${topic}
- Class: ${className}
- Trade/Subject: ${trade || "General Technical Skills"}
- Syllabus Notes: ${notes || "None provided"}

Output JSON Structure:
{
  "slides": [
    {
      "slideType": "cover" | "content" | "summary",
      "title": "Slide Title in Bengali",
      "subtitle": "Subtitle / Context in Bengali",
      "bulletPoints": ["Detailed point 1 in Bengali", "Point 2 in Bengali", "Point 3 in Bengali"],
      "takeaway": "Key takeaway summary in Bengali",
      "safetyTip": "BTEB Lab safety or cautionary rule in Bengali",
      "question": "Evaluation / Review Question in Bengali"
    }
  ]
}

Make content technical, accurate, encouraging, and compliant with BTEB (Bangladesh Technical Education Board) standards.
Return ONLY valid JSON with no markdown formatting.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        slides: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              slideType: { type: Type.STRING },
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              bulletPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              takeaway: { type: Type.STRING },
              safetyTip: { type: Type.STRING },
              question: { type: Type.STRING }
            },
            required: ["title", "subtitle", "bulletPoints", "takeaway", "safetyTip", "question"]
          }
        }
      },
      required: ["slides"]
    };

    let responseText = "";
    try {
      const result = await generateWithFailover({
        systemPrompt,
        prompt: userPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7
      });
      responseText = result.text || "";
    } catch (aiErr) {
      console.warn("[PPTX Generation] AI call failed, generating contextual fallback slides:", aiErr);
    }

    let data: any = null;
    if (responseText) {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
        data = JSON.parse(cleanJson);
      } catch (e) {
        console.error("[PPTX Generation] JSON Parse error:", e);
      }
    }

    if (!data || !Array.isArray(data.slides) || data.slides.length === 0) {
      const fallbackSlides = [];
      fallbackSlides.push({
        slideType: "cover",
        title: topic,
        subtitle: `${className} - ${trade || "কারিগরি বিষয়"}`,
        bulletPoints: [
          `${topic} এর পরিচিতি ও প্রায়োগিক গুরুত্ব`,
          "কারিগরি শিক্ষাক্রম অনুযায়ী বাস্তবমুখী জ্ঞান অর্জন",
          "ল্যাব প্র্যাক্টিক্যাল ও ধারাবাহিক মূল্যায়ন প্রস্তুতি"
        ],
        takeaway: `${topic} এর মৌলিক ধারণা আয়ত্ত করা অত্যন্ত আবশ্যক।`,
        safetyTip: "ল্যাবে নির্ধারিত নিরাপত্তা নিয়ম মেনে চলুন।",
        question: `আজকের বিষয় ${topic} সম্পর্কে আপনার প্রাথমিক ধারণা কী?`
      });

      for (let i = 2; i <= slideCount - 1; i++) {
        fallbackSlides.push({
          slideType: "content",
          title: `${topic}: ব্যবহারিক ধাপ ${i - 1}`,
          subtitle: `মূল টেকনিক্যাল কনসেপ্ট ও ডায়নামিক সেশন (পর্ব ${i - 1})`,
          bulletPoints: [
            `${topic} এর প্রধান উপাদান ও সংযোগ পদ্ধতি।`,
            "স্ট্যান্ডার্ড কারিগরি নির্দেশিকা অনুযায়ী সার্কিট ও কার্যপদ্ধতি বিশ্লেষণ।",
            "ল্যাব পরীক্ষণ ও রিডিং সংগ্রহের নিয়মাবলী।"
          ],
          takeaway: "সঠিক ইকুইপমেন্ট ব্যবহারে কাজের গুণগত মান নিশ্চিত হয়।",
          safetyTip: "ব্যক্তিগত সুরক্ষা সরঞ্জাম (PPE) ব্যবহার বাধ্যতামূলক।",
          question: "এই প্রক্রিয়ার মূল সংবেদনশীল অংশ কোনটি?"
        });
      }

      fallbackSlides.push({
        slideType: "summary",
        title: "শ্রেণিকক্ষ মূল্যায়ন ও সারসংক্ষেপ",
        subtitle: "শিখনফল ও প্রশ্নোত্তর পর্ব",
        bulletPoints: [
          "পাঠের মূল পয়েন্টসমূহের পুনরাবৃত্তি।",
          "ব্যবহারিক কাজের সারমর্ম ও প্র্যাক্টিক্যাল খাতা প্রস্তুতি।",
          "পরবর্তী ক্লাসের প্রয়োজনীয় প্রস্তুতি নির্দেশনা।"
        ],
        takeaway: "ধারাবাহিক অনুশীলনই কারিগরি দক্ষতার চূড়ান্ত চাবিকাঠি।",
        safetyTip: "ল্যাব ছাড়ার পূর্বে পাওয়ার সুইচ বন্ধ করুন।",
        question: "আজকের পাঠ থেকে আপনি কী কী নতুন বিষয় শিখলেন?"
      });

      data = { slides: fallbackSlides };
    }

    const slidesData = data.slides || [];

    // Create PowerPoint Presentation Instance
    const pptx = new pptxgen();
    pptx.author = "Panchagarh Govt. Technical School & College";
    pptx.company = "PTSC - Directorate of Technical Education";
    pptx.title = topic;
    pptx.subject = `${className} - ${trade}`;

    // Retrieve 50+ Curated Theme Colors from Registry
    const selectedThemeObj = getPresentationThemeById(theme);
    const isDark = selectedThemeObj.isDark;
    const bgColor = selectedThemeObj.bgColor;
    const textColor = selectedThemeObj.textColor;
    const subTextColor = selectedThemeObj.subTextColor;
    const accentColor = selectedThemeObj.accentColor;
    const secondaryAccent = selectedThemeObj.secondaryAccent;
    const alertBg = selectedThemeObj.alertBg;
    const alertText = selectedThemeObj.alertText;

    // -----------------------------------------------------------------
    // SLIDE 1: INSTITUTIONAL TITLE / COVER SLIDE
    // -----------------------------------------------------------------
    const coverSlide = pptx.addSlide();
    coverSlide.background = { color: bgColor };

    // Header Accent Line
    coverSlide.addShape(pptx.ShapeType?.rect || 'rect', {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.15,
      fill: { color: accentColor },
    });

    // Institution Name
    coverSlide.addText("PANCHAGARH GOVT. TECHNICAL SCHOOL & COLLEGE", {
      x: 0.8,
      y: 0.8,
      w: 8.5,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: accentColor,
      fontFace: "Arial",
    });

    coverSlide.addText("পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ • EIIN: 132244", {
      x: 0.8,
      y: 1.15,
      w: 8.5,
      h: 0.3,
      fontSize: 12,
      color: subTextColor,
      fontFace: "Arial",
    });

    // Topic Title
    coverSlide.addText(topic, {
      x: 0.8,
      y: 2.2,
      w: 8.5,
      h: 1.2,
      fontSize: 32,
      bold: true,
      color: textColor,
      fontFace: "Arial",
    });

    // Subtitle & Class Info
    coverSlide.addText(`শ্রেণি: ${className} • ট্রেড/বিষয়: ${trade || "কারিগরি শিক্ষা"}`, {
      x: 0.8,
      y: 3.5,
      w: 8.5,
      h: 0.5,
      fontSize: 18,
      color: secondaryAccent,
      bold: true,
      fontFace: "Arial",
    });

    // Institutional Footer
    coverSlide.addText("BTEB Curriculum • Smart TVET Presentation Deck", {
      x: 0.8,
      y: 5.0,
      w: 8.5,
      h: 0.3,
      fontSize: 11,
      italic: true,
      color: subTextColor,
      fontFace: "Arial",
    });

    // -----------------------------------------------------------------
    // SLIDE 2 - N: CONTENT SLIDES
    // -----------------------------------------------------------------
    slidesData.forEach((s: any, idx: number) => {
      const slide = pptx.addSlide();
      slide.background = { color: bgColor };

      // Top Institutional Micro Header
      slide.addText("PANCHAGARH GOVT. TECHNICAL SCHOOL & COLLEGE (PTSC)", {
        x: 0.6,
        y: 0.3,
        w: 7.0,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: accentColor,
        fontFace: "Arial",
      });

      slide.addText(`শ্রেণি: ${className} | ${trade || "TVET"}`, {
        x: 7.5,
        y: 0.3,
        w: 2.0,
        h: 0.3,
        fontSize: 10,
        align: "right",
        color: subTextColor,
        fontFace: "Arial",
      });

      // Horizontal Divider Line
      slide.addShape(pptx.ShapeType?.line || 'line', {
        x: 0.6,
        y: 0.65,
        w: 8.8,
        h: 0,
        line: { color: isDark ? "334155" : "E2E8F0", width: 1 },
      });

      // Slide Title & Subtitle
      slide.addText(s.title || `লেকচার ধাপ - ${idx + 1}`, {
        x: 0.6,
        y: 0.85,
        w: 8.8,
        h: 0.5,
        fontSize: 22,
        bold: true,
        color: textColor,
        fontFace: "Arial",
      });

      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: 0.6,
          y: 1.35,
          w: 8.8,
          h: 0.3,
          fontSize: 12,
          color: secondaryAccent,
          bold: true,
          fontFace: "Arial",
        });
      }

      // Bullet points
      const points = Array.isArray(s.bulletPoints) ? s.bulletPoints : [];
      if (points.length > 0) {
        const bulletTextObjects = points.map((p: string) => ({
          text: `✦  ${p}`,
          options: { fontSize: 13, color: textColor, breakLine: true, fontFace: "Arial", spaceAfter: 8 },
        }));

        slide.addText(bulletTextObjects as any, {
          x: 0.6,
          y: 1.8,
          w: 5.8,
          h: 2.8,
          valign: "top",
        });
      }

      // Right Card Box: Takeaway & Lab Safety Rule
      if (s.takeaway || s.safetyTip) {
        // Takeaway Box
        if (s.takeaway) {
          slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
            x: 6.6,
            y: 1.8,
            w: 2.8,
            h: 1.5,
            fill: { color: isDark ? "1E293B" : "F1F5F9" },
            line: { color: accentColor, width: 1 },
          });

          slide.addText("সারসংক্ষেপ (Key Takeaway):", {
            x: 6.7,
            y: 1.9,
            w: 2.6,
            h: 0.3,
            fontSize: 11,
            bold: true,
            color: accentColor,
            fontFace: "Arial",
          });

          slide.addText(s.takeaway, {
            x: 6.7,
            y: 2.2,
            w: 2.6,
            h: 1.0,
            fontSize: 10,
            color: textColor,
            fontFace: "Arial",
            valign: "top",
          });
        }

        // BTEB Safety Alert Box
        if (s.safetyTip) {
          slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
            x: 6.6,
            y: 3.5,
            w: 2.8,
            h: 1.3,
            fill: { color: alertBg },
            line: { color: "F59E0B", width: 1 },
          });

          slide.addText("⚠️ BTEB ল্যাব সেফটি নির্দেশিকা:", {
            x: 6.7,
            y: 3.6,
            w: 2.6,
            h: 0.3,
            fontSize: 10,
            bold: true,
            color: alertText,
            fontFace: "Arial",
          });

          slide.addText(s.safetyTip, {
            x: 6.7,
            y: 3.9,
            w: 2.6,
            h: 0.8,
            fontSize: 9,
            color: alertText,
            fontFace: "Arial",
            valign: "top",
          });
        }
      }

      // Classroom Evaluation Question at Bottom
      if (s.question) {
        slide.addText(`💡 মূল্যায়ন প্রশ্ন: "${s.question}"`, {
          x: 0.6,
          y: 4.85,
          w: 8.8,
          h: 0.35,
          fontSize: 11,
          bold: true,
          italic: true,
          color: secondaryAccent,
          fontFace: "Arial",
        });
      }

      // Footer Page Number
      slide.addText(`PTSC AI Presentation Studio | Slide ${idx + 2} of ${slidesData.length + 1}`, {
        x: 0.6,
        y: 5.3,
        w: 8.8,
        h: 0.25,
        fontSize: 9,
        color: subTextColor,
        fontFace: "Arial",
      });
    });

    // Compile PPTX binary buffer
    const buffer = await pptx.write({ outputType: "nodebuffer" });

    const safeTopic = topic.replace(/[^\w\s-]/gi, "").trim().replace(/\s+/g, "_") || "Presentation";

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="PTSC_Presentation_${safeTopic}.pptx"`,
      },
    });

  } catch (error: any) {
    console.error("Error generating PPTX:", error);
    return NextResponse.json(
      { success: false, error: error.message || "পাওয়ারপয়েন্ট জেনারেট করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
