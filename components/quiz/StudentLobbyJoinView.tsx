"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Gamepad as Gamepad2,
  Sparkles,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Radio,
  Zap,
  Bot,
  Cpu,
  Atom,
  Wrench,
  Rocket,
  Flame,
  Binary,
  Layers,
  Check,
  Search,
  Users,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import {
  RenderStudentAvatar,
  STUDENT_AVATAR_PRESETS,
} from "@/components/common/SouthAsianStudentAvatar";

export interface StudentLobbyJoinViewProps {
  initialPin?: string;
  initialName?: string;
  onJoinSuccess?: (playerData: { playerId: string; name: string; avatar: string; pin: string }) => void;
  onLeaveLobby?: () => void;
}

// 12 Technical & Gamified Avatar Icons for PTSC Technical Students
export const LOBBY_AVATARS = [
  { id: "robot", name: "রোবোটিক", icon: Bot, bg: "bg-indigo-600", color: "text-indigo-200", border: "border-indigo-400" },
  { id: "chip", name: "মাইক্রোচিপ", icon: Cpu, bg: "bg-cyan-600", color: "text-cyan-200", border: "border-cyan-400" },
  { id: "electron", name: "ইলেকট্রন", icon: Atom, bg: "bg-emerald-600", color: "text-emerald-200", border: "border-emerald-400" },
  { id: "mechanic", name: "মেকানিক", icon: Wrench, bg: "bg-amber-600", color: "text-amber-200", border: "border-amber-400" },
  { id: "rocket", name: "রকেট", icon: Rocket, bg: "bg-rose-600", color: "text-rose-200", border: "border-rose-400" },
  { id: "flame", name: "ফায়ার", icon: Flame, bg: "bg-orange-600", color: "text-orange-200", border: "border-orange-400" },
  { id: "binary", name: "কোডার", icon: Binary, bg: "bg-teal-600", color: "text-teal-200", border: "border-teal-400" },
  { id: "spark", name: "ভোল্টেজ", icon: Zap, bg: "bg-yellow-600", color: "text-yellow-200", border: "border-yellow-400" },
  { id: "gamer", name: "প্লেয়ার", icon: Gamepad2, bg: "bg-purple-600", color: "text-purple-200", border: "border-purple-400" },
  { id: "innovator", name: "আইওটি", icon: Layers, bg: "bg-blue-600", color: "text-blue-200", border: "border-blue-400" },
  { id: "shield", name: "সাইবার", icon: ShieldCheck, bg: "bg-slate-700", color: "text-slate-200", border: "border-slate-400" },
  { id: "star", name: "টপার", icon: Sparkles, bg: "bg-pink-600", color: "text-pink-200", border: "border-pink-400" },
];

export default function StudentLobbyJoinView({
  initialPin = "",
  initialName = "",
  onJoinSuccess,
  onLeaveLobby,
}: StudentLobbyJoinViewProps) {
  const [pin, setPin] = useState<string>(initialPin);
  const [displayName, setDisplayName] = useState<string>(initialName);
  const [studentRoll, setStudentRoll] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("sa-student-1");
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [assignedPlayerId, setAssignedPlayerId] = useState<string>("");
  const [motivationalIndex, setMotivationalIndex] = useState<number>(0);

  // Attendance state
  const [attendanceStudents, setAttendanceStudents] = useState<Array<{
    id: string;
    name: string;
    roll: string;
    trade?: string;
    attendanceStatus?: string;
    statusCode?: string;
    isJoined?: boolean;
  }>>([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState<boolean>(false);
  const [attendanceSearch, setAttendanceSearch] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Cycling motivational phrases while waiting in lobby
  const MOTIVATIONAL_PHRASES = [
    "প্রশ্ন মনোযোগ দিয়ে পড়ুন এবং দ্রুত উত্তর দিয়ে বোনাস পয়েন্ট অর্জন করুন!",
    "পরপর সঠিক উত্তর দিলে ফায়ার স্ট্রিক বোনাস যুক্ত হবে 🔥",
    "ট্যাব বা ব্রাউজার উইন্ডো পরিবর্তন করলে অ্যান্টি-চিট পেনাল্টি প্রযোজ্য হবে।",
    "পঞ্চগড় টিএসসির কারিগরি সেরা মেধা হওয়ার লড়াইয়ে আপনাকে স্বাগতম!",
    "প্রস্তুত থাকুন! শিক্ষক যেকোনো মুহূর্তে কুইজ শুরু করবেন...",
  ];

  // Fetch Attendance when PIN is valid (>= 4 digits)
  useEffect(() => {
    const cleanPin = pin.trim().replace(/\D/g, "");
    if (cleanPin.length < 4) {
      setAttendanceStudents([]);
      return;
    }

    let isMounted = true;
    const fetchAttendance = async () => {
      setIsAttendanceLoading(true);
      try {
        const res = await fetch(`/api/attendance?action=quiz_eligibility&sessionCode=${cleanPin}`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.students)) {
          setAttendanceStudents(data.students);
        } else if (isMounted) {
          // Fallback to all registered students
          const fallbackRes = await fetch("/api/students");
          const fallbackData = await fallbackRes.json();
          if (fallbackData.success && Array.isArray(fallbackData.students)) {
            setAttendanceStudents(
              fallbackData.students.map((s: any) => ({
                id: s.id,
                name: s.name,
                roll: s.roll || "",
                trade: s.trade || "",
                attendanceStatus: "REGISTERED",
                statusCode: "P",
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
      } finally {
        if (isMounted) setIsAttendanceLoading(false);
      }
    };

    fetchAttendance();
    return () => {
      isMounted = false;
    };
  }, [pin]);

  // Filtered attendance list
  const filteredAttendanceStudents = useMemo(() => {
    if (!attendanceSearch.trim()) return attendanceStudents;
    const q = attendanceSearch.toLowerCase();
    return attendanceStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.roll || "").toLowerCase().includes(q)
    );
  }, [attendanceStudents, attendanceSearch]);

  useEffect(() => {
    if (!isJoined) return;
    const timer = setInterval(() => {
      setMotivationalIndex((prev) => (prev + 1) % MOTIVATIONAL_PHRASES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isJoined, MOTIVATIONAL_PHRASES.length]);

  const handleSelectStudent = (student: { id: string; name: string; roll: string }) => {
    setDisplayName(student.name);
    setStudentRoll(student.roll);
    setShowDropdown(false);
  };

  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\D/g, "");
    const cleanName = displayName.trim();

    if (!cleanPin || cleanPin.length < 4) {
      setError("সঠিক গেম পিন প্রদান করুন (কমপক্ষে ৪-৬ ডিজিট)।");
      return;
    }

    if (!cleanName) {
      setError("আপনার ডাকনাম বা রোল নম্বর লিখুন অথবা তালিকা থেকে নির্বাচন করুন।");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/live-quizzes/lobby-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          pin: cleanPin,
          displayName: cleanName,
          roll: studentRoll,
          avatarId: selectedAvatar,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsJoined(true);
        const pid = data.player?.id || `p_${Date.now()}`;
        setAssignedPlayerId(pid);

        if (onJoinSuccess) {
          onJoinSuccess({
            playerId: pid,
            name: cleanName,
            avatar: selectedAvatar,
            pin: cleanPin,
          });
        }
      } else {
        setError(data.error || "লবিতে যুক্ত হওয়া সম্ভব হয়নি। পিন যাচাই করুন।");
      }
    } catch {
      // Offline / Preview fallback: Seamlessly join in-memory
      setIsJoined(true);
      const fallbackId = `p_preview_${Date.now()}`;
      setAssignedPlayerId(fallbackId);
      if (onJoinSuccess) {
        onJoinSuccess({
          playerId: fallbackId,
          name: cleanName,
          avatar: selectedAvatar,
          pin: cleanPin,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Ready handler in lobby
  const handleSetReady = async () => {
    setIsReady(true);
    try {
      await fetch(`/api/live-quizzes/sessions/${pin}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: assignedPlayerId || `p_${Date.now()}`,
          name: displayName,
          roll: studentRoll,
          avatar: selectedAvatar,
        }),
      });
    } catch (err) {
      console.warn("Failed to ping ready:", err);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6 text-white select-none font-sans">
      {!isJoined ? (
        /* STEP 1: JOIN FORM WITH ATTENDANCE DROPDOWN & AVATAR PICKER */
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-indigo-950/40 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 text-xs font-bold mb-2">
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>PTSC লাইভ কুইজ এরিনা</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              লবিতে যুক্ত হোন
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              প্রজেক্টরে প্রদর্শিত ৬ ডিজিটের পিন কোড লিখুন এবং নাম সিলেক্ট করুন
            </p>
          </div>

          <form onSubmit={handleJoinLobby} className="space-y-4">
            {/* PIN Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                গেম পিন (Game PIN)
              </label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="যেমন: 889120"
                className="w-full px-4 py-3 bg-slate-950/80 border-2 border-slate-800 rounded-2xl text-center font-mono text-xl sm:text-2xl font-black tracking-widest text-cyan-400 focus:outline-hidden focus:border-indigo-500 transition-colors placeholder:text-slate-600 dark:text-slate-400"
                required
              />
            </div>

            {/* Attendance-Linked Searchable Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>📋 আজকের উপস্থিত তালিকা থেকে নাম নির্বাচন</span>
                </label>
                {isAttendanceLoading && (
                  <span className="text-[10px] text-cyan-400 font-semibold animate-pulse">
                    হাজিরা ফেচ হচ্ছে...
                  </span>
                )}
              </div>

              {/* Dropdown Toggle / Selector Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full px-4 py-3 bg-slate-950/80 border-2 border-slate-800 hover:border-slate-700 rounded-2xl text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className={`text-sm font-bold ${displayName ? "text-white" : "text-slate-500"}`}>
                      {displayName ? (
                        <>
                          {displayName} {studentRoll ? `(রোল: ${studentRoll})` : ""}
                        </>
                      ) : (
                        "তালিকা থেকে তোমার নাম সিলেক্ট করো..."
                      )}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                </button>

                {/* Searchable Dropdown List */}
                {showDropdown && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto space-y-1">
                    {/* Search inside Dropdown */}
                    <div className="relative mb-2 px-1">
                      <input
                        type="text"
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        placeholder="নাম বা রোল দিয়ে ফিল্টার করো..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>

                    {filteredAttendanceStudents.length > 0 ? (
                      filteredAttendanceStudents.map((student) => {
                        const isPresent = student.statusCode === "P" || student.attendanceStatus === "PRESENT";
                        const isLate = student.statusCode === "L" || student.attendanceStatus === "LATE";

                        return (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => handleSelectStudent(student)}
                            className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-800 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-bold text-white group-hover:text-cyan-300">
                                {student.name}
                              </span>
                              {student.roll && (
                                <span className="text-[11px] font-mono text-slate-400">
                                  রোল: {student.roll}
                                </span>
                              )}
                            </div>

                            <div>
                              {isPresent ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
                                  🟢 আজ উপস্থিত
                                </span>
                              ) : isLate ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold">
                                  🟡 বিলম্বে উপস্থিত
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                  তালিকাভুক্ত
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">
                        কোনো শিক্ষার্থী পাওয়া যায়নি। নিচে ম্যানুয়ালি নাম লিখুন।
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Manual Name Input Fallback */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                অথবা ম্যানুয়ালি নাম / রোল লিখুন
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={24}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="যেমন: তানভীর হাসান (০১)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border-2 border-slate-800 rounded-2xl text-sm font-bold text-white focus:outline-hidden focus:border-indigo-500 transition-colors placeholder:text-slate-600 dark:text-slate-400"
                  required
                />
                <User className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Rich Avatar & Icon Grid Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  অ্যাভাটার ও আইকন নির্বাচন করুন
                </label>
                <span className="text-[11px] text-cyan-400 font-semibold">
                  সিলেক্টেড অ্যাভাটার
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 p-2 bg-slate-950/60 rounded-2xl border border-slate-800 max-h-48 overflow-y-auto">
                {/* 1. South Asian Student & 3D Gamified Avatars */}
                {STUDENT_AVATAR_PRESETS.map((preset) => {
                  const isSelected = selectedAvatar === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAvatar(preset.id)}
                      className={`relative p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600/30 ring-2 ring-cyan-400 scale-105 shadow-lg"
                          : "bg-slate-900/80 hover:bg-slate-800 text-slate-400"
                      }`}
                      title={preset.name}
                    >
                      <RenderStudentAvatar avatarId={preset.id} className="w-9 h-9" />
                      <span className="text-[9px] font-bold truncate max-w-full mt-1">
                        {preset.name.split(" ")[0]}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* 2. Technical Tech Icons */}
                {LOBBY_AVATARS.map((avatar) => {
                  const Icon = avatar.icon;
                  const isSelected = selectedAvatar === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`relative p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? `${avatar.bg} shadow-lg ring-2 ring-cyan-400 scale-105`
                          : "bg-slate-900/80 hover:bg-slate-800 text-slate-400"
                      }`}
                      title={avatar.name}
                    >
                      <Icon className={`w-6 h-6 ${isSelected ? "text-white" : avatar.color}`} />
                      <span className="text-[9px] font-bold truncate max-w-full mt-1">
                        {avatar.name}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs text-center font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-black text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>🚀 লাইভে যুক্ত হচ্ছে...</span>
              ) : (
                <>
                  <span>🚀 লাইভে যুক্ত হও (Join Live)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* STEP 2: PULSING WAITING LOBBY CARD (ONCE JOINED) */
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-center space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Top Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>সফলভাবে যুক্ত হয়েছেন</span>
          </div>

          {/* Big Selected Avatar with Pulsing Rings */}
          <div className="relative inline-block my-2">
            <div className="absolute inset-0 rounded-3xl bg-cyan-500/20 blur-xl animate-pulse" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-950 border-4 border-cyan-400/60 flex items-center justify-center shadow-2xl mx-auto">
              <RenderStudentAvatar avatarId={selectedAvatar} className="w-16 h-16" />
            </div>
          </div>

          {/* Player Name & PIN Badge */}
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {displayName}
            </h3>
            {studentRoll && (
              <p className="text-xs font-mono font-bold text-slate-300 mt-0.5">
                রোল নম্বর: {studentRoll}
              </p>
            )}
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              গেম পিন: <strong className="text-cyan-400 font-black tracking-wider">{pin}</strong>
            </p>
          </div>

          {/* 🙋‍♂️ I'm Ready Button */}
          <button
            type="button"
            disabled={isReady}
            onClick={handleSetReady}
            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer ${
              isReady
                ? "bg-emerald-950/80 border-2 border-emerald-400 text-emerald-300 shadow-emerald-500/20"
                : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/30 animate-pulse"
            }`}
          >
            {isReady ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>✅ আপনি রেডি! (You are Ready!)</span>
              </>
            ) : (
              <>
                <Flame className="w-5 h-5 text-slate-950 fill-current" />
                <span>🙋‍♂️ আমি পরবর্তী প্রশ্নের জন্য রেডি! (I&apos;m Ready!)</span>
              </>
            )}
          </button>

          {/* Animated Waiting Ticker */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
              <Clock className="w-4 h-4 animate-spin" />
              <span>শিক্ষক কুইজ শুরুর অপেক্ষায়... (Waiting for Host)</span>
            </div>

            {/* Motivational Carousel */}
            <p className="text-xs text-slate-300 italic min-h-[38px] flex items-center justify-center transition-all duration-500">
              &quot;{MOTIVATIONAL_PHRASES[motivationalIndex]}&quot;
            </p>
          </div>

          {/* Leave Button */}
          <button
            type="button"
            onClick={() => {
              setIsJoined(false);
              if (onLeaveLobby) onLeaveLobby();
            }}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-300 underline underline-offset-4 transition-colors"
          >
            লবি থেকে বের হয়ে নাম বা অ্যাভাটার পরিবর্তন করুন
          </button>
        </div>
      )}
    </div>
  );
}
