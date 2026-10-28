"use client";

import React, { useState } from "react";
import { useQuizSession } from "@/context/QuizSessionContext";
import { GlowCard } from "@/components/quiz/ui/TechVisuals";
import { 
  LogOut, 
  CheckCircle2, 
  Users, 
  Clock, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Tv, 
  Loader2, 
  Sparkles, 
  Radio, 
  MessageSquare, 
  Send, 
  Check, 
  Vote,
  Smile,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function LobbyPage() {
  const { 
    displayName, 
    activeSession,
    quizDetails, 
    sessionCode, 
    handleLeave, 
    playerCount,
    networkStatus,
    activePreQuizActivity,
    preQuizResponseSubmitted,
    handlePreQuizResponse
  } = useQuizSession();

  const [customResponse, setCustomResponse] = useState("");
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scheduled Start Countdown Timer
  const scheduledTimeStr = activeSession?.scheduledStartTime || quizDetails?.scheduledStartTime;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => {
    if (!scheduledTimeStr) return null;
    const diff = Math.floor((new Date(scheduledTimeStr).getTime() - Date.now()) / 1000);
    return diff > 0 ? diff : null;
  });

  React.useEffect(() => {
    if (!scheduledTimeStr) return;
    const tick = () => {
      const diff = Math.floor((new Date(scheduledTimeStr).getTime() - Date.now()) / 1000);
      setSecondsLeft(diff > 0 ? diff : null);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [scheduledTimeStr]);

  const onSubmitPreQuiz = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalAnswer = selectedPollOption || customResponse.trim();
    if (!finalAnswer) return;

    setIsSubmitting(true);
    await handlePreQuizResponse?.(finalAnswer);
    setIsSubmitting(false);
    setCustomResponse("");
  };

  return (
    <div className="space-y-6 pt-6 max-w-lg mx-auto px-3">
      {/* SCHEDULED START COUNTDOWN CARD (TASK 3) */}
      {secondsLeft !== null && secondsLeft > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-3xl bg-linear-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.25)] text-center space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>নির্ধারিত সময়সূচি (Scheduled Start)</span>
          </div>
          <h3 className="text-sm font-black text-white">কুইজ শুরু হতে বাকি</h3>
          
          <div className="flex items-center justify-center gap-3 font-mono font-black">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-indigo-800/60 min-w-[70px]">
              <span className="text-3xl text-cyan-400 block">
                {Math.floor(secondsLeft / 60).toString().padStart(2, "0")}
              </span>
              <span className="text-[9px] text-slate-400 block uppercase font-sans mt-0.5">মিনিট</span>
            </div>
            <span className="text-2xl text-indigo-400 animate-pulse">:</span>
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-indigo-800/60 min-w-[70px]">
              <span className="text-3xl text-amber-400 block">
                {(secondsLeft % 60).toString().padStart(2, "0")}
              </span>
              <span className="text-[9px] text-slate-400 block uppercase font-sans mt-0.5">সেকেন্ড</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            কাউন্টডাউন শূন্যে পৌঁছালে স্বয়ংক্রিয়ভাবে প্রথম স্লাইড ওপেন হবে!
          </p>
        </motion.div>
      )}

      {/* Header with Live Status & Student Name */}
      <div className="text-center space-y-2">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>লবিতে সফলভাবে যুক্ত</span>
        </motion.div>
        
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {displayName}
        </h2>
        <p className="text-xs text-slate-400">
          শিক্ষক কুইজ শুরু করা মাত্রই আপনার স্ক্রিনে স্বয়ংক্রিয়ভাবে প্রশ্ন প্রদর্শিত হবে।
        </p>
      </div>

      {/* =========================================================
          PRE-QUIZ INTERACTIVE ACTIVITY CARD (WHEN HOST SENDS ONE)
          Rule 1: Pre-Quiz activity before actual competitive quiz starts:
          - NO 3-2-1 countdown
          - NO GO animation
          - NO Question Preview animation
          - NO Options Reveal sequence
          - NO Main Quiz Timer
          - NO Automatic funny/motivational SMS
          - NO Quiz score, question progress or leaderboard points!
          ========================================================= */}
      <AnimatePresence>
        {activePreQuizActivity && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="relative"
          >
            <div className="relative rounded-3xl p-0.5 bg-linear-to-r from-amber-400 via-fuchsia-500 to-cyan-400 shadow-[0_0_35px_rgba(245,158,11,0.3)]">
              <div className="p-6 bg-slate-950/95 rounded-[22px] space-y-4">
                {/* Header Tag */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>
                      {activePreQuizActivity.type === "poll" ? "প্রি-কুইজ লাইভ পোল (Poll)" : "হোস্টের ইন্টারঅ্যাক্টিভ বার্তা (Icebreaker)"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-white/5">
                    নন-কম্পিটিটিভ • কোনো টাইমার নেই
                  </span>
                </div>

                {/* Prompt Message */}
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                    {activePreQuizActivity.prompt}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    কুইজ শুরুর আগে শিক্ষক সবার সাথে যোগাযোগ করছেন। আপনার মতামত জানান:
                  </p>
                </div>

                {/* Response Section */}
                {preQuizResponseSubmitted ? (
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black">আপনার উত্তর পাঠানো হয়েছে!</h4>
                      <p className="text-[10px] text-slate-400">শিক্ষক এটি স্ক্রিনে লাইভ দেখতে পাচ্ছেন। প্রকৃত কুইজের জন্য অপেক্ষা করুন।</p>
                    </div>
                  </motion.div>
                ) : activePreQuizActivity.options && activePreQuizActivity.options.length > 0 ? (
                  /* Poll Options Selection */
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      {activePreQuizActivity.options.map((opt: string, optIdx: number) => {
                        const isChosen = selectedPollOption === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => setSelectedPollOption(opt)}
                            className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                              isChosen
                                ? "bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/20"
                                : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[11px] font-black shrink-0 ${
                              isChosen ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-400"
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isChosen && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={!selectedPollOption || isSubmitting}
                      onClick={() => onSubmitPreQuiz()}
                      className="w-full py-2.5 rounded-xl bg-linear-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>উত্তর জমা দিন (Submit Poll Vote)</span>
                    </button>
                  </div>
                ) : (
                  /* Open-ended Text Response */
                  <form onSubmit={onSubmitPreQuiz} className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={customResponse}
                        onChange={(e) => setCustomResponse(e.target.value)}
                        placeholder="আপনার উত্তর বা মন্তব্য এখানে লিখুন..."
                        maxLength={120}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-400 text-white text-xs placeholder:text-slate-500 dark:text-slate-400 outline-none transition-all"
                      />
                    </div>

                    {/* Quick Reactions */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">দ্রুত বার্তা:</span>
                      {["খুব ভালো!", "প্রস্তুত!", "ইনশাআল্লাহ", "ধন্যবাদ"].map((quick) => (
                        <button
                          key={quick}
                          type="button"
                          onClick={() => setCustomResponse(quick)}
                          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          {quick}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={!customResponse.trim() || isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-linear-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>উত্তর পাঠান (Send Response)</span>
                    </button>
                  </form>
                )}

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{activePreQuizActivity.responses?.length || 0} জন শিক্ষার্থী উত্তর দিয়েছেন</span>
                  <span>স্কোর গণনা শুরু হবে কুইজ স্টার্টের পর</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GlowCard glowVariant="cyan" className="p-0.5">
        <div className="p-6 space-y-6 bg-slate-950/90 rounded-[26px]">
          {/* Network Status Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
            networkStatus === "connected" 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}>
            <div className="flex items-center gap-2.5 text-xs font-bold">
              {networkStatus === "connected" ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 animate-pulse text-rose-400" />
              )}
              <span>
                {networkStatus === "connected" ? "লাইভ সার্ভার সিঙ্ক সম্পন্ন" : "সার্ভার সংযোগ বিচ্ছিন্ন... পুনর্চেষ্টা চলছে"}
              </span>
            </div>
            <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-black/40 border border-white/10">
              PIN: {sessionCode}
            </span>
          </div>

          {/* Quiz Details Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-15 transition-opacity">
              <Tv className="w-16 h-16 text-cyan-400" />
            </div>

            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block">
                চলমান লাইভ সেশন
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                {quizDetails?.title || "ডিজিটাল লাইভ কুইজ সেশন"}
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 relative z-10 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-black">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{quizDetails?.questionCount || 0}টি প্রশ্ন</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-black">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                <span>অ্যান্টি-চিট সিকিউর</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>ডাইনামিক প্লেট সক্রিয়</span>
              </div>
            </div>
          </div>

          {/* Participant Count & Avatars */}
          <div className="text-center py-4 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800/60 p-4">
            <div className="flex items-center justify-center -space-x-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className={`w-9 h-9 rounded-full border-2 border-slate-950 flex items-center justify-center text-xs font-black shadow-md ${
                    i === 1 ? "bg-cyan-500 text-slate-950 font-black" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {i === 1 ? displayName?.[0] || "U" : String.fromCharCode(64 + i)}
                </motion.div>
              ))}
              <div className="w-9 h-9 rounded-full border-2 border-slate-950 bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-md">
                +{playerCount > 5 ? playerCount - 5 : 0}
              </div>
            </div>

            <p className="text-xs sm:text-sm font-bold text-slate-300">
              বর্তমানে <span className="text-cyan-400 font-black">{playerCount} জন শিক্ষার্থী</span> লবিতে অপেক্ষা করছেন
            </p>
          </div>

          {/* Mandatory Sequence Preview Alert */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-left space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              কুইজের নিয়মাবলী (Quiz Rules & Sequence):
            </span>
            <ul className="text-[11px] text-slate-400 space-y-1 font-medium list-disc list-inside">
              <li>হোস্টের প্রি-কুইজ কার্যকলাপ সমাপ্ত হলে এবং <strong className="text-emerald-400">প্রকৃত কুইজ</strong> শুরু হলে সম্পূর্ণ Quiz Mode চালু হবে।</li>
              <li>প্রতিটি প্রকৃত প্রশ্নের শুরুতে <strong className="text-cyan-300">৩ সেকেন্ডের কাউন্টডাউন (3 → 2 → 1 → GO!)</strong> চলবে।</li>
              <li>এরপর <strong className="text-amber-300">৩ সেকেন্ড প্রশ্ন প্রিভিউ</strong> থাকবে (অপশন তখনো দেখা যাবে না)।</li>
              <li>প্রিভিউ শেষে সব অপশন উন্মোচিত হবে এবং <strong className="text-emerald-300">মূল টাইমার</strong> শুরু হবে।</li>
              <li>টাইমার চলাকালীন দ্রুত সঠিক উত্তর নিশ্চিত করে সর্বোচ্চ স্কোর অর্জন করুন!</li>
            </ul>
          </div>

          {/* Waiting Pulsing Indicator */}
          <div className="text-center space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-center gap-2 text-cyan-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest">
                হোস্টের প্রকৃত কুইজ শুরুর অপেক্ষা...
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic px-2">
              স্ক্রিন রিফ্রেশ করার প্রয়োজন নেই; শুরু হওয়ামাত্র স্বয়ংক্রিয়ভাবে লাইভ কুইজ পেজ খুলবে।
            </p>
          </div>

          {/* Leave Button */}
          <motion.button
            whileHover={{ backgroundColor: "rgba(244, 63, 94, 0.1)", borderColor: "rgba(244, 63, 94, 0.3)", color: "#fb7185" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLeave}
            className="w-full h-11 rounded-xl border border-slate-800 bg-transparent text-slate-500 dark:text-slate-400 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-rose-500/40"
          >
            <LogOut className="w-4 h-4" />
            <span>লবি ত্যাগ করুন (Leave Lobby)</span>
          </motion.button>
        </div>
      </GlowCard>
    </div>
  );
}
