import { NextResponse } from "next/server";
import { institutionalDb, ResultPdf } from "@/lib/database";
import {
  calculateStudentOverallGpa,
  calculateClassMeritRanks,
} from "@/lib/resultCalculation";
import {
  doesClassHaveTrade,
  parseClassNumeric,
  doesStudentMatchTrade,
} from "@/lib/academicStructure";
import { requireTeacherOrAdmin, requireAdmin } from "@/lib/serverAuthGuard";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get("query") || "").trim().slice(0, 60);
    const query = rawQuery.replace(/[^a-zA-Z0-9\-_.\s\u0980-\u09FF]/g, "").toUpperCase();

    const classIdParam = searchParams.get("classId");
    const rawTradeIdParam = searchParams.get("tradeId");
    const section = searchParams.get("section")?.trim().slice(0, 10);
    const rawRoll = searchParams.get("roll");
    const roll = rawRoll && /^\d+$/.test(rawRoll.trim()) ? Number(rawRoll.trim()) : null;

    const examName = (searchParams.get("examName") || "অর্ধবার্ষিক মূল্যায়ন ২০২৬").trim().slice(0, 100);
    const rawYear = Number(searchParams.get("academicYear") || 2026);
    const academicYear = rawYear >= 2000 && rawYear <= 2099 ? rawYear : 2026;
    const type = searchParams.get("type"); // "class-sheet" or student query

    // CASE 1: Searching for a specific student's result or marksheet
    if (query || (classIdParam && roll !== null)) {
      let matchedStudent = institutionalDb.students.find((s) => {
        if (query) {
          const matchCode = s.studentId && s.studentId.toUpperCase() === query;
          const matchAdm = s.admissionNo && s.admissionNo.toUpperCase() === query;
          const matchRoll = String(s.roll) === query;
          const matchName = s.name.toUpperCase().includes(query) || (s.nameBangla && s.nameBangla.includes(query));
          return matchCode || matchAdm || matchRoll || matchName;
        }
        if (classIdParam && roll) {
          const matchCls = s.classId === Number(classIdParam);
          const matchRoll = s.roll === Number(roll);
          const matchSec = section && section !== "all" ? s.section === section : true;
          return matchCls && matchRoll && matchSec;
        }
        return false;
      });

      if (!matchedStudent) {
        return NextResponse.json(
          {
            success: false,
            error: "প্রদত্ত রোল নম্বর বা আইডি অনুযায়ী কোনো শিক্ষার্থীর ফলাফল পাওয়া যায়নি।",
          },
          { status: 404 }
        );
      }

      // Check for persisted overall result
      const resultId = matchedStudent.id; // Usually examId_studentId, but here we search by criteria
      const persistedResult = institutionalDb.overallResults.find(r => 
        r.studentId === matchedStudent.id && 
        r.academicYear === academicYear && 
        (examName ? r.examName === examName : true)
      );

      // Fetch all marks for this student for the specified exam / academic year
      let studentMarks = institutionalDb.marks.filter(
        (m) =>
          m.studentId === matchedStudent.id &&
          (!m.academicYear || m.academicYear === academicYear) &&
          (!m.examName || m.examName === examName)
      );

      // If empty for this exam, fallback to all student marks
      if (studentMarks.length === 0) {
        studentMarks = institutionalDb.marks.filter((m) => m.studentId === matchedStudent.id);
      }

      // Calculate authoritative overall GPA (if not persisted)
      const gpaResult = calculateStudentOverallGpa(
        studentMarks.map((m) => ({
          grade: m.grade,
          gradePoint: m.gradePoint,
          totalMarks: m.totalMarks,
        }))
      );

      const totalMarksObtained = studentMarks.reduce((sum, m) => sum + (m.totalMarks || 0), 0);
      const totalMaxMarks = studentMarks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);

      return NextResponse.json({
        success: true,
        student: matchedStudent,
        marks: studentMarks,
        examName,
        academicYear,
        summary: {
          totalMarksObtained: persistedResult?.totalMarks || totalMarksObtained,
          totalMaxMarks: persistedResult?.maxMarks || totalMaxMarks,
          gpa: persistedResult?.gpa || gpaResult.gpa,
          letterGrade: persistedResult?.letterGrade || gpaResult.letterGrade,
          resultStatus: persistedResult?.resultStatus || gpaResult.resultStatus,
          totalSubjects: studentMarks.length,
          passedSubjects: studentMarks.length - (persistedResult?.failedSubjectsCount || gpaResult.failedSubjectsCount),
          failedSubjects: persistedResult?.failedSubjectsCount || gpaResult.failedSubjectsCount,
          meritPosition: persistedResult?.meritPosition || null,
          status: persistedResult?.status || "Draft",
        },
        institution: institutionalDb.institution,
      });
    }

    // CASE 2: Requesting Class Result Sheet
    if (classIdParam || type === "class-sheet") {
      const classId = Number(classIdParam || 4);
      const numericClass = parseClassNumeric(classId);
      const hasTrade = doesClassHaveTrade(numericClass);

      // Filter students in the class
      let classStudents = institutionalDb.students.filter((s) => s.classId === classId);

      // Section filtering
      if (section && section !== "all") {
        classStudents = classStudents.filter((s) => s.section === section);
      }

      // Trade filtering (Strict Academic Rule: only for Class 9-12)
      if (hasTrade && rawTradeIdParam && rawTradeIdParam !== "all") {
        classStudents = classStudents.filter((s) =>
          doesStudentMatchTrade(s.tradeId, s.tradeName, rawTradeIdParam)
        );
      }

      // Gather result data for each student
      let enteredCount = 0;
      let passedCount = 0;
      let failedCount = 0;
      let totalGpaSum = 0;

      const studentResults = classStudents.map((stu) => {
        const marksForStudent = institutionalDb.marks.filter(
          (m) =>
            m.studentId === stu.id &&
            (!m.academicYear || m.academicYear === academicYear) &&
            (!m.examName || m.examName === examName)
        );

        const persistedResult = institutionalDb.overallResults.find(r => 
          r.studentId === stu.id && 
          r.academicYear === academicYear && 
          (examName ? r.examName === examName : true)
        );

        const hasMarks = marksForStudent.length > 0;
        if (hasMarks) enteredCount++;

        const gpaCalc = calculateStudentOverallGpa(
          marksForStudent.map((m) => ({
            grade: m.grade,
            gradePoint: m.gradePoint,
            totalMarks: m.totalMarks,
          }))
        );

        const totalMarks = marksForStudent.reduce((sum, m) => sum + (m.totalMarks || 0), 0);
        const maxMarks = marksForStudent.reduce((sum, m) => sum + (m.maxMarks || 100), 0);

        const finalStatus = persistedResult?.resultStatus || (hasMarks ? gpaCalc.resultStatus : "Pending");
        const finalGpa = persistedResult?.gpa || gpaCalc.gpa;

        if (hasMarks) {
          if (finalStatus === "Passed") {
            passedCount++;
            totalGpaSum += finalGpa;
          } else {
            failedCount++;
          }
        }

        const isLocked = persistedResult?.status === "Locked" || marksForStudent.some((m) => m.isLocked);
        const isPublished = persistedResult?.status === "Published" || marksForStudent.some((m) => m.publicationStatus === "Published");

        return {
          studentId: stu.id,
          studentCode: stu.studentId,
          name: stu.name,
          nameBangla: stu.nameBangla,
          roll: stu.roll,
          className: stu.className,
          section: stu.section,
          tradeName: stu.tradeName || "সাধারণ",
          tradeNameBangla: stu.tradeNameBangla || stu.tradeName || "সাধারণ",
          attendanceRate: stu.attendanceRate || 0,
          marksCount: marksForStudent.length,
          marks: marksForStudent,
          totalMarks: persistedResult?.totalMarks || totalMarks,
          maxMarks: persistedResult?.maxMarks || maxMarks,
          gpa: finalGpa,
          numericGpa: finalGpa,
          letterGrade: persistedResult?.letterGrade || gpaCalc.letterGrade,
          resultStatus: finalStatus,
          isPassed: finalStatus === "Passed",
          meritPosition: persistedResult?.meritPosition || null,
          status: persistedResult?.status || "Draft",
          isLocked,
          isPublished,
        };
      });

      // If results were calculated/ranked, use that order. Otherwise fallback to merit ranking calculation
      const rankedResults = studentResults.some(r => r.meritPosition !== null)
        ? [...studentResults].sort((a, b) => (a.meritPosition || 9999) - (b.meritPosition || 9999))
        : calculateClassMeritRanks(studentResults);

      const pendingCount = classStudents.length - enteredCount;
      const passPercentage =
        enteredCount > 0 ? Number(((passedCount / enteredCount) * 100).toFixed(1)) : 0;
      const averageGpa =
        passedCount > 0 ? Number((totalGpaSum / passedCount).toFixed(2)) : 0;

      return NextResponse.json({
        success: true,
        academicYear,
        examName,
        classId,
        students: rankedResults,
        statistics: {
          totalStudents: classStudents.length,
          enteredStudents: enteredCount,
          pendingStudents: pendingCount,
          passedStudents: passedCount,
          failedStudents: failedCount,
          passPercentage,
          averageGpa,
        },
        exams: institutionalDb.exams,
        institution: institutionalDb.institution,
      });
    }

    // CASE 3: General Published Gazettes & PDF archive
    return NextResponse.json({
      success: true,
      pdfs: institutionalDb.resultPdfs,
      totalPdfs: institutionalDb.resultPdfs.length,
      exams: institutionalDb.exams,
      institution: institutionalDb.institution,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = requireTeacherOrAdmin(req, "/api/results");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const newPdf: ResultPdf = {
      id: Date.now(),
      title: body.title,
      className: body.className || "Class 9 (SSC Vocational)",
      tradeName: body.tradeName || "All Trades",
      examName: body.examName || "Annual Exam 2026",
      publishedDate: new Date().toISOString().slice(0, 10),
      fileSize: body.fileSize || "1.45 MB",
      fileName: body.fileName || "PTSC_Result_Gazette.pdf",
      downloadUrl: body.downloadUrl || "#",
    };

    institutionalDb.resultPdfs.unshift(newPdf);

    return NextResponse.json({
      success: true,
      pdf: newPdf,
      message: "ফলাফলের অফিশিয়াল শিট সফলভাবে ওয়েবসাইটে প্রকাশিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const auth = requireTeacherOrAdmin(req, "/api/results");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const idx = institutionalDb.resultPdfs.findIndex((r) => r.id === Number(body.id));
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: "Result pdf not found" },
        { status: 404 }
      );
    }

    const updated = {
      ...institutionalDb.resultPdfs[idx],
      ...body,
    };
    institutionalDb.resultPdfs[idx] = updated;

    return NextResponse.json({
      success: true,
      pdf: updated,
      message: "ফলাফলের রেকর্ড আপডেট সম্পন্ন হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req, "/api/results");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const initialLength = institutionalDb.resultPdfs.length;
    institutionalDb.resultPdfs = institutionalDb.resultPdfs.filter(
      (r) => r.id !== Number(id)
    );

    if (institutionalDb.resultPdfs.length === initialLength) {
      return NextResponse.json(
        { success: false, error: "PDF record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ফলাফলের গেজেট সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
