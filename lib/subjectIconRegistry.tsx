import React from "react";
import {
  BookOpen,
  Cpu,
  Server,
  Zap,
  Scissors,
  Laptop,
  Code,
  Terminal,
  Calculator,
  Binary,
  Atom,
  FlaskConical,
  Microscope,
  Languages,
  BookA,
  Globe,
  Compass,
  Landmark,
  Sprout,
  HeartPulse,
  Scale,
  Palette,
  Wrench,
  Cog,
  Radio,
  Flame,
  Camera,
  Shirt,
  Shield,
  GraduationCap,
  Sparkles,
  LucideIcon,
} from "lucide-react";

export interface SubjectTheme {
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconGradient: string;
  glowColor: string;
  categoryLabel: string;
}

/**
 * Centralized registry mapping keywords, trades, and categories to dynamic icons and rich aesthetic color palettes.
 * Guarantees 100% crash-free fallback for any existing or future subject added via database or admin studio.
 */
export function getSubjectVisualTheme(subjectInfo?: {
  title?: string | null;
  titleBangla?: string | null;
  tradeCode?: string | null;
  tradeName?: string | null;
  code?: string | null;
  subjectName?: string | null;
  category?: string | null;
}): SubjectTheme {
  const t = [
    subjectInfo?.title || "",
    subjectInfo?.titleBangla || "",
    subjectInfo?.tradeCode || "",
    subjectInfo?.tradeName || "",
    subjectInfo?.code || "",
    subjectInfo?.subjectName || "",
    subjectInfo?.category || "",
  ]
    .join(" ")
    .toLowerCase();

  // 1. Computer, IT, IoT, Programming & Software
  if (
    t.includes("computer") ||
    t.includes("কম্পিউটার") ||
    t.includes("it") ||
    t.includes("iot") ||
    t.includes("software") ||
    t.includes("programming") ||
    t.includes("প্রোগ্রামিং") ||
    t.includes("তথ্য ও যোগাযোগ") ||
    t.includes("ict") ||
    t.includes("digital") ||
    t.includes("ডিজিটাল")
  ) {
    return {
      icon: Laptop,
      badgeBg: "bg-cyan-100/90 dark:bg-cyan-950/80",
      badgeText: "text-cyan-800 dark:text-cyan-300",
      badgeBorder: "border-cyan-300/70 dark:border-cyan-800/80",
      iconGradient: "from-cyan-500 via-teal-500 to-blue-600",
      glowColor: "rgba(6, 182, 212, 0.4)",
      categoryLabel: "কম্পিউটার ও আইটি",
    };
  }

  // 2. Electrical, Electronics & Power
  if (
    t.includes("electrical") ||
    t.includes("ইলেকট্রিক্যাল") ||
    t.includes("বিদ্যুৎ") ||
    t.includes("electronic") ||
    t.includes("ইলেকট্রনিক্স") ||
    t.includes("circuit") ||
    t.includes("সার্কিট") ||
    t.includes("gew") ||
    t.includes("ee") ||
    t.includes("ce") ||
    t.includes("power")
  ) {
    return {
      icon: Zap,
      badgeBg: "bg-amber-100/90 dark:bg-amber-950/80",
      badgeText: "text-amber-800 dark:text-amber-300",
      badgeBorder: "border-amber-300/70 dark:border-amber-800/80",
      iconGradient: "from-amber-500 via-orange-500 to-yellow-500",
      glowColor: "rgba(245, 158, 11, 0.4)",
      categoryLabel: "ইলেকট্রিক্যাল ও ইলেকট্রনিক্স",
    };
  }

  // 3. Garments, Apparel, Fashion & Textile
  if (
    t.includes("apparel") ||
    t.includes("পোশাক") ||
    t.includes("গার্মেন্টস") ||
    t.includes("textile") ||
    t.includes("amb") ||
    t.includes("sewing") ||
    t.includes("সেলাই") ||
    t.includes("dress") ||
    t.includes("ড্রপ")
  ) {
    return {
      icon: Scissors,
      badgeBg: "bg-rose-100/90 dark:bg-rose-950/80",
      badgeText: "text-rose-800 dark:text-rose-300",
      badgeBorder: "border-rose-300/70 dark:border-rose-800/80",
      iconGradient: "from-rose-500 via-pink-500 to-purple-600",
      glowColor: "rgba(244, 63, 94, 0.4)",
      categoryLabel: "পোশাক ও ফ্যাশন টেকনোলজি",
    };
  }

  // 4. Mechanical, Automobile, RAC & Workshop
  if (
    t.includes("mechanical") ||
    t.includes("মেকানিক্যাল") ||
    t.includes("automobile") ||
    t.includes("অটোমোবাইল") ||
    t.includes("engine") ||
    t.includes("ইঞ্জিন") ||
    t.includes("rac") ||
    t.includes("refrigeration") ||
    t.includes("রেফ্রিজারেশন") ||
    t.includes("workshop") ||
    t.includes("ওয়ার্কশপ") ||
    t.includes("welding") ||
    t.includes("ওয়েল্ডিং")
  ) {
    return {
      icon: Cog,
      badgeBg: "bg-indigo-100/90 dark:bg-indigo-950/80",
      badgeText: "text-indigo-800 dark:text-indigo-300",
      badgeBorder: "border-indigo-300/70 dark:border-indigo-800/80",
      iconGradient: "from-indigo-500 via-blue-600 to-slate-700",
      glowColor: "rgba(99, 102, 241, 0.4)",
      categoryLabel: "মেকানিক্যাল ও অটোমোবাইল",
    };
  }

  // 5. Civil Engineering & Architectural Drafting
  if (
    t.includes("civil") ||
    t.includes("সিভিল") ||
    t.includes("drafting") ||
    t.includes("ড্রাফটিং") ||
    t.includes("construction") ||
    t.includes("নির্মাণ") ||
    t.includes("drawing") ||
    t.includes("ড্রয়িং")
  ) {
    return {
      icon: Landmark,
      badgeBg: "bg-emerald-100/90 dark:bg-emerald-950/80",
      badgeText: "text-emerald-800 dark:text-emerald-300",
      badgeBorder: "border-emerald-300/70 dark:border-emerald-800/80",
      iconGradient: "from-emerald-500 via-teal-600 to-green-700",
      glowColor: "rgba(16, 185, 129, 0.4)",
      categoryLabel: "সিভিল ও আর্কিটেকচার",
    };
  }

  // 6. Mathematics & Calculations
  if (
    t.includes("math") ||
    t.includes("গণিত") ||
    t.includes("হিসাব") ||
    t.includes("algebra") ||
    t.includes("geometry") ||
    t.includes("জ্যামিতি")
  ) {
    return {
      icon: Calculator,
      badgeBg: "bg-violet-100/90 dark:bg-violet-950/80",
      badgeText: "text-violet-800 dark:text-violet-300",
      badgeBorder: "border-violet-300/70 dark:border-violet-800/80",
      iconGradient: "from-violet-500 via-purple-600 to-indigo-700",
      glowColor: "rgba(139, 92, 246, 0.4)",
      categoryLabel: "সাধারণ গণিত",
    };
  }

  // 7. Science, Physics, Chemistry & Biology
  if (
    t.includes("physics") ||
    t.includes("পদার্থ") ||
    t.includes("chemistry") ||
    t.includes("রসায়ন") ||
    t.includes("biology") ||
    t.includes("জীববিজ্ঞান") ||
    t.includes("science") ||
    t.includes("বিজ্ঞান")
  ) {
    return {
      icon: Atom,
      badgeBg: "bg-blue-100/90 dark:bg-blue-950/80",
      badgeText: "text-blue-800 dark:text-blue-300",
      badgeBorder: "border-blue-300/70 dark:border-blue-800/80",
      iconGradient: "from-blue-500 via-cyan-500 to-teal-500",
      glowColor: "rgba(59, 130, 246, 0.4)",
      categoryLabel: "বিজ্ঞান ও প্রযুক্তি",
    };
  }

  // 8. Bengali, Literature & Language
  if (
    t.includes("bangla") ||
    t.includes("বাংলা") ||
    t.includes("সাহিত্য") ||
    t.includes("ভাষা") ||
    t.includes("bengali")
  ) {
    return {
      icon: BookA,
      badgeBg: "bg-emerald-100/90 dark:bg-emerald-950/80",
      badgeText: "text-emerald-800 dark:text-emerald-300",
      badgeBorder: "border-emerald-300/70 dark:border-emerald-800/80",
      iconGradient: "from-emerald-600 via-green-600 to-teal-700",
      glowColor: "rgba(5, 150, 105, 0.4)",
      categoryLabel: "বাংলা ভাষা ও সাহিত্য",
    };
  }

  // 9. English & Foreign Languages
  if (
    t.includes("english") ||
    t.includes("ইংরেজি") ||
    t.includes("grammar") ||
    t.includes("language")
  ) {
    return {
      icon: Globe,
      badgeBg: "bg-sky-100/90 dark:bg-sky-950/80",
      badgeText: "text-sky-800 dark:text-sky-300",
      badgeBorder: "border-sky-300/70 dark:border-sky-800/80",
      iconGradient: "from-sky-500 via-blue-600 to-indigo-600",
      glowColor: "rgba(14, 165, 233, 0.4)",
      categoryLabel: "ইংরেজি ভাষা ও দক্ষতা",
    };
  }

  // 10. Social Science, History, Bangladesh Studies & Geography
  if (
    t.includes("social") ||
    t.includes("সামাজিক") ||
    t.includes("ইতিহাস") ||
    t.includes("ভূগোল") ||
    t.includes("বাংলাদেশ") ||
    t.includes("ইতিহাস ও সামাজিক বিজ্ঞান")
  ) {
    return {
      icon: Compass,
      badgeBg: "bg-amber-100/90 dark:bg-amber-950/80",
      badgeText: "text-amber-800 dark:text-amber-300",
      badgeBorder: "border-amber-300/70 dark:border-amber-800/80",
      iconGradient: "from-amber-600 via-orange-600 to-yellow-600",
      glowColor: "rgba(217, 119, 6, 0.4)",
      categoryLabel: "সামাজিক বিজ্ঞান ও ইতিহাস",
    };
  }

  // 11. Agriculture & Food Technology
  if (
    t.includes("agriculture") ||
    t.includes("কৃষি") ||
    t.includes("খামার") ||
    t.includes("food") ||
    t.includes("খাদ্য")
  ) {
    return {
      icon: Sprout,
      badgeBg: "bg-lime-100/90 dark:bg-lime-950/80",
      badgeText: "text-lime-800 dark:text-lime-300",
      badgeBorder: "border-lime-300/70 dark:border-lime-800/80",
      iconGradient: "from-lime-500 via-green-600 to-emerald-700",
      glowColor: "rgba(132, 204, 22, 0.4)",
      categoryLabel: "কৃষি ও খাদ্য প্রযুক্তি",
    };
  }

  // 12. Religion & Moral Education
  if (
    t.includes("religion") ||
    t.includes("ধর্ম") ||
    t.includes("নৈতিক") ||
    t.includes("ইসলাম") ||
    t.includes("হিন্দু") ||
    t.includes("ethics")
  ) {
    return {
      icon: Scale,
      badgeBg: "bg-teal-100/90 dark:bg-teal-950/80",
      badgeText: "text-teal-800 dark:text-teal-300",
      badgeBorder: "border-teal-300/70 dark:border-teal-800/80",
      iconGradient: "from-teal-600 via-emerald-600 to-cyan-700",
      glowColor: "rgba(20, 184, 166, 0.4)",
      categoryLabel: "ধর্ম ও নৈতিক শিক্ষা",
    };
  }

  // 13. Default Safe Fallback (Guaranteed Crash-Free)
  return {
    icon: BookOpen,
    badgeBg: "bg-cyan-100/90 dark:bg-cyan-950/80",
    badgeText: "text-cyan-800 dark:text-cyan-300",
    badgeBorder: "border-cyan-300/70 dark:border-cyan-800/80",
    iconGradient: "from-cyan-500 via-indigo-500 to-purple-600",
    glowColor: "rgba(6, 182, 212, 0.35)",
    categoryLabel: "সাধারণ পাঠ্যক্রম",
  };
}

/**
 * Quick helper that returns just the Lucide Icon component.
 */
export function getSubjectIcon(tradeCode?: string | null, code?: string | null, title?: string | null): LucideIcon {
  const theme = getSubjectVisualTheme({
    tradeCode,
    code,
    title,
    titleBangla: title,
  });
  return theme.icon;
}
