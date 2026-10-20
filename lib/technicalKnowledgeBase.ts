// Technical Knowledge Base for PTSC (Panchagarh Govt. Technical School & College) & BTEB Curriculum

export interface KnowledgeEntry {
  id: string;
  category: "electrical" | "computer" | "electronics" | "safety" | "bteb_general";
  keywords: string[];
  title: string;
  summary: string;
  details: string;
}

export const TECHNICAL_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: "kb-ohm-law",
    category: "electrical",
    keywords: ["ওহম", "ohm", "ohms law", "v=ir", "voltage", "current", "resistance", "রেজিস্ট্যান্স", "কারেন্ট", "ভোল্টেজ"],
    title: "ওহমের সূত্র (Ohm's Law)",
    summary: "স্থির তাপমাত্রায় পরিবাহীর কারেন্ট বিভব পার্থক্যের সমানুপাতিক এবং রেজিস্ট্যান্সের ব্যস্তানুপাতিক (V = I × R)।",
    details: "সূত্র: V = I × R | I = V / R | R = V / I। একক: ভোল্টেজ (V, ভোল্ট), কারেন্ট (I, অ্যাম্পিয়ার A), রেজিস্ট্যান্স (R, ওহম Ω)। বাস্তব প্রয়োগ: যেকোনো সার্কিটে সঠিক ফিউজ, রেজিস্টর বা লোড গণনায় ব্যবহৃত হয়।",
  },
  {
    id: "kb-electrical-power",
    category: "electrical",
    keywords: ["পাওয়ার", "power", "watt", "ওয়াট", "p=vi", "বৈদ্যুতিক ক্ষমতা", "power formula"],
    title: "ইলেকট্রিক্যাল পাওয়ার (Electrical Power)",
    summary: "বৈদ্যুতিক শক্তি ব্যবহারের হারকে পাওয়ার বলে (P = V × I)। একক: ওয়াট (W) বা কিলোওয়াট (kW)।",
    details: "ফর্মুলা: P = V × I, P = I² × R, P = V² / R। বাসাবাড়ির এনার্জি মিটার হিসাব: 1 kWh = 1 Unit = 1000 Watt যন্ত্র 1 ঘণ্টা চললে ব্যবহৃত বিদ্যুৎ।",
  },
  {
    id: "kb-kirchhoff-law",
    category: "electrical",
    keywords: ["কার্শফ", "kirchhoff", "kcl", "kvl", "জংশন", "লুপ"],
    title: "কার্শফের সূত্র (Kirchhoff's Laws)",
    summary: "KCL: সার্কিটের যেকোনো জংশনে আগত কারেন্ট = নির্গত কারেন্ট। KVL: যেকোনো বন্ধ লুপে ভোল্টেজ ড্রপের যোগফল শূন্য।",
    details: "KCL (Current Law): ΣI = 0 (জংশন পয়েন্টে)। KVL (Voltage Law): ΣV = 0 (ক্লোজড লুপে)। জটিল নেটওয়ার্ক বিশ্লেষণের জন্য ব্যবহৃত হয়।",
  },
  {
    id: "kb-earthing-grounding",
    category: "electrical",
    keywords: ["আর্দিং", "earthing", "grounding", "গ্রাউন্ডিং", "সেফটি", "শর্ট সার্কিট"],
    title: "আর্দিং ও শোর প্রোটেকশন (Earthing & Grounding)",
    summary: "বৈদ্যুতিক যন্ত্রপাতির ধাতব বডিকে কম রেজিস্ট্যান্সযুক্ত তার দিয়ে মাটিতে যুক্ত করাকে আর্দিং বলে।",
    details: "উদ্দেশ্য: লিক কারেন্ট বা শর্ট সার্কিট হলে বিদ্যুৎ মাটির নিচে চলে যায় এবং ব্যবহারকারী মারাত্মক শক থেকে বেঁচে যান। আর্দ রেজিস্ট্যান্স সাধারণ বাসাবাড়িতে ৫ ওহমের কম হওয়া উচিত।",
  },
  {
    id: "kb-ip-networking",
    category: "computer",
    keywords: ["ip", "ip address", "আইপি", "আইপি এড্রেস", "ipv4", "ipv6", "subnetting", "নেটওয়ার্ক"],
    title: "IP Addressing & Subnetting",
    summary: "নেটওয়ার্কে থাকা প্রতিটি ডিভাইসকে অনন্যভাবে শনাক্ত করার জন্য ব্যবহৃত লজিক্যাল এড্রেস হলো IP Address।",
    details: "IPv4: 32-bit (e.g. 192.168.1.1), 4টি অকটেট। IPv6: 128-bit। প্রাইভেট IP রেঞ্জ: Class A (10.0.0.0/8), Class B (172.16.0.0/12), Class C (192.168.0.0/16)।",
  },
  {
    id: "kb-router-switch",
    category: "computer",
    keywords: ["রাউটার", "router", "switch", "সুইচ", "osi model", "lan", "wan"],
    title: "Router vs Switch (OSI Model)",
    summary: "Switch কাজ করে Network LAN এর ভেতরে (Layer 2 - Data Link)। Router কাজ করে ভিন্ন নেটওয়ার্কের মধ্যে (Layer 3 - Network)।",
    details: "Switch MAC Address টেবিল ব্যবহার করে ফ্রেম ফরোয়ার্ড করে। Router IP Address ও Routing Table ব্যবহার করে প্যাকেট রুট করে।",
  },
  {
    id: "kb-cyber-security",
    category: "computer",
    keywords: ["সাইবার সেফটি", "cyber security", "phishing", "2fa", "ফিশিং", "পাসওয়ার্ড", "malware"],
    title: "সাইবার সিকিউরিটি ও আইটি এথিক্স",
    summary: "ডিজিটাল ডিভাইস ও ডেটাকে অননুমোদিত অ্যাক্সেস বা সাইবার আক্রমণ থেকে সুরক্ষার প্রযুক্তি।",
    details: "সুরক্ষা নিয়ম: strong password ব্যবহার, Two-Factor Authentication (2FA) চালু রাখা, অপরিচিত লিংক বা ফিশিং ইমেইলে ক্লিক না করা, নিয়মিত ব্যাকআপ রাখা।",
  },
  {
    id: "kb-diode-transistor",
    category: "electronics",
    keywords: ["ডায়োড", "diode", "ট্রানজিস্টর", "transistor", "rectifier", "npn", "pnp", "semiconductor"],
    title: "ডায়োড ও ট্রানজিস্টর (Semiconductors)",
    summary: "Diode একমুখী বিদ্যুৎ প্রবাহ নিশ্চিত করে (Rectifier)। Transistor অ্যাম্প্লিফায়ার বা ইলেকট্রনিক সুইচ হিসেবে কাজ করে।",
    details: "Diode P-N Junction দিয়ে গঠিত। Transistor ৩টি টার্মিনাল বিশিষ্ট: Emitter (E), Base (B), Collector (C)। NPN এবং PNP দুই ধরনের হয়।",
  },
  {
    id: "kb-lab-safety",
    category: "safety",
    keywords: ["সেফটি", "safety", "ppe", "পিপিই", "ল্যাব রুলস", "আগুন", "fire extinguisher"],
    title: "কারিগরি ল্যাব সেফটি ও পিপিই (PPE Rules)",
    summary: "ল্যাবে কাজ করার সময় ব্যক্তিগত সুরক্ষা সরঞ্জাম (PPE) ব্যবহার এবং নিরাপত্তা বিধি মেনে চলা আবশ্যক।",
    details: "PPE উপাদান: ইনসুলেটেড সেফটি শু, সেফটি গগলস, ইনসুলেটেড গ্লাভস, অ্যাপ্রন। রুলস: পাওয়ার অফ করে সার্কিট সংযোগ দেওয়া, ভেজা হাতে ইলেকট্রিক সুইচে হাত না দেওয়া।",
  },
  {
    id: "kb-bteb-grading",
    category: "bteb_general",
    keywords: ["বিটিইবি", "bteb", "সিলেবাস", "syllabys", "grading", "marks", "খাতা", "গ্রেডিং"],
    title: "BTEB কারিগরি শিক্ষা ও পরীক্ষা নির্দেশিকা",
    summary: "বাংলাদেশ কারিগরি শিক্ষা বোর্ডের অধীনে ধারাবাহিক মূল্যায়ন (Continuous Assessment) এবং চুড়ান্ত পরীক্ষার নম্বর বণ্টন।",
    details: "নম্বর বিভাজন: তত্ত্বীয় ধারাবাহিক (TC), তত্ত্বীয় চুড়ান্ত (TF), ব্যবহারিক ধারাবাহিক (PC), ব্যবহারিক চুড়ান্ত (PF)। ব্যবহারিক ল্যাব খাতা ও অ্যাসাইনমেন্টে ৫০% পাস মার্ক বাধ্যতামূলক।",
  },
];

/**
 * Knowledge Base Context Retriever
 * Searches user query and returns matched knowledge entries
 */
export function retrieveTechnicalContext(query: string): {
  contextText: string;
  matchedEntries: KnowledgeEntry[];
} {
  if (!query || typeof query !== "string") {
    return { contextText: "", matchedEntries: [] };
  }

  const normalizedQuery = query.toLowerCase();

  const matched = TECHNICAL_KNOWLEDGE_BASE.filter((entry) => {
    return entry.keywords.some((kw) => normalizedQuery.includes(kw.toLowerCase()));
  });

  if (matched.length === 0) {
    return { contextText: "", matchedEntries: [] };
  }

  const contextText = matched
    .map(
      (m) =>
        `[TECHNICAL KNOWLEDGE ENTRY: ${m.title}]\nSummary: ${m.summary}\nTechnical Details: ${m.details}`
    )
    .join("\n\n");

  return { contextText, matchedEntries: matched };
}
