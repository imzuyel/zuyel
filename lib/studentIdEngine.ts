// Smart Student ID Management Engine for Panchagarh Govt. Technical School & College (PTSC)
// Strictly follows BTEB / DTE academic regulations and institutional rules.
// AUDIT FIRST, NEVER DUPLICATE.

import { Student, StudentIdConfig, StudentIdAuditLog } from "./database";
import { doesClassHaveTrade, parseClassNumeric } from "./academicStructure";

export interface IdGenerationPreviewItem {
  student: Student;
  currentStudentId: string;
  proposedStudentId: string;
  status: "new" | "unchanged" | "overwrite" | "collision";
  collisionReason?: string;
  isSelected: boolean;
}

export interface IdCollisionReport {
  duplicateIds: {
    studentId: string;
    count: number;
    students: { id: number; name: string; roll: number; className: string }[];
  }[];
  duplicateRolls: {
    key: string; // classId-section-roll
    classId: number;
    className: string;
    section: string;
    roll: number;
    students: { id: number; name: string; studentId: string }[];
  }[];
  missingIds: Student[];
  totalStudents: number;
  validIdCount: number;
}

// Convert class numeric value (6..12) into standard 2-digit class code e.g. "06", "09", "12"
export function getClassTwoDigitCode(classNumeric: number | string): string {
  const num = Number(classNumeric) || 6;
  if (num < 10) return `0${num}`;
  return `${num}`;
}

// Extract trade short code for vocational classes (Class 9-12)
export function getTradeShortCode(tradeName?: string, tradeId?: number): string {
  if (!tradeName) return "GEN";
  const lower = tradeName.toLowerCase();
  if (lower.includes("it support") || lower.includes("iot") || lower.includes("computer")) return "IT";
  if (lower.includes("electrical")) return "EW";
  if (lower.includes("electronic")) return "EL";
  if (lower.includes("apparel") || lower.includes("garment") || lower.includes("dress")) return "AM";
  if (lower.includes("refrigeration") || lower.includes("air condition") || lower.includes("rac")) return "RAC";
  if (lower.includes("mechanical") || lower.includes("machine")) return "MW";
  if (lower.includes("civil") || lower.includes("building")) return "CT";
  if (tradeId) return `T${tradeId}`;
  return "VOC";
}

// Generate single student ID based on student record, config, and sequence
export function buildStudentIdString(
  student: {
    classId: number | string;
    roll: number;
    tradeName?: string;
    tradeId?: number;
    session?: string;
  },
  config: StudentIdConfig,
  sequenceOverride?: number
): string {
  const prefix = (config.prefix || "PTSC").trim();
  const sep = config.separator ?? "-";
  
  // Year
  const yearStr = student.session || "2026";
  const formattedYear = config.yearFormat === "YY" ? yearStr.slice(-2) : yearStr;

  // Class code (6 -> 06, 9 -> 09, 12 -> 12)
  const classNumeric = parseClassNumeric(student.classId);
  const classCode = getClassTwoDigitCode(classNumeric);

  // Trade logic (strictly BTEB: Class 6, 7, 8 NEVER have trade!)
  const hasTrade = doesClassHaveTrade(classNumeric);
  let tradeSegment = "";
  if (hasTrade && config.includeTradeForVocational) {
    tradeSegment = getTradeShortCode(student.tradeName, student.tradeId);
  }

  // Sequence
  let seqNum = sequenceOverride ?? student.roll ?? 1;
  if (config.sequenceBasis === "roll") {
    seqNum = student.roll || 1;
  }
  const paddedSeq = String(seqNum).padStart(config.sequenceLength || 4, "0");

  // Format Assembly
  const parts: string[] = [];
  if (prefix) parts.push(prefix);
  if (config.includeYear) parts.push(formattedYear);

  if (config.includeClass) {
    if (tradeSegment) {
      parts.push(`${classCode}${sep ? "" : ""}${tradeSegment}`);
    } else {
      // Standard PTSC: ClassCode concatenated with sequence or standalone
      // In PTSC format: PTSC-2026-090001 (ClassCode09 + Sequence0001)
      if (sep === "-") {
        return `${parts.join(sep)}-${classCode}${paddedSeq}`;
      }
    }
  }

  parts.push(paddedSeq);
  return parts.join(sep);
}

// Generate live human-readable preview of current configuration pattern
export function getPatternPreview(config: StudentIdConfig, classNumeric: number = 9): string {
  const sampleStudent = {
    classId: classNumeric,
    roll: 1,
    tradeName: "IT Support and IoT Basics",
    tradeId: 101,
    session: "2026",
  };
  return buildStudentIdString(sampleStudent, config, 1);
}

// Compute ID Generation Pre-flight Preview for a list of students
export function previewBatchStudentIds(
  students: Student[],
  config: StudentIdConfig,
  existingDatabaseIds: Set<string>,
  options: {
    allowOverwriteExisting?: boolean;
    sequenceStart?: number;
  } = {}
): IdGenerationPreviewItem[] {
  const { allowOverwriteExisting = false, sequenceStart = 1 } = options;
  const proposedIdSet = new Set<string>();
  const previewItems: IdGenerationPreviewItem[] = [];

  students.forEach((stu, idx) => {
    const currentId = (stu.studentId || "").trim();
    const hasExistingId = Boolean(currentId && currentId !== "—" && currentId !== "MISSING");

    // Sequence index
    const seqNum = config.sequenceBasis === "roll" ? stu.roll : sequenceStart + idx;
    const proposed = buildStudentIdString(stu, config, seqNum);

    let status: "new" | "unchanged" | "overwrite" | "collision" = "new";
    let collisionReason: string | undefined = undefined;

    if (hasExistingId) {
      if (currentId.toUpperCase() === proposed.toUpperCase()) {
        status = "unchanged";
      } else if (!allowOverwriteExisting) {
        status = "unchanged"; // Protected from overwrite
      } else {
        status = "overwrite";
      }
    }

    // Check collision against other students in database (excluding the student themselves)
    const dbCollision = existingDatabaseIds.has(proposed.toUpperCase()) && currentId.toUpperCase() !== proposed.toUpperCase();
    
    // Check collision against previously generated items in this batch
    const batchCollision = proposedIdSet.has(proposed.toUpperCase());

    if (dbCollision || batchCollision) {
      status = "collision";
      collisionReason = dbCollision
        ? "এই আইডিটি ইতিমধ্যেই ডাটাবেসের অন্য শিক্ষার্থীর রয়েছে।"
        : "এই ব্যাচের অন্য এক শিক্ষার্থীর সাথে আইডি মিলে গেছে (Duplicate in batch)।";
    }

    proposedIdSet.add(proposed.toUpperCase());

    previewItems.push({
      student: stu,
      currentStudentId: currentId || "—",
      proposedStudentId: proposed,
      status,
      collisionReason,
      isSelected: status !== "collision" && (status === "new" || (status === "overwrite" && allowOverwriteExisting)),
    });
  });

  return previewItems;
}

// Detect All Duplicate IDs and Missing IDs Across Entire Institutional Database
export function scanInstitutionIdIntegrity(allStudents: Student[]): IdCollisionReport {
  const idMap = new Map<string, Student[]>();
  const rollMap = new Map<string, Student[]>();
  const missingIds: Student[] = [];

  allStudents.forEach((stu) => {
    const rawId = (stu.studentId || "").trim();
    if (!rawId || rawId === "—" || rawId === "MISSING") {
      missingIds.push(stu);
    } else {
      const normalized = rawId.toUpperCase();
      const existing = idMap.get(normalized) || [];
      existing.push(stu);
      idMap.set(normalized, existing);
    }

    // Roll duplicates per Class + Section + Session
    const rollKey = `${stu.classId}-${stu.section || "A"}-${stu.session || "2026"}-${stu.roll}`;
    const existingRolls = rollMap.get(rollKey) || [];
    existingRolls.push(stu);
    rollMap.set(rollKey, existingRolls);
  });

  // Filter only duplicate IDs
  const duplicateIds: IdCollisionReport["duplicateIds"] = [];
  idMap.forEach((students, studentId) => {
    if (students.length > 1) {
      duplicateIds.push({
        studentId,
        count: students.length,
        students: students.map((s) => ({
          id: s.id,
          name: s.nameBangla || s.name,
          roll: s.roll,
          className: s.className,
        })),
      });
    }
  });

  // Filter only duplicate Rolls
  const duplicateRolls: IdCollisionReport["duplicateRolls"] = [];
  rollMap.forEach((students, key) => {
    if (students.length > 1) {
      const first = students[0];
      duplicateRolls.push({
        key,
        classId: first.classId,
        className: first.className,
        section: first.section,
        roll: first.roll,
        students: students.map((s) => ({
          id: s.id,
          name: s.nameBangla || s.name,
          studentId: s.studentId,
        })),
      });
    }
  });

  const validIdCount = allStudents.length - missingIds.length;

  return {
    duplicateIds,
    duplicateRolls,
    missingIds,
    totalStudents: allStudents.length,
    validIdCount,
  };
}
