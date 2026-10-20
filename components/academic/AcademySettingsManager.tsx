"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Layers,
  Settings,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Plus,
  BookOpen,
  Info,
  Building,
  Save,
} from "lucide-react";
import { useAcademySettings } from "@/lib/useAcademySettings";
import { AcademyClassTradeMapping, MASTER_ACADEMY_TRADES } from "@/lib/academySettingsStore";

export default function AcademySettingsManager() {
  const { mappings, loading, hasTrades } = useAcademySettings();
  const [selectedClassId, setSelectedClassId] = useState<string>("class-9");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activeMapping = mappings.find((m) => m.id === selectedClassId) || mappings[0];

  const handleSaveNotice = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setFeedback({
        type: "success",
        text: `${activeMapping?.nameBangla}-এর একাডেমিক ম্যাপিং ও কারিগরি ট্রেড তালিকা সফলভাবে সংরক্ষিত হয়েছে।`,
      });
      setTimeout(() => setFeedback(null), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                সেন্ট্রাল একাডেমি সেটিংস ও শ্রেণি-ট্রেড ম্যাপিং হাব
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Central Academy Settings & Dynamic Class-to-Trade Mapping Authority (PTSC ERP)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>সেন্ট্রাল ডাটাবেজ সিঙ্কড (Live DB Active)</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Grid: Class Selector Sidebar + Trade Configuration View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Classes Navigation List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <h2 className="text-xs font-black uppercase text-slate-400 px-2 tracking-wider">
              একাডেমিক শ্রেণিসমূহ (৭টি শ্রেণি + ডিপ্লোমা)
            </h2>
            <div className="space-y-1.5">
              {mappings.map((m) => {
                const isSelected = m.id === selectedClassId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedClassId(m.id)}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/80 shadow-xs"
                        : "bg-slate-50/50 dark:bg-slate-800/30 border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <GraduationCap className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                        <span>{m.nameBangla}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {m.tier} • আসন: {m.totalSeats}
                      </div>
                    </div>

                    <div className="text-right">
                      {m.hasTrade ? (
                        <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                          {m.availableTrades.length} টি ট্রেড
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                          ট্রেড নেই
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Class Configuration & Allowed Trades Card */}
        <div className="lg:col-span-8 space-y-6">
          {activeMapping && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        activeMapping.tier === "Pre-Vocational"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : activeMapping.tier === "SSC (Vocational)"
                          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {activeMapping.tier}
                    </span>
                    <span className="text-xs text-slate-400">• মোট আসন: {activeMapping.totalSeats}</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {activeMapping.nameBangla}
                  </h2>
                </div>

                <button
                  onClick={handleSaveNotice}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-md shadow-indigo-600/20 disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "সংরক্ষণ হচ্ছে..." : "কনফিগারেশন সেভ করুন"}</span>
                </button>
              </div>

              {/* Strict Rule Summary */}
              {!activeMapping.hasTrade ? (
                <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-xs">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>প্রাক-ভোকেশনাল নীতি (Pre-Vocational Policy):</span>
                  </div>
                  <p className="text-xs text-amber-900/80 dark:text-amber-200/90 leading-relaxed font-medium">
                    {activeMapping.nameBangla} স্তরে শিক্ষার্থীরা সাধারণ ও প্রাক-কারিগরি মৌলিক পাঠ্যক্রমে অধ্যয়ন করে। 
                    এখানে কোনো পৃথক ভোকেশনাল ট্রেড নেই। পুরো প্রজেক্টে (রেজিস্ট্রেশন, স্টুডেন্ট প্রোফাইল, কুইজ ও লেকচার ফিল্টার) 
                    এই শ্রেণি সিলেক্ট করলে স্বয়ংক্রিয়ভাবে ট্রেড ফিল্ডে <b>"ট্রেড প্রযোজ্য নয় (সাধারণ)"</b> দৃশ্যমান থাকবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>অনুমোদিত কারিগরি ট্রেডসমূহ (Authorized Technical Trades)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ড্রপডাউনে শুধুমাত্র এই ট্রেডগুলো দৃশ্যমান থাকবে
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {activeMapping.availableTrades.map((trade, idx) => (
                      <div
                        key={trade.id || idx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{trade.icon || "🔧"}</span>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">
                              {trade.nameBangla}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-mono">
                              কোড: {trade.code} • আসন: {trade.seats || 50}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          অ্যাক্টিভ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mapping Architecture Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  সেন্ট্রাল আর্কিটেকচার ভ্যালিডেশন:
                </div>
                <div>• ডাটাবেজ টেবিল: <code className="font-mono text-indigo-600">institutionalDb.academyClassTradeMappings</code></div>
                <div>• রুটিন, এটেনডেন্স, রেজাল্ট, কুইজ এবং স্টুডেন্ট রেজিস্ট্রেশন সরাসরি এই ডাটাবেজ টেবিল থেকে ডাইনামিক ড্রপডাউন অপশন গ্রহণ করে।</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
