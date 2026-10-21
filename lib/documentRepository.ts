export interface DocumentRepoItem {
  id: string;
  title: string;
  titleBangla: string;
  classId: string;
  classNameBangla: string;
  tradeCode: string;
  tradeNameBangla: string;
  subjectCode?: string;
  category: "Syllabus" | "Curriculum PDF" | "Lecture Notes" | "Question Bank";
  fileUrl: string;
  fileSize: string;
  uploadDate: string;
  extractedTextSnippet: string;
}

export const INITIAL_DOCUMENT_REPOSITORY: DocumentRepoItem[] = [
  {
    id: "doc-1",
    title: "Class 9 SSC Vocational General Electrical Works Syllabus 2026",
    titleBangla: "৯ম শ্রেণি এসএসসি ভোকেশনাল জেনারেল ইলেকট্রিক্যাল ওয়ার্কস সিলেবাস ২০২৬",
    classId: "4",
    classNameBangla: "নবম শ্রেণি (এসএসসি ভোকেশনাল)",
    tradeCode: "SSC-T1",
    tradeNameBangla: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কস",
    category: "Syllabus",
    fileUrl: "/documents/electrical_class9_syllabus.pdf",
    fileSize: "1.8 MB",
    uploadDate: "2026-01-15",
    extractedTextSnippet: "বিটিইবি জেনারেল ইলেকট্রিক্যাল ওয়ার্কস ট্রেড-১ পাঠ্যসূচি: ১. ওহমের সূত্র ও কারেন্ট পরীক্ষা, ২. ইলেকট্রিক্যাল ক্যাবল জয়েন্ট ও ইনসুলেশন, ৩. সার্ভিস মেইন ও ডিস্ট্রিবিউশন বোর্ড স্থাপন, ৪. নিরাপত্তার নিময়াবলী ও ইয়ার্দিং টেস্ট।"
  },
  {
    id: "doc-2",
    title: "Class 9 SSC Vocational Computer & IT Support Fundamentals",
    titleBangla: "৯ম শ্রেণি আইটি সাপোর্ট ও আইওটি বিএস ফান্ডামেন্টাল গাইড",
    classId: "4",
    classNameBangla: "নবম শ্রেণি (এসএসসি ভোকেশনাল)",
    tradeCode: "SSC-T2",
    tradeNameBangla: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
    category: "Curriculum PDF",
    fileUrl: "/documents/it_support_class9_guide.pdf",
    fileSize: "2.4 MB",
    uploadDate: "2026-02-01",
    extractedTextSnippet: "আইটি সাপোর্ট ও আইওটি ল্যাব কারিকুলাম: ১. কম্পিউটার হার্ডওয়্যার অ্যাসেম্বলি ও উইন্ডোজ সেটআপ, ২. আইওটি সেন্সর (DHT11/HC-SR04) ইন্টারফেসিং, ৩. আরডুইনো মাইক্রোকন্ট্রোলার প্রোগ্রামিং, ৪. কম্পিউটার নেটওয়ার্কিং ক্যাবলিং (RJ45)।"
  },
  {
    id: "doc-3",
    title: "Class 10 SSC Vocational Electrical Wiring & Safety Manual",
    titleBangla: "১০ম শ্রেণি ইলেকট্রিক্যাল ওয়ারিং ও হাউস ওয়ারিং ম্যানুয়াল",
    classId: "5",
    classNameBangla: "দশম শ্রেণি (এসএসসি ভোকেশনাল)",
    tradeCode: "SSC-T1",
    tradeNameBangla: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কস",
    category: "Lecture Notes",
    fileUrl: "/documents/electrical_wiring_manual_class10.pdf",
    fileSize: "3.1 MB",
    uploadDate: "2026-01-20",
    extractedTextSnippet: "হাউস ওয়ারিং ও ডিস্ট্রিবিউশন গাইড: কনড্যুইট ওয়ারিং, সার্কিট ব্রেকার (MCB/MCCB) সিলেকশন, মোটর কন্ট্রোল ও থ্রি-ফেজ স্টার্টার সংযোগ ডায়গ্রাম, সার্কিট ডায়গ্রাম অঙ্কন ও টেস্ট।"
  },
  {
    id: "doc-4",
    title: "Class 11 HSC Vocational Computer Operation & Database Guide",
    titleBangla: "একাদশ শ্রেণি ভোকেশনাল কম্পিউটার অপারেশন ও ডাটাবেজ সিলেবাস",
    classId: "6",
    classNameBangla: "একাদশ শ্রেণি (এইচএসসি ভোকেশনাল)",
    tradeCode: "HSC-T1",
    tradeNameBangla: "কম্পিউটার অপারেশন অ্যান্ড মেইনটেন্যান্স",
    category: "Syllabus",
    fileUrl: "/documents/hsc_computer_database_class11.pdf",
    fileSize: "4.2 MB",
    uploadDate: "2026-02-10",
    extractedTextSnippet: "এইচএসসি কম্পিউটার অপারেশন কারিকুলাম: ১. মাইএসকিউএল ডাটাবেজ ডিজাইন ও রিলেশনশিপ, ২. পাইথন ও সি প্রোগ্রামিং বেসিকস, ৩. নেটওয়ার্ক টপোলজি ও ট্রাবলশুটিং, ৪. সাইবার সিকিউরিটি ফান্ডামেন্টালস।"
  },
  {
    id: "doc-5",
    title: "Class 9 SSC Vocational Dress Making & Tailoring Fundamentals",
    titleBangla: "৯ম শ্রেণি ড্রেস মেকিং ও টেইলারিং ব্যবহারিক গাইড",
    classId: "4",
    classNameBangla: "নবম শ্রেণি (এসএসসি ভোকেশনাল)",
    tradeCode: "SSC-T3",
    tradeNameBangla: "ড্রেস মেকিং অ্যান্ড টেইলরিং",
    category: "Curriculum PDF",
    fileUrl: "/documents/dress_making_class9.pdf",
    fileSize: "1.5 MB",
    uploadDate: "2026-01-25",
    extractedTextSnippet: "ড্রেস মেকিং ল্যাব ম্যানুয়াল: মেজারমেন্ট টেকিং, পেপার প্যাটার্ন মেকিং, ফেব্রিক কাটিং ও সুইং মেশিন অপারেটিং রুলস, স্টিচিং একুরেসি টেস্ট ও গার্মেন্টস সেফটি।"
  },
  {
    id: "doc-6",
    title: "Class 9 SSC Vocational Automotive & Engine Fundamentals",
    titleBangla: "৯ম শ্রেণি অটোমোটিভ ইঞ্জিন ও মেকানিক্স নির্দেশিকা",
    classId: "4",
    classNameBangla: "নবম শ্রেণি (এসএসসি ভোকেশনাল)",
    tradeCode: "SSC-T4",
    tradeNameBangla: "অটোমোটিভ অ্যান্ড ইঞ্জিন মেকানিক্স",
    category: "Syllabus",
    fileUrl: "/documents/automotive_engine_class9.pdf",
    fileSize: "2.8 MB",
    uploadDate: "2026-02-05",
    extractedTextSnippet: "অটোমোটিভ ইঞ্জিন পরিচিতি: ফোর-স্ট্রোক ও টু-স্ট্রোক পেট্রোল/ডিজেল ইঞ্জিন মেকানিজম, পিস্টন, সিলিন্ডার হেড ওভারহলিং, কুলিং ও লুব্রিকেশন সিস্টেম ট্রাবলশুটিং।"
  }
];

// In-memory runtime storage
export let documentRepository: DocumentRepoItem[] = [...INITIAL_DOCUMENT_REPOSITORY];

export function getMatchingDocuments(classId?: string, tradeCode?: string, category?: string): DocumentRepoItem[] {
  const cleanClass = classId && classId !== "undefined" && classId !== "null" && classId !== "all" ? classId : undefined;
  const cleanTrade = tradeCode && tradeCode !== "undefined" && tradeCode !== "null" && tradeCode !== "all" ? tradeCode : undefined;
  const cleanCat = category && category !== "undefined" && category !== "null" && category !== "all" ? category : undefined;

  return documentRepository.filter((doc) => {
    const matchClass = !cleanClass || doc.classId === cleanClass;
    const matchTrade = !cleanTrade || doc.tradeCode === cleanTrade;
    const matchCat = !cleanCat || doc.category === cleanCat;
    return matchClass && matchTrade && matchCat;
  });
}

export function addDocumentToRepository(newDoc: DocumentRepoItem): DocumentRepoItem {
  documentRepository.unshift(newDoc);
  return newDoc;
}

export function removeDocumentFromRepository(id: string): boolean {
  const index = documentRepository.findIndex((doc) => doc.id === id);
  if (index !== -1) {
    documentRepository.splice(index, 1);
    return true;
  }
  return false;
}

