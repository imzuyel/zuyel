import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { doesClassHaveTrade } from "./academicStructure";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Bangladesh Technical Education Board (BTEB) Grading Scale
export function calculateGradeAndGP(marks: number): { grade: string; gradePoint: number } {
  const m = Math.round(marks);
  if (m >= 80) return { grade: "A+", gradePoint: 5.0 };
  if (m >= 70) return { grade: "A", gradePoint: 4.0 };
  if (m >= 60) return { grade: "A-", gradePoint: 3.5 };
  if (m >= 50) return { grade: "B", gradePoint: 3.0 };
  if (m >= 40) return { grade: "C", gradePoint: 2.0 };
  if (m >= 33) return { grade: "D", gradePoint: 1.0 };
  return { grade: "F", gradePoint: 0.0 };
}

// Automated score averager
export function calculateAverage(scores: (number | string | null | undefined)[]): number {
  const valid = scores
    .map((s) => (s !== null && s !== undefined && s !== "" ? Number(s) : NaN))
    .filter((n) => !isNaN(n) && n >= 0);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / valid.length).toFixed(2));
}

// Student ID Generator Format Engine
export function formatStudentId(pattern: string, year: number, serialNumber: number): string {
  const padSerial = String(serialNumber).padStart(6, "0");
  return pattern
    .replace("{YEAR}", String(year))
    .replace("{SERIAL}", padSerial)
    .replace("{SESSION}", String(year));
}

// Admission number formatter
export function formatAdmissionNo(
  prefixOrYear: string | number,
  yearOrSerial: number | string,
  maybeSerial?: number | string
): string {
  if (maybeSerial !== undefined) {
    const pad = String(maybeSerial).padStart(4, "0");
    return `${prefixOrYear}-${yearOrSerial}-${pad}`;
  }
  const pad = String(yearOrSerial).padStart(4, "0");
  return `ADM-${prefixOrYear}-${pad}`;
}

// Generate guaranteed unique, non-duplicating, stable Student ID
export function generateUniqueStudentId(
  session: number | string,
  classId: number | string,
  existingIds: string[] = []
): string {
  const yr = String(session || new Date().getFullYear());
  const clsNum = Number(classId) || 4;
  // Class 6: "06", Class 7: "07", Class 8: "08", Class 9: "09", Class 10: "10", Class 11: "11", Class 12: "12"
  const classCode = clsNum >= 1 && clsNum <= 3 
    ? `0${clsNum + 5}` // 1->06, 2->07, 3->08
    : clsNum >= 4 && clsNum <= 5
    ? `0${clsNum + 5}` // 4->09, 5->10
    : `${clsNum + 5}`; // 6->11, 7->12

  const existingSet = new Set(existingIds.map((id) => id.toUpperCase()));
  
  // Find next available serial
  for (let serial = 1; serial <= 99999; serial++) {
    const padded = String(serial).padStart(4, "0");
    const candidate = `PTSC-${yr}-${classCode}${padded}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  // Fallback unique with timestamp
  return `PTSC-${yr}-${Date.now().toString().slice(-6)}`;
}

// Check if Trade is applicable based on BTEB rule
// Pre-Vocational: Class 6, 7, 8 -> NO TRADE (returns false)
// SSC/HSC Vocational: Class 9, 10, 11, 12 -> TRADE BASED (returns true)
export function isTradeApplicable(classId: number | string | undefined | null): boolean {
  if (!classId) return false;
  return doesClassHaveTrade(classId);
}

// Convert English date string "YYYY-MM-DD" to Bangla formal date string
export function toBanglaDateString(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const banglaMonths = [
      "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
      "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    ];

    const bnDay = toBengaliNumerals(day);
    const bnMonth = banglaMonths[month - 1] || "";
    const bnYear = toBengaliNumerals(year);

    return `${bnDay} ${bnMonth}, ${bnYear}`;
  } catch {
    return dateStr;
  }
}

// Continuous assessment calculator
export function calculateContinuousAssessment(
  quizzes: (number | string | null | undefined)[],
  classTests: (number | string | null | undefined)[],
  practicals: (number | string | null | undefined)[]
): {
  quizAvg: number;
  ctAvg: number;
  practicalAvg: number;
  continuousAssessment: number;
} {
  const quizAvg = calculateAverage(quizzes);
  const ctAvg = calculateAverage(classTests);
  const practicalAvg = calculateAverage(practicals);
  const continuousAssessment = Number((quizAvg + ctAvg + practicalAvg).toFixed(2));

  return { quizAvg, ctAvg, practicalAvg, continuousAssessment };
}

// Document Number Generator
export function formatDocumentNo(typePrefix: string, year: number | string, serialNumber: number): string {
  const padSerial = String(serialNumber).padStart(5, "0");
  return `PTSC/${typePrefix}/${year}/${padSerial}`;
}

// Currency Formatter (BDT)
export function formatBDT(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "৳ ০";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `৳ ${num.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Bengali numerals converter
export function toBengaliNumerals(num: number | string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (digit) => bnDigits[parseInt(digit, 10)]);
}
