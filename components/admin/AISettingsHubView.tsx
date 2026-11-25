"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, ShieldCheck, Save, RefreshCw, AlertTriangle, 
  ChevronRight, Cpu, Zap, Activity, ShieldAlert,
  Settings, Key, Globe, Layers, CheckCircle2, Loader2
} from "lucide-react";
import { motion } from "motion/react";
import { AISettings, AIProviderConfig } from "@/lib/aiConfigStore";
import { toast } from "sonner";

export default function AISettingsHubView() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch {
      toast.error("AI Settings লোড করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("এআই ইঞ্জিন কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!");
      } else {
        toast.error(data.error || "সংরক্ষণ ব্যর্থ হয়েছে।");
      }
    } catch {
      toast.error("নেটওয়ার্ক সংযোগ ত্রুটি।");
    } finally {
      setSaving(false);
    }
  };

  const updateProvider = (id: string, updates: Partial<AIProviderConfig>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      providers: settings.providers.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse text-xs">AI Settings Hub লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold backdrop-blur-xs border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>PTSC Multi-AI Redundancy & Model Tuning Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            AI ফেইলওভার ও মডেল কনফিগারেশন স্টুডিও
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            লাইভ কুইজ জেনারেশন, ডিজিটাল প্রেজেন্টেশন ও চ্যাপ্টার লার্নিংয়ের জন্য হাইপার-রেজিলিয়েন্ট এআই পাইপলাইন (Gemini 3.8 Flash, Groq, OpenRouter)।
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="relative z-10 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50 self-start md:self-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? "সংরক্ষণ হচ্ছে..." : "কনফিগারেশন সংরক্ষণ"}</span>
        </button>
      </div>

      {/* Pipeline Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">ফেইলওভার ইঞ্জিন</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">Active & Hot-Standby</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">সক্রিয় এআই প্রোভাইডার</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{settings?.providers.filter(p => p.enabled).length || 1} টি সক্রিয়</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">স্মার্ট কন্টিনিউয়েশন</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{settings?.continuationEnabled ? "চালু রয়েছে (Enabled)" : "বন্ধ"}</p>
          </div>
        </div>
      </div>

      {/* Providers Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
          <span>AI মডেল প্রোভাইডার ও প্রাইওরিটি তালিকা</span>
        </h2>

        <div className="space-y-3">
          {settings?.providers.sort((a, b) => a.priority - b.priority).map((provider) => (
            <motion.div 
              key={provider.id}
              layout
              className={`p-5 rounded-2xl border transition-all ${
                provider.enabled 
                  ? "bg-white dark:bg-slate-900 border-indigo-500/40 shadow-xs" 
                  : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-white ${
                    provider.id === 'gemini' ? 'bg-indigo-600' : 
                    provider.id === 'groq' ? 'bg-orange-600' : 'bg-cyan-600'
                  }`}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {provider.name}
                      {provider.priority === 1 && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 uppercase tracking-widest font-bold">Primary</span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">{provider.baseUrl || "Internal Google Gemini SDK"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">অগ্রাধিকার:</label>
                    <input 
                      type="number"
                      value={provider.priority}
                      onChange={(e) => updateProvider(provider.id, { priority: parseInt(e.target.value) || 1 })}
                      className="w-14 px-2.5 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={() => updateProvider(provider.id, { enabled: !provider.enabled })}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      provider.enabled 
                        ? "bg-emerald-600 text-white shadow-xs" 
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {provider.enabled ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-500" />
                    <span>API Key {provider.apiKey.includes('...') && "(Protected)"}</span>
                  </label>
                  <input 
                    type="password"
                    value={provider.apiKey}
                    placeholder={provider.apiKey.includes('...') ? "নতুন কী লিখতে টাইপ করুন" : "API Key লিখুন"}
                    onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-indigo-700 dark:text-indigo-300 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-500" />
                    <span>ডিফল্ট জেনারেশন মডেল</span>
                  </label>
                  <select 
                    value={provider.defaultModel}
                    onChange={(e) => updateProvider(provider.id, { defaultModel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    {provider.models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Advanced Failover Policy */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          <span>সার্বজনীন অটো-ফেইলওভার পলিসি</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Aggressive Failover</p>
              <p className="text-[10px] text-slate-500">রেট লিমিট বা সার্ভার এরর (429/5xx) দেখা দিলে সাথে সাথে ব্যাকআপ প্রোভাইডারে স্যুইচ করবে</p>
            </div>
            <button 
              type="button"
              onClick={() => setSettings(s => s ? { ...s, globalFailoverEnabled: !s.globalFailoverEnabled } : s)}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${settings?.globalFailoverEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${settings?.globalFailoverEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Smart Continuation</p>
              <p className="text-[10px] text-slate-500">বিক্ষিপ্ত জেনারেশনের ক্ষেত্রে পূর্ববর্তী প্রম্পট ও প্রোগ্রেস বজায় রাখবে</p>
            </div>
            <button 
              type="button"
              onClick={() => setSettings(s => s ? { ...s, continuationEnabled: !s.continuationEnabled } : s)}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${settings?.continuationEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${settings?.continuationEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

