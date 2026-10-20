"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Send,
  MessageSquare,
  Users,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  HelpCircle,
  FileText,
  DollarSign,
  PhoneCall,
  RefreshCw,
  Tag,
  ShieldCheck,
  Search,
  Radio,
  Layers,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { calculateSmsCount, BTEB_SMS_TEMPLATES } from "@/lib/smsGatewayEngine";
import { ALL_TRADES } from "@/lib/academicStructure";
import { toBengaliNumerals } from "@/lib/utils";

interface SmsLogItem {
  id: string;
  recipientPhone: string;
  recipientName?: string;
  studentName?: string;
  message: string;
  templateType: string;
  status: string;
  cost: number;
  createdAt: string;
}

interface SmsStats {
  totalDispatched: number;
  totalCost: number;
  simulatedBalance: number;
  todayCount: number;
  absentCount: number;
  totalStudentsCount: number;
}

export default function GuardianSmsStudio() {
  // Target Audience selection
  const [targetAudience, setTargetAudience] = useState<"absent" | "trade" | "individual" | "all">("absent");
  const [selectedTrade, setSelectedTrade] = useState<string>("IT Support & IoT");
  const [templateKey, setTemplateKey] = useState<"absence" | "result" | "emergency" | "fee" | "custom">("absence");
  const [messageText, setMessageText] = useState<string>(BTEB_SMS_TEMPLATES.absence);
  const [individualPhone, setIndividualPhone] = useState<string>("01712345678");
  const [studentNameInput, setStudentNameInput] = useState<string>("রিপন ইসলাম");
  const [rollInput, setRollInput] = useState<string>("১০৪");

  // State
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; count: number; cost: number; message?: string } | null>(null);
  const [smsHistory, setSmsHistory] = useState<SmsLogItem[]>([]);
  const [stats, setStats] = useState<SmsStats>({
    totalDispatched: 2,
    totalCost: 0.9,
    simulatedBalance: 4999.1,
    todayCount: 2,
    absentCount: 8,
    totalStudentsCount: 320,
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>("");

  // Update text when template changes
  useEffect(() => {
    if (templateKey !== "custom" && BTEB_SMS_TEMPLATES[templateKey]) {
      setMessageText(BTEB_SMS_TEMPLATES[templateKey]);
    }
  }, [templateKey]);

  // Fetch recent SMS logs & stats
  const fetchSmsData = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/communication/sms");
      const data = await res.json();
      if (data.success) {
        if (data.logs) setSmsHistory(data.logs);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load SMS logs:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSmsData();
  }, []);

  // SMS character & part stats
  const smsStats = calculateSmsCount(messageText);

  // Dynamic estimated recipient count based on selection
  const estimatedRecipientCount = useMemo(() => {
    switch (targetAudience) {
      case "absent":
        return stats.absentCount || 8;
      case "trade":
        return 32;
      case "individual":
        return 1;
      case "all":
        return stats.totalStudentsCount || 320;
      default:
        return 1;
    }
  }, [targetAudience, stats]);

  // Estimated total cost for batch
  const estimatedTotalCost = (smsStats.smsCount * 0.45 * estimatedRecipientCount).toFixed(2);

  // Insert token helper
  const insertToken = (token: string) => {
    setMessageText((prev) => prev + " " + token);
  };

  // Preview formatted text with token replacements
  const previewFormattedText = useMemo(() => {
    const today = new Date().toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
    return messageText
      .replace(/{student_name}/g, studentNameInput || "রিপন ইসলাম")
      .replace(/{roll}/g, rollInput || "১০৪")
      .replace(/{trade}/g, selectedTrade || "IT Support & IoT")
      .replace(/{gpa}/g, "৪.৮৮")
      .replace(/{exam_name}/g, "১ম পর্ব সমাপনী পরীক্ষা")
      .replace(/{date}/g, today)
      .replace(/{institution}/g, "পঞ্চগড় সরকারি টিএসসি");
  }, [messageText, studentNameInput, rollInput, selectedTrade]);

  // Handle Send SMS
  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/communication/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAudience,
          selectedTrade,
          templateType: templateKey,
          message: messageText,
          individualPhone,
          studentName: studentNameInput,
          roll: rollInput,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSendResult({
          success: true,
          count: data.sentCount || 1,
          cost: data.totalCost || 0.45,
          message: data.message,
        });
        fetchSmsData();
      } else {
        alert(data.message || "এসএমএস পাঠাতে ত্রুটি ঘটেছে।");
      }
    } catch (err) {
      console.error("SMS send error:", err);
      alert("সার্ভার ত্রুটি ঘটেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setIsSending(false);
    }
  };

  // Filter history logs
  const filteredHistory = useMemo(() => {
    if (!historySearchQuery.trim()) return smsHistory;
    const q = historySearchQuery.toLowerCase();
    return smsHistory.filter(
      (item) =>
        (item.recipientPhone && item.recipientPhone.includes(q)) ||
        (item.studentName && item.studentName.toLowerCase().includes(q)) ||
        (item.recipientName && item.recipientName.toLowerCase().includes(q)) ||
        (item.message && item.message.toLowerCase().includes(q))
    );
  }, [smsHistory, historySearchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HERO BANNER & STATS */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <MessageSquare className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                এসএমএস গেটওয়ে ও অভিভাবক যোগাযোগ হাব
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                PTSC Gateway v2.6
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              অনুপস্থিত শিক্ষার্থী, পরীক্ষার ফলাফল ও জরুরি নোটিশ অভিভাবকদের মোবাইলে এক ক্লিকে বাংলায় প্রেরণ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchSmsData}
            disabled={isLoadingHistory}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
            <span>লগ রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মোট প্রেরিত এসএমএস</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {toBengaliNumerals(stats.totalDispatched)} টি
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            সিমুলেটেড ব্যালেন্স
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            ৳{toBengaliNumerals(stats.simulatedBalance.toFixed(2))}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">আজকের অনুপস্থিত শিক্ষার্থী</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {toBengaliNumerals(stats.absentCount)} জন
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">ইউনিট এসএমএস রেট</div>
          <div className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-1 font-mono">
            ৳০.৪৫ / পার্ট
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN SMS DISPATCHER & PHONE PREVIEW LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: DISPATCHER FORM (7 COLS) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
          <form onSubmit={handleSendSms} className="space-y-5">
            {/* 1. Target Audience Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>প্রাপক নির্বাচন (Target Audience)</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  আনুমানিক প্রাপক: {toBengaliNumerals(estimatedRecipientCount)} জন
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "absent", label: "অনুপস্থিত শিক্ষার্থী", icon: AlertTriangle, badge: `${stats.absentCount} জন` },
                  { id: "trade", label: "নির্দিষ্ট ট্রেড", icon: Layers, badge: "বিভাগভিত্তিক" },
                  { id: "individual", label: "একক অভিভাবক", icon: PhoneCall, badge: "নির্দিষ্ট নম্বর" },
                  { id: "all", label: "সকল অভিভাবক", icon: MessageSquare, badge: "ব্রডকাস্ট" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = targetAudience === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTargetAudience(item.id as any)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-emerald-500"}`} />
                      <span className="text-center">{item.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-md ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional input based on target audience */}
            {targetAudience === "trade" && (
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  কারিগরি ট্রেড / বিভাগ নির্বাচন করুন:
                </label>
                <select
                  value={selectedTrade}
                  onChange={(e) => setSelectedTrade(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {ALL_TRADES.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.nameBangla} ({t.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetAudience === "individual" && (
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">রোল নম্বর:</label>
                    <input
                      type="text"
                      value={rollInput}
                      onChange={(e) => setRollInput(e.target.value)}
                      placeholder="১০১"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">শিক্ষার্থীর নাম:</label>
                    <input
                      type="text"
                      value={studentNameInput}
                      onChange={(e) => setStudentNameInput(e.target.value)}
                      placeholder="রিপন ইসলাম"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">অভিভাবকের মোবাইল:</label>
                    <input
                      type="text"
                      value={individualPhone}
                      onChange={(e) => setIndividualPhone(e.target.value)}
                      placeholder="01712345678"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Message Template Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-500" />
                <span>বার্তা টেমপ্লেট (BTEB Standard Templates)</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { key: "absence", label: "অনুপস্থিতি নোটিশ" },
                  { key: "result", label: "পরীক্ষার ফলাফল" },
                  { key: "emergency", label: "জরুরি বন্ধ/নোটিশ" },
                  { key: "fee", label: "বোর্ড ফি ও তারিখ" },
                  { key: "custom", label: "কাস্টম মেসেজ" },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTemplateKey(t.key as any)}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      templateKey === t.key
                        ? "bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-300 shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Clickable Token Pills */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>ডাইনামিক টোকেন যুক্ত করতে ক্লিক করুন:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { token: "{student_name}", desc: "শিক্ষার্থীর নাম" },
                  { token: "{roll}", desc: "রোল নম্বর" },
                  { token: "{trade}", desc: "ট্রেড" },
                  { token: "{gpa}", desc: "জিপিএ" },
                  { token: "{exam_name}", desc: "পরীক্ষার নাম" },
                  { token: "{date}", desc: "তারিখ" },
                  { token: "{institution}", desc: "প্রতিষ্ঠান" },
                ].map((item) => (
                  <button
                    key={item.token}
                    type="button"
                    onClick={() => insertToken(item.token)}
                    title={item.desc}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold transition cursor-pointer"
                  >
                    {item.token}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Textarea with live character & segment tracker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>বাংলা বার্তার বিবরণ:</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">
                  {smsStats.charCount} অক্ষর • {smsStats.smsCount} টি এসএমএস পার্ট ({smsStats.encoding})
                </span>
              </div>

              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-none shadow-inner"
                placeholder="অভিভাবকদের জন্য এসএমএস বার্তা লিখুন..."
                required
              />

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span>
                  প্রতি এসএমএস খরচ: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">৳০.৪৫</strong>
                </span>
                <span>
                  সর্বমোট আনুমানিক খরচ: <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">৳{toBengaliNumerals(estimatedTotalCost)}</strong>
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>এসএমএস ডিসপাচ করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>
                    {toBengaliNumerals(estimatedRecipientCount)} জন অভিভাবককে এসএমএস পাঠান (Dispatch SMS)
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Success Banner */}
          <AnimatePresence>
            {sendResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs font-semibold">
                  {sendResult.message || `সফলভাবে ${sendResult.count} জন অভিভাবকের মোবাইলে এসএমএস সফলভাবে ডিসপাচ করা হয়েছে! মোট খরচ: ৳${sendResult.cost.toFixed(2)}`}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: SMARTPHONE PREVIEW & GATEWAY MOCKUP (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* REALISTIC SMARTPHONE PREVIEW FRAME */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-500" />
              <span>স্মার্টফোন এসএমএস প্রিভিউ (Live Preview)</span>
            </h3>

            {/* Phone Screen Mockup */}
            <div className="w-full max-w-[280px] mx-auto rounded-[32px] bg-slate-950 border-4 border-slate-800 p-3.5 shadow-xl space-y-3">
              {/* Phone Speaker & Camera Notch */}
              <div className="flex justify-center">
                <div className="w-16 h-3 bg-slate-800 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[10px] text-slate-400">
                <span className="font-bold text-white flex items-center gap-1">
                  <Building className="w-3 h-3 text-cyan-400" />
                  <span>PTSC-GOV</span>
                </span>
                <span>এখন</span>
              </div>

              {/* SMS Bubble */}
              <div className="p-3 rounded-2xl rounded-tl-xs bg-emerald-600 text-white text-xs leading-relaxed shadow-md space-y-1">
                <p className="font-medium text-[11px] leading-relaxed">
                  {previewFormattedText}
                </p>
                <div className="text-[9px] text-emerald-200 text-right pt-0.5">
                  ডেলিভার্ড ✓✓
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-normal">
              অভিভাবকের মোবাইল ইনবক্সে মেসেজটি স্বয়ংক্রিয়ভাবে উপরের মতো বাংলায় প্রদর্শিত হবে।
            </p>
          </div>

          {/* GATEWAY METRICS & CONFIG CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>গেটওয়ে কনফিগারেশন ও সংযোগ</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">প্রোভাইডার:</span>
                <span className="font-bold text-slate-900 dark:text-white">DTE-BTEB / Greenweb Gateway</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">সেন্ডার আইডি (Masking):</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">PTSC-GOV</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">ডেলিভারি মেথড:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  HTTP API + সিমুলেশন
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">সার্ভার লেটেন্সি:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">~০.৪ সেকেন্ড</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RECENT SENT SMS LOGS TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                সাম্প্রতিক প্রেরিত এসএমএস হিস্ট্রি (Delivery Logs)
              </h3>
              <p className="text-[11px] text-slate-400">
                অভিভাবকদের নম্বরে প্রেরিত সাম্প্রতিক এসএমএস ডেলিভারি রিপোর্ট
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="মোবাইল বা নাম খুঁজুন..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4">তারিখ ও সময়</th>
                <th className="py-3 px-4">শিক্ষার্থী / অভিভাবক</th>
                <th className="py-3 px-4">মোবাইল নম্বর</th>
                <th className="py-3 px-4">বার্তার বিবরণ</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">খরচ (টাকা)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-sans">
                    কোনো এসএমএস হিস্ট্রি পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString("bn-BD", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                      {item.studentName || item.recipientName || "অভিভাবক"}
                    </td>
                    <td className="py-3 px-4 text-cyan-600 dark:text-cyan-400 font-bold">
                      {item.recipientPhone}
                    </td>
                    <td className="py-3 px-4 font-sans max-w-sm truncate text-[11.5px]" title={item.message}>
                      {item.message}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold font-sans">
                        {item.status.includes("SIMULATED") ? "ডেলিভার্ড (সিমুলেটেড)" : "ডেলিভার্ড"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                      ৳{item.cost.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
