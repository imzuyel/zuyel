"use client";

import React, { useState } from "react";
import {
  FileText,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Columns,
  Minus,
  Table as TableIcon,
  Image as ImageIcon,
  Sparkles,
  Printer,
  FileDown,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RotateCw,
  Save,
  BookOpen,
  Shuffle,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  Percent,
} from "lucide-react";
import { ExamDocument, OptionLayoutMode } from "@/lib/examPaperEngine";
import { ValidationSummary } from "@/lib/examPaperValidator";

export type RibbonTab = "home" | "insert" | "layout" | "design" | "review" | "export";

interface ExamPaperRibbonProps {
  doc: ExamDocument;
  onUpdateDoc: (updater: (prev: ExamDocument) => ExamDocument) => void;
  selectedNodeId: string | null;
  validationSummary: ValidationSummary;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  saveStatus: "saved" | "saving" | "unsaved";
  onOpenQuestionBank: () => void;
  onOpenValidationModal: () => void;
  onOpenVariantManager: () => void;
  onOpenAnswerKeyModal: () => void;
  onExportWord: () => void;
  onTriggerPrint: () => void;
}

const MATH_CHEM_SYMBOLS = [
  "÷", "×", "±", "√", "π", "°", "≤", "≥", "≠", "→", "⇌", "∞", "≈", "∑", "Δ",
  "H₂O", "CO₂", "O₂", "H₂SO₄", "NaCl", "NH₃", "Fe₂O₃"
];

export default function ExamPaperRibbon({
  doc,
  onUpdateDoc,
  selectedNodeId,
  validationSummary,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  saveStatus,
  onOpenQuestionBank,
  onOpenValidationModal,
  onOpenVariantManager,
  onOpenAnswerKeyModal,
  onExportWord,
  onTriggerPrint,
}: ExamPaperRibbonProps) {
  const [activeTab, setActiveTab] = useState<RibbonTab>("home");

  // Get active node style or global default
  const activeStyle = selectedNodeId ? doc.nodeStyles[selectedNodeId] || {} : {};

  const handleUpdateActiveStyle = (updates: Partial<typeof activeStyle>) => {
    if (!selectedNodeId) return;
    onUpdateDoc((prev) => ({
      ...prev,
      nodeStyles: {
        ...prev.nodeStyles,
        [selectedNodeId]: {
          ...(prev.nodeStyles[selectedNodeId] || {}),
          ...updates,
        },
      },
    }));
  };

  const handleInsertSymbol = (sym: string) => {
    // If user is editing active element, copy symbol to clipboard for immediate paste
    navigator.clipboard?.writeText(sym);
  };

  const handleInsertHorizontalLine = () => {
    onUpdateDoc((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        {
          type: "HORIZONTAL_LINE",
          id: `line-${Date.now()}`,
          lineStyle: "solid",
          thicknessPx: 1,
          marginY: 6,
          visibility: true,
        },
      ],
    }));
  };

  const handleInsertNotice = () => {
    onUpdateDoc((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        {
          type: "TEXT_OR_TABLE_BLOCK",
          id: `notice-${Date.now()}`,
          textType: "instruction",
          content: "[বিশেষ দ্রষ্টব্য: সকল প্রশ্নের উত্তর ক্রমানুসারে প্রদান করতে হবে।]",
        },
      ],
    }));
  };

  const handleInsertTable = () => {
    onUpdateDoc((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        {
          type: "TEXT_OR_TABLE_BLOCK",
          id: `table-${Date.now()}`,
          textType: "table",
          content: "",
          htmlTable: {
            headers: ["ক্রমিক", "উপাদান / সার্কিট প্যারামিটার", "মান / একক", "মন্তব্য"],
            rows: [
              ["১", "ডায়োড ফরোয়ার্ড ভোল্টেজ (Vf)", "০.৭ V", "সিলিকন"],
              ["২", "রিভার্স ব্রেকডাউন ভোল্টেজ (Vz)", "১২ V", "জেনার ডায়োড"],
            ],
            bordered: true,
          },
        },
      ],
    }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 z-30 shadow-xs select-none">
      {/* Top File & Tab Switcher Bar */}
      <div className="px-4 py-1.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {/* Quick Undo / Redo / Save */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="পূর্বাবস্থায় ফিরুন (Ctrl+Z)"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="পুনরায় করুন (Ctrl+Y)"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onSave}
            title="সংরক্ষণ করুন (Ctrl+S)"
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveStatus === "saving" ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ"}</span>
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Ribbon Tabs */}
          {(
            [
              { id: "home", label: "হোম (Home)" },
              { id: "insert", label: "ইনসার্ট (Insert)" },
              { id: "layout", label: "পৃষ্ঠা লেআউট (Layout)" },
              { id: "design", label: "পরীক্ষা ডিজাইন (Exam)" },
              { id: "review", label: "রিভিউ ও পরীক্ষণ (Review)" },
              { id: "export", label: "প্রিন্ট ও এক্সপোর্ট (Export)" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === t.id
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Right Status Pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenValidationModal}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
              validationSummary.readyToPrint
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
            }`}
          >
            {validationSummary.readyToPrint ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>
              {validationSummary.readyToPrint
                ? "প্রিন্ট উপযোগী (১০০%)"
                : `${validationSummary.issues.length}টি ত্রুটি/সতর্কতা`}
            </span>
          </button>
        </div>
      </div>

      {/* Active Tab Sub-Ribbon Content */}
      <div className="p-2 sm:px-4 sm:py-2 flex items-center gap-4 overflow-x-auto text-xs min-h-[52px]">
        {/* ======================================================== */}
        {/* 1. HOME TAB */}
        {/* ======================================================== */}
        {activeTab === "home" && (
          <>
            {/* Font Selector */}
            <div className="flex items-center gap-1">
              <select
                value={activeStyle.fontFamily || "Hind Siliguri"}
                onChange={(e) => handleUpdateActiveStyle({ fontFamily: e.target.value as any })}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                <option value="Hind Siliguri">হিন্দ শিলিগুড়ি (Hind Siliguri)</option>
                <option value="Noto Serif Bengali">নোটো সেরিফ বাংলা (Noto Serif)</option>
                <option value="Kalpurush">কালপুরুষ (Kalpurush)</option>
                <option value="SolaimanLipi">সোলাইমানলিপি (SolaimanLipi)</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>

              {/* Font Size Dropdown */}
              <select
                value={activeStyle.fontSizePt || 11}
                onChange={(e) =>
                  handleUpdateActiveStyle({ fontSizePt: parseFloat(e.target.value) })
                }
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono"
              >
                {[9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 14, 16, 18, 20].map((sz) => (
                  <option key={sz} value={sz}>
                    {sz} pt
                  </option>
                ))}
              </select>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

            {/* B / I / U */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() =>
                  handleUpdateActiveStyle({
                    fontWeight: activeStyle.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                className={`p-1.5 rounded-lg cursor-pointer ${
                  activeStyle.fontWeight === "bold"
                    ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
                title="বোল্ড (B)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateActiveStyle({
                    fontStyle: activeStyle.fontStyle === "italic" ? "normal" : "italic",
                  })
                }
                className={`p-1.5 rounded-lg cursor-pointer ${
                  activeStyle.fontStyle === "italic"
                    ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
                title="ইটালিক (I)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateActiveStyle({
                    textDecoration:
                      activeStyle.textDecoration === "underline" ? "none" : "underline",
                  })
                }
                className={`p-1.5 rounded-lg cursor-pointer ${
                  activeStyle.textDecoration === "underline"
                    ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
                title="আন্ডারলাইন (U)"
              >
                <Underline className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Alignment */}
            <div className="flex items-center gap-0.5">
              {(
                [
                  { id: "left", icon: AlignLeft },
                  { id: "center", icon: AlignCenter },
                  { id: "right", icon: AlignRight },
                  { id: "justify", icon: AlignJustify },
                ] as const
              ).map((align) => {
                const Icon = align.icon;
                const isActive = (activeStyle.textAlign || "left") === align.id;
                return (
                  <button
                    key={align.id}
                    type="button"
                    onClick={() => handleUpdateActiveStyle({ textAlign: align.id })}
                    className={`p-1.5 rounded-lg cursor-pointer ${
                      isActive
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Line Height */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 font-bold">স্পেসিং:</span>
              <select
                value={activeStyle.lineHeight || 1.3}
                onChange={(e) =>
                  handleUpdateActiveStyle({ lineHeight: parseFloat(e.target.value) })
                }
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
              >
                <option value="1.0">১.০ (টাইট)</option>
                <option value="1.15">১.১৫ (স্ট্যান্ডার্ড)</option>
                <option value="1.3">১.৩ (প্রমিত)</option>
                <option value="1.5">১.৫ (ফাঁকা)</option>
              </select>
            </div>

            {/* Question Bank Quick Launcher */}
            <button
              type="button"
              onClick={onOpenQuestionBank}
              className="ml-auto px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>প্রশ্ন ব্যাংক ওপেন করুন</span>
            </button>
          </>
        )}

        {/* ======================================================== */}
        {/* 2. INSERT TAB */}
        {/* ======================================================== */}
        {activeTab === "insert" && (
          <>
            <button
              type="button"
              onClick={handleInsertHorizontalLine}
              className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Minus className="w-4 h-4 text-indigo-500" />
              <span>অনুভূমিক দাগ (Divider Line)</span>
            </button>

            <button
              type="button"
              onClick={handleInsertNotice}
              className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span>নির্দেশনা বক্স (Notice/Instructions)</span>
            </button>

            <button
              type="button"
              onClick={handleInsertTable}
              className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <TableIcon className="w-4 h-4 text-emerald-500" />
              <span>টেবিল যোগ করুন (Table)</span>
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Quick Math & Chemistry Symbol Palette */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 font-bold">প্রতীক:</span>
              <div className="flex items-center gap-1 overflow-x-auto max-w-sm">
                {MATH_CHEM_SYMBOLS.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => handleInsertSymbol(sym)}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 rounded-md font-mono text-xs font-bold cursor-pointer transition active:scale-95"
                    title={`ক্লিপবোর্ডে কপি করুন: ${sym}`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* 3. LAYOUT TAB */}
        {/* ======================================================== */}
        {activeTab === "layout" && (
          <>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">মার্জিন:</span>
              {(["narrow", "normal", "wide"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    onUpdateDoc((prev) => ({
                      ...prev,
                      pageConfig: {
                        ...prev.pageConfig,
                        margins: {
                          ...prev.pageConfig.margins,
                          preset: m,
                          topMm: m === "narrow" ? 8 : m === "wide" ? 18 : 12,
                          bottomMm: m === "narrow" ? 8 : m === "wide" ? 18 : 12,
                          leftMm: m === "narrow" ? 8 : m === "wide" ? 18 : 12,
                          rightMm: m === "narrow" ? 8 : m === "wide" ? 18 : 12,
                        },
                      },
                    }))
                  }
                  className={`px-2.5 py-1 rounded-lg border font-bold capitalize ${
                    doc.pageConfig.margins.preset === m
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {m === "narrow" ? "সংকীর্ণ (8mm)" : m === "wide" ? "প্রশস্ত (18mm)" : "প্রমিত (12mm)"}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">প্রিসেট:</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateDoc((prev) => ({
                    ...prev,
                    pageConfig: {
                      ...prev.pageConfig,
                      margins: { preset: "narrow", topMm: 8, bottomMm: 8, leftMm: 8, rightMm: 8 },
                    },
                    nodeStyles: {
                      ...prev.nodeStyles,
                      global: { fontSizePt: 10, lineHeight: 1.15 },
                    },
                  }))
                }
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 font-bold"
              >
                ১ পৃষ্ঠায় ফিট (Compact)
              </button>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* 4. EXAM DESIGN TAB */}
        {/* ======================================================== */}
        {activeTab === "design" && (
          <>
            <button
              type="button"
              onClick={onOpenVariantManager}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-indigo-600" />
              <span>সেট শাফল করুন (Set A, B, C, D)</span>
            </button>

            <button
              type="button"
              onClick={onOpenAnswerKeyModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>উত্তরমালা ও মার্কিং স্কিম (Answer Key)</span>
            </button>
          </>
        )}

        {/* ======================================================== */}
        {/* 5. REVIEW TAB */}
        {/* ======================================================== */}
        {activeTab === "review" && (
          <>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>মোট প্রশ্ন: {doc.blocks.filter((b) => b.type === "SECTION_BLOCK").reduce((acc, s) => acc + (s as any).questions.length, 0)} টি</span>
              <span>মোট পূর্ণমান: {doc.blocks.filter((b) => b.type === "SECTION_BLOCK").reduce((acc, s) => acc + ((s as any).sectionTotalMarks || 0), 0)}</span>
              <span>ত্রুটি: {validationSummary.errorsCount} টি</span>
              <span>সতর্কতা: {validationSummary.warningsCount} টি</span>
            </div>

            <button
              type="button"
              onClick={onOpenValidationModal}
              className="ml-auto px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>সম্পূর্ণ পরীক্ষণ রিপোর্ট দেখুন</span>
            </button>
          </>
        )}

        {/* ======================================================== */}
        {/* 6. EXPORT TAB */}
        {/* ======================================================== */}
        {activeTab === "export" && (
          <>
            <button
              type="button"
              onClick={onTriggerPrint}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>সরাসরি প্রিন্ট প্রিভিউ (A4 Print)</span>
            </button>

            <button
              type="button"
              onClick={onExportWord}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Microsoft Word (.DOCX) এক্সপোর্ট</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

