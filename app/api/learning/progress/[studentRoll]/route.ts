import { NextRequest, NextResponse } from "next/server";
import { chapterLearningStore } from "@/lib/chapterLearningEngine";
import { requireAuth } from "@/lib/serverAuthGuard";
import { isAuthorizedStaff } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentRoll: string }> }
) {
  const auth = requireAuth(req, "/api/learning/progress/[studentRoll]");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { studentRoll } = await params;
    const identity = auth.identity;
    const isStaff = isAuthorizedStaff(identity.userRole);

    // If caller is student, enforce record ownership check
    if (!isStaff) {
      const cleanRoll = studentRoll.trim().toLowerCase();
      const userRoll = String(identity.userId).trim().toLowerCase();
      const userEmail = (identity.userEmail || "").trim().toLowerCase();

      const isOwner =
        userRoll === cleanRoll ||
        userEmail.includes(`student.${cleanRoll}@`) ||
        userEmail.includes(cleanRoll);

      if (!isOwner) {
        return NextResponse.json(
          {
            success: false,
            status: 403,
            error: "Forbidden",
            code: "PROGRESS_OWNERSHIP_DENIED",
            message: "শিক্ষার্থীরা শুধুমাত্র তাদের নিজস্ব শিখন অগ্রগতি ও কুইজ ফলাফল পর্যবেক্ষণ করতে পারে।",
          },
          { status: 403 }
        );
      }
    }

    const stats = chapterLearningStore.getStudentOverallStats(studentRoll);
    const progressList = chapterLearningStore.getStudentProgressList(studentRoll);

    return NextResponse.json({
      success: true,
      studentRoll,
      stats,
      progressList,
    });
  } catch (error: any) {
    console.error("GET /api/learning/progress/[studentRoll] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student progress stats" },
      { status: 500 }
    );
  }
}
