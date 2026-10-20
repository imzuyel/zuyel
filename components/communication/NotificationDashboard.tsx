"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Send,
  MessageSquare,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCircle2,
  Users,
  Search,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function NotificationDashboard() {
  const { user, showToast, notifications } = useAuth();
  const { t } = useLanguage();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Send broadcast alert form
  const [targetAudience, setTargetAudience] = useState("all");
  const [channel, setChannel] = useState("both"); // sms, app, both
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetch("/api/notices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotices(data.items || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) {
      showToast("বিজ্ঞপ্তির শিরোনাম এবং বার্তা পূরণ করুন", "error");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: alertTitle,
          titleBangla: alertTitle,
          content: alertMessage,
          category: "urgent",
          author: user?.name || "অধ্যক্ষের কার্যালয়",
          isUrgent: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          `ব্রডকাস্ট নোটিশ সফলভাবে প্রেরিত হয়েছে (${targetAudience.toUpperCase()} - ${channel.toUpperCase()})`,
          "success"
        );
        setNotices([json.notice, ...notices]);
        setAlertTitle("");
        setAlertMessage("");
      }
    } catch (err) {
      showToast("নোটিশ প্রেরণে সমস্যা হয়েছে", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold backdrop-blur-xs border border-white/20">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>স্মার্ট অ্যালার্ট ও নোটিশ হাব</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            রিয়েল-টাইম অ্যালার্ট ও এসএমএস ব্রডকাস্ট ড্যাশবোর্ড
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            অভিভাবক, শিক্ষার্থী ও শিক্ষকদের মাঝে তাৎক্ষণিক নোটিশ, জরুরি এসএমএস ও বুলেটিন প্রকাশের কন্ট্রোল রুম
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Broadcast Notice / SMS Sender (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>জরুরি বিজ্ঞপ্তি / এসএমএস প্রেরণ</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              SMS Gateway Ready
            </span>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-3.5">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                গ্রাহক শ্রেণী (Target Audience)
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white"
              >
                <option value="all">সকল (অভিভাবক, শিক্ষার্থী ও শিক্ষক)</option>
                <option value="guardians">শুধুমাত্র অভিভাবকবৃন্দ</option>
                <option value="students">শুধুমাত্র শিক্ষার্থীবৃন্দ</option>
                <option value="faculty">শুধুমাত্র শিক্ষক ও কর্মকর্তাবৃন্দ</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                বিতরণ চ্যানেল (Delivery Channel)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel("sms")}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    channel === "sms"
                      ? "bg-indigo-50 dark:bg-slate-800 border-indigo-600 text-indigo-600 dark:text-cyan-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <span>SMS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("app")}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    channel === "app"
                      ? "bg-indigo-50 dark:bg-slate-800 border-indigo-600 text-indigo-600 dark:text-cyan-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <span>ওয়েব নোটিশ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("both")}
                  className={`p-2 rounded-xl border text-center font-bold transition-all ${
                    channel === "both"
                      ? "bg-indigo-50 dark:bg-slate-800 border-indigo-600 text-indigo-600 dark:text-cyan-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <span>উভয়ই (Both)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                বিজ্ঞপ্তির বিষয় / শিরোনাম
              </label>
              <input
                type="text"
                placeholder="যেমন: ঘূর্ণিঝড় সতর্কতা বা পরীক্ষার সূচি পরিবর্তন"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                বার্তার মূল অংশ (Message Content)
              </label>
              <textarea
                rows={4}
                placeholder="বিস্তারিত নোটিশ বা ১৬০ অক্ষরের এসএমএস বার্তা লিখুন..."
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? "প্রেরণ করা হচ্ছে..." : "তাৎক্ষণিক প্রচার করুন (Broadcast)"}</span>
            </button>
          </form>
        </div>

        {/* Right: Published Notice Board (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>ডিজিটাল নোটিশ বোর্ড (Published Notices)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">মোট {notices.length} টি</span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400">নোটিশ লোড হচ্ছে...</div>
            ) : notices.length === 0 ? (
              <div className="p-8 text-center text-slate-400">কোনও নোটিশ পাওয়া যায়নি।</div>
            ) : (
              notices.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    n.isUrgent
                      ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {n.isUrgent && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500 text-white flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>জরুরি</span>
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-cyan-400">
                          {n.categoryBangla || n.category}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {n.titleBangla || n.title}
                      </h4>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {n.publishedAt}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {n.content}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>প্রেরক: {n.author}</span>
                    {n.attachmentName && (
                      <span className="text-teal-700 dark:text-teal-400 font-medium">
                        সংযুক্তি: {n.attachmentName}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
