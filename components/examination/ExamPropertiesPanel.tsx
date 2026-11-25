"use client";

import React from "react";
import {
  ExamDocument,
  ExamBlock,
  SectionBlock,
  QuestionNode,
  ExamNumberingSystem,
  OptionLayoutMode,
} from "@/lib/examPaperEngine";
import {
  Sliders,
  X,
  Type,
  Layout,
  HelpCircle,
  Hash,
  Columns,
  CheckCircle2,
  Trash2,
  Plus,
} from "lucide-react";

interface ExamPropertiesPanelProps {
  doc: ExamDocument;
  onUpdateDoc: (updater: (prev: ExamDocument) => ExamDocument) => void;
  selectedNodeId: string | null;
  onClose: () => void;
}

export default function ExamPropertiesPanel({
  doc,
  onUpdateDoc,
  selectedNodeId,
  onClose,
}: ExamPropertiesPanelProps) {
  // Find selected node in blocks or questions
  let selectedBlock: ExamBlock | null = null;
  let selectedSection: SectionBlock | null = null;
  let selectedQuestion: QuestionNode | null = null;

  for (const block of doc.blocks) {
    if (block.id === selectedNodeId) {
      selectedBlock = block;
      break;
    }
    if (block.type === "SECTION_BLOCK") {
      const q = block.questions.find((item) => item.id === selectedNodeId);
      if (q) {
        selectedSection = block;
        selectedQuestion = q;
        break;
      }
    }
  }

  const handleUpdateSelectedQuestion = (updates: Partial<QuestionNode>) => {
    if (!selectedSection || !selectedQuestion) return;
    const secId = selectedSection.id;
    const qId = selectedQuestion.id;

    onUpdateDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.type !== "SECTION_BLOCK" || b.id !== secId) return b;
        return {
          ...b,
          questions: b.questions.map((q) => (q.id === qId ? { ...q, ...updates } : q)),
        };
      }),
    }));
  };

  const handleUpdateSelectedSection = (updates: Partial<SectionBlock>) => {
    const targetId = selectedSection ? selectedSection.id : selectedBlock?.id;
    if (!targetId) return;

    onUpdateDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.type !== "SECTION_BLOCK" || b.id !== targetId) return b;
        return { ...b, ...updates };
      }),
    }));
  };

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-lg shrink-0 select-none text-xs">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
        <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <span>উপাদান প্রোপার্টিজ (Properties)</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-medium text-slate-700 dark:text-slate-300">
        {selectedQuestion && selectedSection ? (
          // ========================================================
          // QUESTION PROPERTIES
          // ========================================================
          <div className="space-y-3.5">
            <div className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
              <span>প্রশ্ন কনফিগারেশন</span>
              <span className="font-mono text-[10px]">{selectedQuestion.id}</span>
            </div>

            {/* Custom Number Override */}
            <div className="space-y-1">
              <label className="font-bold block text-slate-800 dark:text-slate-200">
                কাস্টম নম্বর ওভাররাইড (Custom Badge):
              </label>
              <input
                type="text"
                placeholder="যেমন: ১(ক)। বা (ক)"
                value={selectedQuestion.customNumberOverride || ""}
                onChange={(e) =>
                  handleUpdateSelectedQuestion({ customNumberOverride: e.target.value })
                }
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
              />
            </div>

            {/* Marks & Question Type */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold block">প্রশ্নের মান:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={selectedQuestion.marks}
                  onChange={(e) =>
                    handleUpdateSelectedQuestion({
                      marks: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold block">প্রশ্নের ধরন:</label>
                <select
                  value={selectedQuestion.questionType}
                  onChange={(e) =>
                    handleUpdateSelectedQuestion({ questionType: e.target.value as any })
                  }
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                >
                  <option value="mcq">বহুনির্বাচনি (MCQ)</option>
                  <option value="short">সংক্ষিপ্ত প্রশ্ন</option>
                  <option value="broad">রচনামূলক প্রশ্ন</option>
                  <option value="diagram">ডায়াগ্রাম</option>
                </select>
              </div>
            </div>

            {/* MCQ Options Editing if MCQ */}
            {selectedQuestion.questionType === "mcq" && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="font-bold block text-slate-800 dark:text-slate-200">
                  বহুনির্বাচনি অপশনসমূহ:
                </label>
                {(selectedQuestion.options || []).map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-1.5">
                    <span className="font-bold font-mono text-[10px]">({oIdx + 1})</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...(selectedQuestion?.options || [])];
                        next[oIdx] = e.target.value;
                        handleUpdateSelectedQuestion({ options: next });
                      }}
                      className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : selectedBlock?.type === "SECTION_BLOCK" || selectedSection ? (
          // ========================================================
          // SECTION PROPERTIES
          // ========================================================
          <div className="space-y-3.5">
            <div className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-700 dark:text-indigo-300">
              সেকশন লেআউট সেটিংস
            </div>

            {/* Column Layout */}
            <div className="space-y-1">
              <label className="font-bold block">কলাম লেআউট:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateSelectedSection({ columns: 1 })}
                  className={`p-2 rounded-lg border font-bold text-center cursor-pointer ${
                    (selectedSection || selectedBlock as any)?.columns === 1
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  ১ কলাম (1 Column)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateSelectedSection({ columns: 2 })}
                  className={`p-2 rounded-lg border font-bold text-center cursor-pointer ${
                    (selectedSection || selectedBlock as any)?.columns === 2
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  ২ কলাম (2 Columns)
                </button>
              </div>
            </div>

            {/* Question Numbering System */}
            <div className="space-y-1">
              <label className="font-bold block">প্রশ্নের ক্রমিক নম্বর প্রিসেট:</label>
              <select
                value={(selectedSection || selectedBlock as any)?.questionNumberSystem || "BN_NUM"}
                onChange={(e) =>
                  handleUpdateSelectedSection({
                    questionNumberSystem: e.target.value as ExamNumberingSystem,
                  })
                }
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
              >
                <option value="BN_NUM">১।, ২।, ৩।, ৪। (বাংলা সংখ্যা)</option>
                <option value="BN_NUM_PAREN">(১), (২), (৩), (৪) (ব্র্যাকেট সংখ্যা)</option>
                <option value="BN_ALPHA">ক।, খ।, গ।, ঘ। (বাংলা বর্ণ)</option>
                <option value="BN_ALPHA_PAREN">(ক), (খ), (গ), (ঘ) (ব্র্যাকেট বর্ণ)</option>
                <option value="ROMAN_LOWER">i., ii., iii., iv. (রোমান ছোট)</option>
                <option value="EN_NUM">1., 2., 3., 4. (ইংরেজি সংখ্যা)</option>
              </select>
            </div>

            {/* Option Numbering System */}
            <div className="space-y-1">
              <label className="font-bold block">অপশনের ক্রমিক নম্বর প্রিসেট:</label>
              <select
                value={(selectedSection || selectedBlock as any)?.optionNumberSystem || "BN_ALPHA_PAREN"}
                onChange={(e) =>
                  handleUpdateSelectedSection({
                    optionNumberSystem: e.target.value as ExamNumberingSystem,
                  })
                }
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
              >
                <option value="BN_ALPHA_PAREN">(ক), (খ), (গ), (ঘ) (ব্র্যাকেট বর্ণ)</option>
                <option value="BN_ALPHA">ক।, খ।, গ।, ঘ। (বাংলা বর্ণ)</option>
                <option value="BN_NUM_PAREN">(১), (২), (৩), (৪) (ব্র্যাকেট সংখ্যা)</option>
                <option value="ROMAN_LOWER">i., ii., iii., iv. (রোমান)</option>
                <option value="EN_ALPHA_PAREN">(A), (B), (C), (D) (ইংরেজি ব্র্যাকেট)</option>
              </select>
            </div>

            {/* Option Layout Mode */}
            <div className="space-y-1">
              <label className="font-bold block">অপশন বিন্যাস (Option Layout):</label>
              <select
                value={(selectedSection || selectedBlock as any)?.optionLayout || "AUTO_LAYOUT"}
                onChange={(e) =>
                  handleUpdateSelectedSection({
                    optionLayout: e.target.value as OptionLayoutMode,
                  })
                }
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
              >
                <option value="AUTO_LAYOUT">স্বয়ংক্রিয় ফিট (Auto)</option>
                <option value="GRID_2X2">২x২ গ্রিড (Grid 2x2)</option>
                <option value="INLINE_4">এক লাইনে ৪টি (Inline 4)</option>
                <option value="VERTICAL_1">লম্বালম্বি (Vertical 1)</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Layout className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold">কোনো উপাদান নির্বাচিত নেই</p>
            <p className="text-[11px]">
              ক্যানভাসে যেকোনো প্রশ্ন, সেকশন বা হেডার ব্লকে ক্লিক করে তার বৈশিষ্ট্যসমূহ পরিবর্তন করুন।
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

