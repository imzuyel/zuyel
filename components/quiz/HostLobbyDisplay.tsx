"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Users,
  Play,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  UserX,
  Radio,
  QrCode,
  Sparkles,
  Bot,
  Cpu,
  Atom,
  Wrench,
  Rocket,
  Flame,
  Binary,
  Zap,
  Gamepad as Gamepad2,
  Layers,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { LOBBY_AVATARS } from "./StudentLobbyJoinView";

export interface LobbyParticipant {
  id: string;
  displayName: string;
  avatarId?: string;
  joinedAt?: string;
}

export interface HostLobbyDisplayProps {
  sessionId?: string;
  pin?: string;
  quizTitle?: string;
  initialParticipants?: LobbyParticipant[];
  onStartQuiz?: () => void;
  onLockToggle?: (isLocked: boolean) => void;
  onKickParticipant?: (participantId: string) => void;
}

const AVATAR_MAP: Record<string, any> = {
  robot: { icon: Bot, bg: "bg-indigo-600", border: "border-indigo-400" },
  chip: { icon: Cpu, bg: "bg-cyan-600", border: "border-cyan-400" },
  electron: { icon: Atom, bg: "bg-emerald-600", border: "border-emerald-400" },
  mechanic: { icon: Wrench, bg: "bg-amber-600", border: "border-amber-400" },
  rocket: { icon: Rocket, bg: "bg-rose-600", border: "border-rose-400" },
  flame: { icon: Flame, bg: "bg-orange-600", border: "border-orange-400" },
  binary: { icon: Binary, bg: "bg-teal-600", border: "border-teal-400" },
  spark: { icon: Zap, bg: "bg-yellow-600", border: "border-yellow-400" },
  gamer: { icon: Gamepad2, bg: "bg-purple-600", border: "border-purple-400" },
  innovator: { icon: Layers, bg: "bg-blue-600", border: "border-blue-400" },
  shield: { icon: ShieldCheck, bg: "bg-slate-700", border: "border-slate-400" },
  star: { icon: Sparkles, bg: "bg-pink-600", border: "border-pink-400" },
};

export default function HostLobbyDisplay({
  sessionId = "sess_demo",
  pin = "889120",
  quizTitle = "কারিগরি বিজ্ঞান ও আইওটি কুইজ সেশন ২০২৬",
  initialParticipants = [],
  onStartQuiz,
  onLockToggle,
  onKickParticipant,
}: HostLobbyDisplayProps) {
  const [participants, setParticipants] = useState<LobbyParticipant[]>(initialParticipants);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [startingCountdown, setStartingCountdown] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Generate QR Code with Direct Join URL
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://tsc.panchagarh.gov.bd";
    const joinUrl = `${origin}/quiz/join?pin=${pin}`;

    QRCode.toDataURL(joinUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: "#0f172a", // slate-900
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [pin]);

  // Periodic polling for newly joined participants in lobby
  useEffect(() => {
    const fetchLobbyStatus = async () => {
      try {
        const res = await fetch(`/api/live-quizzes/lobby-sync?sessionId=${encodeURIComponent(sessionId)}&pin=${encodeURIComponent(pin)}`).catch(() => null);
        if (res && res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
          const data = await res.json().catch(() => null);
          if (data && data.success && Array.isArray(data.participants) && data.participants.length > 0) {
            setParticipants(data.participants);
          }
        }
      } catch {
        // Fallback to active state
      }
    };

    const interval = setInterval(fetchLobbyStatus, 3000);
    return () => clearInterval(interval);
  }, [sessionId, pin]);

  // Fullscreen Handler for Classroom Projectors
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Lock / Unlock Toggle
  const handleLockToggle = () => {
    const nextState = !isLocked;
    setIsLocked(nextState);
    if (onLockToggle) onLockToggle(nextState);

    // Sync with backend
    fetch("/api/live-quizzes/lobby-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggleLock", sessionId, isLocked: nextState }),
    }).catch(() => {});
  };

  // Kick out suspicious player
  const handleKick = (playerId: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== playerId));
    if (onKickParticipant) onKickParticipant(playerId);

    fetch("/api/live-quizzes/lobby-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "kick", sessionId, playerId }),
    }).catch(() => {});
  };

  // Countdown & Start Trigger
  const handleStart = () => {
    setStartingCountdown(3);
    const interval = setInterval(() => {
      setStartingCountdown((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(interval);
          if (onStartQuiz) onStartQuiz();
          return null;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none relative overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 p-6 sm:p-10" : "p-4 sm:p-8 rounded-3xl border border-slate-800"
      }`}
    >
      {/* Background Animated Ambient Lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP HEADER & PROJECTION CONTROLS */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>লাইভ কুইজ লবি স্ক্রিন (Host Screen)</span>
            </span>

            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800">
                <Lock className="w-3 h-3" />
                <span>লবি লকড</span>
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white mt-1">
            {quizTitle}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ • ডিজিটাল ক্লাসরুম প্রজেকশন
          </p>
        </div>

        {/* Controls: Lock, Fullscreen & Start */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLockToggle}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              isLocked
                ? "bg-rose-950 border-rose-800 text-rose-300 hover:bg-rose-900"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
            }`}
            title={isLocked ? "লবি আনলক করুন" : "নতুন জয়েন বন্ধ করতে লবি লক করুন"}
          >
            {isLocked ? <Lock className="w-4 h-4 text-rose-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
            <span>{isLocked ? "লকড" : "আনলকড"}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="ফুলস্ক্রিন প্রজেক্টর মোড"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleStart}
            disabled={startingCountdown !== null || participants.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {startingCountdown !== null ? (
              <span className="font-mono text-base font-black animate-ping">
                শুরু হচ্ছে: {startingCountdown}...
              </span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>কুইজ শুরু করুন</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. CENTER STAGE: GAME PIN BANNER & PARTICIPANTS GRID */}
      <main className="relative z-10 my-auto py-6 space-y-8">
        {/* Game PIN and QR Code Showcase Card */}
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-cyan-950/80 rounded-3xl p-6 sm:p-8 border-2 border-indigo-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
              মোবাইল ব্রাউজারে প্রবেশ করে পিন টাইপ করুন
            </span>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="text-slate-400 text-sm font-semibold">গেম পিন:</span>
              <span className="text-4xl sm:text-6xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                {pin}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              অথবা ডানে প্রদর্শিত কিউআর কোডটি ক্যামেরায় স্ক্যান করে সরাসরি যুক্ত হোন।
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-2 border-cyan-400 shrink-0">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Join QR Code" className="w-32 h-32 object-contain" />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Live Joined Participants Counter & Grid */}
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base sm:text-lg font-black text-white">
                যুক্ত হওয়া শিক্ষার্থী ({participants.length} জন)
              </h3>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              শিক্ষার্থীর কার্ডে মাউস নিয়ে কিক (Kick) করা যাবে
            </span>
          </div>

          {/* Spring Transition Animated Participant Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {participants.map((player) => {
              const avatarKey = player.avatarId || "robot";
              const avatarConfig = AVATAR_MAP[avatarKey] || AVATAR_MAP.robot;
              const IconComponent = avatarConfig.icon;

              return (
                <div
                  key={player.id}
                  className="group relative p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 shadow-md flex items-center gap-3 transition-all transform hover:-translate-y-0.5"
                >
                  {/* Avatar Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl ${avatarConfig.bg} ${avatarConfig.border} border-2 flex items-center justify-center text-white shrink-0 shadow-sm`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Player Name */}
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {player.displayName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      লবিতে সক্রিয়
                    </div>
                  </div>

                  {/* Hover Kick Out Button */}
                  <button
                    onClick={() => handleKick(player.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-950 text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-900 transition-opacity"
                    title="এই শিক্ষার্থীকে লবি থেকে কিক আউট করুন"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {participants.length === 0 && (
            <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
              এখনও কোনো শিক্ষার্থী লবিতে যুক্ত হয়নি। পিন কোডটি প্রজেক্টরে প্রদর্শন করুন।
            </div>
          )}
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="relative z-10 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
        <div>PTSC-GAMIFIED-LOBBY • SESSION ID: {sessionId}</div>
        <div>শিক্ষার্থীদের প্রস্তুত হতে বলুন • ৩ সেকেন্ডের কাউন্টডাউন সহ শুরু হবে</div>
      </footer>
    </div>
  );
}
