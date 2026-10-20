"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  School,
  ArrowRight,
  Table,
  LayoutGrid,
  TrendingUp,
  Settings,
} from "lucide-react";
import { ACADEMIC_CLASSES, ALL_TRADES, doesClassHaveTrade } from "@/lib/academicStructure";
import { Student } from "@/lib/database";
import AcademySettingsManager from "./AcademySettingsManager";

interface ClassesAndTradesViewProps {
  onNavigateToStudents?: (classId: number) => void;
}

export default function ClassesAndTradesView({ onNavigateToStudents }: ClassesAndTradesViewProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards" | "academy_settings">("table");

  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setStudents(data.items);
        }
      })
      .catch(() => {});
  }, []);

  // Compute student count per class
  const getEnrollmentForClass = (classNum: number) => {
    return students.filter((s) => {
      const num = typeof s.classId === "number" && s.classId <= 7 ? s.classId + 5 : Number(s.classId);
      return num === classNum;
    }).length;
  };

  // Compute student count per trade
  const getEnrollmentForTrade = (tradeId: number) => {
    return students.filter((s) => Number(s.tradeId) === tradeId).length;
  };

  const totalSanctionedSeats = ACADEMIC_CLASSES.reduce((acc, c) => acc + (c.totalSeats || 100), 0);
  const totalEnrolled = students.length;

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>শ্রেণি ও কারিগরি ট্রেড কাঠামো (Academic Structure & Trades)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            মোট অনুমোদিত আসন: <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{totalSanctionedSeats}</span> টি • বর্তমান ভর্তিকৃত: <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{totalEnrolled}</span> জন
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>টেবিল ভিউ</span>
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "cards"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>টায়ার কার্ড ভিউ</span>
          </button>
          <button
            onClick={() => setViewMode("academy_settings")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "academy_settings"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-cyan-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>সেন্ট্রাল একাডেমি ম্যাপিং</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Table View */}
      {viewMode === "table" ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>শ্রেণিভিত্তিক আসন ও এনরোলমেন্ট ডাটা টেবিল</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              ৭টি একাডেমিক শ্রেণি (৬ষ্ঠ হতে ১২শ)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-36">শ্রেণি</th>
                  <th className="py-3 px-4 w-44">একাডেমিক স্তর</th>
                  <th className="py-3 px-4">কারিগরি ট্রেড কাঠামো</th>
                  <th className="py-3 px-4 w-28 text-center">শাখা</th>
                  <th className="py-3 px-4 w-32 text-center">অনুমোদিত আসন</th>
                  <th className="py-3 px-4 w-32 text-center">ভর্তিকৃত শিক্ষার্থী</th>
                  <th className="py-3 px-4 w-36">আসন পূরণ হার</th>
                  <th className="py-3 px-4 text-right w-28">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {ACADEMIC_CLASSES.map((cls) => {
                  const enrolled = getEnrollmentForClass(cls.numericValue);
                  const totalSeats = cls.totalSeats || 100;
                  const utilization = Math.min(100, Math.round((enrolled / totalSeats) * 100));
                  const applicableTrades = ALL_TRADES.filter((t) => t.applicableClass === cls.numericValue);

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{cls.nameBangla}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{cls.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                            cls.numericValue <= 8
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              : cls.numericValue <= 10
                              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                              : "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800"
                          }`}
                        >
                          {cls.numericValue <= 8
                            ? "প্রাক-ভোকেশনাল"
                            : cls.numericValue <= 10
                            ? "এসএসসি ভোকেশনাল"
                            : "এইচএসসি ভোকেশনাল"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {applicableTrades.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {applicableTrades.map((t) => (
                              <span
                                key={t.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {t.nameBangla} ({t.code})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] italic font-medium">
                            সাধারণ কারিগরি ভিত্তি (ট্রেড প্রযোজ্য নয়)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                        শাখা A ও B
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {totalSeats}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {enrolled}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{utilization}%</span>
                            <span className="text-slate-400">খালি: {Math.max(0, totalSeats - enrolled)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                utilization >= 90
                                  ? "bg-rose-500"
                                  : utilization >= 50
                                  ? "bg-indigo-600"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${utilization}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToStudents && onNavigateToStudents(cls.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>শিক্ষার্থী</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 3. Tiered Card View */
        <div className="space-y-5">
          {/* Tier 1: Pre-Vocational (Class 6, 7, 8 - NO TRADE) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  প্রাক-ভোকেশনাল (Pre-Vocational): ৬ষ্ঠ, ৭ম ও ৮ম শ্রেণি
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                কারিগরি ট্রেড নেই (No Trade)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ACADEMIC_CLASSES.filter((c) => !c.hasTrade).map((cls) => {
                const enrolled = getEnrollmentForClass(cls.numericValue);

                return (
                  <div
                    key={cls.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {cls.nameBangla}
                        </h3>
                        <div className="text-[11px] text-slate-400 font-mono font-medium">{cls.name}</div>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        সাধারণ শাখা
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <div className="flex justify-between">
                        <span>শাখা:</span>
                        <span className="font-bold text-slate-900 dark:text-white">শাখা A ও শাখা B</span>
                      </div>
                      <div className="flex justify-between">
                        <span>অনুমোদিত আসন:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">{cls.totalSeats} টি</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ভর্তিকৃত শিক্ষার্থী:</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{enrolled} জন</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() => onNavigateToStudents && onNavigateToStudents(cls.id)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>শিক্ষার্থী তালিকা</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier 2: SSC Vocational (Class 9 & 10) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  এসএসসি ভোকেশনাল (SSC Vocational): ৯ম ও ১০ম শ্রেণি
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                ট্রেড প্রতি ৫০টি আসন
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class 9 Box */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      ৯ম শ্রেণি (Class 9)
                    </h3>
                    <div className="text-[11px] text-slate-400">এসএসসি ১ম বর্ষ • মোট আসন ১০০টি</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                    ট্রেড-১ ও ট্রেড-২
                  </span>
                </div>

                <div className="space-y-2">
                  {ALL_TRADES.filter((t) => t.applicableClass === 9).map((trade) => {
                    const enrolled = getEnrollmentForTrade(trade.id);

                    return (
                      <div
                        key={trade.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            ট্রেড {trade.tradeNumber}: {trade.nameBangla}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-cyan-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                            {trade.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{trade.descriptionBangla}</p>
                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 dark:text-slate-400">
                          <span>আসন: <strong className="font-mono text-slate-800 dark:text-slate-200">{trade.seats}</strong> টি</span>
                          <span>ভর্তিকৃত: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{enrolled}</strong> জন</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Class 10 Box */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      ১০ম শ্রেণি (Class 10)
                    </h3>
                    <div className="text-[11px] text-slate-400">এসএসসি সমাপনী বর্ষ • মোট আসন ১০০টি</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                    ট্রেড-৩ ও ট্রেড-৪
                  </span>
                </div>

                <div className="space-y-2">
                  {ALL_TRADES.filter((t) => t.applicableClass === 10).map((trade) => {
                    const enrolled = getEnrollmentForTrade(trade.id);

                    return (
                      <div
                        key={trade.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            ট্রেড {trade.tradeNumber}: {trade.nameBangla}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-cyan-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                            {trade.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{trade.descriptionBangla}</p>
                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 dark:text-slate-400">
                          <span>আসন: <strong className="font-mono text-slate-800 dark:text-slate-200">{trade.seats}</strong> টি</span>
                          <span>ভর্তিকৃত: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{enrolled}</strong> জন</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Tier 3: HSC Vocational (Class 11 & 12) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  এইচএসসি ভোকেশনাল (HSC Vocational): ১১শ ও ১২শ শ্রেণি
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300">
                ট্রেড প্রতি ৫০টি আসন
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class 11 Box */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      ১১শ শ্রেণি (Class 11)
                    </h3>
                    <div className="text-[11px] text-slate-400">এইচএসসি ১ম বর্ষ • মোট আসন ১০০টি</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-800">
                    ট্রেড-১ ও ট্রেড-২
                  </span>
                </div>

                <div className="space-y-2">
                  {ALL_TRADES.filter((t) => t.applicableClass === 11).map((trade) => {
                    const enrolled = getEnrollmentForTrade(trade.id);

                    return (
                      <div
                        key={trade.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            ট্রেড {trade.tradeNumber}: {trade.nameBangla}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                            {trade.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{trade.descriptionBangla}</p>
                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 dark:text-slate-400">
                          <span>আসন: <strong className="font-mono text-slate-800 dark:text-slate-200">{trade.seats}</strong> টি</span>
                          <span>ভর্তিকৃত: <strong className="font-mono text-teal-600 dark:text-teal-400">{enrolled}</strong> জন</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Class 12 Box */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      ১২শ শ্রেণি (Class 12)
                    </h3>
                    <div className="text-[11px] text-slate-400">এইচএসসি সমাপনী বর্ষ • মোট আসন ১০০টি</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-800">
                    ট্রেড-৩ ও ট্রেড-৪
                  </span>
                </div>

                <div className="space-y-2">
                  {ALL_TRADES.filter((t) => t.applicableClass === 12).map((trade) => {
                    const enrolled = getEnrollmentForTrade(trade.id);

                    return (
                      <div
                        key={trade.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            ট্রেড {trade.tradeNumber}: {trade.nameBangla}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                            {trade.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{trade.descriptionBangla}</p>
                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 dark:text-slate-400">
                          <span>আসন: <strong className="font-mono text-slate-800 dark:text-slate-200">{trade.seats}</strong> টি</span>
                          <span>ভর্তিকৃত: <strong className="font-mono text-teal-600 dark:text-teal-400">{enrolled}</strong> জন</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Central Academy Settings & Class-to-Trade Mapping Authority */}
      {viewMode === "academy_settings" && <AcademySettingsManager />}
    </div>
  );
}
