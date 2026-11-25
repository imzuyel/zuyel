/**
 * Canonical Global Academic Structure & Single Source of Truth (lib/academicConfig.ts)
 *
 * Institutional Rule:
 * - Classes 6, 7, 8 (Pre-Vocational): hasDepartment = false (No department/trade dropdown anywhere).
 * - Classes 9, 10, 11, 12 (SSC / HSC Vocational): hasDepartment = true (4 configurable departments/trades per class).
 *
 * Wraps and standardizes `lib/academicStructure.ts` with dynamic MySQL/Hybrid overrides
 * so updating departments, classes, or subjects ONCE in `/academic` immediately updates
 * Students, Attendance, Routine, Quizzes, and Results.
 */

import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  MANDATORY_FOUR_TRADES,
  COMMON_SUBJECTS_9_12,
  PRE_VOCATIONAL_SUBJECTS,
  AcademicClass,
  AcademicTrade,
  SubjectItem,
  doesClassHaveTrade,
  getApplicableTradesForClass,
  getSubjectsForClass,
  parseClassNumeric,
} from "./academicStructure";

export interface AcademicDepartmentConfig {
  id: number;
  code: string;
  name: string;
  nameBangla: string;
  applicableClass: number;
  seats: number;
}

export interface AcademicClassConfig {
  id: number;
  numericValue: number; // 6, 7, 8, 9, 10, 11, 12
  name: string;
  nameBangla: string;
  hasDepartment: boolean; // false for 6-8; true for 9-12
  sections: string[];
}

export const CANONICAL_CLASSES: AcademicClassConfig[] = ACADEMIC_CLASSES.map((c) => ({
  id: c.id,
  numericValue: c.numericValue,
  name: c.name,
  nameBangla: c.nameBangla,
  hasDepartment: c.numericValue >= 9, // Strictly false for 6, 7, 8; true for 9, 10, 11, 12
  sections: c.sections,
}));

/**
 * Authoritative rule check: Classes 6, 7, 8 NEVER have departments/trades.
 * Classes 9, 10, 11, 12 ALWAYS have 4 configurable departments/trades.
 */
export function doesClassHaveDepartment(classIdOrNumeric: string | number): boolean {
  const num = parseClassNumeric(classIdOrNumeric);
  if (num >= 6 && num <= 8) return false;
  if (num >= 9 && num <= 12) return true;
  return doesClassHaveTrade(classIdOrNumeric);
}

/**
 * Returns up to 4 configurable departments/trades for Classes 9-12, or [] for Classes 6-8.
 */
export function getDepartmentsForClass(
  classIdOrNumeric: string | number,
  dynamicTrades?: AcademicTrade[]
): AcademicTrade[] {
  if (!doesClassHaveDepartment(classIdOrNumeric)) {
    return [];
  }

  const num = parseClassNumeric(classIdOrNumeric);
  const sourceTrades =
    dynamicTrades && dynamicTrades.length > 0 ? dynamicTrades : ALL_TRADES;

  const matching = sourceTrades.filter(
    (t) => Number(t.applicableClass) === num
  );
  if (matching.length > 0) {
    return matching.slice(0, 4);
  }
  return getApplicableTradesForClass(classIdOrNumeric).slice(0, 4);
}

/**
 * Returns subjects for a class (and optional department/trade for 9-12)
 */
export function getSubjectsForClassAndDepartment(
  classIdOrNumeric: string | number,
  tradeId?: string | number | null,
  customSubjects?: SubjectItem[]
): SubjectItem[] {
  const num = parseClassNumeric(classIdOrNumeric);
  const base = getSubjectsForClass(num, tradeId ? Number(tradeId) : undefined);

  if (!customSubjects || customSubjects.length === 0) {
    return base;
  }

  const mergedMap = new Map<string, SubjectItem>();
  base.forEach((s) => mergedMap.set(String(s.code), s));
  customSubjects.forEach((s) => {
    if (s.applicableClasses.includes(num)) {
      if (!doesClassHaveDepartment(num) || !tradeId || !s.tradeId || String(s.tradeId) === String(tradeId)) {
        mergedMap.set(String(s.code), s);
      }
    }
  });
  return Array.from(mergedMap.values());
}

export {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  MANDATORY_FOUR_TRADES,
  COMMON_SUBJECTS_9_12,
  PRE_VOCATIONAL_SUBJECTS,
  parseClassNumeric,
  type AcademicClass,
  type AcademicTrade,
  type SubjectItem,
};
