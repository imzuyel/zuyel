import { NextResponse } from "next/server";
import { institutionalDb, ExamMark, ExamMarkAuditEntry } from "@/lib/database";
import { calculateContinuousAssessment, calculateGradeAndGP, isTradeApplicable } from "@/lib/utils";
import { calculateBtebContinuousBreakdown, calculateSubjectTotalAndGrade } from "@/lib/resultCalculation";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classIdParam = searchParams.get("classId");
    const rawTradeIdParam = searchParams.get("tradeId");
    const section = searchParams.get("section");
    const studentIdParam = searchParams.get("studentId");
    const subjectCode = searchParams.get("subjectCode");

    const classId = classIdParam ? Number(classIdParam) : null;
    const tradeApplicable = classId ? isTradeApplicable(classId) : true;
    const tradeId = tradeApplicable && rawTradeIdParam && rawTradeIdParam !== "all" ? Number(rawTradeIdParam) : null;

    let list = [...institutionalDb.marks];

    if (classId) {
      list = list.filter((m) => m.classId === classId || !m.classId);
    }
    if (tradeApplicable && tradeId) {
      list = list.filter((m) => m.tradeId === tradeId || !m.tradeId);
    }
    if (section) {
      list = list.filter((m) => m.section === section || !m.section);
    }
    if (studentIdParam) {
      list = list.filter((m) => m.studentId === Number(studentIdParam));
    }
    if (subjectCode) {
      list = list.filter((m) => m.subjectCode.toLowerCase() === subjectCode.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      marks: list,
      total: list.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Handle Batch Save (e.g. from MarksEntryView)
    if (body.batch && Array.isArray(body.items)) {
      const { items, subjectCode, subjectName, subjectNameBangla, maxMarks = 100, passMarks = 33, assessmentDates } = body;
      let savedCount = 0;

      for (const item of items) {
        const student = institutionalDb.students.find((s) => s.id === Number(item.studentId));
        if (!student) continue;

        const subCode = item.subjectCode || subjectCode || "IT-901";
        const subName = item.subjectName || subjectName || "বিষয়";
        const subNameBn = item.subjectNameBangla || subjectNameBangla || subName;

        // Calculate continuous assessment breakdown
        const breakdown = calculateBtebContinuousBreakdown({
          quizzes: item.quizzes,
          classTests: item.classTests,
          midtermTheory: item.midtermTheory,
          assignment: item.assignment,
          tcAttendanceConduct: item.tcAttendanceConduct,
          jobs: item.jobs,
          midtermPractical: item.midtermPractical,
          report: item.report,
          viva: item.viva,
          pcAttendanceConduct: item.pcAttendanceConduct,
          totalAttendance: item.totalAttendance,
        });

        const continuousVal = item.continuousAssessment !== undefined && item.continuousAssessment !== ""
          ? Number(item.continuousAssessment)
          : breakdown.totalContinuous;

        const theoryVal = Number(item.theoryMarks || 0);
        const practicalVal = Number(item.practicalMarks || 0);

        const evaluation = calculateSubjectTotalAndGrade({
          theoryMarks: theoryVal,
          practicalMarks: practicalVal,
          continuousAssessment: continuousVal,
          maxMarks,
          passMarks,
        });

        // Check if existing record exists
        const existingIndex = institutionalDb.marks.findIndex(
          (m) => m.studentId === student.id && m.subjectCode.toLowerCase() === subCode.toLowerCase()
        );

        const datesToSave = item.assessmentDates || assessmentDates;

        if (existingIndex !== -1) {
          institutionalDb.marks[existingIndex] = {
            ...institutionalDb.marks[existingIndex],
            totalAttendance: item.totalAttendance ?? institutionalDb.marks[existingIndex].totalAttendance,
            quizzes: item.quizzes ?? institutionalDb.marks[existingIndex].quizzes,
            quizTotal: breakdown.quizTotal,
            classTests: item.classTests ?? institutionalDb.marks[existingIndex].classTests,
            classTestTotal: breakdown.classTestTotal,
            tcAttendanceConduct: item.tcAttendanceConduct !== undefined ? Number(item.tcAttendanceConduct) : institutionalDb.marks[existingIndex].tcAttendanceConduct,
            midtermTheory: item.midtermTheory !== undefined ? Number(item.midtermTheory) : institutionalDb.marks[existingIndex].midtermTheory,
            assignment: item.assignment !== undefined ? Number(item.assignment) : institutionalDb.marks[existingIndex].assignment,
            tcTotal: breakdown.tcTotal,

            jobs: item.jobs ?? institutionalDb.marks[existingIndex].jobs,
            jobsTotal: breakdown.jobsTotal,
            midtermPractical: item.midtermPractical !== undefined ? Number(item.midtermPractical) : institutionalDb.marks[existingIndex].midtermPractical,
            report: item.report !== undefined ? Number(item.report) : institutionalDb.marks[existingIndex].report,
            viva: item.viva !== undefined ? Number(item.viva) : institutionalDb.marks[existingIndex].viva,
            pcAttendanceConduct: item.pcAttendanceConduct !== undefined ? Number(item.pcAttendanceConduct) : institutionalDb.marks[existingIndex].pcAttendanceConduct,
            pcTotal: breakdown.pcTotal,

            assessmentDates: datesToSave ?? institutionalDb.marks[existingIndex].assessmentDates,
            continuousAssessment: continuousVal,
            theoryMarks: theoryVal,
            finalMarks: practicalVal,
            totalMarks: evaluation.totalMarks,
            grade: evaluation.grade,
            gradePoint: evaluation.gradePoint,
          };
        } else {
          const newRecord: ExamMark = {
            id: Date.now() + Math.floor(Math.random() * 10000),
            studentId: student.id,
            studentCode: student.studentId,
            studentName: student.name,
            roll: student.roll,
            classId: item.classId || student.classId,
            tradeId: item.tradeId || student.tradeId,
            tradeCode: item.tradeCode || student.tradeName,
            section: item.section || student.section || "A",
            subjectCode: subCode,
            subjectName: subName,
            subjectNameBangla: subNameBn,

            totalAttendance: item.totalAttendance,
            quizzes: item.quizzes || [],
            quizTotal: breakdown.quizTotal,
            classTests: item.classTests || [],
            classTestTotal: breakdown.classTestTotal,
            tcAttendanceConduct: item.tcAttendanceConduct ? Number(item.tcAttendanceConduct) : 0,
            midtermTheory: item.midtermTheory ? Number(item.midtermTheory) : 0,
            assignment: item.assignment ? Number(item.assignment) : 0,
            tcTotal: breakdown.tcTotal,

            jobs: item.jobs || [],
            jobsTotal: breakdown.jobsTotal,
            midtermPractical: item.midtermPractical ? Number(item.midtermPractical) : 0,
            report: item.report ? Number(item.report) : 0,
            viva: item.viva ? Number(item.viva) : 0,
            pcAttendanceConduct: item.pcAttendanceConduct ? Number(item.pcAttendanceConduct) : 0,
            pcTotal: breakdown.pcTotal,

            assessmentDates: datesToSave,
            ctAvg: breakdown.classTestTotal,
            quizAvg: breakdown.quizTotal,
            practicalAvg: breakdown.jobsTotal,
            continuousAssessment: continuousVal,
            theoryMarks: theoryVal,
            finalMarks: practicalVal,
            totalMarks: evaluation.totalMarks,
            grade: evaluation.grade,
            gradePoint: evaluation.gradePoint,
            isLocked: false,
            publicationStatus: "Draft",
          };
          institutionalDb.marks.push(newRecord);
        }
        savedCount++;
      }

      return NextResponse.json({
        success: true,
        savedCount,
        message: `সফলভাবে ${savedCount} জন শিক্ষার্থীর নম্বর ও মূল্যায়ন সংরক্ষিত হয়েছে।`,
      });
    }

    // 2. Handle Single Record POST
    const {
      studentId,
      subjectCode,
      quizzes = [],
      classTests = [],
      practicals = [],
      jobs = [],
      midtermTheory = 0,
      midtermPractical = 0,
      assignment = 0,
      tcAttendanceConduct = 0,
      pcAttendanceConduct = 0,
      report = 0,
      viva = 0,
      totalAttendance,
      theoryMarks = 0,
      finalMarks = 0,
      classId,
      tradeId,
      section = "A",
      assessmentDates,
    } = body;

    const student = institutionalDb.students.find((s) => s.id === Number(studentId));
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const breakdown = calculateBtebContinuousBreakdown({
      quizzes,
      classTests,
      midtermTheory,
      assignment,
      tcAttendanceConduct,
      jobs,
      midtermPractical,
      report,
      viva,
      pcAttendanceConduct,
      totalAttendance,
    });

    const continuousAssessment = breakdown.totalContinuous;
    const totalMarks = Number((continuousAssessment + Number(theoryMarks) + Number(finalMarks)).toFixed(2));
    const { grade, gradePoint } = calculateGradeAndGP(totalMarks);

    const existingIndex = institutionalDb.marks.findIndex(
      (m) => m.studentId === Number(studentId) && m.subjectCode.toLowerCase() === subjectCode.toLowerCase()
    );

    let updatedOrNewMark: ExamMark;

    if (existingIndex !== -1) {
      institutionalDb.marks[existingIndex] = {
        ...institutionalDb.marks[existingIndex],
        totalAttendance,
        quizzes,
        quizTotal: breakdown.quizTotal,
        classTests,
        classTestTotal: breakdown.classTestTotal,
        tcAttendanceConduct: Number(tcAttendanceConduct),
        midtermTheory: Number(midtermTheory),
        assignment: Number(assignment),
        tcTotal: breakdown.tcTotal,

        jobs,
        jobsTotal: breakdown.jobsTotal,
        midtermPractical: Number(midtermPractical),
        report: Number(report),
        viva: Number(viva),
        pcAttendanceConduct: Number(pcAttendanceConduct),
        pcTotal: breakdown.pcTotal,

        assessmentDates: assessmentDates ?? institutionalDb.marks[existingIndex].assessmentDates,
        practicals,
        quizAvg: breakdown.quizTotal,
        ctAvg: breakdown.classTestTotal,
        practicalAvg: breakdown.jobsTotal,
        continuousAssessment,
        theoryMarks: Number(theoryMarks),
        finalMarks: Number(finalMarks),
        totalMarks,
        grade,
        gradePoint,
      };
      updatedOrNewMark = institutionalDb.marks[existingIndex];
    } else {
      updatedOrNewMark = {
        id: Date.now(),
        studentId: student.id,
        studentCode: student.studentId,
        studentName: student.name,
        roll: student.roll,
        classId: classId || student.classId,
        tradeId: tradeId || student.tradeId,
        section,
        subjectCode: subjectCode || "IT-901",
        subjectName: body.subjectName || "Subject",
        subjectNameBangla: body.subjectNameBangla || body.subjectName || "বিষয়",
        totalAttendance,
        quizzes,
        quizTotal: breakdown.quizTotal,
        classTests,
        classTestTotal: breakdown.classTestTotal,
        tcAttendanceConduct: Number(tcAttendanceConduct),
        midtermTheory: Number(midtermTheory),
        assignment: Number(assignment),
        tcTotal: breakdown.tcTotal,

        jobs,
        jobsTotal: breakdown.jobsTotal,
        midtermPractical: Number(midtermPractical),
        report: Number(report),
        viva: Number(viva),
        pcAttendanceConduct: Number(pcAttendanceConduct),
        pcTotal: breakdown.pcTotal,

        assessmentDates,
        practicals,
        quizAvg: breakdown.quizTotal,
        ctAvg: breakdown.classTestTotal,
        practicalAvg: breakdown.jobsTotal,
        continuousAssessment,
        theoryMarks: Number(theoryMarks),
        finalMarks: Number(finalMarks),
        totalMarks,
        grade,
        gradePoint,
      };
      institutionalDb.marks.push(updatedOrNewMark);
    }

    return NextResponse.json({
      success: true,
      mark: updatedOrNewMark,
      message: "নম্বর ও মূল্যায়ন সফলভাবে সংরক্ষিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { markId, theoryMarks, practicalMarks, continuousAssessment, reason, changedBy = "Admin" } = body;

    const existingIndex = institutionalDb.marks.findIndex((m) => m.id === Number(markId));
    if (existingIndex === -1) {
      return NextResponse.json({ success: false, error: "Mark record not found" }, { status: 404 });
    }

    const current = institutionalDb.marks[existingIndex];
    const th = theoryMarks !== undefined ? Number(theoryMarks) : current.theoryMarks;
    const pr = practicalMarks !== undefined ? Number(practicalMarks) : current.finalMarks;
    const ca = continuousAssessment !== undefined ? Number(continuousAssessment) : current.continuousAssessment;

    const total = Number((th + pr + ca).toFixed(2));
    const { grade, gradePoint } = calculateGradeAndGP(total);

    const auditEntry: ExamMarkAuditEntry = {
      id: "audit_" + Date.now(),
      timestamp: new Date().toISOString(),
      changedBy,
      action: "correct",
      previousMarks: {
        theoryMarks: current.theoryMarks,
        practicalMarks: current.finalMarks,
        continuousAssessment: current.continuousAssessment,
        totalMarks: current.totalMarks,
        grade: current.grade,
      },
      newMarks: {
        theoryMarks: th,
        practicalMarks: pr,
        continuousAssessment: ca,
        totalMarks: total,
        grade,
      },
      reason: reason || "Manual Correction",
    };

    institutionalDb.marks[existingIndex] = {
      ...current,
      theoryMarks: th,
      finalMarks: pr,
      continuousAssessment: ca,
      totalMarks: total,
      grade,
      gradePoint,
      auditHistory: [...(current.auditHistory || []), auditEntry],
    };

    return NextResponse.json({
      success: true,
      mark: institutionalDb.marks[existingIndex],
      message: "নম্বর সফলভাবে সংশোধন করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
