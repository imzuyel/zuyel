// Authoritative Academic Structure & Class-Based Trade Logic for
// Government Technical School & College (Govt. TSC), Bangladesh
// Compliant with Bangladesh Technical Education Board (BTEB) & DTE regulations

export interface AcademicTrade {
  id: number;
  tradeNumber: 1 | 2 | 3 | 4;
  code: string;
  name: string;
  nameBangla: string;
  seats: number;
  level: "SSC" | "HSC";
  applicableClass: number; // 9, 10, 11, or 12
  descriptionBangla: string;
}

export interface AcademicClass {
  id: number;
  numericValue: number; // 6, 7, 8, 9, 10, 11, 12
  name: string;
  nameBangla: string;
  tier: "Pre-Vocational" | "SSC (Vocational)" | "HSC (Vocational)";
  hasTrade: boolean;
  totalSeats: number;
  sections: string[];
}

export interface SubjectItem {
  id: number;
  code: string;
  name: string;
  nameBangla: string;
  isCommon: boolean;
  applicableClasses: number[]; // e.g. [9, 10, 11, 12]
  type: "General" | "Vocational Trade" | "Practical" | "Trade";
  marks: number;
  fullMarks?: number;
  theoryMax?: number;
  practicalMax?: number;
  passMarks?: number;
  tradeId?: number;
  tradeCode?: string;
}

// ==========================================
// 1. ACADEMIC CLASSES
// ==========================================
// Pre-Vocational: Class 6, 7, 8 (NO TRADE)
// SSC (Vocational): Class 9, 10
// HSC (Vocational): Class 11, 12
export const ACADEMIC_CLASSES: AcademicClass[] = [
  {
    id: 1,
    numericValue: 6,
    name: "Class 6",
    nameBangla: "৬ষ্ঠ শ্রেণি",
    tier: "Pre-Vocational",
    hasTrade: false,
    totalSeats: 120,
    sections: ["A", "B"],
  },
  {
    id: 2,
    numericValue: 7,
    name: "Class 7",
    nameBangla: "৭ম শ্রেণি",
    tier: "Pre-Vocational",
    hasTrade: false,
    totalSeats: 120,
    sections: ["A", "B"],
  },
  {
    id: 3,
    numericValue: 8,
    name: "Class 8",
    nameBangla: "৮ম শ্রেণি",
    tier: "Pre-Vocational",
    hasTrade: false,
    totalSeats: 120,
    sections: ["A", "B"],
  },
  {
    id: 4,
    numericValue: 9,
    name: "Class 9",
    nameBangla: "৯ম শ্রেণি (এসএসসি ভোকেশনাল)",
    tier: "SSC (Vocational)",
    hasTrade: true,
    totalSeats: 100, // 2 trades * 50 seats
    sections: ["A", "B"],
  },
  {
    id: 5,
    numericValue: 10,
    name: "Class 10",
    nameBangla: "১০ম শ্রেণি (এসএসসি ভোকেশনাল)",
    tier: "SSC (Vocational)",
    hasTrade: true,
    totalSeats: 100, // 2 trades * 50 seats
    sections: ["A", "B"],
  },
  {
    id: 6,
    numericValue: 11,
    name: "Class 11",
    nameBangla: "১১শ শ্রেণি (এইচএসসি ভোকেশনাল)",
    tier: "HSC (Vocational)",
    hasTrade: true,
    totalSeats: 100, // 2 trades * 50 seats
    sections: ["A", "B"],
  },
  {
    id: 7,
    numericValue: 12,
    name: "Class 12",
    nameBangla: "১২শ শ্রেণি (এইচএসসি ভোকেশনাল)",
    tier: "HSC (Vocational)",
    hasTrade: true,
    totalSeats: 100, // 2 trades * 50 seats
    sections: ["A", "B"],
  },
];

// ==========================================
// 2. SSC & HSC VOCATIONAL TRADES (50 SEATS EACH)
// ==========================================
// SSC Vocational Trades:
// Class 9 -> Trade-1, Trade-2
// Class 10 -> Trade-3, Trade-4
//
// ==========================================
// 2. AUTHORITATIVE VOCATIONAL TRADES FOR CLASSES 9-12
// ==========================================
// Strict Rule:
// - Class 6, 7, 8: PRE-VOCATIONAL (NO TRADES)
// - Class 9, 10, 11, 12: MANDATORY 4 TRADES:
//   1. Consumer Electronics (কনজিউমার ইলেকট্রনিক্স)
//   2. IT Support & IoT Basics (আইটি সাপোর্ট এন্ড আইওটি বেসিক্স)
//   3. General Electrical Workshop (জেনারেল ইলেকট্রিক্যাল ওয়ার্কশপ)
//   4. Apparel Manufacturing Basics (এপারেল ম্যানুফ্যাকচারিং বেসিক্স)

export const MANDATORY_FOUR_TRADES: AcademicTrade[] = [
  {
    id: 101,
    tradeNumber: 1,
    code: "CE",
    name: "Consumer Electronics",
    nameBangla: "কনজিউমার ইলেকট্রনিক্স",
    seats: 50,
    level: "SSC",
    applicableClass: 9,
    descriptionBangla: "কনজিউমার ইলেকট্রনিক্স, অডিও-ভিডিও সিস্টেম, হোম অ্যাপ্লায়েন্সেস ও সার্কিট ডায়াগনসিস।",
  },
  {
    id: 102,
    tradeNumber: 2,
    code: "IT-IOT",
    name: "IT Support & IoT Basics",
    nameBangla: "আইটি সাপোর্ট এন্ড আইওটি বেসিক্স",
    seats: 50,
    level: "SSC",
    applicableClass: 9,
    descriptionBangla: "কম্পিউটার হার্ডওয়্যার, নেটওয়ার্কিং ও আইওটি সেন্সর ফান্ডামেন্টালস।",
  },
  {
    id: 103,
    tradeNumber: 3,
    code: "GEW",
    name: "General Electrical Workshop",
    nameBangla: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কশপ",
    seats: 50,
    level: "SSC",
    applicableClass: 9,
    descriptionBangla: "হাউস ওয়্যারিং, বৈদ্যুতিক মোটর, পাওয়ার সার্কিট ও ওয়ার্কশপ মেইনটেন্যান্স।",
  },
  {
    id: 104,
    tradeNumber: 4,
    code: "AMB",
    name: "Apparel Manufacturing Basics",
    nameBangla: "এপারেল ম্যানুফ্যাকচারিং বেসিক্স",
    seats: 50,
    level: "SSC",
    applicableClass: 9,
    descriptionBangla: "পোশাক তৈরি, প্যাটার্ন কাটিং, সুইং মেশিন ও তৈরি পোশাক শিল্প দক্ষতা।",
  },
];

export const ALL_TRADES: AcademicTrade[] = [
  ...MANDATORY_FOUR_TRADES,
  // Class 10 Variants
  {
    id: 111,
    tradeNumber: 1,
    code: "CE",
    name: "Consumer Electronics",
    nameBangla: "কনজিউমার ইলেকট্রনিক্স",
    seats: 50,
    level: "SSC",
    applicableClass: 10,
    descriptionBangla: "সেমিকন্ডাক্টর ও ডিজিটাল কনজিউমার ইলেকট্রনিক্স।",
  },
  {
    id: 112,
    tradeNumber: 2,
    code: "IT-IOT",
    name: "IT Support & IoT Basics",
    nameBangla: "আইটি সাপোর্ট এন্ড আইওটি বেসিক্স",
    seats: 50,
    level: "SSC",
    applicableClass: 10,
    descriptionBangla: "উচ্চতর আইটি সাপোর্ট ও আইওটি আর্কিটেকচার।",
  },
  {
    id: 113,
    tradeNumber: 3,
    code: "GEW",
    name: "General Electrical Workshop",
    nameBangla: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কশপ",
    seats: 50,
    level: "SSC",
    applicableClass: 10,
    descriptionBangla: "ইলেকট্রিক্যাল পাওয়ার সিস্টেম ও ওয়্যারিং।",
  },
  {
    id: 114,
    tradeNumber: 4,
    code: "AMB",
    name: "Apparel Manufacturing Basics",
    nameBangla: "এপারেল ম্যানুফ্যাকচারিং বেসিক্স",
    seats: 50,
    level: "SSC",
    applicableClass: 10,
    descriptionBangla: "গার্মেন্টস টেকনোলজি ও কোয়ালিটি কন্ট্রোল।",
  },
  // HSC Class 11 Variants
  {
    id: 201,
    tradeNumber: 1,
    code: "CE",
    name: "Consumer Electronics",
    nameBangla: "কনজিউমার ইলেকট্রনিক্স",
    seats: 50,
    level: "HSC",
    applicableClass: 11,
    descriptionBangla: "উচ্চতর কনজিউমার ইলেকট্রনিক্স ও অডিও-ভিডিও টেকনোলজি।",
  },
  {
    id: 202,
    tradeNumber: 2,
    code: "IT-IOT",
    name: "IT Support & IoT Basics",
    nameBangla: "আইটি সাপোর্ট এন্ড আইওটি বেসিক্স",
    seats: 50,
    level: "HSC",
    applicableClass: 11,
    descriptionBangla: "কম্পিউটার নেটওয়ার্কিং ও মাইক্রোকন্ট্রোলার সিস্টেম।",
  },
  {
    id: 203,
    tradeNumber: 3,
    code: "GEW",
    name: "General Electrical Workshop",
    nameBangla: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কশপ",
    seats: 50,
    level: "HSC",
    applicableClass: 11,
    descriptionBangla: "ইন্ডাস্ট্রিয়াল মোটর ওয়াইন্ডিং ও পাওয়ার কন্ট্রোল।",
  },
  {
    id: 204,
    tradeNumber: 4,
    code: "AMB",
    name: "Apparel Manufacturing Basics",
    nameBangla: "এপারেল ম্যানুফ্যাকচারিং বেসিক্স",
    seats: 50,
    level: "HSC",
    applicableClass: 11,
    descriptionBangla: "উচ্চতর গার্মেন্টস টেকনোলজি ও মার্চেন্ডাইজিং বেসিকস।",
  },
  // HSC Class 12 Variants
  {
    id: 211,
    tradeNumber: 1,
    code: "CE",
    name: "Consumer Electronics",
    nameBangla: "কনজিউমার ইলেকট্রনিক্স",
    seats: 50,
    level: "HSC",
    applicableClass: 12,
    descriptionBangla: "স্মার্ট হোম অ্যাপ্লায়েন্স ও ইলেকট্রনিক কন্ট্রোল।",
  },
  {
    id: 212,
    tradeNumber: 2,
    code: "IT-IOT",
    name: "IT Support & IoT Basics",
    nameBangla: "আইটি সাপোর্ট এন্ড আইওটি বেসিক্স",
    seats: 50,
    level: "HSC",
    applicableClass: 12,
    descriptionBangla: "ক্লাউড আইওটি ও নেটওয়ার্ক সিকিউরিটি।",
  },
  {
    id: 213,
    tradeNumber: 3,
    code: "GEW",
    name: "General Electrical Workshop",
    nameBangla: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কশপ",
    seats: 50,
    level: "HSC",
    applicableClass: 12,
    descriptionBangla: "সাব-স্টেশন ইকুইপমেন্ট ও পাওয়ার প্ল্যান্ট অপারেশন।",
  },
  {
    id: 214,
    tradeNumber: 4,
    code: "AMB",
    name: "Apparel Manufacturing Basics",
    nameBangla: "এপারেল ম্যানুফ্যাকচারিং বেসিক্স",
    seats: 50,
    level: "HSC",
    applicableClass: 12,
    descriptionBangla: "অ্যাপারেল প্রোডাকশন প্ল্যানিং ও গ্লোবাল কমপ্লায়েন্স।",
  },
];

export const BTEB_ACADEMIC_TRADES = ALL_TRADES;

// ==========================================
// 3. COMMON SUBJECTS – CLASS 9 TO 12
// ==========================================
export const COMMON_SUBJECTS_9_12: SubjectItem[] = [
  { id: 1, code: "101", name: "Bangla 1st Paper", nameBangla: "বাংলা ১ম পত্র", isCommon: true, applicableClasses: [9, 10, 11, 12], type: "General", marks: 100 },
  { id: 2, code: "102", name: "Bangla 2nd Paper", nameBangla: "বাংলা ২য় পত্র", isCommon: true, applicableClasses: [9, 10, 11, 12], type: "General", marks: 100 },
  { id: 3, code: "107", name: "English 1st Paper", nameBangla: "ইংরেজি ১ম পত্র", isCommon: true, applicableClasses: [9, 10, 11, 12], type: "General", marks: 100 },
  { id: 4, code: "108", name: "English 2nd Paper", nameBangla: "ইংরেজি ২য় পত্র", isCommon: true, applicableClasses: [9, 10, 11, 12], type: "General", marks: 100 },
  { id: 5, code: "109", name: "Mathematics", nameBangla: "গণিত", isCommon: true, applicableClasses: [9, 10, 11, 12], type: "General", marks: 100 },
  { id: 6, code: "111", name: "Religious & Moral Education", nameBangla: "ধর্ম ও নৈতিক শিক্ষা", isCommon: true, applicableClasses: [9, 10, 11, 12], type: "General", marks: 100 },
  { id: 7, code: "136", name: "Physics", nameBangla: "পদার্থবিজ্ঞান", isCommon: true, applicableClasses: [9, 10, 11, 12], type: "General", marks: 100 },
  { id: 8, code: "137", name: "Chemistry", nameBangla: "রসায়ন", isCommon: true, applicableClasses: [9, 10, 11, 12], type: "General", marks: 100 },
  { id: 9, code: "150", name: "Bangladesh & Global Studies", nameBangla: "বাংলাদেশ ও বিশ্বপরিচয়", isCommon: true, applicableClasses: [9, 10, 11, 12], type: "General", marks: 100 },
  { id: 10, code: "154", name: "Physical Education & ICT", nameBangla: "শারীরিক শিক্ষা ও ICT", isCommon: true, applicableClasses: [9, 10, 11, 12], type: "General", marks: 100 },
];

// Pre-Vocational Common Subjects (Class 6-8)
export const PRE_VOCATIONAL_SUBJECTS: SubjectItem[] = [
  { id: 11, code: "061", name: "Bangla", nameBangla: "বাংলা", isCommon: true, applicableClasses: [6, 7, 8], type: "General", marks: 100 },
  { id: 12, code: "062", name: "English", nameBangla: "ইংরেজি", isCommon: true, applicableClasses: [6, 7, 8], type: "General", marks: 100 },
  { id: 13, code: "063", name: "Mathematics", nameBangla: "গণিত", isCommon: true, applicableClasses: [6, 7, 8], type: "General", marks: 100 },
  { id: 14, code: "064", name: "General Science", nameBangla: "সাধারণ বিজ্ঞান", isCommon: true, applicableClasses: [6, 7, 8], type: "General", marks: 100 },
  { id: 15, code: "065", name: "Religious Studies", nameBangla: "ধর্ম শিক্ষা", isCommon: true, applicableClasses: [6, 7, 8], type: "General", marks: 100 },
  { id: 16, code: "066", name: "ICT & Vocational Basics", nameBangla: "তথ্যপ্রযুক্তি ও বেসিক টেকনিক্যাল ওয়ার্ক", isCommon: true, applicableClasses: [6, 7, 8], type: "General", marks: 100 },
];

// ==========================================
// 4. HELPER UTILITIES & STRICT ACADEMIC RULES
// ==========================================

/**
 * Normalizes any class input (numeric, string like "Class 9", "9 (SSC Vocational)") to 6..12
 */
export function parseClassNumeric(classVal: number | string | undefined | null): number {
  if (classVal === undefined || classVal === null || classVal === "" || classVal === "all") {
    return 0;
  }

  if (typeof classVal === "number") {
    // If already in 6..12 range, return directly
    if (classVal >= 6 && classVal <= 12) {
      return classVal;
    }
    // Database classId (1-5) maps to (6-10) via ID + 5
    if (classVal >= 1 && classVal <= 5) {
      return classVal + 5;
    }
    return 0;
  }

  const str = String(classVal).trim();
  if (/class\s*6\b|৬ষ্ঠ|six/i.test(str)) return 6;
  if (/class\s*7\b|৭ম|seven/i.test(str)) return 7;
  if (/class\s*8\b|৮ম|eight/i.test(str)) return 8;
  if (/class\s*9\b|৯ম|nine/i.test(str)) return 9;
  if (/class\s*10\b|১০ম|ten/i.test(str)) return 10;
  if (/class\s*11\b|১১শ|eleven/i.test(str)) return 11;
  if (/class\s*12\b|১২শ|twelve/i.test(str)) return 12;

  const num = Number(str);
  if (!isNaN(num) && str !== "") {
    if (num >= 6 && num <= 12) {
      return num;
    }
    if (num >= 1 && num <= 5) {
      return num + 5;
    }
  }

  const match = str.match(/\b(6|7|8|9|10|11|12)\b/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}

/**
 * Rule: IF Class = 6, 7 or 8 -> false (STRICTLY NO TRADE).
 *       IF Class = 9, 10, 11, 12 -> true (4 MANDATORY TRADES).
 */
export function doesClassHaveTrade(classVal: number | string | undefined | null): boolean {
  const numeric = parseClassNumeric(classVal);
  return numeric >= 9 && numeric <= 12;
}

/**
 * Returns applicable trades strictly for the specified class.
 * - Class 6, 7, 8: returns [] (STRICTLY NO TRADES)
 * - Class 9, 10, 11, 12: returns ALL 4 MANDATORY TRADES:
 *   1. Consumer Electronics (কনজিউমার ইলেকট্রনিক্স)
 *   2. IT Support & IoT Basics (আইটি সাপোর্ট এন্ড আইওটি বেসিক্স)
 *   3. General Electrical Workshop (জেনারেল ইলেকট্রিক্যাল ওয়ার্কশপ)
 *   4. Apparel Manufacturing Basics (এপারেল ম্যানুফ্যাকচারিং বেসিক্স)
 */
export function getApplicableTradesForClass(classVal: number | string | undefined | null): AcademicTrade[] {
  const numeric = parseClassNumeric(classVal);
  if (numeric < 9 || numeric > 12) {
    return [];
  }
  return MANDATORY_FOUR_TRADES.map((t) => ({
    ...t,
    applicableClass: numeric,
    level: numeric >= 11 ? "HSC" : "SSC",
  }));
}

/**
 * Validates whether a given trade name or id is valid for a class.
 */
export function isTradeValidForClass(
  classVal: number | string | undefined | null,
  tradeVal: number | string | undefined | null
): boolean {
  const numeric = parseClassNumeric(classVal);
  if (numeric < 9 || numeric > 12) {
    // Class 6-8 should NOT have a trade
    return tradeVal === undefined || tradeVal === null || tradeVal === "" || tradeVal === "None" || tradeVal === "N/A" || tradeVal === 0 || tradeVal === "0" || tradeVal === "General";
  }
  if (!tradeVal || tradeVal === "all" || tradeVal === 0 || tradeVal === "0") return false;
  
  const applicable = getApplicableTradesForClass(numeric);
  const tradeStr = String(tradeVal).trim().toLowerCase();
  
  return applicable.some(
    (t) =>
      String(t.id) === tradeStr ||
      t.code.toLowerCase() === tradeStr ||
      t.name.toLowerCase() === tradeStr ||
      t.nameBangla.toLowerCase() === tradeStr ||
      tradeStr.includes(t.name.toLowerCase()) ||
      t.name.toLowerCase().includes(tradeStr) ||
      // Legacy code & ID mappings:
      (t.code === "CE" && (tradeStr === "ge" || tradeStr === "electronics" || tradeStr === "103" || tradeStr === "1" || tradeStr.includes("electronic"))) ||
      (t.code === "IT-IOT" && (tradeStr === "computer" || tradeStr === "it" || tradeStr === "101" || tradeStr === "2" || tradeStr.includes("iot") || tradeStr.includes("computer"))) ||
      (t.code === "GEW" && (tradeStr === "ee" || tradeStr === "electrical" || tradeStr === "102" || tradeStr === "3" || tradeStr.includes("electric"))) ||
      (t.code === "AMB" && (tradeStr === "apparel" || tradeStr === "104" || tradeStr === "4" || tradeStr.includes("apparel")))
  );
}

/**
 * Checks if a student belongs to the queried trade.
 * Handles both standard BTEB academic trade IDs (101-104) and legacy codes.
 */
export function doesStudentMatchTrade(
  studentTradeId: number | undefined | null,
  studentTradeName: string | undefined | null,
  queryTradeId: number | string | undefined | null
): boolean {
  if (!queryTradeId || queryTradeId === "all" || queryTradeId === 0 || queryTradeId === "0") {
    return true; // "All trades" query matches every student in the class
  }

  const qId = Number(queryTradeId);
  const sId = studentTradeId !== undefined && studentTradeId !== null ? Number(studentTradeId) : null;

  if (sId !== null && sId === qId) {
    return true;
  }

  const qStr = String(queryTradeId).trim().toLowerCase();

  // Name / code matching
  if (studentTradeName) {
    const sName = studentTradeName.toLowerCase();
    if ((qStr === "ce" || qStr.includes("electronic") || qId === 101 || qId === 1) && (sName.includes("electronic") || sName.includes("ইলেকট্রনিক্স"))) return true;
    if ((qStr === "it-iot" || qStr.includes("iot") || qStr.includes("computer") || qId === 102 || qId === 2) && (sName.includes("iot") || sName.includes("computer") || sName.includes("আইটি"))) return true;
    if ((qStr === "gew" || qStr === "ee" || qStr.includes("electric") || qId === 103 || qId === 3) && (sName.includes("electric") || sName.includes("ইলেকট্রিক্যাল"))) return true;
    if ((qStr === "amb" || qStr.includes("apparel") || qId === 104 || qId === 4) && (sName.includes("apparel") || sName.includes("এপারেল") || sName.includes("পোশাক"))) return true;
  }

  return false;
}

/**
 * Returns subjects applicable for a given class.
 */
export function getSubjectsForClass(
  classVal: number | string | undefined | null,
  tradeVal?: number | string | undefined | null
): SubjectItem[] {
  const numeric = parseClassNumeric(classVal);
  if (numeric >= 9 && numeric <= 12) {
    if (tradeVal && tradeVal !== "all") {
      const tradeIdNum = typeof tradeVal === "number" ? tradeVal : parseInt(String(tradeVal), 10);
      const trade = ALL_TRADES.find((t) => t.id === tradeIdNum || t.code === tradeVal);
      if (trade) {
        const tradeSubjects: SubjectItem[] = [
          {
            id: 2000 + trade.id,
            code: `${trade.code}-1`,
            name: `${trade.name} Paper I`,
            nameBangla: `${trade.nameBangla} ১ম পত্র`,
            applicableClasses: [numeric],
            tradeId: trade.id,
            tradeCode: trade.code,
            isCommon: false,
            type: "Trade",
            marks: 100,
          },
          {
            id: 3000 + trade.id,
            code: `${trade.code}-2`,
            name: `${trade.name} Paper II`,
            nameBangla: `${trade.nameBangla} ২য় পত্র`,
            applicableClasses: [numeric],
            tradeId: trade.id,
            tradeCode: trade.code,
            isCommon: false,
            type: "Trade",
            marks: 100,
          },
        ];
        return [...COMMON_SUBJECTS_9_12, ...tradeSubjects];
      }
    }
    return COMMON_SUBJECTS_9_12;
  }
  if (numeric >= 6 && numeric <= 8) {
    return PRE_VOCATIONAL_SUBJECTS;
  }
  return [...PRE_VOCATIONAL_SUBJECTS, ...COMMON_SUBJECTS_9_12];
}

/**
 * Standard Student ID Generator (e.g. 20260001, 20260002, 20260003)
 */
export function generateAutoStudentId(
  existingIds: string[] = [],
  sessionYear: number | string = 2026
): string {
  const yr = String(sessionYear || new Date().getFullYear());
  const existingSet = new Set(existingIds.map((id) => id.trim()));

  // Extract maximum serial for current year if present
  let maxSerial = 0;
  for (const id of existingIds) {
    if (id.startsWith(yr) && id.length === 8) {
      const serialPart = parseInt(id.slice(4), 10);
      if (!isNaN(serialPart) && serialPart > maxSerial) {
        maxSerial = serialPart;
      }
    }
  }

  let nextSerial = maxSerial + 1;
  while (true) {
    const candidate = `${yr}${String(nextSerial).padStart(4, "0")}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
    nextSerial++;
  }
}

export const ALL_SUBJECTS = [...PRE_VOCATIONAL_SUBJECTS, ...COMMON_SUBJECTS_9_12];
