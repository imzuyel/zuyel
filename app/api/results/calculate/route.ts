import { NextResponse } from "next/server";
import { institutionalDb } from "@/lib/database";
import { ResultEngine } from "@/lib/resultEngine";
import { requireTeacherOrAdmin } from "@/lib/serverAuthGuard";
import { isAdministrator, isSupremeAdmin } from "@/lib/rbac";

export async function POST(req: Request) {
  const auth = requireTeacherOrAdmin(req, "/api/results/calculate");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { examId, classId, section, tradeId, academicYear, action } = await req.json();

    // Sensitive state mutations require Admin authorization
    if (["publish", "lock", "correct"].includes(action)) {
      if (!isAdministrator(auth.identity.userRole) && !isSupremeAdmin(auth.identity.userRole)) {
        return NextResponse.json(
          {
            success: false,
            error: "অননুমোদিত: কেবলমাত্র অ্যাডমিন বা অধ্যক্ষ ফলাফল প্রকাশ, লক বা সংশোধন করতে পারেন।",
          },
          { status: 403 }
        );
      }
    }

    if (action === "validate") {
      const validation = ResultEngine.validateExamData(Number(examId), Number(classId));
      return NextResponse.json({ success: true, ...validation });
    }

    if (action === "generate") {
      const students = institutionalDb.students.filter(
        (s) => 
          s.classId === Number(classId) && 
          (section && section !== "all" ? s.section === section : true) &&
          (tradeId && tradeId !== "all" ? s.tradeId === Number(tradeId) : true)
      );

      const calculatedResults = [];
      for (const student of students) {
        const result = ResultEngine.calculateStudentResult(student.id, Number(examId), Number(academicYear));
        if (result) {
          const idx = institutionalDb.overallResults.findIndex(r => r.id === result.id);
          if (idx !== -1) {
            institutionalDb.overallResults[idx] = result;
          } else {
            institutionalDb.overallResults.push(result);
          }
          calculatedResults.push(result);
        }
      }

      ResultEngine.calculateRanks(Number(examId), Number(classId), section === "all" ? undefined : section);

      return NextResponse.json({
        success: true,
        message: `${calculatedResults.length} জন শিক্ষার্থীর ফলাফল জেনারেট সম্পন্ন হয়েছে।`,
        results: calculatedResults,
      });
    }

    if (action === "publish") {
        const results = institutionalDb.overallResults.filter(
            r => r.examId === Number(examId) && r.classId === Number(classId)
        );
        results.forEach(r => {
            r.status = "Published";
        });
        return NextResponse.json({
            success: true,
            message: "ফলাফল সফলভাবে প্রকাশিত হয়েছে।",
        });
    }

    if (action === "lock") {
        const results = institutionalDb.overallResults.filter(
            r => r.examId === Number(examId) && r.classId === Number(classId)
        );
        results.forEach(r => {
            r.status = "Locked";
        });
        return NextResponse.json({
            success: true,
            message: "ফলাফল সফলভাবে লক করা হয়েছে।",
        });
    }

    if (action === "correct") {
        const { studentId, field, newValue, reason, correctedBy } = await req.json();
        const resultId = `${examId}_${studentId}`;
        const idx = institutionalDb.overallResults.findIndex(r => r.id === resultId);
        
        if (idx === -1) {
            return NextResponse.json({ success: false, error: "Result record not found" }, { status: 404 });
        }

        const oldResult = { ...institutionalDb.overallResults[idx] };
        const historyEntry = {
            version: oldResult.version,
            changedBy: correctedBy || "Admin",
            changedAt: new Date().toISOString(),
            reason: reason || "Manual Correction",
            oldValues: { [field]: oldResult[field as keyof typeof oldResult] }
        };

        institutionalDb.overallResults[idx] = {
            ...oldResult,
            [field]: newValue,
            version: oldResult.version + 1,
            updatedAt: new Date().toISOString(),
            updatedBy: correctedBy || "Admin",
            history: [...(oldResult.history || []), historyEntry]
        };

        return NextResponse.json({
            success: true,
            message: "ফলাফল সফলভাবে সংশোধন করা হয়েছে।",
            result: institutionalDb.overallResults[idx]
        });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
