"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

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
  const [selectedAvatar, setSelectedAvatar] = useState<string>("robot");
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [assignedPlayerId, setAssignedPlayerId] = useState<string>("");
  const [motivationalIndex, setMotivationalIndex] = useState<number>(0);

  // Cycling motivational phrases while waiting in lobby
  const MOTIVATIONAL_PHRASES = [
    "প্রশ্ন মনোযোগ দিয়ে পড়ুন এবং দ্রুত উত্তর দিয়ে বোনাস পয়েন্ট অর্জন করুন!",
    "পরপর সঠিক উত্তর দিলে ফায়ার স্ট্রিক বোনাস যুক্ত হবে 🔥",
    "ট্যাব বা ব্রাউজার উইন্ডো পরিবর্তন করলে অ্যান্টি-চিট পেনাল্টি প্রযোজ্য হবে।",
    "পঞ্চগড় টিএসসির কারিগরি সেরা মেধা হওয়ার লড়াইয়ে আপনাকে স্বাগতম!",
    "প্রস্তুত থাকুন! শিক্ষক যেকোনো মুহূর্তে কুইজ শুরু করবেন...",
  ];

  useEffect(() => {
    if (!isJoined) return;
    const timer = setInterval(() => {
      setMotivationalIndex((prev) => (prev + 1) % MOTIVATIONAL_PHRASES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isJoined, MOTIVATIONAL_PHRASES.length]);

  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\D/g, "");
    const cleanName = displayName.trim();

    if (!cleanPin || cleanPin.length < 4) {
      setError("সঠিক গেম পিন প্রদান করুন (কমপক্ষে ৪-৬ ডিজিট)।");
      return;
    }

    if (!cleanName) {
      setError("আপনার ডাকনাম বা রোল নম্বর লিখুন।");
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
          avatarId: selectedAvatar,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsJoined(true);
        setAssignedPlayerId(data.player?.id || `p_${Date.now()}`);

        if (onJoinSuccess) {
          onJoinSuccess({
            playerId: data.player?.id || `p_${Date.now()}`,
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

  const selectedAvatarObj = LOBBY_AVATARS.find((a) => a.id === selectedAvatar) || LOBBY_AVATARS[0];
  const AvatarIcon = selectedAvatarObj.icon;

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 text-white select-none">
      {!isJoined ? (
        /* STEP 1: JOIN FORM WITH AVATAR PICKER */
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
              প্রজেক্টরে প্রদর্শিত ৬ ডিজিটের পিন কোড ও নাম লিখুন
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

            {/* Nickname / Roll Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                ডাকনাম বা রোল নম্বর (Nickname / Roll)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={24}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="যেমন: তানভীর (রোল ০১)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border-2 border-slate-800 rounded-2xl text-sm font-bold text-white focus:outline-hidden focus:border-indigo-500 transition-colors placeholder:text-slate-600 dark:text-slate-400"
                  required
                />
                <User className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Interactive 12 Avatar Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  আপনার অ্যাভাটার নির্বাচন করুন
                </label>
                <span className="text-[11px] text-cyan-400 font-semibold">
                  {selectedAvatarObj.name}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2 bg-slate-950/60 rounded-2xl border border-slate-800">
                {LOBBY_AVATARS.map((avatar) => {
                  const Icon = avatar.icon;
                  const isSelected = selectedAvatar === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`relative p-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? `${avatar.bg} shadow-lg ring-2 ring-white scale-105`
                          : "bg-slate-900/80 hover:bg-slate-800 text-slate-400"
                      }`}
                      title={avatar.name}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-white" : avatar.color}`} />
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
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-black text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>লবিতে যুক্ত হচ্ছে...</span>
              ) : (
                <>
                  <span>লবিতে প্রবেশ করুন</span>
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
            <div
              className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl ${selectedAvatarObj.bg} border-4 ${selectedAvatarObj.border} flex items-center justify-center shadow-2xl mx-auto`}
            >
              <AvatarIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono text-cyan-300 font-bold">
              {selectedAvatarObj.name}
            </div>
          </div>

          {/* Player Name & PIN Badge */}
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {displayName}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              গেম পিন: <strong className="text-cyan-400 font-black tracking-wider">{pin}</strong>
            </p>
          </div>

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
