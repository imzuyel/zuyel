import React from "react";
import {
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
  MessageSquare,
  Wrench,
  FileSpreadsheet,
  TrendingUp,
  Presentation,
  PlaySquare,
  Database,
  Flame,
  CheckCircle2,
  Tv,
  ClipboardCheck,
} from "lucide-react";
import { isSupremeAdmin, isAdministrator, isTeacher, isStudent, normalizeRole } from "@/lib/rbac";

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
// CENTRAL NAVIGATION CONFIGURATION MATRIX (UNIFIED CANONICAL ORDER)
// 1. ড্যাশবোর্ড -> 2. অধ্যায়ভিত্তিক লার্নিং -> 3. শিক্ষার্থীর ডাউট/ডাটা রেজোলিউশন
// -> 4. শিক্ষণ অ্যানালিটিক্স -> 5. প্রেজেন্টেশন গ্যালারি -> 6. লাইভ কুইজ -> 7. প্রশ্ন বিল্ডার
// -> 8. শিক্ষার্থী ডাটাবেজ ও ভর্তি / ব্যাচ প্রমোশন / আইডি কার্ড / বাংলা প্রত্যয়নপত্র / ফি কালেকশন
// -> 9. হাজিরা ও BTEB খাতা / উপস্থিতি রিপোর্ট -> 10. মাস্টার রুটিন
// -> 11. একাডেমিক সেটিংস ও অ্যাডমিন
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMARY_NAVIGATION_GROUPS: NavGroupConfig[] = [
  // 1. ড্যাশবোর্ড
  {
    id: "group_dashboard",
    title: "১. ড্যাশবোর্ড",
    icon: LayoutDashboard,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["all"],
    items: [
      {
        id: "dashboard",
        href: "/admin?tab=dashboard",
        label: "মূল ড্যাশবোর্ড",
        icon: LayoutDashboard,
        badge: "Live",
        badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
        roles: ["all"],
        keywords: ["dashboard", "overview", "home", "ড্যাশবোর্ড"],
      },
      {
        id: "teacher_dashboard",
        href: "/admin?tab=teacher_dashboard",
        label: "শিক্ষক ককপিট",
        icon: Award,
        roles: ["teacher", "admin"],
        keywords: ["teacher", "cockpit", "শিক্ষক"],
      },
      {
        id: "/",
        href: "/",
        label: "পাবলিক ওয়েবসাইট",
        icon: Tv,
        roles: ["all"],
        keywords: ["public", "home", "website"],
      },
    ],
  },

  // 2. অধ্যায়ভিত্তিক লার্নিং
  {
    id: "group_learning",
    title: "২. অধ্যায়ভিত্তিক লার্নিং",
    icon: BookOpen,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["all"],
    items: [
      {
        id: "course_content_builder",
        href: "/admin?tab=course_content_builder",
        label: "অধ্যায়ভিত্তিক লার্নিং বিল্ডার",
        icon: BookOpen,
        badge: "LMS",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
        roles: ["teacher", "admin"],
        keywords: ["learning", "chapter", "course", "লার্নিং", "অধ্যায়"],
      },
      {
        id: "/learning",
        href: "/learning",
        label: "লার্নিং পোর্টাল (শিক্ষার্থী ভিউ)",
        icon: PlaySquare,
        roles: ["all"],
        keywords: ["learning portal", "lessons", "পোর্টাল"],
      },
      {
        id: "prepare_class",
        href: "/admin?tab=prepare_class",
        label: "এআই ক্লাস প্রস্তুতি",
        icon: Sparkles,
        roles: ["teacher", "admin"],
        keywords: ["prepare", "ai prep", "ক্লাস প্রস্তুতি"],
      },
    ],
  },

  // 3. শিক্ষার্থীর ডাউট / ডাটা রেজোলিউশন
  {
    id: "group_resolution",
    title: "৩. ডাউট ও ডাটা রেজোলিউশন",
    icon: MessageSquare,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["teacher", "admin"],
    items: [
      {
        id: "student_doubts",
        href: "/admin?tab=student_doubts",
        label: "শিক্ষার্থীর ডাউট রিভিউ",
        icon: MessageSquare,
        roles: ["teacher", "admin"],
        keywords: ["doubt", "question", "qa", "ডাউট"],
      },
      {
        id: "/students/resolution",
        href: "/students/resolution",
        label: "শিক্ষার্থী ডাটা রেজোলিউশন",
        icon: Wrench,
        roles: ["admin"],
        keywords: ["resolution", "merge", "duplicate", "রেজোলিউশন"],
      },
    ],
  },

  // 4. শিক্ষণ অ্যানালিটিক্স
  {
    id: "group_analytics",
    title: "৪. শিক্ষণ অ্যানালিটিক্স",
    icon: TrendingUp,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["teacher", "admin"],
    items: [
      {
        id: "weak_topic_analytics",
        href: "/admin?tab=weak_topic_analytics",
        label: "দুর্বল টপিক ও শিক্ষণ অ্যানালিটিক্স",
        icon: TrendingUp,
        roles: ["teacher", "admin"],
        keywords: ["analytics", "weak topic", "heatmap", "অ্যানালিটিক্স"],
      },
      {
        id: "/results",
        href: "/results",
        label: "ফলাফল ও পারফরম্যান্স রিপোর্ট",
        icon: Award,
        roles: ["all"],
        keywords: ["results", "performance", "ফলাফল"],
      },
    ],
  },

  // 5. প্রেজেন্টেশন গ্যালারি
  {
    id: "group_presentations",
    title: "৫. প্রেজেন্টেশন গ্যালারি",
    icon: Presentation,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["all"],
    items: [
      {
        id: "presentations",
        href: "/presentations",
        label: "প্রেজেন্টেশন গ্যালারি",
        icon: Presentation,
        roles: ["all"],
        keywords: ["presentation", "slides", "প্রেজেন্টেশন"],
      },
      {
        id: "ai_presentation_studio",
        href: "/admin?tab=ai_presentation_studio",
        label: "এআই প্রেজেন্টেশন স্টুডিও",
        icon: Sparkles,
        roles: ["teacher", "admin"],
        keywords: ["ai slides", "studio", "স্লাইড"],
      },
    ],
  },

  // 6. লাইভ কুইজ
  {
    id: "group_quiz",
    title: "৬. লাইভ কুইজ",
    icon: Flame,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["all"],
    items: [
      {
        id: "quiz_admin",
        href: "/admin?tab=quiz_admin",
        label: "লাইভ কুইজ হোস্ট ও এরিনা",
        icon: Flame,
        badge: "Live",
        badgeColor: "bg-rose-500/20 text-rose-300 border-rose-400/30",
        roles: ["teacher", "admin"],
        keywords: ["live quiz", "kahoot", "mentimeter", "কুইজ"],
      },
      {
        id: "quiz_studio",
        href: "/admin?tab=quiz_studio",
        label: "কুইজ বিল্ডার স্টুডিও",
        icon: Radio,
        roles: ["teacher", "admin"],
        keywords: ["quiz builder", "studio"],
      },
      {
        id: "ai_quiz_import",
        href: "/admin?tab=ai_quiz_import",
        label: "এআই কুইজ ও PDF ইমপোর্ট",
        icon: Bot,
        roles: ["teacher", "admin"],
        keywords: ["ai quiz", "pdf quiz"],
      },
      {
        id: "/quiz/join",
        href: "/quiz/join",
        label: "লাইভ কুইজে জয়েন (পিন)",
        icon: CheckCircle2,
        roles: ["student", "all"],
        keywords: ["join quiz", "pin", "জয়েন"],
      },
    ],
  },

  // 7. প্রশ্ন বিল্ডার
  {
    id: "group_exams",
    title: "৭. প্রশ্ন বিল্ডার ও পরীক্ষা",
    icon: Edit3,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["teacher", "admin"],
    items: [
      {
        id: "written_question_builder",
        href: "/admin?tab=written_question_builder",
        label: "অ্যাডভান্সড প্রশ্ন বিল্ডার স্টুডিও",
        icon: Edit3,
        badge: "Pro",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/30",
        roles: ["teacher", "admin"],
        keywords: ["question", "exam paper", "প্রশ্ন বিল্ডার"],
      },
      {
        id: "examinations",
        href: "/admin?tab=examinations",
        label: "পরীক্ষা ব্যবস্থাপনা",
        icon: FileText,
        roles: ["teacher", "admin"],
        keywords: ["exam", "পরীক্ষা"],
      },
      {
        id: "marks_results",
        href: "/admin?tab=marks_results",
        label: "নম্বর এন্ট্রি ও টেবুলেশন",
        icon: Award,
        roles: ["teacher", "admin"],
        keywords: ["marks", "tabulation", "নম্বর"],
      },
    ],
  },

  // 8. শিক্ষার্থী ডাটাবেজ ও ভর্তি / ব্যাচ প্রমোশন / আইডি কার্ড / বাংলা প্রত্যয়নপত্র / ফি কালেকশন
  {
    id: "group_students",
    title: "৮. শিক্ষার্থী ও দাপ্তরিক সেবা",
    icon: Users,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["teacher", "admin"],
    items: [
      {
        id: "students",
        href: "/students",
        label: "শিক্ষার্থী ডাটাবেজ ও ভর্তি",
        icon: Users,
        roles: ["teacher", "admin"],
        keywords: ["students", "admission", "directory", "শিক্ষার্থী"],
      },
      {
        id: "student_promotion",
        href: "/admin?tab=student_promotion",
        label: "ব্যাচ প্রমোশন",
        icon: Layers,
        roles: ["admin"],
        keywords: ["promotion", "batch", "প্রমোশন"],
      },
      {
        id: "id_cards",
        href: "/students/id-cards",
        label: "স্মার্ট আইডি কার্ড",
        icon: CreditCard,
        roles: ["admin"],
        keywords: ["id card", "qr", "আইডি কার্ড"],
      },
      {
        id: "bangla_docs",
        href: "/admin?tab=bangla_docs",
        label: "বাংলা প্রত্যয়নপত্র ও সনদ",
        icon: Printer,
        roles: ["admin"],
        keywords: ["bangla doc", "testimonial", "প্রত্যয়নপত্র"],
      },
      {
        id: "fee_collection",
        href: "/admin?tab=fee_collection",
        label: "ফি কালেকশন ও হিসাব",
        icon: FileSpreadsheet,
        roles: ["admin"],
        keywords: ["fee", "payment", "accounts", "ফি"],
      },
      {
        id: "excel_wizard",
        href: "/admin?tab=excel_wizard",
        label: "এক্সেল বাল্ক ইমপোর্ট",
        icon: FileSpreadsheet,
        roles: ["admin"],
        keywords: ["excel", "bulk", "import"],
      },
      {
        id: "universal_print_hub",
        href: "/admin?tab=universal_print_hub",
        label: "ইউনিভার্সাল প্রিন্ট হাব",
        icon: Printer,
        roles: ["teacher", "admin"],
        keywords: ["print", "প্রিন্ট"],
      },
    ],
  },

  // 9. হাজিরা ও BTEB খাতা / উপস্থিতি রিপোর্ট
  {
    id: "group_attendance",
    title: "৯. হাজিরা ও BTEB খাতা",
    icon: ClipboardCheck,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["teacher", "admin"],
    items: [
      {
        id: "attendance",
        href: "/attendance",
        label: "হাজিরা ও BTEB খাতা",
        icon: CalendarCheck,
        roles: ["teacher", "admin"],
        keywords: ["attendance", "khata", "হাজিরা"],
      },
      {
        id: "bteb_annual_ledger",
        href: "/admin?tab=bteb_annual_ledger",
        label: "BTEB বার্ষিক খাতা (Ledger)",
        icon: BookOpen,
        roles: ["teacher", "admin"],
        keywords: ["bteb", "annual register", "ledger"],
      },
      {
        id: "attendance_report",
        href: "/admin?tab=attendance_report",
        label: "উপস্থিতি রিপোর্ট",
        icon: ClipboardCheck,
        roles: ["teacher", "admin"],
        keywords: ["attendance report", "উপস্থিতি রিপোর্ট"],
      },
    ],
  },

  // 10. মাস্টার রুটিন
  {
    id: "group_routine",
    title: "১০. মাস্টার রুটিন",
    icon: Clock,
    isCollapsible: true,
    defaultOpen: true,
    roles: ["all"],
    items: [
      {
        id: "routine_master",
        href: "/routine/master",
        label: "মাস্টার রুটিন",
        icon: Calendar,
        roles: ["all"],
        keywords: ["routine", "timetable", "রুটিন"],
      },
      {
        id: "teacher_workload",
        href: "/admin?tab=teacher_workload",
        label: "শিক্ষক ওয়ার্কলোড ও বদলি",
        icon: Clock,
        roles: ["teacher", "admin"],
        keywords: ["workload", "substitution", "বদলি"],
      },
    ],
  },

  // 11. একাডেমিক সেটিংস ও অ্যাডমিন
  {
    id: "group_settings",
    title: "১১. একাডেমিক সেটিংস ও অ্যাডমিন",
    icon: Sliders,
    isCollapsible: true,
    defaultOpen: false,
    roles: ["admin", "teacher"],
    items: [
      {
        id: "global_academic_hub",
        href: "/admin?tab=global_academic_hub",
        label: "একাডেমিক ম্যাপিং ও বিষয় হাব",
        icon: Sliders,
        roles: ["admin"],
        keywords: ["academic", "mapping", "global settings", "একাডেমিক"],
      },
      {
        id: "classes_trades",
        href: "/admin?tab=classes_trades",
        label: "শিক্ষাবর্ষ, শ্রেণি ও ট্রেড সেটআপ",
        icon: Layers,
        roles: ["admin"],
        keywords: ["classes", "trades", "years", "ট্রেড"],
      },
      {
        id: "subjects",
        href: "/admin?tab=subjects",
        label: "বিষয় মাস্টার ক্যাটালগ",
        icon: BookOpen,
        roles: ["teacher", "admin"],
        keywords: ["subjects", "বিষয়"],
      },
      {
        id: "lab_inventory",
        href: "/admin?tab=lab_inventory",
        label: "ল্যাব ও ওয়ার্কশপ ইনভেন্টরি",
        icon: Wrench,
        roles: ["teacher", "admin"],
        keywords: ["lab", "inventory", "ল্যাব"],
      },
      {
        id: "notices",
        href: "/admin?tab=notices",
        label: "নোটিশ বোর্ড",
        icon: FileText,
        roles: ["admin"],
        keywords: ["notice", "নোটিশ"],
      },
      {
        id: "sms_studio",
        href: "/admin?tab=sms_studio",
        label: "SMS স্টুডিও",
        icon: MessageSquare,
        roles: ["admin"],
        keywords: ["sms", "alert"],
      },
      {
        id: "cms_management",
        href: "/admin?tab=cms_management",
        label: "CMS ও ওয়েবসাইট সেটিংস",
        icon: Tv,
        roles: ["admin"],
        keywords: ["cms", "website"],
      },
      {
        id: "/admin/ai-settings",
        href: "/admin/ai-settings",
        label: "AI ইঞ্জিন সেটিংস",
        icon: Bot,
        roles: ["admin"],
        keywords: ["ai", "gemini", "settings"],
      },
      {
        id: "mysql_workbench",
        href: "/admin?tab=mysql_workbench",
        label: "ডাটাবেজ ও ব্যাকআপ (MySQL)",
        icon: Database,
        roles: ["admin"],
        keywords: ["mysql", "database", "sync", "backup"],
      },
      {
        id: "/admin/permissions",
        href: "/admin/permissions",
        label: "রোল ও পারমিশন (RBAC)",
        icon: ShieldCheck,
        roles: ["admin"],
        keywords: ["permissions", "rbac"],
      },
      {
        id: "security_governance",
        href: "/admin?tab=security_governance",
        label: "নিরাপত্তা ও অডিট লগ",
        icon: ShieldCheck,
        roles: ["admin"],
        keywords: ["security", "audit"],
      },
      {
        id: "profile",
        href: "/admin?tab=profile",
        label: "আমার প্রোফাইল",
        icon: User,
        roles: ["teacher", "admin"],
        keywords: ["profile", "প্রোফাইল"],
      },
    ],
  },
];
