"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Sparkles,
  Flame,
  Printer,
  Download,
  RotateCcw,
  Users,
  CheckCircle2,
  Share2,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";

export interface PodiumParticipant {
  id?: string;
  name: string;
  avatar?: string;
  score: number;
  streak?: number;
  correctCount?: number;
  wrongCount?: number;
  accuracy?: number;
  roll?: string;
  trade?: string;
}

interface LivePodiumViewProps {
  quizTitle: string;
  trade?: string;
  participants: PodiumParticipant[];
  onRestart?: () => void;
  onClose?: () => void;
}

export default function LivePodiumView({
  quizTitle,
  trade = "IT Support & IoT",
  participants = [],
  onRestart,
  onClose
}: LivePodiumViewProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Sort participants descending by score
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  const first = sorted[0] || null;
  const second = sorted[1] || null;
  const third = sorted[2] || null;
  const runnersUp = sorted.slice(3, 10);

  // Trigger grand victory confetti on mount
  useEffect(() => {
    // Grand celebration sequence
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      try {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      } catch (e) {
        console.warn("Confetti animation error:", e);
      }
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    const interval = setTimeout(() => {
      try {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      } catch (e) {}
    }, 800);

    return () => clearTimeout(interval);
  }, []);

  // Print official institutional result sheet
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ["র‍্যাঙ্ক", "শিক্ষার্থীর নাম", "মোট পয়েন্ট", "ট্রেড", "একটানা স্ট্রিক"];
    const rows = sorted.map((p, idx) => [
      idx + 1,
      `"${p.name}"`,
      p.score,
      `"${trade}"`,
      p.streak || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PTSC_Quiz_Result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-white p-4 sm:p-8 flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Background radial effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/15 via-indigo-600/10 to-transparent blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25" />
      </div>

      {/* TOP HEADER */}
      <header className="relative z-10 max-w-5xl mx-auto w-full text-center space-y-2 pt-2 pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-amber-500/20"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>চূড়ান্ত বিজয়ীদের পডিয়াম ও ফলাফল</span>
        </motion.div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
          {quizTitle}
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) • {trade}
        </p>
      </header>

      {/* MAIN PODIUM STAGE (TOP 3) */}
      <main className="relative z-10 max-w-4xl mx-auto w-full my-auto py-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end justify-center pt-8">
          
          {/* 2ND PLACE (SILVER - LEFT) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            {second && (
              <div className="mb-3 text-center space-y-1">
                <div className="relative inline-block">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-slate-700 via-slate-500 to-slate-400 p-1 shadow-lg shadow-slate-500/30 flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl">{second.avatar || "🥈"}</span>
                  </div>
                  <span className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-slate-300 text-slate-900 dark:text-slate-100 font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow">
                    2
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm md:text-base font-bold text-white line-clamp-1">
                  {second.name}
                </h3>
                <div className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold">
                  {second.score.toLocaleString()} pts
                </div>
              </div>
            )}

            {/* 2nd Place Pedestal Pillar */}
            <div className="w-full h-44 sm:h-52 rounded-t-3xl bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border-t-4 border-l border-r border-slate-400/80 shadow-2xl flex flex-col items-center justify-between py-4 text-slate-200">
              <Medal className="w-8 h-8 text-slate-300" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-white">২য়</div>
                <div className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-300">
                  রৌপ্য পদক
                </div>
              </div>
              <div className="w-12 h-1 bg-slate-500/50 rounded-full" />
            </div>
          </motion.div>

          {/* 1ST PLACE (GOLD - CENTER, TALLEST) */}
          <motion.div
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center"
          >
            {first && (
              <div className="mb-3 text-center space-y-1">
                {/* Crown decoration */}
                <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mx-auto animate-bounce-subtle filter drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />

                <div className="relative inline-block">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-1.5 shadow-2xl shadow-amber-500/50 flex items-center justify-center ring-4 ring-amber-400/40">
                    <span className="text-4xl sm:text-5xl">{first.avatar || "👑"}</span>
                  </div>
                  <span className="absolute -bottom-2.5 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-slate-900 shadow-lg">
                    1
                  </span>
                </div>

                <h3 className="text-sm sm:text-base md:text-lg font-black text-white line-clamp-1 drop-shadow">
                  {first.name}
                </h3>
                <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs sm:text-sm font-mono font-black shadow-sm">
                  {first.score.toLocaleString()} pts
                </div>
              </div>
            )}

            {/* 1st Place Pedestal Pillar */}
            <div className="w-full h-56 sm:h-64 rounded-t-3xl bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 border-t-4 border-l border-r border-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.3)] flex flex-col items-center justify-between py-5 text-amber-100">
              <Trophy className="w-10 h-10 text-yellow-200 filter drop-shadow-[0_0_8px_rgba(254,240,138,0.8)]" />
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-white drop-shadow">১ম</div>
                <div className="text-[11px] sm:text-xs uppercase font-black tracking-widest text-amber-200">
                  চ্যাম্পিয়ন • স্বর্ণপদক
                </div>
              </div>
              <div className="w-16 h-1 bg-amber-300/60 rounded-full" />
            </div>
          </motion.div>

          {/* 3RD PLACE (BRONZE - RIGHT) */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center"
          >
            {third && (
              <div className="mb-3 text-center space-y-1">
                <div className="relative inline-block">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-900 via-amber-700 to-amber-600 p-1 shadow-lg shadow-amber-900/40 flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl">{third.avatar || "🥉"}</span>
                  </div>
                  <span className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow">
                    3
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm md:text-base font-bold text-white line-clamp-1">
                  {third.name}
                </h3>
                <div className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold">
                  {third.score.toLocaleString()} pts
                </div>
              </div>
            )}

            {/* 3rd Place Pedestal Pillar */}
            <div className="w-full h-36 sm:h-44 rounded-t-3xl bg-gradient-to-b from-amber-800 via-amber-900 to-slate-900 border-t-4 border-l border-r border-amber-600/80 shadow-xl flex flex-col items-center justify-between py-4 text-amber-200">
              <Award className="w-8 h-8 text-amber-400" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-white">৩য়</div>
                <div className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-amber-300">
                  ব্রোঞ্জ পদক
                </div>
              </div>
              <div className="w-12 h-1 bg-amber-700/50 rounded-full" />
            </div>
          </motion.div>
        </div>
      </main>

      {/* 4TH TO 10TH PLACE LEADERBOARD ROW-CARDS */}
      {runnersUp.length > 0 && (
        <section className="relative z-10 max-w-4xl mx-auto w-full pt-4 pb-6 space-y-2.5">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              শীর্ষ অংশগ্রহণকারী (৪র্থ - ১০ম স্থান)
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">মোট অংশগ্রহণকারী: {sorted.length} জন</span>
          </div>

          <div className="space-y-2">
            {runnersUp.map((p, idx) => {
              const rank = idx + 4;
              return (
                <motion.div
                  key={p.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 font-mono text-xs font-black flex items-center justify-center border border-slate-700">
                      #{rank}
                    </span>
                    <span className="text-2xl">{p.avatar || "👤"}</span>
                    <div>
                      <div className="text-sm font-bold text-white leading-tight">{p.name}</div>
                      {p.streak && p.streak > 1 && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>{p.streak} টি একটানা সঠিক</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-cyan-400 font-mono">
                      {p.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                      পয়েন্ট
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* FOOTER ACTIONS: Print Official Sheet, Export CSV, Restart */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>অফিশিয়াল রেজাল্ট শিট প্রিন্ট</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>এক্সেল / CSV ডাউনলোড</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>নতুন কুইজ শুরু করুন</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              বন্ধ করুন
            </button>
          )}
        </div>
      </footer>

      {/* PRINT-ONLY OFFICIAL INSTITUTIONAL RESULT SHEET */}
      <div className="hidden print:block fixed inset-0 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-8 z-[9999] overflow-y-auto">
        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
          <h2 className="text-xl font-black uppercase">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h2>
          <h3 className="text-2xl font-black">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)</h3>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">কারিগরি শিক্ষা অধিদপ্তর, শিক্ষা মন্ত্রণালয়</p>
          <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-700 text-sm font-bold flex items-center justify-between">
            <span>কুইজ প্রতিযোগিতা: {quizTitle}</span>
            <span>তারিখ: {new Date().toLocaleDateString("bn-BD")}</span>
            <span>ট্রেড: {trade}</span>
          </div>
        </div>

        <table className="w-full text-left text-sm border-collapse border border-slate-400 mb-8">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-400">
              <th className="p-2.5 border-r border-slate-400 w-16 text-center">ক্রমিক</th>
              <th className="p-2.5 border-r border-slate-400">শিক্ষার্থীর নাম</th>
              <th className="p-2.5 border-r border-slate-400 text-center">মোট পয়েন্ট</th>
              <th className="p-2.5 border-r border-slate-400 text-center">স্ট্রিক</th>
              <th className="p-2.5 text-center">মন্তব্য</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, idx) => (
              <tr key={idx} className="border-b border-slate-300 dark:border-slate-700">
                <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center font-bold">
                  {idx + 1}
                </td>
                <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 font-semibold">
                  {p.name}
                </td>
                <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center font-mono font-bold">
                  {p.score}
                </td>
                <td className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-center font-mono">
                  {p.streak || 0}
                </td>
                <td className="p-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  {idx === 0 ? "১ম স্থান (স্বর্ণপদক)" : idx === 1 ? "২য় স্থান (রৌপ্যপদক)" : idx === 2 ? "৩য় স্থান (ব্রোঞ্জপদক)" : "অংশগ্রহণকারী"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-end pt-12 mt-12 border-t border-slate-400 text-sm">
          <div className="text-center">
            <div className="w-44 border-b border-slate-800 mb-1" />
            <p className="font-bold">ইন্সট্রাক্টর / কোর্স কোঅর্ডিনেটর</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-slate-800 mb-1" />
            <p className="font-bold">অধ্যক্ষ / পরীক্ষা নিয়ন্ত্রক</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">PTSC, পঞ্চগড়</p>
          </div>
        </div>
      </div>
    </div>
  );
}
