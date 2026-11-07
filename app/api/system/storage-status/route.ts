import { NextRequest, NextResponse } from "next/server";
import {
  getStorageMode,
  getConfiguredStorageMode,
  setStorageMode,
  isMySQLConnected,
  getHybridStore,
  syncLocalMemoryToMySQL,
  StorageMode,
} from "@/lib/hybridStorageEngine";

export async function GET() {
  try {
    const activeMode = await getStorageMode();
    const configuredMode = getConfiguredStorageMode();
    const mysqlConnected = await isMySQLConnected();
    const store = getHybridStore();

    return NextResponse.json({
      success: true,
      mode: activeMode,
      configuredMode,
      mysqlConnected,
      counts: {
        students: store.students?.length || 0,
        courses: store.courses?.length || 0,
        chapters: store.chapters?.length || 0,
        presentations: store.presentations?.length || 0,
        quizzes: store.quizzes?.length || 0,
        liveSessions: Object.keys(store.liveSessions || {}).length,
        attendanceRecords: store.attendance?.length || 0,
        quizResults: store.quizResults?.length || 0,
      },
      lastSync: store.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch storage status",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, mode } = body;

    if (action === "SWITCH_MODE" && mode) {
      if (!["AUTO", "LOCAL_MEMORY", "MYSQL_LIVE"].includes(mode)) {
        return NextResponse.json(
          { success: false, message: "Invalid storage mode specified." },
          { status: 400 }
        );
      }

      setStorageMode(mode as StorageMode);
      const newActiveMode = await getStorageMode();
      const mysqlConnected = await isMySQLConnected();

      return NextResponse.json({
        success: true,
        message: `স্টোরেজ মোড সফলভাবে পরিবর্তিত হয়েছে: ${mode}`,
        mode: newActiveMode,
        configuredMode: mode,
        mysqlConnected,
      });
    }

    if (action === "SYNC_TO_MYSQL") {
      const syncResult = await syncLocalMemoryToMySQL();
      const activeMode = await getStorageMode();

      return NextResponse.json({
        success: syncResult.success,
        message: syncResult.message,
        syncedStudents: syncResult.syncedStudents,
        syncedCourses: syncResult.syncedCourses,
        syncedQuizzes: syncResult.syncedQuizzes,
        errors: syncResult.errors,
        mode: activeMode,
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action. Supported: 'SWITCH_MODE' or 'SYNC_TO_MYSQL'." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Storage action failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

