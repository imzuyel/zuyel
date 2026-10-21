"use client";

import React, { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Smartphone,
  FileText,
  Layers,
  BookOpen,
  Calendar,
  Printer,
  Award,
  GraduationCap,
  Flame,
  FileSpreadsheet,
  CreditCard,
  Sliders,
  Bell,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ShieldCheck,
  Sparkles,
  Zap,
  UserCheck,
  User,
  Palette,
  Search,
  Megaphone,
  BarChart3,
  Edit3,
  Wrench,
  Clock,
  Presentation,
  HelpCircle,
  BookMarked,
  BrainCircuit,
  ClipboardPaste,
} from "lucide-react";
import { InstitutionTechnicalSealSVG } from "@/components/ui/animated-svgs";
import { useTheme } from "@/context/ThemeContext";
import { getThemedIconStyle } from "@/lib/iconThemes";
import IconThemeSelectorModal from "@/components/theme/IconThemeSelectorModal";

export type AdminTab =
  | "dashboard"
  | "global_academic_hub"
  | "universal_print_hub"
  | "course_content_builder"
  | "quiz_admin"
  | "quiz_studio"
  | "ai_quiz_import"

  | "prepare_class"
  | "slide_to_blog"
  | "student_doubts"
  | "weak_topic_analytics"
  | "ai_presentation_studio"
  | "learning_library"
  | "presentations"
  | "written_question_builder"
  | "examinations"
  | "marks_results"
  | "bteb_annual_ledger"
  | "classes_trades"
  | "subjects"
  | "lab_inventory"
  | "fee_collection"
  | "students"
  | "id_cards"
  | "bangla_docs"
  | "excel_wizard"
  | "teacher_dashboard"
  | "teacher_profile_settings"
  | "teacher_workload"
  | "attendance"
  | "mobile_attendance"
  | "attendance_report"
  | "routine_master"
  | "notices"
  | "notifications"
  | "sms_studio"
  | "cms_management"
  | "mysql_workbench"
  | "security_governance";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface SidebarMenuItem {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
  keywords?: string[];
  colorTheme?: {
    iconText: string;
    iconBg: string;
    activeBg: string;
    activeBorder: string;
    activeText: string;
    indicatorColor: string;
    glowShadow: string;
  };
}

interface SidebarMenuCategory {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  categoryBadge?: string;
  theme: {
    headerColor: string;
    badgeBg: string;
    activeCategoryBg: string;
    dotColor: string;
  };
  items: SidebarMenuItem[];
}

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isVisuallyExpanded = !isCollapsed || isHovered;
  const [iconModalOpen, setIconModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { iconTheme, iconAnimation, currentIconTheme } = useTheme();

  // Categorized Hierarchical Menu Structure with Distinct Theme Color Systems
  const categories: SidebarMenuCategory[] = useMemo(
    () => [
      {
        id: "cat_dashboard",
        title: "১. ওভারভিউ ও ড্যাশবোর্ড",
        subtitle: "Main Overview",
        icon: LayoutDashboard,
        theme: {
          headerColor: "text-indigo-600 dark:text-indigo-400",
          badgeBg: "bg-indigo-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs",
          activeCategoryBg: "bg-indigo-50/60 dark:bg-indigo-950/30",
          dotColor: "bg-indigo-500",
        },
        items: [
          {
            id: "dashboard",
            label: "মূল ড্যাশবোর্ড",
            icon: LayoutDashboard,
            badge: "লাইভ",
            badgeColor: "bg-emerald-500 text-white font-black shadow-xs",
            keywords: ["overview", "main", "ড্যাশবোর্ড", "হোম"],
            colorTheme: {
              iconText: "text-indigo-600 dark:text-indigo-400",
              iconBg: "bg-indigo-500/10 border-indigo-500/20 dark:bg-indigo-500/15 dark:border-indigo-500/30",
              activeBg: "bg-indigo-600 text-white shadow-indigo-600/30",
              activeBorder: "border-indigo-400/40",
              activeText: "text-white",
              indicatorColor: "bg-indigo-400 shadow-[0_0_8px_#818cf8]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]",
            },
          },
        ],
      },
      {
        id: "cat_learning_hub",
        title: "২. লার্নিং ও ক্লাস প্রস্তুতি",
        subtitle: "Academics & Studio",
        icon: BookOpen,
        theme: {
          headerColor: "text-emerald-600 dark:text-emerald-400",
          badgeBg: "bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs",
          activeCategoryBg: "bg-emerald-50/60 dark:bg-emerald-950/30",
          dotColor: "bg-emerald-500",
        },
        items: [
          {
            id: "course_content_builder",
            label: "📚 অধ্যায়ভিত্তিক কন্টেন্ট ও ক্লাস স্টুডিও",
            icon: BookOpen,
            highlight: true,
            badge: "AI ইন্টিগ্রেটেড",
            badgeColor: "bg-emerald-500 text-white font-black shadow-xs",
            keywords: [
              "course",
              "chapter",
              "path",
              "content",
              "builder",
              "prepare",
              "class",
              "lesson",
              "summary",
              "quiz",
              "slide",
              "blog",
              "ক্লাস প্রস্তুতি",
              "অধ্যায়ভিত্তিক কন্টেন্ট",
              "কন্টেন্ট স্টুডিও",
              "লেসন প্ল্যান",
            ],
            colorTheme: {
              iconText: "text-emerald-600 dark:text-emerald-400",
              iconBg: "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/15 dark:border-emerald-500/30",
              activeBg: "bg-emerald-600 text-white shadow-emerald-600/30",
              activeBorder: "border-emerald-400/40",
              activeText: "text-white",
              indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
            },
          },

          {
            id: "student_doubts",
            label: "শিক্ষার্থী ডাউট রেজোলিউশন",
            icon: HelpCircle,
            keywords: ["doubts", "questions", "student", "teacher", "প্রশ্ন"],
            colorTheme: {
              iconText: "text-sky-600 dark:text-sky-400",
              iconBg: "bg-sky-500/10 border-sky-500/20 dark:bg-sky-500/15 dark:border-sky-500/30",
              activeBg: "bg-sky-600 text-white shadow-sky-600/30",
              activeBorder: "border-sky-400/40",
              activeText: "text-white",
              indicatorColor: "bg-sky-400 shadow-[0_0_8px_#38bdf8]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(14,165,233,0.4)]",
            },
          },
          {
            id: "weak_topic_analytics",
            label: "শিক্ষক অ্যানালিটিক্স ও ট্র্যাকিং",
            icon: BrainCircuit,
            keywords: ["weak", "analytics", "mistakes", "অ্যানালিটিক্স", "দুর্বল টপিক"],
            colorTheme: {
              iconText: "text-rose-600 dark:text-rose-400",
              iconBg: "bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/15 dark:border-rose-500/30",
              activeBg: "bg-rose-600 text-white shadow-rose-600/30",
              activeBorder: "border-rose-400/40",
              activeText: "text-white",
              indicatorColor: "bg-rose-400 shadow-[0_0_8px_#fb7185]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]",
            },
          },
          {
            id: "presentations",
            label: "প্রেজেন্টেশন ও গ্যালারি রিডার",
            icon: Layers,
            keywords: ["slides", "presentation", "projection", "স্লাইড"],
            colorTheme: {
              iconText: "text-amber-600 dark:text-amber-400",
              iconBg: "bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/30",
              activeBg: "bg-amber-600 text-white shadow-amber-600/30",
              activeBorder: "border-amber-400/40",
              activeText: "text-white",
              indicatorColor: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]",
            },
          },
        ],
      },
      {
        id: "cat_ai_quiz",
        title: "৩. AI কুইজ ও প্রশ্ন স্টুডিও",
        subtitle: "AI Generator Hub",
        icon: Flame,
        theme: {
          headerColor: "text-purple-600 dark:text-purple-400",
          badgeBg: "bg-purple-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs",
          activeCategoryBg: "bg-purple-50/60 dark:bg-purple-950/30",
          dotColor: "bg-purple-500",
        },
        items: [
          {
            id: "quiz_admin",
            label: "লাইভ কুইজ পোর্টাল",
            icon: Flame,
            badge: "হট",
            badgeColor: "bg-red-500 text-white font-black shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse",
            highlight: true,
            keywords: ["quiz", "live", "অনলাইন কুইজ"],
            colorTheme: {
              iconText: "text-amber-600 dark:text-amber-400",
              iconBg: "bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/30",
              activeBg: "bg-amber-600 text-white shadow-amber-600/30",
              activeBorder: "border-amber-400/40",
              activeText: "text-white",
              indicatorColor: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]",
            },
          },
          {
            id: "quiz_studio",
            label: "কুইজ স্টুডিও",
            icon: Flame,
            badge: "NEW",
            badgeColor: "bg-green-500 text-white font-black shadow-[0_0_8px_rgba(34,197,94,0.5)]",
            highlight: true,
            keywords: ["quiz", "studio", "ai"],
            colorTheme: {
              iconText: "text-emerald-600 dark:text-emerald-400",
              iconBg: "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/15 dark:border-emerald-500/30",
              activeBg: "bg-emerald-600 text-white shadow-emerald-600/30",
              activeBorder: "border-emerald-400/40",
              activeText: "text-white",
              indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#10b981]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
            },
          },
          {
            id: "ai_presentation_studio",
            label: "AI প্রেজেন্টেশন ও স্লাইড বিল্ডার",
            icon: Presentation,
            highlight: true,
            keywords: ["ai presentation", "slide studio", "lecture generator"],
            colorTheme: {
              iconText: "text-fuchsia-600 dark:text-fuchsia-400",
              iconBg: "bg-fuchsia-500/10 border-fuchsia-500/20 dark:bg-fuchsia-500/15 dark:border-fuchsia-500/30",
              activeBg: "bg-fuchsia-600 text-white shadow-fuchsia-600/30",
              activeBorder: "border-fuchsia-400/40",
              activeText: "text-white",
              indicatorColor: "bg-fuchsia-400 shadow-[0_0_8px_#e879f9]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(217,70,239,0.4)]",
            },
          },
          {
            id: "written_question_builder",
            label: "লিখিত প্রশ্নপত্র বিল্ডার (BTEB)",
            icon: Edit3,
            badge: "BTEB",
            badgeColor: "bg-rose-600 text-white font-black shadow-xs",
            highlight: true,
            keywords: ["question paper", "written exam", "ai question", "pdf"],
            colorTheme: {
              iconText: "text-rose-600 dark:text-rose-400",
              iconBg: "bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/15 dark:border-rose-500/30",
              activeBg: "bg-rose-600 text-white shadow-rose-600/30",
              activeBorder: "border-rose-400/40",
              activeText: "text-white",
              indicatorColor: "bg-rose-400 shadow-[0_0_8px_#f43f5e]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]",
            },
          },
        ],
      },
      {
        id: "cat_students",
        title: "৪. শিক্ষার্থী প্রশাসন",
        subtitle: "Students & ID",
        icon: Users,
        theme: {
          headerColor: "text-sky-600 dark:text-sky-400",
          badgeBg: "bg-sky-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs",
          activeCategoryBg: "bg-sky-50/60 dark:bg-sky-950/30",
          dotColor: "bg-sky-500",
        },
        items: [
          {
            id: "students",
            label: "শিক্ষার্থী ডাটাবেজ ও ভর্তি",
            icon: Users,
            keywords: ["students", "admission", "শিক্ষার্থী", "ভর্তি"],
            colorTheme: {
              iconText: "text-sky-600 dark:text-sky-400",
              iconBg: "bg-sky-500/10 border-sky-500/20 dark:bg-sky-500/15 dark:border-sky-500/30",
              activeBg: "bg-sky-600 text-white shadow-sky-600/30",
              activeBorder: "border-sky-400/40",
              activeText: "text-white",
              indicatorColor: "bg-sky-400 shadow-[0_0_8px_#38bdf8]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(14,165,233,0.4)]",
            },
          },
          {
            id: "id_cards",
            label: "আইডি কার্ড স্টুডিও",
            icon: CreditCard,
            keywords: ["id card", "identity", "আইডি কার্ড"],
            colorTheme: {
              iconText: "text-indigo-600 dark:text-indigo-400",
              iconBg: "bg-indigo-500/10 border-indigo-500/20 dark:bg-indigo-500/15 dark:border-indigo-500/30",
              activeBg: "bg-indigo-600 text-white shadow-indigo-600/30",
              activeBorder: "border-indigo-400/40",
              activeText: "text-white",
              indicatorColor: "bg-indigo-400 shadow-[0_0_8px_#818cf8]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]",
            },
          },
          {
            id: "bangla_docs",
            label: "বাংলা প্রত্যয়ন ও প্রশংসাপত্র",
            icon: FileText,
            keywords: ["certificate", "testimonial", "প্রত্যয়ন"],
            colorTheme: {
              iconText: "text-emerald-600 dark:text-emerald-400",
              iconBg: "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/15 dark:border-emerald-500/30",
              activeBg: "bg-emerald-600 text-white shadow-emerald-600/30",
              activeBorder: "border-emerald-400/40",
              activeText: "text-white",
              indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
            },
          },
          {
            id: "fee_collection",
            label: "ফি কালেকশন ও রিসিট",
            icon: CreditCard,
            keywords: ["fee", "accounts", "collection", "receipt", "ফি"],
            colorTheme: {
              iconText: "text-cyan-600 dark:text-cyan-400",
              iconBg: "bg-cyan-500/10 border-cyan-500/20 dark:bg-cyan-500/15 dark:border-cyan-500/30",
              activeBg: "bg-cyan-600 text-white shadow-cyan-600/30",
              activeBorder: "border-cyan-400/40",
              activeText: "text-white",
              indicatorColor: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
            },
          },
        ],
      },
      {
        id: "cat_attendance_routine",
        title: "৫. হাজিরা ও মাস্টার রুটিন",
        subtitle: "Attendance & Routine",
        icon: CalendarCheck,
        theme: {
          headerColor: "text-teal-600 dark:text-teal-400",
          badgeBg: "bg-teal-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs",
          activeCategoryBg: "bg-teal-50/60 dark:bg-teal-950/30",
          dotColor: "bg-teal-500",
        },
        items: [
          {
            id: "attendance",
            label: "হাজিরা ও BTEB বার্ষিক খাতা",
            icon: CalendarCheck,
            highlight: true,
            keywords: ["attendance", "register", "হাজিরা", "বার্ষিক খাতা", "bteb"],
            colorTheme: {
              iconText: "text-teal-600 dark:text-teal-400",
              iconBg: "bg-teal-500/10 border-teal-500/20 dark:bg-teal-500/15 dark:border-teal-500/30",
              activeBg: "bg-teal-600 text-white shadow-teal-600/30",
              activeBorder: "border-teal-400/40",
              activeText: "text-white",
              indicatorColor: "bg-teal-400 shadow-[0_0_8px_#2dd4bf]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(20,184,166,0.4)]",
            },
          },
          {
            id: "mobile_attendance",
            label: "মোবাইল এটেনডেন্স সিস্টেম",
            icon: Smartphone,
            keywords: ["mobile", "app", "attendance", "মোবাইল"],
            colorTheme: {
              iconText: "text-emerald-600 dark:text-emerald-400",
              iconBg: "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/15 dark:border-emerald-500/30",
              activeBg: "bg-emerald-600 text-white shadow-emerald-600/30",
              activeBorder: "border-emerald-400/40",
              activeText: "text-white",
              indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
            },
          },
          {
            id: "attendance_report",
            label: "উপস্থিতি ও এনালাইটিক্স রিপোর্ট",
            icon: BarChart3,
            keywords: ["reports", "analytics", "রিপোর্ট"],
            colorTheme: {
              iconText: "text-sky-600 dark:text-sky-400",
              iconBg: "bg-sky-500/10 border-sky-500/20 dark:bg-sky-500/15 dark:border-sky-500/30",
              activeBg: "bg-sky-600 text-white shadow-sky-600/30",
              activeBorder: "border-sky-400/40",
              activeText: "text-white",
              indicatorColor: "bg-sky-400 shadow-[0_0_8px_#38bdf8]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(14,165,233,0.4)]",
            },
          },
          {
            id: "routine_master",
            label: "মাস্টার রুটিন ও কনফিগারেশন",
            icon: Clock,
            keywords: ["routine", "schedule", "রুটিন"],
            colorTheme: {
              iconText: "text-indigo-600 dark:text-indigo-400",
              iconBg: "bg-indigo-500/10 border-indigo-500/20 dark:bg-indigo-500/15 dark:border-indigo-500/30",
              activeBg: "bg-indigo-600 text-white shadow-indigo-600/30",
              activeBorder: "border-indigo-400/40",
              activeText: "text-white",
              indicatorColor: "bg-indigo-400 shadow-[0_0_8px_#818cf8]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]",
            },
          },
        ],
      },
      {
        id: "cat_examination",
        title: "৬. পরীক্ষা ও বিটিইবি ফলাফল",
        subtitle: "Exams & Grading",
        icon: Award,
        theme: {
          headerColor: "text-amber-600 dark:text-amber-400",
          badgeBg: "bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-xs",
          activeCategoryBg: "bg-amber-50/60 dark:bg-amber-950/30",
          dotColor: "bg-amber-500",
        },
        items: [
          {
            id: "examinations",
            label: "পরীক্ষা সূচি ও ম্যানেজমেন্ট",
            icon: Award,
            keywords: ["exam", "schedule", "পরীক্ষা"],
            colorTheme: {
              iconText: "text-amber-600 dark:text-amber-400",
              iconBg: "bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/30",
              activeBg: "bg-amber-600 text-white shadow-amber-600/30",
              activeBorder: "border-amber-400/40",
              activeText: "text-white",
              indicatorColor: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]",
            },
          },
          {
            id: "marks_results",
            label: "নম্বর এন্ট্রি ও রেজাল্ট হাব",
            icon: GraduationCap,
            keywords: ["marks", "results", "ফলাফল", "নম্বর"],
            colorTheme: {
              iconText: "text-yellow-600 dark:text-yellow-400",
              iconBg: "bg-yellow-500/10 border-yellow-500/20 dark:bg-yellow-500/15 dark:border-yellow-500/30",
              activeBg: "bg-yellow-600 text-white shadow-yellow-600/30",
              activeBorder: "border-yellow-400/40",
              activeText: "text-white",
              indicatorColor: "bg-yellow-400 shadow-[0_0_8px_#facc15]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]",
            },
          },
          {
            id: "bteb_annual_ledger",
            label: "BTEB বাৎসরিক লেজার পোর্টিং",
            icon: FileSpreadsheet,
            keywords: ["ledger", "bteb", "annual", "লেজার"],
            colorTheme: {
              iconText: "text-orange-600 dark:text-orange-400",
              iconBg: "bg-orange-500/10 border-orange-500/20 dark:bg-orange-500/15 dark:border-orange-500/30",
              activeBg: "bg-orange-600 text-white shadow-orange-600/30",
              activeBorder: "border-orange-400/40",
              activeText: "text-white",
              indicatorColor: "bg-orange-400 shadow-[0_0_8px_#fb923c]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]",
            },
          },
        ],
      },
      {
        id: "cat_faculty",
        title: "৭. শিক্ষক ও স্টাফ ককপিট",
        subtitle: "Faculty Workspace",
        icon: UserCheck,
        theme: {
          headerColor: "text-blue-600 dark:text-blue-400",
          badgeBg: "bg-blue-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs",
          activeCategoryBg: "bg-blue-50/60 dark:bg-blue-950/30",
          dotColor: "bg-blue-500",
        },
        items: [
          {
            id: "teacher_dashboard",
            label: "শিক্ষক ককপিট ড্যাশবোর্ড",
            icon: UserCheck,
            keywords: ["teacher", "faculty", "শিক্ষক"],
            colorTheme: {
              iconText: "text-blue-600 dark:text-blue-400",
              iconBg: "bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/15 dark:border-blue-500/30",
              activeBg: "bg-blue-600 text-white shadow-blue-600/30",
              activeBorder: "border-blue-400/40",
              activeText: "text-white",
              indicatorColor: "bg-blue-400 shadow-[0_0_8px_#60a5fa]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]",
            },
          },
          {
            id: "teacher_workload",
            label: "শিক্ষক ওয়ার্কলোড ও রুটিন",
            icon: Clock,
            keywords: ["workload", "routine", "classes"],
            colorTheme: {
              iconText: "text-indigo-600 dark:text-indigo-400",
              iconBg: "bg-indigo-500/10 border-indigo-500/20 dark:bg-indigo-500/15 dark:border-indigo-500/30",
              activeBg: "bg-indigo-600 text-white shadow-indigo-600/30",
              activeBorder: "border-indigo-400/40",
              activeText: "text-white",
              indicatorColor: "bg-indigo-400 shadow-[0_0_8px_#818cf8]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]",
            },
          },
          {
            id: "teacher_profile_settings",
            label: "শিক্ষক প্রোফাইল সেটিংস",
            icon: User,
            keywords: ["profile", "settings", "প্রোফাইল"],
            colorTheme: {
              iconText: "text-cyan-600 dark:text-cyan-400",
              iconBg: "bg-cyan-500/10 border-cyan-500/20 dark:bg-cyan-500/15 dark:border-cyan-500/30",
              activeBg: "bg-cyan-600 text-white shadow-cyan-600/30",
              activeBorder: "border-cyan-400/40",
              activeText: "text-white",
              indicatorColor: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
            },
          },
        ],
      },
      {
        id: "cat_communication",
        title: "৮. যোগাযোগ ও প্রিন্ট হাব",
        subtitle: "Comms & Print",
        icon: Megaphone,
        theme: {
          headerColor: "text-fuchsia-600 dark:text-fuchsia-400",
          badgeBg: "bg-fuchsia-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs",
          activeCategoryBg: "bg-fuchsia-50/60 dark:bg-fuchsia-950/30",
          dotColor: "bg-fuchsia-500",
        },
        items: [
          {
            id: "universal_print_hub",
            label: "ইউনিভার্সাল প্রিন্ট ও এক্সপোর্ট হাব",
            icon: Printer,
            highlight: true,
            keywords: ["print", "pdf", "export", "প্রিন্ট"],
            colorTheme: {
              iconText: "text-violet-600 dark:text-violet-400",
              iconBg: "bg-violet-500/10 border-violet-500/20 dark:bg-violet-500/15 dark:border-violet-500/30",
              activeBg: "bg-violet-600 text-white shadow-violet-600/30",
              activeBorder: "border-violet-400/40",
              activeText: "text-white",
              indicatorColor: "bg-violet-400 shadow-[0_0_8px_#a78bfa]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]",
            },
          },
          {
            id: "sms_studio",
            label: "বাল্ক বাংলা এসএমএস স্টুডিও",
            icon: Smartphone,
            highlight: true,
            keywords: ["sms", "gateway", "এসএমএস"],
            colorTheme: {
              iconText: "text-fuchsia-600 dark:text-fuchsia-400",
              iconBg: "bg-fuchsia-500/10 border-fuchsia-500/20 dark:bg-fuchsia-500/15 dark:border-fuchsia-500/30",
              activeBg: "bg-fuchsia-600 text-white shadow-fuchsia-600/30",
              activeBorder: "border-fuchsia-400/40",
              activeText: "text-white",
              indicatorColor: "bg-fuchsia-400 shadow-[0_0_8px_#e879f9]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(217,70,239,0.4)]",
            },
          },
          {
            id: "notices",
            label: "নোটিশ বোর্ড ও নিউজ",
            icon: Megaphone,
            keywords: ["notice", "announcement", "নোটিশ"],
            colorTheme: {
              iconText: "text-pink-600 dark:text-pink-400",
              iconBg: "bg-pink-500/10 border-pink-500/20 dark:bg-pink-500/15 dark:border-pink-500/30",
              activeBg: "bg-pink-600 text-white shadow-pink-600/30",
              activeBorder: "border-pink-400/40",
              activeText: "text-white",
              indicatorColor: "bg-pink-400 shadow-[0_0_8px_#f472b6]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]",
            },
          },
          {
            id: "notifications",
            label: "নোটিফিকেশন সেন্টার",
            icon: Bell,
            keywords: ["notification", "bell", "মেসেজ"],
            colorTheme: {
              iconText: "text-rose-600 dark:text-rose-400",
              iconBg: "bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/15 dark:border-rose-500/30",
              activeBg: "bg-rose-600 text-white shadow-rose-600/30",
              activeBorder: "border-rose-400/40",
              activeText: "text-white",
              indicatorColor: "bg-rose-400 shadow-[0_0_8px_#fb7185]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]",
            },
          },
        ],
      },
      {
        id: "cat_system",
        title: "৯. গ্লোবাল একাডেমিক ও সিস্টেম সেটিংস",
        subtitle: "Global System",
        icon: Sliders,
        theme: {
          headerColor: "text-slate-700 dark:text-slate-300",
          badgeBg: "bg-slate-700 text-white font-black px-2 py-0.5 rounded-full shadow-xs",
          activeCategoryBg: "bg-slate-100/70 dark:bg-slate-800/50",
          dotColor: "bg-slate-400",
        },
        items: [
          {
            id: "global_academic_hub",
            label: "গ্লোবাল একাডেমিক সেটিংস",
            icon: Sliders,
            highlight: true,
            keywords: ["global settings", "subject mapping", "classes", "trades"],
            colorTheme: {
              iconText: "text-indigo-600 dark:text-indigo-400",
              iconBg: "bg-indigo-500/10 border-indigo-500/20 dark:bg-indigo-500/15 dark:border-indigo-500/30",
              activeBg: "bg-indigo-600 text-white shadow-indigo-600/30",
              activeBorder: "border-indigo-400/40",
              activeText: "text-white",
              indicatorColor: "bg-indigo-400 shadow-[0_0_8px_#818cf8]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]",
            },
          },
          {
            id: "classes_trades",
            label: "শ্রেণি ও কারিগরি ট্রেড বিন্যাস",
            icon: Layers,
            keywords: ["class", "trade", "section", "শ্রেণি", "ট্রেড"],
            colorTheme: {
              iconText: "text-cyan-600 dark:text-cyan-400",
              iconBg: "bg-cyan-500/10 border-cyan-500/20 dark:bg-cyan-500/15 dark:border-cyan-500/30",
              activeBg: "bg-cyan-600 text-white shadow-cyan-600/30",
              activeBorder: "border-cyan-400/40",
              activeText: "text-white",
              indicatorColor: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
            },
          },
          {
            id: "subjects",
            label: "বিষয় ও কারিকুলাম স্ট্রাকচার",
            icon: BookOpen,
            keywords: ["subject", "curriculum", "বিষয়"],
            colorTheme: {
              iconText: "text-teal-600 dark:text-teal-400",
              iconBg: "bg-teal-500/10 border-teal-500/20 dark:bg-teal-500/15 dark:border-teal-500/30",
              activeBg: "bg-teal-600 text-white shadow-teal-600/30",
              activeBorder: "border-teal-400/40",
              activeText: "text-white",
              indicatorColor: "bg-teal-400 shadow-[0_0_8px_#2dd4bf]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(20,184,166,0.4)]",
            },
          },
          {
            id: "lab_inventory",
            label: "ল্যাব ও ইনভেন্টরি ট্র্যাকিং",
            icon: Wrench,
            keywords: ["lab", "equipment", "inventory", "machinery"],
            colorTheme: {
              iconText: "text-amber-600 dark:text-amber-400",
              iconBg: "bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/30",
              activeBg: "bg-amber-600 text-white shadow-amber-600/30",
              activeBorder: "border-amber-400/40",
              activeText: "text-white",
              indicatorColor: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]",
            },
          },
          {
            id: "excel_wizard",
            label: "স্মার্ট এক্সেল উইজার্ড",
            icon: FileSpreadsheet,
            keywords: ["excel", "import", "export", "এক্সেল"],
            colorTheme: {
              iconText: "text-emerald-600 dark:text-emerald-400",
              iconBg: "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/15 dark:border-emerald-500/30",
              activeBg: "bg-emerald-600 text-white shadow-emerald-600/30",
              activeBorder: "border-emerald-400/40",
              activeText: "text-white",
              indicatorColor: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
            },
          },
          {
            id: "cms_management",
            label: "পাবলিক ওয়েবসাইট CMS",
            icon: Sliders,
            keywords: ["cms", "website", "ওয়েবসাইট"],
            colorTheme: {
              iconText: "text-slate-600 dark:text-slate-400",
              iconBg: "bg-slate-500/10 border-slate-500/20 dark:bg-slate-500/15 dark:border-slate-500/30",
              activeBg: "bg-slate-700 text-white shadow-slate-700/30",
              activeBorder: "border-slate-500/40",
              activeText: "text-white",
              indicatorColor: "bg-slate-400 shadow-[0_0_8px_#94a3b8]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(148,163,184,0.4)]",
            },
          },
          {
            id: "mysql_workbench",
            label: "ডাটাবেজ ও SQL ওয়ার্কবেঞ্চ",
            icon: Database,
            keywords: ["database", "sql", "mysql", "ডাটাবেজ"],
            colorTheme: {
              iconText: "text-purple-600 dark:text-purple-400",
              iconBg: "bg-purple-500/10 border-purple-500/20 dark:bg-purple-500/15 dark:border-purple-500/30",
              activeBg: "bg-purple-600 text-white shadow-purple-600/30",
              activeBorder: "border-purple-400/40",
              activeText: "text-white",
              indicatorColor: "bg-purple-400 shadow-[0_0_8px_#c084fc]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]",
            },
          },
          {
            id: "security_governance",
            label: "নিরাপত্তা ও আরবিক গভর্ন্যান্স",
            icon: ShieldCheck,
            highlight: true,
            keywords: ["security", "rbac", "permissions", "governance", "নিরাপত্তা", "পারমিশন"],
            colorTheme: {
              iconText: "text-rose-600 dark:text-rose-400",
              iconBg: "bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/15 dark:border-rose-500/30",
              activeBg: "bg-rose-600 text-white shadow-rose-600/30",
              activeBorder: "border-rose-400/40",
              activeText: "text-white",
              indicatorColor: "bg-rose-400 shadow-[0_0_8px_#fb7185]",
              glowShadow: "group-hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]",
            },
          },
        ],
      },
    ],
    []
  );

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach((cat) => {
      initial[cat.id] = true;
    });
    return initial;
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase().trim();
    return categories
      .map((cat) => {
        const matchesCatTitle = cat.title.toLowerCase().includes(query);
        const matchingItems = cat.items.filter((item) => {
          if (item.label.toLowerCase().includes(query)) return true;
          if (item.keywords?.some((k) => k.toLowerCase().includes(query))) return true;
          return false;
        });

        if (matchesCatTitle || matchingItems.length > 0) {
          return {
            ...cat,
            items: matchesCatTitle ? cat.items : matchingItems,
          };
        }
        return null;
      })
      .filter(Boolean) as SidebarMenuCategory[];
  }, [categories, searchQuery]);

  return (
    <>
      {/* Mobile Drawer Mask Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isCollapsed) setIsHovered(false);
        }}
        className={`fixed lg:sticky top-0 h-screen max-h-screen inset-y-0 left-0 z-40 flex flex-col justify-between transition-all duration-300 ease-in-out border-r border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-2xl lg:shadow-none select-none shrink-0 overflow-hidden ${
          mobileOpen ? "translate-x-0 w-72 sm:w-80" : "-translate-x-full lg:translate-x-0"
        } ${!isVisuallyExpanded ? "lg:w-20" : "lg:w-72"}`}
      >
        {/* Decorative Grid Pattern Backdrop */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="sidebar-grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sidebar-grid-pattern)" />
          </svg>
        </div>

        {/* 1. BRAND HEADER & COLLAPSE TOGGLE */}
        <div className="relative z-10 px-3.5 py-3 border-b border-slate-200/80 dark:border-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="shrink-0 p-0.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/30 shadow-xs">
              <InstitutionTechnicalSealSVG size={32} showGlow={false} />
            </div>

            {isVisuallyExpanded && (
              <div className="truncate animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs text-slate-900 dark:text-white tracking-tight truncate">
                    পঞ্চগড় টেকনিক্যাল স্কুল ও কলেজ
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                    PTSC ERP Administration
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setIsHovered(false);
            }}
            className="hidden lg:flex p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer active:scale-95"
            title={!isVisuallyExpanded ? "সাইডবার বড় করুন" : "সাইডবার ছোট করুন"}
            type="button"
          >
            {!isVisuallyExpanded ? <ChevronRight className="w-4 h-4 text-cyan-500" /> : <ChevronLeft className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. INSTANT SEARCH BAR */}
        {isVisuallyExpanded && (
          <div className="px-3 pt-3 pb-1 relative z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="মডিউল বা মেনু খুঁজুন..."
                className="w-full pl-8 pr-7 py-2 text-xs font-semibold rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-0.5 rounded-md"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. SCROLLABLE HIERARCHICAL NAVIGATION BODY */}
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2.5 space-y-3.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {filteredCategories.map((category) => {
            const isCategoryExpanded = expandedCategories[category.id] ?? true;
            const hasActiveChild = category.items.some((item) => item.id === activeTab);
            const CategoryIcon = category.icon;

            return (
              <div key={category.id} className="space-y-1">
                {/* Category Header */}
                {isVisuallyExpanded ? (
                  <button
                    onClick={() => toggleCategory(category.id)}
                    type="button"
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      hasActiveChild
                        ? `${category.theme.activeCategoryBg} ${category.theme.headerColor} shadow-xs`
                        : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${category.theme.dotColor} shrink-0`} />
                      <span className="truncate">{category.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {category.categoryBadge && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${category.theme.badgeBg}`}>
                          {category.categoryBadge}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                          isCategoryExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>
                ) : (
                  <div className="my-2 mx-auto w-6 border-b border-slate-200 dark:border-slate-800" />
                )}

                {/* Category Items */}
                {(isCategoryExpanded || !isVisuallyExpanded || searchQuery) && (
                  <div className="space-y-1">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const customTheme = item.colorTheme;
                      const themedFallback = getThemedIconStyle(item.id, iconTheme, iconAnimation);

                      return (
                        <div key={item.id} className="relative group">
                          <button
                            onClick={() => {
                              onSelectTab(item.id);
                              onCloseMobile();
                            }}
                            type="button"
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 text-left relative overflow-hidden cursor-pointer ${
                              isActive
                                ? `${themedFallback.activeBg} text-white shadow-[0_0_22px_rgba(99,102,241,0.35)] border border-white/30 font-black`
                                : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/80 border border-transparent hover:border-indigo-300/50 dark:hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.18)]"
                            } ${!isVisuallyExpanded ? "justify-center px-0" : ""}`}
                          >
                            {/* Active Glowing Indicator Bar */}
                            {isActive && (
                              <div
                                className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-300 shadow-[0_0_10px_#22d3ee]"
                              />
                            )}

                            {/* Context-Aware Colorized Icon Container */}
                            <div className="relative shrink-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                                  isActive
                                    ? "bg-white/20 text-white ring-1 ring-white/40 shadow-xs"
                                    : `${themedFallback.bgGradient} ${themedFallback.borderColor} border ${themedFallback.glowShadow}`
                                }`}
                              >
                                <Icon
                                  className={`w-3.5 h-3.5 transition-all duration-300 ${
                                    isActive
                                      ? "text-white filter drop-shadow(0 0 4px rgba(255,255,255,0.8))"
                                      : `${themedFallback.iconColor} ${themedFallback.animClass}`
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Label & Colorful Badge */}
                            {isVisuallyExpanded && (
                              <div className="flex-1 flex items-center justify-between min-w-0">
                                <span className="truncate">{item.label}</span>
                                {item.badge && (
                                  <span
                                    className={`ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 transition-all duration-200 ${
                                      isActive
                                        ? "bg-white/25 text-white shadow-xs"
                                        : item.badgeColor || themedFallback.badgeClass || "bg-indigo-500/15 text-indigo-600 dark:text-cyan-400 border border-indigo-500/20"
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            )}
                          </button>

                          {/* Hover Tooltip Flyout for Collapsed State */}
                          {isCollapsed && !isHovered && (
                            <div className="fixed left-20 ml-2 hidden group-hover:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 z-50 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="px-1 py-0.2 rounded text-[8px] bg-cyan-500 text-slate-950 font-black">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400 font-medium">
              কোনো মডিউল বা মেনু খুঁজে পাওয়া যায়নি
            </div>
          )}
        </div>

        {/* 4. FOOTER CONTROLS & THEME STUDIO */}
        <div className="relative z-10 p-3 border-t border-slate-200/80 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-950/40 space-y-2">
          <button
            onClick={() => setIconModalOpen(true)}
            type="button"
            className={`w-full flex items-center gap-2 p-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 text-slate-800 dark:text-slate-200 border border-indigo-500/20 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              !isVisuallyExpanded ? "justify-center" : ""
            }`}
            title="আইকন থিম ও অ্যানিমেশন স্টুডিও"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Palette className="w-3 h-3 text-white" />
            </div>
            {isVisuallyExpanded && (
              <div className="flex-1 text-left min-w-0">
                <div className="text-[11px] font-black text-slate-900 dark:text-white flex items-center justify-between">
                  <span className="truncate">আইকন থিম স্টুডিও</span>
                  <span className="text-[9px] px-1.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold">
                    {currentIconTheme.nameBangla.split(" ")[0]}
                  </span>
                </div>
              </div>
            )}
          </button>

          {isVisuallyExpanded ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  AD
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-[0_0_6px_#10b981]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                  ইনস্টিটিউশনাল অ্যাডমিন
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  EIIN 132244 • পঞ্চগড়
                </div>
              </div>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  AD
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-[0_0_6px_#10b981]" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Icon Theme Selector Modal */}
      <IconThemeSelectorModal
        isOpen={iconModalOpen}
        onClose={() => setIconModalOpen(false)}
      />
    </>
  );
}
