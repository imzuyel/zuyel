import { Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { generateWithFailover } from "@/lib/aiFailoverPipeline";
import { safeParseAiObject } from "@/lib/safeJsonParser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jsonContent, academicYear = "2026", defaultClassId = "4", defaultTradeCode = "IT-IOT" } = body;

    if (!jsonContent) {
      return NextResponse.json(
        { error: "কোনো JSON ডেটা প্রদান করা হয়নি।" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert academic routine scheduler for Panchagarh Government Technical School & College (PTSC), Bangladesh.
Analyse the provided JSON file contents and automatically generate a complete, valid, 0-conflict weekly class schedule array of RoutineItem objects.

Input JSON Content:
${typeof jsonContent === "string" ? jsonContent : JSON.stringify(jsonContent, null, 2)}

Context Parameters:
- Academic Year: ${academicYear}
- Default Class ID: ${defaultClassId}
- Default Trade Code: ${defaultTradeCode}
- Standard Days: Sunday, Monday, Tuesday, Wednesday, Thursday
- Standard Periods: 1 to 8 (Periods 1-4 before Tiffin break, 5-8 after Tiffin break)
- Period times:
  Period 1: 08:00 - 08:40
  Period 2: 08:40 - 09:20
  Period 3: 09:20 - 10:00
  Period 4: 10:00 - 10:40
  Tiffin Break: 10:40 - 11:10
  Period 5: 11:10 - 11:50
  Period 6: 11:50 - 12:30
  Period 7: 12:30 - 01:10
  Period 8: 01:10 - 01:50

Rules:
1. Extract or infer classes, trades, subjects, subject codes, teachers, room numbers, and durations from the JSON input.
2. If the JSON is a raw list of subjects or teachers, automatically distribute them into weekly slots (Sunday through Thursday, 1-8 periods).
3. Ensure no teacher is assigned to two different classes/rooms in the exact same day and period.
4. Set durationMinutes to 80 or 120 for Lab/Practical/Workshop subjects, and 40 for Theory subjects.
5. Provide clear Bangla names for subjects (subjectNameBangla), teachers (teacherBangla), and room numbers (roomNo like "ল্যাব-০১", "রুম-১০১", etc.).
6. Output a JSON array of RoutineItem objects matching the required schema. Return ONLY valid JSON.`;

    const result = await generateWithFailover({
      prompt,
      responseMimeType: "application/json",
      temperature: 0.2,
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.NUMBER },
            academicYear: { type: Type.STRING },
            classId: { type: Type.NUMBER },
            className: { type: Type.STRING },
            tradeCode: { type: Type.STRING },
            day: { type: Type.STRING },
            periodNo: { type: Type.NUMBER },
            startTime: { type: Type.STRING },
            endTime: { type: Type.STRING },
            durationMinutes: { type: Type.NUMBER },
            subjectCode: { type: Type.STRING },
            subjectName: { type: Type.STRING },
            subjectNameBangla: { type: Type.STRING },
            teacherName: { type: Type.STRING },
            teacherBangla: { type: Type.STRING },
            roomNo: { type: Type.STRING },
            isLab: { type: Type.BOOLEAN },
            status: { type: Type.STRING },
          },
          required: [
            "academicYear",
            "classId",
            "className",
            "day",
            "periodNo",
            "startTime",
            "endTime",
            "durationMinutes",
            "subjectCode",
            "subjectName",
            "teacherName",
            "roomNo",
          ],
        },
      },
    });

    const responseText = result.text?.trim() || "[]";
    const parsedRoutines = safeParseAiObject<any[]>(responseText, []);

    // Ensure valid IDs
    const normalized = (Array.isArray(parsedRoutines) ? parsedRoutines : []).map((item: Record<string, unknown>, idx: number) => ({
      ...item,
      id: item.id || Date.now() + idx,
      academicYear: item.academicYear || academicYear,
      status: item.status || "published",
    }));

    return NextResponse.json({
      success: true,
      routines: normalized,
      count: normalized.length,
      providerUsed: `${result.keyAlias} (${result.modelName})`,
      message: `সফলভাবে ${normalized.length}টি রুটিন স্লট এআই দিয়ে প্রক্রিয়াজাত করা হয়েছে!`,
    });
  } catch (error: unknown) {
    const errObj = error as { message?: string };
    console.error("AI JSON Routine Generation Error:", error);
    return NextResponse.json(
      { error: errObj.message || "এআই দিয়ে রুটিন প্রসেস করার সময় ত্রুটি ঘটেছে।" },
      { status: 500 }
    );
  }
}
