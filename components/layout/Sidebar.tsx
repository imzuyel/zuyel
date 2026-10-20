"use client";

import React from "react";
import {
  LayoutDashboard,
  Sparkles,
  School,
  Cpu,
  Users,
  Image as ImageIcon,
  MapPin,
  CreditCard,
  Award,
  Clock,
  Calendar,
  CalendarCheck,
  FileText,
  Database,
  Bell,
  X,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Zap,
  Layers,
  Plus,
  BookOpen,
  Globe,
  RefreshCw,
} from "lucide-react";
import AnimatedGears from "../common/AnimatedGears";

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}: SidebarProps) {
  // Navigation items with individually assigned COLORFUL icons and glowing backgrounds
  const navSections = [
    {
      title: "🎓 স্টুডেন্ট ফ্রন্টএন্ড (Student Portal)",
      items: [
        {
          id: "student_live_frontend",
          label: "স্টুডেন্ট লাইভ কুইজ (Join & Play)",
          icon: Award,
          iconBg: "bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]",
          badge: "লাইভ",
          badgeColor: "bg-emerald-500 text-white font-black shadow-xs",
        },
      ],
    },
    {
      title: "দৈনিক কার্যক্রম (Daily Operations)",
      items: [
        {
          id: "dashboard",
          label: "ড্যাশবোর্ড ওভারভিউ",
          icon: LayoutDashboard,
          iconBg: "bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]",
          badge: "Live",
          badgeColor: "bg-indigo-600 text-white font-black shadow-xs",
        },
        {
          id: "students",
          label: "শিক্ষার্থী ব্যবস্থাপনা",
          icon: Users,
          iconBg: "bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]",
        },
        {
          id: "attendance",
          label: "দৈনিক ডিজিটাল হাজিরা",
          icon: CalendarCheck,
          iconBg: "bg-gradient-to-tr from-emerald-500 via-green-500 to-lime-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        },
        {
          id: "attendance_report",
          label: "উপস্থিতি রিপোর্ট ও বিশ্লেষণ",
          icon: FileCheck,
          iconBg: "bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]",
        },
        {
          id: "excel_wizard",
          label: "স্মার্ট এক্সেল উইজার্ড",
          icon: FileText,
          iconBg: "bg-gradient-to-tr from-teal-600 via-emerald-600 to-green-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)]",
        },
      ],
    },
    {
      title: "🌐 ওয়েবসাইট সিএমএস (Website CMS)",
      items: [
        {
          id: "cms_management",
          label: "সিএমএস কন্ট্রোল প্যানেল",
          icon: Globe,
          iconBg: "bg-gradient-to-tr from-orange-500 via-red-500 to-rose-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]",
        },
      ],
    },
    {
      title: "লাইভ কুইজ এরিনা (Live Quiz Arena)",
      items: [
        {
          id: "live_quiz_dashboard",
          label: "কুইজ ড্যাশবোর্ড ওভারভিউ",
          icon: LayoutDashboard,
          iconBg: "bg-gradient-to-tr from-pink-600 via-fuchsia-600 to-purple-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]",
        },
        {
          id: "live_quiz_my_quizzes",
          label: "আমার কুইজসমূহ",
          icon: Layers,
          iconBg: "bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]",
        },
        {
          id: "live_quiz_create",
          label: "নতুন কুইজ তৈরি",
          icon: Plus,
          iconBg: "bg-gradient-to-tr from-lime-400 via-emerald-500 to-teal-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(163,230,53,0.4)]",
        },
        {
          id: "live_quiz_bank",
          label: "কুইজ প্রশ্ন ব্যাংক",
          icon: BookOpen,
          iconBg: "bg-gradient-to-tr from-amber-400 via-yellow-500 to-orange-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        },
        {
          id: "live_quiz_ai_generator",
          label: "এআই কোয়েশ্চেন জেনারেটর",
          icon: Sparkles,
          iconBg: "bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]",
          badge: "AI",
          badgeColor: "bg-indigo-600 text-white font-black shadow-xs",
        },
        {
          id: "live_quiz_eligibility",
          label: "যোগ্যতা ইঞ্জিন",
          icon: ShieldCheck,
          iconBg: "bg-gradient-to-tr from-rose-500 via-red-600 to-pink-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]",
        },
      ],
    },
    {
      title: "কারিগরি ও প্রাতিষ্ঠানিক (Academics)",
      items: [
        {
          id: "classes_trades",
          label: "শ্রেণি ও কারিগরি ট্রেড",
          icon: Cpu,
          iconBg: "bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]",
        },
        {
          id: "subjects",
          label: "বিষয় ও পাঠ্যক্রম ব্যবস্থাপনা",
          icon: Award,
          iconBg: "bg-gradient-to-tr from-purple-700 via-indigo-600 to-blue-600 text-white shadow-[0_0_15px_rgba(126,34,206,0.4)]",
        },
        {
          id: "examination_management",
          label: "পরীক্ষা ও সামগ্রিক মূল্যায়ন",
          icon: Award,
          iconBg: "bg-gradient-to-tr from-yellow-500 via-amber-500 to-red-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(234,179,8,0.4)]",
        },
        {
          id: "student_lifecycle",
          label: "একাডেমিক লাইফসাইকেল",
          icon: RefreshCw,
          iconBg: "bg-gradient-to-tr from-teal-400 via-cyan-500 to-sky-600 text-white shadow-[0_0_15px_rgba(45,212,191,0.4)]",
        },
        {
          id: "academic_structure",
          label: "কারিগরি ল্যাব ও ওয়ার্কশপ",
          icon: Zap,
          iconBg: "bg-gradient-to-tr from-blue-600 via-indigo-700 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]",
        },
        {
          id: "routine",
          label: "উন্নত ক্লাস রুটিন",
          icon: Clock,
          iconBg: "bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        },
        {
          id: "attendance_khata",
          label: "বার্ষিক ছাত্র হাজিরা খাতা",
          icon: Calendar,
          iconBg: "bg-gradient-to-tr from-emerald-600 via-teal-700 to-cyan-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        },
      ],
    },
    {
      title: "স্মার্ট ডিজিটাল সেবা (Smart Services)",
      items: [
        {
          id: "student_id_hub",
          label: "স্মার্ট স্টুডেন্ট আইডি হাব",
          icon: ShieldCheck,
          iconBg: "bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]",
        },
        {
          id: "id_cards",
          label: "স্মার্ট আইডি কার্ড স্টুডিও",
          icon: CreditCard,
          iconBg: "bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-rose-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]",
        },
        {
          id: "bangla_documents",
          label: "সনদপত্র ও প্রত্যয়নপত্র",
          icon: FileText,
          iconBg: "bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]",
        },
        {
          id: "public_results",
          label: "ফলাফল ও নম্বরপত্র",
          icon: Award,
          iconBg: "bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        },
        {
          id: "faculty_staff",
          label: "কর্মকর্তা-কর্মচারী ডিরেক্টরি",
          icon: Users,
          iconBg: "bg-gradient-to-tr from-teal-500 via-emerald-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)]",
        },
        {
          id: "about_campus",
          label: "প্রতিষ্ঠান পরিচিতি",
          icon: School,
          iconBg: "bg-gradient-to-tr from-emerald-500 via-lime-500 to-teal-600 text-slate-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        },
        {
          id: "mysql_workbench",
          label: "ডাটাবেস স্টুডিও (MySQL)",
          icon: Database,
          iconBg: "bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]",
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Main Responsive Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Institutional Header */}
        <div className="relative p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 p-0.5 shadow-[0_0_20px_rgba(99,102,241,0.5)] ring-2 ring-indigo-400/40 shrink-0">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-white">
                <span className="font-black text-xs tracking-tighter">PTSC</span>
              </div>
            </div>

            <div>
              <h2 className="font-black text-xs text-slate-900 dark:text-white leading-tight">
                পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
              </h2>
              <span className="font-mono text-[10px] text-teal-700 dark:text-cyan-400 font-bold">
                EIIN: ১৩২২৪৪ • BTEB
              </span>
            </div>
          </div>

          {/* Close for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 block">
                {section.title}
              </span>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full px-3 py-2.5 rounded-2xl flex items-center justify-between transition-all duration-300 group relative overflow-hidden ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-teal-50/40 dark:from-indigo-950/80 dark:via-slate-800/90 dark:to-cyan-950/40 font-black text-indigo-950 dark:text-cyan-300 shadow-[0_0_22px_rgba(99,102,241,0.28)] border border-indigo-300/80 dark:border-cyan-500/60"
                          : "hover:bg-gradient-to-r hover:from-slate-50 hover:to-indigo-50/30 dark:hover:from-slate-800/80 dark:hover:to-slate-800/40 text-slate-700 dark:text-slate-300 font-semibold border border-transparent hover:border-indigo-200/60 dark:hover:border-indigo-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                      }`}
                    >
                      {/* Active Left Light Bar Glow */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 via-indigo-500 to-purple-500 shadow-[0_0_12px_#22d3ee]" />
                      )}

                      {/* Left: Colorful Icon Container & Label with Glow */}
                      <div className="flex items-center gap-3 truncate">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-115 group-hover:rotate-6 shrink-0 ${
                            item.iconBg
                          } ${isActive ? "ring-2 ring-white/60 shadow-[0_0_18px_rgba(255,255,255,0.5)] scale-105" : "shadow-xs"}`}
                        >
                          <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                        </span>
                        <span className="truncate text-xs group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors">
                          {item.label}
                        </span>
                      </div>

                      {/* Right: Pill Badge or Chevron */}
                      {item.badge ? (
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ml-1.5 transition-transform group-hover:scale-105 shadow-xs ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${
                            isActive
                              ? "text-indigo-600 dark:text-cyan-400"
                              : "text-slate-400 opacity-0 group-hover:opacity-100"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Technical Widget with Animated Gears and Luminous Glow */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white flex items-center justify-between border border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.25)] relative overflow-hidden">
            <div className="space-y-0.5 relative z-10">
              <span className="text-[10px] font-mono text-cyan-300 block font-bold">
                Smart Technical Campus
              </span>
              <span className="text-xs font-black block">৪র্থ শিল্পবিপ্লব প্রস্তুতি</span>
            </div>

            <div className="relative z-10 shrink-0 opacity-80">
              <AnimatedGears size="sm" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
