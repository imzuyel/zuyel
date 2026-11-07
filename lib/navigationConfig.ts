import React from "react";
import {
  GraduationCap,
  LayoutDashboard,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  Bot,
  FileText,
  Radio,
  Users,
  Award,
  CalendarCheck,
  Printer,
  Sliders,
  ShieldCheck,
  CreditCard,
  Layers,
  Edit3,
  User,
  Cpu,
  MessageSquare,
  Wrench,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Presentation,
  PlaySquare,
  RefreshCw,
  SlidersHorizontal,
  Database,
  Flame,
  CheckCircle2,
  Tv,
} from "lucide-react";
import { isSupremeAdmin, isAdministrator, isTeacher, isStudent, normalizeRole, Role } from "@/lib/rbac";

export type AllowedRole = "admin" | "teacher" | "student" | "all";

export interface NavItemConfig {
  id?: string;
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  roles?: AllowedRole[];
  keywords?: string[];
  theme?: {
    iconText?: string;
    iconBg?: string;
    activeBg?: string;
    activeBorder?: string;
    activeText?: string;
    indicatorColor?: string;
    glowShadow?: string;
  };
}

export interface NavGroupConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
  roles?: AllowedRole[];
  items: NavItemConfig[];
}

// ─────────────────────────────────────────────────────────────────────────────
// STRICT ROLE-BASED ACCESS CONTROL (RBAC) FILTER
// ─────────────────────────────────────────────────────────────────────────────

export function canAccessNavItem(
  itemRoles: AllowedRole[] | undefined,
  userRoleRaw?: string | null
): boolean {
  if (!itemRoles || itemRoles.length === 0 || itemRoles.includes("all")) {
    return true;
  }

  const role = normalizeRole(userRoleRaw);

  if (isSupremeAdmin(role) || isAdministrator(role)) {
    return true;
  }

  if (isTeacher(role)) {
    return itemRoles.includes("teacher") || itemRoles.includes("all");
  }

  if (isStudent(role)) {
    return itemRoles.includes("student") || itemRoles.includes("all");
  }

  return itemRoles.includes("all");
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART ACTIVE STATE MATCHER FOR NESTED APPS
// ─────────────────────────────────────────────────────────────────────────────

export function isRouteActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname || !href) return false;

  if (href === "/") {
    return pathname === "/";
  }

  if (pathname === href) {
    return true;
  }

  const [cleanHref] = href.split("?");

  if (!cleanHref || cleanHref === "/") {
    return pathname === "/";
  }

  if (pathname.startsWith(cleanHref)) {
    const nextChar = pathname.charAt(cleanHref.length);
    return nextChar === "" || nextChar === "/";
  }

  if (
    (cleanHref === "/live-quizzes" || cleanHref === "/quiz") &&
    (pathname.startsWith("/quiz") || pathname.startsWith("/live-quiz") || pathname.startsWith("/live-quizzes"))
  ) {
    return true;
  }

  if (cleanHref === "/learning" && (pathname.startsWith("/learning-library") || pathname.startsWith("/learning"))) {
    return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL NAVIGATION CONFIGURATION MATRIX (PHASE 1 CANONICAL ORDER)
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMARY_NAVIGATION_GROUPS: NavGroupConfig[] = [
  // 1. ড্যাশবোর্ড (Live Command Center)
  {
    id: "group_dashboard",
    title: "১. ড্যাশবোর্ড",
    subtitle: "Command Center",
    icon: LayoutDashboard,
    isCollapsible: false,
    defaultOpen: true,
    roles: ["all"],
    items: [
      {
        href: "/admin",
        label: "লাইভ কমান্ড সেন্টার ওভারভিউ",
        icon: LayoutDashboard,
        badge: "Live",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        roles: ["all"],
        keywords: ["dashboard", "overview", "ড্যাশবোর্ড", "কমান্ড সেন্টার"],
        theme: {
          iconText: "text-emerald-400",
          iconBg: "bg-emerald-500/15 border-emerald-500/30",
          activeBg: "bg-emerald-950/80 text-white border-emerald-500/40 shadow-emerald-950/50",
          activeBorder: "border-emerald-400/40",
          activeText: "text-emerald-200",
          indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        },
      },
      {
        href: "/",
        label: "পাবলিক পোর্টাল ল্যান্ডিং",
        icon: Sparkles,
        badge: "Portal",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        roles: ["all"],
        keywords: ["home", "landing", "portal", "পাবলিক"],
        theme: {
          iconText: "text-cyan-400",
          iconBg: "bg-cyan-500/15 border-cyan-500/30",
          activeBg: "bg-cyan-950/80 text-white border-cyan-500/40 shadow-cyan-950/50",
          activeBorder: "border-cyan-400/40",
          activeText: "text-cyan-200",
          indicatorColor: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
        },
      },
    ],
  },

  // 2. অধ্যায়ভিত্তিক লার্নিং (Chapter-wise Learning)
  {
    id: "group_learning",
    title: "২. অধ্যায়ভিত্তিক লার্নিং",
    subtitle: "Course & Chapter Hub",
    icon: BookOpen,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["all"],
    items: [
      {
        href: "/learning",
        label: "কোর্স ও অধ্যায়ভিত্তিক পাঠ্যসূচি",
        icon: BookOpen,
        badge: "Courses",
        badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        roles: ["all"],
        keywords: ["learning", "courses", "chapters", "অধ্যায়", "কোর্স"],
        theme: {
          iconText: "text-blue-400",
          iconBg: "bg-blue-500/15 border-blue-500/30",
          activeBg: "bg-blue-950/80 text-white border-blue-500/40 shadow-blue-950/50",
          activeBorder: "border-blue-400/40",
          activeText: "text-blue-200",
          indicatorColor: "bg-blue-400 shadow-[0_0_8px_#60a5fa]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]",
        },
      },
      {
        href: "/learning-library",
        label: "ইন্টারেক্টিভ লেসন ও লাইব্রেরি",
        icon: Layers,
        badge: "Lessons",
        badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        roles: ["all"],
        keywords: ["lessons", "library", "কনটেন্ট", "লেসন"],
        theme: {
          iconText: "text-indigo-400",
          iconBg: "bg-indigo-500/15 border-indigo-500/30",
          activeBg: "bg-indigo-950/80 text-white border-indigo-500/40 shadow-indigo-950/50",
          activeBorder: "border-indigo-400/40",
          activeText: "text-indigo-200",
          indicatorColor: "bg-indigo-400 shadow-[0_0_8px_#818cf8]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]",
        },
      },
      {
        href: "/ai/blog-builder",
        label: "AI টেকনিক্যাল লেসন বিল্ডার",
        icon: Bot,
        badge: "AI Builder",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        roles: ["admin", "teacher"],
        keywords: ["ai", "blog", "lesson builder", "লেসন তৈরি"],
        theme: {
          iconText: "text-purple-400",
          iconBg: "bg-purple-500/15 border-purple-500/30",
          activeBg: "bg-purple-950/80 text-white border-purple-500/40 shadow-purple-950/50",
          activeBorder: "border-purple-400/40",
          activeText: "text-purple-200",
          indicatorColor: "bg-purple-400 shadow-[0_0_8px_#c084fc]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]",
        },
      },
    ],
  },

  // 3. শিক্ষার্থীর ডাটা রেজোলিউশন (Student Data Resolution)
  {
    id: "group_students",
    title: "৩. শিক্ষার্থীর ডাটা রেজোলিউশন",
    subtitle: "Directory & Resolution",
    icon: Users,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["admin", "teacher"],
    items: [
      {
        href: "/students",
        label: "৩৬০° শিক্ষার্থী ডিরেক্টরি",
        icon: Users,
        badge: "800+ Live",
        badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
        roles: ["admin", "teacher"],
        keywords: ["students", "directory", "শিক্ষার্থী", "তালিকা"],
        theme: {
          iconText: "text-teal-400",
          iconBg: "bg-teal-500/15 border-teal-500/30",
          activeBg: "bg-teal-950/80 text-white border-teal-500/40 shadow-teal-950/50",
          activeBorder: "border-teal-400/40",
          activeText: "text-teal-200",
          indicatorColor: "bg-teal-400 shadow-[0_0_8px_#2dd4bf]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(20,184,166,0.4)]",
        },
      },
      {
        href: "/students/resolution",
        label: "রোল ও ডাটা রেজোলিউশন হাব",
        icon: Wrench,
        badge: "Resolver",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        roles: ["admin", "teacher"],
        keywords: ["resolution", "roll resolver", "ডাটা রেজোলিউশন"],
        theme: {
          iconText: "text-cyan-400",
          iconBg: "bg-cyan-500/15 border-cyan-500/30",
          activeBg: "bg-cyan-950/80 text-white border-cyan-500/40 shadow-cyan-950/50",
          activeBorder: "border-cyan-400/40",
          activeText: "text-cyan-200",
          indicatorColor: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
        },
      },
      {
        href: "/students/bulk",
        label: "বাল্ক শিক্ষার্থী আপলোড ও সিঙ্ক",
        icon: FileSpreadsheet,
        badge: "Excel/CSV",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        roles: ["admin"],
        keywords: ["bulk upload", "excel", "csv", "আপলোড"],
        theme: {
          iconText: "text-emerald-400",
          iconBg: "bg-emerald-500/15 border-emerald-500/30",
          activeBg: "bg-emerald-950/80 text-white border-emerald-500/40 shadow-emerald-950/50",
          activeBorder: "border-emerald-400/40",
          activeText: "text-emerald-200",
          indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        },
      },
      {
        href: "/students/id-cards",
        label: "ডিজিটাল আইডি কার্ড প্রিন্ট হাব",
        icon: Printer,
        badge: "ID Print",
        badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        roles: ["admin", "teacher"],
        keywords: ["id cards", "print", "আইডি কার্ড"],
        theme: {
          iconText: "text-blue-400",
          iconBg: "bg-blue-500/15 border-blue-500/30",
          activeBg: "bg-blue-950/80 text-white border-blue-500/40 shadow-blue-950/50",
          activeBorder: "border-blue-400/40",
          activeText: "text-blue-200",
          indicatorColor: "bg-blue-400 shadow-[0_0_8px_#60a5fa]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]",
        },
      },
    ],
  },

  // 4. শিক্ষক এনালিটিক্স ট্র্যাকিং (Teacher Analytics Tracking)
  {
    id: "group_analytics",
    title: "৪. শিক্ষক এনালিটিক্স ট্র্যাকিং",
    subtitle: "Insights & At-Risk Hub",
    icon: BarChart3,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["admin", "teacher"],
    items: [
      {
        href: "/results",
        label: "এনালিটিক্স ও ফলাফল মূল্যায়ন",
        icon: BarChart3,
        badge: "Insights",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        roles: ["admin", "teacher"],
        keywords: ["analytics", "results", "ফলাফল", "এনালিটিক্স"],
        theme: {
          iconText: "text-amber-400",
          iconBg: "bg-amber-500/15 border-amber-500/30",
          activeBg: "bg-amber-950/80 text-white border-amber-500/40 shadow-amber-950/50",
          activeBorder: "border-amber-400/40",
          activeText: "text-amber-200",
          indicatorColor: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        },
      },
      {
        href: "/results/analytics",
        label: "দুর্বল টপিক হিটম্যাপ ও এনালাইসিস",
        icon: TrendingUp,
        badge: "Heatmap",
        badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        roles: ["admin", "teacher"],
        keywords: ["weak topics", "heatmap", "দুর্বল টপিক"],
        theme: {
          iconText: "text-rose-400",
          iconBg: "bg-rose-500/15 border-rose-500/30",
          activeBg: "bg-rose-950/80 text-white border-rose-500/40 shadow-rose-950/50",
          activeBorder: "border-rose-400/40",
          activeText: "text-rose-200",
          indicatorColor: "bg-rose-400 shadow-[0_0_8px_#f43f5e]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]",
        },
      },
      {
        href: "/results/at-risk",
        label: "এট-রিস্ক শিক্ষার্থী শনাক্তকরণ",
        icon: AlertTriangle,
        badge: "At-Risk",
        badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        roles: ["admin", "teacher"],
        keywords: ["at risk", "dropout prevention", "ঝুঁকিপূর্ণ শিক্ষার্থী"],
        theme: {
          iconText: "text-orange-400",
          iconBg: "bg-orange-500/15 border-orange-500/30",
          activeBg: "bg-orange-950/80 text-white border-orange-500/40 shadow-orange-950/50",
          activeBorder: "border-orange-400/40",
          activeText: "text-orange-200",
          indicatorColor: "bg-orange-400 shadow-[0_0_8px_#fb923c]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]",
        },
      },
    ],
  },

  // 5. প্রেজেন্টেশন গ্যালারি (Presentation Gallery)
  {
    id: "group_presentations",
    title: "৫. প্রেজেন্টেশন গ্যালারি",
    subtitle: "Slide Decks & Presenter",
    icon: Presentation,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["all"],
    items: [
      {
        href: "/presentations",
        label: "AI স্লাইড ডেক গ্যালারি",
        icon: Presentation,
        badge: "Decks",
        badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
        roles: ["all"],
        keywords: ["presentations", "slides", "স্লাইড", "প্রেজেন্টেশন"],
        theme: {
          iconText: "text-fuchsia-400",
          iconBg: "bg-fuchsia-500/15 border-fuchsia-500/30",
          activeBg: "bg-fuchsia-950/80 text-white border-fuchsia-500/40 shadow-fuchsia-950/50",
          activeBorder: "border-fuchsia-400/40",
          activeText: "text-fuchsia-200",
          indicatorColor: "bg-fuchsia-400 shadow-[0_0_8px_#e879f9]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(217,70,239,0.4)]",
        },
      },
      {
        href: "/presentations/presenter",
        label: "ক্লাসরুম লাইভ প্রেজেন্টার স্টেজ",
        icon: Tv,
        badge: "Host",
        badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        roles: ["admin", "teacher"],
        keywords: ["presenter", "fullscreen", "ক্লাসরুম স্টেজ"],
        theme: {
          iconText: "text-indigo-400",
          iconBg: "bg-indigo-500/15 border-indigo-500/30",
          activeBg: "bg-indigo-950/80 text-white border-indigo-500/40 shadow-indigo-950/50",
          activeBorder: "border-indigo-400/40",
          activeText: "text-indigo-200",
          indicatorColor: "bg-indigo-400 shadow-[0_0_8px_#818cf8]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]",
        },
      },
      {
        href: "/presentations/converter",
        label: "স্লাইড-টু-লেসন কনভার্টার",
        icon: PlaySquare,
        badge: "Convert",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        roles: ["admin", "teacher"],
        keywords: ["convert", "converter", "লেসন কনভার্টার"],
        theme: {
          iconText: "text-cyan-400",
          iconBg: "bg-cyan-500/15 border-cyan-500/30",
          activeBg: "bg-cyan-950/80 text-white border-cyan-500/40 shadow-cyan-950/50",
          activeBorder: "border-cyan-400/40",
          activeText: "text-cyan-200",
          indicatorColor: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
        },
      },
    ],
  },

  // 6. লাইভ কুইজ স্টুডিও (Live Quiz Studio & Arena)
  {
    id: "group_quiz",
    title: "৬. লাইভ কুইজ স্টুডিও",
    subtitle: "Mentimeter & Arena",
    icon: Flame,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["all"],
    items: [
      {
        href: "/quiz",
        label: "মেনটিমিটার কুইজ স্টুডিও",
        icon: Flame,
        badge: "Mentimeter",
        badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        roles: ["all"],
        keywords: ["quiz", "mentimeter", "কুইজ স্টুডিও"],
        theme: {
          iconText: "text-rose-400",
          iconBg: "bg-rose-500/15 border-rose-500/30",
          activeBg: "bg-rose-950/80 text-white border-rose-500/40 shadow-rose-950/50",
          activeBorder: "border-rose-400/40",
          activeText: "text-rose-200",
          indicatorColor: "bg-rose-400 shadow-[0_0_8px_#f43f5e]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]",
        },
      },
      {
        href: "/live-quizzes",
        label: "সক্রিয় কুইজ রুম ও হোস্ট স্টেজ",
        icon: Radio,
        badge: "60p Live",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        roles: ["admin", "teacher"],
        keywords: ["live room", "host stage", "লাইভ এরিনা"],
        theme: {
          iconText: "text-emerald-400",
          iconBg: "bg-emerald-500/15 border-emerald-500/30",
          activeBg: "bg-emerald-950/80 text-white border-emerald-500/40 shadow-emerald-950/50",
          activeBorder: "border-emerald-400/40",
          activeText: "text-emerald-200",
          indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        },
      },
      {
        href: "/quiz/join",
        label: "শিক্ষার্থী জয়েনিং পোর্টাল",
        icon: Sparkles,
        badge: "Join PIN",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        roles: ["all"],
        keywords: ["join", "pin", "জয়েন"],
        theme: {
          iconText: "text-amber-400",
          iconBg: "bg-amber-500/15 border-amber-500/30",
          activeBg: "bg-amber-950/80 text-white border-amber-500/40 shadow-amber-950/50",
          activeBorder: "border-amber-400/40",
          activeText: "text-amber-200",
          indicatorColor: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        },
      },
      {
        href: "/ai/generator",
        label: "AI প্রশ্নপত্র জেনারেটর",
        icon: Bot,
        badge: "AI Gen",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        roles: ["admin", "teacher"],
        keywords: ["ai generator", "প্রশ্নপত্র", "জেনারেটর"],
        theme: {
          iconText: "text-purple-400",
          iconBg: "bg-purple-500/15 border-purple-500/30",
          activeBg: "bg-purple-950/80 text-white border-purple-500/40 shadow-purple-950/50",
          activeBorder: "border-purple-400/40",
          activeText: "text-purple-200",
          indicatorColor: "bg-purple-400 shadow-[0_0_8px_#c084fc]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]",
        },
      },
      {
        href: "/ai/pdf-manager",
        label: "PDF টু কুইজ কনভার্টার",
        icon: FileText,
        badge: "OCR PDF",
        badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        roles: ["admin", "teacher"],
        keywords: ["pdf", "ocr", "কনভার্টার"],
        theme: {
          iconText: "text-indigo-400",
          iconBg: "bg-indigo-500/15 border-indigo-500/30",
          activeBg: "bg-indigo-950/80 text-white border-indigo-500/40 shadow-indigo-950/50",
          activeBorder: "border-indigo-400/40",
          activeText: "text-indigo-200",
          indicatorColor: "bg-indigo-400 shadow-[0_0_8px_#818cf8]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]",
        },
      },
    ],
  },

  // 7. একাডেমিক ও রুটিন ব্যবস্থাপনা (Academic, Routine, Attendance & SMS)
  {
    id: "group_academic",
    title: "৭. একাডেমিক ও রুটিন ব্যবস্থাপনা",
    subtitle: "Routines, Attendance & SMS",
    icon: CalendarCheck,
    isCollapsible: true,
    defaultOpen: false,
    roles: ["admin", "teacher"],
    items: [
      {
        href: "/academic",
        label: "একাডেমিক কাঠামো ও সেশন সেটিংস",
        icon: Layers,
        badge: "Classes",
        badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        roles: ["admin"],
        keywords: ["academic", "classes", "trades", "একাডেমিক"],
        theme: {
          iconText: "text-indigo-400",
          iconBg: "bg-indigo-500/15 border-indigo-500/30",
          activeBg: "bg-indigo-950/80 text-white border-indigo-500/40 shadow-indigo-950/50",
          activeBorder: "border-indigo-400/40",
          activeText: "text-indigo-200",
          indicatorColor: "bg-indigo-400 shadow-[0_0_8px_#818cf8]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]",
        },
      },
      {
        href: "/routine/master",
        label: "মাস্টার ক্লাস রুটিন",
        icon: Calendar,
        badge: "Master",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        roles: ["admin", "teacher"],
        keywords: ["routine", "schedule", "রুটিন"],
        theme: {
          iconText: "text-cyan-400",
          iconBg: "bg-cyan-500/15 border-cyan-500/30",
          activeBg: "bg-cyan-950/80 text-white border-cyan-500/40 shadow-cyan-950/50",
          activeBorder: "border-cyan-400/40",
          activeText: "text-cyan-200",
          indicatorColor: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
        },
      },
      {
        href: "/attendance",
        label: "দৈনিক ডিজিটাল হাজিরা",
        icon: CalendarCheck,
        badge: "Live 91%",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        roles: ["admin", "teacher"],
        keywords: ["attendance", "হাজিরা", "ডিজিটাল হাজিরা"],
        theme: {
          iconText: "text-emerald-400",
          iconBg: "bg-emerald-500/15 border-emerald-500/30",
          activeBg: "bg-emerald-950/80 text-white border-emerald-500/40 shadow-emerald-950/50",
          activeBorder: "border-emerald-400/40",
          activeText: "text-emerald-200",
          indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        },
      },
      {
        href: "/communication/sms",
        label: "অভিভাবক অটো-SMS ও নোটিফিকেশন",
        icon: MessageSquare,
        badge: "Auto SMS",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        roles: ["admin", "teacher"],
        keywords: ["sms", "messages", "মেসেজ", "নোটিফিকেশন"],
        theme: {
          iconText: "text-amber-400",
          iconBg: "bg-amber-500/15 border-amber-500/30",
          activeBg: "bg-amber-950/80 text-white border-amber-500/40 shadow-amber-950/50",
          activeBorder: "border-amber-400/40",
          activeText: "text-amber-200",
          indicatorColor: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        },
      },
    ],
  },

  // 8. ডাটাবেজ ও সিস্টেম সেটিংস (Database & System Settings)
  {
    id: "group_settings",
    title: "৮. ডাটাবেজ ও সিস্টেম সেটিংস",
    subtitle: "Storage, AI & System",
    icon: Database,
    isCollapsible: true,
    defaultOpen: false,
    roles: ["admin"],
    items: [
      {
        href: "/admin?tab=database",
        label: "MySQL ডাটাবেজ স্ট্যাটাস ও সিঙ্ক",
        icon: Database,
        badge: "Dual-Mode",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        roles: ["admin"],
        keywords: ["database", "mysql", "workbench", "ডাটাবেজ"],
        theme: {
          iconText: "text-emerald-400",
          iconBg: "bg-emerald-500/15 border-emerald-500/30",
          activeBg: "bg-emerald-950/80 text-white border-emerald-500/40 shadow-emerald-950/50",
          activeBorder: "border-emerald-400/40",
          activeText: "text-emerald-200",
          indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        },
      },
      {
        href: "/ai-settings",
        label: "AI মডেল সেটিংস ও প্রম্পট টিউনিং",
        icon: SlidersHorizontal,
        badge: "Gemini AI",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        roles: ["admin"],
        keywords: ["ai settings", "gemini", "প্রম্পট", "সেটিংস"],
        theme: {
          iconText: "text-purple-400",
          iconBg: "bg-purple-500/15 border-purple-500/30",
          activeBg: "bg-purple-950/80 text-white border-purple-500/40 shadow-purple-950/50",
          activeBorder: "border-purple-400/40",
          activeText: "text-purple-200",
          indicatorColor: "bg-purple-400 shadow-[0_0_8px_#c084fc]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]",
        },
      },
      {
        href: "/admin?tab=audit_logs",
        label: "সিকিউরিটি অডিট ও সিস্টেম লগ",
        icon: ShieldCheck,
        badge: "Security",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        roles: ["admin"],
        keywords: ["audit", "logs", "security", "লগ"],
        theme: {
          iconText: "text-cyan-400",
          iconBg: "bg-cyan-500/15 border-cyan-500/30",
          activeBg: "bg-cyan-950/80 text-white border-cyan-500/40 shadow-cyan-950/50",
          activeBorder: "border-cyan-400/40",
          activeText: "text-cyan-200",
          indicatorColor: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
        },
      },
    ],
  },
];
