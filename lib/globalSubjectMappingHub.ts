// Reusable Global Subject Mapping & Academic Settings Hub Utility
// Panchagarh Govt. Technical School & College (PTSC)
// Single Source of Truth for Class & Trade Configuration and Subject Mapping

import { parseClassNumeric, doesClassHaveTrade, ACADEMIC_CLASSES, ALL_TRADES } from "./academicStructure";
import {
  getSubjectMappings,
  saveSubjectMapping,
  removeSubjectMapping,
  getSubjectMasters,
  SubjectMaster,
  AcademicSubjectMapping,
} from "./subjectEngine";

export interface ClassConfiguration {
  id: number;
  numericValue: number;
  name: string;
  nameBangla: string;
  tier: "Pre-Vocational" | "SSC (Vocational)" | "HSC (Vocational)";
  hasTrade: boolean;
  totalSeats: number;
  sections: string[];
  shifts: string[];
  status: "Active" | "Inactive";
}

export interface TradeConfiguration {
  id: number;
  tradeNumber: 1 | 2 | 3 | 4;
  code: string;
  name: string;
  nameBangla: string;
  seats: number;
  level: "SSC" | "HSC";
  applicableClass: number; // 9, 10, 11, 12
  descriptionBangla: string;
  status: "Active" | "Inactive";
}

export interface DynamicSubjectItem {
  id: number | string;
  code: string;
  name: string;
  nameBangla: string;
  category: string;
  isCommon: boolean;
  isOptional: boolean;
  weeklyPeriods: number;
  theoryPeriods: number;
  practicalPeriods: number;
  labPeriods: number;
  fullMarks: number;
  passMarks: number;
  theoryMarks: number;
  practicalMarks: number;
  continuousMarks: number;
  tradeId?: number;
  tradeCode?: string;
  mappingId?: string;
  type?: string;
  marks?: number;
  theoryMax?: number;
  practicalMax?: number;
}

// In-memory runtime override store for dynamic adjustments in browser/session
let inMemoryClassConfigs: ClassConfiguration[] = ACADEMIC_CLASSES.map((c) => ({
  id: c.id,
  numericValue: c.numericValue,
  name: c.name,
  nameBangla: c.nameBangla,
  tier: c.tier,
  hasTrade: c.hasTrade,
  totalSeats: c.totalSeats,
  sections: [...c.sections],
  shifts: ["First Shift", "Second Shift"],
  status: "Active",
}));

let inMemoryTradeConfigs: TradeConfiguration[] = ALL_TRADES.map((t) => ({
  id: t.id,
  tradeNumber: t.tradeNumber,
  code: t.code,
  name: t.name,
  nameBangla: t.nameBangla,
  seats: t.seats,
  level: t.level,
  applicableClass: t.applicableClass,
  descriptionBangla: t.descriptionBangla,
  status: "Active",
}));

/**
 * Returns all institutional class configurations
 */
export function getAllClassConfigurations(): ClassConfiguration[] {
  return inMemoryClassConfigs;
}

/**
 * Returns all institutional trade configurations
 */
export function getAllTradeConfigurations(): TradeConfiguration[] {
  return inMemoryTradeConfigs;
}

/**
 * Updates a class configuration
 */
export function updateClassConfiguration(
  classId: number,
  updates: Partial<ClassConfiguration>
): ClassConfiguration | null {
  const index = inMemoryClassConfigs.findIndex((c) => c.id === classId || c.numericValue === classId);
  if (index === -1) return null;

  inMemoryClassConfigs[index] = {
    ...inMemoryClassConfigs[index],
    ...updates,
  };
  return inMemoryClassConfigs[index];
}

/**
 * Updates a trade configuration
 */
export function updateTradeConfiguration(
  tradeId: number,
  updates: Partial<TradeConfiguration>
): TradeConfiguration | null {
  const index = inMemoryTradeConfigs.findIndex((t) => t.id === tradeId);
  if (index === -1) return null;

  inMemoryTradeConfigs[index] = {
    ...inMemoryTradeConfigs[index],
    ...updates,
  };
  return inMemoryTradeConfigs[index];
}

/**
 * Single Source of Truth: Get all mapped subjects for a specific class and trade.
 * If class has trades (Class 9-12), it returns both general common subjects
 * and the specific trade subjects (e.g. IT Support & IoT Basics).
 */
export function getSingleSourceSubjects(params: {
  classVal: number | string;
  tradeVal?: number | string;
  academicYear?: string;
  includeInactive?: boolean;
}): DynamicSubjectItem[] {
  const academicYear = params.academicYear || "2026";
  const numericClass = parseClassNumeric(params.classVal);
  if (!numericClass) return [];

  const classHasTrade = doesClassHaveTrade(numericClass);
  const tradeNum = params.tradeVal && params.tradeVal !== "all" ? Number(params.tradeVal) : undefined;

  // Query engine mappings
  const allMappings = getSubjectMappings({
    academicYear,
    classId: numericClass,
    status: params.includeInactive ? undefined : "Active",
  });

  // Filter: If trade specified, include mappings matching this trade OR common to all trades (tradeId is 0 or undefined)
  const filtered = allMappings.filter((m) => {
    if (!classHasTrade) return true;
    if (!tradeNum) return true; // Show all if trade not selected
    return m.tradeId === tradeNum || !m.tradeId || m.tradeId === 0;
  });

  // Convert to DynamicSubjectItem
  const results: DynamicSubjectItem[] = filtered.map((m) => ({
    id: m.subjectId,
    code: m.subjectCode,
    name: m.subjectName,
    nameBangla: m.subjectNameBangla,
    category: m.subjectType,
    isCommon: !m.tradeId || m.tradeId === 0,
    isOptional: m.isOptional,
    weeklyPeriods: m.weeklyPeriods || 4,
    theoryPeriods: m.theoryPeriods || 0,
    practicalPeriods: m.practicalPeriods || 0,
    labPeriods: m.labPeriods || 0,
    fullMarks: m.fullMarks || 100,
    passMarks: m.passMarks || 33,
    theoryMarks: m.theoryMarks || 0,
    practicalMarks: m.practicalMarks || 0,
    continuousMarks: m.continuousMarks || 0,
    tradeId: m.tradeId,
    tradeCode: m.tradeCode,
    mappingId: m.id,
  }));

  // Deduplicate by code
  const mapByCode = new Map<string, DynamicSubjectItem>();
  for (const item of results) {
    if (!mapByCode.has(item.code)) {
      mapByCode.set(item.code, item);
    }
  }

  return Array.from(mapByCode.values());
}

/**
 * Client-Side API Helper: Fetch subjects for any module (Routine, Attendance, Marks)
 */
export async function fetchSubjectsByClassTrade(
  classVal: number | string,
  tradeVal?: number | string,
  academicYear: string = "2026"
): Promise<DynamicSubjectItem[]> {
  try {
    const params = new URLSearchParams({
      action: "mapped_subjects",
      classVal: String(classVal),
      academicYear,
    });
    if (tradeVal && tradeVal !== "all") {
      params.append("tradeVal", String(tradeVal));
    }

    const res = await fetch(`/api/academic/global-settings?${params.toString()}`);
    if (!res.ok) {
      // Fallback to local synchronous logic
      return getSingleSourceSubjects({ classVal, tradeVal, academicYear });
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.subjects)) {
      return data.subjects;
    }
    return getSingleSourceSubjects({ classVal, tradeVal, academicYear });
  } catch (err) {
    console.error("fetchSubjectsByClassTrade error:", err);
    return getSingleSourceSubjects({ classVal, tradeVal, academicYear });
  }
}
