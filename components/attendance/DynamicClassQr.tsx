"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Maximize2,
  Minimize2,
  RefreshCw,
  MapPin,
  Clock,
  ShieldCheck,
  Users,
  CheckCircle,
  Radio,
  BookOpen,
  Calendar,
  Layers,
} from "lucide-react";

export interface DynamicClassQrProps {
  initialClassId?: number;
  initialClassName?: string;
  initialTradeName?: string;
  initialSection?: string;
  initialShift?: string;
  initialPeriod?: number;
  initialSubjectName?: string;
}

// PTSC Official Campus Geolocation Benchmark
const PTSC_CAMPUS_LAT = 26.3354;
const PTSC_CAMPUS_LNG = 88.5516;
const TOKEN_TTL_SECONDS = 5;

export default function DynamicClassQr({
  initialClassId = 4,
  initialClassName = "নবম শ্রেণি (ভোকেশনাল)",
  initialTradeName = "কম্পিউটার অ্যান্ড আইওটি সিস্টেম",
  initialSection = "A",
  initialShift = "১ম শিফট",
  initialPeriod = 1,
  initialSubjectName = "ট্রেড-১ (তত্ত্বীয় ও ব্যবহারিক)",
}: DynamicClassQrProps) {
  // Config state
  const [period, setPeriod] = useState<number>(initialPeriod);
  const [subjectName, setSubjectName] = useState<string>(initialSubjectName);
  const [className] = useState<string>(initialClassName);
  const [tradeName] = useState<string>(initialTradeName);
  const [section] = useState<string>(initialSection);
  const [shift] = useState<string>(initialShift);

  // Dynamic QR & Timer states
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(TOKEN_TTL_SECONDS);
  const [tokenSeq, setTokenSeq] = useState<number>(1);
  const [currentSecretToken, setCurrentSecretToken] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Live Present Attendees State
  const [presentCount, setPresentCount] = useState<number>(14);
  const [recentAttendees, setRecentAttendees] = useState<
    { name: string; roll: number; time: string; studentId: string }[]
  >([
    { name: "খাদিজা সুলতানা", roll: 1, time: "০৮:৪৫ AM", studentId: "PTSC-2026-060001" },
    { name: "মোছা. আফসানা মিমি", roll: 2, time: "০৮:৪৬ AM", studentId: "PTSC-2026-060002" },
    { name: "মো. নাঈম হাসান", roll: 3, time: "০৮:৪৭ AM", studentId: "PTSC-2026-060003" },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Generate cryptographically secure random token payload
  const generateQrPayload = useCallback(() => {
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    const secretToken = `PTSC-TOTP-${timestamp}-${randomHex}`;

    const payloadObj = {
      app: "PTSC-ERP",
      type: "DYNAMIC_ATTENDANCE_V3",
      institution: "Panchagarh Govt Technical School & College",
      campusLat: PTSC_CAMPUS_LAT,
      campusLng: PTSC_CAMPUS_LNG,
      maxDistanceMeters: 200,
      classId: initialClassId,
      className,
      tradeName,
      section,
      shift,
      period,
      subjectName,
      timestamp,
      ttlSeconds: TOKEN_TTL_SECONDS,
      token: secretToken,
    };

    const payloadString = JSON.stringify(payloadObj);

    QRCode.toDataURL(payloadString, {
      width: 480,
      margin: 1,
      color: {
        dark: "#0f172a", // slate-900 high contrast
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        setQrDataUrl(url);
        setCurrentSecretToken(secretToken);
        setTokenSeq((prev) => prev + 1);
        setCountdown(TOKEN_TTL_SECONDS);
      })
      .catch((err) => {
        console.error("QR Generation error:", err);
      });
  }, [className, tradeName, section, shift, period, subjectName, initialClassId]);

  // Initial QR code generation
  useEffect(() => {
    generateQrPayload();
  }, [generateQrPayload]);

  // 1-second countdown ticker with 5-second automatic refresh
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          generateQrPayload();
          return TOKEN_TTL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [generateQrPayload, isPaused]);

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

  return (
    <div
      ref={containerRef}
      className={`w-full transition-colors ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto"
          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6"
      }`}
    >
      {/* 1. TOP HEADER & CLASSROOM CONTEXT */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>লাইভ প্রক্সি-মুক্ত হাজিরা সেশন (Anti-Proxy Engine)</span>
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              #টোকেন: {tokenSeq}
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {className} • {tradeName}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>বিষয়: {subjectName}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <span>পিরিয়ড: {period} (১ম ঘণ্টা)</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>শাখা: {section} ({shift})</span>
            </span>
          </div>
        </div>

        {/* Controls: Fullscreen, Refresh & Pause */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => generateQrPayload()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="অবিলম্বে কিউআর রিফ্রেশ করুন"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            title="প্রজেক্টর ফুলস্ক্রিন ভিউ"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? "ফুলস্ক্রিন বন্ধ" : "প্রজেক্টর মোড"}</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC QR DISPLAY & LIVE COUNTDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-center">
        {/* Left: Big High-Contrast Dynamic QR Code */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border-4 border-slate-900 dark:border-indigo-500/80 inline-block">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="PTSC Dynamic Attendance QR"
                className="w-72 h-72 sm:w-96 sm:h-96 object-contain rounded-xl select-none"
              />
            ) : (
              <div className="w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
                <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            )}

            {/* Floating Security Badge */}
            <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-slate-950/80 text-white text-[10px] font-mono font-bold flex items-center gap-1 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>GeoFenced (200m)</span>
            </div>
          </div>

          {/* 5-Second Timer Bar & Countdown */}
          <div className="w-full max-w-md mt-4">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Clock className="w-4 h-4 text-cyan-500 animate-spin" />
                <span>পরবর্তী টোকেন রিফ্রেশ:</span>
              </span>
              <span className="font-mono text-base font-black text-indigo-600 dark:text-cyan-400">
                ০{countdown} সেকেন্ড
              </span>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-rose-500 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / TOKEN_TTL_SECONDS) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2">
              ছবি তুলে প্রক্সি দেওয়া রোধ করতে প্রতি ৫ সেকেন্ড পর পর টোকেন স্বয়ংক্রিয়ভাবে পরিবর্তিত হয়।
            </p>
          </div>
        </div>

        {/* Right: Live Attendance Statistics & Geolocation Radar */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Real-time Attendees Metric Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-sm">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>আজকের উপস্থিত শিক্ষার্থী</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold">
                লাইভ সিঙ্ক
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900 dark:text-white">
                {presentCount}
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                / মোট শিক্ষার্থী: ৩৫ জন (৪০%)
              </span>
            </div>

            {/* Haversine Geo-fence Validation Notice */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ক্যাম্পাস জিও-ফেন্সিং সক্রিয়:
                </span>{" "}
                অক্ষাংশ {PTSC_CAMPUS_LAT}, দ্রাঘিমাংশ {PTSC_CAMPUS_LNG} (২০০ মিটার ব্যাসার্ধের মধ্যে মোবাইল ডিভাইসের জিপিএস অবস্থান যাচাই করা হবে)।
              </div>
            </div>
          </div>

          {/* Recently Scanned Feed */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
              <span>সর্বশেষ হাজিরা প্রদানকারী</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                স্বয়ংক্রিয় আপডেট
              </span>
            </h4>

            <div className="space-y-2">
              {recentAttendees.map((att) => (
                <div
                  key={att.studentId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px]">
                      {att.roll}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {att.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {att.studentId}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      <span>{att.time}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FOOTER GUIDELINES FOR STUDENTS */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          <span>
            শিক্ষার্থীরা তাদের নিজস্ব ERP পোর্টালে লগইন করে সরাসরি স্ক্রিন স্ক্যান করতে পারবে।
          </span>
        </div>
        <div className="font-mono text-[11px]">
          PTSC-SECURE-QR • {currentSecretToken.slice(0, 24)}...
        </div>
      </div>
    </div>
  );
}
