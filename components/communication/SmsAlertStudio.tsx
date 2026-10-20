"use client";

import React, { useState, useEffect } from "react";
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
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { calculateSmsCount, BTEB_SMS_TEMPLATES } from "@/lib/smsGatewayEngine";

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

export default function SmsAlertStudio() {
  const [targetAudience, setTargetAudience] = useState<"absent" | "trade" | "individual" | "all">("absent");
  const [selectedTrade, setSelectedTrade] = useState("IT Support & IoT");
  const [templateKey, setTemplateKey] = useState<"absence" | "result" | "emergency" | "custom">("absence");
  const [messageText, setMessageText] = useState(BTEB_SMS_TEMPLATES.absence);
  const [individualPhone, setIndividualPhone] = useState("01712345678");
  const [studentNameInput, setStudentNameInput] = useState("রিপন ইসলাম");
  
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; count: number; cost: number } | null>(null);
  const [smsHistory, setSmsHistory] = useState<SmsLogItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Update text when template changes
  useEffect(() => {
    if (templateKey !== "custom") {
      setMessageText(BTEB_SMS_TEMPLATES[templateKey]);
    }
  }, [templateKey]);

  // Fetch recent SMS logs
  const fetchLogs = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/communication/sms/send");
      const data = await res.json();
      if (data.success && data.logs) {
        setSmsHistory(data.logs);
      }
    } catch (err) {
      console.error("Failed to load SMS logs:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // SMS character & part stats
  const smsStats = calculateSmsCount(messageText);

  // Insert tag helper
  const insertTag = (tag: string) => {
    setMessageText((prev) => prev + tag);
  };

  // Handle send SMS
  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/communication/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAudience,
          selectedTrade,
          templateType: templateKey,
          message: messageText,
          individualPhone,
          studentName: studentNameInput
        })
      });

      const data = await res.json();
      if (data.success) {
        setSendResult({
          success: true,
          count: data.sentCount || 1,
          cost: data.totalCost || 0.45
        });
        fetchLogs();
      } else {
        alert(data.message || "এসএমএস পাঠাতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error("SMS send error:", err);
      alert("সার্ভার ত্রুটি ঘটেছে।");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>বাংলাদেশি বুল্ক এসএমএস গেটওয়ে (PTSC Gateway)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            এসএমএস অ্যালার্ট ও নোটিশ স্টুডিও
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            অনুপস্থিত শিক্ষার্থী, পরীক্ষার ফলাফল এবং জরুরি নোটিশ অভিভাবকদের মোবাইলে এক ক্লিকে বাংলায় প্রেরণ করুন।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchLogs}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
            <span>লগ রিফ্রেশ</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT FORM PANEL (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-6 backdrop-blur-xl">
          <form onSubmit={handleSendSms} className="space-y-5">
            {/* 1. Target Audience */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>প্রাপক বা টার্গেট অডিয়েন্স (Target Audience)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "absent", label: "অনুপস্থিত শিক্ষার্থী", icon: AlertTriangle },
                  { id: "trade", label: "শ্রেণি / ট্রেড", icon: Users },
                  { id: "individual", label: "একক অভিভাবক", icon: PhoneCall },
                  { id: "all", label: "সকল অভিভাবক", icon: MessageSquare }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = targetAudience === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTargetAudience(item.id as any)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                          : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-cyan-400"}`} />
                      <span className="text-center">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional input based on audience */}
            {targetAudience === "trade" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">ট্রেড বা বিভাগ নির্বাচন করুন:</label>
                <select
                  value={selectedTrade}
                  onChange={(e) => setSelectedTrade(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="IT Support & IoT">Computer / IT Support & IoT</option>
                  <option value="Electrical">Electrical Works & Maintenance</option>
                  <option value="Civil">Civil Construction & Drafting</option>
                  <option value="Automotive">Automotive & Machine Shop</option>
                  <option value="RAC">Refrigeration & Air Conditioning</option>
                </select>
              </div>
            )}

            {targetAudience === "individual" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">শিক্ষার্থীর নাম:</label>
                  <input
                    type="text"
                    value={studentNameInput}
                    onChange={(e) => setStudentNameInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">অভিভাবকের মোবাইল নম্বর:</label>
                  <input
                    type="text"
                    value={individualPhone}
                    onChange={(e) => setIndividualPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* 2. Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>বার্তা টেমপ্লেট (BTEB Standard Templates)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: "absence", label: "অনুপস্থিতি অ্যালার্ট" },
                  { key: "result", label: "পরীক্ষার ফলাফল" },
                  { key: "emergency", label: "জরুরি নোটিশ" },
                  { key: "custom", label: "কাস্টম টেক্সট" }
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTemplateKey(t.key as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      templateKey === t.key
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-xs"
                        : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Placeholder Tag Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-400" />
                <span>ডাইনামিক ট্যাগ যুক্ত করতে ক্লিক করুন:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "{student_name}", title: "শিক্ষার্থীর নাম" },
                  { label: "{roll}", title: "রোল নম্বর" },
                  { label: "{trade}", title: "ট্রেড" },
                  { label: "{gpa}", title: "জিপিএ" },
                  { label: "{exam_name}", title: "পরীক্ষার নাম" }
                ].map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => insertTag(tag.label)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-[11px] transition-colors cursor-pointer"
                    title={tag.title}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Message Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">বাংলা বার্তার বিবরণ:</label>
                <div className="text-[11px] font-mono font-bold text-cyan-400">
                  {smsStats.charCount} অক্ষর • {smsStats.smsCount} টি এসএমএস ({smsStats.encoding})
                </div>
              </div>
              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-cyan-500 leading-relaxed resize-none shadow-inner"
                placeholder="আপনার বার্তা এখানে লিখুন..."
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>আনুমানিক খরচ: <strong className="text-emerald-400 font-mono">৳{(smsStats.smsCount * 0.45).toFixed(2)}</strong> প্রতি নম্বর</span>
                <span>ইউনিকোড সমর্থন সক্রিয়</span>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>এসএমএস পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-cyan-200" />
                  <span>এক ক্লিকে এসএমএস পাঠান (Dispatch SMS)</span>
                </>
              )}
            </button>
          </form>

          {/* Send result success alert */}
          <AnimatePresence>
            {sendResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs font-semibold">
                  সফলভাবে <span className="font-bold text-white">{sendResult.count}</span> জন অভিভাবকের মোবাইলে এসএমএস সফলভাবে ডিসপাচ করা হয়েছে! মোট খরচ: ৳{sendResult.cost.toFixed(2)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT PREVIEW & STATS PANEL (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* REALISTIC SMARTPHONE SMS BUBBLE PREVIEW */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4 backdrop-blur-xl">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>মোবাইল প্রিভিউ ফ্রেম (Live Phone Preview)</span>
            </h3>

            {/* Phone Screen Mockup */}
            <div className="w-full max-w-xs mx-auto rounded-3xl bg-slate-950 border-4 border-slate-700 p-4 shadow-2xl space-y-3">
              {/* Phone Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] text-slate-400">
                <span className="font-bold text-slate-300">PTSC SMS</span>
                <span>10:42 AM</span>
              </div>

              {/* Sender ID */}
              <div className="text-center">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 text-[10px] font-bold">
                  Sender: PTSC (Official)
                </span>
              </div>

              {/* SMS Bubble */}
              <div className="p-3.5 rounded-2xl rounded-tl-sm bg-indigo-600 text-white text-xs leading-relaxed shadow-md space-y-1">
                <p className="font-medium">
                  {messageText
                    .replace("{student_name}", studentNameInput)
                    .replace("{roll}", "১০৪")
                    .replace("{trade}", selectedTrade)
                    .replace("{gpa}", "৪.৮৮")
                    .replace("{exam_name}", "অর্ধবার্ষিক পরীক্ষা")
                    .replace("{notice_text}", "আগামীকাল সকল ক্লাস স্থগিত থাকবে।")}
                </p>
                <div className="text-[9px] text-indigo-200 text-right pt-1">
                  Just now ✓✓
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              অভিভাবকদের মোবাইলে ইনবক্সে বাংলা বার্তাটি এভাবেই প্রদর্শিত হবে।
            </p>
          </div>

          {/* GATEWAY STATUS CARD */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-3 backdrop-blur-xl">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>গেটওয়ে স্ট্যাটাস ও ব্যালেন্স</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">গেটওয়ে মোড</div>
                <div className="text-xs font-black text-emerald-400 mt-0.5">প্রিভিউ সিমুলেটর (Active)</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">এসএমএস রেট</div>
                <div className="text-xs font-black text-cyan-400 mt-0.5">৳০.৪৫ / পার্ট</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT SENT SMS HISTORY TABLE */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>সাম্প্রতিক প্রেরিত এসএমএস হিস্ট্রি (SMS Delivery Logs)</span>
          </h3>
          <span className="text-xs font-bold text-slate-400">মোট রেকর্ড: {smsHistory.length} টি</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4">তারিখ ও সময়</th>
                <th className="py-3 px-4">শিক্ষার্থী / অভিভাবক</th>
                <th className="py-3 px-4">মোবাইল নম্বর</th>
                <th className="py-3 px-4">বার্তার বিবরণ</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">খরচ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {smsHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                    কোনো এসএমএস হিস্ট্রি পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                smsHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {item.studentName || item.recipientName || "অভিভাবক"}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {item.recipientPhone}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={item.message}>
                      {item.message}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
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
