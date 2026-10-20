"use client";

import React, { useEffect, useState } from "react";
import { useQuizSession } from "@/context/QuizSessionContext";
import {
  ArrowRight,
  Tv,
  Users,
  Loader2,
  AlertCircle,
  X,
  Smartphone,
  Sparkles,
  Zap,
  Trophy,
  Flame,
  Radio,
  Gamepad as Gamepad2,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  School,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "next/navigation";

export default function LiveQuizJoinHeroView() {
  const {
    sessionCode,
    setSessionCode,
    displayName,
    setDisplayName,
    handleJoin,
    loading,
    errorMessage,
    setErrorMessage,
    registeredStudents,
  } = useQuizSession();

  const searchParams = useSearchParams();
  const [pinFocused, setPinFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  // Requirement 3: Attendance eligibility state
  const [attendanceEligibleStudents, setAttendanceEligibleStudents] = useState<any[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | number | undefined>(undefined);
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(false);

  // Requirement 2: Cute avatars for student joining
  const CUTE_AVATARS = [
    "🚀", "🦁", "🐼", "🦊", "🤖", "🦄", "⚡", "🐯",
    "🦅", "🦉", "🐬", "🌟", "🎯", "👑", "🍕", "🎸",
    "🦖", "🐱", "🐶", "🐵", "🐙", "🦋", "🏆", "🔥"
  ];
  const [selectedAvatar, setSelectedAvatar] = useState("🚀");

  // Dynamic Live Active Players Simulation (Fluctuates authentically)
  const [activePlayers, setActivePlayers] = useState(88);
  const [activeLobbies, setActiveLobbies] = useState(14);

  // Requirement 4: Detect existing session in localStorage for instant auto-reconnect UX
  useEffect(() => {
    try {
      const saved = localStorage.getItem("quiz_student_session") || localStorage.getItem("pgtsc_live_quiz_player");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sessionToken || parsed.playerToken || parsed.roomPin || parsed.sessionCode) {
          setIsAutoReconnecting(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Requirement 3: Fetch attendance eligibility list whenever sessionCode is present or on mount
  useEffect(() => {
    let isMounted = true;
    const fetchAttendance = async () => {
      try {
        setIsLoadingAttendance(true);
        const codeParam = sessionCode ? `&sessionCode=${encodeURIComponent(sessionCode.trim())}` : "";
        const res = await fetch(`/api/attendance?action=quiz_eligibility${codeParam}`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.students)) {
          setAttendanceEligibleStudents(data.students);
        }
      } catch (err) {
        console.error("Failed to load attendance eligibility:", err);
      } finally {
        if (isMounted) setIsLoadingAttendance(false);
      }
    };

    fetchAttendance();
    const interval = setInterval(fetchAttendance, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sessionCode]);

  useEffect(() => {
    const pin = searchParams ? searchParams.get("pin") : null;
    if (pin && !sessionCode) {
      setSessionCode(pin);
    }
  }, [searchParams, sessionCode, setSessionCode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlayers((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(125, Math.max(72, prev + delta));
      });
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  // Split pin into 6 slots
  const pinDigits = (sessionCode || "").padEnd(6, " ").slice(0, 6).split("");

  return (
    <div className="h-screen w-full flex flex-col justify-between items-center overflow-hidden bg-slate-950 p-3 sm:p-4 md:p-6 relative select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. BACKGROUND GLOWING ABSTRACT VECTOR SHAPES & TECH GRID */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial Ambient Neon Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] sm:w-[42rem] h-[30rem] sm:h-[42rem] bg-gradient-to-tr from-cyan-600/20 via-indigo-600/15 to-purple-600/20 rounded-full blur-[100px] sm:blur-[130px]" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-[90px]" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-purple-500/15 rounded-full blur-[90px]" />

        {/* Abstract Cyber Circuit Vector SVGs */}
        <svg
          className="absolute inset-0 w-full h-full opacity-15 stroke-cyan-400"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="circuit-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" strokeWidth="0.8" strokeDasharray="3 3" />
              <circle cx="80" cy="0" r="2.5" fill="currentColor" opacity="0.6" />
              <path d="M 40 40 L 60 40 L 70 50 L 70 70" fill="none" strokeWidth="1" />
              <circle cx="70" cy="70" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-grid)" />
        </svg>

        {/* Floating Geometric Neon Rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-cyan-500/15 border-dashed"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full border border-purple-500/15 border-dashed"
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP HEADER SECTION (INSTITUTION BRANDING + LIVE COUNTER BADGE) */}
      {/* ========================================================================= */}
      <header className="relative z-10 w-full max-w-xl flex flex-col items-center gap-2 shrink-0 pt-1">
        {/* Dynamic Status Badges Row */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          {/* Live Active Players Pill */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)] backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <span>লাইভ প্লেয়ার:</span>
              <span className="font-mono font-black text-white text-xs">{activePlayers}+</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400">•</span>
            <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>{activeLobbies} সেশন অনলাইন</span>
            </span>
          </motion.div>

          {/* Quick Help Guide Button */}
          <motion.button
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            type="button"
            onClick={() => setGuideModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-[11px] font-bold text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>সহায়িকা</span>
          </motion.button>
        </div>

        {/* Compact Institutional Hero Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 blur-xs animate-pulse" />
            <div className="relative w-11 h-11 rounded-2xl bg-slate-950 border border-cyan-400/50 p-1 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <School className="w-6 h-6 text-cyan-400" />
            </div>
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                পঞ্চগড় টিএসসি লাইভ কুইজ
              </h1>
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              গেম পিন প্রবেশ করে সরাসরি প্রতিযোগিতায় যুক্ত হোন
            </p>
          </div>
        </motion.div>
      </header>

      {/* ========================================================================= */}
      {/* 3. CENTERPIECE: STRICT SINGLE-VIEWPORT COMPACT FORM CARD */}
      {/* ========================================================================= */}
      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md my-auto"
      >
        {/* Neon Ambient Border Glow */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/30 via-indigo-600/30 to-purple-600/30 blur-lg opacity-80 pointer-events-none" />

        <div className="relative rounded-3xl bg-slate-950/90 border border-slate-800 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl">
          {/* Cyber Decorative SVG Corner Nodes */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-2.5 bg-rose-500/20 border border-rose-500/60 rounded-xl text-rose-200 text-xs font-bold flex items-center justify-between gap-2 overflow-hidden shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 text-rose-300 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auto-reconnect notice */}
          {isAutoReconnecting && loading && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-xs flex items-center gap-2.5 shadow-lg shadow-cyan-950/50"
            >
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">সেশন পুনরায় সংযুক্ত করা হচ্ছে...</span>
                <span className="text-[11px] text-cyan-300">পূর্বের সেশন শনাক্ত হয়েছে, সরাসরি ক্লাসরুমে ঢোকা হচ্ছে।</span>
              </div>
            </motion.div>
          )}

          <form onSubmit={(e) => handleJoin(e, selectedStudentId, selectedAvatar)} className="space-y-3 sm:space-y-3.5">
            {/* ---------------- 1. GAME PIN SECTION ---------------- */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-cyan-400" />
                  <span>গেম পিন (GAME PIN)</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300">
                  ৬ সংখ্যার কোড
                </span>
              </div>

              {/* Glowing Focus Interactive Border Box */}
              <div
                className={`relative rounded-2xl p-[1.5px] transition-all duration-300 ${
                  pinFocused
                    ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_25px_rgba(6,182,212,0.5)]"
                    : "bg-slate-800 hover:bg-slate-700/80"
                }`}
              >
                <div className="relative bg-slate-950 rounded-[14px] overflow-hidden flex items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={sessionCode}
                    onFocus={() => setPinFocused(true)}
                    onBlur={() => setPinFocused(false)}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setSessionCode(clean);
                    }}
                    placeholder="000000"
                    className="w-full h-12 sm:h-13 bg-transparent px-4 text-center font-mono text-2xl sm:text-3xl tracking-[0.35em] text-white placeholder:text-slate-600 dark:text-slate-400 focus:outline-none font-black"
                    required
                    autoFocus
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
                    <Radio className={`w-4 h-4 ${pinFocused ? "animate-pulse text-cyan-300" : "text-cyan-500/50"}`} />
                  </div>
                </div>
              </div>

              {/* 6-Digit Slot Live Indicators */}
              <div className="grid grid-cols-6 gap-1.5 pt-0.5 px-0.5">
                {pinDigits.map((digit, index) => {
                  const filled = digit.trim().length > 0;
                  return (
                    <div
                      key={index}
                      className={`h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs border transition-all ${
                        filled
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                          : "bg-slate-950/80 border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {filled ? digit : "•"}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---------------- 2. STUDENT NAME / ROLL SECTION ---------------- */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>আপনার নাম ও রোল (NAME & ROLL)</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/40 text-purple-300">
                  আবশ্যক
                </span>
              </div>

              {/* Requirement 3: Today's Attendance Eligibility Dropdown */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-indigo-300 font-bold px-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>আজকের হাজিরা তালিকা (উপস্থিত শিক্ষার্থী):</span>
                  </span>
                  {attendanceEligibleStudents.length > 0 && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                      {attendanceEligibleStudents.filter((s: any) => !s.isJoined).length} জন বাকি
                    </span>
                  )}
                </div>

                <select
                  value={selectedStudentId ? String(selectedStudentId) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setSelectedStudentId(undefined);
                      return;
                    }
                    const st = attendanceEligibleStudents.find(
                      (s: any) => String(s.id) === val || String(s.studentId) === val
                    );
                    if (st && !st.isJoined) {
                      setSelectedStudentId(st.id);
                      setDisplayName(`${st.name} (রোল: ${st.roll})`);
                    }
                  }}
                  className="w-full h-9 sm:h-10 bg-slate-900 border border-indigo-500/40 rounded-xl px-3 text-xs text-cyan-200 focus:outline-none focus:border-cyan-400 font-bold cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    -- হাজিরা তালিকা থেকে নিজের নাম সিলেক্ট করুন --
                  </option>
                  {(attendanceEligibleStudents.length > 0 ? attendanceEligibleStudents : registeredStudents || []).map((s: any) => {
                    const locked = !!s.isJoined;
                    return (
                      <option
                        key={s.id}
                        value={s.id}
                        disabled={locked}
                        className={`bg-slate-900 font-medium ${
                          locked ? "text-slate-500 line-through" : "text-white"
                        }`}
                      >
                        {locked ? "🔒 [Joined / Locked] " : "✓ "}
                        {s.name} - রোল: {s.roll} {s.trade ? `(${s.trade})` : ""} {s.attendanceStatus ? `[${s.attendanceStatus}]` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Interactive Name Input */}
              <div
                className={`relative rounded-2xl p-[1.5px] transition-all duration-300 ${
                  nameFocused
                    ? "bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 shadow-[0_0_25px_rgba(168,85,247,0.5)]"
                    : "bg-slate-800 hover:bg-slate-700/80"
                }`}
              >
                <div className="relative bg-slate-950 rounded-[14px] overflow-hidden flex items-center">
                  <input
                    type="text"
                    value={displayName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="যেমন: আরিয়ান খান (রোল: ১০১)"
                    className="w-full h-11 sm:h-12 bg-transparent px-4 text-sm sm:text-base text-white placeholder:text-slate-500 dark:text-slate-400 focus:outline-none font-bold"
                    required
                  />
                  <div className="pr-3.5 text-purple-400/70 pointer-events-none">
                    <Gamepad2 className={`w-4 h-4 ${nameFocused ? "animate-bounce text-purple-300" : ""}`} />
                  </div>
                </div>
              </div>

              {/* Requirement 2: Cute Avatar Picker with spring animation */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>কিউট অ্যাভাটার পছন্দ করুন (AVATAR)</span>
                  </label>
                  <span className="text-[11px] font-bold text-amber-300 font-mono bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                    <span>নির্বাচিত:</span>
                    <span className="text-sm font-normal">{selectedAvatar}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-800 select-none">
                  {CUTE_AVATARS.map((av) => {
                    const isSel = selectedAvatar === av;
                    return (
                      <motion.button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        animate={isSel ? { scale: [1, 1.25, 1.15], y: -2 } : { scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-lg sm:text-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                          isSel
                            ? "bg-amber-400/20 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] ring-2 ring-amber-300/60"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-white"
                        }`}
                      >
                        {av}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ---------------- 3. JOIN SUBMIT BUTTON ---------------- */}
            <div className="pt-1">
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="relative w-full h-12 sm:h-13 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-slate-950 font-black text-sm sm:text-base tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.75)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 overflow-hidden group border border-cyan-300/40"
              >
                {/* Sweeping Shimmer Animation */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                    <span>লবিতে যুক্ত হওয়া হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-950 fill-amber-900 group-hover:scale-125 transition-transform" />
                    <span>কুইজে যোগ দিন (JOIN NOW)</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.main>

      {/* ========================================================================= */}
      {/* 4. COMPACT FOOTER (SINGLE LINE ZERO VERTICAL OVERFLOW) */}
      {/* ========================================================================= */}
      <footer className="relative z-10 w-full max-w-md flex items-center justify-between text-[10px] text-slate-400 font-semibold px-2 shrink-0 pb-1">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>রিয়েল-টাইম স্কোর</span>
        </div>
        <span className="text-slate-700 dark:text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3 h-3 text-cyan-400" />
          <span>লাইভ লিডারবোর্ড</span>
        </div>
        <span className="text-slate-700 dark:text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>স্বচ্ছ মূল্যায়ন</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 5. LIGHTWEIGHT FLOATING GUIDE MODAL (CLICK ON DEMAND) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {guideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-black text-white text-sm">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>কুইজে যোগদানের সহায়িকা</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGuideModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-normal">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    ১
                  </span>
                  <span>শিক্ষকের স্ক্রিনে প্রদর্শিত ৬-সংখ্যার গেম পিনটি নির্ভুলভাবে লিখুন।</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    ২
                  </span>
                  <span>আপনার নাম ও রোল নম্বর লিখুন যা লিডারবোর্ডে প্রদর্শিত হবে।</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    ৩
                  </span>
                  <span>'JOIN NOW' বাটনে চাপ দিন। হোস্ট সেশন শুরু করলে প্রশ্ন প্রদর্শিত হবে।</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setGuideModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition cursor-pointer"
              >
                ঠিক আছে, বুঝেছি
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
