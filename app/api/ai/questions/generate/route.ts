import { NextRequest, NextResponse } from "next/server";
import { institutionalDb, AIGenerationJob, AIGeneratedQuestion } from "@/lib/database";
import { AIService } from "@/lib/aiService";
import { COMMON_SUBJECTS_9_12, PRE_VOCATIONAL_SUBJECTS } from "@/lib/academicStructure";
import { verifyBackendAuthorization } from "@/lib/serverAuthGuard";

export async function POST(req: NextRequest) {
  // SECURITY RBAC ENFORCEMENT: Zero-Trust for Students & Conditional Access for Teachers
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "generate_ai_questions",
    endpointName: "/api/ai/questions/generate",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  const jobId = `job-${Date.now()}`;
  const nowStr = new Date().toISOString();

  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const {
    topic,
    subjectId,
    classId,
    chapter = "",
    lesson = "",
    learningObjective = "",
    additionalInstructions = "",
    questionType = "mcq_single",
    count = 5,
    difficulty = "medium",
    language = "Bangla",
    referencePdfId = "",
    qualityOptions = {
      includeExplanations: true,
      includeLearningObjective: true,
      includeDifficulty: true,
      includeTags: true,
      avoidDuplicates: true,
      avoidAmbiguous: true,
      avoidOverlyEasy: false,
      useCurriculumWording: true,
    },
  } = body;

  // Basic Validation
  if (!topic || !topic.trim()) {
    return NextResponse.json({ success: false, message: "Topic is required" }, { status: 400 });
  }

  if (count < 1 || count > 50) {
    return NextResponse.json({ success: false, message: "Question count must be between 1 and 50" }, { status: 400 });
  }

  // Cost & usage control check (Rate limiting): Limit to 200 questions per user per day (Simulated for demo)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayJobs = institutionalDb.aiGenerationJobs.filter(
    (j) => new Date(j.createdAt).getTime() >= todayStart.getTime()
  );
  const todayGeneratedCount = todayJobs.reduce((sum, j) => sum + (j.status === "completed" ? j.questionCount : 0), 0);
  if (todayGeneratedCount + count > 200) {
    return NextResponse.json(
      {
        success: false,
        message: `Daily cost protection limit reached. You have already generated ${todayGeneratedCount} questions today. Daily limit is 200 questions.`,
      },
      { status: 429 }
    );
  }

  // Find subject name and class name for prompt
  const classes = institutionalDb.classes;
  const targetClass = classes.find((c) => c.id === Number(classId));
  const className = targetClass ? `${targetClass.name} (${targetClass.shift})` : `Class ${classId}`;

  // Find subject in both lists
  const allSubjects = [...PRE_VOCATIONAL_SUBJECTS, ...COMMON_SUBJECTS_9_12];
  const targetSubject = allSubjects.find((s) => s.id === Number(subjectId));
  const subjectName = targetSubject ? targetSubject.name : `Subject ID ${subjectId}`;

  // Create Job Record
  const newJob: AIGenerationJob = {
    id: jobId,
    userId: 1, // Simulated current teacher/admin ID
    subjectId: Number(subjectId) || 1,
    classId: Number(classId) || 4,
    topic: topic.trim(),
    chapter,
    lesson,
    learningObjective,
    language,
    difficulty,
    questionType,
    questionCount: count,
    provider: "Google Gemini",
    model: process.env.AI_MODEL || "gemini-flash-latest",
    status: "processing",
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  institutionalDb.aiGenerationJobs.unshift(newJob);

  // PDF Grounding Context injection if a reference PDF is selected
  let finalInstructions = additionalInstructions;
  if (referencePdfId) {
    const doc = institutionalDb.pdfDocuments.find((d) => d.id === referencePdfId);
    if (doc) {
      const fromP = body.fromPage !== undefined ? Number(body.fromPage) : undefined;
      const toP = body.toPage !== undefined ? Number(body.toPage) : undefined;
      let excerpt = "";
      if (fromP !== undefined && toP !== undefined) {
        const pages = institutionalDb.pdfPages.filter(
          (p) => p.documentId === referencePdfId && p.pageNumber >= fromP && p.pageNumber <= toP
        );
        if (pages.length > 0) {
          excerpt = pages.map((p) => `[পৃষ্ঠা ${p.pageNumber}]: ${p.extractedText}`).join("\n\n");
        }
      }
      if (!excerpt) {
        const chunks = institutionalDb.pdfChunks.filter((c) => c.documentId === referencePdfId);
        excerpt = chunks.slice(0, 4).map((c) => c.chunkText).join("\n\n");
      }
      finalInstructions = `${additionalInstructions ? additionalInstructions + "\n\n" : ""}【রেফারেন্স কারিকুলাম পাঠ্যবই / সিলেবাস: ${doc.title} (${fromP && toP ? `পৃষ্ঠা ${fromP}-${toP}, ` : ""}${doc.topic || doc.chapter || "PTSC BTEB"})】\n${excerpt ? "পাঠ্যবইয়ের সংশ্লিষ্ট মূল অংশ:\n" + excerpt.slice(0, 2400) : ""}`.trim();
    }
  }

  try {
    // Generate via AIService
    const generated = await AIService.generateQuestions({
      topic,
      subjectName,
      className,
      chapter,
      lesson,
      learningObjective,
      additionalInstructions: finalInstructions,
      questionType,
      count,
      difficulty,
      language,
      qualityOptions,
    });

    if (generated.length === 0) {
      throw new Error("AI provider returned an empty list or questions were malformed.");
    }

    // Save generated questions to db
    const questionsToSave: AIGeneratedQuestion[] = generated.map((q, idx) => {
      const qId = `aiq-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
      const possibleMatches = AIService.findPossibleDuplicatesInBank(q.questionText);
      
      return {
        ...q,
        id: qId,
        generationJobId: jobId,
        status: "generated",
        reviewedBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Pass dynamic match warning info inside question
        duplicateHash: possibleMatches.length > 0 ? "similar_found" : undefined,
      } as AIGeneratedQuestion;
    });

    institutionalDb.aiGeneratedQuestions.push(...questionsToSave);

    // Update job status to completed
    newJob.status = "completed";
    newJob.updatedAt = new Date().toISOString();

    // Audit logs simulation
    console.log(`[AUDIT LOG] AI Generation completed successfully. JobID: ${jobId}, Created: ${questionsToSave.length} questions.`);

    return NextResponse.json({
      success: true,
      job: newJob,
      questions: questionsToSave,
      message: `Successfully generated ${questionsToSave.length} questions.`,
    });
  } catch (error: any) {
    console.error("AI Generation API Error:", error);
    
    // Update Job status to failed
    newJob.status = "failed";
    newJob.errorMessage = error.message || "Failed to generate questions via AI provider.";
    newJob.updatedAt = new Date().toISOString();

    console.log(`[AUDIT LOG] AI Generation failed. JobID: ${jobId}, Error: ${newJob.errorMessage}`);

    return NextResponse.json(
      {
        success: false,
        job: newJob,
        message: error.message || "AI model generation failed. Please review your settings and try again.",
      },
      { status: 500 }
    );
  }
}
