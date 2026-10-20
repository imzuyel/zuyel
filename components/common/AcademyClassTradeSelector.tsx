"use client";

import React, { useEffect, useMemo } from "react";
import { GraduationCap, Layers, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";
import { useAcademySettings } from "@/lib/useAcademySettings";
import { AcademyTradeConfig } from "@/lib/academySettingsStore";

export interface AcademyClassTradeSelectorProps {
  selectedClass: string;
  selectedTrade: string;
  onClassChange: (newClassId: string, availableTrades: AcademyTradeConfig[]) => void;
  onTradeChange: (newTradeId: string) => void;
  showAllOption?: boolean;
  allClassLabel?: string;
  allTradeLabel?: string;
  hideTradeWhenNone?: boolean;
  classLabel?: string;
  tradeLabel?: string;
  required?: boolean;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  layout?: "horizontal" | "vertical" | "grid";
  showTierBadges?: boolean;
  showNoticeBanner?: boolean;
}

export default function AcademyClassTradeSelector({
  selectedClass,
  selectedTrade,
  onClassChange,
  onTradeChange,
  showAllOption = false,
  allClassLabel = "সকল শ্রেণি (All Classes)",
  allTradeLabel = "সকল ট্রেড (All Trades)",
  hideTradeWhenNone = false,
  classLabel = "শ্রেণি (Class)",
  tradeLabel = "কারিগরি ট্রেড (Technical Trade)",
  required = false,
  disabled = false,
  compact = false,
  className = "",
  layout = "grid",
  showTierBadges = true,
  showNoticeBanner = false,
}: AcademyClassTradeSelectorProps) {
  const { mappings, getTradesForClass, hasTrades, getMappingForClass } = useAcademySettings();

  const isClassWithTrades = useMemo(() => {
    if (selectedClass === "all" || !selectedClass) return false;
    return hasTrades(selectedClass);
  }, [selectedClass, hasTrades]);

  const availableTrades = useMemo(() => {
    if (selectedClass === "all" || !selectedClass) return [];
    return getTradesForClass(selectedClass);
  }, [selectedClass, getTradesForClass]);

  const currentClassMapping = useMemo(() => {
    return getMappingForClass(selectedClass);
  }, [selectedClass, getMappingForClass]);

  // Handle Class Change with strict conditional logic
  const handleClassSelection = (newClassId: string) => {
    const trades = getTradesForClass(newClassId);
    const requiresTrade = hasTrades(newClassId);

    onClassChange(newClassId, trades);

    if (newClassId === "all") {
      onTradeChange("all");
      return;
    }

    if (!requiresTrade) {
      // Classes 6, 7, 8: Reset to General / None
      onTradeChange(showAllOption ? "all" : "General");
    } else {
      // Classes 9-12: If current trade is not valid for the new class, auto-select first valid trade
      const isCurrentTradeValid = trades.some(
        (t) =>
          t.id.toLowerCase() === selectedTrade.toLowerCase() ||
          t.code.toLowerCase() === selectedTrade.toLowerCase()
      );

      if (!isCurrentTradeValid) {
        if (showAllOption && selectedTrade === "all") {
          onTradeChange("all");
        } else if (trades.length > 0) {
          onTradeChange(trades[0].id);
        } else {
          onTradeChange("");
        }
      }
    }
  };

  const layoutClasses =
    layout === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
      : layout === "horizontal"
      ? "flex flex-col sm:flex-row items-center gap-3"
      : "flex flex-col gap-3";

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className={layoutClasses}>
        {/* 1. CLASS DROPDOWN */}
        <div className="w-full space-y-1.5">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              <span>{classLabel}</span>
              {required && <span className="text-rose-500">*</span>}
            </span>
            {showTierBadges && currentClassMapping && (
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                  currentClassMapping.tier === "Pre-Vocational"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50"
                    : currentClassMapping.tier === "SSC (Vocational)"
                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/50"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50"
                }`}
              >
                {currentClassMapping.tier}
              </span>
            )}
          </label>

          <select
            value={selectedClass}
            disabled={disabled}
            onChange={(e) => handleClassSelection(e.target.value)}
            className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white transition-all outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
              compact ? "p-2 text-xs" : "p-2.5 text-xs sm:text-sm"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {showAllOption && <option value="all">{allClassLabel}</option>}
            {mappings.map((mapping) => (
              <option key={mapping.id} value={mapping.id}>
                {mapping.nameBangla}
              </option>
            ))}
          </select>
        </div>

        {/* 2. DYNAMIC CONDITIONAL TRADE DROPDOWN */}
        {!(hideTradeWhenNone && !isClassWithTrades && selectedClass !== "all") && (
          <div className="w-full space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>{tradeLabel}</span>
                {required && isClassWithTrades && <span className="text-rose-500">*</span>}
              </span>
              {!isClassWithTrades && selectedClass !== "all" && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  ট্রেড প্রযোজ্য নয়
                </span>
              )}
            </label>

            {/* If Class 6, 7, or 8 (Pre-Vocational) -> Display locked/informational message */}
            {!isClassWithTrades && selectedClass !== "all" ? (
              <div
                className={`w-full flex items-center justify-between rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 font-bold select-none ${
                  compact ? "p-2 text-xs" : "p-2.5 text-xs sm:text-sm"
                }`}
              >
                <span>সাধারণ পাঠ্যক্রম (ট্রেড প্রযোজ্য নয়)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                  ৬ষ্ঠ-৮ম
                </span>
              </div>
            ) : (
              <select
                value={selectedTrade}
                disabled={disabled}
                onChange={(e) => onTradeChange(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white transition-all outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                  compact ? "p-2 text-xs" : "p-2.5 text-xs sm:text-sm"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {showAllOption && <option value="all">{allTradeLabel}</option>}
                {availableTrades.length > 0 ? (
                  availableTrades.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon ? `${t.icon} ` : ""}
                      {t.nameBangla} ({t.code})
                    </option>
                  ))
                ) : (
                  <option value="General">সাধারণ পাঠ্যক্রম (General)</option>
                )}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Optional Pre-Vocational Notice */}
      {showNoticeBanner && !isClassWithTrades && selectedClass !== "all" && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 font-medium animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {currentClassMapping?.nameBangla || "নির্বাচিত শ্রেণিটি"} প্রাক-ভোকেশনাল স্তরের অন্তর্ভুক্ত। এই শ্রেণিতে পৃথক কোনো কারিগরি ট্রেড নেই।
          </span>
        </div>
      )}
    </div>
  );
}
