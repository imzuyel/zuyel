"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Sparkles,
  Cpu,
  Users,
  CreditCard,
  Award,
  Clock,
  Calendar,
  CalendarCheck,
  FileText,
  Database,
  X,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Zap,
  Layers,
  BookOpen,
  Globe,
  GraduationCap,
  Wrench,
  User,
  FileSpreadsheet,
} from "lucide-react";
import AnimatedGears from "../common/AnimatedGears";
import GlobalAcademicDevBar from "@/components/navigation/GlobalAcademicDevBar";
import { useAuth } from "@/context/AuthContext";
import { canAccessNavItem, AllowedRole } from "@/lib/navigationConfig";

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItemDef {
  id: string;
  label: string;
  icon: React.ElementType;
  iconBg?: string;
  badge?: string;
  badgeColor?: string;
  roles?: AllowedRole[];
}

interface NavSectionDef {
  title: string;
  roles?: AllowedRole[];
  items: NavItemDef[];
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role || "student";
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isVisuallyExpanded = !isCollapsed || isHovered;

  // Complete Central Navigation Sections with Strict Role Allocations
  const allNavSections: NavSectionDef[] = useMemo(
    () => [
      // 1. Core Setup & Academic Mapping
      {
        title: "⚙️ ১. কোর সেটআপ ও একাডেমিক ম্যাপিং",
        roles: ["admin", "teacher"],
        items: [
          {
            id: "academic_years",
            label: "শিক্ষাবর্ষ ও সেশন (Academic Years)",
            icon: Calendar,
            iconBg: "bg-indigo-600 text-white shadow-xs",
            badge: "Core",
            badgeColor: "bg-indigo-600 text-white font-black shadow-xs",
            roles: ["admin"],
          },
          {
            id: "classes_sections",
            label: "শ্রেণি ও সেকশন বিন্যাস (Classes & Sections)",
            icon: Layers,
            iconBg: "bg-cyan-600 text-white shadow-xs",
            badge: "Classes",
            badgeColor: "bg-cyan-500 text-white font-black shadow-xs",
            roles: ["admin"],
          },
          {
            id: "trades_management",
            label: "কারিগরি ট্রেড ও ভোকেশনাল সেটআপ",
            icon: Cpu,
            iconBg: "bg-amber-600 text-white shadow-xs",
            badge: "Trades",
            badgeColor: "bg-amber-500 text-slate-950 font-black shadow-xs",
            roles: ["admin"],
          },
          {
            id: "lab_inventory",
            label: "রুম ও ল্যাব কনফিগারেশন (Rooms & Labs)",
            icon: Wrench,
            iconBg: "bg-teal-600 text-white shadow-xs",
            roles: ["admin", "teacher"],
          },
          {
            id: "subjects",
            label: "বিষয় ও কারিকুলাম ম্যাপিং (Subjects)",
            icon: Award,
            iconBg: "bg-purple-600 text-white shadow-xs",
            badge: "BTEB",
            badgeColor: "bg-fuchsia-600 text-white font-black shadow-xs",
            roles: ["admin", "teacher"],
          },
          {
            id: "routine",
            label: "একাডেমিক সেশন ও রুটিন মাস্টার",
            icon: Clock,
            iconBg: "bg-blue-600 text-white shadow-xs",
            roles: ["admin", "teacher"],
          },
        ],
      },

      // 2. Student & Academic Operations
      {
        title: "👥 ২. শিক্ষার্থী ও একাডেমিক অপারেশনস",
        roles: ["all"],
        items: [
          {
            id: "students",
            label: "শিক্ষার্থী ব্যবস্থাপনা ও ভর্তি (Students)",
            icon: Users,
            iconBg: "bg-sky-600 text-white shadow-xs",
            badge: "Admin",
            badgeColor: "bg-sky-500 text-white font-black shadow-xs",
            roles: ["admin"],
          },
          {
            id: "student_promotion",
            label: "শিক্ষার্থী ব্যাচ প্রমোশন ও রোলওভার",
            icon: GraduationCap,
            iconBg: "bg-emerald-600 text-white shadow-xs",
            badge: "Promo",
            badgeColor: "bg-emerald-500 text-white font-black shadow-xs",
            roles: ["admin"],
          },
          {
            id: "attendance",
            label: "দৈনিক ডিজিটাল হাজিরা ও রেজিস্টার",
            icon: CalendarCheck,
            iconBg: "bg-teal-600 text-white shadow-xs",
            badge: "Daily",
            badgeColor: "bg-teal-500 text-white font-black shadow-xs",
            roles: ["admin", "teacher"],
          },
          {
            id: "attendance_report",
            label: "উপস্থিতি রিপোর্ট ও বিশ্লেষণ",
            icon: FileCheck,
            iconBg: "bg-cyan-600 text-white shadow-xs",
            roles: ["admin", "teacher"],
          },
          {
            id: "id_cards",
            label: "স্মার্ট শিক্ষার্থী আইডি কার্ড স্টুডিও",
            icon: CreditCard,
            iconBg: "bg-fuchsia-600 text-white shadow-xs",
            roles: ["all"],
          },
          {
            id: "bangla_documents",
            label: "সনদপত্র ও প্রত্যয়নপত্র স্টুডিও",
            icon: FileText,
            iconBg: "bg-red-600 text-white shadow-xs",
            roles: ["admin", "teacher"],
          },
        ],
      },

      // 3. Examination & Results
      {
        title: "🏆 ৩. পরীক্ষা ও ফলাফল প্রশাসন",
        roles: ["all"],
        items: [
          {
            id: "examination_management",
            label: "পরীক্ষা ব্যবস্থাপনা ও রুটিন (Exams)",
            icon: Award,
            iconBg: "bg-amber-600 text-white shadow-xs",
            roles: ["all"],
          },
          {
            id: "public_results",
            label: "নম্বরপত্র, টেবুলেশন ও ফলাফল হাব",
            icon: FileSpreadsheet,
            iconBg: "bg-yellow-600 text-white shadow-xs",
            badge: "Results",
            badgeColor: "bg-yellow-500 text-slate-950 font-black shadow-xs",
            roles: ["all"],
          },
          {
            id: "bteb_annual_ledger",
            label: "BTEB বাৎসরিক লেজার পোর্টিং",
            icon: FileText,
            iconBg: "bg-orange-600 text-white shadow-xs",
            badge: "BTEB",
            badgeColor: "bg-orange-500 text-white font-black shadow-xs",
            roles: ["admin"],
          },
        ],
      },

      // 4. Interactive Learning & Quiz Hub
      {
        title: "🧠 ৪. ইন্টারেক্টিভ লার্নিং ও কুইজ হাব",
        roles: ["all"],
        items: [
          {
            id: "course_content_builder",
            label: "অধ্যায়ভিত্তিক লার্নিং পাথ ও ক্লাস স্টুডিও",
            icon: BookOpen,
            iconBg: "bg-emerald-600 text-white shadow-xs",
            badge: "AI Studio",
            badgeColor: "bg-emerald-500 text-white font-black shadow-xs",
            roles: ["all"],
          },
          {
            id: "student_live_frontend",
            label: "🎮 লাইভ কুইজ ও মেন্টিমিটার স্টুডিও",
            icon: Sparkles,
            iconBg: "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-xs",
            badge: "Unified Hub",
            badgeColor: "bg-red-500 text-white font-black shadow-xs",
            roles: ["all"],
          },
        ],
      },

      // 5. General Reports & System Settings
      {
        title: "⚙️ ৫. সিস্টেম ও প্রোফাইল সেটিংস",
        roles: ["all"],
        items: [
          {
            id: "security_governance",
            label: "সিস্টেম সেটিংস ও নিরাপত্তা (RBAC)",
            icon: ShieldCheck,
            iconBg: "bg-rose-600 text-white shadow-xs",
            badge: "RBAC",
            badgeColor: "bg-rose-600 text-white font-black shadow-xs",
            roles: ["admin"],
          },
          {
            id: "mysql_workbench",
            label: "ডাটাবেস স্টুডিও ও অডিট লগ (MySQL)",
            icon: Database,
            iconBg: "bg-blue-600 text-white shadow-xs",
            badge: "Audit",
            badgeColor: "bg-purple-600 text-white font-black shadow-xs",
            roles: ["admin"],
          },
          {
            id: "excel_wizard",
            label: "স্মার্ট এক্সেল উইজার্ড (Excel)",
            icon: FileSpreadsheet,
            iconBg: "bg-teal-600 text-white shadow-xs",
            roles: ["admin", "teacher"],
          },
          {
            id: "cms_management",
            label: "পাবলিক ওয়েবসাইট সিএমএস",
            icon: Globe,
            iconBg: "bg-orange-600 text-white shadow-xs",
            roles: ["admin"],
          },
          {
            id: "dashboard",
            label: "মূল ড্যাশবোর্ড ওভারভিউ (Home)",
            icon: LayoutDashboard,
            iconBg: "bg-indigo-600 text-white shadow-xs",
            badge: "Live",
            badgeColor: "bg-indigo-600 text-white font-black shadow-xs",
            roles: ["all"],
          },
          {
            id: "profile",
            label: "আমার প্রোফাইল ও নিরাপত্তা",
            icon: User,
            iconBg: "bg-indigo-600 text-white shadow-xs",
            roles: ["all"],
          },
        ],
      },
    ],
    []
  );

  // =========================================================================
  // TASK 1: STRICT RBAC FILTERING (Zero-Trust DOM Exclusion)
  // =========================================================================
  const rbacFilteredSections = useMemo(() => {
    return allNavSections
      .map((section) => {
        if (section.roles && !canAccessNavItem(section.roles, userRole)) {
          return null;
        }

        const filteredItems = section.items.filter((item) =>
          canAccessNavItem(item.roles, userRole)
        );

        if (filteredItems.length === 0) {
          return null;
        }

        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter(Boolean) as NavSectionDef[];
  }, [allNavSections, userRole]);

  // TASK 1: Auto smooth-scroll active menu item into view
  useEffect(() => {
    if (!activeTab) return;
    const timer = setTimeout(() => {
      const activeEl =
        document.querySelector(`[data-sidebar-tab="${activeTab}"]`) ||
        ((activeTab === "learning" || activeTab.startsWith("learning"))
          ? document.querySelector(`[data-sidebar-tab="course_content_builder"]`)
          : (activeTab === "live-quizzes" || activeTab === "quiz" || activeTab === "live_quizzes" || activeTab === "tournaments" || activeTab === "question_bank" || activeTab.startsWith("quiz"))
          ? document.querySelector(`[data-sidebar-tab="quiz_studio"]`)
          : null);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const renderContent = (isExpanded: boolean, onNavClose?: () => void) => (
    <>
      {/* Top Institutional Header */}
      <div className="relative p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 p-0.5 shadow-md ring-2 ring-indigo-400/40 shrink-0">
            <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-white">
              <span className="font-black text-xs tracking-tighter">PTSC</span>
            </div>
          </div>

          {isExpanded && (
            <div className="min-w-0">
              <h2 className="font-black text-xs text-slate-900 dark:text-white leading-tight truncate">
                পঞ্চগড় সরকারি টিএসসি (PTSC)
              </h2>
              <span className="font-mono text-[10px] text-teal-700 dark:text-cyan-400 font-bold block truncate">
                EIIN: ১৩২২৪৪ • BTEB
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        {!onNavClose && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            type="button"
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 cursor-pointer hidden md:flex"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Mobile Close Button */}
        {onNavClose && (
          <button
            onClick={onNavClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 md:hidden cursor-pointer"
            aria-label="Close Mobile Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs select-none">
        <GlobalAcademicDevBar isCollapsed={!isExpanded} />

        {rbacFilteredSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {isExpanded && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 block">
                {section.title}
              </span>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.id ||
                  (item.id === "course_content_builder" &&
                    (activeTab === "learning" || activeTab.startsWith("learning")));

                return (
                  <button
                    key={item.id}
                    data-sidebar-tab={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onNavClose) onNavClose();
                    }}
                    className={`w-full group relative flex items-center transition-all duration-200 overflow-hidden cursor-pointer rounded-xl ${
                      !isExpanded ? "justify-center p-2.5" : "px-3 py-2 justify-between"
                    } ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-transparent text-slate-900 dark:text-white font-extrabold border-l-4 border-indigo-500 border-y border-r border-indigo-500/30 shadow-[0_0_12px_rgba(79,70,229,0.12)]"
                        : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/5 border-l-4 border-transparent border-y border-r border-transparent font-medium"
                    }`}
                  >
                    {/* Left Icon with Micro-interaction (group-hover:translate-x-1) & Active Primary Color */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-1 ring-indigo-400/50"
                            : item.iconBg || "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-white fill-white/20 drop-shadow-xs" : ""
                          }`}
                        />
                      </span>

                      {/* Label with Soft Gradient Text for Active State */}
                      {isExpanded && (
                        <span
                          className={`truncate text-xs text-left ${
                            isActive
                              ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-300 dark:via-indigo-200 dark:to-cyan-200 font-extrabold"
                              : "group-hover:text-indigo-600 dark:group-hover:text-cyan-300"
                          }`}
                        >
                          {item.label}
                        </span>
                      )}
                    </div>

                    {/* Right Badge or Chevron */}
                    {isExpanded && (
                      <div className="shrink-0 ml-2">
                        {item.badge ? (
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              isActive
                                ? "bg-indigo-600 text-white"
                                : item.badgeColor || "bg-indigo-500 text-white"
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : (
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1 ${
                              isActive
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-slate-400 opacity-0 group-hover:opacity-100"
                            }`}
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Technical Widget */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        {isExpanded ? (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white flex items-center justify-between border border-indigo-500/30 shadow-sm relative overflow-hidden">
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
        ) : (
          <div className="flex items-center justify-center py-1">
            <AnimatedGears size="sm" />
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer with Framer Motion Layout Transitions */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 bottom-0 left-0 w-72 sm:w-80 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-2xl md:hidden"
            >
              {renderContent(true, onClose)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Animated Sidebar with Framer Motion Expand/Collapse Transitions */}
      <motion.aside
        initial={false}
        animate={{
          width: isVisuallyExpanded ? 320 : 80,
        }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isCollapsed) setIsHovered(false);
        }}
        className="hidden md:flex fixed top-0 bottom-0 left-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800 flex-col justify-between shadow-xs overflow-hidden"
      >
        {renderContent(isVisuallyExpanded)}
      </motion.aside>
    </>
  );
}
