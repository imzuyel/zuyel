import { NextResponse } from "next/server";
import { LifecycleEngine } from "@/lib/lifecycleEngine";
import { institutionalDb } from "@/lib/database";
import { requireAdmin } from "@/lib/serverAuthGuard";

export async function POST(req: Request) {
  const auth = requireAdmin(req, "/api/students/rollover");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { action, sourceYear, targetYear, studentIds, classMappings, performedBy, options } = body;

    if (action === "preview") {
      const students = institutionalDb.students.filter(s => 
        studentIds ? studentIds.includes(s.id) : (s.session === String(sourceYear) && s.status === "Active")
      );

      const stats = {
        total: students.length,
        eligible: 0,
        notEligible: 0,
        pending: 0,
        failed: 0,
        alreadyProcessed: 0,
        previews: [] as any[]
      };

      students.forEach(s => {
        // Check if already in target year
        const already = institutionalDb.academicPlacements.find(p => p.studentId === s.id && p.academicYear === Number(targetYear));
        if (already) {
          stats.alreadyProcessed++;
          return;
        }

        const evaluation = LifecycleEngine.evaluatePromotion(s.id, Number(sourceYear), Number(targetYear));
        if (evaluation.status === "Eligible") stats.eligible++;
        else if (evaluation.status === "Pending Result") stats.pending++;
        else stats.notEligible++;

        stats.previews.push({
          studentId: s.id,
          name: s.name,
          roll: s.roll,
          class: s.className,
          status: evaluation.status,
          reason: evaluation.reason,
          metrics: evaluation.metrics
        });
      });

      return NextResponse.json({ success: true, stats });
    }

    if (action === "execute") {
      const result = LifecycleEngine.executeRollover(
        studentIds,
        Number(sourceYear),
        Number(targetYear),
        classMappings,
        performedBy,
        options
      );

      return NextResponse.json({
        success: true,
        message: `${result.success} জন শিক্ষার্থীর প্রমোশন/রোলওভার সম্পন্ন হয়েছে।`,
        summary: result
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
