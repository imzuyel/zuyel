"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Zap,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  School,
  Flame,
  Gamepad2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const VIBRANT_3D_AVATARS = [
  { id: "rocket", emoji: "🚀", name: "রকেট" },
  { id: "lion", emoji: "🦁", name: "সিংহ" },
  { id: "fox", emoji: "🦊", name: "শিয়াল" },
  { id: "robot", emoji: "🤖", name: "রোবট" },
  { id: "unicorn", emoji: "🦄", name: "ইউনিকর্ন" },
  { id: "lightning", emoji: "⚡", name: "বিদ্যুৎ" },
  { id: "tiger", emoji: "🐯", name: "বাঘ" },
  { id: "star", emoji: "🌟", name: "তারা" },
  { id: "crown", emoji: "👑", name: "মুকুট" },
  { id: "target", emoji: "🎯", name: "টার্গেট" },
  { id: "dolphin", emoji: "🐬", name: "ডলফিন" },
  { id: "fire", emoji: "🔥", name: "আগুন" },
];

export interface StudentAuthIdentity {
  playerId: string;
  playerName: string;
  roll: string;
  avatar: string;
  sessionId: string;
  roomCode: string;
}

interface StudentModern3DJoinCardProps {
  initialCode?: string;
  onJoined?: (identity: StudentAuthIdentity) => void;
}

export default function StudentModern3DJoinCard({
  initialCode = "",
  onJoined,
}: StudentModern3DJoinCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(VIBRANT_3D_AVATARS[0].emoji);

  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifiedSession, setVerifiedSession] = useState<{
    id: string;
    title: string;
    className: string;
    trade: string;
    playerCount: number;
  } | null>(null);

  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial code from URL params
  useEffect(() => {
    const paramCode = searchParams?.get("code") || searchParams?.get("pin") || "";
    if (paramCode && !code) {
      setCode(paramCode.trim());
    }
  }, [searchParams, code]);

  // Auto-verify 6-digit room code
  useEffect(() => {
    const clean = code.trim().replace(/\D/g, "");
    if (clean.length === 6) {
      let isMounted = true;
      setIsVerifyingCode(true);
      setErrorMsg(null);

      fetch(`/api/live-quizzes/sessions?code=${clean}`)
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data.success && data.session) {
            setVerifiedSession({
              id: data.session.id,
              title: data.session.title || "লাইভ কুইজ",
              className: data.session.className || "কারিগরি শাখা",
              trade: data.session.trade || "জেনারেল",
              playerCount: Object.keys(data.session.players || {}).length,
            });
          } else {
            // Check state fallback
            fetch(`/api/live-quizzes/sessions/${clean}/state`)
              .then((r) => r.json())
              .then((stateData) => {
                if (!isMounted) return;
                if (stateData.success && stateData.session) {
                  setVerifiedSession({
                    id: stateData.session.id,
                    title: stateData.session.title || "লাইভ কুইজ",
                    className: stateData.session.className || "কারিগরি শাখা",
                    trade: stateData.session.trade || "জেনারেল",
                    playerCount: stateData.totalPlayers || 0,
                  });
                } else {
                  setVerifiedSession(null);
                }
              })
              .catch(() => {
                if (isMounted) setVerifiedSession(null);
              });
          }
        })
        .catch(() => {
          if (isMounted) setVerifiedSession(null);
        })
        .finally(() => {
          if (isMounted) setIsVerifyingCode(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setVerifiedSession(null);
    }
  }, [code]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().replace(/\D/g, "");

    if (cleanCode.length < 4) {
      setErrorMsg("অনুগ্রহ করে একটি সঠিক রুম কোড (PIN) লিখুন।");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("অনুগ্রহ করে আপনার নাম লিখুন।");
      return;
    }

    setIsJoining(true);
    setErrorMsg(null);

    try {
      // Unique tab-scoped player ID
      const localId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const res = await fetch("/api/live-quizzes/sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCode: cleanCode,
          displayName: name.trim(),
          roll: roll.trim() || "—",
          avatar: selectedAvatar,
          playerId: localId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || data.error || "লবিতে প্রবেশ করতে সমস্যা হয়েছে।");
      }

      const assignedPlayerId = data.participant?.id || data.player?.id || localId;
      const actualSessionId = data.session?.id || verifiedSession?.id || `sess_${cleanCode}`;

      const identity: StudentAuthIdentity = {
        playerId: assignedPlayerId,
        playerName: name.trim(),
        roll: roll.trim() || "—",
        avatar: selectedAvatar,
        sessionId: actualSessionId,
        roomCode: cleanCode,
      };

      // Store in sessionStorage (per-tab) and localStorage fallback (keyed by roomCode)
      try {
        sessionStorage.setItem("live_quiz_player", JSON.stringify(identity));
        localStorage.setItem(`live_quiz_player_${cleanCode}`, JSON.stringify(identity));
      } catch {
        // quota safety
      }

      // Haptic confirmation
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([40, 30, 40]);
      }

      if (onJoined) {
        onJoined(identity);
      } else {
        router.push(`/quiz/live?sessionId=${actualSessionId}&code=${cleanCode}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "কানেকশনে সমস্যা দেখা দিয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto relative select-none">
      {/* 3D Glassmorphic Ambient Neon Outer Glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 opacity-30 blur-2xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative rounded-3xl bg-slate-900/80 border border-slate-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-6 sm:p-8 space-y-6">
        {/* PGTSC Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 via-indigo-500/15 to-purple-500/10 border border-cyan-400/30 text-cyan-300 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <School className="w-4 h-4 text-cyan-400" />
            <span>PGTSC লাইভ কুইজ পোর্টাল</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            লাইভ কুইজে যোগ দিন
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            রুম কোড ও তোমার তথ্য দিয়ে সরাসরি রিয়েল-টাইম কুইজে অংশগ্রহণ করো।
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-center gap-3 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span className="font-medium">{errorMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleJoinSubmit} className="space-y-5">
          {/* Room Code (6-digit PIN) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-300">
              <label htmlFor="room-code-input" className="flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>৬ ডিজিটের রুম কোড (Room PIN)</span>
              </label>
              {isVerifyingCode && (
                <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 lowercase font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" /> ভেরিফাই হচ্ছে...
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="room-code-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="1 2 3 4 5 6"
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-950/90 border-2 border-slate-700 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 text-center font-mono text-2xl sm:text-3xl font-black text-cyan-300 tracking-[0.3em] outline-none transition-all placeholder:text-slate-600 shadow-inner"
              />
            </div>

            {/* Verified Session Preview Banner */}
            <AnimatePresence>
              {verifiedSession && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="font-black truncate">{verifiedSession.title}</span>
                    <span className="text-slate-400">({verifiedSession.className})</span>
                  </div>
                  <div className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/20 font-bold text-[10px]">
                    <Users className="w-3 h-3 text-emerald-400" />
                    <span>{verifiedSession.playerCount} জন</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Student Name & Roll */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="student-name-input" className="block text-xs font-black uppercase tracking-wider text-slate-300">
                তোমার পুরো নাম
              </label>
              <input
                id="student-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ"
                className="w-full py-3 px-4 rounded-2xl bg-slate-950/80 border-2 border-slate-700 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-sm font-bold text-white outline-none transition-all placeholder:text-slate-500 shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="student-roll-input" className="block text-xs font-black uppercase tracking-wider text-slate-300">
                রোল নম্বর
              </label>
              <input
                id="student-roll-input"
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder="যেমন: ১২"
                className="w-full py-3 px-4 rounded-2xl bg-slate-950/80 border-2 border-slate-700 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-center text-sm font-bold text-amber-300 outline-none transition-all placeholder:text-slate-500 shadow-inner"
              />
            </div>
          </div>

          {/* 12 Vibrant 3D Avatar Selector */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-300">
              <span>তোমার অবতার নির্বাচন করো</span>
              <span className="text-cyan-400 font-mono text-base">{selectedAvatar}</span>
            </label>

            <div className="grid grid-cols-6 gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              {VIBRANT_3D_AVATARS.map((av) => {
                const isSelected = selectedAvatar === av.emoji;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.emoji)}
                    className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-tr from-cyan-500 to-indigo-600 scale-110 shadow-[0_0_20px_rgba(6,182,212,0.6)] ring-2 ring-white"
                        : "bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:scale-105"
                    }`}
                    title={av.name}
                  >
                    <span>{av.emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Join Action Button */}
          <motion.button
            type="submit"
            disabled={isJoining}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-base sm:text-lg shadow-[0_10px_35px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                <span>লবিতে প্রবেশ করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <Flame className="w-5 h-5 fill-slate-950 text-slate-950" />
                <span>🚀 লাইভ কুইজে জয়েন করুন</span>
                <ArrowRight className="w-5 h-5 text-slate-950" />
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}

