/**
 * BTEB & Bangladesh National Curriculum Standard Result & Marks Calculation Engine
 * 
 * Rules:
 * 1. BTEB Grading Scale:
 *    80% - 100% : A+ (5.00)
 *    70% - 79.99% : A (4.00)
 *    60% - 69.99% : A- (3.50)
 *    50% - 59.99% : B (3.00)
 *    40% - 49.99% : C (2.00)
 *    33% - 39.99% : D (1.00)
 *    0%  - 32.99% : F (0.00)
 * 
 * 2. Component-wise Pass:
 *    - Theory Final must be >= 33% of its full marks (if applicable).
 *    - Practical Final must be >= 33% of its full marks (if applicable).
 *    - If any component fails or overall subject marks < 33%, Subject Grade is 'F' (GP 0.00).
 * 
 * 3. Overall GPA Calculation:
 *    - If any subject has Grade 'F', overall GPA is 0.00 and status is 'Failed'.
 *    - Otherwise, GPA = sum(grade points of subjects) / count(subjects).
 *    - Capped at 5.00.
 */

export interface GradeResult {
  grade: "A+" | "A" | "A-" | "B" | "C" | "D" | "F";
  gradePoint: number;
  remarks: string;
}

export const GRADING_SCALE = [
  { grade: "A+", minMark: 80, maxMark: 100, point: 5.0, remarks: "Outstanding (অসাধারণ)" },
  { grade: "A", minMark: 70, maxMark: 79, point: 4.0, remarks: "Excellent (চমৎকার)" },
  { grade: "A-", minMark: 60, maxMark: 69, point: 3.5, remarks: "Very Good (খুব ভালো)" },
  { grade: "B", minMark: 50, maxMark: 59, point: 3.0, remarks: "Good (ভালো)" },
  { grade: "C", minMark: 40, maxMark: 49, point: 2.0, remarks: "Satisfactory (সন্তোষজনক)" },
  { grade: "D", minMark: 33, maxMark: 39, point: 1.0, remarks: "Pass (উত্তীর্ণ)" },
  { grade: "F", minMark: 0, maxMark: 32, point: 0.0, remarks: "Fail (অনুত্তীর্ণ)" },
];

export interface SubjectMarksInput {
  continuousTheory?: number | null;
  finalTheory?: number | null;
  continuousPractical?: number | null;
  finalPractical?: number | null;
  fullMarks?: number;
  theoryFullMarks?: number;
  practicalFullMarks?: number;
  // Flexible aliases for entry view
  theoryMarks?: number | null;
  practicalMarks?: number | null;
  continuousAssessment?: number | null;
  maxMarks?: number;
  passMarks?: number;

  // Detailed BTEB Continuous Assessment Fields (হুবহু ছবির কাঠামো)
  quizzes?: (number | string | null | undefined)[];
  classTests?: (number | string | null | undefined)[];
  midtermTheory?: number | string | null | undefined;
  assignment?: number | string | null | undefined;
  tcAttendanceConduct?: number | string | null | undefined;

  jobs?: (number | string | null | undefined)[];
  midtermPractical?: number | string | null | undefined;
  report?: number | string | null | undefined;
  viva?: number | string | null | undefined;
  pcAttendanceConduct?: number | string | null | undefined;
  totalAttendance?: number | string | null | undefined;
}

export interface BtebContinuousEvaluationBreakdown {
  quizTotal: number;
  quizCount: number;
  classTestTotal: number;
  classTestCount: number;
  tcAttendanceConduct: number;
  midtermTheory: number;
  assignment: number;
  tcTotal: number; // তাত্ত্বিক ধারাবাহিক মোট

  jobsTotal: number;
  jobsCount: number;
  midtermPractical: number;
  report: number;
  viva: number;
  pcAttendanceConduct: number;
  pcTotal: number; // ব্যবহারিক ধারাবাহিক মোট

  totalContinuous: number; // মোট ধারাবাহিক মূল্যায়ন (TC + PC)
}

/**
 * Calculates BTEB Continuous Assessment according to official BTEB Vocational Act:
 * Theory Continuous (TC) = Quiz + Class Test + Mid-term + Assignment + Attendance & Conduct
 * Practical Continuous (PC) = Jobs (1-8) + Mid-term Practical + Report + Viva + Attendance & Conduct
 */
export function calculateBtebContinuousBreakdown(
  input: {
    quizzes?: (number | string | null | undefined)[];
    classTests?: (number | string | null | undefined)[];
    midtermTheory?: number | string | null | undefined;
    assignment?: number | string | null | undefined;
    tcAttendanceConduct?: number | string | null | undefined;

    jobs?: (number | string | null | undefined)[];
    midtermPractical?: number | string | null | undefined;
    report?: number | string | null | undefined;
    viva?: number | string | null | undefined;
    pcAttendanceConduct?: number | string | null | undefined;
    totalAttendance?: number | string | null | undefined;
  },
  scalingOptions?: {
    tcMax?: number;
    pcMax?: number;
    scaleToMax?: boolean;
  }
): BtebContinuousEvaluationBreakdown {
  const parseNum = (val: any): number => {
    if (val === null || val === undefined || val === "") return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : Math.max(0, n);
  };

  // Quizzes (১ম, ২য়, ৩য়, ৪র্থ কুইজ)
  const qList = (input.quizzes || []).map(parseNum);
  const quizTotal = qList.reduce((a, b) => a + b, 0);
  const quizCount = qList.filter((v) => v > 0).length;

  // Class Tests (১ম, ২য়, ৩য়, ৪র্থ ক্লাস টেস্ট)
  const ctList = (input.classTests || []).map(parseNum);
  const classTestTotal = ctList.reduce((a, b) => a + b, 0);
  const classTestCount = ctList.filter((v) => v > 0).length;

  // Midterm Theory, Assignment, Attendance
  const midtermTheory = parseNum(input.midtermTheory);
  const assignment = parseNum(input.assignment);
  const tcAttendanceConduct = parseNum(input.tcAttendanceConduct);

  // Raw Theory Continuous Total
  let tcTotal = quizTotal + classTestTotal + midtermTheory + assignment + tcAttendanceConduct;

  // Jobs (১ম থেকে ৮ম ব্যবহারিক জব)
  const jobList = (input.jobs || []).map(parseNum);
  const jobsTotal = jobList.reduce((a, b) => a + b, 0);
  const jobsCount = jobList.filter((v) => v > 0).length;

  // Practical Midterm, Report, Viva, Practical Attendance
  const midtermPractical = parseNum(input.midtermPractical);
  const report = parseNum(input.report);
  const viva = parseNum(input.viva);
  const pcAttendanceConduct = parseNum(input.pcAttendanceConduct);

  // Raw Practical Continuous Total
  let pcTotal = jobsTotal + midtermPractical + report + viva + pcAttendanceConduct;

  // Optional scaling to subject max limits if specified
  if (scalingOptions?.scaleToMax) {
    if (scalingOptions.tcMax && tcTotal > scalingOptions.tcMax) {
      tcTotal = scalingOptions.tcMax;
    }
    if (scalingOptions.pcMax && pcTotal > scalingOptions.pcMax) {
      pcTotal = scalingOptions.pcMax;
    }
  }

  const totalContinuous = Number((tcTotal + pcTotal).toFixed(2));

  return {
    quizTotal: Number(quizTotal.toFixed(1)),
    quizCount,
    classTestTotal: Number(classTestTotal.toFixed(1)),
    classTestCount,
    tcAttendanceConduct: Number(tcAttendanceConduct.toFixed(1)),
    midtermTheory: Number(midtermTheory.toFixed(1)),
    assignment: Number(assignment.toFixed(1)),
    tcTotal: Number(tcTotal.toFixed(1)),

    jobsTotal: Number(jobsTotal.toFixed(1)),
    jobsCount,
    midtermPractical: Number(midtermPractical.toFixed(1)),
    report: Number(report.toFixed(1)),
    viva: Number(viva.toFixed(1)),
    pcAttendanceConduct: Number(pcAttendanceConduct.toFixed(1)),
    pcTotal: Number(pcTotal.toFixed(1)),

    totalContinuous,
  };
}

export interface SubjectEvaluationResult extends GradeResult {
  totalMarks: number;
  isPassed: boolean;
  status: "Passed" | "Failed";
  failedReason?: string;
}

/**
 * Maps percentage to BTEB Letter Grade and Grade Point
 */
export function calculateGradeAndGP(obtainedMarks: number, fullMarks: number = 100): GradeResult {
  if (fullMarks <= 0) {
    return { grade: "F", gradePoint: 0.0, remarks: "Invalid Full Marks" };
  }

  const percentage = (obtainedMarks / fullMarks) * 100;

  if (percentage >= 80) {
    return { grade: "A+", gradePoint: 5.0, remarks: "Outstanding (অসাধারণ)" };
  } else if (percentage >= 70) {
    return { grade: "A", gradePoint: 4.0, remarks: "Excellent (চমৎকার)" };
  } else if (percentage >= 60) {
    return { grade: "A-", gradePoint: 3.5, remarks: "Very Good (খুব ভালো)" };
  } else if (percentage >= 50) {
    return { grade: "B", gradePoint: 3.0, remarks: "Good (ভালো)" };
  } else if (percentage >= 40) {
    return { grade: "C", gradePoint: 2.0, remarks: "Satisfactory (সন্তোষজনক)" };
  } else if (percentage >= 33) {
    return { grade: "D", gradePoint: 1.0, remarks: "Pass (উত্তীর্ণ)" };
  } else {
    return { grade: "F", gradePoint: 0.0, remarks: "Fail (অনুত্তীর্ণ)" };
  }
}

/**
 * Calculates subject marks (supports Theory, Practical, Continuous Assessment components)
 * with individual component thresholds and overall subject grading.
 */
export function calculateSubjectTotalAndGrade(
  components: SubjectMarksInput,
  fullMarks?: number
): SubjectEvaluationResult {
  const max = fullMarks ?? components.maxMarks ?? components.fullMarks ?? 100;
  const pass = components.passMarks ?? 33;

  let totalMarks = 0;
  
  // Calculate continuous assessment if detailed components are provided
  let continuousVal = Number(components.continuousAssessment) || 0;
  if (
    (components.quizzes && components.quizzes.length > 0) ||
    (components.classTests && components.classTests.length > 0) ||
    components.midtermTheory !== undefined ||
    (components.jobs && components.jobs.length > 0) ||
    components.midtermPractical !== undefined ||
    components.assignment !== undefined
  ) {
    const breakdown = calculateBtebContinuousBreakdown(components);
    if (!components.continuousAssessment && components.continuousAssessment !== 0) {
      continuousVal = breakdown.totalContinuous;
    }
  }

  if (
    components.theoryMarks !== undefined ||
    components.practicalMarks !== undefined ||
    components.continuousAssessment !== undefined ||
    continuousVal > 0
  ) {
    const th = Number(components.theoryMarks) || 0;
    const pr = Number(components.practicalMarks) || 0;
    const ca = continuousVal;
    totalMarks = th + pr + ca;
  } else {
    const tc = Number(components.continuousTheory) || 0;
    const tf = Number(components.finalTheory) || 0;
    const pc = Number(components.continuousPractical) || 0;
    const pf = Number(components.finalPractical) || 0;
    totalMarks = tc + tf + pc + pf;
  }

  let failedReason: string | undefined;
  const baseGrade = calculateGradeAndGP(totalMarks, max);
  if (totalMarks < pass || baseGrade.grade === "F") {
    failedReason = "মোট নম্বর ৩৩% এর কম";
  }

  const isPassed = !failedReason && baseGrade.grade !== "F";

  return {
    totalMarks: Math.round(totalMarks * 100) / 100,
    grade: isPassed ? baseGrade.grade : "F",
    gradePoint: isPassed ? baseGrade.gradePoint : 0.0,
    remarks: isPassed ? baseGrade.remarks : "Fail (অনুত্তীর্ণ)",
    isPassed,
    status: isPassed ? "Passed" : "Failed",
    failedReason,
  };
}

/**
 * Overall Student GPA & Status Calculator
 */
export function calculateStudentOverallGpa(
  subjects: Array<{
    grade: string;
    gradePoint: number;
    isOptional?: boolean;
    totalMarks?: number;
  }>
): {
  gpa: number;
  numericGpa: number;
  letterGrade: "A+" | "A" | "A-" | "B" | "C" | "D" | "F";
  isPassed: boolean;
  resultStatus: "Passed" | "Failed" | "Pending";
  totalMarks: number;
  failedSubjectsCount: number;
  failedSubjects: number;
  passedSubjects: number;
  statusText: string;
} {
  if (!subjects || subjects.length === 0) {
    return {
      gpa: 0.0,
      numericGpa: 0.0,
      letterGrade: "F",
      isPassed: false,
      resultStatus: "Pending",
      totalMarks: 0,
      failedSubjectsCount: 0,
      failedSubjects: 0,
      passedSubjects: 0,
      statusText: "তথ্য নেই (No Data)",
    };
  }

  let totalMarks = 0;
  let totalGradePoints = 0;
  let regularSubjectsCount = 0;
  let failedSubjectsCount = 0;

  for (const s of subjects) {
    totalMarks += Number(s.totalMarks || 0);

    if (s.isOptional) {
      // 4th subject logic in Bangladesh curriculum: GP above 2.00 is added as bonus
      const bonusGp = Math.max(0, (s.gradePoint || 0) - 2.0);
      totalGradePoints += bonusGp;
    } else {
      regularSubjectsCount += 1;
      totalGradePoints += Number(s.gradePoint || 0);
      if (s.grade === "F" || (s.gradePoint || 0) === 0) {
        failedSubjectsCount += 1;
      }
    }
  }

  if (failedSubjectsCount > 0 || regularSubjectsCount === 0) {
    return {
      gpa: 0.0,
      numericGpa: 0.0,
      letterGrade: "F",
      isPassed: false,
      resultStatus: "Failed",
      totalMarks: Math.round(totalMarks * 10) / 10,
      failedSubjectsCount,
      failedSubjects: failedSubjectsCount,
      passedSubjects: Math.max(0, subjects.length - failedSubjectsCount),
      statusText: `অনুত্তীর্ণ (${failedSubjectsCount} বিষয়ে ফেইল)`,
    };
  }

  const rawGpa = totalGradePoints / regularSubjectsCount;
  const cappedGpa = Math.min(5.0, Math.round(rawGpa * 100) / 100);

  // Overall letter grade from GPA
  let letterGrade: "A+" | "A" | "A-" | "B" | "C" | "D" | "F" = "F";
  if (cappedGpa >= 5.0) letterGrade = "A+";
  else if (cappedGpa >= 4.0) letterGrade = "A";
  else if (cappedGpa >= 3.5) letterGrade = "A-";
  else if (cappedGpa >= 3.0) letterGrade = "B";
  else if (cappedGpa >= 2.0) letterGrade = "C";
  else if (cappedGpa >= 1.0) letterGrade = "D";

  return {
    gpa: cappedGpa,
    numericGpa: cappedGpa,
    letterGrade,
    isPassed: true,
    resultStatus: "Passed",
    totalMarks: Math.round(totalMarks * 10) / 10,
    failedSubjectsCount: 0,
    failedSubjects: 0,
    passedSubjects: subjects.length,
    statusText: "উত্তীর্ণ (Passed)",
  };
}

/**
 * Calculates merit positions (মেধা স্থান) for a class or section:
 * Tie-breaker hierarchy:
 * 1. Higher GPA
 * 2. Higher Total Marks
 * 3. Roll Number
 */
export function calculateClassMeritRanks<T extends { gpa?: number; totalMarks?: number; isPassed?: boolean; roll?: number | string }>(
  students: T[]
): (T & { meritPosition: number | null })[] {
  // Sort passed students first, by GPA desc, then totalMarks desc, then roll asc
  const passedStudents = students.filter((s) => s.isPassed);
  const failedStudents = students.filter((s) => !s.isPassed);

  passedStudents.sort((a, b) => {
    const gpaA = a.gpa ?? 0;
    const gpaB = b.gpa ?? 0;
    if (gpaB !== gpaA) {
      return gpaB - gpaA;
    }
    const marksA = a.totalMarks ?? 0;
    const marksB = b.totalMarks ?? 0;
    if (marksB !== marksA) {
      return marksB - marksA;
    }
    const rollA = Number(a.roll) || 0;
    const rollB = Number(b.roll) || 0;
    return rollA - rollB;
  });

  const rankedPassed = passedStudents.map((s, idx) => ({
    ...s,
    meritPosition: idx + 1,
  }));

  const rankedFailed = failedStudents.map((s) => ({
    ...s,
    meritPosition: null,
  }));

  return [...rankedPassed, ...rankedFailed];
}

/**
 * Helper to calculate continuous assessment average marks from class tests / quizzes
 */
export function calculateContinuousAssessmentAverages(classTests: number[]): number {
  if (!classTests || classTests.length === 0) return 0;
  const sum = classTests.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / classTests.length) * 10) / 10;
}
