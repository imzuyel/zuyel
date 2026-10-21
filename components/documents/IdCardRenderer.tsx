"use client";

import React, { useState, useEffect } from "react";
import { Student } from "@/lib/database";
import { ID_CARD_THEMES, IdCardTheme } from "@/lib/idCardThemes";
import { ShieldCheck, Sparkles, QrCode } from "lucide-react";
import { doesClassHaveTrade } from "@/lib/academicStructure";
import SouthAsianStudentAvatar from "@/components/common/SouthAsianStudentAvatar";
import QRCode from "qrcode";

interface IdCardRendererProps {
  student: Student;
  themeId?: string;
  isBackSide?: boolean;
  scale?: number;
  overlayIds?: string[];
}

export default function IdCardRenderer({
  student,
  themeId = "bteb_navy_gold",
  isBackSide = false,
  scale = 1,
  overlayIds = ["guilloche"],
}: IdCardRendererProps) {
  const theme: IdCardTheme =
    ID_CARD_THEMES.find((t) => t.id === themeId) || ID_CARD_THEMES[0];

  const width = 320;
  const height = 500;

  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://tsc.panchagarh.gov.bd";
    const verifyUrl = `${origin}/verify?id=${encodeURIComponent(student.studentId || `PTSC-${student.roll}`)}`;
    QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code error:", err));
  }, [student.studentId, student.roll]);

  const renderOverlays = () => {
    return overlayIds.map((id, index) => {
      switch (id) {
        case "guilloche":
          return (
            <g key={index}>
              <circle cx="160" cy="250" r="120" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" />
              <circle cx="160" cy="250" r="90" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="160" cy="250" r="60" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
            </g>
          );
        case "circuit":
          return (
            <g key={index}>
              <path d="M20 50 L100 50 L140 90 L200 90" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="200" cy="90" r="3" fill="currentColor" />
              <path d="M300 400 L220 400 L180 440 L80 440" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="80" cy="440" r="3" fill="currentColor" />
            </g>
          );
        case "geometric":
          return (
            <g key={index}>
              <path d="M0 0 L320 500 M320 0 L0 500" stroke="currentColor" strokeWidth="0.5" />
              <rect x="0" y="0" width="320" height="500" stroke="currentColor" strokeWidth="2" fill="none" />
            </g>
          );
        case "dots":
          return (
            <g key={index}>
              <pattern id={`dotPattern-${index}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="currentColor" />
              </pattern>
              <rect width="100%" height="100%" fill={`url(#dotPattern-${index})`} />
            </g>
          );
        case "waves":
          return (
            <path key={index} d="M0 100 Q80 50 160 100 T320 100 M0 200 Q80 150 160 200 T320 200 M0 300 Q80 250 160 300 T320 300" stroke="currentColor" strokeWidth="1" fill="none" />
          );
        case "hexagons":
          return (
            <path key={index} d="M160 250 L180 285 L160 320 L120 320 L100 285 L120 250 Z" stroke="currentColor" strokeWidth="1" fill="none" />
          );
        case "stars":
          return (
            <g key={index}>
              <path d="M160 50 L170 80 L200 80 L175 100 L185 130 L160 110 L135 130 L145 100 L120 80 L150 80 Z" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <path d="M50 300 L60 330 L90 330 L65 350 L75 380 L50 360 L25 380 L35 350 L10 330 L40 330 Z" stroke="currentColor" strokeWidth="0.5" fill="none" />
            </g>
          );
        case "lines":
          return (
            <path key={index} d="M0 0 L320 500 M0 100 L220 500 M0 200 L120 500 M0 300 L20 500 M100 0 L320 440 M200 0 L320 240 M300 0 L320 40" stroke="currentColor" strokeWidth="1" />
          );
        default:
          return null;
      }
    });
  };

  if (!isBackSide) {
    return (
      <div
        className={`relative rounded-3xl overflow-hidden shadow-[0_0_35px_rgba(30,58,138,0.35)] dark:shadow-[0_0_45px_rgba(6,182,212,0.3)] ring-1 ring-white/30 border-2 select-none transition-all duration-300 ${theme.cardBg} ${theme.borderColor}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Lanyard Slot Vector */}
        <div className="pt-3 flex justify-center relative z-20">
          <div className="w-12 h-2 rounded-full bg-black/50 border border-white/20 shadow-inner" />
        </div>

        {/* Dynamic Vector Overlay Watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-15 mix-blend-screen overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 320 500" fill="none">
            {renderOverlays()}
          </svg>
        </div>

        {/* Header Ribbon / Gradient Banner */}
        <div
          className={`relative z-10 mx-3 mt-2 p-3 rounded-2xl bg-gradient-to-r ${theme.headerGradient} text-white text-center shadow-md border border-white/15`}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-900/20 flex items-center justify-center border border-white/40">
              <ShieldCheck className="w-3 h-3 text-white" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
            </span>
          </div>
          <h3 className="text-xs font-black leading-tight drop-shadow-sm">
            পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
          </h3>
          <p className="text-[8px] font-mono tracking-wide opacity-90">
            EIIN: 132244 • ESTD: 1999 • BTEB
          </p>
        </div>

        {/* Hologram Ribbon & Smart RFID Chip Vector */}
        <div className="relative z-10 px-5 mt-3 flex items-center justify-between">
          {/* Smart Chip */}
          <div
            className={`w-10 h-7 rounded-md bg-gradient-to-tr ${theme.chipColor} border p-1 shadow-sm flex flex-col justify-between`}
          >
            <div className="flex justify-between h-1">
              <div className="w-2 h-full bg-black/40 rounded-xs" />
              <div className="w-2 h-full bg-black/40 rounded-xs" />
            </div>
            <div className="w-full h-1 bg-black/40 rounded-xs" />
            <div className="flex justify-between h-1">
              <div className="w-2 h-full bg-black/40 rounded-xs" />
              <div className="w-2 h-full bg-black/40 rounded-xs" />
            </div>
          </div>

          {/* Front QR & Trade Status Badge */}
          <div className="flex items-center gap-2">
            {qrDataUrl && (
              <div className="w-7 h-7 bg-white dark:bg-slate-900 p-0.5 rounded-md shadow-xs border border-white/40 flex items-center justify-center shrink-0">
                <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
              </div>
            )}
            <span
              className={`px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider shadow-sm border ${theme.badgeBg}`}
            >
              {doesClassHaveTrade(student.classId || student.className)
                ? (student.tradeName || "VOCATIONAL CADET")
                : "PRE-VOCATIONAL"}
            </span>
          </div>
        </div>

        {/* Student Photo with Color Accent Frame */}
        <div className="relative z-10 mt-3 flex justify-center">
          <div className="relative group">
            {/* Ambient photo halo glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/40 via-cyan-400/40 to-emerald-400/40 rounded-2xl blur-xs opacity-75" />
            
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="relative w-24 h-28 object-cover rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.4)] border-2 border-white/90 ring-2 ring-amber-400/50"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="relative w-24 h-28 flex items-center justify-center bg-slate-800 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.4)] border-2 border-white/90 ring-2 ring-amber-400/50 overflow-hidden">
                <SouthAsianStudentAvatar 
                  size="lg" 
                  animate={false} 
                  glowColor="amber"
                  className="scale-125"
                  gender={student.gender === "female" ? "female" : "male"}
                />
              </div>
            )}
            
            {/* Holographic Seal Circle with radiant pulse glow */}
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-cyan-400 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.7)] flex items-center justify-center animate-pulse">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                <span className="text-[6px] font-black text-amber-300">BTEB</span>
                <span className="text-[5px] font-mono text-cyan-300 font-bold">GOVT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Student Name & ID */}
        <div className="relative z-10 mt-2.5 px-4 text-center">
          <h4 className={`text-sm font-black leading-tight ${theme.accentColor}`}>
            {student.nameBangla || student.name}
          </h4>
          <p className="text-[10px] font-bold opacity-80 mt-0.5">{student.name}</p>
          <div className="mt-1 inline-block font-mono text-[10px] font-black bg-black/30 text-white px-2.5 py-0.5 rounded-full border border-white/20">
            ID: {student.studentId}
          </div>
        </div>

        {/* Academic Details Spec Grid */}
        <div className="relative z-10 mt-2.5 mx-4 p-2 rounded-xl bg-black/25 backdrop-blur-xs border border-white/15 text-[9px] space-y-1">
          <div className="flex justify-between">
            <span className="opacity-70">শ্রেণি (Class):</span>
            <span className="font-bold font-mono text-white">{student.className}</span>
          </div>
          {doesClassHaveTrade(student.classId || student.className) ? (
            <div className="flex justify-between">
              <span className="opacity-70">কারিগরি ট্রেড:</span>
              <span className={`font-bold truncate max-w-[170px] ${theme.accentColor}`}>
                {student.tradeName || "ট্রেড নির্বাচনাধীন"}
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="opacity-70">বিভাগ:</span>
              <span className="font-bold text-slate-200 truncate max-w-[170px]">
                প্রাক-ভোকেশনাল (ট্রেড নেই)
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="opacity-70">রোল ও শিফট:</span>
            <span className="font-bold font-mono text-white">
              Roll {student.roll} • {student.shift}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">রক্তের গ্রুপ:</span>
            <span className="font-bold text-rose-400 font-mono">{student.bloodGroup || "O+"}</span>
          </div>
        </div>

        {/* Bottom Signatures & Barcode */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between border-t border-white/20 pt-1.5">
          <div className="text-center">
            <div className="h-4 font-serif italic text-[9px] opacity-80">
              {student.name ? student.name.split(" ")[0] : "Student"}
            </div>
            <span className="text-[7px] uppercase tracking-wider opacity-60 block">
              শিক্ষার্থীর স্বাক্ষর
            </span>
          </div>

          <div className="text-center">
            <div className="h-4 font-serif italic font-bold text-[9px] text-amber-300">
              Engr. Md. Aminul Islam
            </div>
            <span className="text-[7px] uppercase tracking-wider opacity-60 block">
              অধ্যক্ষের স্বাক্ষর
            </span>
          </div>
        </div>

      </div>
    );
  }

  // Back side of ID Card
  return (
    <div
      className={`relative rounded-3xl overflow-hidden shadow-[0_0_35px_rgba(30,58,138,0.35)] dark:shadow-[0_0_45px_rgba(6,182,212,0.3)] ring-1 ring-white/30 border-2 select-none transition-all duration-300 p-4 flex flex-col justify-between ${theme.cardBg} ${theme.borderColor}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {/* Lanyard Punch Hole */}
      <div className="flex justify-center">
        <div className="w-12 h-2 rounded-full bg-black/50 border border-white/20 shadow-inner" />
      </div>

      {/* Top Header */}
      <div className="text-center border-b border-white/20 pb-1.5">
        <h4 className="text-xs font-black text-white">জরুরি নির্দেশনাবলি ও যোগাযোগের ঠিকানা</h4>
        <p className="text-[8px] opacity-70">Terms, Emergency & Instructions</p>
      </div>

      {/* Rules Box */}
      <div className="space-y-1.5 text-[8.5px] leading-relaxed bg-black/25 p-2.5 rounded-xl border border-white/15">
        <p className="font-medium">
          ১. এই কার্ডটি পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের সম্পত্তি।
        </p>
        <p className="font-medium">
          ২. প্রতিষ্ঠানে অবস্থানকালে সর্বদা কার্ডটি গলায় ঝুলিয়ে রাখা বাধ্যতামূলক।
        </p>
        <p className="font-medium">
          ৩. কার্ড হারিয়ে গেলে প্রশাসনকে অবগত করে ডুপ্লিকেট কার্ডের আবেদন করতে হবে।
        </p>
        <p className="font-bold text-amber-300">
          ৪. কার্ডটি পাওয়া গেলে নিম্নের ঠিকানায় বা অভিভাবকের মোবাইলে যোগাযোগ করুন।
        </p>
      </div>

      {/* Guardian Contact Info */}
      <div className="space-y-1 text-[9px] bg-black/35 p-2.5 rounded-xl border border-white/10 font-mono">
        <div className="flex justify-between">
          <span className="opacity-70">পিতার নাম:</span>
          <span className="font-bold text-white truncate max-w-[160px]">{student.fatherName || "মোঃ রফিকুল ইসলাম"}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">অভিভাবকের মোবাইল:</span>
          <span className="font-bold text-amber-300">{student.guardianMobile || student.emergencyContact || student.studentMobile || "০১৭১১-XXXXXX"}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-70">মেয়াদ উত্তীর্ণ:</span>
          <span className="font-bold text-white">
            {parseInt(student.session || "2026", 10) + 2}-12-31
          </span>
        </div>
      </div>


      {/* QR Code Verification Section */}
      <div className="flex items-center justify-between gap-3 bg-black/40 p-2 rounded-xl border border-white/20">
        <div className="w-14 h-14 bg-white dark:bg-slate-900 p-1 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
          ) : (
            <QrCode className="w-8 h-8 text-slate-900 dark:text-slate-100" />
          )}
        </div>

        <div className="flex-1 text-[8px] space-y-0.5 font-mono text-white/80">
          <span className="font-black text-amber-300 block text-[9px] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>QR VERIFIED ID</span>
          </span>
          <span>tsc.panchagarh.gov.bd</span>
          <span className="block font-bold">SID: {student.studentId}</span>
          <span className="text-[7px] opacity-70">JALASHI, PANCHAGARH</span>
        </div>
      </div>

      {/* Address Footer */}
      <div className="text-center text-[7.5px] opacity-70 border-t border-white/20 pt-1">
        পূর্ব জালাসী, পঞ্চগড় সদর, পঞ্চগড় - ৫০০০ • ফোন: ০২৫৮৯৯৪১০২১
      </div>
    </div>
  );
}
