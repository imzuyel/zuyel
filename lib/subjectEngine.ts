// Advanced Academic Subject & Curriculum Management Engine
// Compliant with Bangladesh Technical Education Board (BTEB) & DTE regulations
// Authoritative Engine for PTSC ERP (Class 6 to 12)

import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  AcademicClass,
  AcademicTrade,
  doesClassHaveTrade,
  getApplicableTradesForClass,
  isTradeValidForClass,
  parseClassNumeric,
} from "./academicStructure";
import { institutionalDb, FacultyMember, RoutineItem } from "./database";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export type SubjectCategoryType =
  | "Theory"
  | "Practical"
  | "Theory + Practical"
  | "Viva/Oral"
  | "Lab"
  | "Workshop"
  | "Assignment/Assessment";

export type SubjectStatus = "Active" | "Inactive" | "Archived";

export interface SubjectMaster {
  id: number;
  code: string; // e.g. "101", "102", "1901", "IT-901"
  name: string;
  nameBangla: string;
  nameEnglish: string;
  shortName: string; // e.g. "BAN-1", "ENG-1", "IOT-1"
  subjectType: SubjectCategoryType;
  creditHours: number; // e.g. 3.0 credits
  fullMarks: number; // e.g. 100
  passMarks: number; // e.g. 33
  theoryMarks: number;
  practicalMarks: number;
  vivaMarks: number;
  continuousMarks: number;
  status: SubjectStatus;
  displayOrder: number;
  description: string;
  btebCurriculumRef?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicSubjectMapping {
  id: string; // `map_${academicYear}_${classId}_${tradeId || 0}_${section || 'all'}_${subjectId}`
  academicYear: string; // e.g. "2026", "2027"
  classId: number; // 1 to 7 corresponding to Class 6..12
  className: string;
  numericClass: number; // 6..12
  section: string; // "A", "B", or "all"
  tradeId?: number; // Only allowed if classId is 4..7 (Class 9..12)
  tradeCode?: string;
  tradeName?: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  subjectNameBangla: string;
  subjectType: SubjectCategoryType;
  isOptional: boolean; // default false (Mandatory / Compulsory)
  weeklyPeriods: number; // required weekly periods (e.g. 4)
  theoryPeriods: number;
  practicalPeriods: number;
  labPeriods: number;
  requiredWeeklyHours: number;
  fullMarks: number;
  passMarks: number;
  theoryMarks: number;
  practicalMarks: number;
  vivaMarks: number;
  continuousMarks: number;
  displayOrder: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export type TeacherRole =
  | "Primary Teacher"
  | "Additional Teacher"
  | "Practical Teacher"
  | "Lab Instructor";

export interface TeacherSubjectAssignment {
  id: string; // `assign_${academicYear}_${classId}_${tradeId || 0}_${section || 'all'}_${subjectId}_${teacherId}`
  academicYear: string;
  classId: number;
  className: string;
  numericClass: number;
  section: string;
  tradeId?: number;
  tradeCode?: string;
  tradeName?: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  subjectNameBangla: string;
  teacherId: number;
  teacherName: string;
  teacherNameBangla?: string;
  teacherDesignation: string;
  department: string;
  role: TeacherRole;
  weeklyAssignedPeriods: number;
  isClassTeacher: boolean;
  status: "Active" | "Inactive";
  assignedAt: string;
  assignedBy: string;
}

export interface SubjectTopic {
  id: string;
  subjectId: number;
  chapterNumber: number;
  chapterName: string;
  chapterNameBangla: string;
  topicName: string;
  topicNameBangla: string;
  serialOrder: number;
  estimatedHours: number;
  learningOutcomes?: string[];
  status: "Active" | "Draft" | "Archived";
  hasQuizAvailable: boolean;
  hasLabJob: boolean;
}

export interface SubjectAuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType:
    | "subject_master"
    | "subject_mapping"
    | "teacher_assignment"
    | "subject_topic"
    | "config_copy"
    | "bulk_operation"
    | "import";
  entityId: string;
  details: string;
  oldValue?: any;
  newValue?: any;
}

// ==========================================
// 2. AUTHORITATIVE INITIAL SEED CATALOG (BTEB & Pre-Vocational)
// ==========================================

export const INITIAL_SUBJECT_MASTERS: SubjectMaster[] = [
  // --- Class 6-8 Pre-Vocational Subjects ---
  {
    id: 1,
    code: "061",
    name: "Bangla",
    nameEnglish: "Bangla",
    nameBangla: "বাংলা",
    shortName: "BAN",
    subjectType: "Theory",
    creditHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    status: "Active",
    displayOrder: 1,
    description: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড অনুমোদিত ৬ষ্ঠ-৮ম শ্রেণির বাংলা পাঠ্যবই।",
    btebCurriculumRef: "NCTB-PREVOC-01",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    code: "062",
    name: "English",
    nameEnglish: "English",
    nameBangla: "ইংরেজি",
    shortName: "ENG",
    subjectType: "Theory",
    creditHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    status: "Active",
    displayOrder: 2,
    description: "English Grammar and Composition for Pre-Vocational tier.",
    btebCurriculumRef: "NCTB-PREVOC-02",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 3,
    code: "063",
    name: "Mathematics",
    nameEnglish: "Mathematics",
    nameBangla: "গণিত",
    shortName: "MATH",
    subjectType: "Theory",
    creditHours: 4.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    status: "Active",
    displayOrder: 3,
    description: "পাটিগণিত, বীজগণিত, জ্যামিতি ও ত্রিকোণমিতির মৌলিক নীতি।",
    btebCurriculumRef: "NCTB-PREVOC-03",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 4,
    code: "064",
    name: "General Science",
    nameEnglish: "General Science",
    nameBangla: "সাধারণ বিজ্ঞান",
    shortName: "SCI",
    subjectType: "Theory + Practical",
    creditHours: 3.5,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 70,
    practicalMarks: 30,
    vivaMarks: 0,
    continuousMarks: 30,
    status: "Active",
    displayOrder: 4,
    description: "পদার্থ, রসায়ন ও জীববিজ্ঞানের প্রাথমিক ধারণা ও হ্যান্ডস-অন সায়েন্স প্র্যাকটিক্যাল।",
    btebCurriculumRef: "NCTB-PREVOC-04",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 5,
    code: "065",
    name: "Religious Studies",
    nameEnglish: "Religious Studies",
    nameBangla: "ধর্ম ও নৈতিক শিক্ষা",
    shortName: "REL",
    subjectType: "Theory",
    creditHours: 2.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    status: "Active",
    displayOrder: 5,
    description: "ইসলাম ও নৈতিক শিক্ষা / হিন্দু ধর্ম ও নৈতিক শিক্ষা।",
    btebCurriculumRef: "NCTB-PREVOC-05",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 6,
    code: "066",
    name: "ICT & Vocational Basics",
    nameEnglish: "ICT & Vocational Basics",
    nameBangla: "তথ্যপ্রযুক্তি ও বেসিক টেকনিক্যাল ওয়ার্ক",
    shortName: "ICT-VOC",
    subjectType: "Workshop",
    creditHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 30,
    status: "Active",
    displayOrder: 6,
    description: "কম্পিউটার টাইপিং, হার্ডওয়্যার পরিচিতি ও প্রাথমিক ওয়ার্কশপ টুলস ব্যবহার।",
    btebCurriculumRef: "NCTB-PREVOC-06",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },

  // --- Class 9-12 Vocational Common Subjects ---
  {
    id: 10,
    code: "101",
    name: "Bangla 1st Paper",
    nameEnglish: "Bangla 1st Paper",
    nameBangla: "বাংলা ১ম পত্র",
    shortName: "BAN-1",
    subjectType: "Theory",
    creditHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    status: "Active",
    displayOrder: 10,
    description: "এসএসসি ও এইচএসসি ভোকেশনাল কারিকুলামভুক্ত বাংলা ১ম পত্র।",
    btebCurriculumRef: "BTEB-GEN-101",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 11,
    code: "102",
    name: "Bangla 2nd Paper",
    nameEnglish: "Bangla 2nd Paper",
    nameBangla: "বাংলা ২য় পত্র",
    shortName: "BAN-2",
    subjectType: "Theory",
    creditHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    status: "Active",
    displayOrder: 11,
    description: "বাংলা ব্যাকরণ ও নির্মিতি।",
    btebCurriculumRef: "BTEB-GEN-102",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 12,
    code: "107",
    name: "English 1st Paper",
    nameEnglish: "English 1st Paper",
    nameBangla: "ইংরেজি ১ম পত্র",
    shortName: "ENG-1",
    subjectType: "Theory",
    creditHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    status: "Active",
    displayOrder: 12,
    description: "English for Today reading comprehension, vocabulary and writing skills.",
    btebCurriculumRef: "BTEB-GEN-107",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 13,
    code: "108",
    name: "English 2nd Paper",
    nameEnglish: "English 2nd Paper",
    nameBangla: "ইংরেজি ২য় পত্র",
    shortName: "ENG-2",
    subjectType: "Theory",
    creditHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    status: "Active",
    displayOrder: 13,
    description: "Applied English grammar, transformation and functional composition.",
    btebCurriculumRef: "BTEB-GEN-108",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 14,
    code: "109",
    name: "Mathematics",
    nameEnglish: "Mathematics",
    nameBangla: "গণিত",
    shortName: "MATH",
    subjectType: "Theory",
    creditHours: 4.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    status: "Active",
    displayOrder: 14,
    description: "কারিগরি শাখার গণিত পাঠ্যক্রম ও ব্যবহারিক জ্যামিতি।",
    btebCurriculumRef: "BTEB-GEN-109",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 15,
    code: "136",
    name: "Physics",
    nameEnglish: "Physics",
    nameBangla: "পদার্থবিজ্ঞান",
    shortName: "PHY",
    subjectType: "Theory + Practical",
    creditHours: 3.5,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 75,
    practicalMarks: 25,
    vivaMarks: 0,
    continuousMarks: 30,
    status: "Active",
    displayOrder: 15,
    description: "গতিবিদ্যা, বল, তাপ, আলো ও স্থির তড়িৎ তত্ত্বীয় ও ল্যাব ব্যবহারিক।",
    btebCurriculumRef: "BTEB-GEN-136",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 16,
    code: "137",
    name: "Chemistry",
    nameEnglish: "Chemistry",
    nameBangla: "রসায়ন",
    shortName: "CHEM",
    subjectType: "Theory + Practical",
    creditHours: 3.5,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 75,
    practicalMarks: 25,
    vivaMarks: 0,
    continuousMarks: 30,
    status: "Active",
    displayOrder: 16,
    description: "পদার্থের গঠন, পর্যায় সারণি, রাসায়নিক বিক্রিয়া ও অম্ল-ক্ষারক পরীক্ষণ।",
    btebCurriculumRef: "BTEB-GEN-137",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },

  // --- Specialized Vocational Trade Subjects ---
  // IT Support & IoT Basics
  {
    id: 21,
    code: "IT-901",
    name: "IT Support Fundamentals & OS (Paper I)",
    nameEnglish: "IT Support Fundamentals & OS",
    nameBangla: "আইটি সাপোর্ট ফান্ডামেন্টালস ও ওএস (১ম পত্র)",
    shortName: "IT-P1",
    subjectType: "Lab",
    creditHours: 4.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 35,
    status: "Active",
    displayOrder: 21,
    description: "কম্পিউটার হার্ডওয়্যার আর্কিটেকচার, পিসি অ্যাসেম্বলিং, অপারেটিং সিস্টেম ইনস্টলেশন ও ট্রাবলশুটিং।",
    btebCurriculumRef: "BTEB-VOC-IT-901",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 22,
    code: "IT-902",
    name: "IoT Sensors & Networking (Paper II)",
    nameEnglish: "IoT Sensors & Networking",
    nameBangla: "আইওটি সেন্সর ও নেটওয়ার্কিং (২য় পত্র)",
    shortName: "IT-P2",
    subjectType: "Lab",
    creditHours: 4.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 35,
    status: "Active",
    displayOrder: 22,
    description: "আইওটি নোড সেন্সর, মাইক্রোকন্ট্রোলার আর্কিটেকচার, ল্যান ক্যাবলিং ও আইপি কনফিগারেশন।",
    btebCurriculumRef: "BTEB-VOC-IT-902",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },

  // General Electrical Works
  {
    id: 23,
    code: "EE-901",
    name: "General Electrical Wiring Principles (Paper I)",
    nameEnglish: "General Electrical Wiring Principles",
    nameBangla: "জেনারেল ইলেকট্রিক্যাল ওয়্যারিং মূলনীতি (১ম পত্র)",
    shortName: "EE-P1",
    subjectType: "Workshop",
    creditHours: 4.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 35,
    status: "Active",
    displayOrder: 23,
    description: "হাউস ওয়্যারিং সার্কিট, কনড্যুইট ওয়্যারিং, নিরাপত্তা সুইচ ও আর্থিং ইন্সটলেশন।",
    btebCurriculumRef: "BTEB-VOC-EE-901",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 24,
    code: "EE-902",
    name: "Electrical Machines & Maintenance (Paper II)",
    nameEnglish: "Electrical Machines & Maintenance",
    nameBangla: "ইলেকট্রিক্যাল মেশিনস ও মেইনটেন্যান্স (২য় পত্র)",
    shortName: "EE-P2",
    subjectType: "Workshop",
    creditHours: 4.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 35,
    status: "Active",
    displayOrder: 24,
    description: "এসি/ডিসি মোটর ওয়াইন্ডিং, ট্রান্সফরমার ওভারহলিং ও সাবস্টেশন রক্ষণাবেক্ষণ।",
    btebCurriculumRef: "BTEB-VOC-EE-902",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },

  // General Electronics
  {
    id: 25,
    code: "GE-101",
    name: "Semiconductors & Electronic Circuits (Paper I)",
    nameEnglish: "Semiconductors & Electronic Circuits",
    nameBangla: "সেমিকন্ডাক্টর ও ইলেকট্রনিক সার্কিট (১ম পত্র)",
    shortName: "GE-P1",
    subjectType: "Lab",
    creditHours: 4.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 35,
    status: "Active",
    displayOrder: 25,
    description: "ডায়োড, ট্রানজিস্টর, অপ-অ্যাম্প সার্কিট ও পিসিবি ডিজাইনিং।",
    btebCurriculumRef: "BTEB-VOC-GE-101",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 26,
    code: "GE-102",
    name: "Digital Electronics & Microprocessors (Paper II)",
    nameEnglish: "Digital Electronics & Microprocessors",
    nameBangla: "ডিজিটাল ইলেকট্রনিক্স ও মাইক্রোপ্রসেসর (২য় পত্র)",
    shortName: "GE-P2",
    subjectType: "Lab",
    creditHours: 4.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 35,
    status: "Active",
    displayOrder: 26,
    description: "লজিক গেটস, ফ্লিপ-ফ্লপ, কাউন্টার, ৮-বিট প্রসেসর আর্কিটেকচার ও রোবোটিক্স।",
    btebCurriculumRef: "BTEB-VOC-GE-102",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },

  // Apparel Manufacturing Basics
  {
    id: 27,
    code: "AMB-101",
    name: "Garment Technology & Pattern Making (Paper I)",
    nameEnglish: "Garment Technology & Pattern Making",
    nameBangla: "গার্মেন্টস টেকনোলজি ও প্যাটার্ন মেকিং (১ম পত্র)",
    shortName: "AMB-P1",
    subjectType: "Workshop",
    creditHours: 4.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 35,
    status: "Active",
    displayOrder: 27,
    description: "টেক্সটাইল ফাইবার, সুতা, ফ্যাব্রিক কাটিং, প্যাটার্ন ও মার্কার মেকিং।",
    btebCurriculumRef: "BTEB-VOC-AMB-101",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 28,
    code: "AMB-102",
    name: "Industrial Sewing & Quality Control (Paper II)",
    nameEnglish: "Industrial Sewing & Quality Control",
    nameBangla: "ইন্ডাস্ট্রিয়াল সুইং ও কোয়ালিটি কন্ট্রোল (২য় পত্র)",
    shortName: "AMB-P2",
    subjectType: "Workshop",
    creditHours: 4.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 35,
    status: "Active",
    displayOrder: 28,
    description: "ইন্ডাস্ট্রিয়াল সুইং মেশিন চালনা, সেলাই কৌশল, ফিনিশিং ও কোয়ালিটি ইন্সপেকশন।",
    btebCurriculumRef: "BTEB-VOC-AMB-102",
    createdBy: "System Admin",
    updatedBy: "System Admin",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

// Initial In-Memory Stores (Isolated by Academic Year)
let subjectMastersStore: SubjectMaster[] = [...INITIAL_SUBJECT_MASTERS];

let subjectMappingsStore: AcademicSubjectMapping[] = [
  // Class 6 (Pre-Vocational) - Year 2026
  {
    id: "map_2026_1_0_all_1",
    academicYear: "2026",
    classId: 1,
    className: "Class 6",
    numericClass: 6,
    section: "all",
    subjectId: 1,
    subjectCode: "061",
    subjectName: "Bangla",
    subjectNameBangla: "বাংলা",
    subjectType: "Theory",
    isOptional: false,
    weeklyPeriods: 4,
    theoryPeriods: 4,
    practicalPeriods: 0,
    labPeriods: 0,
    requiredWeeklyHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    displayOrder: 1,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "map_2026_1_0_all_2",
    academicYear: "2026",
    classId: 1,
    className: "Class 6",
    numericClass: 6,
    section: "all",
    subjectId: 2,
    subjectCode: "062",
    subjectName: "English",
    subjectNameBangla: "ইংরেজি",
    subjectType: "Theory",
    isOptional: false,
    weeklyPeriods: 4,
    theoryPeriods: 4,
    practicalPeriods: 0,
    labPeriods: 0,
    requiredWeeklyHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    displayOrder: 2,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "map_2026_1_0_all_3",
    academicYear: "2026",
    classId: 1,
    className: "Class 6",
    numericClass: 6,
    section: "all",
    subjectId: 3,
    subjectCode: "063",
    subjectName: "Mathematics",
    subjectNameBangla: "গণিত",
    subjectType: "Theory",
    isOptional: false,
    weeklyPeriods: 5,
    theoryPeriods: 5,
    practicalPeriods: 0,
    labPeriods: 0,
    requiredWeeklyHours: 3.5,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    displayOrder: 3,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "map_2026_1_0_all_6",
    academicYear: "2026",
    classId: 1,
    className: "Class 6",
    numericClass: 6,
    section: "all",
    subjectId: 6,
    subjectCode: "066",
    subjectName: "ICT & Vocational Basics",
    subjectNameBangla: "তথ্যপ্রযুক্তি ও বেসিক টেকনিক্যাল ওয়ার্ক",
    subjectType: "Workshop",
    isOptional: false,
    weeklyPeriods: 3,
    theoryPeriods: 1,
    practicalPeriods: 2,
    labPeriods: 2,
    requiredWeeklyHours: 2.5,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 30,
    displayOrder: 4,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },

  // Class 9 (SSC Vocational) - IT Support & IoT Basics (Trade ID: 101 / 2) - Year 2026
  {
    id: "map_2026_4_101_all_10",
    academicYear: "2026",
    classId: 4,
    className: "Class 9 (SSC Vocational)",
    numericClass: 9,
    section: "all",
    tradeId: 101,
    tradeCode: "SSC-T1",
    tradeName: "IT Support & IoT Basics",
    subjectId: 10,
    subjectCode: "101",
    subjectName: "Bangla 1st Paper",
    subjectNameBangla: "বাংলা ১ম পত্র",
    subjectType: "Theory",
    isOptional: false,
    weeklyPeriods: 4,
    theoryPeriods: 4,
    practicalPeriods: 0,
    labPeriods: 0,
    requiredWeeklyHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    displayOrder: 1,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "map_2026_4_101_all_12",
    academicYear: "2026",
    classId: 4,
    className: "Class 9 (SSC Vocational)",
    numericClass: 9,
    section: "all",
    tradeId: 101,
    tradeCode: "SSC-T1",
    tradeName: "IT Support & IoT Basics",
    subjectId: 12,
    subjectCode: "107",
    subjectName: "English 1st Paper",
    subjectNameBangla: "ইংরেজি ১ম পত্র",
    subjectType: "Theory",
    isOptional: false,
    weeklyPeriods: 4,
    theoryPeriods: 4,
    practicalPeriods: 0,
    labPeriods: 0,
    requiredWeeklyHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    displayOrder: 2,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "map_2026_4_101_all_14",
    academicYear: "2026",
    classId: 4,
    className: "Class 9 (SSC Vocational)",
    numericClass: 9,
    section: "all",
    tradeId: 101,
    tradeCode: "SSC-T1",
    tradeName: "IT Support & IoT Basics",
    subjectId: 14,
    subjectCode: "109",
    subjectName: "Mathematics",
    subjectNameBangla: "গণিত",
    subjectType: "Theory",
    isOptional: false,
    weeklyPeriods: 5,
    theoryPeriods: 5,
    practicalPeriods: 0,
    labPeriods: 0,
    requiredWeeklyHours: 3.5,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 100,
    practicalMarks: 0,
    vivaMarks: 0,
    continuousMarks: 40,
    displayOrder: 3,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "map_2026_4_101_all_15",
    academicYear: "2026",
    classId: 4,
    className: "Class 9 (SSC Vocational)",
    numericClass: 9,
    section: "all",
    tradeId: 101,
    tradeCode: "SSC-T1",
    tradeName: "IT Support & IoT Basics",
    subjectId: 15,
    subjectCode: "136",
    subjectName: "Physics",
    subjectNameBangla: "পদার্থবিজ্ঞান",
    subjectType: "Theory + Practical",
    isOptional: false,
    weeklyPeriods: 4,
    theoryPeriods: 3,
    practicalPeriods: 1,
    labPeriods: 1,
    requiredWeeklyHours: 3.0,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 75,
    practicalMarks: 25,
    vivaMarks: 0,
    continuousMarks: 30,
    displayOrder: 4,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "map_2026_4_101_all_21",
    academicYear: "2026",
    classId: 4,
    className: "Class 9 (SSC Vocational)",
    numericClass: 9,
    section: "all",
    tradeId: 101,
    tradeCode: "SSC-T1",
    tradeName: "IT Support & IoT Basics",
    subjectId: 21,
    subjectCode: "IT-901",
    subjectName: "IT Support Fundamentals & OS (Paper I)",
    subjectNameBangla: "আইটি সাপোর্ট ফান্ডামেন্টালস ও ওএস (১ম পত্র)",
    subjectType: "Lab",
    isOptional: false,
    weeklyPeriods: 6,
    theoryPeriods: 2,
    practicalPeriods: 4,
    labPeriods: 4,
    requiredWeeklyHours: 4.5,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 35,
    displayOrder: 5,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "map_2026_4_101_all_22",
    academicYear: "2026",
    classId: 4,
    className: "Class 9 (SSC Vocational)",
    numericClass: 9,
    section: "all",
    tradeId: 101,
    tradeCode: "SSC-T1",
    tradeName: "IT Support & IoT Basics",
    subjectId: 22,
    subjectCode: "IT-902",
    subjectName: "IoT Sensors & Networking (Paper II)",
    subjectNameBangla: "আইওটি সেন্সর ও নেটওয়ার্কিং (২য় পত্র)",
    subjectType: "Lab",
    isOptional: false,
    weeklyPeriods: 6,
    theoryPeriods: 2,
    practicalPeriods: 4,
    labPeriods: 4,
    requiredWeeklyHours: 4.5,
    fullMarks: 100,
    passMarks: 33,
    theoryMarks: 40,
    practicalMarks: 60,
    vivaMarks: 0,
    continuousMarks: 35,
    displayOrder: 6,
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

let teacherAssignmentsStore: TeacherSubjectAssignment[] = [
  {
    id: "assign_2026_4_101_all_21_2",
    academicYear: "2026",
    classId: 4,
    className: "Class 9 (SSC Vocational)",
    numericClass: 9,
    section: "all",
    tradeId: 101,
    tradeCode: "SSC-T1",
    tradeName: "IT Support & IoT Basics",
    subjectId: 21,
    subjectCode: "IT-901",
    subjectName: "IT Support Fundamentals & OS (Paper I)",
    subjectNameBangla: "আইটি সাপোর্ট ফান্ডামেন্টালস ও ওএস (১ম পত্র)",
    teacherId: 2,
    teacherName: "Engr. Tanvir Ahmed",
    teacherNameBangla: "প্রকৌ. তানভীর আহমেদ",
    teacherDesignation: "চীফ ইন্সট্রাক্টর (আইটি ও আইওটি)",
    department: "আইটি সাপোর্ট অ্যান্ড আইওটি",
    role: "Primary Teacher",
    weeklyAssignedPeriods: 6,
    isClassTeacher: true,
    status: "Active",
    assignedAt: "2026-01-05T09:00:00.000Z",
    assignedBy: "Engr. Md. Rafiqul Islam (Principal)",
  },
  {
    id: "assign_2026_4_101_all_14_6",
    academicYear: "2026",
    classId: 4,
    className: "Class 9 (SSC Vocational)",
    numericClass: 9,
    section: "all",
    tradeId: 101,
    tradeCode: "SSC-T1",
    tradeName: "IT Support & IoT Basics",
    subjectId: 14,
    subjectCode: "109",
    subjectName: "Mathematics",
    subjectNameBangla: "গণিত",
    teacherId: 6,
    teacherName: "Md. Mominul Haque",
    teacherNameBangla: "মো. মমিনুল হক",
    teacherDesignation: "সহকারী শিক্ষক (গণিত ও বিজ্ঞান)",
    department: "সাধারণ শিক্ষা বিভাগ",
    role: "Primary Teacher",
    weeklyAssignedPeriods: 5,
    isClassTeacher: false,
    status: "Active",
    assignedAt: "2026-01-05T09:00:00.000Z",
    assignedBy: "Engr. Md. Rafiqul Islam (Principal)",
  },
];

let subjectTopicsStore: SubjectTopic[] = [
  {
    id: "topic_21_1_1",
    subjectId: 21,
    chapterNumber: 1,
    chapterName: "Computer Hardware & Peripheral Components",
    chapterNameBangla: "কম্পিউটার হার্ডওয়্যার ও পেরিফেরাল উপাদান",
    topicName: "Motherboard Architecture, CPU Sockets & RAM Slots",
    topicNameBangla: "মাদারবোর্ড আর্কিটেকচার, সিপিইউ সকেট ও র‍্যাম স্লট",
    serialOrder: 1,
    estimatedHours: 4,
    learningOutcomes: ["মাদারবোর্ডের বিভিন্ন চিপসেট শনাক্ত করতে পারবে", "র‍্যাম চ্যানেল ও স্লট কনফিগারেশন ব্যাখ্যা করতে পারবে"],
    status: "Active",
    hasQuizAvailable: true,
    hasLabJob: true,
  },
  {
    id: "topic_21_1_2",
    subjectId: 21,
    chapterNumber: 1,
    chapterName: "Computer Hardware & Peripheral Components",
    chapterNameBangla: "কম্পিউটার হার্ডওয়্যার ও পেরিফেরাল উপাদান",
    topicName: "Power Supply Unit (PSU) & Form Factors (ATX/SFX)",
    topicNameBangla: "পাওয়ার সাপ্লাই ইউনিট (PSU) ও ফর্ম ফ্যাক্টর",
    serialOrder: 2,
    estimatedHours: 3,
    learningOutcomes: ["পাওয়ার রেটিং গণনা করতে পারবে", "১২V, ৫V ও ৩.৩V রেল ভোল্টেজ মাল্টিমিটার দিয়ে পরিমাপ করতে পারবে"],
    status: "Active",
    hasQuizAvailable: true,
    hasLabJob: true,
  },
  {
    id: "topic_21_2_1",
    subjectId: 21,
    chapterNumber: 2,
    chapterName: "Operating System Installation & Driver Management",
    chapterNameBangla: "অপারেটিং সিস্টেম ইনস্টলেশন ও ড্রাইভার ব্যবস্থাপনা",
    topicName: "BIOS/UEFI Configuration & Bootable Media Creation",
    topicNameBangla: "বায়োস/ইউইএফআই কনফিগারেশন ও বুটেবল মিডিয়া তৈরি",
    serialOrder: 1,
    estimatedHours: 4,
    learningOutcomes: ["UEFI ও Legacy BIOS এর পার্থক্য", "Rufus বা Ventoy দিয়ে বুটেবল পেনড্রাইভ প্রস্তুতকরণ"],
    status: "Active",
    hasQuizAvailable: true,
    hasLabJob: true,
  },
  {
    id: "topic_14_1_1",
    subjectId: 14,
    chapterNumber: 1,
    chapterName: "Real Numbers & Sets",
    chapterNameBangla: "বাস্তব সংখ্যা ও সেট",
    topicName: "Properties of Real Numbers & Venn Diagrams",
    topicNameBangla: "বাস্তব সংখ্যার বৈশিষ্ট্য ও ভেনচিত্র প্রয়োগ",
    serialOrder: 1,
    estimatedHours: 5,
    learningOutcomes: ["মূলদ ও অমূলদ সংখ্যা চিহ্নিত করতে পারবে", "সেট অপারেশন ও ভেনচিত্রের সাহায্যে প্রমাণ করতে পারবে"],
    status: "Active",
    hasQuizAvailable: true,
    hasLabJob: false,
  },
];

let subjectAuditLogsStore: SubjectAuditLog[] = [
  {
    id: "audit_init_01",
    timestamp: "2026-01-05T09:30:00.000Z",
    user: "Engr. Md. Rafiqul Islam (Principal)",
    action: "Initial Curriculum Seed",
    entityType: "subject_master",
    entityId: "SYSTEM",
    details: "২০২৬ শিক্ষাবর্ষের বিটিইবি অনুমোদিত প্রাক-ভোকেশনাল ও ভোকেশনাল বিষয়মালা এবং প্রাথমিক ম্যাপিং লোড সম্পন্ন।",
  },
];

// ==========================================
// 3. CORE VALIDATION RULES (Pre-Vocational vs SSC/HSC Rules)
// ==========================================

export interface SubjectValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Strict Academic Rule Validator for Subject Assignments & Mappings.
 * Enforces Class 6-8 (No Trade) vs Class 9-12 (Trade Mandatory).
 */
export function validateSubjectEligibility(context: {
  academicYear: string;
  classId: number | string;
  tradeId?: number | string | null;
  subjectId?: number;
  subjectCode?: string;
  teacherId?: number;
}): SubjectValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const numericClass = parseClassNumeric(context.classId);

  // 1. Class Bounds Check
  if (numericClass < 6 || numericClass > 12) {
    errors.push(`অবৈধ শ্রেণি (${context.classId})। শ্রেণি অবশ্যই ৬ষ্ঠ থেকে ১২শ এর মধ্যে হতে হবে।`);
  }

  // 2. Class-Trade Rule
  const hasTrade = doesClassHaveTrade(numericClass);
  if (!hasTrade) {
    // Class 6, 7, 8 must NOT have trade
    if (
      context.tradeId !== undefined &&
      context.tradeId !== null &&
      context.tradeId !== 0 &&
      context.tradeId !== "0" &&
      context.tradeId !== "" &&
      context.tradeId !== "None"
    ) {
      errors.push(`নীতিমালা লঙ্ঘন: ৬ষ্ঠ-৮ম শ্রেণির জন্য কোনো কারিগরি ট্রেড প্রযোজ্য নয় (Pre-Vocational Tier)।`);
    }
  } else {
    // Class 9, 10, 11, 12 must have a valid trade
    if (!context.tradeId || context.tradeId === 0 || context.tradeId === "0") {
      errors.push(`নীতিমালা লঙ্ঘন: ৯ম-১২শ শ্রেণির জন্য প্রযোজ্য কারিগরি ট্রেড নির্বাচন বাধ্যতামূলক।`);
    } else if (!isTradeValidForClass(numericClass, context.tradeId)) {
      const applicable = getApplicableTradesForClass(numericClass);
      const names = applicable.map((t) => t.nameBangla).join(", ");
      errors.push(`নির্বাচিত ট্রেডটি ${numericClass}ম শ্রেণির জন্য অনুমোদিত নয়। অনুমোদিত ট্রেড: ${names}।`);
    }
  }

  // 3. Subject Existence & Status
  if (context.subjectId) {
    const master = subjectMastersStore.find((s) => s.id === context.subjectId);
    if (!master) {
      errors.push(`বিষয় আইডি (${context.subjectId}) পাওয়া যায়নি।`);
    } else if (master.status !== "Active") {
      warnings.push(`সতর্কতা: বিষয়টি বর্তমানে নিষ্ক্রিয় (${master.status}) অবস্থায় রয়েছে।`);
    }
  }

  // 4. Teacher Qualification / Department Fit Check
  if (context.teacherId) {
    const teacher = institutionalDb.faculty.find((f) => f.id === Number(context.teacherId));
    if (!teacher) {
      errors.push(`শিক্ষক আইডি (${context.teacherId}) শিক্ষক ডিরেক্টরিতে অনুপস্থিত।`);
    } else if (context.tradeId && hasTrade) {
      // Check if trade teacher matches department
      const tradeObj = ALL_TRADES.find((t) => t.id === Number(context.tradeId));
      if (tradeObj && teacher.tradeCode && teacher.tradeCode !== "GEN") {
        if (!tradeObj.code.includes(teacher.tradeCode) && !teacher.tradeCode.includes(tradeObj.code)) {
          warnings.push(`বিভাগীয় সতর্কবার্তা: শিক্ষক ${teacher.name} (${teacher.department}) এর ট্রেড ও নির্ধারিত ট্রেড (${tradeObj.name}) ভিন্ন।`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ==========================================
// 4. SUBJECT MASTER OPERATIONS
// ==========================================

export function getSubjectMasters(query?: {
  search?: string;
  status?: string;
  type?: string;
}): SubjectMaster[] {
  let list = [...subjectMastersStore];

  if (query?.status && query.status !== "all") {
    list = list.filter((s) => s.status === query.status);
  }

  if (query?.type && query.type !== "all") {
    list = list.filter((s) => s.subjectType === query.type);
  }

  if (query?.search) {
    const q = query.search.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.nameBangla.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        (s.btebCurriculumRef && s.btebCurriculumRef.toLowerCase().includes(q))
    );
  }

  return list.sort((a, b) => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code));
}

export function getSubjectMasterById(id: number): SubjectMaster | undefined {
  return subjectMastersStore.find((s) => s.id === id);
}

export function createSubjectMaster(
  input: Omit<SubjectMaster, "id" | "createdAt" | "updatedAt">,
  user: string = "Admin"
): { success: boolean; subject?: SubjectMaster; error?: string } {
  // Check code uniqueness
  const cleanCode = input.code.trim().toUpperCase();
  const exists = subjectMastersStore.some(
    (s) => s.code.toUpperCase() === cleanCode
  );
  if (exists) {
    return { success: false, error: `বিষয় কোড "${cleanCode}" ইতিমধ্যে সংরক্ষিত রয়েছে।` };
  }

  const nextId =
    subjectMastersStore.length > 0
      ? Math.max(...subjectMastersStore.map((s) => s.id)) + 1
      : 1;

  const now = new Date().toISOString();
  const newSubject: SubjectMaster = {
    ...input,
    id: nextId,
    code: cleanCode,
    createdAt: now,
    updatedAt: now,
  };

  subjectMastersStore.push(newSubject);

  logSubjectAudit({
    user,
    action: "Subject Master Created",
    entityType: "subject_master",
    entityId: String(newSubject.id),
    details: `নতুন বিষয় তৈরি: [${newSubject.code}] ${newSubject.name} (${newSubject.nameBangla}), টাইপ: ${newSubject.subjectType}`,
    newValue: newSubject,
  });

  return { success: true, subject: newSubject };
}

export function updateSubjectMaster(
  id: number,
  updates: Partial<SubjectMaster>,
  user: string = "Admin"
): { success: boolean; subject?: SubjectMaster; error?: string } {
  const index = subjectMastersStore.findIndex((s) => s.id === id);
  if (index === -1) {
    return { success: false, error: `বিষয় (ID: ${id}) পাওয়া যায়নি।` };
  }

  const oldSubject = { ...subjectMastersStore[index] };

  if (updates.code) {
    const cleanCode = updates.code.trim().toUpperCase();
    const duplicate = subjectMastersStore.some(
      (s) => s.id !== id && s.code.toUpperCase() === cleanCode
    );
    if (duplicate) {
      return { success: false, error: `বিষয় কোড "${cleanCode}" অন্য বিষয়ে ব্যবহৃত হচ্ছে।` };
    }
    updates.code = cleanCode;
  }

  const updatedSubject: SubjectMaster = {
    ...oldSubject,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
    updatedBy: user,
  };

  subjectMastersStore[index] = updatedSubject;

  // Propagate name/code updates to existing mappings
  subjectMappingsStore = subjectMappingsStore.map((m) => {
    if (m.subjectId === id) {
      return {
        ...m,
        subjectCode: updatedSubject.code,
        subjectName: updatedSubject.name,
        subjectNameBangla: updatedSubject.nameBangla,
        subjectType: updatedSubject.subjectType,
      };
    }
    return m;
  });

  logSubjectAudit({
    user,
    action: "Subject Master Updated",
    entityType: "subject_master",
    entityId: String(id),
    details: `বিষয় তথ্য হালনাগাদ: [${updatedSubject.code}] ${updatedSubject.name}`,
    oldValue: oldSubject,
    newValue: updatedSubject,
  });

  return { success: true, subject: updatedSubject };
}

export function deleteSubjectMaster(
  id: number,
  user: string = "Admin"
): { success: boolean; message: string; error?: string } {
  const subject = subjectMastersStore.find((s) => s.id === id);
  if (!subject) {
    return { success: false, message: "বিষয় পাওয়া যায়নি", error: "Subject not found" };
  }

  // Dependency Guard: Check if subject is actively mapped in any academic year
  const activeMappings = subjectMappingsStore.filter((m) => m.subjectId === id);
  if (activeMappings.length > 0) {
    const years = Array.from(new Set(activeMappings.map((m) => m.academicYear))).join(", ");
    return {
      success: false,
      message: `বিষয়টি মুছে ফেলা সম্ভব নয় কারণ এটি শিক্ষাবর্ষ (${years})-এ শ্রেণি ম্যাপিংয়ে অন্তর্ভুক্ত রয়েছে। আগে ম্যাপিং নিষ্ক্রিয় বা অপসারণ করুন।`,
      error: "Active mapping dependency exists",
    };
  }

  // Soft delete / archive
  subject.status = "Archived";
  subject.updatedAt = new Date().toISOString();
  subject.updatedBy = user;

  logSubjectAudit({
    user,
    action: "Subject Master Archived",
    entityType: "subject_master",
    entityId: String(id),
    details: `বিষয়টি আর্কাইভ করা হয়েছে: [${subject.code}] ${subject.name}`,
  });

  return {
    success: true,
    message: `বিষয় [${subject.code}] সফলভাবে আর্কাইভ করা হয়েছে (ঐতিহাসিক ডাটা অক্ষুণ্ণ রেখে)।`,
  };
}

// ==========================================
// 5. SUBJECT MAPPING ENGINE (Academic Year -> Class -> Trade -> Subject)
// ==========================================

export function getSubjectMappings(query: number | string | {
  academicYear?: string;
  classId?: number | string;
  tradeId?: number | string;
  section?: string;
  status?: string;
}): AcademicSubjectMapping[] {
  const queryObj = typeof query === "object" && query !== null ? query : { classId: query };
  let list = [...subjectMappingsStore];

  if (queryObj.academicYear && queryObj.academicYear !== "all") {
    list = list.filter((m) => m.academicYear === queryObj.academicYear);
  }

  if (queryObj.classId && queryObj.classId !== "all" && queryObj.classId !== 0) {
    const num = parseClassNumeric(queryObj.classId);
    list = list.filter((m) => m.numericClass === num || m.classId === Number(queryObj.classId));
  }

  if (queryObj.tradeId && queryObj.tradeId !== "all" && queryObj.tradeId !== 0 && queryObj.tradeId !== "0") {
    const tId = Number(queryObj.tradeId);
    list = list.filter((m) => m.tradeId === tId);
  }

  if (queryObj.section && queryObj.section !== "all") {
    list = list.filter((m) => m.section === "all" || m.section === queryObj.section);
  }

  if (queryObj.status && queryObj.status !== "all") {
    list = list.filter((m) => m.status === queryObj.status);
  }

  return list.sort((a, b) => a.displayOrder - b.displayOrder || a.subjectCode.localeCompare(b.subjectCode));
}

export function saveSubjectMapping(
  mapping: Omit<AcademicSubjectMapping, "id" | "createdAt" | "updatedAt">,
  user: string = "Admin"
): { success: boolean; mapping?: AcademicSubjectMapping; error?: string } {
  // Validate Class & Trade rules
  const valResult = validateSubjectEligibility({
    academicYear: mapping.academicYear,
    classId: mapping.classId,
    tradeId: mapping.tradeId,
    subjectId: mapping.subjectId,
  });

  if (!valResult.valid) {
    return { success: false, error: valResult.errors.join(" ") };
  }

  const numericClass = parseClassNumeric(mapping.classId);
  const tradePart = mapping.tradeId ? mapping.tradeId : 0;
  const sectionPart = mapping.section || "all";
  const mapId = `map_${mapping.academicYear}_${mapping.classId}_${tradePart}_${sectionPart}_${mapping.subjectId}`;

  const existingIdx = subjectMappingsStore.findIndex((m) => m.id === mapId);
  const now = new Date().toISOString();

  let savedRecord: AcademicSubjectMapping;

  if (existingIdx >= 0) {
    // Update existing mapping
    savedRecord = {
      ...subjectMappingsStore[existingIdx],
      ...mapping,
      numericClass,
      updatedAt: now,
    };
    subjectMappingsStore[existingIdx] = savedRecord;

    logSubjectAudit({
      user,
      action: "Subject Mapping Updated",
      entityType: "subject_mapping",
      entityId: mapId,
      details: `ম্যাপিং আপডেট: শিক্ষাবর্ষ ${mapping.academicYear} | শ্রেণি ${mapping.className} | বিষয় [${mapping.subjectCode}]`,
    });
  } else {
    // Create new mapping
    savedRecord = {
      ...mapping,
      id: mapId,
      numericClass,
      createdAt: now,
      updatedAt: now,
    };
    subjectMappingsStore.push(savedRecord);

    logSubjectAudit({
      user,
      action: "Subject Mapping Created",
      entityType: "subject_mapping",
      entityId: mapId,
      details: `নতুন ম্যাপিং: শিক্ষাবর্ষ ${mapping.academicYear} | শ্রেণি ${mapping.className} | ট্রেড: ${mapping.tradeName || "N/A"} | বিষয়: [${mapping.subjectCode}] ${mapping.subjectName}`,
    });
  }

  return { success: true, mapping: savedRecord };
}

export function removeSubjectMapping(
  mapId: string,
  user: string = "Admin"
): { success: boolean; message: string; error?: string } {
  const index = subjectMappingsStore.findIndex((m) => m.id === mapId);
  if (index === -1) {
    return { success: false, message: "ম্যাপিং রেকর্ড পাওয়া যায়নি", error: "Mapping not found" };
  }

  const mapping = subjectMappingsStore[index];

  // Check teacher assignment dependency
  const hasTeacherAssign = teacherAssignmentsStore.some(
    (t) =>
      t.academicYear === mapping.academicYear &&
      t.classId === mapping.classId &&
      (mapping.tradeId ? t.tradeId === mapping.tradeId : true) &&
      t.subjectId === mapping.subjectId
  );

  if (hasTeacherAssign) {
    return {
      success: false,
      message: "এই বিষয়টিতে শিক্ষক অ্যাসাইনমেন্ট সক্রিয় রয়েছে। অনুগ্রহ করে প্রথমে শিক্ষক অ্যাসাইনমেন্ট অপসারণ করুন।",
      error: "Teacher assignment exists",
    };
  }

  subjectMappingsStore.splice(index, 1);

  logSubjectAudit({
    user,
    action: "Subject Mapping Removed",
    entityType: "subject_mapping",
    entityId: mapId,
    details: `ম্যাপিং অপসারণ: শিক্ষাবর্ষ ${mapping.academicYear} | শ্রেণি ${mapping.className} | বিষয় [${mapping.subjectCode}]`,
  });

  return { success: true, message: "ম্যাপিং সফলভাবে অপসারণ করা হয়েছে।" };
}

// ==========================================
// 6. COPY CONFIGURATION / ACADEMIC YEAR ROLLOVER (Safe Merge, No Overwrite)
// ==========================================

export interface CopyConfigPreview {
  sourceYear: string;
  targetYear: string;
  sourceClassId: number;
  sourceTradeId?: number;
  totalSourceSubjects: number;
  newSubjectsToCopy: number;
  conflictingSubjects: number;
  unmodifiedTargetSubjects: number;
  items: {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    action: "NEW" | "CONFLICT_EXISTS" | "KEEP_TARGET";
  }[];
}

export function previewCopyConfiguration(params: {
  sourceYear: string;
  targetYear: string;
  classId: number;
  tradeId?: number;
}): CopyConfigPreview {
  const { sourceYear, targetYear, classId, tradeId } = params;

  const sourceMappings = subjectMappingsStore.filter(
    (m) =>
      m.academicYear === sourceYear &&
      m.classId === classId &&
      (tradeId ? m.tradeId === tradeId : true)
  );

  const targetMappings = subjectMappingsStore.filter(
    (m) =>
      m.academicYear === targetYear &&
      m.classId === classId &&
      (tradeId ? m.tradeId === tradeId : true)
  );

  const targetSubjectIds = new Set(targetMappings.map((m) => m.subjectId));

  const items: CopyConfigPreview["items"] = [];
  let newCount = 0;
  let conflictCount = 0;

  for (const src of sourceMappings) {
    if (targetSubjectIds.has(src.subjectId)) {
      items.push({
        subjectId: src.subjectId,
        subjectCode: src.subjectCode,
        subjectName: src.subjectName,
        action: "CONFLICT_EXISTS",
      });
      conflictCount++;
    } else {
      items.push({
        subjectId: src.subjectId,
        subjectCode: src.subjectCode,
        subjectName: src.subjectName,
        action: "NEW",
      });
      newCount++;
    }
  }

  return {
    sourceYear,
    targetYear,
    sourceClassId: classId,
    sourceTradeId: tradeId,
    totalSourceSubjects: sourceMappings.length,
    newSubjectsToCopy: newCount,
    conflictingSubjects: conflictCount,
    unmodifiedTargetSubjects: targetMappings.length,
    items,
  };
}

export function executeCopyConfiguration(params: {
  sourceYear: string;
  targetYear: string;
  classId: number;
  tradeId?: number;
  copyTeacherAssignments?: boolean;
  overwriteConflicts?: boolean;
  user?: string;
}): { success: boolean; copiedCount: number; conflictCount: number; message: string } {
  const {
    sourceYear,
    targetYear,
    classId,
    tradeId,
    copyTeacherAssignments = false,
    overwriteConflicts = false,
    user = "Admin",
  } = params;

  if (sourceYear === targetYear) {
    return {
      success: false,
      copiedCount: 0,
      conflictCount: 0,
      message: "উৎস শিক্ষাবর্ষ ও গন্তব্য শিক্ষাবর্ষ একই হতে পারে না।",
    };
  }

  const sourceMappings = subjectMappingsStore.filter(
    (m) =>
      m.academicYear === sourceYear &&
      m.classId === classId &&
      (tradeId ? m.tradeId === tradeId : true)
  );

  let copiedCount = 0;
  let conflictCount = 0;
  const now = new Date().toISOString();

  for (const src of sourceMappings) {
    const targetMapId = `map_${targetYear}_${classId}_${tradeId || 0}_${src.section || "all"}_${src.subjectId}`;
    const targetIndex = subjectMappingsStore.findIndex((m) => m.id === targetMapId);

    if (targetIndex >= 0) {
      if (overwriteConflicts) {
        subjectMappingsStore[targetIndex] = {
          ...src,
          id: targetMapId,
          academicYear: targetYear,
          updatedAt: now,
        };
        copiedCount++;
      } else {
        conflictCount++;
      }
    } else {
      subjectMappingsStore.push({
        ...src,
        id: targetMapId,
        academicYear: targetYear,
        createdAt: now,
        updatedAt: now,
      });
      copiedCount++;
    }

    // Copy teacher assignment if requested
    if (copyTeacherAssignments) {
      const srcTeachers = teacherAssignmentsStore.filter(
        (t) =>
          t.academicYear === sourceYear &&
          t.classId === classId &&
          (tradeId ? t.tradeId === tradeId : true) &&
          t.subjectId === src.subjectId
      );

      for (const st of srcTeachers) {
        const targetAssignId = `assign_${targetYear}_${classId}_${tradeId || 0}_${st.section || "all"}_${st.subjectId}_${st.teacherId}`;
        const hasAssign = teacherAssignmentsStore.some((t) => t.id === targetAssignId);
        if (!hasAssign) {
          teacherAssignmentsStore.push({
            ...st,
            id: targetAssignId,
            academicYear: targetYear,
            assignedAt: now,
            assignedBy: `${user} (Rollover from ${sourceYear})`,
          });
        }
      }
    }
  }

  logSubjectAudit({
    user,
    action: "Configuration Copied / Rolled Over",
    entityType: "config_copy",
    entityId: `${sourceYear}_to_${targetYear}_class_${classId}`,
    details: `শিক্ষাবর্ষ ${sourceYear} থেকে ${targetYear}-এ শ্রেণি ${classId} এর ${copiedCount}টি বিষয় কনফিগারেশন কপি করা হয়েছে (কনফ্লিক্ট স্কিপ: ${conflictCount})।`,
  });

  return {
    success: true,
    copiedCount,
    conflictCount,
    message: `সফলভাবে ${copiedCount}টি বিষয় কনফিগারেশন শিক্ষাবর্ষ ${targetYear}-এ কপি সম্পন্ন হয়েছে (ঐতিহাসিক ${sourceYear} ডাটা অক্ষুণ্ণ রয়েছে)।`,
  };
}

// ==========================================
// 7. TEACHER SUBJECT ASSIGNMENT OPERATIONS
// ==========================================

export function getTeacherSubjectAssignments(query: {
  academicYear?: string;
  teacherId?: number;
  classId?: number;
  tradeId?: number;
  subjectId?: number;
}): TeacherSubjectAssignment[] {
  let list = [...teacherAssignmentsStore];

  if (query.academicYear && query.academicYear !== "all") {
    list = list.filter((a) => a.academicYear === query.academicYear);
  }

  if (query.teacherId && query.teacherId !== 0) {
    list = list.filter((a) => a.teacherId === Number(query.teacherId));
  }

  if (query.classId && query.classId !== 0) {
    list = list.filter((a) => a.classId === Number(query.classId));
  }

  if (query.tradeId && query.tradeId !== 0) {
    list = list.filter((a) => a.tradeId === Number(query.tradeId));
  }

  if (query.subjectId && query.subjectId !== 0) {
    list = list.filter((a) => a.subjectId === Number(query.subjectId));
  }

  return list;
}

export function assignTeacherToSubject(
  input: {
    academicYear: string;
    classId: number;
    tradeId?: number;
    section?: string;
    subjectId: number;
    teacherId: number;
    role?: TeacherRole;
    weeklyAssignedPeriods?: number;
    isClassTeacher?: boolean;
  },
  user: string = "Admin"
): { success: boolean; assignment?: TeacherSubjectAssignment; error?: string } {
  // Validate eligibility
  const valResult = validateSubjectEligibility({
    academicYear: input.academicYear,
    classId: input.classId,
    tradeId: input.tradeId,
    subjectId: input.subjectId,
    teacherId: input.teacherId,
  });

  if (!valResult.valid) {
    return { success: false, error: valResult.errors.join(" ") };
  }

  const teacher = institutionalDb.faculty.find((f) => f.id === Number(input.teacherId));
  if (!teacher) {
    return { success: false, error: "শিক্ষক পাওয়া যায়নি।" };
  }

  const subject = subjectMastersStore.find((s) => s.id === input.subjectId);
  if (!subject) {
    return { success: false, error: "বিষয় পাওয়া যায়নি।" };
  }

  const academicClass = ACADEMIC_CLASSES.find((c) => c.id === input.classId);
  const tradeObj = input.tradeId ? ALL_TRADES.find((t) => t.id === input.tradeId) : undefined;

  const sectionPart = input.section || "all";
  const assignId = `assign_${input.academicYear}_${input.classId}_${input.tradeId || 0}_${sectionPart}_${input.subjectId}_${input.teacherId}`;

  // Check if this exact teacher is already assigned
  const existingIdx = teacherAssignmentsStore.findIndex((a) => a.id === assignId);
  const now = new Date().toISOString();

  let assignment: TeacherSubjectAssignment;

  if (existingIdx >= 0) {
    assignment = {
      ...teacherAssignmentsStore[existingIdx],
      role: input.role || "Primary Teacher",
      weeklyAssignedPeriods: input.weeklyAssignedPeriods ?? 4,
      isClassTeacher: !!input.isClassTeacher,
      status: "Active",
      assignedAt: now,
      assignedBy: user,
    };
    teacherAssignmentsStore[existingIdx] = assignment;
  } else {
    assignment = {
      id: assignId,
      academicYear: input.academicYear,
      classId: input.classId,
      className: academicClass?.name || `Class ${input.classId}`,
      numericClass: academicClass?.numericValue || parseClassNumeric(input.classId),
      section: sectionPart,
      tradeId: input.tradeId,
      tradeCode: tradeObj?.code,
      tradeName: tradeObj?.name,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      subjectNameBangla: subject.nameBangla,
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherNameBangla: teacher.nameBangla,
      teacherDesignation: teacher.designation,
      department: teacher.department,
      role: input.role || "Primary Teacher",
      weeklyAssignedPeriods: input.weeklyAssignedPeriods ?? 4,
      isClassTeacher: !!input.isClassTeacher,
      status: "Active",
      assignedAt: now,
      assignedBy: user,
    };
    teacherAssignmentsStore.push(assignment);
  }

  logSubjectAudit({
    user,
    action: "Teacher Subject Assigned",
    entityType: "teacher_assignment",
    entityId: assignId,
    details: `শিক্ষক এসাইনমেন্ট: ${teacher.name} (${teacher.designation}) -> [${subject.code}] ${subject.name} (শিক্ষাবর্ষ: ${input.academicYear}, শ্রেণি: ${academicClass?.name})`,
  });

  return { success: true, assignment };
}

export function removeTeacherAssignment(
  id: string,
  user: string = "Admin"
): { success: boolean; message: string; error?: string } {
  const index = teacherAssignmentsStore.findIndex((a) => a.id === id);
  if (index === -1) {
    return { success: false, message: "অ্যাসাইনমেন্ট পাওয়া যায়নি", error: "Not found" };
  }

  const record = teacherAssignmentsStore[index];
  teacherAssignmentsStore.splice(index, 1);

  logSubjectAudit({
    user,
    action: "Teacher Assignment Removed",
    entityType: "teacher_assignment",
    entityId: id,
    details: `শিক্ষক এসাইনমেন্ট প্রত্যাহার: ${record.teacherName} -> [${record.subjectCode}] ${record.subjectName}`,
  });

  return { success: true, message: "শিক্ষক অ্যাসাইনমেন্ট সফলভাবে অপসারণ করা হয়েছে।" };
}

// ==========================================
// 8. 360° TEACHER PROFILE & SUBJECT 360° ANALYTICS
// ==========================================

export interface TeacherAcademicProfile {
  teacher: FacultyMember;
  academicYear: string;
  totalAssignedSubjects: number;
  totalWeeklyPeriods: number;
  assignments: TeacherSubjectAssignment[];
  routineSlotsCount: number;
  attendanceRecordsTakenCount: number;
  quizCreatedCount: number;
}

export function getTeacherAcademicProfile(
  teacherId: number,
  academicYear: string = "2026"
): TeacherAcademicProfile | null {
  const teacher = institutionalDb.faculty.find((f) => f.id === teacherId);
  if (!teacher) return null;

  const assignments = teacherAssignmentsStore.filter(
    (a) => a.teacherId === teacherId && a.academicYear === academicYear
  );

  const totalWeeklyPeriods = assignments.reduce((sum, a) => sum + (a.weeklyAssignedPeriods || 0), 0);

  // Check Routine items
  const routineSlotsCount = institutionalDb.routines.filter(
    (r) =>
      r.teacherId === teacherId ||
      r.teacherName.toLowerCase().includes(teacher.name.toLowerCase())
  ).length;

  // Check Attendance taken
  const attendanceRecordsTakenCount = institutionalDb.attendanceRecords.filter(
    (att) => att.teacherName.toLowerCase().includes(teacher.name.toLowerCase())
  ).length;

  // Check Quizzes created
  const quizCreatedCount = institutionalDb.quizzes.filter(
    (q) => q.creatorId === teacherId
  ).length;

  return {
    teacher,
    academicYear,
    totalAssignedSubjects: assignments.length,
    totalWeeklyPeriods,
    assignments,
    routineSlotsCount,
    attendanceRecordsTakenCount,
    quizCreatedCount,
  };
}

export interface Subject360View {
  subject: SubjectMaster;
  academicYear: string;
  mappings: AcademicSubjectMapping[];
  assignedTeachers: TeacherSubjectAssignment[];
  enrolledStudentsCount: number;
  scheduledPeriodsInRoutine: number;
  requiredWeeklyPeriods: number;
  isRoutineAligned: boolean;
  attendanceRecordsCount: number;
  averageAttendanceRate: number;
  quizzesCount: number;
  questionBankCount: number;
  resultMarksCount: number;
  topicsCount: number;
}

export function getSubject360View(
  subjectId: number,
  academicYear: string = "2026"
): Subject360View | null {
  const subject = subjectMastersStore.find((s) => s.id === subjectId);
  if (!subject) return null;

  const mappings = subjectMappingsStore.filter(
    (m) => m.subjectId === subjectId && m.academicYear === academicYear
  );

  const assignedTeachers = teacherAssignmentsStore.filter(
    (a) => a.subjectId === subjectId && a.academicYear === academicYear
  );

  // Enrolled students calculation based on mapped classes
  let enrolledStudentsCount = 0;
  for (const map of mappings) {
    const matchingStudents = institutionalDb.students.filter((st) => {
      if (st.classId !== map.classId) return false;
      if (map.tradeId && st.tradeId !== map.tradeId) return false;
      return true;
    });
    enrolledStudentsCount += matchingStudents.length;
  }

  // Routine alignment
  const requiredWeeklyPeriods = mappings.reduce((sum, m) => sum + (m.weeklyPeriods || 0), 0);
  const scheduledRoutine = institutionalDb.routines.filter(
    (r) =>
      r.subjectCode === subject.code ||
      r.subjectName.toLowerCase().includes(subject.name.toLowerCase())
  );
  const scheduledPeriodsInRoutine = scheduledRoutine.length;

  // Attendance integration
  const matchingAttendance = institutionalDb.attendanceRecords.filter(
    (a) =>
      a.subjectCode === subject.code ||
      (a.subjectName && a.subjectName.toLowerCase().includes(subject.name.toLowerCase()))
  );
  const attendanceRecordsCount = matchingAttendance.length;
  let totalPresentRate = 0;
  if (matchingAttendance.length > 0) {
    matchingAttendance.forEach((rec) => {
      const pCount = rec.entries.filter((e) => e.status === "P").length;
      totalPresentRate += (pCount / Math.max(1, rec.entries.length)) * 100;
    });
  }
  const averageAttendanceRate =
    attendanceRecordsCount > 0
      ? Math.round((totalPresentRate / attendanceRecordsCount) * 10) / 10
      : 85.0;

  // Quiz & Questions
  const quizzesCount = institutionalDb.quizzes.filter(
    (q) => q.subjectId === subjectId
  ).length;

  const questionBankCount = institutionalDb.questionBank.filter(
    (qb) => qb.subjectId === subjectId
  ).length;

  // Result Marks
  const resultMarksCount = institutionalDb.marks.filter(
    (m) => m.subjectCode === subject.code
  ).length;

  const topicsCount = subjectTopicsStore.filter((t) => t.subjectId === subjectId).length;

  return {
    subject,
    academicYear,
    mappings,
    assignedTeachers,
    enrolledStudentsCount,
    scheduledPeriodsInRoutine,
    requiredWeeklyPeriods,
    isRoutineAligned: scheduledPeriodsInRoutine >= requiredWeeklyPeriods,
    attendanceRecordsCount,
    averageAttendanceRate,
    quizzesCount,
    questionBankCount,
    resultMarksCount,
    topicsCount,
  };
}

// ==========================================
// 9. CHAPTERS & TOPICS (Quiz / Syllabus Foundation)
// ==========================================

export function getSubjectTopics(subjectId: number): SubjectTopic[] {
  return subjectTopicsStore
    .filter((t) => t.subjectId === subjectId)
    .sort((a, b) => a.chapterNumber - b.chapterNumber || a.serialOrder - b.serialOrder);
}

export function saveSubjectTopic(
  topic: Omit<SubjectTopic, "id">,
  user: string = "Admin"
): { success: boolean; topic?: SubjectTopic; error?: string } {
  const topicId = `topic_${topic.subjectId}_${topic.chapterNumber}_${topic.serialOrder}`;
  const index = subjectTopicsStore.findIndex((t) => t.id === topicId);

  let savedTopic: SubjectTopic;

  if (index >= 0) {
    savedTopic = {
      ...subjectTopicsStore[index],
      ...topic,
      id: topicId,
    };
    subjectTopicsStore[index] = savedTopic;
  } else {
    savedTopic = {
      ...topic,
      id: topicId,
    };
    subjectTopicsStore.push(savedTopic);
  }

  logSubjectAudit({
    user,
    action: "Subject Topic Saved",
    entityType: "subject_topic",
    entityId: topicId,
    details: `টপিক সংরক্ষিত: অধ্যায় ${topic.chapterNumber}: ${topic.chapterName} -> ${topic.topicName}`,
  });

  return { success: true, topic: savedTopic };
}

// ==========================================
// 10. ROUTINE INTEGRATION & ALIGNMENT ANALYTICS
// ==========================================

export interface RoutineAlignmentItem {
  classId: number;
  className: string;
  tradeId?: number;
  tradeName?: string;
  subjectCode: string;
  subjectName: string;
  requiredWeeklyPeriods: number;
  scheduledWeeklyPeriods: number;
  status: "MATCH" | "UNDER_ALLOCATED" | "OVER_ALLOCATED" | "MISSING";
  difference: number;
}

export function checkSubjectRoutineAlignment(params: {
  academicYear: string;
  classId?: number;
  tradeId?: number;
}): RoutineAlignmentItem[] {
  const mappings = getSubjectMappings({
    academicYear: params.academicYear,
    classId: params.classId,
    tradeId: params.tradeId,
  });

  const routines = institutionalDb.routines;

  const results: RoutineAlignmentItem[] = [];

  for (const map of mappings) {
    const scheduled = routines.filter((r) => {
      if (r.classId !== map.classId) return false;
      if (map.tradeId && r.tradeCode !== map.tradeCode) return false;
      return r.subjectCode === map.subjectCode;
    }).length;

    const diff = scheduled - map.weeklyPeriods;
    let status: RoutineAlignmentItem["status"] = "MATCH";
    if (scheduled === 0) status = "MISSING";
    else if (diff < 0) status = "UNDER_ALLOCATED";
    else if (diff > 0) status = "OVER_ALLOCATED";

    results.push({
      classId: map.classId,
      className: map.className,
      tradeId: map.tradeId,
      tradeName: map.tradeName,
      subjectCode: map.subjectCode,
      subjectName: map.subjectName,
      requiredWeeklyPeriods: map.weeklyPeriods,
      scheduledWeeklyPeriods: scheduled,
      status,
      difference: diff,
    });
  }

  return results;
}

// ==========================================
// 11. AUDIT LOGGING ENGINE
// ==========================================

export function logSubjectAudit(entry: Omit<SubjectAuditLog, "id" | "timestamp">) {
  const auditEntry: SubjectAuditLog = {
    id: `audit_sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  subjectAuditLogsStore.unshift(auditEntry);
  if (subjectAuditLogsStore.length > 500) {
    subjectAuditLogsStore.pop();
  }
}

export function getSubjectAuditLogs(limit: number = 100): SubjectAuditLog[] {
  return subjectAuditLogsStore.slice(0, limit);
}

// ==========================================
// 12. EXPORT & IMPORT UTILITIES
// ==========================================

export function exportAcademicSubjectsDataset() {
  return {
    version: "1.0",
    exportDate: new Date().toISOString(),
    institution: "Panchagarh Govt. Technical School & College (PTSC)",
    subjectMasters: subjectMastersStore,
    subjectMappings: subjectMappingsStore,
    teacherAssignments: teacherAssignmentsStore,
    subjectTopics: subjectTopicsStore,
  };
}

export function importAcademicSubjectsDataset(
  dataset: any,
  user: string = "Admin"
): { success: boolean; importedMasters: number; importedMappings: number; message: string } {
  if (!dataset || (!dataset.subjectMasters && !dataset.subjectMappings)) {
    return {
      success: false,
      importedMasters: 0,
      importedMappings: 0,
      message: "অবৈধ ডাটা ফরম্যাট। subjectMasters অথবা subjectMappings বিদ্যমান থাকতে হবে।",
    };
  }

  let importedMasters = 0;
  let importedMappings = 0;

  if (Array.isArray(dataset.subjectMasters)) {
    for (const item of dataset.subjectMasters) {
      if (item.code && item.name) {
        const idx = subjectMastersStore.findIndex((s) => s.code === item.code);
        if (idx >= 0) {
          subjectMastersStore[idx] = { ...subjectMastersStore[idx], ...item };
        } else {
          subjectMastersStore.push({
            ...item,
            id: item.id || subjectMastersStore.length + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        importedMasters++;
      }
    }
  }

  if (Array.isArray(dataset.subjectMappings)) {
    for (const map of dataset.subjectMappings) {
      if (map.academicYear && map.classId && map.subjectId) {
        saveSubjectMapping(map, user);
        importedMappings++;
      }
    }
  }

  logSubjectAudit({
    user,
    action: "Bulk Dataset Import",
    entityType: "import",
    entityId: "DATASET_IMPORT",
    details: `${importedMasters}টি বিষয় মাস্টার ও ${importedMappings}টি ম্যাপিং আমদানি সম্পন্ন হয়েছে।`,
  });

  return {
    success: true,
    importedMasters,
    importedMappings,
    message: `সফলভাবে ${importedMasters}টি বিষয় মাস্টার ও ${importedMappings}টি শ্রেণি ম্যাপিং ডাটাবেসে আমদানি সম্পন্ন হয়েছে।`,
  };
}
