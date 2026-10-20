import { NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "status";
    const table = searchParams.get("table");

    if (action === "status") {
      const tables = [
        { name: "school_settings", rows: 1, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "technical_trades", rows: institutionalDb.trades.length, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "classes", rows: institutionalDb.classes.length, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "students", rows: institutionalDb.students.length, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "faculty_staff", rows: institutionalDb.faculty.length, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "class_routines", rows: institutionalDb.routines.length, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "exam_routines", rows: institutionalDb.examRoutines.length, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "exam_marks", rows: institutionalDb.marks.length, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "result_sheets", rows: institutionalDb.resultPdfs.length, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "campus_gallery", rows: institutionalDb.gallery.length, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "notices", rows: institutionalDb.notices.length, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "academic_events", rows: institutionalDb.events.length, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
      ];

      return NextResponse.json({
        success: true,
        mysqlConfig: institutionalDb.mysqlConfig,
        tables,
        totalTables: tables.length,
        serverVersion: "8.0.36-MySQL Community Server",
        phpMyAdminVersion: "5.2.1",
        connectionUptime: "99.98%",
      });
    }

    if (action === "table_data" && table) {
      let data: any[] = [];
      if (table === "students") data = institutionalDb.students;
      else if (table === "faculty_staff") data = institutionalDb.faculty;
      else if (table === "technical_trades") data = institutionalDb.trades;
      else if (table === "class_routines") data = institutionalDb.routines;
      else if (table === "exam_marks") data = institutionalDb.marks;
      else if (table === "notices") data = institutionalDb.notices;
      else if (table === "school_settings") data = [institutionalDb.institution];
      else data = institutionalDb.students.slice(0, 5);

      return NextResponse.json({
        success: true,
        table,
        rows: data,
        count: data.length,
      });
    }

    if (action === "export_sql") {
      const sqlDump = institutionalDb.generateMySQLDump();
      return new Response(sqlDump, {
        headers: {
          "Content-Type": "application/sql; charset=utf-8",
          "Content-Disposition": `attachment; filename="pgtsc_erp_mysql_dump_${new Date().toISOString().slice(0, 10)}.sql"`,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, query, config } = body;

    if (action === "update_config" && config) {
      institutionalDb.mysqlConfig = {
        ...institutionalDb.mysqlConfig,
        ...config,
      };
      return NextResponse.json({
        success: true,
        message: "MySQL / phpMyAdmin ডাটাবেস সংযোগ কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে।",
        config: institutionalDb.mysqlConfig,
      });
    }

    if (action === "execute_query" && query) {
      const result = institutionalDb.executeSQL(query);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: "Invalid POST request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
