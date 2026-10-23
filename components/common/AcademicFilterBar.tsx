"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import { Filter, Layers, BookOpen, Building2, Calendar, Users, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { 
  ACADEMIC_CLASSES, 
  ALL_TRADES as ACADEMIC_TRADES,
  doesClassHaveTrade,
  getApplicableTradesForClass,
  parseClassNumeric
} from "@/lib/academicStructure";
import { useGlobalAcademic } from "@/context/GlobalAcademicContext";

export { 
  ACADEMIC_CLASSES, 
  ACADEMIC_TRADES,
  doesClassHaveTrade,
  getApplicableTradesForClass,
  parseClassNumeric
};

export interface AcademicFilterState {
  department: string;
  classId: string; // "1" .. "7" or "all"
  tradeId: string; // "101" .. "204" or "all" or ""
  tradeCode: string; // "GE" | "IT-IOT" | "EE" | "AMB" | "all" or ""
  section: string; // "A" | "B" | "all"
  session: string; // "2026"
}

interface AcademicFilterBarProps {
  filter: AcademicFilterState;
  onChange: (newFilter: AcademicFilterState) => void;
  showDepartment?: boolean;
  showSection?: boolean;
  showSession?: boolean;
  showAllOption?: boolean;
  compact?: boolean;
  autoSyncWithGlobal?: boolean;
}

export const ACADEMIC_DEPARTMENTS = [
  { id: "all", name: "All Departments", nameBangla: "সকল বিভাগ" },
  { id: "General Education", name: "General Education", nameBangla: "সাধারণ শিক্ষা বিভাগ" },
  { id: "Computer & IT", name: "Computer & IT", nameBangla: "কম্পিউটার ও তথ্যপ্রযুক্তি বিভাগ" },
  { id: "Electronics", name: "Electronics", nameBangla: "ইলেকট্রনিক্স বিভাগ" },
  { id: "Electrical", name: "Electrical", nameBangla: "ইলেকট্রিক্যাল বিভাগ" },
  { id: "Apparel", name: "Apparel Manufacturing", nameBangla: "অ্যাপারেল ও টেক্সটাইল বিভাগ" },
];

export default function AcademicFilterBar({
  filter,
  onChange,
  showDepartment = true,
  showSection = true,
  showSession = true,
  showAllOption = false,
  compact = false,
  autoSyncWithGlobal = false,
}: AcademicFilterBarProps) {
  let globalCtx: ReturnType<typeof useGlobalAcademic> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    globalCtx = useGlobalAcademic();
  } catch {
    globalCtx = null;
  }

  const tradeAllowed = useMemo(() => {
    return doesClassHaveTrade(filter.classId);
  }, [filter.classId]);

  const applicableTrades = useMemo(() => {
    return getApplicableTradesForClass(filter.classId);
  }, [filter.classId]);

  const syncFromGlobal = useCallback(() => {
    if (!globalCtx) return;
    const isApplicable = doesClassHaveTrade(globalCtx.selectedClassId);
    const matched = ACADEMIC_TRADES.find((t) => String(t.id) === String(globalCtx.selectedTradeId));
    onChange({
      ...filter,
      classId: globalCtx.selectedClassId,
      session: globalCtx.academicYear,
      section: globalCtx.selectedSection,
      tradeId: isApplicable ? String(globalCtx.selectedTradeId) : "",
      tradeCode: isApplicable && matched ? matched.code : "",
    });
  }, [globalCtx, filter, onChange]);

  useEffect(() => {
    if (autoSyncWithGlobal && globalCtx) {
      syncFromGlobal();
    }
  }, [autoSyncWithGlobal]);

  // Enforce structural rule: If Class changes to 6, 7, 8 -> Reset trade Id and Code to ""
  useEffect(() => {
    if (!tradeAllowed && (filter.tradeId !== "" || filter.tradeCode !== "")) {
      onChange({
        ...filter,
        tradeId: "",
        tradeCode: "",
      });
    }
  }, [tradeAllowed, filter, onChange]);

  const handleClassChange = (newClassId: string) => {
    const isApplicable = doesClassHaveTrade(newClassId);
    onChange({
      ...filter,
      classId: newClassId,
      tradeId: isApplicable ? "all" : "",
      tradeCode: isApplicable ? "all" : "",
    });
  };

  const handleTradeChange = (newTradeId: string) => {
    if (newTradeId === "all") {
      onChange({
        ...filter,
        tradeId: "all",
        tradeCode: "all",
      });
      return;
    }
    const matched = ACADEMIC_TRADES.find((t) => String(t.id) === newTradeId);
    onChange({
      ...filter,
      tradeId: newTradeId,
      tradeCode: matched ? matched.code : "",
    });
  };

  return (
    <div
      id="academic-filter-bar"
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md no-print transition-all duration-300 ${
        compact ? "p-3.5 space-y-2.5" : "p-5 sm:p-6 space-y-4"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-cyan-400">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wide">
              একাডেমিক ফিল্টার হায়ারার্কি (Academic Filter Hierarchy)
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {globalCtx && (
            <button
              type="button"
              onClick={syncFromGlobal}
              title="গ্লোবাল একাডেমিক কন্ট্রোলের সাথে তাৎক্ষণিক সিঙ্ক করুন"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 hover:from-indigo-500/20 hover:to-cyan-500/20 border border-indigo-500/30 text-[10px] font-bold text-indigo-600 dark:text-cyan-400 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-cyan-500 animate-pulse" />
              <span>গ্লোবাল সিঙ্ক ({globalCtx.academicYear} • {globalCtx.activeClassName.split(" ")[0]} • শাখা {globalCtx.selectedSection})</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-[10px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>সেশন: ২০২৬ • BTEB</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
        {/* Session / Academic Year Filter */}
        {showSession && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>শিক্ষাবর্ষ (Academic Year)</span>
            </label>
            <select
              id="filter-session"
              value={filter.session}
              onChange={(e) => onChange({ ...filter, session: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-hidden transition-all duration-200 cursor-pointer shadow-xs"
            >
              <option value="2026">২০২৬ (চলতি শিক্ষাবর্ষ)</option>
              <option value="2025">২০২৫ (পূর্ববর্তী শিক্ষাবর্ষ)</option>
            </select>
          </div>
        )}

        {/* Class Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>শ্রেণি (Class Selection)</span>
          </label>
          <select
            id="filter-class"
            value={filter.classId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-hidden transition-all duration-200 cursor-pointer shadow-xs"
          >
            {showAllOption && <option value="all">সকল শ্রেণি (All Classes)</option>}
            {ACADEMIC_CLASSES.map((cls) => (
              <option key={cls.id} value={String(cls.id)}>
                {cls.nameBangla}
              </option>
            ))}
          </select>
        </div>

        {/* Trade Filter (Shown ONLY if Class is 9, 10, 11, or 12) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-500" />
              <span>কারিগরি ট্রেড (Trade)</span>
            </span>
            {!tradeAllowed && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 border border-amber-500/20">
                ট্রেড নেই
              </span>
            )}
          </label>
          <select
            id="filter-trade"
            disabled={!tradeAllowed}
            value={tradeAllowed ? filter.tradeId : ""}
            onChange={(e) => handleTradeChange(e.target.value)}
            className={`w-full p-2.5 rounded-xl font-bold transition-all duration-200 outline-hidden ${
              tradeAllowed
                ? "bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/50 cursor-pointer shadow-xs"
                : "bg-slate-100/80 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            {!tradeAllowed ? (
              <option value="">ট্রেড প্রযোজ্য নয় (৬ষ্ঠ-৮ম সাধারণ)</option>
            ) : (
              <>
                <option value="all">সকল ট্রেড (All Trades)</option>
                {applicableTrades.map((trade) => (
                  <option key={trade.id} value={String(trade.id)}>
                    {trade.nameBangla} ({trade.code})
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Section / Shift Filter */}
        {showSection && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>শাখা ও শিফট (Section / Shift)</span>
            </label>
            <select
              id="filter-section"
              value={filter.section}
              onChange={(e) => onChange({ ...filter, section: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-hidden transition-all duration-200 cursor-pointer shadow-xs"
            >
              {showAllOption && <option value="all">সকল শাখা (All Sections)</option>}
              <option value="A">শাখা ক (Section A - 1st Shift)</option>
              <option value="B">শাখা খ (Section B - 2nd Shift)</option>
            </select>
          </div>
        )}

        {/* Department Filter */}
        {showDepartment && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>বিভাগ (Department Context)</span>
            </label>
            <select
              id="filter-department"
              value={filter.department}
              onChange={(e) => onChange({ ...filter, department: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-hidden transition-all duration-200 cursor-pointer shadow-xs"
            >
              {ACADEMIC_DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.nameBangla}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pre-Vocational Informational Alert banner */}
      {!tradeAllowed && !compact && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 font-semibold animate-in slide-in-from-top-2 duration-300">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span>নির্ধারিত শ্রেণিটি (৬ষ্ঠ-৮ম শ্রেণি) প্রি-ভোকেশনাল স্তরের অন্তর্ভুক্ত। এই স্তরে কোনো কারিগরি ট্রেড নেই। সব শিক্ষার্থী সাধারণ বা প্রাক-কারিগরি আবশ্যিক বিষয়সমূহ অধ্যয়ন করে।</span>
        </div>
      )}
    </div>
  );
}
