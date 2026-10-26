"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getThemedIconStyle } from "@/lib/iconThemes";
import {
  GraduationCap,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import GlobalAcademicDevBar from "@/components/navigation/GlobalAcademicDevBar";
import {
  PRIMARY_NAVIGATION_GROUPS,
  isRouteActive,
  canAccessNavItem,
  NavGroupConfig,
  NavItemConfig,
} from "@/lib/navigationConfig";

export interface HierarchicalSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function HierarchicalSidebar({
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  className = "",
  mobileOpen = false,
  onCloseMobile,
}: HierarchicalSidebarProps) {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role || "student";
  const { iconTheme, iconAnimation } = useTheme();
  const pathname = usePathname();

  // Internal collapse state if uncontrolled
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // Smooth scroll active navigation item into view
  useEffect(() => {
    if (!pathname) return;
    const timer = setTimeout(() => {
      const activeEl = document.querySelector('[data-hierarchical-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname]);

  // State for collapsible navigation groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    academic_core: true,
    ai_hub: true,
    academics: true,
    students_exams: true,
    comms_output: true,
    system: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // =========================================================================
  // TASK 1: STRICT RBAC FILTERING (Zero-Trust DOM Exclusion)
  // =========================================================================
  // Unauthorized links are completely filtered out and NEVER rendered in the DOM.
  const rbacFilteredGroups: NavGroupConfig[] = useMemo(() => {
    return PRIMARY_NAVIGATION_GROUPS.map((group) => {
      // Check group-level permissions if specified
      if (group.roles && !canAccessNavItem(group.roles, userRole)) {
        return null;
      }

      // Filter each item strictly by user role
      const authorizedItems = group.items.filter((item) =>
        canAccessNavItem(item.roles, userRole)
      );

      // If no items remain in this group for the user's role, eliminate the group
      if (authorizedItems.length === 0) {
        return null;
      }

      return {
        ...group,
        items: authorizedItems,
      };
    }).filter(Boolean) as NavGroupConfig[];
  }, [userRole]);

  // =========================================================================
  // TASK 2: SMART ACTIVE STATE & AUTO-EXPAND FOR NESTED ROUTES
  // =========================================================================
  useEffect(() => {
    rbacFilteredGroups.forEach((group) => {
      if (group.items.some((item) => isRouteActive(pathname, item.href))) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });

    const timer = setTimeout(() => {
      const activeEl = document.querySelector('[data-hierarchical-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname, rbacFilteredGroups]);

  // Search filter applied on top of RBAC-filtered items
  const displayGroups = useMemo(() => {
    if (!searchQuery.trim()) return rbacFilteredGroups;
    const q = searchQuery.toLowerCase().trim();

    return rbacFilteredGroups
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
      .filter(Boolean) as NavGroupConfig[];
  }, [rbacFilteredGroups, searchQuery]);

  // Content renderer helper (used in both desktop aside and mobile drawer)
  const renderNavContent = (isExpanded: boolean, onNavClick?: () => void) => (
    <>
      {/* 1. BRAND HEADER & TOGGLE BUTTON */}
      <div
        className={`shrink-0 flex items-center border-b border-slate-800/90 pb-3 mb-2.5 transition-all ${
          !isExpanded ? "flex-col justify-center gap-2 px-1" : "justify-between gap-3 px-1"
        }`}
      >
        <Link
          href="/admin"
          onClick={onNavClick}
          className={`flex items-center gap-2.5 min-w-0 group cursor-pointer ${
            !isExpanded ? "justify-center" : ""
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20 shrink-0 group-hover:scale-105 transition-transform duration-200">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>

          {isExpanded && (
            <div className="overflow-hidden min-w-0 transition-opacity duration-200">
              <h1 className="font-black text-white text-xs tracking-tight truncate group-hover:text-cyan-300 transition-colors">
                PTSC ERP System
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                পঞ্চগড় টেকনিক্যাল স্কুল ও কলেজ
              </p>
            </div>
          )}
        </Link>

        {/* Toggle Collapse Button (Desktop Only) */}
        {!onNavClick && (
          <button
            onClick={handleToggle}
            type="button"
            title={!isExpanded ? "সাইডবার বড় করুন (Expand)" : "সাইডবার ছোট করুন (Collapse)"}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800/80 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow-xs"
            aria-label={!isExpanded ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {!isExpanded ? (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            )}
          </button>
        )}

        {/* Close Button for Mobile Drawer */}
        {onNavClick && (
          <button
            onClick={onNavClick}
            type="button"
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. SEARCH BAR */}
      {isExpanded && (
        <div className="mb-2 px-0.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="মেনু খুঁজুন..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
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

      {/* 3. SCROLLABLE NAVIGATION ITEMS */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs font-semibold pr-0.5">
        <GlobalAcademicDevBar isCollapsed={!isExpanded} />

        {displayGroups.map((group) => {
          const isOpen = openGroups[group.id] ?? true;
          const GroupIcon = group.icon;
          const hasActiveChild = group.items.some((item) => isRouteActive(pathname, item.href));

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Section Header */}
              {isExpanded ? (
                <button
                  onClick={() => group.isCollapsible && toggleGroup(group.id)}
                  type="button"
                  className={`w-full flex items-center justify-between px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${
                    hasActiveChild
                      ? "text-indigo-400 bg-indigo-950/40 border border-indigo-800/50"
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

              {/* Items in Group with Framer Motion Accordion */}
              <AnimatePresence initial={false}>
                {(isOpen || !isExpanded || searchQuery) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="space-y-1 overflow-hidden"
                  >
                    {group.items.map((item) => {
                      const active = isRouteActive(pathname, item.href);
                      const Icon = item.icon;
                      const itemId = item.href.split("/").pop() || group.id;
                      const themedStyle = getThemedIconStyle(itemId, iconTheme, iconAnimation);

                      return (
                        <div key={item.href} className="relative group/item">
                          <Link
                            href={item.href}
                            onClick={onNavClick}
                            data-hierarchical-active={active ? "true" : "false"}
                            className={`group relative flex items-center rounded-xl transition-all duration-200 overflow-hidden ${
                              !isExpanded ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
                            } ${
                              active
                                ? "bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-transparent text-white font-black border-l-4 border-indigo-500 border-y border-r border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.15)]"
                                : "text-slate-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent border-y border-r border-transparent"
                            }`}
                          >
                            {/* Context-Aware Icon with Right-Nudge Micro-interaction & Active Filled Tint */}
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
                                active
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-1 ring-indigo-400/50"
                                  : `${themedStyle.bgGradient} ${themedStyle.borderColor} border ${themedStyle.glowShadow}`
                              }`}
                            >
                              <Icon
                                className={`w-3.5 h-3.5 ${
                                  active
                                    ? "text-white fill-white/20 drop-shadow-xs"
                                    : `${themedStyle.iconColor} ${themedStyle.animClass}`
                                }`}
                              />
                            </div>

                            {/* Label with Soft Gradient Text for Active State */}
                            {isExpanded && (
                              <div className="flex-1 flex items-center justify-between min-w-0">
                                <span
                                  className={`truncate text-xs ${
                                    active
                                      ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-indigo-200 to-white font-extrabold"
                                      : "group-hover:text-white"
                                  }`}
                                >
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 transition-all ${
                                      active
                                        ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/40"
                                        : item.badgeColor ||
                                          "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            )}
                          </Link>

                          {/* Flyout Tooltip for Collapsed Mode */}
                          {isCollapsed && !isHovered && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-2xl border border-slate-700 opacity-0 pointer-events-none group-hover/item:opacity-100 transition-all duration-150 z-50 flex items-center gap-1.5">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500 text-white font-black">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {displayGroups.length === 0 && (
          <div className="p-3 text-center text-xs text-slate-500 font-medium">
            কোনো অনুমোদিত মেনু পাওয়া যায়নি
          </div>
        )}
      </div>

      {/* 4. INSTITUTION PROFILE FOOTER */}
      <div className="shrink-0 pt-3 mt-auto border-t border-slate-800/90 text-xs">
        {isExpanded ? (
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-white text-xs tracking-tight">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>PTSC ERP</span>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full text-[10px] text-emerald-400 font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>সচল (Online)</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">পঞ্চগড় সরকারি টিএসসি • EIIN: 132244</span>
            </div>
          </div>
        ) : (
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
    </>
  );

  return (
    <>
      {/* Mobile Drawer with Framer Motion Animation */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 bottom-0 left-0 w-72 sm:w-80 z-50 bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800/90 flex flex-col justify-between p-3.5 shadow-2xl md:hidden text-slate-200 select-none font-sans"
            >
              {renderNavContent(true, onCloseMobile)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Animated Sidebar with Framer Motion Layout Transitions */}
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
        aria-label="Institutional ERP Sidebar"
      >
        {renderNavContent(isVisuallyExpanded)}
      </motion.aside>
    </>
  );
}
