"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ExternalLink,
  Layers,
  Calendar,
  Sparkles,
  Check,
} from "lucide-react";
import { useGlobalAcademic } from "@/context/GlobalAcademicContext";

interface GlobalAcademicDevBarProps {
  isCollapsed?: boolean;
}

export default function GlobalAcademicDevBar({ isCollapsed = false }: GlobalAcademicDevBarProps) {
  const {
    academicYear,
    selectedClassId,
    selectedSection,
    selectedTradeId,
    activeClassName,
    activeTradeName,
    isTradeApplicable,
    availableClasses,
    availableTrades,
    availableSections,
    setAcademicYear,
    setSelectedClassId,
    setSelectedSection,
    setSelectedTradeId,
    resetToDefaults,
  } = useGlobalAcademic();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (isCollapsed) {
    return (
      <div className="px-2 py-1.5 flex justify-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={`গ্লোবাল একাডেমিক: ${academicYear} | ${activeClassName}`}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 border border-indigo-500/40 text-indigo-400 hover:text-white flex items-center justify-center transition-all hover:scale-105"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-3 rounded-2xl bg-gradient-to-b from-indigo-950/70 to-slate-900/90 border border-indigo-500/30 p-2.5 shadow-lg shadow-indigo-950/30 text-xs">
      {/* Top Banner / Toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>গ্লোবাল একাডেমিক কন্ট্রোল</span>
            </div>
            <p className="text-[11px] font-bold text-white truncate">
              {academicYear} • {activeClassName.split(" ")[0]} • {selectedSection}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label={isOpen ? "Collapse settings" : "Expand settings"}
          className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
        >
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Collapsible Quick Configuration Controls */}
      {isOpen && (
        <div className="mt-2.5 pt-2 border-t border-indigo-500/20 space-y-2.5 animate-fade-in text-[11px]">
          {/* Year & Section Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                সেশন/বছর
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-slate-900 border border-indigo-500/40 rounded-lg px-2 py-1 text-white text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="2026">২০২৬ (চলতি)</option>
                <option value="2025">২০২৫</option>
                <option value="2024">২০২৪</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                শাখা
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full bg-slate-900 border border-indigo-500/40 rounded-lg px-2 py-1 text-white text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    শাখা {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Selector */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              সক্রিয় শ্রেণি
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-900 border border-indigo-500/40 rounded-lg px-2 py-1 text-white text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBangla}
                </option>
              ))}
            </select>
          </div>

          {/* Trade Selector (if applicable) */}
          {isTradeApplicable && availableTrades.length > 0 && (
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                ভোকেশনাল ট্রেড
              </label>
              <select
                value={selectedTradeId}
                onChange={(e) => setSelectedTradeId(e.target.value)}
                className="w-full bg-slate-900 border border-indigo-500/40 rounded-lg px-2 py-1 text-white text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                {availableTrades.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameBangla}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-1 flex items-center justify-between text-[10px]">
            <button
              type="button"
              onClick={resetToDefaults}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>রিসেট</span>
            </button>

            <Link
              href="/academic/mapping"
              className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>বিস্তারিত ম্যাপিং</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
