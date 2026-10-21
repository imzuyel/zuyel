"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { getThemedIconStyle } from "@/lib/iconThemes";
import {
  GraduationCap,
  LayoutDashboard,
  Calendar,
  Clock,
  Sparkles,
  Bot,
  FileText,
  Radio,
  Users,
  Award,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  CalendarCheck,
  Printer,
  Sliders,
  ShieldCheck,
  MapPin,
  Search,
  X,
  CreditCard,
  Layers,
  BarChart3,
  Edit3,
} from "lucide-react";

export interface HierarchicalSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  keywords?: string[];
  theme: {
    iconText: string;
    iconBg: string;
    activeBg: string;
    activeBorder: string;
    activeText: string;
    indicatorColor: string;
    glowShadow: string;
  };
}

interface NavGroup {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
  items: NavItem[];
}

export default function HierarchicalSidebar({
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  className = "",
}: HierarchicalSidebarProps) {
  const { iconTheme, iconAnimation } = useTheme();
  const pathname = usePathname();

  // Internal collapse state if uncontrolled
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sync with localStorage on client mount if uncontrolled
  useEffect(() => {
    if (controlledCollapsed === undefined) {
      try {
        const saved = localStorage.getItem("ptsc_sidebar_collapsed");
        if (saved !== null) {
          setInternalCollapsed(saved === "true");
        }
      } catch (e) {
        // ignore
      }
    }
  }, [controlledCollapsed]);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const isVisuallyExpanded = !isCollapsed || isHovered;

  const handleToggle = () => {
    setIsHovered(false);
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      try {
        localStorage.setItem("ptsc_sidebar_collapsed", String(next));
      } catch (e) {
        // ignore
      }
    }
  };

  // State for collapsible navigation groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    ai_hub: true,
    academics: true,
    students_exams: true,
    system: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  // Navigation Hierarchical Structure with Distinct Colorful Icons & Micro-interactions
  const navigationGroups: NavGroup[] = useMemo(
    () => [
      {
        id: "main_overview",
        title: "১. প্রধান ওভারভিউ",
        icon: LayoutDashboard,
        items: [
          {
            href: "/admin",
            label: "মূল ড্যাশবোর্ড",
            icon: LayoutDashboard,
            badge: "লাইভ",
            badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
            keywords: ["dashboard", "overview", "ড্যাশবোর্ড"],
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
      {
        id: "ai_hub",
        title: "২. AI কুইজ ও কন্টেন্ট স্টুডিও",
        subtitle: "AI Power Hub",
        icon: Sparkles,
        isCollapsible: true,
        items: [
          {
            href: "/ai/generator",
            label: "AI প্রশ্নপত্র জেনারেটর",
            icon: Bot,
            badge: "AI Studio",
            badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
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
            label: "লাইভ কুইজ এরিনা ও লবি",
            icon: Radio,
            badge: "Live Arena",
            badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
            keywords: ["quiz", "live", "arena", "কুইজ"],
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
        ],
      },
      {
        id: "academics",
        title: "৩. ক্লাস, রুটিন ও হাজিরা",
        subtitle: "Operations",
        icon: Calendar,
        isCollapsible: true,
        items: [
          {
            href: "/routine/master",
            label: "মাস্টার রুটিন স্টুডিও",
            icon: Calendar,
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
        title: "৪. শিক্ষার্থী ও পরীক্ষা ব্যবস্থাপনা",
        subtitle: "Students & BTEB",
        icon: Users,
        isCollapsible: true,
        items: [
          {
            href: "/students",
            label: "শিক্ষার্থী ডাটাবেজ ও ভর্তি",
            icon: Users,
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
        items: [
          {
            href: "/communication/sms",
            label: "এসএমএস ও নোটিশ বোর্ড",
            icon: MessageSquare,
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
        title: "৬. গ্লোবাল সেটিংস ও AI পাইপলাইন",
        subtitle: "Global System",
        icon: Sliders,
        isCollapsible: true,
        items: [
          {
            href: "/academic/settings",
            label: "গ্লোবাল বিষয় ও শ্রেণি ম্যাপিং",
            icon: Sliders,
            keywords: ["global", "settings", "academic", "ম্যাপিং"],
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
            href: "/admin/ai-settings",
            label: "AI পাইপলাইন সেটিংস",
            icon: Sparkles,
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
        ],
      },
    ],
    []
  );

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return navigationGroups;
    const q = searchQuery.toLowerCase().trim();

    return navigationGroups
      .map((group) => {
        const matchesGroupTitle = group.title.toLowerCase().includes(q);
        const matchingItems = group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.keywords?.some((k) => k.toLowerCase().includes(q))
        );

        if (matchesGroupTitle || matchingItems.length > 0) {
          return {
            ...group,
            items: matchesGroupTitle ? group.items : matchingItems,
          };
        }
        return null;
      })
      .filter(Boolean) as NavGroup[];
  }, [navigationGroups, searchQuery]);

  return (
    <aside
      onMouseEnter={() => {
        if (isCollapsed) setIsHovered(true);
      }}
      onMouseLeave={() => {
        if (isCollapsed) setIsHovered(false);
      }}
      className={`bg-slate-950 text-slate-200 h-screen max-h-screen sticky top-0 border-r border-slate-800/90 flex flex-col select-none font-sans shrink-0 transition-all duration-300 ease-in-out z-30 shadow-2xl ${
        !isVisuallyExpanded ? "w-20 p-2.5" : "w-72 p-3.5"
      } ${className}`}
      aria-label="Institutional ERP Sidebar"
    >
      {/* 1. BRAND HEADER & TOGGLE BUTTON */}
      <div
        className={`shrink-0 flex items-center border-b border-slate-800/90 pb-3 mb-2.5 transition-all ${
          !isVisuallyExpanded ? "flex-col justify-center gap-2 px-1" : "justify-between gap-3 px-1"
        }`}
      >
        <Link
          href="/admin"
          className={`flex items-center gap-2.5 min-w-0 group cursor-pointer ${!isVisuallyExpanded ? "justify-center" : ""}`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20 shrink-0 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>

          {isVisuallyExpanded && (
            <div className="overflow-hidden min-w-0 transition-opacity duration-200">
              <h1 className="font-black text-white text-xs tracking-tight truncate group-hover:text-cyan-300 transition-colors">
                PTSC ERP System
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate">পঞ্চগড় টেকনিক্যাল স্কুল ও কলেজ</p>
            </div>
          )}
        </Link>

        {/* Toggle Collapse Button */}
        <button
          onClick={handleToggle}
          type="button"
          title={!isVisuallyExpanded ? "সাইডবার বড় করুন (Expand)" : "সাইডবার ছোট করুন (Collapse)"}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800/80 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow-xs"
          aria-label={!isVisuallyExpanded ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {!isVisuallyExpanded ? (
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          )}
        </button>
      </div>

      {/* 2. INSTANT SEARCH BAR */}
      {isVisuallyExpanded && (
        <div className="mb-2 px-0.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="মেনু খুঁজুন..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. SCROLLABLE CATEGORIZED NAVIGATION BODY */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs font-semibold pr-0.5">
        {filteredGroups.map((group) => {
          const isOpen = openGroups[group.id] ?? true;
          const GroupIcon = group.icon;
          const hasActiveChild = group.items.some((item) => isActive(item.href));

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Section Header */}
              {isVisuallyExpanded ? (
                <button
                  onClick={() => group.isCollapsible && toggleGroup(group.id)}
                  type="button"
                  className={`w-full flex items-center justify-between px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${
                    hasActiveChild
                      ? "text-cyan-400 bg-cyan-950/30 border border-cyan-800/40"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <GroupIcon className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{group.title}</span>
                  </div>

                  {group.isCollapsible && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
              ) : (
                <div className="my-1.5 mx-auto w-5 border-b border-slate-800" />
              )}

              {/* Items in Group */}
              {(isOpen || !isVisuallyExpanded || searchQuery) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    const itemId = item.href.split("/").pop() || group.id;
                    const themedStyle = getThemedIconStyle(itemId, iconTheme, iconAnimation);

                    return (
                      <div key={item.href} className="relative group/item">
                        <Link
                          href={item.href}
                          className={`flex items-center rounded-xl transition-all duration-300 relative overflow-hidden ${
                            !isVisuallyExpanded ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
                          } ${
                            active
                              ? `${themedStyle.activeBg} text-white font-black border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.35)]`
                              : "text-slate-300 hover:text-white hover:bg-slate-900/90 border border-transparent hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                          }`}
                        >
                          {/* Active Glowing Left Bar Indicator */}
                          {active && (
                            <div
                              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-300 shadow-[0_0_10px_#22d3ee]"
                            />
                          )}

                          {/* Context-Aware Colorized Icon Container */}
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover/item:scale-110 group-hover/item:rotate-3 ${
                              active
                                ? "bg-white/20 text-white border border-white/30 shadow-xs"
                                : `${themedStyle.bgGradient} ${themedStyle.borderColor} border ${themedStyle.glowShadow}`
                            }`}
                          >
                            <Icon
                              className={`w-3.5 h-3.5 ${
                                active
                              ? "text-white filter drop-shadow(0 0 4px rgba(255,255,255,0.8))"
                              : `${themedStyle.iconColor} ${themedStyle.animClass}`
                            }`}
                            />
                          </div>

                          {/* Label and Badge */}
                          {isVisuallyExpanded && (
                            <div className="flex-1 flex items-center justify-between min-w-0">
                              <span className="truncate">{item.label}</span>
                              {item.badge && (
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 transition-all ${
                                    active
                                      ? "bg-white/20 text-white border border-white/30"
                                      : item.badgeColor || "bg-indigo-500/20 text-cyan-300 border border-indigo-500/30"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </Link>

                        {/* Collapsed Hover Tooltip Flyout */}
                        {isCollapsed && !isHovered && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-2xl border border-slate-700 opacity-0 pointer-events-none group-hover/item:opacity-100 transition-all duration-150 z-50 flex items-center gap-1.5">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500 text-slate-950 font-black">
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

        {filteredGroups.length === 0 && (
          <div className="p-3 text-center text-xs text-slate-500 font-medium">
            কোনো মেনু পাওয়া যায়নি
          </div>
        )}
      </div>

      {/* 4. SLEEK INSTITUTION PROFILE FOOTER */}
      <div className="shrink-0 pt-3 mt-auto border-t border-slate-800/90 text-xs">
        {isVisuallyExpanded ? (
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-white text-xs tracking-tight">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>PTSC ERP</span>
              </div>

              {/* Online Status Indicator */}
              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full text-[10px] text-emerald-400 font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>সচল (Online)</span>
              </div>
            </div>

            {/* Location & Institution Details */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">পঞ্চগড় সরকারি টিএসসি • EIIN: 132244</span>
            </div>
          </div>
        ) : (
          /* Collapsed Footer */
          <div className="relative group flex items-center justify-center py-1">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 text-emerald-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-2xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50">
              PTSC ERP • সিস্টেম সচল
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
