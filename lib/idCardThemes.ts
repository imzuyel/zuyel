export interface IdCardTheme {
  id: string;
  name: string;
  nameBangla: string;
  headerGradient: string;
  cardBg: string;
  accentColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  chipColor: string;
  previewColor: string;
  textColor: string;
  ribbonColor: string;
  defaultVectors: VectorOverlayId[];
}

export type VectorOverlayId =
  | "guilloche"
  | "circuit"
  | "geometric"
  | "waves"
  | "hex_grid"
  | "national"
  | "hologram_seal"
  | "chip"
  | "lanyard_slot"
  | "micro_dots"
  | "watermark_crest";

export interface VectorOverlayOption {
  id: VectorOverlayId;
  name: string;
  nameBangla: string;
  description: string;
  category: "background" | "security" | "hardware";
}

export const VECTOR_OVERLAY_OPTIONS: VectorOverlayOption[] = [
  {
    id: "guilloche",
    name: "Guilloche Security Rosette",
    nameBangla: "গিলোচে সিকিউরিটি রিং",
    description: "ব্যাংকনোট ও সিকিউরিটি ডকুমেন্টের মাইক্রো-লাইন ওয়াটারমার্ক",
    category: "security",
  },
  {
    id: "circuit",
    name: "Printed Circuit & IoT Nodes",
    nameBangla: "ইলেকট্রনিক্স সার্কিট ও আইওটি নোড",
    description: "কারিগরি শিক্ষার বাস্তব সার্কিট বোর্ড ও সাইবার লাইন",
    category: "background",
  },
  {
    id: "geometric",
    name: "Polygonal Facets & Prisms",
    nameBangla: "জ্যামিতিক প্রিজম ভেক্টর",
    description: "আধুনিক অ্যাবস্ট্রাক্ট বহুভুজ ডেকোরেশন",
    category: "background",
  },
  {
    id: "waves",
    name: "Modern Dynamic Fluid Waves",
    nameBangla: "ডায়নামিক ফ্লুইড ওয়েভস",
    description: "প্রিমিয়াম আধুনিক রঙিন তরঙ্গ ডিজাইন",
    category: "background",
  },
  {
    id: "hex_grid",
    name: "Technical Hexagon Nanogrid",
    nameBangla: "হেক্সাগন টেকনিক্যাল গ্রিড",
    description: "ন্যানো-টেকনোলজি ও ইঞ্জিনিয়ারিং প্যাটার্ন",
    category: "background",
  },
  {
    id: "watermark_crest",
    name: "Institutional Monogram Watermark",
    nameBangla: "সরকারি মনোগ্রাম ওয়াটারমার্ক",
    description: "শিক্ষা অধিদপ্তর ও বাংলাদেশ সরকারের জলছাপ",
    category: "security",
  },
  {
    id: "hologram_seal",
    name: "Holographic Security Rosette Seal",
    nameBangla: "হলো-সিকিউরিটি হলোগ্রাম সীল",
    description: "স্বর্ণালী চকচকে ডিজিটাল সিকিউরিটি ব্যাজ",
    category: "security",
  },
  {
    id: "chip",
    name: "Gold Smart RFID Microchip Vector",
    nameBangla: "স্মার্ট আরএফআইডি চিপ",
    description: "স্মার্ট ডিজিটাল মাইক্রোপ্রসেসর ভেক্টর",
    category: "hardware",
  },
  {
    id: "lanyard_slot",
    name: "Standard Lanyard Punch Hole",
    nameBangla: "ফিতা ঝুলানোর স্লট ভেক্টর",
    description: "আইডি কার্ড রিবন হোল্ড পাঞ্চ স্লট",
    category: "hardware",
  },
  {
    id: "micro_dots",
    name: "Micro-Dot Matrix Security",
    nameBangla: "মাইক্রো-ডট সিকিউরিটি ম্যাট্রিক্স",
    description: "অ্যান্টি-ফোরজারি ডট ম্যাট্রিক্স প্যাটার্ন",
    category: "security",
  },
];

export const ID_CARD_THEMES: IdCardTheme[] = [
  {
    id: "bteb_navy_gold",
    name: "BTEB Royal Navy & Gold",
    nameBangla: "রয়েল নেভি ও গোল্ডেন গ্লো",
    headerGradient: "from-blue-900 via-indigo-950 to-slate-950",
    cardBg: "bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white",
    accentColor: "text-amber-400",
    borderColor: "border-amber-400/80 shadow-amber-500/20",
    badgeBg: "bg-amber-400/20 text-amber-300 border-amber-400/60",
    badgeText: "text-amber-300",
    chipColor: "from-amber-300 via-yellow-400 to-amber-500 border-amber-600",
    previewColor: "bg-gradient-to-r from-blue-950 via-indigo-900 to-amber-500",
    textColor: "text-white",
    ribbonColor: "from-amber-500 to-yellow-300",
    defaultVectors: ["guilloche", "watermark_crest", "chip", "lanyard_slot", "hologram_seal"],
  },
  {
    id: "royal_emerald",
    name: "Technical Royal Emerald",
    nameBangla: "রয়েল পান্না সবুজ ও গোল্ড",
    headerGradient: "from-emerald-800 via-teal-900 to-emerald-950",
    cardBg: "bg-gradient-to-b from-slate-950 via-teal-950 to-emerald-950 text-white",
    accentColor: "text-emerald-300",
    borderColor: "border-emerald-400/80 shadow-emerald-500/20",
    badgeBg: "bg-emerald-500/20 text-emerald-200 border-emerald-400/60",
    badgeText: "text-emerald-200",
    chipColor: "from-teal-300 via-emerald-400 to-teal-500 border-teal-600",
    previewColor: "bg-gradient-to-r from-emerald-800 to-teal-500",
    textColor: "text-white",
    ribbonColor: "from-emerald-400 to-teal-300",
    defaultVectors: ["geometric", "watermark_crest", "chip", "lanyard_slot", "hologram_seal"],
  },
  {
    id: "cyber_iot_teal",
    name: "Cyber IoT & IT Support",
    nameBangla: "সাইবার আইওটি ও ইলেকট্রিক সায়ান",
    headerGradient: "from-cyan-900 via-blue-900 to-indigo-950",
    cardBg: "bg-gradient-to-b from-slate-950 via-indigo-950 to-blue-950 text-white",
    accentColor: "text-cyan-300",
    borderColor: "border-cyan-400/80 shadow-cyan-500/20",
    badgeBg: "bg-cyan-500/20 text-cyan-200 border-cyan-400/60",
    badgeText: "text-cyan-200",
    chipColor: "from-cyan-300 via-blue-400 to-cyan-500 border-cyan-600",
    previewColor: "bg-gradient-to-r from-cyan-600 to-blue-600",
    textColor: "text-white",
    ribbonColor: "from-cyan-400 to-blue-400",
    defaultVectors: ["circuit", "hex_grid", "chip", "lanyard_slot", "hologram_seal"],
  },
  {
    id: "national_bd",
    name: "National Bangladesh Gov",
    nameBangla: "জাতীয় পতাকার সবুজ ও রক্তিম লাল",
    headerGradient: "from-emerald-900 via-green-950 to-red-900",
    cardBg: "bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-900 text-white",
    accentColor: "text-rose-300",
    borderColor: "border-rose-500/80 shadow-rose-500/20",
    badgeBg: "bg-red-500/20 text-red-200 border-red-500/60",
    badgeText: "text-red-200",
    chipColor: "from-amber-300 via-yellow-400 to-amber-500 border-amber-600",
    previewColor: "bg-gradient-to-r from-emerald-800 to-red-600",
    textColor: "text-white",
    ribbonColor: "from-red-500 to-amber-400",
    defaultVectors: ["national", "watermark_crest", "chip", "lanyard_slot", "hologram_seal"],
  },
  {
    id: "crimson_ruby",
    name: "Technical Crimson Energy",
    nameBangla: "রক্তিম ক্রিস্টাল রুবি ও গোল্ড",
    headerGradient: "from-rose-900 via-red-950 to-slate-950",
    cardBg: "bg-gradient-to-b from-slate-950 via-rose-950 to-slate-900 text-white",
    accentColor: "text-rose-300",
    borderColor: "border-rose-400/80 shadow-rose-500/20",
    badgeBg: "bg-rose-500/20 text-rose-200 border-rose-400/60",
    badgeText: "text-rose-200",
    chipColor: "from-amber-300 via-rose-400 to-amber-500 border-rose-600",
    previewColor: "bg-gradient-to-r from-rose-700 to-red-500",
    textColor: "text-white",
    ribbonColor: "from-rose-500 to-red-400",
    defaultVectors: ["waves", "guilloche", "chip", "lanyard_slot", "hologram_seal"],
  },
  {
    id: "purple_neon",
    name: "Futuristic Purple & Pink Neon",
    nameBangla: "ফিউচারিস্টিক পার্পল ও নিয়ন পিঙ্ক",
    headerGradient: "from-purple-900 via-violet-950 to-pink-900",
    cardBg: "bg-gradient-to-b from-slate-950 via-purple-950 to-violet-950 text-white",
    accentColor: "text-pink-300",
    borderColor: "border-purple-400/80 shadow-purple-500/20",
    badgeBg: "bg-pink-500/20 text-pink-300 border-pink-400/60",
    badgeText: "text-pink-300",
    chipColor: "from-pink-300 via-purple-400 to-violet-500 border-purple-600",
    previewColor: "bg-gradient-to-r from-purple-700 to-pink-600",
    textColor: "text-white",
    ribbonColor: "from-purple-400 to-pink-400",
    defaultVectors: ["waves", "geometric", "chip", "lanyard_slot", "hologram_seal"],
  },
  {
    id: "sunset_amber",
    name: "Sunset Amber & Bronze Glow",
    nameBangla: "সানসেট গোল্ডেন অ্যাম্বার ও ব্রোঞ্জ",
    headerGradient: "from-amber-800 via-orange-950 to-rose-950",
    cardBg: "bg-gradient-to-b from-slate-950 via-amber-950 to-stone-900 text-white",
    accentColor: "text-amber-300",
    borderColor: "border-amber-500/80 shadow-amber-600/20",
    badgeBg: "bg-amber-500/20 text-amber-200 border-amber-500/60",
    badgeText: "text-amber-200",
    chipColor: "from-yellow-300 via-amber-400 to-yellow-500 border-amber-600",
    previewColor: "bg-gradient-to-r from-amber-600 to-orange-600",
    textColor: "text-white",
    ribbonColor: "from-amber-400 to-orange-400",
    defaultVectors: ["geometric", "waves", "chip", "lanyard_slot", "hologram_seal"],
  },
  {
    id: "electric_cobalt",
    name: "Electric Cobalt & Laser Blue",
    nameBangla: "ইলেকট্রিক কোবাল্ট ও লেজার ব্লু",
    headerGradient: "from-blue-700 via-indigo-900 to-sky-700",
    cardBg: "bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 text-white",
    accentColor: "text-sky-300",
    borderColor: "border-blue-400/80 shadow-blue-500/20",
    badgeBg: "bg-blue-500/20 text-sky-200 border-blue-400/60",
    badgeText: "text-sky-200",
    chipColor: "from-sky-300 via-blue-400 to-indigo-500 border-blue-600",
    previewColor: "bg-gradient-to-r from-blue-600 to-sky-400",
    textColor: "text-white",
    ribbonColor: "from-blue-400 to-sky-300",
    defaultVectors: ["circuit", "waves", "chip", "lanyard_slot", "hologram_seal"],
  },
  {
    id: "aurora_teal",
    name: "Nordic Aurora Mint & Cyan",
    nameBangla: "অরোরা মিন্ট ও অ্যাকোয়া গ্লো",
    headerGradient: "from-teal-800 via-cyan-950 to-emerald-950",
    cardBg: "bg-gradient-to-b from-slate-950 via-teal-950 to-cyan-950 text-white",
    accentColor: "text-emerald-300",
    borderColor: "border-emerald-400/80 shadow-emerald-500/20",
    badgeBg: "bg-emerald-500/20 text-emerald-200 border-emerald-400/60",
    badgeText: "text-emerald-200",
    chipColor: "from-emerald-300 via-teal-400 to-cyan-500 border-teal-600",
    previewColor: "bg-gradient-to-r from-teal-500 to-cyan-500",
    textColor: "text-white",
    ribbonColor: "from-teal-400 to-emerald-300",
    defaultVectors: ["waves", "micro_dots", "chip", "lanyard_slot", "hologram_seal"],
  },
  {
    id: "classic_white_gold",
    name: "Prestige Executive White & Gold",
    nameBangla: "এক্সিকিউটিভ মার্বেল হোয়াইট ও গোল্ড",
    headerGradient: "from-slate-900 via-indigo-950 to-slate-900",
    cardBg: "bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900",
    accentColor: "text-amber-600",
    borderColor: "border-amber-500 shadow-amber-500/20",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-400",
    badgeText: "text-amber-900",
    chipColor: "from-amber-400 via-yellow-400 to-amber-600 border-amber-700",
    previewColor: "bg-gradient-to-r from-slate-200 via-white to-amber-400",
    textColor: "text-slate-900",
    ribbonColor: "from-amber-500 to-indigo-600",
    defaultVectors: ["guilloche", "watermark_crest", "chip", "lanyard_slot", "hologram_seal"],
  },
];

export function getTheme(id: string): IdCardTheme {
  return ID_CARD_THEMES.find((t) => t.id === id) || ID_CARD_THEMES[0];
}
