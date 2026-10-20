import { GeneratedDocument, DocumentType, DocumentTemplate, DocumentSignatory, DocumentStatus } from "./database";
import { doesClassHaveTrade } from "./academicStructure";
import { toBanglaDateString } from "./utils";

export interface DocumentThemeConfig {
  id: string;
  name: string;
  nameBangla: string;
  borderStyle: string;
  headerAccent: string;
  sealColor: string;
  watermarkBg: string;
  primaryBg: string;
  badgeStyle: string;
  fontFamily: string;
  watermarkText?: string;
}

export const BANGLA_DOCUMENT_THEMES: DocumentThemeConfig[] = [
  {
    id: "gov_classic",
    name: "Government Classic",
    nameBangla: "সরকারি ক্লাসিক (সবুজ-লাল বর্ডার)",
    borderStyle: "border-4 border-double border-emerald-800 p-8 shadow-md outline-2 outline-offset-4 outline-rose-800",
    headerAccent: "text-emerald-900 border-b-2 border-emerald-800 pb-3",
    sealColor: "text-emerald-800 border-emerald-800",
    watermarkBg: "bg-emerald-50/40",
    primaryBg: "bg-white",
    badgeStyle: "bg-emerald-800 text-white font-bold",
    fontFamily: "font-serif",
    watermarkText: "PTSC • GOVT OF BANGLADESH",
  },
  {
    id: "modern_academic",
    name: "Modern Academic",
    nameBangla: "মডার্ন একাডেমি (নীল-স্বর্ণালী ফ্রেম)",
    borderStyle: "border-2 border-indigo-900 p-8 shadow-xl relative ring-1 ring-amber-500/40 ring-offset-4",
    headerAccent: "text-indigo-950 border-b-2 border-indigo-900/40 pb-3",
    sealColor: "text-indigo-900 border-indigo-900",
    watermarkBg: "bg-indigo-50/30",
    primaryBg: "bg-white",
    badgeStyle: "bg-indigo-900 text-amber-300 font-bold",
    fontFamily: "font-sans",
    watermarkText: "PANCHAGARH GOVT TSC",
  },
  {
    id: "elegant_border",
    name: "Golden Vintage Border",
    nameBangla: "স্বর্ণালী ঐতিহ্যবাহী বর্ডার",
    borderStyle: "border-4 border-amber-700 p-8 shadow-2xl relative outline-dashed outline-2 outline-offset-8 outline-amber-600/60",
    headerAccent: "text-amber-950 border-b-2 border-amber-700/60 pb-3",
    sealColor: "text-amber-800 border-amber-800",
    watermarkBg: "bg-amber-50/40",
    primaryBg: "bg-amber-50/20",
    badgeStyle: "bg-amber-800 text-amber-100 font-bold",
    fontFamily: "font-serif",
    watermarkText: "ACADEMIC EXCELLENCE",
  },
  {
    id: "minimal_official",
    name: "Secretariat Minimal",
    nameBangla: "সচিবালয় অফিশিয়াল সরল রূপরেখা",
    borderStyle: "border border-slate-900 p-8 shadow-xs",
    headerAccent: "text-slate-900 border-b border-slate-900 pb-3",
    sealColor: "text-slate-900 border-slate-900",
    watermarkBg: "bg-slate-50/30",
    primaryBg: "bg-white",
    badgeStyle: "bg-slate-900 text-white font-medium",
    fontFamily: "font-mono",
    watermarkText: "GOVERNMENT OFFICIAL",
  },
  {
    id: "traditional_certificate",
    name: "BTEB Technical Diploma Style",
    nameBangla: "কারিগরি শিক্ষা বোর্ড সনদপত্র",
    borderStyle: "border-8 border-double border-teal-950 p-8 shadow-lg",
    headerAccent: "text-teal-950 border-b-2 border-teal-900 pb-3",
    sealColor: "text-teal-900 border-teal-900",
    watermarkBg: "bg-teal-50/30",
    primaryBg: "bg-white",
    badgeStyle: "bg-teal-950 text-teal-200 font-bold",
    fontFamily: "font-serif",
    watermarkText: "BTEB CODE: 18017",
  },
  {
    id: "premium_academic",
    name: "Premium Royal Academic",
    nameBangla: "রয়েল প্রিমিয়াম একাডেমি",
    borderStyle: "border-4 border-rose-950 p-8 shadow-2xl ring-2 ring-amber-400 ring-offset-2",
    headerAccent: "text-rose-950 border-b-2 border-rose-900 pb-3",
    sealColor: "text-rose-950 border-rose-950",
    watermarkBg: "bg-rose-50/20",
    primaryBg: "bg-white",
    badgeStyle: "bg-rose-950 text-amber-300 font-bold",
    fontFamily: "font-serif",
    watermarkText: "OFFICIAL VERIFIED DOCUMENT",
  },
];

export const DEFAULT_SIGNATORIES: DocumentSignatory[] = [
  {
    id: "sig_officer",
    title: "যাচাইকৃত",
    name: "মোঃ রুহুল আমিন",
    designation: "অফিস সহকারী কাম কম্পিউটার অপারেটর",
    institutionName: "পঞ্চগড় সরকারি টিএসসি",
    isVisible: true,
  },
  {
    id: "sig_head",
    title: "বিভাগীয় প্রধান / ট্রেড ইন-চার্জ",
    name: "প্রকৌঃ মোঃ তানভীর আহমেদ",
    designation: "চীফ ইন্সট্রাক্টর (আইটি ও আইওটি)",
    institutionName: "পঞ্চগড় সরকারি টিএসসি",
    isVisible: true,
  },
  {
    id: "sig_principal",
    title: "অধ্যক্ষ",
    name: "প্রকৌঃ মোঃ আমিনুল ইসলাম",
    designation: "অধ্যক্ষ (ভারপ্রাপ্ত)",
    institutionName: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
    isVisible: true,
  },
];

export const DOCUMENT_TYPE_LABELS: Record<string, { en: string; bn: string; code: string; defaultBodyTemplate: string; conductStatement?: string }> = {
  certificate: {
    en: "Academic Certificate",
    bn: "সনদপত্র",
    code: "CRT",
    defaultBodyTemplate:
      "এই মর্মে প্রত্যয়ন করা যাইতেছে যে, {STUDENT_NAME}, পিতা: {FATHER_NAME}, মাতা: {MOTHER_NAME}, এই প্রতিষ্ঠান হইতে কারিগরি শিক্ষা বোর্ডের অধীনে {SESSION} শিক্ষাবর্ষে {CLASS_NAME}, ট্রেড: {TRADE_NAME} এ সফলতার সহিত পাঠ সমাপনান্তে চূড়ান্ত পরীক্ষায় জিপিএ {GPA} পাইয়া উত্তীর্ণ হইয়াছে। তাহার স্বভাব ও চরিত্র প্রশংসনীয়।",
    conductStatement: "অত্র বিদ্যালয়ের নথি ও রেজিস্টার বই অনুসারে তাহার পাঠ্যকালীন আচরণ সন্তোষজনক ছিল এবং সে কখনোই রাষ্ট্রবিরোধী বা কোনো ধরনের শৃঙ্খলা পরিপন্থী কার্যকলাপে জড়িত ছিল না।",
  },
  testimonial: {
    en: "Testimonial / Character Certificate",
    bn: "প্রশংসাপত্র",
    code: "TSM",
    defaultBodyTemplate:
      "এই মর্মে প্রত্যয়ন করা যাইতেছে যে, {STUDENT_NAME}, পিতা: {FATHER_NAME}, মাতা: {MOTHER_NAME}, রোল নম্বর: {ROLL}, শ্রেণি: {CLASS_NAME}, ট্রেড: {TRADE_NAME} অত্র পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের একজন নিয়মিত শিক্ষার্থী ছিল। সে অত্র প্রতিষ্ঠানে অধ্যয়নকালে শৃঙ্খলা রক্ষা করিয়াছে এবং কোনো অনৈতিক কার্যকলাপে জড়িত ছিল না। সে পরীক্ষায় সন্তোষজনক ফলাফল অর্জন করিয়াছে। তাহার জীবনের উত্তরোত্তর সর্বাঙ্গীন মঙ্গল কামনা করি।",
    conductStatement: "অত্র বিদ্যালয়ের নথি ও রেজিস্টার বই অনুসারে তাহার পাঠ্যকালীন আচরণ সন্তোষজনক ছিল এবং সে কখনোই রাষ্ট্রবিরোধী বা কোনো ধরনের শৃঙ্খলা পরিপন্থী কার্যকলাপে জড়িত ছিল না।",
  },
  transfer_certificate: {
    en: "Transfer Certificate (TC)",
    bn: "ছাড়পত্র / স্থানান্তর সনদপত্র (টিসি)",
    code: "TC",
    defaultBodyTemplate:
      "এই মর্মে অবগত করা যাইতেছে যে, {STUDENT_NAME}, পিতা: {FATHER_NAME}, মাতা: {MOTHER_NAME}, অত্র প্রতিষ্ঠানের {CLASS_NAME}, ট্রেড: {TRADE_NAME} এর নিয়মিত শিক্ষার্থী ছিল। তাহার আবেদনের প্রেক্ষিতে এবং পিতা/অভিভাবকের সম্মতিক্রমে অত্র প্রতিষ্ঠান হইতে ছাড়পত্র প্রদান করা হইল। তাহার বকেয়া সকল বেতন ও প্রাতিষ্ঠানিক ফিস পরিশোধিত হইয়াছে। বর্তমান শ্রেণি ও তারিখ পর্যন্ত তাহার আচরণ সন্তোষজনক ছিল।",
    conductStatement: "বিদ্যালয়ের রেকর্ড অনুসারে তাহার নিকট কোনো প্রাতিষ্ঠানিক পাওনা বকেয়া নাই এবং তাহার আচরণ সন্তোষজনক ছিল।",
  },
  bonafide: {
    en: "Bonafide / Enrollment Certificate",
    bn: "অধ্যয়নরত প্রত্যয়নপত্র",
    code: "BNF",
    defaultBodyTemplate:
      "এই মর্মে প্রত্যয়ন করা যাইতেছে যে, {STUDENT_NAME}, পিতা: {FATHER_NAME}, মাতা: {MOTHER_NAME}, অত্র পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের {CLASS_NAME}, ট্রেড: {TRADE_NAME}, শাখা: {SECTION} এ {SESSION} শিক্ষাবর্ষের একজন নিয়মিত অধ্যয়নরত শিক্ষার্থী। তাহার রোল নম্বর {ROLL} এবং স্টুডেন্ট আইডি {STUDENT_ID}। সে অদ্যাবধি অত্র প্রতিষ্ঠানে পাঠ্য কার্যক্রমে নিয়মিত অংশগ্রহণ করিতেছে।",
    conductStatement: "অদ্যাবধি তাহার নৈতিক চরিত্র ও প্রাতিষ্ঠানিক শৃঙ্খলা প্রশংসনীয়।",
  },
  character: {
    en: "Character Certificate",
    bn: "চারিত্রিক সনদপত্র",
    code: "CHR",
    defaultBodyTemplate:
      "এই মর্মে প্রত্যয়ন করা যাইতেছে যে, {STUDENT_NAME}, পিতা: {FATHER_NAME}, মাতা: {MOTHER_NAME}, অত্র প্রতিষ্ঠানের {CLASS_NAME} এর একজন শিক্ষার্থী। আমার জানামতে সে একজন চরিত্রবান, বিনয়ী ও সদাচারী ছাত্র/ছাত্রী। তাহার নৈতিক চরিত্র অত্যন্ত উন্নত এবং রাষ্ট্রবিরোধী বা সমাজবিরোধী কোনো কর্মকাণ্ডের সহিত তাহার সংশ্লিষ্টতা নাই।",
    conductStatement: "আমার জানামতে সে একজন চরিত্রবান ও বিনয়ী ছাত্র/ছাত্রী। আমি তাহার উজ্জ্বল ভবিষ্যৎ ও সর্বাঙ্গীন উন্নতি কামনা করি।",
  },
  merit_award: {
    en: "Merit & Excellence Certificate",
    bn: "মেধা ও কৃতিত্বপূর্ণ প্রশংসাপত্র",
    code: "MRT",
    defaultBodyTemplate:
      "অত্যন্ত আনন্দের সহিত প্রত্যয়ন করা যাইতেছে যে, {STUDENT_NAME}, স্টুডেন্ট আইডি: {STUDENT_ID}, শ্রেণি: {CLASS_NAME}, ট্রেড: {TRADE_NAME}, পঞ্চগড় সরকারি টিএসসি কর্তৃক আয়োজিত ২০২৬ শিক্ষাবর্ষের কারিগরি ও মেধা মূল্যায়নে অনন্য পারদর্শিতা ও কৃতিত্ব প্রদর্শন করিয়াছে। তাহার মেধা ও নিষ্ঠার স্বীকৃতিস্বরূপ এই বিশেষ প্রশংসাপত্র প্রদান করা হইল।",
    conductStatement: "তাহার উদ্ভাবনী দক্ষতা ও প্রাতিষ্ঠানিক নিয়মানুবর্তিতা অন্যান্য শিক্ষার্থীদের জন্য অনুকরণীয়।",
  },
  guardian_noc: {
    en: "Guardian NOC & Consent Certificate",
    bn: "অভিভাবক অনাপত্তিপত্র (NOC)",
    code: "NOC",
    defaultBodyTemplate:
      "এই মর্মে প্রত্যয়ন করা যাইতেছে যে, {STUDENT_NAME}, পিতা: {FATHER_NAME}, মাতা: {MOTHER_NAME}, অত্র প্রতিষ্ঠানের {CLASS_NAME}, ট্রেড: {TRADE_NAME} এর একজন শিক্ষার্থী। জাতীয় পর্যায়ের কারিগরি অলিম্পিয়াড / ইন্ডাস্ট্রিয়াল অ্যাটাচমেন্ট প্রশিক্ষণে অংশগ্রহণের জন্য প্রাতিষ্ঠানিক অনাপত্তি জ্ঞাপন করা হইল।",
    conductStatement: "অত্র প্রতিষ্ঠান তাহার শিক্ষা সংশ্লিষ্ট সকল কর্মসূচিতে সাফল্য কামনা করে।",
  }
};

export const initialDocumentTemplates: DocumentTemplate[] = [
  {
    id: "tpl_testimonial_default",
    title: "Official Testimonial Template",
    titleBangla: "প্রাতিষ্ঠানিক প্রশংসাপত্র টেমপ্লেট",
    docType: "testimonial",
    code: "TSM",
    themeId: "gov_classic",
    bodyTemplate: DOCUMENT_TYPE_LABELS.testimonial.defaultBodyTemplate,
    conductStatement: DOCUMENT_TYPE_LABELS.testimonial.conductStatement,
    headerConfig: {
      showGovLogo: true,
      showBtebLogo: true,
      customHeaderBangla: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
      customSubHeader: "কারিগরি শিক্ষা অধিদপ্তর • শিক্ষা মন্ত্রণালয়",
      eiinText: "EIIN: ১৩২২৪৪ • প্রতিষ্ঠান কোড: ১৮০১৭ • পঞ্চগড় সদর, পঞ্চগড়",
    },
    signatories: DEFAULT_SIGNATORIES,
    watermarkText: "PTSC • GOVT OF BANGLADESH",
    status: "active",
    isSystemDefault: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tpl_certificate_default",
    title: "Course Completion Certificate Template",
    titleBangla: "কোর্স সমাপনী ও একাডেমিক সনদপত্র টেমপ্লেট",
    docType: "certificate",
    code: "CRT",
    themeId: "traditional_certificate",
    bodyTemplate: DOCUMENT_TYPE_LABELS.certificate.defaultBodyTemplate,
    conductStatement: DOCUMENT_TYPE_LABELS.certificate.conductStatement,
    headerConfig: {
      showGovLogo: true,
      showBtebLogo: true,
      customHeaderBangla: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
      customSubHeader: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত",
      eiinText: "EIIN: ১৩২২৪৪ • প্রতিষ্ঠান কোড: ১৮০১৭ • পঞ্চগড়",
    },
    signatories: DEFAULT_SIGNATORIES,
    watermarkText: "BTEB RECOGNIZED",
    status: "active",
    isSystemDefault: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tpl_tc_default",
    title: "Transfer Certificate (TC) Template",
    titleBangla: "ছাড়পত্র / টিসি টেমপ্লেট",
    docType: "transfer_certificate",
    code: "TC",
    themeId: "minimal_official",
    bodyTemplate: DOCUMENT_TYPE_LABELS.transfer_certificate.defaultBodyTemplate,
    conductStatement: DOCUMENT_TYPE_LABELS.transfer_certificate.conductStatement,
    headerConfig: {
      showGovLogo: true,
      showBtebLogo: true,
      customHeaderBangla: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
      customSubHeader: "অফিসিয়াল ছাড়পত্র ও শিক্ষাবর্ষ স্থানান্তর নথি",
      eiinText: "EIIN: ১৩২২৪৪ • পঞ্চগড় সদর",
    },
    signatories: DEFAULT_SIGNATORIES,
    watermarkText: "TRANSFER CERTIFICATE",
    status: "active",
    isSystemDefault: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tpl_bonafide_default",
    title: "Bonafide Student Certificate Template",
    titleBangla: "অধ্যয়নরত প্রত্যয়নপত্র টেমপ্লেট",
    docType: "bonafide",
    code: "BNF",
    themeId: "modern_academic",
    bodyTemplate: DOCUMENT_TYPE_LABELS.bonafide.defaultBodyTemplate,
    conductStatement: DOCUMENT_TYPE_LABELS.bonafide.conductStatement,
    headerConfig: {
      showGovLogo: true,
      showBtebLogo: true,
      customHeaderBangla: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
      customSubHeader: "ছাত্র-ছাত্রী অধ্যয়নরত প্রত্যয়নপত্র",
      eiinText: "EIIN: ১৩২২৪৪ • প্রতিষ্ঠান কোড: ১৮০১৭",
    },
    signatories: DEFAULT_SIGNATORIES,
    watermarkText: "BONAFIDE STUDENT",
    status: "active",
    isSystemDefault: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tpl_character_default",
    title: "Character Certificate Template",
    titleBangla: "চারিত্রিক সনদপত্র টেমপ্লেট",
    docType: "character",
    code: "CHR",
    themeId: "elegant_border",
    bodyTemplate: DOCUMENT_TYPE_LABELS.character.defaultBodyTemplate,
    conductStatement: DOCUMENT_TYPE_LABELS.character.conductStatement,
    headerConfig: {
      showGovLogo: true,
      showBtebLogo: true,
      customHeaderBangla: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
      customSubHeader: "নৈতিক চরিত্র ও আচরণ প্রত্যয়ন",
      eiinText: "EIIN: ১৩২২৪৪ • পঞ্চগড় সদর",
    },
    signatories: DEFAULT_SIGNATORIES,
    watermarkText: "CHARACTER CERTIFICATE",
    status: "active",
    isSystemDefault: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "tpl_merit_default",
    title: "Merit & Excellence Certificate Template",
    titleBangla: "মেধা ও শ্রেষ্ঠত্ব পুরস্কার সনদ টেমপ্লেট",
    docType: "merit_award",
    code: "MRT",
    themeId: "premium_academic",
    bodyTemplate: DOCUMENT_TYPE_LABELS.merit_award.defaultBodyTemplate,
    conductStatement: DOCUMENT_TYPE_LABELS.merit_award.conductStatement,
    headerConfig: {
      showGovLogo: true,
      showBtebLogo: true,
      customHeaderBangla: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
      customSubHeader: "বার্ষিক মেধা ও উদ্ভাবনী স্বীকৃতি ২০২৬",
      eiinText: "EIIN: ১৩২২৪৪ • পঞ্চগড় সদর",
    },
    signatories: DEFAULT_SIGNATORIES,
    watermarkText: "MERIT EXCELLENCE",
    status: "active",
    isSystemDefault: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
];

export const initialGeneratedDocuments: GeneratedDocument[] = [
  {
    id: "doc_1001",
    docNumber: "PTSC/TSM/2026/00101",
    docType: "testimonial",
    docTypeBangla: "প্রশংসাপত্র",
    theme: "gov_classic",
    studentId: 1,
    studentCode: "PTSC-2026-000001",
    studentName: "Kazi Tanvir Hasan",
    studentNameBangla: "কাজী তানভীর হাসান",
    roll: 1,
    classId: 4,
    className: "Class 9 (SSC Vocational)",
    tradeId: 2,
    tradeName: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
    tradeNameBangla: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
    section: "A",
    session: "2026",
    admissionNo: "ADM-2026-000001",
    fatherName: "Kazi Nazrul Islam",
    motherName: "Razia Sultana",
    dob: "2009-04-12",
    dobBangla: "১২ এপ্রিল, ২০০৯",
    birthRegNo: "20095217712345678",
    gpa: "5.00",
    resultStatus: "Passed",
    passingYear: "2026",
    issueDate: "2026-09-10",
    issueDateBangla: "১০ সেপ্টেম্বর, ২০২৬",
    generatedBy: "Md. Aminul Islam (Principal)",
    qrCodeData: "https://tsc.panchagarh.gov.bd/verify?doc=PTSC/TSM/2026/00101",
    remarks: "বার্ষিক পরীক্ষার পর বিশেষ প্রশংসা সহ প্রদত্ত",
    status: "issued",
    version: 1,
    reprintCount: 1,
    reprintHistory: [
      {
        reprintedAt: "2026-09-15T09:00:00Z",
        reprintedBy: "Admin Office",
        reason: "পাসপোর্ট ভেরিফিকেশনের জন্য ডুপ্লিকেট কপি",
        copyNumber: 2,
      }
    ],
    signatories: DEFAULT_SIGNATORIES,
    conductStatement: "অত্র বিদ্যালয়ের নথি ও রেজিস্টার বই অনুসারে তাহার পাঠ্যকালীন আচরণ সন্তোষজনক ছিল এবং সে কখনোই রাষ্ট্রবিরোধী বা কোনো ধরনের শৃঙ্খলা পরিপন্থী কার্যকলাপে জড়িত ছিল না।",
    auditLogs: [
      {
        id: "aud_101",
        action: "created",
        performedBy: "Engr. Md. Aminul Islam (Principal)",
        timestamp: "2026-09-10T11:00:00Z",
        details: "প্রশংসাপত্র ড্রাফট প্রস্তুতকৃত",
      },
      {
        id: "aud_102",
        action: "issued",
        performedBy: "Engr. Md. Aminul Islam (Principal)",
        timestamp: "2026-09-10T11:05:00Z",
        details: "অফিশিয়ালি ইস্যু ও সিলমোহরযুক্ত",
      },
      {
        id: "aud_103",
        action: "reprinted",
        performedBy: "Office Assistant",
        timestamp: "2026-09-15T09:00:00Z",
        details: "কপি নম্বর ২ পুনর্মুদ্রিত",
      }
    ],
    createdAt: "2026-09-10T11:00:00Z",
  },
  {
    id: "doc_1002",
    docNumber: "PTSC/BNF/2026/00102",
    docType: "bonafide",
    docTypeBangla: "অধ্যয়নরত প্রত্যয়নপত্র",
    theme: "modern_academic",
    studentId: 2,
    studentCode: "PTSC-2026-000002",
    studentName: "Mst. Sumaiya Akter",
    studentNameBangla: "মোছাঃ সুমাইয়া আক্তার",
    roll: 2,
    classId: 4,
    className: "Class 9 (SSC Vocational)",
    tradeId: 2,
    tradeName: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
    tradeNameBangla: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
    section: "A",
    session: "2026",
    admissionNo: "ADM-2026-000002",
    fatherName: "Md. Shamsul Haque",
    motherName: "Mst. Moriyom Begum",
    dob: "2009-08-25",
    dobBangla: "২৫ আগস্ট, ২০০৯",
    birthRegNo: "20095217787654321",
    gpa: "5.00",
    resultStatus: "Passed",
    issueDate: "2026-09-12",
    issueDateBangla: "১২ সেপ্টেম্বর, ২০২৬",
    generatedBy: "Md. Aminul Islam (Principal)",
    qrCodeData: "https://tsc.panchagarh.gov.bd/verify?doc=PTSC/BNF/2026/00102",
    remarks: "উপবৃত্তি আবেদন ও ব্যাংক অ্যাকাউন্ট খোলার জন্য প্রত্যয়ন",
    status: "issued",
    version: 1,
    reprintCount: 0,
    signatories: DEFAULT_SIGNATORIES,
    conductStatement: "অদ্যাবধি তাহার নৈতিক চরিত্র ও প্রাতিষ্ঠানিক শৃঙ্খলা প্রশংসনীয়।",
    auditLogs: [
      {
        id: "aud_201",
        action: "created",
        performedBy: "Office Assistant",
        timestamp: "2026-09-12T14:30:00Z",
        details: "অধ্যয়নরত প্রত্যয়নপত্র তৈরি",
      },
      {
        id: "aud_202",
        action: "issued",
        performedBy: "Engr. Md. Aminul Islam (Principal)",
        timestamp: "2026-09-12T14:35:00Z",
        details: "অধ্যক্ষ কর্তৃক স্বাক্ষরিত ও ইস্যুকৃত",
      }
    ],
    createdAt: "2026-09-12T14:30:00Z",
  },
  {
    id: "doc_1003",
    docNumber: "PTSC/TC/2026/00103",
    docType: "transfer_certificate",
    docTypeBangla: "ছাড়পত্র / স্থানান্তর সনদপত্র (টিসি)",
    theme: "minimal_official",
    studentId: 3,
    studentCode: "PTSC-2026-090001",
    studentName: "Md. Mehedi Hasan",
    studentNameBangla: "মোঃ মেহেদী হাসান",
    roll: 3,
    classId: 4,
    className: "Class 9 (SSC Vocational)",
    tradeId: 2,
    tradeName: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
    tradeNameBangla: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
    section: "A",
    session: "2026",
    admissionNo: "ADM-2026-000003",
    fatherName: "Md. Delowar Hossain",
    motherName: "Salma Begum",
    dob: "2009-02-18",
    dobBangla: "১৮ ফেব্রুয়ারি, ২০০৯",
    birthRegNo: "20095217799887766",
    gpa: "4.80",
    resultStatus: "Passed",
    passingYear: "2026",
    leavingReason: "অভিভাবকের চাকরি বদলিজনিত কারণে ঢাকা স্থানান্তর",
    issueDate: "2026-09-18",
    issueDateBangla: "১৮ সেপ্টেম্বর, ২০২৬",
    generatedBy: "Md. Aminul Islam (Principal)",
    qrCodeData: "https://tsc.panchagarh.gov.bd/verify?doc=PTSC/TC/2026/00103",
    remarks: "সকল ফি পরিশোধিত এবং টিসি বইতে অন্তর্ভুক্ত",
    status: "issued",
    version: 1,
    reprintCount: 0,
    signatories: DEFAULT_SIGNATORIES,
    conductStatement: "বিদ্যালয়ের রেকর্ড অনুসারে তাহার নিকট কোনো প্রাতিষ্ঠানিক পাওনা বকেয়া নাই এবং তাহার আচরণ সন্তোষজনক ছিল।",
    auditLogs: [
      {
        id: "aud_301",
        action: "created",
        performedBy: "Office Head",
        timestamp: "2026-09-18T10:00:00Z",
        details: "টিসি আবেদন অনুমোদন সাপেক্ষে ড্রাফট প্রস্তুত",
      },
      {
        id: "aud_302",
        action: "issued",
        performedBy: "Engr. Md. Aminul Islam (Principal)",
        timestamp: "2026-09-18T10:15:00Z",
        details: "ছাড়পত্র ইস্যু সম্পন্ন",
      }
    ],
    createdAt: "2026-09-18T10:00:00Z",
  }
];

// Helper: Replace dynamic tokens in body template
export function replaceDocumentTokens(templateText: string, student: any, extraFields?: { memoNo?: string; issueDate?: string; leavingReason?: string; passingYear?: string }): string {
  if (!student) return templateText;
  const s = student;
  const hasTrade = doesClassHaveTrade(s.classId || s.className);

  let text = templateText
    .replace(/{STUDENT_NAME}/g, s.nameBangla || s.name)
    .replace(/{STUDENT_NAME_EN}/g, s.name || s.nameBangla)
    .replace(/{FATHER_NAME}/g, s.fatherName || "মোঃ রফিকুল ইসলাম")
    .replace(/{MOTHER_NAME}/g, s.motherName || "মোছাঃ রোকেয়া বেগম")
    .replace(/{ROLL}/g, String(s.roll || "১"))
    .replace(/{STUDENT_ID}/g, s.studentId || s.studentCode || "PTSC-2026-000001")
    .replace(/{CLASS_NAME}/g, s.className || "Class 9")
    .replace(/{SECTION}/g, s.section || "A")
    .replace(/{SESSION}/g, s.session || "2026")
    .replace(/{GPA}/g, s.gpa || "5.00")
    .replace(/{DOB}/g, s.dobBangla || (s.dob ? toBanglaDateString(s.dob) : "০১ জানুয়ারি, ২০১০"))
    .replace(/{BIRTH_REG_NO}/g, s.birthRegNo || "—")
    .replace(/{LEAVING_REASON}/g, extraFields?.leavingReason || "উচ্চতর কারিগরি শিক্ষায় ভর্তির সুবিধার্থে")
    .replace(/{PASSING_YEAR}/g, extraFields?.passingYear || s.session || "2026")
    .replace(/{MEMO_NO}/g, extraFields?.memoNo || "PTSC/DOC/2026/001")
    .replace(/{ISSUE_DATE}/g, extraFields?.issueDate ? toBanglaDateString(extraFields.issueDate) : toBanglaDateString(new Date().toISOString().slice(0, 10)));

  if (hasTrade) {
    text = text.replace(/{TRADE_NAME}/g, s.tradeNameBangla || s.tradeName || "ভোকেশনাল ট্রেড");
  } else {
    text = text
      .replace(/,\s*ট্রেড:\s*\{TRADE_NAME\}/g, "")
      .replace(/ট্রেড:\s*\{TRADE_NAME\}/g, "")
      .replace(/\{TRADE_NAME\}/g, "");
  }

  return text;
}
