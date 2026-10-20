import { NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { verifyBackendAuthorization } from "@/lib/serverAuthGuard";
import { isSupremeAdmin } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    // Strict server-side auth guard: Only Super Admin and System Admin can inspect DB status
    const auth = verifyBackendAuthorization(req, {
      requiredPermission: "view_audit_logs",
      endpointName: "/api/mysql-workbench",
    });

    if (!auth.authorized) {
      return auth.errorResponse!;
    }

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
        readOnlyMode: true,
        securityLockdown: "Arbitrary Write/Destructive SQL Execution Disabled",
      });
    }

    if (action === "table_data" && table) {
      // Validate table name against whitelist
      const allowedTables = [
        "students",
        "faculty_staff",
        "technical_trades",
        "class_routines",
        "exam_marks",
        "notices",
        "school_settings",
        "classes",
        "exam_routines",
        "result_sheets",
        "campus_gallery",
        "academic_events",
      ];

      if (!allowedTables.includes(table)) {
        return NextResponse.json(
          { success: false, error: "অননুমোদিত টেবিল অনুসন্ধান।" },
          { status: 400 }
        );
      }

      let data: any[] = [];
      if (table === "students") data = institutionalDb.students;
      else if (table === "faculty_staff") data = institutionalDb.faculty;
      else if (table === "technical_trades") data = institutionalDb.trades;
      else if (table === "class_routines") data = institutionalDb.routines;
      else if (table === "exam_marks") data = institutionalDb.marks;
      else if (table === "notices") data = institutionalDb.notices;
      else if (table === "school_settings") data = [institutionalDb.institution];
      else if (table === "classes") data = institutionalDb.classes;
      else if (table === "exam_routines") data = institutionalDb.examRoutines;
      else if (table === "result_sheets") data = institutionalDb.resultPdfs;
      else if (table === "campus_gallery") data = institutionalDb.gallery;
      else if (table === "academic_events") data = institutionalDb.events;

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
    // Server-side Super Admin authentication
    const auth = verifyBackendAuthorization(req, {
      requiredPermission: "view_audit_logs",
      endpointName: "/api/mysql-workbench",
    });

    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { action, query, config } = body;

    if (action === "update_config" && config) {
      if (!isSupremeAdmin(auth.identity.userRole)) {
        return NextResponse.json(
          { success: false, error: "কেবলমাত্র প্রধান প্রশাসক (Super Admin) কনফিগারেশন পরিবর্তন করতে পারেন।" },
          { status: 403 }
        );
      }

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
      const trimmed = String(query).trim();
      const lower = trimmed.toLowerCase();

      // STRICT SECURITY: Disallow raw destructive commands (DROP, DELETE, ALTER, TRUNCATE, INSERT, UPDATE, etc.)
      const destructiveKeywords = [
        "drop",
        "delete",
        "alter",
        "truncate",
        "insert",
        "update",
        "create",
        "replace",
        "grant",
        "revoke",
        "exec",
        "execute",
        "benchmark",
        "sleep",
      ];

      const containsDestructive = destructiveKeywords.some((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, "i");
        return regex.test(lower);
      });

      // Also disallow statement chaining (semicolon inside query)
      const hasChainedStatements = trimmed.slice(0, -1).includes(";");

      if (containsDestructive || hasChainedStatements) {
        return NextResponse.json(
          {
            success: false,
            error: "নিরাপত্তা লকডাউন: ব্রাউজার থেকে কোনো প্রকার পরিবর্তনশীল বা ঝুঁকিপূর্ণ SQL কোয়েরি (DROP, DELETE, ALTER, UPDATE ইত্যাদি) চালানো স্থায়ীভাবে নিষিদ্ধ।",
            securityAlert: "DESTRUCTIVE_SQL_BLOCKED",
          },
          { status: 403 }
        );
      }

      // Only allow SELECT, SHOW, DESCRIBE, EXPLAIN
      const isReadOnly =
        lower.startsWith("select") ||
        lower.startsWith("show") ||
        lower.startsWith("describe") ||
        lower.startsWith("explain");

      if (!isReadOnly) {
        return NextResponse.json(
          {
            success: false,
            error: "নিরাপত্তা নীতি: শুধুমাত্র নিরাপদ রিড-অনলি (SELECT, SHOW, DESCRIBE) কোয়েরি অনুমোদিত।",
          },
          { status: 400 }
        );
      }

      const result = institutionalDb.executeSQL(trimmed);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: "Invalid POST request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
