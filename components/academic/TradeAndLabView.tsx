"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  Zap,
  Wrench,
  Scissors,
  CheckCircle2,
  Users,
  Award,
  Layers,
  Sparkles,
  BookOpen,
  Table,
  LayoutGrid,
} from "lucide-react";
import AnimatedGears from "../common/AnimatedGears";

export default function TradeAndLabView() {
  const [trades, setTrades] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  useEffect(() => {
    fetch("/api/institution")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.trades) {
          setTrades(data.trades);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const tradeDetails: Record<
    string,
    {
      equipment: string[];
      careers: string[];
      badge: string;
      accentBg: string;
    }
  > = {
    IT_SUPPORT: {
      equipment: [
        "কম্পিউটার হার্ডওয়্যার ল্যাব ও ডায়াগনস্টিক কিট",
        "মাইক্রোকন্ট্রোলার ও IoT সেন্সর ডেভেলপমেন্ট কিট (ESP32, Arduino)",
        "সিসকো গিগাবিট নেটওয়ার্কিং সুইচ ও ফাইবার অপটিক টেস্টার",
        "উচ্চগতির ব্রডব্যান্ড ডেডিকেটেড ইন্টারনেট ল্যাব",
      ],
      careers: ["আইটি সাপোর্ট স্পেশালিস্ট", "নেটওয়ার্ক টেকনিশিয়ান", "IoT হার্ডওয়্যার সহকারী", "কম্পিউটার অপারেটর"],
      badge: "IT & IoT Lab",
      accentBg: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    },
    GEN_ELEC: {
      equipment: [
        "ডিজিটাল অটো-রেঞ্জিং অসিলোস্কোপ ও ফাংশন জেনারেটর",
        "পিসিবি এচিং ও সার্কিট ফেব্রিকেশন ইউনিট",
        "এসএমডি রিওয়ার্ক স্টেশন ও হট এয়ার গান",
        "স্বয়ংক্রিয় রোবোটিক্স কিট ও কন্ট্রোল সেন্সর",
      ],
      careers: ["ইলেকট্রনিক্স সার্ভিস ইঞ্জিনিয়ার", "পিসিবি অ্যাসেম্বলার", "টেলিকম টেকনিশিয়ান", "অটোমেশন টেকনিশিয়ান"],
      badge: "Robotics & PCB",
      accentBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    },
    ELEC_WORKS: {
      equipment: [
        "ইন্ডাস্ট্রিয়াল ৩-ফেজ মোটর ও কন্ট্রোল প্যানেল",
        "সৌর প্যানেল ইনস্টলেশন ও ব্যাটারি স্টোরেজ টেস্টবেঞ্চ",
        "হাউস ওয়্যারিং ও সাবস্টেশন রক্ষণাবেক্ষণ সিমুলেটর",
        "আর্থিং টেস্টার ও মেগার হাই-ভোল্টেজ মিটার",
      ],
      careers: ["ইন্ডাস্ট্রিয়াল ইলেকট্রিশিয়ান", "সাবস্টেশন অপারেটর", "সোলার পিভি টেকনিশিয়ান", "পাওয়ার ডিস্ট্রিবিউটর"],
      badge: "Power & Wiring",
      accentBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
    APPAREL: {
      equipment: [
        "কম্পিউটারাইজড সিঙ্গেল নিডল লকস্টিচ সুইং মেশিন",
        "ওভারলক ও ইন্টারলক স্পেশালাইজড মেশিন",
        "গার্মেন্টস প্যাটার্ন মেকিং ক্যাড (CAD) সফটওয়্যার",
        "কোয়ালিটি কন্ট্রোল ও ফেব্রিক ইন্সপেকশন টেবিল",
      ],
      careers: ["গার্মেন্টস কোয়ালিটি কন্ট্রোলার (QC)", "স্যাম্পল মেকার", "ক্যাড প্যাটার্ন মাস্টার", "ফ্যাক্টরি সুপারভাইজার"],
      badge: "Garments Tech",
      accentBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Standard Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>কারিগরি ট্রেড ও আধুনিক ল্যাবরেটরি কর্মশালা</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB) অনুমোদিত ৪টি বিশেষায়িত ব্যবহারিক ট্রেড এবং বাস্তবমুখী কর্মশালা
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
            <span>কার্ড ভিউ</span>
          </button>
        </div>
      </div>

      {/* 2. Content */}
      {viewMode === "table" ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>ট্রেড ও ল্যাবরেটরি মাস্টার তালিকা</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              মোট ট্রেড: {trades.length} টি
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-28">ট্রেড কোড</th>
                  <th className="py-3 px-4">ট্রেডের নাম</th>
                  <th className="py-3 px-4 w-32">ট্যাগ</th>
                  <th className="py-3 px-4 w-28 text-center">প্রভাতি আসন</th>
                  <th className="py-3 px-4 w-28 text-center">দিবা আসন</th>
                  <th className="py-3 px-4 w-28 text-center">ল্যাব সংখ্যা</th>
                  <th className="py-3 px-4">প্রধান ল্যাবরেটরি যন্ত্রপাতি</th>
                  <th className="py-3 px-4">কর্মসংস্থান ক্ষেত্র</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {trades.map((tr) => {
                  const detail = tradeDetails[tr.code] || {
                    equipment: ["আধুনিক যন্ত্রপাতি", "ল্যাব টুলস"],
                    careers: ["কারিগরি পেশাজীবী"],
                    badge: "Vocational",
                    accentBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
                  };

                  return (
                    <tr key={tr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-cyan-400 tabular-nums">
                        {tr.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{tr.nameBangla}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{tr.nameEnglish}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${detail.accentBg}`}>
                          {detail.badge}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {tr.seatsMorning}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {tr.seatsDay}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {tr.labsCount}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-400 max-w-xs truncate" title={detail.equipment.join(", ")}>
                        {detail.equipment.slice(0, 2).join(", ")}...
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-400 max-w-xs truncate" title={detail.careers.join(", ")}>
                        {detail.careers.slice(0, 2).join(", ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Detailed Cards View */
        <div className="space-y-4">
          {trades.map((tr) => {
            const detail = tradeDetails[tr.code] || {
              equipment: ["আধুনিক যন্ত্রপাতি", "ল্যাব টুলস"],
              careers: ["কারিগরি পেশাজীবী"],
              badge: "Vocational",
              accentBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
            };

            return (
              <div
                key={tr.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4"
              >
                {/* Header Title & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${detail.accentBg}`}>
                        {detail.badge}
                      </span>
                      <span className="font-mono text-xs text-indigo-600 dark:text-cyan-400 font-bold">
                        ট্রেড কোড: {tr.code}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {tr.nameBangla}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tr.nameEnglish}</p>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      প্রভাতি: {tr.seatsMorning} আসন
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      দিবা: {tr.seatsDay} আসন
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {tr.description}
                </p>

                {/* Equipment & Careers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Lab Equipment */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                      <Wrench className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                      <span>ল্যাব ও কর্মশালার যন্ত্রপাতি ({tr.labsCount}টি ল্যাব)</span>
                    </h4>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                      {detail.equipment.map((eq, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>{eq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Career Opportunities */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>কর্মসংস্থান ও ভবিষ্যৎ ক্যারিয়ার</span>
                    </h4>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                      {detail.careers.map((car, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                          <span>{car}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
