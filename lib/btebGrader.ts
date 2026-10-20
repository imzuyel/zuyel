/**
 * BTEB Result Calculator & Grading Engine
 * Panchagarh Government Technical School & College (PTSC) ERP
 * 
 * Implements authoritative Bangladesh Technical Education Board (BTEB)
 * evaluation rules for SSC (Vocational), HSC (Vocational), and Pre-Vocational curricula.
 */

export interface SubjectConfig {
  code: string;
  name: string;
  nameBangla?: string;
  creditHours?: number;
  fullMarks: number;
  // Specific allocated marks for each evaluation section
  tcFullMarks?: number; // Theory Continuous (e.g. 20 or 40)
  pcFullMarks?: number; // Practical Continuous (e.g. 25 or 50)
  tfFullMarks?: number; // Theory Final (e.g. 40 or 80)
  pfFullMarks?: number; // Practical Final (e.g. 25 or 50)
  passPercentage?: number; // Default 40% for technical subjects
}

export interface TheoryContinuousInput {
  attendance?: number;
  classTest?: number; // CT marks
  quiz?: number;
  assignment?: number;
  total?: number; // If pre-aggregated
}

export interface PracticalContinuousInput {
  jobSheet?: number; // Lab Experiment / Job Report
  viva?: number;
  practicalAttendance?: number;
  total?: number; // If pre-aggregated
}

export interface SubjectMarksInput {
  subject: SubjectConfig;
  theoryContinuous?: TheoryContinuousInput;
  practicalContinuous?: PracticalContinuousInput;
  theoryFinal: number; // TF
  practicalFinal?: number; // PF (optional for non-practical subjects)
}

export type LetterGrade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "D" | "F";

export interface ComponentBreakdown {
  obtained: number;
  fullMarks: number;
  passMarks: number;
  isPassed: boolean;
}

export interface SubjectGradeResult {
  code: string;
  name: string;
  nameBangla: string;
  creditHours: number;
  fullMarks: number;
  tc: ComponentBreakdown;
  pc?: ComponentBreakdown;
  tf: ComponentBreakdown;
  pf?: ComponentBreakdown;
  totalObtained: number;
  percentage: number;
  grade: LetterGrade;
  gradePoint: number;
  isPassed: boolean;
  failedReason?: string;
}

export interface SemesterResult {
  totalSubjects: number;
  totalPassed: number;
  totalFailed: number;
  totalCredits: number;
  totalWeightedPoints: number;
  gpa: number;
  formattedGpa: string;
  gpaBangla: string;
  letterGrade: LetterGrade;
  status: "Passed" | "Referred" | "Failed";
  statusBangla: "উত্তীর্ণ" | "রেফার্ড" | "অকৃতকার্য";
  failedSubjects: { code: string; name: string }[];
  subjectResults: SubjectGradeResult[];
}

const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBengaliNumber(val: number | string): string {
  const str = typeof val === "number" ? val.toFixed(2) : String(val);
  return str.replace(/\d/g, (d) => BENGALI_DIGITS[parseInt(d, 10)] || d);
}

/**
 * Standard BTEB 5.0 Scale (Vocational SSC & HSC)
 */
export function getBtebGrade5Scale(percentage: number): { grade: LetterGrade; gradePoint: number } {
  if (percentage >= 80) return { grade: "A+", gradePoint: 5.0 };
  if (percentage >= 70) return { grade: "A", gradePoint: 4.0 };
  if (percentage >= 60) return { grade: "A-", gradePoint: 3.5 };
  if (percentage >= 50) return { grade: "B", gradePoint: 3.0 };
  if (percentage >= 40) return { grade: "C", gradePoint: 2.0 };
  if (percentage >= 33) return { grade: "D", gradePoint: 1.0 };
  return { grade: "F", gradePoint: 0.0 };
}

/**
 * Calculates grade for an individual subject respecting individual component passing rules:
 * In BTEB rules: Student must secure minimum pass mark in TC, PC, TF, and PF individually.
 * Failing in any one component results in Letter Grade F (GP 0.00).
 */
export function calculateSubjectGrade(
  input: SubjectMarksInput,
  scale: "5.0" | "4.0" = "5.0"
): SubjectGradeResult {
  const { subject } = input;
  const passPercent = subject.passPercentage ?? 40; // Technical pass benchmark (40%)

  // 1. Calculate TC (Theory Continuous)
  const tcFull = subject.tcFullMarks ?? Math.round(subject.fullMarks * 0.2);
  const tcPass = Math.round(tcFull * (passPercent / 100));
  let tcObtained = 0;
  if (input.theoryContinuous) {
    if (typeof input.theoryContinuous.total === "number") {
      tcObtained = input.theoryContinuous.total;
    } else {
      tcObtained =
        (input.theoryContinuous.attendance || 0) +
        (input.theoryContinuous.classTest || 0) +
        (input.theoryContinuous.quiz || 0) +
        (input.theoryContinuous.assignment || 0);
    }
  }
  const tcPassed = tcObtained >= tcPass;

  // 2. Calculate PC (Practical Continuous) - if subject has practical component
  let pcBreakdown: ComponentBreakdown | undefined = undefined;
  let pcPassed = true;
  if (subject.pcFullMarks && subject.pcFullMarks > 0) {
    const pcFull = subject.pcFullMarks;
    const pcPass = Math.round(pcFull * (passPercent / 100));
    let pcObtained = 0;
    if (input.practicalContinuous) {
      if (typeof input.practicalContinuous.total === "number") {
        pcObtained = input.practicalContinuous.total;
      } else {
        pcObtained =
          (input.practicalContinuous.jobSheet || 0) +
          (input.practicalContinuous.viva || 0) +
          (input.practicalContinuous.practicalAttendance || 0);
      }
    }
    pcPassed = pcObtained >= pcPass;
    pcBreakdown = {
      obtained: pcObtained,
      fullMarks: pcFull,
      passMarks: pcPass,
      isPassed: pcPassed,
    };
  }

  // 3. Calculate TF (Theory Final)
  const tfFull = subject.tfFullMarks ?? (subject.fullMarks - tcFull - (subject.pcFullMarks || 0) - (subject.pfFullMarks || 0));
  const tfPass = Math.round(tfFull * (passPercent / 100));
  const tfObtained = input.theoryFinal || 0;
  const tfPassed = tfObtained >= tfPass;

  // 4. Calculate PF (Practical Final) - if applicable
  let pfBreakdown: ComponentBreakdown | undefined = undefined;
  let pfPassed = true;
  if (subject.pfFullMarks && subject.pfFullMarks > 0) {
    const pfFull = subject.pfFullMarks;
    const pfPass = Math.round(pfFull * (passPercent / 100));
    const pfObtained = input.practicalFinal || 0;
    pfPassed = pfObtained >= pfPass;
    pfBreakdown = {
      obtained: pfObtained,
      fullMarks: pfFull,
      passMarks: pfPass,
      isPassed: pfPassed,
    };
  }

  // Individual Passing Verification
  const failedParts: string[] = [];
  if (!tcPassed) failedParts.push(`TC (<${tcPass})`);
  if (pcBreakdown && !pcPassed) failedParts.push(`PC (<${pcBreakdown.passMarks})`);
  if (!tfPassed) failedParts.push(`TF (<${tfPass})`);
  if (pfBreakdown && !pfPassed) failedParts.push(`PF (<${pfBreakdown.passMarks})`);

  const hasIndividualFailure = failedParts.length > 0;

  // Aggregate Total
  const totalObtained =
    tcObtained +
    (pcBreakdown ? pcBreakdown.obtained : 0) +
    tfObtained +
    (pfBreakdown ? pfBreakdown.obtained : 0);

  const percentage = Math.min(100, Math.max(0, (totalObtained / subject.fullMarks) * 100));

  let finalGrade: LetterGrade = "F";
  let finalGp = 0.0;

  if (hasIndividualFailure) {
    finalGrade = "F";
    finalGp = 0.0;
  } else {
    const gradeData = getBtebGrade5Scale(percentage);
    finalGrade = gradeData.grade;
    finalGp = gradeData.gradePoint;
  }

  return {
    code: subject.code,
    name: subject.name,
    nameBangla: subject.nameBangla || subject.name,
    creditHours: subject.creditHours || 3,
    fullMarks: subject.fullMarks,
    tc: {
      obtained: tcObtained,
      fullMarks: tcFull,
      passMarks: tcPass,
      isPassed: tcPassed,
    },
    pc: pcBreakdown,
    tf: {
      obtained: tfObtained,
      fullMarks: tfFull,
      passMarks: tfPass,
      isPassed: tfPassed,
    },
    pf: pfBreakdown,
    totalObtained,
    percentage: Math.round(percentage * 100) / 100,
    grade: finalGrade,
    gradePoint: finalGp,
    isPassed: !hasIndividualFailure && finalGrade !== "F",
    failedReason: hasIndividualFailure ? `Failed in individual section(s): ${failedParts.join(", ")}` : undefined,
  };
}

/**
 * Calculates overall semester GPA, credit weighting, and Referred/Passed/Failed status
 * - 0 failures: Passed (উত্তীর্ণ)
 * - 1 to 2 failures: Referred (রেফার্ড)
 * - 3 or more failures: Failed (অকৃতকার্য)
 */
export function calculateSemesterResult(subjectResults: SubjectGradeResult[]): SemesterResult {
  if (!subjectResults || subjectResults.length === 0) {
    return {
      totalSubjects: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalCredits: 0,
      totalWeightedPoints: 0,
      gpa: 0,
      formattedGpa: "0.00",
      gpaBangla: "০.০০",
      letterGrade: "F",
      status: "Failed",
      statusBangla: "অকৃতকার্য",
      failedSubjects: [],
      subjectResults: [],
    };
  }

  let totalCredits = 0;
  let totalWeightedPoints = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const failedSubjects: { code: string; name: string }[] = [];

  for (const s of subjectResults) {
    const credits = s.creditHours || 3;
    totalCredits += credits;
    totalWeightedPoints += s.gradePoint * credits;

    if (s.isPassed && s.grade !== "F") {
      totalPassed++;
    } else {
      totalFailed++;
      failedSubjects.push({ code: s.code, name: s.nameBangla || s.name });
    }
  }

  let rawGpa = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;
  // If student failed any subject, the maximum GPA in BTEB is 0.00 until referred exams are cleared
  if (totalFailed > 0) {
    rawGpa = 0.0;
  }

  const roundedGpa = Math.min(5.0, Math.round(rawGpa * 100) / 100);
  const formattedGpa = roundedGpa.toFixed(2);
  const gpaBangla = toBengaliNumber(formattedGpa);

  let status: "Passed" | "Referred" | "Failed" = "Passed";
  let statusBangla: "উত্তীর্ণ" | "রেফার্ড" | "অকৃতকার্য" = "উত্তীর্ণ";

  if (totalFailed === 0) {
    status = "Passed";
    statusBangla = "উত্তীর্ণ";
  } else if (totalFailed <= 2) {
    status = "Referred";
    statusBangla = "রেফার্ড";
  } else {
    status = "Failed";
    statusBangla = "অকৃতকার্য";
  }

  // Semester Overall Letter Grade
  let letterGrade: LetterGrade = "F";
  if (status === "Passed") {
    if (roundedGpa >= 5.0) letterGrade = "A+";
    else if (roundedGpa >= 4.0) letterGrade = "A";
    else if (roundedGpa >= 3.5) letterGrade = "A-";
    else if (roundedGpa >= 3.0) letterGrade = "B";
    else if (roundedGpa >= 2.0) letterGrade = "C";
    else if (roundedGpa >= 1.0) letterGrade = "D";
    else letterGrade = "F";
  } else {
    letterGrade = "F";
  }

  return {
    totalSubjects: subjectResults.length,
    totalPassed,
    totalFailed,
    totalCredits,
    totalWeightedPoints: Math.round(totalWeightedPoints * 100) / 100,
    gpa: roundedGpa,
    formattedGpa,
    gpaBangla,
    letterGrade,
    status,
    statusBangla,
    failedSubjects,
    subjectResults,
  };
}
