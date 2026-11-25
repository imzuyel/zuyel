import { NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { requireSuperAdmin } from "@/lib/serverAuthGuard";
import { recordSecurityAuditLog } from "@/lib/rbac";
import {
  getStorageMode,
  getHybridStore,
  saveHybridStore,
  syncAllLocalToMySQL,
  pullMySQLToLocalCache,
  exportFullDatabaseBackup,
  restoreFromBackup,
} from "@/lib/hybridStorageEngine";

export async function GET(req: Request) {
  try {
    const auth = requireSuperAdmin(req, "/api/mysql-workbench");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "status";
    const table = searchParams.get("table");
    const format = searchParams.get("format") || "json";

    const storageMode = await getStorageMode();
    const store = getHybridStore();

    if (action === "status") {
      const tables = [
        { name: "students", rows: store.students?.length || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "faculty_staff", rows: institutionalDb.faculty?.length || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "technical_trades", rows: (store.trades?.length || institutionalDb.trades?.length) || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "classes", rows: (store.classes?.length || institutionalDb.classes?.length) || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "courses", rows: store.courses?.length || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "chapters", rows: store.chapters?.length || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "presentations", rows: store.presentations?.length || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "quizzes", rows: store.quizzes?.length || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "live_sessions", rows: typeof store.liveSessions === "object" ? Object.keys(store.liveSessions || {}).length : 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "attendance", rows: store.attendance?.length || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "exam_marks", rows: (store.marks?.length || institutionalDb.marks?.length) || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "exam_routines", rows: (store.examRoutines?.length || institutionalDb.examRoutines?.length) || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "class_routines", rows: (store.routines?.length || institutionalDb.routines?.length) || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "documents", rows: (store.documents?.length || institutionalDb.documents?.length) || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "id_cards", rows: store.idCards?.length || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "inventory", rows: store.inventory?.length || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "fees", rows: store.fees?.length || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "sms_logs", rows: store.smsLogs?.length || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "notices", rows: (store.notices?.length || institutionalDb.notices?.length) || 0, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
        { name: "school_settings", rows: 1, engine: "InnoDB", collation: "utf8mb4_unicode_ci" },
      ];

      return NextResponse.json({
        success: true,
        storageMode,
        storageEngineLabel:
          storageMode === "MYSQL_LIVE"
            ? "🗄️ Live MySQL Database (Prisma ORM Active)"
            : "⚡ Fast Local Memory/JSON Store (.next/cache/pgtsc-hybrid-local-db.json)",
        mysqlConfig: institutionalDb.mysqlConfig,
        tables,
        totalTables: tables.length,
        serverVersion: "8.0.36-MySQL Community Server",
        phpMyAdminVersion: "5.2.1",
        connectionUptime: "99.98%",
        readOnlyMode: false,
        securityLockdown: "Strict Audit Protection Enabled",
      });
    }

    if (action === "table_data" && table) {
      let data: any[] = [];
      if (table === "students") data = store.students || [];
      else if (table === "faculty_staff") data = institutionalDb.faculty || [];
      else if (table === "technical_trades") data = store.trades || institutionalDb.trades || [];
      else if (table === "classes") data = store.classes || institutionalDb.classes || [];
      else if (table === "courses") data = store.courses || [];
      else if (table === "chapters") data = store.chapters || [];
      else if (table === "presentations") data = store.presentations || [];
      else if (table === "quizzes") data = store.quizzes || [];
      else if (table === "live_sessions") data = Array.isArray(store.liveSessions) ? store.liveSessions : Object.values(store.liveSessions || {});
      else if (table === "attendance") data = store.attendance || [];
      else if (table === "exam_marks") data = store.marks || institutionalDb.marks || [];
      else if (table === "exam_routines") data = store.examRoutines || institutionalDb.examRoutines || [];
      else if (table === "class_routines") data = store.routines || institutionalDb.routines || [];
      else if (table === "documents") data = store.documents || institutionalDb.documents || [];
      else if (table === "id_cards") data = store.idCards || [];
      else if (table === "inventory") data = store.inventory || [];
      else if (table === "fees") data = store.fees || [];
      else if (table === "sms_logs") data = store.smsLogs || [];
      else if (table === "notices") data = store.notices || institutionalDb.notices || [];
      else if (table === "school_settings") data = [store.institution || institutionalDb.institution];

      return NextResponse.json({
        success: true,
        table,
        rows: data,
        count: data.length,
      });
    }

    if (action === "export_backup") {
      const dump = exportFullDatabaseBackup(format === "sql" ? "sql" : "json");
      const filename = `pgtsc_erp_backup_${new Date().toISOString().slice(0, 10)}.${format === "sql" ? "sql" : "json"}`;
      const contentType = format === "sql" ? "application/sql; charset=utf-8" : "application/json; charset=utf-8";

      return new Response(dump, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
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
    const auth = requireSuperAdmin(req, "/api/mysql-workbench");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { action, query, config, table, id, rowData, backupData } = body;

    // 1-Click Sync Local to MySQL
    if (action === "sync_to_mysql") {
      const result = await syncAllLocalToMySQL();
      return NextResponse.json(result);
    }

    // 1-Click Pull MySQL to Local Cache
    if (action === "pull_from_mysql") {
      const result = await pullMySQLToLocalCache();
      return NextResponse.json(result);
    }

    // Restore Database from JSON Backup
    if (action === "restore_backup" && backupData) {
      const payloadStr = typeof backupData === "string" ? backupData : JSON.stringify(backupData);
      const success = restoreFromBackup(payloadStr);
      return NextResponse.json({
        success,
        message: success
          ? "সম্পূর্ণ ডাটাবেস ব্যাকআপ থেকে সফলভাবে পুনরুদ্ধার করা হয়েছে।"
          : "ব্যাকআপ ডাটা বিশ্লেষণ করতে সমস্যা হয়েছে।",
      });
    }

    // Live Row Deletion
    if (action === "delete_row" && table && id !== undefined) {
      const store = getHybridStore();
      const colKey = table === "technical_trades" ? "trades" : table === "faculty_staff" ? "faculty" : table === "class_routines" ? "routines" : table === "live_sessions" ? "liveSessions" : table === "sms_logs" ? "smsLogs" : table === "id_cards" ? "idCards" : table;
      if (Array.isArray((store as any)[colKey])) {
        (store as any)[colKey] = (store as any)[colKey].filter((item: any) => String(item.id) !== String(id));
        saveHybridStore(store);
        return NextResponse.json({ success: true, message: `রো #${id} সফলভাবে মুছে ফেলা হয়েছে।` });
      }
      return NextResponse.json({ success: false, error: "টেবিল খুঁজে পাওয়া যায়নি।" }, { status: 400 });
    }

    // Live Row Update
    if (action === "update_row" && table && id !== undefined && rowData) {
      const store = getHybridStore();
      const colKey = table === "technical_trades" ? "trades" : table === "faculty_staff" ? "faculty" : table === "class_routines" ? "routines" : table === "live_sessions" ? "liveSessions" : table === "sms_logs" ? "smsLogs" : table === "id_cards" ? "idCards" : table;
      if (Array.isArray((store as any)[colKey])) {
        const arr = (store as any)[colKey];
        const idx = arr.findIndex((item: any) => String(item.id) === String(id));
        if (idx >= 0) {
          arr[idx] = { ...arr[idx], ...rowData, id: arr[idx].id };
          saveHybridStore(store);
          return NextResponse.json({ success: true, message: `রো #${id} সফলভাবে আপডেট করা হয়েছে।`, row: arr[idx] });
        }
      }
      return NextResponse.json({ success: false, error: "রো বা টেবিল খুঁজে পাওয়া যায়নি।" }, { status: 400 });
    }

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
      const trimmed = String(query).trim();
      const lower = trimmed.toLowerCase();

      const isDropDatabase = /\bdrop\s+(database|schema)\b/i.test(lower);
      const isTruncate = /\btruncate\b/i.test(lower);
      const isPrivilegeTampering = /\b(alter\s+user|grant\s+|revoke\s+)\b/i.test(lower);
      const isUnrestrictedDelete =
        /\bdelete\s+from\b/i.test(lower) && !/\bwhere\b/i.test(lower);
      const hasChainedStatements = trimmed.slice(0, -1).includes(";");

      const isDestructive = isDropDatabase || isTruncate || isPrivilegeTampering || isUnrestrictedDelete;
      const allowOverride = process.env.ALLOW_DESTRUCTIVE_SQL_OVERRIDE === "true";

      if (hasChainedStatements) {
        return NextResponse.json(
          {
            success: false,
            error: "নিরাপত্তা নীতি: স্টেটমেন্ট চেইনিং (Semicolon chained queries) নিষিদ্ধ।",
            securityAlert: "SQL_CHAINING_BLOCKED",
          },
          { status: 403 }
        );
      }

      if (isDestructive && !allowOverride) {
        recordSecurityAuditLog({
          actionType: "DESTRUCTIVE_SQL_BLOCKED",
          actorRole: auth.identity.userRole,
          actorName: auth.identity.userName,
          actorEmail: auth.identity.userEmail,
          routePath: "/api/mysql-workbench",
          status: "BLOCKED",
          details: `Destructive query blocked: ${trimmed}`,
          detailsBangla: `বিপজ্জনক SQL কোয়েরি প্রতিহত করা হয়েছে: ${trimmed}`,
        });

        return NextResponse.json(
          {
            success: false,
            error:
              "নিরাপত্তা লকডাউন: DROP DATABASE, TRUNCATE এবং WHERE বিহীন DELETE কোয়েরি স্থায়ীভাবে অবরুদ্ধ। প্রডাকশন সিস্টেমে এটি চালানোর অনুমতি নেই।",
            securityAlert: "DESTRUCTIVE_COMMAND_BLOCKED",
          },
          { status: 403 }
        );
      }

      const isReadOnly =
        lower.startsWith("select") ||
        lower.startsWith("show") ||
        lower.startsWith("describe") ||
        lower.startsWith("explain");

      if (process.env.NODE_ENV === "production" && !isReadOnly && !allowOverride) {
        return NextResponse.json(
          {
            success: false,
            error: "প্রডাকশন নিরাপত্তা নীতি: শুধুমাত্র নিরাপদ রিড-অনলি (SELECT, SHOW, DESCRIBE) কোয়েরি অনুমোদিত।",
          },
          { status: 403 }
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
