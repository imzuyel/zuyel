import { NextRequest, NextResponse } from "next/server";
import { generateWithFailover } from "@/lib/aiFailoverPipeline";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, contents, messages, systemPrompt, temperature = 0.7 } = body;
    
    const finalPrompt = prompt || contents;

    if (!finalPrompt && (!messages || messages.length === 0)) {
      return NextResponse.json({ success: false, error: "Prompt or messages are required" }, { status: 400 });
    }

    const result = await generateWithFailover({
      prompt: finalPrompt,
      messages,
      systemPrompt,
      temperature
    });

    return NextResponse.json({
      success: true,
      text: result.text,
      model: result.modelName,
      provider: result.providerId,
      attempts: result.attempts
    });
  } catch (error: any) {
    console.error("[API /api/ai] Fatal Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate AI response",
      },
      { status: 500 }
    );
  }
}
