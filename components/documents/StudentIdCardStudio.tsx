"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  CreditCard,
  Palette,
  Printer,
  Sparkles,
  Download,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  Users,
  Grid,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Student } from "@/lib/database";
import { ID_CARD_THEMES, IdCardTheme } from "@/lib/idCardThemes";
import IdCardRenderer from "./IdCardRenderer";
import { useAuth } from "@/context/AuthContext";
import { doesClassHaveTrade } from "@/lib/academicStructure";

export default function StudentIdCardStudio() {
  const { showToast } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string>("bteb_navy_gold");
  const [selectedOverlays, setSelectedOverlays] = useState<string[]>(["guilloche"]);
  const [isBackSide, setIsBackSide] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterTrade, setFilterTrade] = useState("all");

  // Mode: single card design studio or bulk A4 print sheet
  const [viewMode, setViewMode] = useState<"designer" | "bulk_sheet">("designer");

  const overlays = [
    { id: "none", name: "No Overlay" },
    { id: "guilloche", name: "Guilloche" },
    { id: "circuit", name: "Circuit" },
    { id: "geometric", name: "Geometric" },
    { id: "dots", name: "Dot Grid" },
    { id: "waves", name: "Waves" },
    { id: "hexagons", name: "Hexagons" },
    { id: "stars", name: "Stars" },
    { id: "lines", name: "Diagonal Lines" },
  ];

  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.students) {
          setStudents(data.students);
          if (data.students.length > 0) {
            setSelectedStudent(data.students[0]);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleClassChange = (newClass: string) => {
    setFilterClass(newClass);
    if (newClass !== "all" && !doesClassHaveTrade(newClass)) {
      setFilterTrade("all");
    }
  };

  const isClassWithTrade = filterClass === "all" ? true : doesClassHaveTrade(filterClass);

  const filteredStudents = students.filter((s) => {
    const matchesClass = filterClass === "all" ? true : String(s.classId) === filterClass;
    const matchesTrade =
      !isClassWithTrade || filterTrade === "all" ? true : (s.tradeName && s.tradeName.includes(filterTrade));
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.nameBangla && s.nameBangla.includes(q)) ||
      s.studentId.toLowerCase().includes(q) ||
      String(s.roll).includes(q);
    return matchesClass && matchesTrade && matchesQuery;
  });

  const handlePrint = () => {
    window.print();
  };

  const selectedTheme = ID_CARD_THEMES.find((t) => t.id === selectedThemeId) || ID_CARD_THEMES[0];

  return (
    <div className="space-y-6">
      {/* Studio Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden no-print">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold backdrop-blur-xs border border-white/20">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>স্মার্ট আইডি কার্ড থিম ডিজাইনার ও প্রিন্ট স্টুডিও</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            কারিগরি আইডি কার্ড জেনারেটর (ID Card Studio)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            ১২+ প্রিমিয়াম কালারফুল থিম, ভেক্টর ওভারলে, ফ্রন্ট/ব্যাক সাইড এবং A4 শিটে বাল্ক প্রিন্ট সুবিধা
          </p>
        </div>

        {/* Action Toggle Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="flex bg-white/10 p-1 rounded-2xl border border-white/20 text-xs font-bold backdrop-blur-md">
            <button
              onClick={() => setViewMode("designer")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "designer" ? "bg-white text-slate-950 font-black shadow-md" : "text-white/80 hover:text-white"
              }`}
            >
              কার্ড স্টুডিও
            </button>
            <button
              onClick={() => setViewMode("bulk_sheet")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "bulk_sheet" ? "bg-white text-slate-950 font-black shadow-md" : "text-white/80 hover:text-white"
              }`}
            >
              A4 বাল্ক প্রিন্ট ({filteredStudents.length})
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/25 flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট / PDF সংরক্ষণ</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: SINGLE CARD DESIGNER & THEME SELECTOR */}
      {viewMode === "designer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Student Selector & Theme Palette (7 cols) */}
          <div className="lg:col-span-7 space-y-6 no-print">
            {/* Student Search & Quick Select */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                  <span>শিক্ষার্থী নির্বাচন করুন</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  মোট {filteredStudents.length} জন শিক্ষার্থী
                </span>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="নাম বা আইডি খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs"
                  />
                </div>

                <select
                  value={filterClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">সকল শ্রেণি (All Classes)</option>
                  <option value="1">Class 6 (৬ষ্ঠ শ্রেণি - প্রাক-ভোকেশনাল)</option>
                  <option value="2">Class 7 (৭ম শ্রেণি - প্রাক-ভোকেশনাল)</option>
                  <option value="3">Class 8 (৮ম শ্রেণি - প্রাক-ভোকেশনাল)</option>
                  <option value="4">Class 9 (৯ম শ্রেণি - ভোকেশনাল)</option>
                  <option value="5">Class 10 (১০ম শ্রেণি - ভোকেশনাল)</option>
                  <option value="6">Class 11 (১১শ শ্রেণি - এইচএসসি ভোকেশনাল)</option>
                  <option value="7">Class 12 (১২শ শ্রেণি - এইচএসসি ভোকেশনাল)</option>
                </select>

                {isClassWithTrade ? (
                  <select
                    value={filterTrade}
                    onChange={(e) => setFilterTrade(e.target.value)}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">সকল ট্রেড (All Trades)</option>
                    <option value="IT Support">আইটি সাপোর্ট অ্যান্ড আইওটি</option>
                    <option value="Electronics">জেনারেল ইলেকট্রনিক্স</option>
                    <option value="Electrical">জেনারেল ইলেকট্রিক্যাল</option>
                    <option value="Apparel">অ্যাপারেল ম্যানুফ্যাকচারিং</option>
                  </select>
                ) : (
                  <div className="flex items-center px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 rounded-xl text-[11px] font-medium">
                    ট্রেড নেই (৬ষ্ঠ-৮ম)
                  </div>
                )}
              </div>

              {/* Student Horizontal Pill Scroller */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
                {filteredStudents.map((s) => {
                  const isSelected = selectedStudent?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudent(s)}
                      className={`flex items-center gap-2 p-2 rounded-2xl border shrink-0 transition-all text-left ${
                        isSelected
                          ? "bg-indigo-50 dark:bg-slate-800 border-indigo-600 ring-2 ring-indigo-400 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                        <Image
                          src={s.photoUrl || "/placeholder-avatar.png"}
                          alt={s.name}
                          width={32}
                          height={32}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          unoptimized={Boolean(s.photoUrl?.startsWith("data:") || s.photoUrl?.startsWith("blob:"))}
                        />
                      </div>
                      <div className="pr-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate max-w-[120px]">
                          {s.nameBangla || s.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                          রোল: {s.roll} • {s.tradeName ? s.tradeName.slice(0, 10) : "General"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vector Overlay Selector */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
              <label className="block text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                ভেক্টর ওভারলে প্যাটার্ন (Vector Overlay)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {overlays.map((o) => (
                  <button
                    key={o.id}
                    onClick={() =>
                      setSelectedOverlays((prev) =>
                        prev.includes(o.id)
                          ? prev.filter((id) => id !== o.id)
                          : [...prev, o.id]
                      )
                    }
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      selectedOverlays.includes(o.id)
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
                    }`}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 12+ Vibrant Theme Palette Selector */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                    <span>কালারফুল আইডি কার্ড থিম নির্বাচন (12+ Premium Themes)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    রঙিন হেডার, গ্রেডিয়েন্ট প্যাটার্ন এবং সিকিউরিটি ওয়াটারমার্ক
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-indigo-800">
                  {selectedTheme.name}
                </span>
              </div>

              {/* Theme Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ID_CARD_THEMES.map((th) => {
                  const isCur = selectedThemeId === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => setSelectedThemeId(th.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all relative overflow-hidden group ${
                        isCur
                          ? "border-indigo-500 ring-2 ring-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.45)] scale-[1.02]"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:shadow-xs"
                      }`}
                    >
                      {/* Gradient preview swatch */}
                      <div
                        className={`h-10 rounded-xl shadow-xs flex items-center justify-end p-2 bg-gradient-to-r ${th.headerGradient}`}
                      >
                        {isCur && <CheckCircle2 className="w-4 h-4 text-white drop-shadow-md" />}
                      </div>

                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                          {th.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {th.nameBangla}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Card Canvas (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-4">
            {/* Front / Back Toggle & Actions */}
            <div className="flex items-center gap-2 no-print bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-md border border-indigo-500/20 text-xs font-bold">
              <button
                onClick={() => setIsBackSide(false)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  !isBackSide
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] font-black"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                সম্মুখ পাশ (Front Side)
              </button>
              <button
                onClick={() => setIsBackSide(true)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  isBackSide
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] font-black"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                পেছনের পাশ (Back Side)
              </button>
              <button
                onClick={() => setIsBackSide(!isBackSide)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:rotate-180 duration-300"
                title="কার্ড উল্টান (Flip Card)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Card Preview Container with Ambient Neon Glow */}
            {selectedStudent ? (
              <div className="relative w-full p-6 sm:p-8 bg-slate-900/90 dark:bg-slate-950 print:bg-white print:p-0 rounded-3xl border border-indigo-500/40 print:border-none shadow-[0_0_50px_rgba(79,70,229,0.25)] print:shadow-none flex items-center justify-center min-h-[550px] print:min-h-0 overflow-hidden">
                {/* Ambient Neon Glow Orbs */}
                <div
                  className="absolute -top-20 -left-20 w-56 h-56 bg-indigo-500/35 rounded-full blur-3xl pointer-events-none animate-pulse no-print"
                  style={{ animationDuration: "5s" }}
                />
                <div
                  className="absolute -bottom-20 -right-20 w-56 h-56 bg-cyan-500/30 rounded-full blur-3xl pointer-events-none animate-pulse no-print"
                  style={{ animationDuration: "7s" }}
                />
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none no-print"
                />

                <div className="relative z-10">
                  <IdCardRenderer
                    student={selectedStudent}
                    themeId={selectedThemeId}
                    overlayIds={selectedOverlays}
                    isBackSide={isBackSide}
                    scale={1}
                  />
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">শিক্ষার্থী নির্বাচন করুন</div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: A4 BULK PRINT SHEET */}
      {viewMode === "bulk_sheet" && (
        <div className="bg-white dark:bg-slate-900 print:bg-white p-6 print:p-0 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 print:border-none space-y-6 print:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 no-print text-xs">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                A4 মাল্টি-কার্ড প্রিন্ট লেআউট (৮টি কার্ড প্রতি পৃষ্ঠায়)
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                নির্বাচিত থিম: <strong className="text-indigo-600">{selectedTheme.name}</strong> • কাটিং মার্কারসহ প্রিন্ট রেডি
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBackSide(!isBackSide)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              >
                {isBackSide ? "ফ্রন্ট সাইডে পরিবর্তন" : "ব্যাক সাইডে পরিবর্তন"}
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>

          {/* Printable Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-2 gap-8 print:gap-4 justify-items-center bg-slate-50 dark:bg-slate-950 print:bg-white p-6 print:p-0 rounded-2xl border border-slate-200 dark:border-slate-800 print:border-none">
            {filteredStudents.map((st) => (
              <div
                key={st.id}
                className="relative p-2 border-2 border-dashed border-slate-300 dark:border-slate-700 print:border-slate-400 rounded-3xl print:rounded-2xl page-break-avoid"
              >
                <span className="absolute -top-3 left-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-mono px-2 py-0.5 rounded font-bold no-print">
                  রোল: {st.roll} • {st.studentId}
                </span>
                <IdCardRenderer
                  student={st}
                  themeId={selectedThemeId}
                  overlayIds={selectedOverlays}
                  isBackSide={isBackSide}
                  scale={0.92}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
