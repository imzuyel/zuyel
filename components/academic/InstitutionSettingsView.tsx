"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  User,
  MapPin,
  Award,
  Check,
  X,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { InstitutionSettings, DEFAULT_INSTITUTION_SETTINGS } from "@/lib/masterDataEngine";

export default function InstitutionSettingsView() {
  const [settings, setSettings] = useState<InstitutionSettings>(DEFAULT_INSTITUTION_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/academic/master-data");
      const json = await res.json();
      if (json.success && json.data?.institution) {
        setSettings(json.data.institution);
      }
    } catch (e) {
      console.error("Failed loading institution settings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field: keyof InstitutionSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await fetch("/api/academic/master-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_institution",
          payload: settings,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToast({ type: "success", message: "প্রতিষ্ঠান তথ্য সফলভাবে সংরক্ষিত হয়েছে।" });
      } else {
        setToast({ type: "error", message: json.error || "সংরক্ষণ করতে সমস্যা হয়েছে।" });
      }
    } catch {
      setToast({ type: "error", message: "নেটওয়ার্ক সমস্যা হয়েছে।" });
    } finally {
      setIsSaving(false);
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
            <Building2 className="w-4 h-4" />
            <span>প্রতিষ্ঠান পরিচিতি ও গ্লোবাল কনফিগারেশন (Institution Master)</span>
          </div>
          <h2 className="text-lg font-black text-white">সরকারি প্রতিষ্ঠান মাস্টার সেটিংস</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            প্রতিষ্ঠান কোড, EIIN, কারিগরি বোর্ড অনুমোদন ও অফিশিয়াল যোগাযোগের তথ্য।
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>পরিবর্তন সংরক্ষণ করুন</span>
        </button>
      </div>

      {/* Form Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
        {/* Basic Identity Card */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-cyan-400 font-bold uppercase text-[11px] tracking-wider">
            <Award className="w-4 h-4" />
            <span>১. প্রাতিষ্ঠানিক নাম ও কোড পরিচিতি</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">প্রতিষ্ঠানের নাম (বাংলা)</label>
            <input
              type="text"
              required
              value={settings.nameBangla}
              onChange={(e) => handleChange("nameBangla", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">প্রতিষ্ঠানের নাম (English)</label>
            <input
              type="text"
              required
              value={settings.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">EIIN নম্বর</label>
              <input
                type="text"
                required
                value={settings.eiin}
                onChange={(e) => handleChange("eiin", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">প্রতিষ্ঠান কোড (Code)</label>
              <input
                type="text"
                required
                value={settings.code}
                onChange={(e) => handleChange("code", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">অনুমোদিত বোর্ড</label>
              <input
                type="text"
                value={settings.board}
                onChange={(e) => handleChange("board", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">অধিদপ্তর (Directorate)</label>
              <input
                type="text"
                value={settings.directorate}
                onChange={(e) => handleChange("directorate", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Contact and Head of Institute Card */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-indigo-400 font-bold uppercase text-[11px] tracking-wider">
            <User className="w-4 h-4" />
            <span>২. প্রতিষ্ঠান প্রধান ও যোগাযোগ তথ্য</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">অধ্যক্ষ / প্রতিষ্ঠান প্রধানের নাম</label>
              <input
                type="text"
                value={settings.principalName}
                onChange={(e) => handleChange("principalName", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">পদবী</label>
              <input
                type="text"
                value={settings.principalDesignation}
                onChange={(e) => handleChange("principalDesignation", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">অধ্যক্ষের মোবাইল নম্বর</label>
              <input
                type="text"
                value={settings.principalMobile}
                onChange={(e) => handleChange("principalMobile", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">অফিসিয়াল ইমেইল</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">অফিসিয়াল ওয়েবসাইট</label>
              <input
                type="text"
                value={settings.website}
                onChange={(e) => handleChange("website", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">ল্যান্ডলাইন নম্বর</label>
              <input
                type="text"
                value={settings.phoneLandline}
                onChange={(e) => handleChange("phoneLandline", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">প্রতিষ্ঠানের ঠিকানা (বাংলা)</label>
            <input
              type="text"
              value={settings.locationBangla}
              onChange={(e) => handleChange("locationBangla", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
