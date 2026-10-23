"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Unlock,
  Check,
  X,
  Edit3,
  Archive,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { AcademicYearRecord, AcademicYearStatus } from "@/lib/masterDataEngine";

export default function AcademicYearsManagerView() {
  const [years, setYears] = useState<AcademicYearRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingYear, setEditingYear] = useState<AcademicYearRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>("");
  const [formStartDate, setFormStartDate] = useState<string>("");
  const [formEndDate, setFormEndDate] = useState<string>("");
  const [formStatus, setFormStatus] = useState<AcademicYearStatus>("Active");
  const [formIsCurrent, setFormIsCurrent] = useState<boolean>(false);
  const [formRemarks, setFormRemarks] = useState<string>("");

  const fetchYears = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/academic/years");
      const json = await res.json();
      if (json.success && Array.isArray(json.academicYears)) {
        setYears(json.academicYears);
      }
    } catch (e) {
      console.error("Failed to load academic years", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const openCreateModal = () => {
    const nextYear = new Date().getFullYear() + 1;
    setEditingYear(null);
    setFormName(String(nextYear));
    setFormStartDate(`${nextYear}-01-01`);
    setFormEndDate(`${nextYear}-12-31`);
    setFormStatus("Draft");
    setFormIsCurrent(false);
    setFormRemarks("");
    setIsModalOpen(true);
  };

  const openEditModal = (y: AcademicYearRecord) => {
    setEditingYear(y);
    setFormName(y.name);
    setFormStartDate(y.startDate);
    setFormEndDate(y.endDate);
    setFormStatus(y.status);
    setFormIsCurrent(y.isCurrent);
    setFormRemarks(y.remarks || "");
    setIsModalOpen(true);
  };

  const handleSetActive = async (y: AcademicYearRecord) => {
    if (y.isCurrent) return;

    if (!confirm(`আপনি কি "${y.name}" শিক্ষাবর্ষকে চলতি সক্রিয় শিক্ষাবর্ষ (Active Current Year) হিসেবে নির্ধারণ করতে চান? পূর্ববর্তী শিক্ষাবর্ষের সকল ডেটা ও রিপোর্ট অক্ষত থাকবে।`)) {
      return;
    }

    try {
      const res = await fetch("/api/academic/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_year",
          payload: {
            id: y.id,
            name: y.name,
            isCurrent: true,
            status: "Active",
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToast({ type: "success", message: `শিক্ষাবর্ষ ${y.name} সফলভাবে সক্রিয় করা হয়েছে।` });
        fetchYears();
      } else {
        setToast({ type: "error", message: json.error || "শিক্ষাবর্ষ পরিবর্তন ব্যর্থ হয়েছে।" });
      }
    } catch {
      setToast({ type: "error", message: "নেটওয়ার্ক সমস্যা হয়েছে।" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/academic/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_year",
          payload: {
            id: editingYear ? editingYear.id : undefined,
            name: formName,
            startDate: formStartDate,
            endDate: formEndDate,
            status: formStatus,
            isCurrent: formIsCurrent,
            remarks: formRemarks,
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToast({
          type: "success",
          message: editingYear ? "শিক্ষাবর্ষ সফলভাবে হালনাগাদ করা হয়েছে।" : "নতুন শিক্ষাবর্ষ সফলভাবে তৈরি হয়েছে।",
        });
        setIsModalOpen(false);
        fetchYears();
      } else {
        setToast({ type: "error", message: json.error || "সংরক্ষণ করতে সমস্যা হয়েছে।" });
      }
    } catch {
      setToast({ type: "error", message: "সংরক্ষণ ব্যর্থ হয়েছে।" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>সেশন ও শিক্ষাবর্ষ মাস্টার (Academic Years)</span>
          </div>
          <h2 className="text-lg font-black text-white">শিক্ষাবর্ষ ব্যবস্থাপনা ও সেশন নিয়ন্ত্রণ</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            প্রতিষ্ঠানের চলতি শিক্ষাবর্ষ নির্ধারণ করুন। শিক্ষাবর্ষ পরিবর্তন করলে পূর্ববর্তী বছরের সকল তথ্য সংরক্ষিত থাকবে।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchYears}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:scale-105"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন শিক্ষাবর্ষ যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Grid of Academic Years */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {years.map((y) => {
          const isCur = y.isCurrent || y.status === "Active";

          return (
            <div
              key={y.id}
              className={`p-5 rounded-3xl border transition-all relative overflow-hidden ${
                isCur
                  ? "bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/30"
                  : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                    {y.code || `AY-${y.name}`}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
                    <span>{y.name}</span>
                    {isCur && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        সক্রিয় চলতি বছর
                      </span>
                    )}
                  </h3>
                </div>

                <button
                  onClick={() => openEditModal(y)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="এডিট করুন"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-400 font-medium">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>মেয়াদকাল:</span>
                  <span className="text-slate-200">
                    {y.startDate} হতে {y.endDate}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>অবস্থা:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      y.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : y.status === "Draft"
                        ? "bg-amber-500/10 text-amber-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {y.status}
                  </span>
                </div>

                {y.remarks && (
                  <p className="text-[11px] text-slate-500 italic pt-1">{y.remarks}</p>
                )}
              </div>

              {/* Set as Active Button */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {!isCur ? (
                  <button
                    onClick={() => handleSetActive(y)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>চলতি সক্রিয় বছর করুন</span>
                  </button>
                ) : (
                  <div className="w-full py-1.5 text-center text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>বর্তমানে সব মডিউলে কার্যকর</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 text-xs font-semibold space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingYear ? "শিক্ষাবর্ষ হালনাগাদ করুন" : "নতুন শিক্ষাবর্ষ যুক্ত করুন"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">শিক্ষাবর্ষের নাম (Year Name)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2027"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">শুরুর তারিখ</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">শেষ তারিখ</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">স্ট্যাটাস</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as AcademicYearStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="Draft">Draft (খসড়া)</option>
                  <option value="Active">Active (সক্রিয়)</option>
                  <option value="Closed">Closed (বন্ধ)</option>
                  <option value="Archived">Archived (আর্কাইভড)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">মন্তব্য (Remarks)</label>
                <input
                  type="text"
                  placeholder="e.g. রেগুলার একাডেমিক ক্যালেন্ডার"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  বাতিল
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
