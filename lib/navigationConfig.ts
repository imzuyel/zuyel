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
  roles?: AllowedRole[]; // If omitted or contains "all", accessible to all authenticated personas
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

/**
 * Validates whether a specific navigation item is authorized for the user's role.
 * Unauthorized items MUST NOT render in the DOM at all.
 */
export function canAccessNavItem(
  itemRoles: AllowedRole[] | undefined,
  userRoleRaw?: string | null
): boolean {
  if (!itemRoles || itemRoles.length === 0 || itemRoles.includes("all")) {
    return true;
  }

  const role = normalizeRole(userRoleRaw);

  // Supreme Administrators and System Administrators have full administrative visibility
  if (isSupremeAdmin(role) || isAdministrator(role)) {
    return true;
  }

  // Teacher role clearance
  if (isTeacher(role)) {
    return itemRoles.includes("teacher") || itemRoles.includes("all");
  }

  // Student role clearance (Strict Zero-Trust: students can NEVER view teacher or admin routes)
  if (isStudent(role)) {
    return itemRoles.includes("student") || itemRoles.includes("all");
  }

  // Fallback for public / unverified roles
  return itemRoles.includes("all");
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART ACTIVE STATE MATCHER FOR NESTED APPS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Robust nested route active state checker.
 * Ensures parent menus remain highlighted when navigating to nested child routes,
 * while accurately handling edge cases like root '/' and query strings.
 */
export function isRouteActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname || !href) return false;

  // Exact root edge case: "/" should ONLY match exactly "/"
  if (href === "/") {
    return pathname === "/";
  }

  // Handle exact match
  if (pathname === href) {
    return true;
  }

  // Clean path of query parameters or hashes
  const [cleanHref] = href.split("?");

  if (!cleanHref || cleanHref === "/") {
    return pathname === "/";
  }

  // Match nested child routes with strict path segment boundary checking
  // E.g. href = "/students" matches "/students" and "/students/id-cards",
  // but will NOT falsely match "/studentship" or other unrelated routes.
  if (pathname.startsWith(cleanHref)) {
    const nextChar = pathname.charAt(cleanHref.length);
    return nextChar === "" || nextChar === "/";
  }

  // Special alias handling for Quiz Ecosystem and Hub routes
  if (
    (cleanHref === "/live-quizzes" || cleanHref === "/quiz") &&
    (pathname.startsWith("/quiz") || pathname.startsWith("/live-quiz") || pathname.startsWith("/live-quizzes"))
  ) {
    return true;
  }
  if (cleanHref === "/dashboard/documents" && pathname.startsWith("/ai/pdf-manager")) {
    return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL NAVIGATION CONFIGURATION MATRIX
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMARY_NAVIGATION_GROUPS: NavGroupConfig[] = [
  {
    id: "academic_core",
    title: "১. কোর সেটআপ ও একাডেমিক ম্যাপিং",
    subtitle: "Core Setup & Mapping",
    icon: Layers,
    isCollapsible: true,
    roles: ["admin", "teacher"],
    items: [
      {
        href: "/admin",
        label: "মূল ড্যাশবোর্ড ওভারভিউ",
        icon: LayoutDashboard,
        badge: "লাইভ",
        badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        roles: ["all"],
        keywords: ["dashboard", "overview", "ড্যাশবোর্ড", "হোম"],
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
        href: "/academic/mapping",
        label: "একাডেমিক ম্যাপিং ও সেশন",
        icon: Layers,
        badge: "Central",
        badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
        roles: ["admin"],
        keywords: ["academic", "mapping", "ম্যাপিং", "শ্রেণি", "ট্রেড", "শাখা", "সেশন"],
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
        href: "/routine/master",
        label: "একাডেমিক সেশন ও রুটিন মাস্টার",
        icon: Calendar,
        badge: "Master",
        badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        roles: ["admin", "teacher"],
        keywords: ["routine", "session", "master", "schedule", "সেশন", "রুটিন"],
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
        href: "/admin?tab=lab_inventory",
        label: "কারিগরি ল্যাব ও ওয়ার্কশপ",
        icon: Cpu,
        badge: "Labs",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        roles: ["admin", "teacher"],
        keywords: ["lab", "workshop", "equipment", "inventory", "ল্যাব"],
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
  {
    id: "ai_hub",
    title: "২. AI কুইজ ও কন্টেন্ট স্টুডিও",
    subtitle: "AI Studio Hub",
    icon: Sparkles,
    isCollapsible: true,
    roles: ["all"],
    items: [
      {
        href: "/ai/generator",
        label: "AI প্রশ্নপত্র জেনারেটর",
        icon: Bot,
        badge: "AI Studio",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        roles: ["admin", "teacher"],
        keywords: ["ai", "question", "generator", "প্রশ্নপত্র"],
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
        href: "/dashboard/documents",
        label: "PDF কারিকুলাম রিপোজিটরি",
        icon: FileText,
        roles: ["admin", "teacher"],
        keywords: ["pdf", "curriculum", "documents", "নথি"],
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
        href: "/live-quizzes",
        label: "🎮 লাইভ কুইজ ও মেন্টিমিটার স্টুডিও",
        icon: Radio,
        badge: "Unified Hub",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        roles: ["all"],
        keywords: ["quiz", "live", "arena", "mentimeter", "kahoot", "studio", "কুইজ", "মেন্টিমিটার"],
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
        href: "/learning",
        label: "📚 অধ্যায়ভিত্তিক কন্টেন্ট ও ক্লাস স্টুডিও",
        icon: BookOpen,
        badge: "স্টুডিও",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        roles: ["all"],
        keywords: ["course", "chapter", "learning", "studio", "অধ্যায়ভিত্তিক", "কন্টেন্ট"],
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
  {
    id: "academics",
    title: "৩. ক্লাস, রুটিন ও হাজিরা",
    subtitle: "Operations",
    icon: Calendar,
    isCollapsible: true,
    roles: ["admin", "teacher"],
    items: [
      {
        href: "/routine/master",
        label: "মাস্টার রুটিন স্টুডিও",
        icon: Calendar,
        roles: ["admin", "teacher"],
        keywords: ["routine", "master", "schedule", "রুটিন"],
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
        href: "/attendance",
        label: "হাজিরা খাতা ও BTEB রেজিস্টার",
        icon: CalendarCheck,
        roles: ["admin", "teacher"],
        keywords: ["attendance", "register", "হাজিরা"],
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
    ],
  },
  {
    id: "students_exams",
    title: "৪. শিক্ষার্থী ও পরীক্ষা প্রশাসন",
    subtitle: "Students & Results",
    icon: Users,
    isCollapsible: true,
    roles: ["all"],
    items: [
      {
        href: "/student/profile",
        label: "শিক্ষার্থী প্রোফাইল সেলফ-সার্ভিস",
        icon: User,
        badge: "Student",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        roles: ["student", "all"],
        keywords: ["student", "profile", "self-service", "শিক্ষার্থী", "প্রোফাইল"],
        theme: {
          iconText: "text-emerald-400",
          iconBg: "bg-emerald-500/15 border-emerald-500/30",
          activeBg: "bg-emerald-950/80 text-white border-emerald-500/40 shadow-emerald-950/50",
          activeBorder: "border-emerald-400/40",
          activeText: "text-emerald-200",
          indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(52,211,153,0.4)]",
        },
      },
      {
        href: "/students",
        label: "শিক্ষার্থী ডাটাবেজ ও ভর্তি",
        icon: Users,
        roles: ["admin"],
        keywords: ["students", "admission", "শিক্ষার্থী"],
        theme: {
          iconText: "text-sky-400",
          iconBg: "bg-sky-500/15 border-sky-500/30",
          activeBg: "bg-sky-950/80 text-white border-sky-500/40 shadow-sky-950/50",
          activeBorder: "border-sky-400/40",
          activeText: "text-sky-200",
          indicatorColor: "bg-sky-400 shadow-[0_0_8px_#38bdf8]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(14,165,233,0.4)]",
        },
      },
      {
        href: "/accounts",
        label: "ফি কালেকশন ও রিসিট",
        icon: CreditCard,
        roles: ["admin"],
        keywords: ["fee", "accounts", "collection", "receipt", "ফি"],
        theme: {
          iconText: "text-emerald-400",
          iconBg: "bg-emerald-500/15 border-emerald-500/30",
          activeBg: "bg-emerald-950/80 text-white border-emerald-500/40 shadow-emerald-950/50",
          activeBorder: "border-emerald-400/40",
          activeText: "text-emerald-200",
          indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(52,211,153,0.4)]",
        },
      },
      {
        href: "/students/id-cards",
        label: "ডিজিটাল আইডি কার্ড স্টুডিও",
        icon: CreditCard,
        roles: ["all"],
        keywords: ["id card", "identity", "আইডি কার্ড"],
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
        href: "/examination",
        label: "পরীক্ষা সূচি ও ফলাফল হাব",
        icon: Award,
        roles: ["all"],
        keywords: ["examination", "results", "marks", "পরীক্ষা"],
        theme: {
          iconText: "text-amber-400",
          iconBg: "bg-amber-500/15 border-amber-500/30",
          activeBg: "bg-amber-950/80 text-white border-amber-500/40 shadow-amber-950/50",
          activeBorder: "border-amber-400/40",
          activeText: "text-amber-200",
          indicatorColor: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        },
      },
      {
        href: "/academic/bteb-annual-ledger",
        label: "BTEB বাৎসরিক লেজার হাব",
        icon: Edit3,
        roles: ["admin"],
        keywords: ["ledger", "bteb", "annual", "লেজার"],
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
  {
    id: "comms_output",
    title: "৫. যোগাযোগ ও ইউনিভার্সাল প্রিন্ট",
    subtitle: "Communication",
    icon: MessageSquare,
    roles: ["admin", "teacher"],
    items: [
      {
        href: "/communication/sms",
        label: "এসএমএস ও নোটিশ বোর্ড",
        icon: MessageSquare,
        roles: ["admin", "teacher"],
        keywords: ["sms", "notice", "communication", "মেসেজ"],
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
        href: "/print",
        label: "ইউনিভার্সাল প্রিন্ট ও এক্সপোর্ট",
        icon: Printer,
        roles: ["admin", "teacher"],
        keywords: ["print", "export", "pdf", "প্রিন্ট"],
        theme: {
          iconText: "text-violet-400",
          iconBg: "bg-violet-500/15 border-violet-500/30",
          activeBg: "bg-violet-950/80 text-white border-violet-500/40 shadow-violet-950/50",
          activeBorder: "border-violet-400/40",
          activeText: "text-violet-200",
          indicatorColor: "bg-violet-400 shadow-[0_0_8px_#a78bfa]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]",
        },
      },
    ],
  },
  {
    id: "system",
    title: "৬. সিস্টেম ও নিরাপত্তা",
    subtitle: "System Config",
    icon: Sliders,
    isCollapsible: true,
    roles: ["all"],
    items: [
      {
        href: "/admin/ai-settings",
        label: "AI পাইপলাইন সেটিংস",
        icon: Sparkles,
        roles: ["admin"],
        keywords: ["ai", "pipeline", "settings", "gemini"],
        theme: {
          iconText: "text-rose-400",
          iconBg: "bg-rose-500/15 border-rose-500/30",
          activeBg: "bg-rose-950/80 text-white border-rose-500/40 shadow-rose-950/50",
          activeBorder: "border-rose-400/40",
          activeText: "text-rose-200",
          indicatorColor: "bg-rose-400 shadow-[0_0_8px_#fb7185]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]",
        },
      },
      {
        href: "/admin/profile",
        label: "আমার প্রোফাইল ও ক্রেডেনশিয়াল",
        icon: User,
        roles: ["all"],
        keywords: ["profile", "account", "settings", "password", "ক্রেডেনশিয়াল"],
        theme: {
          iconText: "text-amber-400",
          iconBg: "bg-amber-500/15 border-amber-500/30",
          activeBg: "bg-amber-950/80 text-white border-amber-500/40 shadow-amber-950/50",
          activeBorder: "border-amber-400/40",
          activeText: "text-amber-200",
          indicatorColor: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
          glowShadow: "group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        },
      },
    ],
  },
];
