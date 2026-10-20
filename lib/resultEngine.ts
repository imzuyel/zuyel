import { institutionalDb, StudentOverallResult, ExamMark, GradingScheme, ResultPolicy } from "./database";

export class ResultEngine {
  /**
   * Authoritative calculation for a single student's overall result in an exam.
   */
  static calculateStudentResult(
    studentId: number,
    examId: number,
    academicYear: number
  ): StudentOverallResult | null {
    const student = institutionalDb.students.find((s) => s.id === studentId);
    const exam = institutionalDb.exams.find((e) => e.id === examId);
    if (!student || !exam) return null;

    // 1. Fetch all marks for this student and exam
    const studentMarks = institutionalDb.marks.filter(
      (m) => m.studentId === studentId && m.examId === examId
    );

    if (studentMarks.length === 0) return null;

    // 2. Fetch active policy and grading scheme
    const policy = institutionalDb.resultPolicies.find((p) => p.academicYear === academicYear) || {
      passPolicy: "mixed",
      gpaPrecision: 2,
    } as ResultPolicy;

    const schemes = institutionalDb.gradingSchemes.filter((s) => s.academicYear === academicYear);

    // 3. Aggregate subject totals and determine pass/fail per subject
    let totalMarks = 0;
    let totalMaxMarks = 0;
    let totalPoints = 0;
    let failedSubjectsCount = 0;
    const failedSubjects: any[] = [];
    let isAbsent = studentMarks.every(m => m.theoryMarks === 0 && m.practicalMarks === 0 && m.continuousAssessment === 0);

    studentMarks.forEach((m) => {
      totalMarks += m.totalMarks || 0;
      totalMaxMarks += m.maxMarks || 100;
      
      // Determine if passed subject based on policy
      const passMarks = m.passMarks || 33;
      const isPass = (m.totalMarks || 0) >= passMarks;

      if (!isPass) {
        failedSubjectsCount++;
        failedSubjects.push({
          code: m.subjectCode,
          name: m.subjectNameBangla || m.subjectName,
          marks: m.totalMarks,
          passMarks: passMarks,
        });
      }

      totalPoints += m.gradePoint || 0;
    });

    // 4. GPA Calculation
    const gpa = Number((totalPoints / studentMarks.length).toFixed(policy.gpaPrecision || 2));
    
    // 5. Overall Letter Grade
    const letterGrade = this.getGradeFromPoint(gpa, schemes);

    // 6. Overall Result Status
    let resultStatus: StudentOverallResult["resultStatus"] = "Passed";
    if (isAbsent) {
      resultStatus = "Absent";
    } else if (failedSubjectsCount > 0) {
      resultStatus = "Failed";
    }

    const resultId = `${examId}_${studentId}`;
    const existing = institutionalDb.overallResults.find(r => r.id === resultId);

    const result: StudentOverallResult = {
      id: resultId,
      examId,
      examName: exam.nameBangla || exam.name,
      studentId,
      studentCode: student.studentId,
      studentName: student.name,
      roll: student.roll,
      classId: student.classId,
      className: student.className,
      section: student.section,
      tradeId: student.tradeId,
      tradeName: student.tradeName,
      academicYear,
      totalMarks,
      maxMarks: totalMaxMarks,
      gpa,
      letterGrade,
      resultStatus,
      failedSubjectsCount,
      failedSubjects,
      meritPosition: existing?.meritPosition || null,
      status: "Calculated",
      version: (existing?.version || 0) + 1,
      updatedBy: "System Engine",
      updatedAt: new Date().toISOString(),
    };

    return result;
  }

  static calculateRanks(examId: number, classId: number, section?: string): void {
    const results = institutionalDb.overallResults.filter(
      (r) => r.examId === examId && r.classId === classId && (section ? r.section === section : true)
    );

    results.sort((a, b) => {
      if (b.gpa !== a.gpa) return b.gpa - a.gpa;
      if (b.totalMarks !== a.totalMarks) return b.totalMarks - a.totalMarks;
      return a.roll - b.roll;
    });

    results.forEach((r, index) => {
      r.meritPosition = index + 1;
    });
  }

  private static getGradeFromPoint(point: number, schemes: GradingScheme[]): string {
    if (schemes.length === 0) return "N/A";
    const match = [...schemes].sort((a,b) => b.point - a.point).find((s) => point >= s.point);
    return match ? match.grade : "F";
  }

  static validateExamData(examId: number, classId: number): { status: "error" | "warning" | "success"; messages: string[] } {
    const students = institutionalDb.students.filter(s => s.classId === classId);
    const marks = institutionalDb.marks.filter(m => m.examId === examId && m.classId === classId);
    
    const messages: string[] = [];
    let hasError = false;

    if (students.length === 0) {
      messages.push("No students found in this class.");
      return { status: "error", messages };
    }

    const studentsWithMarks = new Set(marks.map(m => m.studentId));
    const missingCount = students.length - studentsWithMarks.size;

    if (missingCount > 0) {
      messages.push(`${missingCount} students have no marks entered.`);
      hasError = true;
    }

    if (hasError) return { status: "error", messages };
    if (messages.length > 0) return { status: "warning", messages };
    
    return { status: "success", messages: ["All data validated successfully."] };
  }
}
