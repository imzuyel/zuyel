"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, ShieldCheck, Save, RefreshCw, AlertTriangle, 
  ChevronRight, Cpu, Zap, Activity, ShieldAlert,
  Settings, Key, Globe, Layers, CheckCircle2, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AISettings, AIProviderConfig } from "@/lib/aiConfigStore";
import { toast } from "sonner";

export default function AISettingsPage() {
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
    } catch (error) {
      toast.error("Settings load failed.");
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
        toast.success("AI Pipeline configuration saved!");
      } else {
        toast.error(data.error || "Save failed.");
      }
    } catch (error) {
      toast.error("Network error while saving.");
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
        <p className="text-slate-400 font-bold animate-pulse">AI Settings Hub Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 sm:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">AI Failover & Theme Engine</h1>
            </div>
            <p className="text-slate-400 text-sm font-medium">
              Configure multi-AI redundancy for PTSC ERP. Automatically switch providers during rate limits or high demand spikes.
            </p>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Configuration
          </button>
        </div>

        {/* Pipeline Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">Failover Engine</p>
              <p className="text-sm font-black text-white">Active & Ready</p>
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">Active Providers</p>
              <p className="text-sm font-black text-white">{settings?.providers.filter(p => p.enabled).length} Enabled</p>
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">Continuation</p>
              <p className="text-sm font-black text-white">{settings?.continuationEnabled ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
        </div>

        {/* Providers Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            AI Providers Priority List
          </h2>

          <div className="space-y-4">
            {settings?.providers.sort((a, b) => a.priority - b.priority).map((provider) => (
              <motion.div 
                key={provider.id}
                layout
                className={`p-6 rounded-3xl border transition-all ${
                  provider.enabled ? "bg-slate-900 border-slate-700/50" : "bg-slate-900/30 border-slate-800 opacity-60"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                      provider.id === 'gemini' ? 'bg-indigo-600 shadow-indigo-600/20' : 
                      provider.id === 'groq' ? 'bg-orange-600 shadow-orange-600/20' : 'bg-cyan-600 shadow-cyan-600/20'
                    }`}>
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        {provider.name}
                        {provider.priority === 1 && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Primary</span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{provider.baseUrl || "Internal SDK Routing"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Priority</label>
                      <input 
                        type="number"
                        value={provider.priority}
                        onChange={(e) => updateProvider(provider.id, { priority: parseInt(e.target.value) })}
                        className="w-16 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-3 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800/50">
                      <button 
                        onClick={() => updateProvider(provider.id, { enabled: !provider.enabled })}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          provider.enabled 
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {provider.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-800/50">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-indigo-400" />
                      API Key {provider.apiKey.includes('...') && "(Protected)"}
                    </label>
                    <input 
                      type="password"
                      value={provider.apiKey}
                      placeholder={provider.apiKey.includes('...') ? "Enter new key to change" : "Enter API Key"}
                      onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      Default Generation Model
                    </label>
                    <select 
                      value={provider.defaultModel}
                      onChange={(e) => updateProvider(provider.id, { defaultModel: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    >
                      {provider.models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mt-10 p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            Global Failover Strategy
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
              <div>
                <p className="text-sm font-bold text-white">Aggressive Failover</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Retry on any non-client error (429, 5xx)</p>
              </div>
              <button 
                onClick={() => setSettings(s => s ? { ...s, globalFailoverEnabled: !s.globalFailoverEnabled } : s)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${settings?.globalFailoverEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 bg-white dark:bg-slate-900 rounded-full shadow-md transform transition-transform duration-200 ${settings?.globalFailoverEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
              <div>
                <p className="text-sm font-bold text-white">Smart Continuation</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Pass context to next provider on interruption</p>
              </div>
              <button 
                onClick={() => setSettings(s => s ? { ...s, continuationEnabled: !s.continuationEnabled } : s)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${settings?.continuationEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 bg-white dark:bg-slate-900 rounded-full shadow-md transform transition-transform duration-200 ${settings?.continuationEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-200/70 font-medium">
            <strong>Security Warning:</strong> These settings control the institutional AI backbone. Never share API keys or expose this page to non-administrative staff. Settings are saved to <code className="bg-amber-500/20 px-1 rounded text-amber-400">data/ai-settings.json</code> on the server.
          </p>
        </div>
      </div>
    </div>
  );
}
