/**
 * Central Academy Settings & Class-to-Trade Mapping Hub
 * Panchagarh Govt. Technical School & College (PTSC)
 * 
 * Single authoritative source of truth for Class-to-Trade relationships across the application.
 * - Classes 6, 7, and 8: Pre-Vocational (NO trades / General only).
 * - Classes 9 and 10: SSC (Vocational) with technical trades.
 * - Classes 11 and 12: HSC (Vocational) with technical trades.
 * - Diploma: Polytechnic Engineering semester trades.
 */

export interface AcademyTradeConfig {
  id: string; // Uniform trade slug: "Electrical", "Computer", "RAC", "Automobile", "Civil", "Electronics", "Apparel", "General"
  code: string; // e.g. "EE", "IT-IOT", "RAC", "AMB", "GE", "CIVIL"
  name: string; // English title
  nameBangla: string; // Bangla official title
  shortBangla: string; // Compact Bangla badge name (e.g. "ইলেকট্রিক্যাল")
  numericId?: number; // Legacy or database ID mapping (e.g. 101, 102, 1, 2)
  icon?: string; // Emoji or Lucide icon marker
  seats?: number;
  status?: "Active" | "Inactive";
}

export interface AcademyClassTradeMapping {
  id: string; // Canonical identifier: "class-6", "class-7", "class-8", "class-9", "class-10", "class-11", "class-12", "diploma"
  databaseClassId: number; // 1 to 7 (or 8 for diploma)
  numericValue: number; // 6, 7, 8, 9, 10, 11, 12, 13
  name: string; // "Class 6", "Class 9 (SSC Vocational)", etc.
  nameBangla: string; // "৬ষ্ঠ শ্রেণি", "৯ম শ্রেণি (এসএসসি ভোকেশনাল)", etc.
  shortBangla: string; // "৬ষ্ঠ শ্রেণি", "৯ম শ্রেণি"
  tier: "Pre-Vocational" | "SSC (Vocational)" | "HSC (Vocational)" | "Diploma";
  hasTrade: boolean; // false for 6, 7, 8; true for 9, 10, 11, 12, diploma
  tradeRequired: boolean; // false for 6, 7, 8; true for 9, 10, 11, 12
  generalTradeNoticeBangla: string; // Informational banner / option message
  totalSeats: number;
  availableTrades: AcademyTradeConfig[];
}

// Authoritative Master Trade Directory
export const MASTER_ACADEMY_TRADES: Record<string, AcademyTradeConfig> = {
  General: {
    id: "General",
    code: "GEN",
    name: "General Curriculum (No Trade)",
    nameBangla: "সাধারণ পাঠ্যক্রম (ট্রেড প্রযোজ্য নয়)",
    shortBangla: "সাধারণ",
    numericId: 0,
    icon: "📚",
    seats: 120,
    status: "Active",
  },
  Electronics: {
    id: "Electronics",
    code: "CE",
    name: "Consumer Electronics",
    nameBangla: "কনজিউমার ইলেকট্রনিক্স",
    shortBangla: "কনজিউমার ইলেকট্রনিক্স",
    numericId: 101,
    icon: "📻",
    seats: 50,
    status: "Active",
  },
  Computer: {
    id: "Computer",
    code: "IT-IOT",
    name: "IT Support & IoT Basics",
    nameBangla: "আইটি সাপোর্ট এন্ড আইওটি বেসিক্স",
    shortBangla: "আইটি ও আইওটি",
    numericId: 102,
    icon: "💻",
    seats: 50,
    status: "Active",
  },
  Electrical: {
    id: "Electrical",
    code: "GEW",
    name: "General Electrical Workshop",
    nameBangla: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কশপ",
    shortBangla: "ইলেকট্রিক্যাল ওয়ার্কশপ",
    numericId: 103,
    icon: "⚡",
    seats: 50,
    status: "Active",
  },
  Apparel: {
    id: "Apparel",
    code: "AMB",
    name: "Apparel Manufacturing Basics",
    nameBangla: "এপারেল ম্যানুফ্যাকচারিং বেসিক্স",
    shortBangla: "এপারেল ম্যানুফ্যাকচারিং",
    numericId: 104,
    icon: "✂️",
    seats: 50,
    status: "Active",
  },
  RAC: {
    id: "RAC",
    code: "RAC",
    name: "Refrigeration & Air Conditioning",
    nameBangla: "রেফ্রিজারেশন ও এয়ারকন্ডিশনিং",
    shortBangla: "রেফ্রিজারেশন (RAC)",
    numericId: 105,
    icon: "❄️",
    seats: 40,
    status: "Active",
  },
  Automobile: {
    id: "Automobile",
    code: "AUTO",
    name: "Automobile Technology",
    nameBangla: "অটোমোবাইল ইঞ্জিনিয়ারিং টেকনোলজি",
    shortBangla: "অটোমোবাইল",
    numericId: 204,
    icon: "🚗",
    seats: 50,
    status: "Active",
  },
  Civil: {
    id: "Civil",
    code: "CIVIL",
    name: "Civil Construction & Drafting",
    nameBangla: "সিভিল কনস্ট্রাকশন ও ড্রাফটিং",
    shortBangla: "সিভিল",
    numericId: 106,
    icon: "🏗️",
    seats: 40,
    status: "Active",
  },
};

// -------------------------------------------------------------
// CENTRAL DATABASE-DRIVEN ACADEMY CLASS-TO-TRADE MAPPINGS
// -------------------------------------------------------------
export const DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS: AcademyClassTradeMapping[] = [
  {
    id: "class-6",
    databaseClassId: 1,
    numericValue: 6,
    name: "Class 6",
    nameBangla: "৬ষ্ঠ শ্রেণি (সাধারণ)",
    shortBangla: "৬ষ্ঠ শ্রেণি",
    tier: "Pre-Vocational",
    hasTrade: false,
    tradeRequired: false,
    generalTradeNoticeBangla: "প্রাক-ভোকেশনাল স্তর (ট্রেড প্রযোজ্য নয় / সাধারণ পাঠ্যক্রম)",
    totalSeats: 120,
    availableTrades: [], // STRICT: NO TRADES
  },
  {
    id: "class-7",
    databaseClassId: 2,
    numericValue: 7,
    name: "Class 7",
    nameBangla: "৭ম শ্রেণি (সাধারণ)",
    shortBangla: "৭ম শ্রেণি",
    tier: "Pre-Vocational",
    hasTrade: false,
    tradeRequired: false,
    generalTradeNoticeBangla: "প্রাক-ভোকেশনাল স্তর (ট্রেড প্রযোজ্য নয় / সাধারণ পাঠ্যক্রম)",
    totalSeats: 120,
    availableTrades: [], // STRICT: NO TRADES
  },
  {
    id: "class-8",
    databaseClassId: 3,
    numericValue: 8,
    name: "Class 8",
    nameBangla: "৮ম শ্রেণি (প্রাক-ভোকেশনাল)",
    shortBangla: "৮ম শ্রেণি",
    tier: "Pre-Vocational",
    hasTrade: false,
    tradeRequired: false,
    generalTradeNoticeBangla: "প্রাক-ভোকেশনাল স্তর (ট্রেড প্রযোজ্য নয় / সাধারণ পাঠ্যক্রম)",
    totalSeats: 120,
    availableTrades: [], // STRICT: NO TRADES
  },
  {
    id: "class-9",
    databaseClassId: 4,
    numericValue: 9,
    name: "Class 9 (SSC Vocational)",
    nameBangla: "৯ম শ্রেণি (এসএসসি ভোকেশনাল)",
    shortBangla: "৯ম শ্রেণি",
    tier: "SSC (Vocational)",
    hasTrade: true,
    tradeRequired: true,
    generalTradeNoticeBangla: "কারিগরি ট্রেড বাধ্যতামূলক (৪টি অনুমোদিত ট্রেড)",
    totalSeats: 200,
    availableTrades: [
      MASTER_ACADEMY_TRADES.Electronics,
      MASTER_ACADEMY_TRADES.Computer,
      MASTER_ACADEMY_TRADES.Electrical,
      MASTER_ACADEMY_TRADES.Apparel,
    ],
  },
  {
    id: "class-10",
    databaseClassId: 5,
    numericValue: 10,
    name: "Class 10 (SSC Vocational)",
    nameBangla: "১০ম শ্রেণি (এসএসসি ভোকেশনাল)",
    shortBangla: "১০ম শ্রেণি",
    tier: "SSC (Vocational)",
    hasTrade: true,
    tradeRequired: true,
    generalTradeNoticeBangla: "কারিগরি ট্রেড বাধ্যতামূলক (৪টি অনুমোদিত ট্রেড)",
    totalSeats: 200,
    availableTrades: [
      MASTER_ACADEMY_TRADES.Electronics,
      MASTER_ACADEMY_TRADES.Computer,
      MASTER_ACADEMY_TRADES.Electrical,
      MASTER_ACADEMY_TRADES.Apparel,
    ],
  },
  {
    id: "class-11",
    databaseClassId: 6,
    numericValue: 11,
    name: "Class 11 (HSC Vocational)",
    nameBangla: "১১শ শ্রেণি (এইচএসসি ভোকেশনাল)",
    shortBangla: "১১শ শ্রেণি",
    tier: "HSC (Vocational)",
    hasTrade: true,
    tradeRequired: true,
    generalTradeNoticeBangla: "কারিগরি স্পেশালাইজেশন ট্রেড বাধ্যতামূলক (৪টি অনুমোদিত ট্রেড)",
    totalSeats: 200,
    availableTrades: [
      MASTER_ACADEMY_TRADES.Electronics,
      MASTER_ACADEMY_TRADES.Computer,
      MASTER_ACADEMY_TRADES.Electrical,
      MASTER_ACADEMY_TRADES.Apparel,
    ],
  },
  {
    id: "class-12",
    databaseClassId: 7,
    numericValue: 12,
    name: "Class 12 (HSC Vocational)",
    nameBangla: "১২শ শ্রেণি (এইচএসসি ভোকেশনাল)",
    shortBangla: "১২শ শ্রেণি",
    tier: "HSC (Vocational)",
    hasTrade: true,
    tradeRequired: true,
    generalTradeNoticeBangla: "কারিগরি স্পেশালাইজেশন ট্রেড বাধ্যতামূলক (৪টি অনুমোদিত ট্রেড)",
    totalSeats: 200,
    availableTrades: [
      MASTER_ACADEMY_TRADES.Electronics,
      MASTER_ACADEMY_TRADES.Computer,
      MASTER_ACADEMY_TRADES.Electrical,
      MASTER_ACADEMY_TRADES.Apparel,
    ],
  },
  {
    id: "diploma",
    databaseClassId: 8,
    numericValue: 13,
    name: "Diploma in Engineering",
    nameBangla: "ডিপ্লোমা ১ম/২য় পর্ব (ইঞ্জিনিয়ারিং)",
    shortBangla: "ডিপ্লোমা পর্ব",
    tier: "Diploma",
    hasTrade: true,
    tradeRequired: true,
    generalTradeNoticeBangla: "ডিপ্লোমা টেকনোলজি বাধ্যতামূলক",
    totalSeats: 120,
    availableTrades: [
      MASTER_ACADEMY_TRADES.Automobile,
      MASTER_ACADEMY_TRADES.Electrical,
      MASTER_ACADEMY_TRADES.Computer,
      MASTER_ACADEMY_TRADES.Civil,
    ],
  },
];

// -------------------------------------------------------------
// HELPER QUERY FUNCTIONS (Synchronous, Ultra-Fast & Resilient)
// -------------------------------------------------------------

/**
 * Normalizes any class identifier format into standard canonical id
 * Handles: "class-9", 4 (db ID), 9 (numeric), "Class 9", "৯ম", "diploma"
 */
export function normalizeClassId(classVal: string | number | undefined | null): string {
  if (classVal === undefined || classVal === null || classVal === "" || classVal === "all") {
    return "all";
  }

  const str = String(classVal).trim().toLowerCase();

  if (str === "diploma" || str.includes("diploma") || str.includes("ডিপ্লোমা")) {
    return "diploma";
  }

  if (str === "class-6" || str === "6" || str.includes("৬ষ্ঠ") || str.includes("six") || str === "1") {
    return "class-6";
  }
  if (str === "class-7" || str === "7" || str.includes("৭ম") || str.includes("seven") || str === "2") {
    return "class-7";
  }
  if (str === "class-8" || str === "8" || str.includes("৮ম") || str.includes("eight") || str === "3") {
    return "class-8";
  }
  if (str === "class-9" || str === "9" || str.includes("৯ম") || str.includes("nine") || str === "4") {
    return "class-9";
  }
  if (str === "class-10" || str === "10" || str.includes("১০ম") || str.includes("ten") || str === "5") {
    return "class-10";
  }
  if (str === "class-11" || str === "11" || str.includes("১১শ") || str.includes("eleven") || str === "6") {
    return "class-11";
  }
  if (str === "class-12" || str === "12" || str.includes("১২শ") || str.includes("twelve") || str === "7") {
    return "class-12";
  }

  return "class-9";
}

/**
 * Normalizes class to numeric value (6..12 or 13 for diploma)
 */
export function getNormalizedClassNumeric(classVal: string | number | undefined | null): number {
  const normalizedId = normalizeClassId(classVal);
  if (normalizedId === "class-6") return 6;
  if (normalizedId === "class-7") return 7;
  if (normalizedId === "class-8") return 8;
  if (normalizedId === "class-9") return 9;
  if (normalizedId === "class-10") return 10;
  if (normalizedId === "class-11") return 11;
  if (normalizedId === "class-12") return 12;
  if (normalizedId === "diploma") return 13;
  return 0;
}

/**
 * Finds the AcademyClassTradeMapping object for any class format
 */
export function getClassTradeMapping(
  classVal: string | number | undefined | null,
  mappings: AcademyClassTradeMapping[] = DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS
): AcademyClassTradeMapping | undefined {
  if (!classVal || classVal === "all") return undefined;
  const canonical = normalizeClassId(classVal);
  return mappings.find((m) => m.id === canonical);
}

/**
 * Checks if the given class has trades.
 * Returns FALSE for Class 6, 7, 8; TRUE for 9, 10, 11, 12, diploma
 */
export function doesClassRequireTrade(
  classVal: string | number | undefined | null,
  mappings: AcademyClassTradeMapping[] = DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS
): boolean {
  if (!classVal || classVal === "all") return false;
  const mapping = getClassTradeMapping(classVal, mappings);
  return mapping ? mapping.hasTrade : false;
}

/**
 * Gets valid trades for a specific class.
 * - Class 6, 7, 8: returns [] (empty array)
 * - Class 9+: returns only the allowed trades
 */
export function getAvailableTradesForClass(
  classVal: string | number | undefined | null,
  mappings: AcademyClassTradeMapping[] = DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS
): AcademyTradeConfig[] {
  if (!classVal || classVal === "all") return [];
  const mapping = getClassTradeMapping(classVal, mappings);
  return mapping ? mapping.availableTrades : [];
}

/**
 * Gets Bangla label for a class
 */
export function getClassLabelBangla(
  classVal: string | number | undefined | null,
  mappings: AcademyClassTradeMapping[] = DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS
): string {
  if (!classVal || classVal === "all") return "সকল শ্রেণি";
  const mapping = getClassTradeMapping(classVal, mappings);
  return mapping ? mapping.nameBangla : String(classVal);
}

/**
 * Gets Bangla label for a trade
 */
export function getTradeLabelBangla(
  tradeVal: string | number | undefined | null,
  classVal?: string | number | undefined | null
): string {
  if (!tradeVal || tradeVal === "all" || tradeVal === "") {
    return "সকল ট্রেড";
  }

  // Pre-Vocational check
  if (classVal && !doesClassRequireTrade(classVal)) {
    return "সাধারণ (ট্রেড প্রযোজ্য নয়)";
  }

  const tradeStr = String(tradeVal).trim().toLowerCase();

  for (const key of Object.keys(MASTER_ACADEMY_TRADES)) {
    const t = MASTER_ACADEMY_TRADES[key];
    if (
      t.id.toLowerCase() === tradeStr ||
      t.code.toLowerCase() === tradeStr ||
      String(t.numericId) === tradeStr ||
      t.nameBangla.toLowerCase().includes(tradeStr) ||
      t.shortBangla.toLowerCase().includes(tradeStr)
    ) {
      return t.nameBangla;
    }
  }

  return String(tradeVal);
}
