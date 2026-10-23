/**
 * Central Global Master Data & Academic Mapping Engine
 * Panchagarh Govt. Technical School & College (PTSC)
 * Compliant with Bangladesh Technical Education Board (BTEB) & DTE Standards
 *
 * Single Source of Truth for:
 * 1. Institution Settings
 * 2. Academic Years & Session Control
 * 3. Academic Programs / Education Streams (Pre-Voc, SSC Voc, HSC Voc)
 * 4. Academic Classes (Class 6 - 12)
 * 5. Vocational Trades (4 Core Authoritative Trades)
 * 6. Sections & Shifts
 * 7. Central Academic Mapping (Year + Program + Class + Trade + Section + Shift)
 * 8. Subject Master & Curriculum Integration Points
 */

import { prisma, isPrismaAvailable, safePrismaQuery } from "./prisma";
import { institutionalDb, InstitutionInfo } from "./database";

// ============================================================================
// 1. DATA CONTRACTS & INTERFACES
// ============================================================================

export interface InstitutionSettings {
  id: string;
  name: string;
  nameBangla: string;
  eiin: string;
  code: string;
  board: string;
  directorate: string;
  ministry: string;
  established: number;
  location: string;
  locationBangla: string;
  principalName: string;
  principalDesignation: string;
  principalMobile: string;
  email: string;
  phoneLandline: string;
  website: string;
  logoUrl?: string;
  vision?: string;
  mission?: string;
  updatedAt: string;
}

export type AcademicYearStatus = "Draft" | "Active" | "Closed" | "Archived";

export interface AcademicYearRecord {
  id: number;
  name: string; // e.g. "2026"
  code: string; // e.g. "AY-2026"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: AcademicYearStatus;
  isCurrent: boolean;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProgramLevel = "pre_vocational" | "secondary" | "higher_secondary" | "diploma";

export interface AcademicProgramRecord {
  id: number;
  code: string; // "PRE_VOC", "SSC_VOC", "HSC_VOC", "DIPLOMA"
  name: string; // e.g. "SSC (Vocational)"
  nameBangla: string; // e.g. "এসএসসি ভোকেশনাল"
  shortName: string; // e.g. "SSC Voc"
  description: string;
  level: ProgramLevel;
  minClass: number; // e.g. 9
  maxClass: number; // e.g. 10
  applicableClassNumerics: number[]; // e.g. [9, 10]
  hasTrades: boolean;
  curriculumBoard: string; // "BTEB"
  displayOrder: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface ClassMasterRecord {
  id: number;
  numericValue: number; // 6, 7, 8, 9, 10, 11, 12
  code: string; // "CLS-6" .. "CLS-12"
  name: string; // e.g. "Class 9"
  nameBangla: string; // e.g. "৯ম শ্রেণি"
  programCode: string; // e.g. "SSC_VOC"
  programId: number;
  displayOrder: number;
  hasTrade: boolean;
  defaultSections: string[]; // ["A", "B"]
  defaultShifts: string[]; // ["FIRST_SHIFT", "SECOND_SHIFT"]
  totalSeats: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface TradeMasterRecord {
  id: number;
  code: string; // "CE", "IT-IOT", "GEW", "AMB", "RAC"
  tradeNumber?: number; // 1, 2, 3, 4
  name: string; // "Consumer Electronics"
  nameBangla: string; // "কনজিউমার ইলেকট্রনিক্স"
  shortName: string; // "ইলেকট্রনিক্স"
  description: string;
  programCodes: string[]; // ["SSC_VOC", "HSC_VOC"]
  intakeCapacity: number; // e.g. 50
  totalLabs: number; // e.g. 2
  badgeGradient: string;
  iconName: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface SectionShiftRecord {
  id: string; // "sec_A"
  name: string; // "Section A"
  code: string; // "A"
  shift: "FIRST_SHIFT" | "SECOND_SHIFT" | "BOTH";
  shiftNameBangla: string; // "১ম শিফট"
  displayOrder: number;
  status: "Active" | "Inactive";
}

export interface LabMasterRecord {
  id: number;
  name: string;
  nameBangla: string;
  code: string;
  tradeId?: number | null;
  tradeName?: string | null;
  roomNumber?: string;
  capacity: number;
  status: "Active" | "Inactive";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicMappingRecord {
  id: string; // e.g. "map_2026_SSC_VOC_cls9_trd101_secA_FIRST_SHIFT"
  academicYear: string; // "2026"
  programId: number;
  programCode: string; // "SSC_VOC"
  programName: string;
  classNumeric: number; // 9
  className: string; // "৯ম শ্রেণি"
  tradeId: number | null; // 101 or null (null for pre-vocational)
  tradeCode: string | null; // "CE" or null
  tradeName: string | null; // "কনজিউমার ইলেকট্রনিক্স"
  section: string; // "A"
  shift: string; // "FIRST_SHIFT"
  shiftNameBangla: string; // "১ম শিফট"
  capacity: number; // 50
  enrolledStudentsCount: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface MasterDataSnapshot {
  institution: InstitutionSettings;
  academicYears: AcademicYearRecord[];
  activeYear: AcademicYearRecord;
  programs: AcademicProgramRecord[];
  classes: ClassMasterRecord[];
  trades: TradeMasterRecord[];
  labs: LabMasterRecord[];
  sectionsShifts: SectionShiftRecord[];
  mappings: AcademicMappingRecord[];
  activeMappings: AcademicMappingRecord[];
  stats: {
    totalYears: number;
    totalPrograms: number;
    totalClasses: number;
    totalTrades: number;
    totalLabs: number;
    totalMappings: number;
    activeMappingsCount: number;
  };
}

// ============================================================================
// 2. VERIFIED DEFAULT SEED DATA (INSTITUTIONAL CANONICAL)
// ============================================================================

export const DEFAULT_INSTITUTION_SETTINGS: InstitutionSettings = {
  id: "ptsc_institution_settings",
  name: "Panchagarh Government Technical School and College",
  nameBangla: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
  eiin: "133244",
  code: "24005",
  board: "Bangladesh Technical Education Board (BTEB)",
  directorate: "Directorate of Technical Education (DTE)",
  ministry: "Ministry of Education",
  established: 2001,
  location: "Panchagarh Sadar, Panchagarh",
  locationBangla: "পঞ্চগড় সদর, পঞ্চগড়",
  principalName: "Md. Rafiqul Islam",
  principalDesignation: "Principal",
  principalMobile: "+8801712-345678",
  email: "ptsc.panchagarh@gmail.com",
  phoneLandline: "0568-61234",
  website: "https://ptsc.gov.bd",
  logoUrl: "/images/ptsc-logo.png",
  vision: "To produce competent, ethically driven technical professionals conforming to national TVET standards.",
  mission: "Providing industry-grade technical education, modern lab practicals, and market-responsive skills training.",
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_ACADEMIC_YEARS: AcademicYearRecord[] = [
  {
    id: 1,
    name: "2026",
    code: "AY-2026",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "Active",
    isCurrent: true,
    remarks: "চলতি সক্রিয় শিক্ষাবর্ষ (Current Active Academic Year)",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    name: "2025",
    code: "AY-2025",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    status: "Closed",
    isCurrent: false,
    remarks: "সমাপ্ত শিক্ষাবর্ষ (Historical Archive)",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-12-31T23:59:59.000Z",
  },
  {
    id: 3,
    name: "2027",
    code: "AY-2027",
    startDate: "2027-01-01",
    endDate: "2027-12-31",
    status: "Draft",
    isCurrent: false,
    remarks: "পরবর্তী শিক্ষাবর্ষ প্রস্তুতি (Upcoming Planning)",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
];

export const DEFAULT_ACADEMIC_PROGRAMS: AcademicProgramRecord[] = [
  {
    id: 1,
    code: "PRE_VOC",
    name: "Pre-Vocational Education",
    nameBangla: "সাধারণ ও প্রাক-ভোকেশনাল শিক্ষা",
    shortName: "প্রাক-ভোকেশনাল",
    description: "৬ষ্ঠ থেকে ৮ম শ্রেণি পর্যন্ত সাধারণ শিক্ষার পাশাপাশি মৌলিক কারিগরি পরিচিতি। কোনো বিশেষায়িত ট্রেড নেই।",
    level: "pre_vocational",
    minClass: 6,
    maxClass: 8,
    applicableClassNumerics: [6, 7, 8],
    hasTrades: false,
    curriculumBoard: "BTEB & NCTB",
    displayOrder: 1,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    code: "SSC_VOC",
    name: "SSC (Vocational)",
    nameBangla: "এসএসসি (ভোকেশনাল) ও দাখিল (ভোকেশনাল)",
    shortName: "এসএসসি ভোকেশনাল",
    description: "৯ম ও ১০ম শ্রেণির জন্য বাংলাদেশ কারিগরি শিক্ষা বোর্ডের ৪টি অনুমোদিত বিশেষায়িত ট্রেড ও সাধারণ কারিকুলাম।",
    level: "secondary",
    minClass: 9,
    maxClass: 10,
    applicableClassNumerics: [9, 10],
    hasTrades: true,
    curriculumBoard: "BTEB",
    displayOrder: 2,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 3,
    code: "HSC_VOC",
    name: "HSC (Vocational)",
    nameBangla: "এইচএসসি (ভোকেশনাল)",
    shortName: "এইচএসসি ভোকেশনাল",
    description: "১১শ ও ১২শ শ্রেণির উচ্চ মাধ্যমিক কারিগরি শিক্ষা ও ইন্টার্নশিপ কারিকুলাম।",
    level: "higher_secondary",
    minClass: 11,
    maxClass: 12,
    applicableClassNumerics: [11, 12],
    hasTrades: true,
    curriculumBoard: "BTEB",
    displayOrder: 3,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const DEFAULT_CLASSES: ClassMasterRecord[] = [
  {
    id: 1,
    numericValue: 6,
    code: "CLS-6",
    name: "Class 6",
    nameBangla: "৬ষ্ঠ শ্রেণি",
    programCode: "PRE_VOC",
    programId: 1,
    displayOrder: 1,
    hasTrade: false,
    defaultSections: ["A", "B"],
    defaultShifts: ["FIRST_SHIFT", "SECOND_SHIFT"],
    totalSeats: 120,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    numericValue: 7,
    code: "CLS-7",
    name: "Class 7",
    nameBangla: "৭ম শ্রেণি",
    programCode: "PRE_VOC",
    programId: 1,
    displayOrder: 2,
    hasTrade: false,
    defaultSections: ["A", "B"],
    defaultShifts: ["FIRST_SHIFT", "SECOND_SHIFT"],
    totalSeats: 120,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 3,
    numericValue: 8,
    code: "CLS-8",
    name: "Class 8",
    nameBangla: "৮ম শ্রেণি",
    programCode: "PRE_VOC",
    programId: 1,
    displayOrder: 3,
    hasTrade: false,
    defaultSections: ["A", "B"],
    defaultShifts: ["FIRST_SHIFT", "SECOND_SHIFT"],
    totalSeats: 120,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 4,
    numericValue: 9,
    code: "CLS-9",
    name: "Class 9 (Vocational)",
    nameBangla: "৯ম শ্রেণি (এসএসসি ভোকেশনাল)",
    programCode: "SSC_VOC",
    programId: 2,
    displayOrder: 4,
    hasTrade: true,
    defaultSections: ["A", "B"],
    defaultShifts: ["FIRST_SHIFT"],
    totalSeats: 100,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 5,
    numericValue: 10,
    code: "CLS-10",
    name: "Class 10 (Vocational)",
    nameBangla: "১০ম শ্রেণি (এসএসসি ভোকেশনাল)",
    programCode: "SSC_VOC",
    programId: 2,
    displayOrder: 5,
    hasTrade: true,
    defaultSections: ["A", "B"],
    defaultShifts: ["FIRST_SHIFT"],
    totalSeats: 100,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 6,
    numericValue: 11,
    code: "CLS-11",
    name: "Class 11 (Vocational)",
    nameBangla: "১১শ শ্রেণি (এইচএসসি ভোকেশনাল)",
    programCode: "HSC_VOC",
    programId: 3,
    displayOrder: 6,
    hasTrade: true,
    defaultSections: ["A", "B"],
    defaultShifts: ["FIRST_SHIFT"],
    totalSeats: 100,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 7,
    numericValue: 12,
    code: "CLS-12",
    name: "Class 12 (Vocational)",
    nameBangla: "১২শ শ্রেণি (এইচএসসি ভোকেশনাল)",
    programCode: "HSC_VOC",
    programId: 3,
    displayOrder: 7,
    hasTrade: true,
    defaultSections: ["A", "B"],
    defaultShifts: ["FIRST_SHIFT"],
    totalSeats: 100,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const DEFAULT_TRADES: TradeMasterRecord[] = [
  {
    id: 101,
    code: "CE",
    tradeNumber: 1,
    name: "Consumer Electronics",
    nameBangla: "কনজিউমার ইলেকট্রনিক্স",
    shortName: "কনজিউমার ইলেকট্রনিক্স",
    description: "কনজিউমার ইলেকট্রনিক্স, অডিও-ভিডিও সিস্টেম, হোম অ্যাপ্লায়েন্সেস ও সার্কিট ডায়াগনসিস।",
    programCodes: ["SSC_VOC", "HSC_VOC"],
    intakeCapacity: 50,
    totalLabs: 2,
    badgeGradient: "from-blue-600 to-indigo-700",
    iconName: "Cpu",
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 102,
    code: "IT-IOT",
    tradeNumber: 2,
    name: "IT Support & IoT Basics",
    nameBangla: "আইটি সাপোর্ট এন্ড আইওটি বেসিক্স",
    shortName: "আইটি ও আইওটি",
    description: "কম্পিউটার হার্ডওয়্যার, নেটওয়ার্কিং, ইন্টারনেট অব থিংস (IoT) ও মাইক্রোকন্ট্রোলার সিস্টেম।",
    programCodes: ["SSC_VOC", "HSC_VOC"],
    intakeCapacity: 50,
    totalLabs: 2,
    badgeGradient: "from-cyan-500 to-blue-600",
    iconName: "Laptop",
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 103,
    code: "GEW",
    tradeNumber: 3,
    name: "General Electrical Workshop",
    nameBangla: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কশপ",
    shortName: "ইলেকট্রিক্যাল ওয়ার্কশপ",
    description: "হাউস ওয়্যারিং, বৈদ্যুতিক মোটর, পাওয়ার সার্কিট ও ওয়ার্কশপ মেইনটেন্যান্স।",
    programCodes: ["SSC_VOC", "HSC_VOC"],
    intakeCapacity: 50,
    totalLabs: 2,
    badgeGradient: "from-amber-500 to-orange-600",
    iconName: "Zap",
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 104,
    code: "AMB",
    tradeNumber: 4,
    name: "Apparel Manufacturing Basics",
    nameBangla: "এপারেল ম্যানুফ্যাকচারিং বেসিক্স",
    shortName: "এপারেল ম্যানুফ্যাকচারিং",
    description: "পোশাক তৈরি, প্যাটার্ন কাটিং, সুইং মেশিন ও তৈরি পোশাক শিল্প দক্ষতা।",
    programCodes: ["SSC_VOC", "HSC_VOC"],
    intakeCapacity: 50,
    totalLabs: 2,
    badgeGradient: "from-rose-500 to-pink-600",
    iconName: "Scissors",
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const DEFAULT_SECTIONS_SHIFTS: SectionShiftRecord[] = [
  { id: "sec_A", name: "Section A", code: "A", shift: "BOTH", shiftNameBangla: "শাখা A", displayOrder: 1, status: "Active" },
  { id: "sec_B", name: "Section B", code: "B", shift: "BOTH", shiftNameBangla: "শাখা B", displayOrder: 2, status: "Active" },
  { id: "shf_1", name: "First Shift", code: "FIRST_SHIFT", shift: "FIRST_SHIFT", shiftNameBangla: "১ম শিফট (সকাল ৮:০০ - দুপুর ১:০০)", displayOrder: 1, status: "Active" },
  { id: "shf_2", name: "Second Shift", code: "SECOND_SHIFT", shift: "SECOND_SHIFT", shiftNameBangla: "২য় শিফট (দুপুর ১:৩০ - সন্ধ্যা ৬:০০)", displayOrder: 2, status: "Active" },
];

/**
 * Builds the comprehensive authoritative baseline academic mappings for session 2026
 */
export function buildAuthoritativeBaselineMappings(year = "2026"): AcademicMappingRecord[] {
  const mappings: AcademicMappingRecord[] = [];

  // 1. Pre-Vocational (Class 6, 7, 8) -> Sections A, B; Shifts 1, 2; Trade: null
  for (const clsNum of [6, 7, 8]) {
    const clsObj = DEFAULT_CLASSES.find((c) => c.numericValue === clsNum)!;
    for (const sec of ["A", "B"]) {
      for (const shift of ["FIRST_SHIFT", "SECOND_SHIFT"]) {
        const id = `map_${year}_PRE_VOC_cls${clsNum}_trd0_sec${sec}_${shift}`;
        mappings.push({
          id,
          academicYear: year,
          programId: 1,
          programCode: "PRE_VOC",
          programName: "প্রাক-ভোকেশনাল",
          classNumeric: clsNum,
          className: clsObj.nameBangla,
          tradeId: null,
          tradeCode: null,
          tradeName: null,
          section: sec,
          shift,
          shiftNameBangla: shift === "FIRST_SHIFT" ? "১ম শিফট" : "২য় শিফট",
          capacity: 60,
          enrolledStudentsCount: 0,
          status: "Active",
          createdAt: `${year}-01-01T00:00:00.000Z`,
          updatedAt: `${year}-01-01T00:00:00.000Z`,
        });
      }
    }
  }

  // 2. SSC Vocational (Class 9, 10) -> 4 Trades, Section A, Shift 1
  for (const clsNum of [9, 10]) {
    const clsObj = DEFAULT_CLASSES.find((c) => c.numericValue === clsNum)!;
    for (const trade of DEFAULT_TRADES) {
      for (const sec of ["A"]) {
        const id = `map_${year}_SSC_VOC_cls${clsNum}_trd${trade.id}_sec${sec}_FIRST_SHIFT`;
        mappings.push({
          id,
          academicYear: year,
          programId: 2,
          programCode: "SSC_VOC",
          programName: "এসএসসি ভোকেশনাল",
          classNumeric: clsNum,
          className: clsObj.nameBangla,
          tradeId: trade.id,
          tradeCode: trade.code,
          tradeName: trade.nameBangla,
          section: sec,
          shift: "FIRST_SHIFT",
          shiftNameBangla: "১ম শিফট",
          capacity: 50,
          enrolledStudentsCount: 0,
          status: "Active",
          createdAt: `${year}-01-01T00:00:00.000Z`,
          updatedAt: `${year}-01-01T00:00:00.000Z`,
        });
      }
    }
  }

  // 3. HSC Vocational (Class 11, 12) -> 4 Trades, Section A, Shift 1
  for (const clsNum of [11, 12]) {
    const clsObj = DEFAULT_CLASSES.find((c) => c.numericValue === clsNum)!;
    for (const trade of DEFAULT_TRADES) {
      for (const sec of ["A"]) {
        const id = `map_${year}_HSC_VOC_cls${clsNum}_trd${trade.id}_sec${sec}_FIRST_SHIFT`;
        mappings.push({
          id,
          academicYear: year,
          programId: 3,
          programCode: "HSC_VOC",
          programName: "এইচএসসি ভোকেশনাল",
          classNumeric: clsNum,
          className: clsObj.nameBangla,
          tradeId: trade.id,
          tradeCode: trade.code,
          tradeName: trade.nameBangla,
          section: sec,
          shift: "FIRST_SHIFT",
          shiftNameBangla: "১ম শিফট",
          capacity: 50,
          enrolledStudentsCount: 0,
          status: "Active",
          createdAt: `${year}-01-01T00:00:00.000Z`,
          updatedAt: `${year}-01-01T00:00:00.000Z`,
        });
      }
    }
  }

  return mappings;
}

// ============================================================================
// 3. IN-MEMORY RUNTIME OVERRIDE STORE (HYBRID SYNCHRONIZER)
// ============================================================================

const METADATA_KEY_INSTITUTION = "ptsc_master_institution_settings";
const METADATA_KEY_YEARS = "ptsc_master_academic_years";
const METADATA_KEY_PROGRAMS = "ptsc_master_academic_programs";
const METADATA_KEY_CLASSES = "ptsc_master_classes";
const METADATA_KEY_TRADES = "ptsc_master_trades";
const METADATA_KEY_LABS = "ptsc_master_labs";
const METADATA_KEY_MAPPINGS = "ptsc_master_academic_mappings";

let memoryInstitutionSettings: InstitutionSettings = { ...DEFAULT_INSTITUTION_SETTINGS };
let memoryAcademicYears: AcademicYearRecord[] = [...DEFAULT_ACADEMIC_YEARS];
let memoryPrograms: AcademicProgramRecord[] = [...DEFAULT_ACADEMIC_PROGRAMS];
let memoryClasses: ClassMasterRecord[] = [...DEFAULT_CLASSES];
let memoryTrades: TradeMasterRecord[] = [...DEFAULT_TRADES];
let memoryLabs: LabMasterRecord[] = [
  {
    id: 1,
    name: "General Electronics & Robotics Lab",
    nameBangla: "জেনারেল ইলেকট্রনিক্স ও রোবোটিক্স ল্যাব",
    code: "LAB-GE",
    tradeId: 101,
    tradeName: "Consumer Electronics",
    roomNumber: "Room 201",
    capacity: 40,
    status: "Active",
    description: "Digital Oscilloscope, PCB Etching & Microcontroller Equipment",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "IT Support & IoT Hardware Lab",
    nameBangla: "আইটি সাপোর্ট ও আইওটি ল্যাব",
    code: "LAB-IT",
    tradeId: 102,
    tradeName: "IT Support & IoT Basics",
    roomNumber: "Room 204",
    capacity: 40,
    status: "Active",
    description: "High speed networked computer workstations and IoT sensors",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
let memorySectionsShifts: SectionShiftRecord[] = [...DEFAULT_SECTIONS_SHIFTS];
let memoryMappings: AcademicMappingRecord[] = [];

let isHydratedFromPersistentStore = false;

/**
 * Hydrates master data from persistent database metadata store if present
 */
export async function hydrateMasterData(): Promise<void> {
  if (isHydratedFromPersistentStore) return;

  try {
    if (isPrismaAvailable()) {
      // 1. Load Academic Years from native Prisma model if populated
      try {
        const dbYears = await prisma.academicYear.findMany({ orderBy: { id: "asc" } });
        if (dbYears && dbYears.length > 0) {
          memoryAcademicYears = dbYears.map((y: any) => ({
            id: y.id,
            name: y.name,
            code: `AY-${y.name}`,
            startDate: y.startDate,
            endDate: y.endDate,
            status: (y.status as AcademicYearStatus) || (y.isCurrent ? "Active" : "Closed"),
            isCurrent: Boolean(y.isCurrent),
            remarks: y.remarks || "",
            createdAt: y.createdAt ? new Date(y.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: y.updatedAt ? new Date(y.updatedAt).toISOString() : new Date().toISOString(),
          }));
        }
      } catch (err) {
        // Safe fallback
      }

      // 2. Load Dynamic Stores
      try {
        const metadataStores = await prisma.dynamicMetadataStore.findMany({
          where: {
            category: "academic_master_data",
          },
        });

        for (const store of metadataStores) {
          try {
            const parsed = JSON.parse(store.valueJson);
            if (store.key === METADATA_KEY_INSTITUTION && parsed) {
              memoryInstitutionSettings = { ...memoryInstitutionSettings, ...parsed };
            } else if (store.key === METADATA_KEY_PROGRAMS && Array.isArray(parsed)) {
              memoryPrograms = parsed;
            } else if (store.key === METADATA_KEY_CLASSES && Array.isArray(parsed)) {
              memoryClasses = parsed;
            } else if (store.key === METADATA_KEY_TRADES && Array.isArray(parsed)) {
              memoryTrades = parsed;
            } else if (store.key === METADATA_KEY_LABS && Array.isArray(parsed)) {
              memoryLabs = parsed;
            } else if (store.key === METADATA_KEY_MAPPINGS && Array.isArray(parsed)) {
              memoryMappings = parsed;
            }
          } catch (e) {
            console.warn(`[MasterDataEngine] Failed parsing store ${store.key}:`, e);
          }
        }
      } catch (err) {
        // Safe fallback
      }
    }
  } catch (error) {
    console.warn("[MasterDataEngine] Hydration completed with memory defaults:", error);
  } finally {
    isHydratedFromPersistentStore = true;
  }
}

/**
 * Persists updated store into DynamicMetadataStore safely
 */
async function persistStoreSlice(key: string, data: any): Promise<void> {
  if (!isPrismaAvailable()) return;

  try {
    await prisma.dynamicMetadataStore.upsert({
      where: { key },
      update: {
        valueJson: JSON.stringify(data),
        category: "academic_master_data",
        updatedBy: "Admin",
      },
      create: {
        key,
        valueJson: JSON.stringify(data),
        category: "academic_master_data",
        updatedBy: "Admin",
      },
    });
  } catch (err) {
    console.warn(`[MasterDataEngine] Could not persist slice ${key} to DB:`, err);
  }
}

// ============================================================================
// 4. BUSINESS LOGIC & VALIDATION ENGINES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates whether an academic mapping is structurally sound per BTEB & institutional rules
 */
export function validateAcademicMapping(
  mapping: Partial<AcademicMappingRecord>,
  existingMappings: AcademicMappingRecord[] = memoryMappings
): ValidationResult {
  const errors: string[] = [];

  if (!mapping.academicYear || mapping.academicYear.trim() === "") {
    errors.push("শিক্ষাবর্ষ (Academic Year) উল্লেখ করা বাধ্যতামূলক।");
  }

  if (!mapping.classNumeric) {
    errors.push("শ্রেণি (Class) নির্বাচন করা বাধ্যতামূলক।");
  }

  const clsNumeric = Number(mapping.classNumeric);
  const clsObj = memoryClasses.find((c) => c.numericValue === clsNumeric);
  const classRequiresTrade = clsObj ? Boolean(clsObj.hasTrade) : false;

  // Rule: General classes without trades must not be forced to select a trade
  if (!classRequiresTrade && mapping.tradeId) {
    errors.push(`'${clsObj?.nameBangla || "এই শ্রেণি"}' কারিগরি ট্রেড ভিত্তিক নয়; এতে কোনো ট্রেড নির্ধারণ করা যাবে না।`);
  }

  // Rule: Classes configured with hasTrade = true require a valid trade selection
  if (classRequiresTrade && !mapping.tradeId) {
    errors.push(`'${clsObj?.nameBangla || "এই শ্রেণি"}' কারিগরি ট্রেড ভিত্তিক; একটি অনুমোদিত কারিগরি ট্রেড নির্ধারণ করা আবশ্যক।`);
  }

  // Rule: Validate Trade exists if specified
  if (mapping.tradeId) {
    const tradeExists = memoryTrades.some((t) => t.id === Number(mapping.tradeId));
    if (!tradeExists) {
      errors.push(`নির্দিষ্ট কারিগরি ট্রেড (ID: ${mapping.tradeId}) ডাটাবেজে বিদ্যমান নেই।`);
    }
  }

  // Rule: Duplicate combination prevention
  const tradeKey = mapping.tradeId ? String(mapping.tradeId) : "0";
  const secKey = (mapping.section || "A").trim().toUpperCase();
  const shiftKey = (mapping.shift || "FIRST_SHIFT").trim();

  const isDuplicate = existingMappings.some(
    (existing) =>
      existing.id !== mapping.id &&
      existing.academicYear === mapping.academicYear &&
      Number(existing.classNumeric) === clsNumeric &&
      (existing.tradeId ? String(existing.tradeId) : "0") === tradeKey &&
      existing.section.trim().toUpperCase() === secKey &&
      existing.shift.trim() === shiftKey
  );

  if (isDuplicate) {
    errors.push(
      `একই শিক্ষাবর্ষ (${mapping.academicYear}), শ্রেণি (${clsNumeric}), ট্রেড ও শাখায় পূর্বেই ম্যাপিং বিদ্যমান রয়েছে।`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// 5. MASTER DATA API & RETRIEVAL METHODS
// ============================================================================

/**
 * Returns comprehensive snapshot of all global master data and active mappings
 */
export async function getMasterDataSnapshot(selectedYear?: string): Promise<MasterDataSnapshot> {
  await hydrateMasterData();

  const activeYearObj =
    memoryAcademicYears.find((y) => (selectedYear ? y.name === selectedYear : y.isCurrent || y.status === "Active")) ||
    memoryAcademicYears[0];

  const yearToFilter = activeYearObj ? activeYearObj.name : "2026";
  const filteredMappings = memoryMappings.filter((m) => m.academicYear === yearToFilter);
  const activeMappings = filteredMappings.filter((m) => m.status === "Active");

  return {
    institution: memoryInstitutionSettings,
    academicYears: memoryAcademicYears,
    activeYear: activeYearObj,
    programs: memoryPrograms,
    classes: memoryClasses,
    trades: memoryTrades,
    labs: memoryLabs,
    sectionsShifts: memorySectionsShifts,
    mappings: filteredMappings,
    activeMappings,
    stats: {
      totalYears: memoryAcademicYears.length,
      totalPrograms: memoryPrograms.length,
      totalClasses: memoryClasses.length,
      totalTrades: memoryTrades.length,
      totalLabs: memoryLabs.length,
      totalMappings: filteredMappings.length,
      activeMappingsCount: activeMappings.length,
    },
  };
}

// ----------------------------------------------------------------------------
// Academic Year Mutations
// ----------------------------------------------------------------------------

export async function saveAcademicYearRecord(
  yearData: Partial<AcademicYearRecord>
): Promise<{ success: boolean; year: AcademicYearRecord; error?: string }> {
  await hydrateMasterData();

  if (!yearData.name || yearData.name.trim() === "") {
    return { success: false, year: null as any, error: "শিক্ষাবর্ষের নাম আবশ্যক।" };
  }

  const name = yearData.name.trim();
  const isSettingCurrent = Boolean(yearData.isCurrent || yearData.status === "Active");

  let existingIndex = -1;
  if (yearData.id) {
    existingIndex = memoryAcademicYears.findIndex((y) => y.id === Number(yearData.id));
  } else {
    existingIndex = memoryAcademicYears.findIndex((y) => y.name === name);
  }

  // If setting as active/current, demote others
  if (isSettingCurrent) {
    memoryAcademicYears = memoryAcademicYears.map((y) => ({
      ...y,
      isCurrent: false,
      status: y.status === "Active" ? "Closed" : y.status,
    }));
  }

  let savedYear: AcademicYearRecord;

  if (existingIndex !== -1) {
    savedYear = {
      ...memoryAcademicYears[existingIndex],
      ...yearData,
      name,
      code: `AY-${name}`,
      startDate: yearData.startDate || memoryAcademicYears[existingIndex].startDate || `${name}-01-01`,
      endDate: yearData.endDate || memoryAcademicYears[existingIndex].endDate || `${name}-12-31`,
      status: yearData.status || (isSettingCurrent ? "Active" : memoryAcademicYears[existingIndex].status),
      isCurrent: isSettingCurrent,
      updatedAt: new Date().toISOString(),
    };
    memoryAcademicYears[existingIndex] = savedYear;
  } else {
    savedYear = {
      id: Date.now(),
      name,
      code: `AY-${name}`,
      startDate: yearData.startDate || `${name}-01-01`,
      endDate: yearData.endDate || `${name}-12-31`,
      status: yearData.status || (isSettingCurrent ? "Active" : "Draft"),
      isCurrent: isSettingCurrent,
      remarks: yearData.remarks || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryAcademicYears.unshift(savedYear);
  }

  // Sync to database
  if (isPrismaAvailable()) {
    try {
      if (isSettingCurrent) {
        await prisma.academicYear.updateMany({
          data: { isCurrent: false, status: "Closed" },
        });
      }
      await prisma.academicYear.upsert({
        where: { name },
        update: {
          startDate: savedYear.startDate,
          endDate: savedYear.endDate,
          status: savedYear.status,
          isCurrent: savedYear.isCurrent,
        },
        create: {
          name: savedYear.name,
          startDate: savedYear.startDate,
          endDate: savedYear.endDate,
          status: savedYear.status,
          isCurrent: savedYear.isCurrent,
        },
      });
    } catch (e) {
      console.warn("[MasterDataEngine] Prisma year sync failed:", e);
    }
  }

  await persistStoreSlice(METADATA_KEY_YEARS, memoryAcademicYears);
  return { success: true, year: savedYear };
}

// ----------------------------------------------------------------------------
// Academic Program Mutations
// ----------------------------------------------------------------------------

export async function saveAcademicProgramRecord(
  programData: Partial<AcademicProgramRecord>
): Promise<{ success: boolean; program: AcademicProgramRecord; error?: string }> {
  await hydrateMasterData();

  if (!programData.nameBangla || !programData.code) {
    return { success: false, program: null as any, error: "প্রোগ্রামের নাম ও কোড বাধ্যতামূলক।" };
  }

  const code = programData.code.trim().toUpperCase();
  const existingIdx = memoryPrograms.findIndex((p) => p.id === programData.id || p.code === code);

  let savedProg: AcademicProgramRecord;
  if (existingIdx !== -1) {
    savedProg = {
      ...memoryPrograms[existingIdx],
      ...programData,
      code,
      updatedAt: new Date().toISOString(),
    };
    memoryPrograms[existingIdx] = savedProg;
  } else {
    savedProg = {
      id: Date.now(),
      code,
      name: programData.name || code,
      nameBangla: programData.nameBangla,
      shortName: programData.shortName || code,
      description: programData.description || "",
      level: programData.level || "secondary",
      minClass: Number(programData.minClass) || 9,
      maxClass: Number(programData.maxClass) || 10,
      applicableClassNumerics: programData.applicableClassNumerics || [9, 10],
      hasTrades: Boolean(programData.hasTrades),
      curriculumBoard: programData.curriculumBoard || "BTEB",
      displayOrder: programData.displayOrder || memoryPrograms.length + 1,
      status: programData.status || "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryPrograms.push(savedProg);
  }

  await persistStoreSlice(METADATA_KEY_PROGRAMS, memoryPrograms);
  return { success: true, program: savedProg };
}

// ----------------------------------------------------------------------------
// Class Master Mutations
// ----------------------------------------------------------------------------

export async function saveClassMasterRecord(
  classData: Partial<ClassMasterRecord>
): Promise<{ success: boolean; classRecord: ClassMasterRecord; error?: string }> {
  await hydrateMasterData();

  if (!classData.numericValue || !classData.nameBangla) {
    return { success: false, classRecord: null as any, error: "শ্রেণির সংখ্যাগত মান ও বাংলা নাম আবশ্যক।" };
  }

  const numVal = Number(classData.numericValue);
  const existingIdx = memoryClasses.findIndex((c) => c.id === classData.id || c.numericValue === numVal);

  let savedCls: ClassMasterRecord;
  if (existingIdx !== -1) {
    savedCls = {
      ...memoryClasses[existingIdx],
      ...classData,
      numericValue: numVal,
      updatedAt: new Date().toISOString(),
    };
    memoryClasses[existingIdx] = savedCls;
  } else {
    savedCls = {
      id: Date.now(),
      numericValue: numVal,
      code: classData.code || `CLS-${numVal}`,
      name: classData.name || `Class ${numVal}`,
      nameBangla: classData.nameBangla,
      programCode: classData.programCode || (numVal <= 8 ? "PRE_VOC" : numVal <= 10 ? "SSC_VOC" : "HSC_VOC"),
      programId: classData.programId || (numVal <= 8 ? 1 : numVal <= 10 ? 2 : 3),
      displayOrder: classData.displayOrder || numVal,
      hasTrade: classData.hasTrade !== undefined ? Boolean(classData.hasTrade) : numVal >= 9,
      defaultSections: classData.defaultSections || ["A", "B"],
      defaultShifts: classData.defaultShifts || ["FIRST_SHIFT"],
      totalSeats: Number(classData.totalSeats) || 80,
      status: classData.status || "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryClasses.push(savedCls);
    memoryClasses.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  if (isPrismaAvailable()) {
    try {
      await prisma.academicClass.upsert({
        where: { numericValue: numVal },
        update: {
          name: savedCls.name,
          nameBangla: savedCls.nameBangla,
          hasTrade: savedCls.hasTrade,
          sections: savedCls.defaultSections.join(","),
          shifts: savedCls.defaultShifts.join(","),
        },
        create: {
          name: savedCls.name,
          nameBangla: savedCls.nameBangla,
          numericValue: numVal,
          level: savedCls.hasTrade ? "technical" : "general",
          hasTrade: savedCls.hasTrade,
          sections: savedCls.defaultSections.join(","),
          shifts: savedCls.defaultShifts.join(","),
        },
      });
    } catch (e) {
      console.warn("Prisma class sync failed:", e);
    }
  }

  await persistStoreSlice(METADATA_KEY_CLASSES, memoryClasses);
  return { success: true, classRecord: savedCls };
}

// ----------------------------------------------------------------------------
// Trade Master Mutations
// ----------------------------------------------------------------------------

export async function saveTradeMasterRecord(
  tradeData: Partial<TradeMasterRecord>
): Promise<{ success: boolean; trade: TradeMasterRecord; error?: string }> {
  await hydrateMasterData();

  if (!tradeData.code || !tradeData.nameBangla) {
    return { success: false, trade: null as any, error: "ট্রেডের কোড ও বাংলা নাম আবশ্যক।" };
  }

  const code = tradeData.code.trim().toUpperCase();
  const existingIdx = memoryTrades.findIndex((t) => t.id === tradeData.id || t.code === code);

  let savedTrade: TradeMasterRecord;
  if (existingIdx !== -1) {
    savedTrade = {
      ...memoryTrades[existingIdx],
      ...tradeData,
      code,
      updatedAt: new Date().toISOString(),
    };
    memoryTrades[existingIdx] = savedTrade;
  } else {
    savedTrade = {
      id: tradeData.id || 100 + memoryTrades.length + 1,
      code,
      tradeNumber: tradeData.tradeNumber || ((memoryTrades.length + 1) as any),
      name: tradeData.name || code,
      nameBangla: tradeData.nameBangla,
      shortName: tradeData.shortName || tradeData.nameBangla,
      description: tradeData.description || "",
      programCodes: tradeData.programCodes || ["SSC_VOC", "HSC_VOC"],
      intakeCapacity: Number(tradeData.intakeCapacity) || 50,
      totalLabs: Number(tradeData.totalLabs) || 2,
      badgeGradient: tradeData.badgeGradient || "from-indigo-600 to-cyan-600",
      iconName: tradeData.iconName || "Cpu",
      status: tradeData.status || "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryTrades.push(savedTrade);
  }

  if (isPrismaAvailable()) {
    try {
      await prisma.trade.upsert({
        where: { code },
        update: {
          name: savedTrade.name,
          nameBangla: savedTrade.nameBangla,
          description: savedTrade.description,
          intakeCapacity: savedTrade.intakeCapacity,
          totalLabs: savedTrade.totalLabs,
        },
        create: {
          code,
          name: savedTrade.name,
          nameBangla: savedTrade.nameBangla,
          description: savedTrade.description,
          intakeCapacity: savedTrade.intakeCapacity,
          totalLabs: savedTrade.totalLabs,
        },
      });
    } catch (e) {
      console.warn("Prisma trade sync failed:", e);
    }
  }

  await persistStoreSlice(METADATA_KEY_TRADES, memoryTrades);
  return { success: true, trade: savedTrade };
}

// ----------------------------------------------------------------------------
// Academic Mapping CRUD & Business Rule Engine
// ----------------------------------------------------------------------------

export async function saveAcademicMappingRecord(
  mappingData: Partial<AcademicMappingRecord> & { originalId?: string }
): Promise<{ success: boolean; mapping: AcademicMappingRecord; errors?: string[] }> {
  await hydrateMasterData();

  const targetId = mappingData.originalId || mappingData.id;
  // Validate structural integrity
  const validation = validateAcademicMapping(
    { ...mappingData, id: targetId },
    memoryMappings
  );
  if (!validation.valid) {
    return { success: false, mapping: null as any, errors: validation.errors };
  }

  const year = mappingData.academicYear || "2026";
  const clsNum = Number(mappingData.classNumeric);
  const progObj =
    memoryPrograms.find((p) => p.id === mappingData.programId || p.code === mappingData.programCode) ||
    memoryPrograms.find((p) => (clsNum <= 8 ? p.code === "PRE_VOC" : clsNum <= 10 ? p.code === "SSC_VOC" : p.code === "HSC_VOC")) ||
    memoryPrograms[1];
  const clsObj = memoryClasses.find((c) => c.numericValue === clsNum) || memoryClasses[3];

  let tradeObj: TradeMasterRecord | null = null;
  if (clsNum >= 9 && mappingData.tradeId) {
    tradeObj = memoryTrades.find((t) => t.id === Number(mappingData.tradeId)) || null;
  }

  const sec = (mappingData.section || "A").trim().toUpperCase();
  const shift = (mappingData.shift || "FIRST_SHIFT").trim();
  const tradeKey = tradeObj ? String(tradeObj.id) : "0";
  const generatedId = `map_${year}_${progObj.code}_cls${clsNum}_trd${tradeKey}_sec${sec}_${shift}`;

  // If editing an existing mapping with a different ID, remove the old mapping entry
  if (mappingData.originalId && mappingData.originalId !== generatedId) {
    memoryMappings = memoryMappings.filter((m) => m.id !== mappingData.originalId);
  }

  const savedMapping: AcademicMappingRecord = {
    id: generatedId,
    academicYear: year,
    programId: progObj.id,
    programCode: progObj.code,
    programName: progObj.nameBangla,
    classNumeric: clsNum,
    className: clsObj.nameBangla,
    tradeId: tradeObj ? tradeObj.id : null,
    tradeCode: tradeObj ? tradeObj.code : null,
    tradeName: tradeObj ? tradeObj.nameBangla : null,
    section: sec,
    shift,
    shiftNameBangla: shift === "FIRST_SHIFT" ? "১ম শিফট" : "২য় শিফট",
    capacity: Number(mappingData.capacity) || (clsNum <= 8 ? 60 : 50),
    enrolledStudentsCount: mappingData.enrolledStudentsCount || 0,
    status: mappingData.status || "Active",
    createdAt: mappingData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = memoryMappings.findIndex((m) => m.id === generatedId);
  if (existingIdx !== -1) {
    memoryMappings[existingIdx] = savedMapping;
  } else {
    memoryMappings.unshift(savedMapping);
  }

  await persistStoreSlice(METADATA_KEY_MAPPINGS, memoryMappings);
  return { success: true, mapping: savedMapping };
}

/**
 * Checks if an Academic Mapping is referenced by existing students or attendance records
 */
export async function checkMappingUsage(mappingId: string): Promise<{
  referenced: boolean;
  studentCount: number;
  attendanceCount: number;
  mapping: AcademicMappingRecord | null;
  reason?: string;
}> {
  await hydrateMasterData();
  const mapping = memoryMappings.find((m) => m.id === mappingId) || null;
  if (!mapping) {
    return { referenced: false, studentCount: 0, attendanceCount: 0, mapping: null };
  }

  let studentCount = mapping.enrolledStudentsCount || 0;
  let attendanceCount = 0;

  if (isPrismaAvailable()) {
    try {
      const dbStudentCount = await prisma.student.count({
        where: {
          session: mapping.academicYear,
          class: { numericValue: mapping.classNumeric },
          section: mapping.section,
          ...(mapping.tradeId ? { tradeId: mapping.tradeId } : {}),
        },
      });
      if (dbStudentCount > 0) {
        studentCount = Math.max(studentCount, dbStudentCount);
      }

      const dbAttendanceCount = await prisma.attendanceRecord.count({
        where: {
          session: mapping.academicYear,
          class: { numericValue: mapping.classNumeric },
          section: mapping.section,
          shift: mapping.shift as any,
          ...(mapping.tradeId ? { tradeId: mapping.tradeId } : {}),
        },
      });
      attendanceCount = dbAttendanceCount;
    } catch {
      // Prisma table may be empty or offline; fallback to recorded counts
    }
  }

  const isReferenced = studentCount > 0 || attendanceCount > 0;
  return {
    referenced: isReferenced,
    studentCount,
    attendanceCount,
    mapping,
    reason: isReferenced
      ? `এই ম্যাপিংয়ে ${studentCount} জন শিক্ষার্থী অথবা ${attendanceCount}টি ক্লাসের হাজিরা রেকর্ড বিদ্যমান।`
      : undefined,
  };
}

/**
 * Deletes an Academic Mapping record safely.
 * If referenced and force is false, rejects deletion and advises deactivation to preserve historical integrity.
 */
export async function deleteAcademicMappingRecord(
  mappingId: string,
  options?: { force?: boolean }
): Promise<{
  success: boolean;
  deletedMapping?: AcademicMappingRecord;
  error?: string;
  referenced?: boolean;
  studentCount?: number;
  attendanceCount?: number;
}> {
  await hydrateMasterData();
  const idx = memoryMappings.findIndex((m) => m.id === mappingId);
  if (idx === -1) {
    return { success: false, error: "ম্যাপিং রেকর্ডটি খুঁজে পাওয়া যায়নি।" };
  }

  const usage = await checkMappingUsage(mappingId);
  if (usage.referenced && !options?.force) {
    return {
      success: false,
      referenced: true,
      studentCount: usage.studentCount,
      attendanceCount: usage.attendanceCount,
      error: `এই ম্যাপিংয়ের অধীনে ${usage.studentCount} জন শিক্ষার্থী অথবা ${usage.attendanceCount}টি হাজিরা রেকর্ড বিদ্যমান। হিস্টোরিক্যাল ডাটা সংরক্ষণের জন্য সরাসরি ডিলিট করার পরিবর্তে ম্যাপিংটি 'নিষ্ক্রিয় (Deactivate)' করুন।`,
    };
  }

  const [deleted] = memoryMappings.splice(idx, 1);
  await persistStoreSlice(METADATA_KEY_MAPPINGS, memoryMappings);

  return {
    success: true,
    deletedMapping: deleted,
  };
}

/**
 * Toggles mapping active state safely preserving historical enrollment/attendance data
 */
export async function toggleAcademicMappingStatus(
  mappingId: string,
  newStatus?: "Active" | "Inactive"
): Promise<{ success: boolean; mapping?: AcademicMappingRecord; error?: string }> {
  await hydrateMasterData();

  const idx = memoryMappings.findIndex((m) => m.id === mappingId);
  if (idx === -1) {
    return { success: false, error: "ম্যাপিং রেকর্ডটি খুঁজে পাওয়া যায়নি।" };
  }

  const currentStatus = memoryMappings[idx].status;
  const targetStatus = newStatus || (currentStatus === "Active" ? "Inactive" : "Active");

  memoryMappings[idx] = {
    ...memoryMappings[idx],
    status: targetStatus,
    updatedAt: new Date().toISOString(),
  };

  await persistStoreSlice(METADATA_KEY_MAPPINGS, memoryMappings);
  return { success: true, mapping: memoryMappings[idx] };
}

/**
 * Saves and updates institution profile & contact metadata
 */
export async function saveInstitutionSettings(
  updates: Partial<InstitutionSettings>
): Promise<InstitutionSettings> {
  await hydrateMasterData();

  memoryInstitutionSettings = {
    ...memoryInstitutionSettings,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Sync with institutionalDb in database.ts
  institutionalDb.institution = {
    ...institutionalDb.institution,
    name: memoryInstitutionSettings.name,
    nameBangla: memoryInstitutionSettings.nameBangla,
    eiin: memoryInstitutionSettings.eiin,
    code: memoryInstitutionSettings.code,
    principalName: memoryInstitutionSettings.principalName,
    principalMobile: memoryInstitutionSettings.principalMobile,
    email: memoryInstitutionSettings.email,
    phoneLandline: memoryInstitutionSettings.phoneLandline,
    website: memoryInstitutionSettings.website,
    locationBangla: memoryInstitutionSettings.locationBangla,
  };

  await persistStoreSlice(METADATA_KEY_INSTITUTION, memoryInstitutionSettings);
  return memoryInstitutionSettings;
}

/**
 * Idempotent seeder: initializes or merges authoritative default Master Data
 * without deleting historical records or creating duplicates.
 */
export async function seedDefaultMasterData(options?: { forceReset?: boolean }): Promise<{
  success: boolean;
  message: string;
  summary: {
    yearsCount: number;
    programsCount: number;
    classesCount: number;
    tradesCount: number;
    mappingsCount: number;
  };
}> {
  await hydrateMasterData();

  if (options?.forceReset) {
    memoryInstitutionSettings = { ...DEFAULT_INSTITUTION_SETTINGS };
    memoryAcademicYears = [...DEFAULT_ACADEMIC_YEARS];
    memoryPrograms = [...DEFAULT_ACADEMIC_PROGRAMS];
    memoryClasses = [...DEFAULT_CLASSES];
    memoryTrades = [...DEFAULT_TRADES];
    memorySectionsShifts = [...DEFAULT_SECTIONS_SHIFTS];
    memoryMappings = buildAuthoritativeBaselineMappings("2026");
  } else {
    // Non-destructive idempotent merge:
    // 1. Years: add missing
    for (const defYear of DEFAULT_ACADEMIC_YEARS) {
      if (!memoryAcademicYears.some((y) => y.name === defYear.name)) {
        memoryAcademicYears.push(defYear);
      }
    }

    // 2. Programs: add missing
    for (const defProg of DEFAULT_ACADEMIC_PROGRAMS) {
      if (!memoryPrograms.some((p) => p.code === defProg.code)) {
        memoryPrograms.push(defProg);
      }
    }

    // 3. Classes: add missing
    for (const defCls of DEFAULT_CLASSES) {
      if (!memoryClasses.some((c) => c.numericValue === defCls.numericValue)) {
        memoryClasses.push(defCls);
      }
    }

    // 4. Trades: add missing
    for (const defTrd of DEFAULT_TRADES) {
      if (!memoryTrades.some((t) => t.code === defTrd.code || t.id === defTrd.id)) {
        memoryTrades.push(defTrd);
      }
    }

    // 5. Mappings: add missing baseline mappings without overriding existing
    const defaultMappings = buildAuthoritativeBaselineMappings("2026");
    for (const defMap of defaultMappings) {
      const exists = memoryMappings.some(
        (m) =>
          m.academicYear === defMap.academicYear &&
          m.classNumeric === defMap.classNumeric &&
          m.tradeId === defMap.tradeId &&
          m.section === defMap.section &&
          m.shift === defMap.shift
      );
      if (!exists) {
        memoryMappings.push(defMap);
      }
    }
  }

  // Persist all slices
  await persistStoreSlice(METADATA_KEY_INSTITUTION, memoryInstitutionSettings);
  await persistStoreSlice(METADATA_KEY_YEARS, memoryAcademicYears);
  await persistStoreSlice(METADATA_KEY_PROGRAMS, memoryPrograms);
  await persistStoreSlice(METADATA_KEY_CLASSES, memoryClasses);
  await persistStoreSlice(METADATA_KEY_TRADES, memoryTrades);
  await persistStoreSlice(METADATA_KEY_MAPPINGS, memoryMappings);

  return {
    success: true,
    message: "আইডেমপোটেন্ট মাস্টার ডাটা সিডিং সফল হয়েছে (Idempotent seed completed successfully)।",
    summary: {
      yearsCount: memoryAcademicYears.length,
      programsCount: memoryPrograms.length,
      classesCount: memoryClasses.length,
      tradesCount: memoryTrades.length,
      mappingsCount: memoryMappings.length,
    },
  };
}

// ============================================================================
// 7. COMPREHENSIVE DELETION & INTEGRITY GUARDS
// ============================================================================

/**
 * Checks if an Academic Year is referenced by students, attendance, exam marks, or mappings
 */
export async function checkAcademicYearUsage(yearName: string): Promise<{
  referenced: boolean;
  studentCount: number;
  attendanceCount: number;
  mappingCount: number;
  examCount: number;
  reason?: string;
}> {
  await hydrateMasterData();
  let studentCount = 0;
  let attendanceCount = 0;
  let examCount = 0;
  const mappingCount = memoryMappings.filter((m) => m.academicYear === yearName).length;

  studentCount = (institutionalDb.students || []).filter((s) => s.session === yearName).length;
  attendanceCount = (institutionalDb.attendanceRecords || []).filter(
    (a) => a.session === yearName
  ).length;

  if (isPrismaAvailable()) {
    try {
      const dbStudents = await prisma.student.count({ where: { session: yearName } });
      studentCount = Math.max(studentCount, dbStudents);

      const dbAttendance = await prisma.attendanceRecord.count({ where: { session: yearName } });
      attendanceCount = Math.max(attendanceCount, dbAttendance);

      const dbExams = await prisma.examMark.count({ where: { session: yearName } });
      examCount = dbExams;
    } catch {
      // safe fallback
    }
  }

  const isReferenced = studentCount > 0 || attendanceCount > 0 || mappingCount > 0 || examCount > 0;
  return {
    referenced: isReferenced,
    studentCount,
    attendanceCount,
    mappingCount,
    examCount,
    reason: isReferenced
      ? `এই শিক্ষাবর্ষের (${yearName}) অধীনে ${studentCount} জন শিক্ষার্থী, ${attendanceCount}টি ক্লাসের হাজিরা, এবং ${mappingCount}টি একাডেমিক ম্যাপিং রেকর্ড বিদ্যমান। ডাটা সুরক্ষার স্বার্থে এটি মুছে ফেলা যাবে না। নিষ্ক্রিয় (Archived/Closed) করুন।`
      : undefined,
  };
}

/**
 * Safely deletes an academic year only if unreferenced
 */
export async function deleteAcademicYearRecord(
  idOrName: string | number,
  options?: { force?: boolean }
): Promise<{
  success: boolean;
  deletedYear?: AcademicYearRecord;
  error?: string;
  referenced?: boolean;
}> {
  await hydrateMasterData();
  const yearIdx = memoryAcademicYears.findIndex(
    (y) => y.id === Number(idOrName) || y.name === String(idOrName)
  );

  if (yearIdx === -1) {
    return { success: false, error: "শিক্ষাবর্ষ রেকর্ডটি খুঁজে পাওয়া যায়নি।" };
  }

  const yearObj = memoryAcademicYears[yearIdx];
  const usage = await checkAcademicYearUsage(yearObj.name);

  if (usage.referenced && !options?.force) {
    return {
      success: false,
      referenced: true,
      error: usage.reason || "এই শিক্ষাবর্ষের সাথে শিক্ষার্থী বা পরীক্ষার তথ্য সংযুক্ত থাকায় ডিলিট করা সম্ভব নয়।",
    };
  }

  const [deleted] = memoryAcademicYears.splice(yearIdx, 1);
  await persistStoreSlice(METADATA_KEY_YEARS, memoryAcademicYears);

  if (isPrismaAvailable()) {
    try {
      await prisma.academicYear.deleteMany({
        where: { name: yearObj.name },
      });
    } catch (e) {
      console.warn("Prisma year delete failed:", e);
    }
  }

  return { success: true, deletedYear: deleted };
}

/**
 * Checks if a class is referenced by students, attendance, or mappings
 */
export async function checkClassUsage(classNumeric: number): Promise<{
  referenced: boolean;
  studentCount: number;
  attendanceCount: number;
  mappingCount: number;
  reason?: string;
}> {
  await hydrateMasterData();
  let studentCount = 0;
  let attendanceCount = 0;
  const mappingCount = memoryMappings.filter((m) => m.classNumeric === classNumeric).length;

  studentCount = institutionalDb.students.filter(
    (s) =>
      Number(s.classId) === classNumeric ||
      (typeof s.classId === "number" && s.classId <= 7 && s.classId + 5 === classNumeric)
  ).length;

  if (isPrismaAvailable()) {
    try {
      const dbStudents = await prisma.student.count({
        where: {
          class: { numericValue: classNumeric },
        },
      });
      studentCount = Math.max(studentCount, dbStudents);

      const dbAttendance = await prisma.attendanceRecord.count({
        where: {
          class: { numericValue: classNumeric },
        },
      });
      attendanceCount = dbAttendance;
    } catch {
      // safe fallback
    }
  }

  const isReferenced = studentCount > 0 || attendanceCount > 0 || mappingCount > 0;
  return {
    referenced: isReferenced,
    studentCount,
    attendanceCount,
    mappingCount,
    reason: isReferenced
      ? `এই শ্রেণির সাথে ${studentCount} জন শিক্ষার্থী, ${attendanceCount}টি ক্লাসের হাজিরা ও ${mappingCount}টি একাডেমিক ম্যাপিং বিদ্যমান। সরাসরি ডিলিট করা নিরাপদ নয়।`
      : undefined,
  };
}

/**
 * Safely deletes a class only if unreferenced
 */
export async function deleteClassMasterRecord(
  classIdOrNumeric: string | number,
  options?: { force?: boolean }
): Promise<{
  success: boolean;
  deletedClass?: ClassMasterRecord;
  error?: string;
  referenced?: boolean;
}> {
  await hydrateMasterData();
  const clsIdx = memoryClasses.findIndex(
    (c) => c.id === Number(classIdOrNumeric) || c.numericValue === Number(classIdOrNumeric)
  );

  if (clsIdx === -1) {
    return { success: false, error: "শ্রেণি রেকর্ডটি খুঁজে পাওয়া যায়নি।" };
  }

  const clsObj = memoryClasses[clsIdx];
  const usage = await checkClassUsage(clsObj.numericValue);

  if (usage.referenced && !options?.force) {
    return {
      success: false,
      referenced: true,
      error: usage.reason || "এই শ্রেণির সাথে শিক্ষার্থী বা ক্লাসের তথ্য সংযুক্ত থাকায় ডিলিট করা সম্ভব নয়।",
    };
  }

  const [deleted] = memoryClasses.splice(clsIdx, 1);
  await persistStoreSlice(METADATA_KEY_CLASSES, memoryClasses);

  if (isPrismaAvailable()) {
    try {
      await prisma.academicClass.deleteMany({
        where: { numericValue: clsObj.numericValue },
      });
    } catch (e) {
      console.warn("Prisma class delete failed:", e);
    }
  }

  return { success: true, deletedClass: deleted };
}

/**
 * Checks if a trade is referenced by students, faculty, or mappings
 */
export async function checkTradeUsage(tradeId: number): Promise<{
  referenced: boolean;
  studentCount: number;
  mappingCount: number;
  reason?: string;
}> {
  await hydrateMasterData();
  let studentCount = 0;
  const mappingCount = memoryMappings.filter((m) => m.tradeId === tradeId).length;

  studentCount = institutionalDb.students.filter((s) => Number(s.tradeId) === tradeId).length;

  if (isPrismaAvailable()) {
    try {
      const dbStudents = await prisma.student.count({
        where: { tradeId },
      });
      studentCount = Math.max(studentCount, dbStudents);
    } catch {
      // safe fallback
    }
  }

  const isReferenced = studentCount > 0 || mappingCount > 0;
  return {
    referenced: isReferenced,
    studentCount,
    mappingCount,
    reason: isReferenced
      ? `এই কারিগরি ট্রেডে ${studentCount} জন শিক্ষার্থী ও ${mappingCount}টি একাডেমিক ম্যাপিং যুক্ত রয়েছে।`
      : undefined,
  };
}

/**
 * Safely deletes a trade only if unreferenced
 */
export async function deleteTradeMasterRecord(
  tradeId: string | number,
  options?: { force?: boolean }
): Promise<{
  success: boolean;
  deletedTrade?: TradeMasterRecord;
  error?: string;
  referenced?: boolean;
}> {
  await hydrateMasterData();
  const trdIdx = memoryTrades.findIndex((t) => t.id === Number(tradeId));

  if (trdIdx === -1) {
    return { success: false, error: "ট্রেড রেকর্ডটি খুঁজে পাওয়া যায়নি।" };
  }

  const trdObj = memoryTrades[trdIdx];
  const usage = await checkTradeUsage(trdObj.id);

  if (usage.referenced && !options?.force) {
    return {
      success: false,
      referenced: true,
      error: usage.reason || "এই ট্রেডের অধীনে শিক্ষার্থী যুক্ত থাকায় ডিলিট করা সম্ভব নয়।",
    };
  }

  const [deleted] = memoryTrades.splice(trdIdx, 1);
  await persistStoreSlice(METADATA_KEY_TRADES, memoryTrades);

  if (isPrismaAvailable()) {
    try {
      await prisma.trade.deleteMany({
        where: { id: trdObj.id },
      });
    } catch (e) {
      console.warn("Prisma trade delete failed:", e);
    }
  }

  return { success: true, deletedTrade: deleted };
}

// ----------------------------------------------------------------------------
// Lab Management CRUD
// ----------------------------------------------------------------------------

export async function getLabsList(): Promise<LabMasterRecord[]> {
  await hydrateMasterData();
  return memoryLabs;
}

export async function saveLabRecord(
  labData: Partial<LabMasterRecord>
): Promise<{ success: boolean; lab: LabMasterRecord; error?: string }> {
  await hydrateMasterData();

  if (!labData.name || !labData.code) {
    return { success: false, lab: null as any, error: "ল্যাবের নাম ও কোড বাধ্যতামূলক।" };
  }

  const code = labData.code.trim().toUpperCase();
  const existingIdx = memoryLabs.findIndex((l) => l.id === labData.id || l.code === code);

  let tradeName: string | null = null;
  if (labData.tradeId) {
    const trade = memoryTrades.find((t) => t.id === Number(labData.tradeId));
    tradeName = trade ? trade.nameBangla : null;
  }

  let savedLab: LabMasterRecord;
  if (existingIdx !== -1) {
    savedLab = {
      ...memoryLabs[existingIdx],
      ...labData,
      code,
      tradeId: labData.tradeId ? Number(labData.tradeId) : null,
      tradeName,
      capacity: Number(labData.capacity) || 40,
      updatedAt: new Date().toISOString(),
    };
    memoryLabs[existingIdx] = savedLab;
  } else {
    savedLab = {
      id: labData.id || Date.now(),
      name: labData.name,
      nameBangla: labData.nameBangla || labData.name,
      code,
      tradeId: labData.tradeId ? Number(labData.tradeId) : null,
      tradeName,
      roomNumber: labData.roomNumber || "N/A",
      capacity: Number(labData.capacity) || 40,
      status: labData.status || "Active",
      description: labData.description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryLabs.push(savedLab);
  }

  await persistStoreSlice(METADATA_KEY_LABS, memoryLabs);
  return { success: true, lab: savedLab };
}

export async function checkLabUsage(labId: number): Promise<{
  referenced: boolean;
  equipmentCount: number;
  reason?: string;
}> {
  await hydrateMasterData();
  const lab = memoryLabs.find((l) => l.id === labId);
  if (!lab) return { referenced: false, equipmentCount: 0 };

  let equipmentCount = 0;

  if (isPrismaAvailable()) {
    try {
      const dbEquip = await prisma.labEquipment.count({
        where: {
          OR: [
            { labName: { contains: lab.code } },
            ...(lab.tradeId ? [{ tradeId: lab.tradeId }] : []),
          ],
        },
      });
      equipmentCount = Math.max(equipmentCount, dbEquip);
    } catch {
      // safe fallback
    }
  }

  const isReferenced = equipmentCount > 0;
  return {
    referenced: isReferenced,
    equipmentCount,
    reason: isReferenced
      ? `এই ল্যাবে ${equipmentCount}টি বৈজ্ঞানিক সরঞ্জাম বা যন্ত্রপাতি নথিবদ্ধ রয়েছে।`
      : undefined,
  };
}

export async function deleteLabRecord(
  labId: string | number,
  options?: { force?: boolean }
): Promise<{
  success: boolean;
  deletedLab?: LabMasterRecord;
  error?: string;
  referenced?: boolean;
}> {
  await hydrateMasterData();
  const labIdx = memoryLabs.findIndex((l) => l.id === Number(labId));

  if (labIdx === -1) {
    return { success: false, error: "ল্যাব রেকর্ডটি খুঁজে পাওয়া যায়নি।" };
  }

  const labObj = memoryLabs[labIdx];
  const usage = await checkLabUsage(labObj.id);

  if (usage.referenced && !options?.force) {
    return {
      success: false,
      referenced: true,
      error: usage.reason || "এই ল্যাবের অধীনে যন্ত্রপাতি নথিভুক্ত থাকায় ডিলিট করা সম্ভব নয়।",
    };
  }

  const [deleted] = memoryLabs.splice(labIdx, 1);
  await persistStoreSlice(METADATA_KEY_LABS, memoryLabs);

  return { success: true, deletedLab: deleted };
}

