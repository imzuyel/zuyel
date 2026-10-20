import { NextResponse } from "next/server";
import { examinationEngine, AssessmentCategory, ExamStatus } from "@/lib/examinationEngine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const yearParam = searchParams.get("academicYear");
    const categoryParam = searchParams.get("category");
    const statusParam = searchParams.get("status");
    const classIdParam = searchParams.get("classId");
    const search = searchParams.get("search") || undefined;
    const includeMetrics = searchParams.get("metrics") === "true";

    if (idParam) {
      const exam = examinationEngine.getExamById(Number(idParam));
      if (!exam) {
        return NextResponse.json({ success: false, error: "পরীক্ষাটি পাওয়া যায়নি।" }, { status: 404 });
      }
      return NextResponse.json({ success: true, exam });
    }

    const filters: any = {};
    if (yearParam) filters.academicYear = Number(yearParam);
    if (categoryParam) filters.category = categoryParam as AssessmentCategory;
    if (statusParam) filters.status = statusParam as ExamStatus;
    if (classIdParam) filters.classId = Number(classIdParam);
    if (search) filters.search = search;

    const exams = examinationEngine.getAllExams(filters);
    const metrics = includeMetrics ? examinationEngine.getMetrics(yearParam ? Number(yearParam) : 2026) : undefined;

    return NextResponse.json({
      success: true,
      exams,
      total: exams.length,
      metrics,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const operator = body.operator || "Exam Controller";

    const created = examinationEngine.createExam(body, operator);

    return NextResponse.json({
      success: true,
      exam: created,
      message: "পরীক্ষাটি সফলভাবে তৈরি করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, updates, operator = "Admin" } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "পরীক্ষার আইডি দেওয়া হয়নি।" }, { status: 400 });
    }

    const updated = examinationEngine.updateExam(Number(id), updates, operator);

    return NextResponse.json({
      success: true,
      exam: updated,
      message: "পরীক্ষার তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, operator = "Exam Controller", reason } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "আইডি ও নতুন স্ট্যাটাস আবশ্যক।" }, { status: 400 });
    }

    const exam = examinationEngine.transitionStatus(Number(id), status, operator, reason);

    return NextResponse.json({
      success: true,
      exam,
      message: `পরীক্ষার স্ট্যাটাস '${status}' হিসেবে হালনাগাদ করা হয়েছে।`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
