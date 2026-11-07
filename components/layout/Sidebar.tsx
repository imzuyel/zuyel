"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  ShieldCheck,
  MapPin,
  Database,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  Cpu,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getThemedIconStyle } from "@/lib/iconThemes";
import GlobalAcademicDevBar from "@/components/navigation/GlobalAcademicDevBar";
import {
  PRIMARY_NAVIGATION_GROUPS,
  isRouteActive,
  canAccessNavItem,
  NavGroupConfig,
  NavItemConfig,
} from "@/lib/navigationConfig";

export interface UnifiedSidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  isOpen?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export interface StorageStatusData {
  mode: "LOCAL_MEMORY" | "MYSQL_LIVE";
  configuredMode: string;
  mysqlConnected: boolean;
  counts: {
    students: number;
    courses: number;
    chapters: number;
    presentations: number;
    quizzes: number;
    liveSessions: number;
    attendanceRecords: number;
    quizResults: number;
  };
  lastSync?: number;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  isOpen,
  mobileOpen,
  onClose,
  onCloseMobile,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  className = "",
}: UnifiedSidebarProps) {
  const isMobileDrawerOpen = mobileOpen !== undefined ? mobileOpen : (isOpen || false);
  const handleCloseMobile = onCloseMobile || onClose || (() => {});

  const { currentUser } = useAuth();
  const userRole = currentUser?.role || "student";
  const { iconTheme, iconAnimation } = useTheme();
  const pathname = usePathname();

  // Internal collapse state if uncontrolled
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Storage status state
  const [storageStatus, setStorageStatus] = useState<StorageStatusData | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Load saved collapse state
  useEffect(() => {
    if (controlledCollapsed === undefined) {
      try {
        const saved = localStorage.getItem("ptsc_sidebar_collapsed");
        if (saved !== null) {
          setInternalCollapsed(saved === "true");
        }
      } catch {
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
      } catch {
        // ignore
      }
    }
  };

  // Fetch Live Storage Status & Metrics
  const fetchStorageStatus = async () => {
    try {
      const res = await fetch("/api/system/storage-status");
      const data = await res.json();
      if (data.success) {
        setStorageStatus(data);
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchStorageStatus();
    const interval = setInterval(fetchStorageStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  // 1-Click Sync to MySQL Action
  const handleSyncToMySQL = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch("/api/system/storage-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_TO_MYSQL" }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback(`✓ ${data.syncedStudents || 0} জন সিঙ্ক সম্পন্ন`);
        fetchStorageStatus();
      } else {
        setSyncFeedback(data.message || "সিঙ্ক ব্যর্থ হয়েছে");
      }
    } catch {
      setSyncFeedback("কানেকশন ত্রুটি");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // Mode Switcher Action
  const handleToggleMode = async () => {
    const nextMode = storageStatus?.mode === "MYSQL_LIVE" ? "LOCAL_MEMORY" : "AUTO";
    try {
      const res = await fetch("/api/system/storage-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SWITCH_MODE", mode: nextMode }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStorageStatus();
      }
    } catch {
      // ignore
    }
  };

  // State for collapsible navigation groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    group_dashboard: true,
    group_learning: true,
    group_students: true,
    group_analytics: true,
    group_presentations: true,
    group_quiz: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Filter groups based on search & RBAC
  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return PRIMARY_NAVIGATION_GROUPS.map((group) => {
      // Check group-level RBAC
      if (!canAccessNavItem(group.roles, userRole)) {
        return null;
      }

      // Filter items within group based on item-level RBAC & Search Query
      const matchingItems = group.items.filter((item) => {
        if (!canAccessNavItem(item.roles, userRole)) {
          return false;
        }

        if (!query) return true;

        const matchLabel = item.label.toLowerCase().includes(query);
        const matchHref = item.href.toLowerCase().includes(query);
        const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(query)) || false;

        return matchLabel || matchHref || matchKeywords;
      });

      if (matchingItems.length === 0) return null;

      return {
        ...group,
        items: matchingItems,
      };
    }).filter(Boolean) as NavGroupConfig[];
  }, [searchQuery, userRole]);

  // Dynamic live count badge resolver
  const getDynamicBadge = (href: string, defaultBadge?: string) => {
    if (href === "/results/analytics" || href === "/results") return "৬ দুর্বল টপিক";
    if (href === "/results/at-risk") return "৫ ঝুঁকিপূর্ণ";
    if (!storageStatus?.counts) return defaultBadge;
    if (href === "/students") return `${storageStatus.counts.students} Live`;
    if (href === "/learning") return `${storageStatus.counts.courses} Courses`;
    if (href === "/learning-library") return `${storageStatus.counts.chapters} Chapters`;
    if (href === "/presentations") return `${storageStatus.counts.presentations || 4} Decks`;
    if (href === "/quiz" || href === "/live-quizzes") return `${storageStatus.counts.quizzes} Quizzes`;
    return defaultBadge;
  };

  // Main Nav Content Renderer
  const renderNavContent = (isExpanded: boolean, onNavigate?: () => void) => (
    <>
      {/* 1. Header & Brand Section */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80 shrink-0">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-3 group overflow-hidden"
          title="PTSC Live Command Center"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0 border border-white/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col min-w-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-white tracking-wide truncate">
                  PTSC স্মার্ট ক্যাম্পাস
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-black border border-cyan-500/30">
                  v3.8
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold truncate">
                কারিগরি শিক্ষা ও লাইভ এরিনা
              </span>
            </motion.div>
          )}
        </Link>

        {isExpanded && (
          <button
            type="button"
            onClick={handleToggle}
            className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition cursor-pointer"
            title={isCollapsed ? "সাইডবার বড় করুন" : "সাইডবার ছোট করুন"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* 2. Global Academic Context Bar (Class -> Trade -> Subject) */}
      {isExpanded && (
        <div className="mb-2 shrink-0">
          <GlobalAcademicDevBar />
        </div>
      )}

      {/* 3. Search Filter Bar */}
      {isExpanded && (
        <div className="relative mb-3 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="মডিউল খুঁজুন (যেমন: কুইজ, হাজিরা)..."
            className="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-500/60 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* 4. Scrollable Groups Navigation List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredGroups.map((group) => {
          const isOpen = openGroups[group.id] !== false || searchQuery.length > 0;
          const GroupIcon = group.icon;

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header Button */}
              {isExpanded ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-400 hover:text-white transition rounded-xl hover:bg-slate-900/50 group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GroupIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 truncate">
                      {group.title}
                    </span>
                  </div>
                  {group.isCollapsible !== false && !searchQuery && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? "" : "-rotate-90"
                      }`}
                    />
                  )}
                </button>
              ) : (
                <div className="w-full flex justify-center py-1">
                  <div className="w-7 h-0.5 bg-slate-800 rounded-full" />
                </div>
              )}

              {/* Group Items */}
              {isOpen && (
                <div className="space-y-1 pt-0.5">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab
                      ? activeTab === item.id || activeTab === item.href
                      : isRouteActive(pathname, item.href);
                    const dynamicBadge = getDynamicBadge(item.href, item.badge);
                    const dynamicThemedStyle = getThemedIconStyle(item.id || item.href, iconTheme, iconAnimation);

                    const content = (
                      <div
                        data-hierarchical-active={isActive ? "true" : "false"}
                        className={`group relative flex items-center justify-between rounded-2xl transition-all duration-200 select-none cursor-pointer ${
                          !isExpanded
                            ? "p-2.5 justify-center"
                            : "px-3 py-2.5"
                        } ${
                          isActive
                            ? "bg-gradient-to-r from-indigo-900/50 via-slate-900/90 to-cyan-950/40 text-white font-black border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                            : "text-slate-300 hover:text-white hover:bg-slate-900/70 border border-transparent hover:border-slate-800"
                        }`}
                      >
                        {/* Left Active Glow Indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                        )}

                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                              isActive
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                                : item.theme?.iconBg || "bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-cyan-300"
                            }`}
                          >
                            <ItemIcon className={`w-4 h-4 ${dynamicThemedStyle.animClass || ""} ${dynamicThemedStyle.iconColor || ""}`} />
                          </div>

                          {isExpanded && (
                            <span className="text-xs font-bold truncate leading-tight">
                              {item.label}
                            </span>
                          )}
                        </div>

                        {/* Right Dynamic Count Badge */}
                        {isExpanded && dynamicBadge && (
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                              isActive
                                ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/60 font-mono shadow-xs"
                                : item.badgeColor || "bg-slate-800/80 text-slate-300 border-slate-700/80 font-mono"
                            }`}
                          >
                            {dynamicBadge}
                          </span>
                        )}

                        {/* Collapsed Hover Tooltip */}
                        {!isExpanded && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-2xl border border-slate-700 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50">
                            {item.label}
                            {dynamicBadge && <span className="ml-2 text-cyan-300">({dynamicBadge})</span>}
                          </div>
                        )}
                      </div>
                    );

                    // Support in-page tab switching if provided
                    if (onSelectTab) {
                      return (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => {
                            onSelectTab(item.id || item.href);
                            if (onNavigate) onNavigate();
                          }}
                          className="w-full text-left"
                        >
                          {content}
                        </button>
                      );
                    }

                    return (
                      <Link key={item.href} href={item.href} onClick={onNavigate}>
                        {content}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Storage Mode & Sync Footer Widget */}
      <div className="pt-3 mt-2 border-t border-slate-800/80 shrink-0 space-y-2">
        {isExpanded ? (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800/90 shadow-xl space-y-2.5">
            {/* Mode Indicator & Switcher */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full ${
                    storageStatus?.mode === "MYSQL_LIVE"
                      ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"
                      : "bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]"
                  }`}
                />
                <span className="text-[11px] font-black text-white truncate">
                  {storageStatus?.mode === "MYSQL_LIVE" ? "🗄️ MySQL Live DB" : "⚡ Local Memory DB"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleMode}
                className="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
                title="স্টোরেজ মোড পরিবর্তন করুন"
              >
                {storageStatus?.mode === "MYSQL_LIVE" ? "Local এ যান" : "Auto"}
              </button>
            </div>

            {/* Quick Metrics Ticker */}
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono">
              <span className="truncate">👥 স্টুডেন্ট: {storageStatus?.counts?.students || 837}</span>
              <span className="truncate">🎯 কুইজ: {storageStatus?.counts?.quizzes || 2}</span>
            </div>

            {/* 1-Click Sync to MySQL Button */}
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncToMySQL}
              className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md border ${
                storageStatus?.mode === "MYSQL_LIVE"
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40"
                  : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40"
              }`}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>সিঙ্ক হচ্ছে...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>🔄 Sync to MySQL</span>
                </>
              )}
            </button>

            {/* Sync Feedback Message */}
            {syncFeedback && (
              <p className="text-[10px] text-center font-bold text-emerald-400 animate-fade-in truncate">
                {syncFeedback}
              </p>
            )}
          </div>
        ) : (
          /* Collapsed Mini Widget */
          <div className="flex flex-col items-center justify-center gap-1.5 py-1">
            <button
              type="button"
              onClick={handleSyncToMySQL}
              disabled={isSyncing}
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 hover:bg-slate-800 transition cursor-pointer shadow-md"
              title="Sync to MySQL"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer with Framer Motion Layout Transitions */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleCloseMobile}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 bottom-0 left-0 w-72 sm:w-80 z-50 bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800/90 flex flex-col justify-between p-3.5 shadow-2xl md:hidden text-slate-200 select-none font-sans"
            >
              {renderNavContent(true, handleCloseMobile)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Animated Sidebar with Framer Motion Expand/Collapse Transitions */}
      <motion.aside
        initial={false}
        animate={{
          width: isVisuallyExpanded ? 288 : 80,
        }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isCollapsed) setIsHovered(false);
        }}
        className={`hidden md:flex h-screen max-h-screen sticky top-0 bg-slate-950/95 text-slate-200 border-r border-slate-800/90 flex-col select-none font-sans shrink-0 z-30 shadow-2xl overflow-hidden ${
          !isVisuallyExpanded ? "p-2.5" : "p-3.5"
        } ${className}`}
        aria-label="Institutional Unified Master Sidebar"
      >
        {renderNavContent(isVisuallyExpanded)}
      </motion.aside>
    </>
  );
}
