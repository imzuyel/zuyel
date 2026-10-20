import { NextResponse } from "next/server";
import { LifecycleEngine } from "@/lib/lifecycleEngine";
import { institutionalDb } from "@/lib/database";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ success: false, error: "Student ID required" }, { status: 400 });
  }

  const history = LifecycleEngine.getAcademicHistory(Number(studentId));
  const events = LifecycleEngine.getLifecycleEvents(Number(studentId));

  return NextResponse.json({
    success: true,
    history,
    events
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, studentId, data, reason, performedBy } = body;

    if (!studentId || !action) {
      return NextResponse.json({ success: false, error: "StudentId and action required" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "update_placement":
        result = LifecycleEngine.updatePlacement(Number(studentId), data, reason, performedBy, "Status Change");
        break;
      
      case "transfer_out":
        result = LifecycleEngine.updatePlacement(
          Number(studentId), 
          { status: "Transferred", isCurrent: true }, 
          reason || "Transfer Out", 
          performedBy, 
          "Transfer Out"
        );
        break;

      case "re_admission":
        result = LifecycleEngine.updatePlacement(
          Number(studentId), 
          { status: "Active", isCurrent: true, ...data }, 
          reason || "Re-admission", 
          performedBy, 
          "Re-admission"
        );
        break;

      case "section_change":
        result = LifecycleEngine.updatePlacement(
          Number(studentId), 
          { section: data.section }, 
          reason || "Section Change", 
          performedBy, 
          "Section Change"
        );
        break;

      case "trade_change":
        result = LifecycleEngine.updatePlacement(
          Number(studentId), 
          { tradeId: data.tradeId, tradeName: data.tradeName }, 
          reason || "Trade Change", 
          performedBy, 
          "Trade Change"
        );
        break;

      case "graduate":
        result = LifecycleEngine.updatePlacement(
          Number(studentId), 
          { status: "Graduated" }, 
          reason || "Course Completion", 
          performedBy, 
          "Graduation"
        );
        break;

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Lifecycle operation completed successfully.",
      data: result
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
