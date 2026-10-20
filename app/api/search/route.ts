import { NextRequest, NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase() || "";
  const type = searchParams.get("type") || "all";

  if (!query) {
    return NextResponse.json({ success: true, results: [] });
  }

  let results: any[] = [];

  // Search Students
  if (type === "all" || type === "student") {
    const students = institutionalDb.students.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.studentId.toLowerCase().includes(query) ||
      String(s.roll).includes(query)
    ).map(s => ({
      id: s.id,
      type: "student",
      title: s.name,
      subtitle: `${s.className} (${s.section}) - ID: ${s.studentId}`,
      link: `/admin?tab=students`
    }));
    results = [...results, ...students];
  }

  // Search Notices
  if (type === "all" || type === "notice") {
    const notices = institutionalDb.notices.filter(n =>
      n.titleBangla.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query)
    ).map(n => ({
      id: n.id,
      type: "notice",
      title: n.titleBangla,
      subtitle: `Category: ${n.categoryBangla}`,
      link: `/admin?tab=notices`
    }));
    results = [...results, ...notices];
  }

  // Add more module searches here...

  return NextResponse.json({ success: true, results: results.slice(0, 10) });
}
