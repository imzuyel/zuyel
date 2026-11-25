"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Copy,
  Edit3,
  Archive,
  RefreshCw,
  Tag,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  ArrowRight,
  Sliders,
  X,
  FileCheck,
  CheckSquare,
  Square,
  ChevronDown,
  Download,
  Upload,
} from "lucide-react";
import {
  QuestionBankItem,
  getAllQuestionBankItems,
  addQuestionBankItem,
  updateQuestionBankItem,
  duplicateQuestionBankItem,
  deleteQuestionBankItem,
  archiveQuestionBankItem,
  queryQuestionBank,
  detectDuplicateInBank,
} from "@/lib/questionBankEngine";
import { QuestionType, QuestionNode } from "@/lib/examPaperEngine";
import { ACADEMIC_CLASSES, ALL_TRADES } from "@/lib/academicStructure";

interface QuestionBankStudioProps {
  onInsertToExam?: (question: QuestionBankItem) => void;
  onClose?: () => void;
}

export default function QuestionBankStudio({ onInsertToExam, onClose }: QuestionBankStudioProps) {
  const [items, setItems] = useState<QuestionBankItem[]>(() => getAllQuestionBankItems());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedTrade, setSelectedTrade] = useState("all");
  const [selectedType, setSelectedType] = useState<QuestionType | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"active" | "archived" | "all">("active");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [editingItem, setEditingItem] = useState<QuestionBankItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states for Create/Edit
  const [formStem, setFormStem] = useState("");
  const [formType, setFormType] = useState<QuestionType>("mcq");
  const [formMarks, setFormMarks] = useState(1);
  const [formDifficulty, setFormDifficulty] = useState<"easy" | "medium" | "hard" | "advanced">("medium");
  const [formChapter, setFormChapter] = useState("অধ্যায় ১");
  const [formTopic, setFormTopic] = useState("");
  const [formClass, setFormClass] = useState("দশম শ্রেণি");
  const [formTrade, setFormTrade] = useState("জেনারেল ইলেকট্রনিক্স");
  const [formSubject, setFormSubject] = useState("জেনারেল ইলেকট্রনিক্স-২ (তত্ত্বীয়)");
  const [formSubjectCode, setFormSubjectCode] = useState("৬২১২");
  const [formOptions, setFormOptions] = useState<string[]>(["", "", "", ""]);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState("");
  const [formExplanation, setFormExplanation] = useState("");

  const refreshList = () => {
    setItems(getAllQuestionBankItems());
  };

  const filteredItems = useMemo(() => {
    return queryQuestionBank({
      searchQuery,
      className: selectedClass,
      tradeName: selectedTrade,
      questionType: selectedType,
      difficulty: selectedDifficulty as any,
      status: selectedStatus,
    });
  }, [items, searchQuery, selectedClass, selectedTrade, selectedType, selectedDifficulty, selectedStatus]);

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`নির্বাচিত ${selectedIds.size}টি প্রশ্ন কি নিশ্চিতভাবে মুছে ফেলতে চান?`)) {
      selectedIds.forEach((id) => deleteQuestionBankItem(id));
      setSelectedIds(new Set());
      refreshList();
    }
  };

  const handleOpenEdit = (item: QuestionBankItem) => {
    setEditingItem(item);
    setFormStem(item.questionText);
    setFormType(item.questionType);
    setFormMarks(item.marks);
    setFormDifficulty(item.difficulty);
    setFormChapter(item.chapter);
    setFormTopic(item.topic || "");
    setFormClass(item.className);
    setFormTrade(item.tradeName);
    setFormSubject(item.subjectName);
    setFormSubjectCode(item.subjectCode);
    setFormOptions(item.options && item.options.length > 0 ? [...item.options] : ["", "", "", ""]);
    setFormCorrectAnswer(String(item.correctAnswer || ""));
    setFormExplanation(item.explanation || "");
    setIsCreating(true);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormStem("");
    setFormType("mcq");
    setFormMarks(1);
    setFormDifficulty("medium");
    setFormChapter("অধ্যায় ১");
    setFormTopic("");
    setFormOptions(["", "", "", ""]);
    setFormCorrectAnswer("");
    setFormExplanation("");
    setIsCreating(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStem.trim()) return;

    if (editingItem) {
      updateQuestionBankItem(editingItem.id, {
        questionText: formStem.trim(),
        questionType: formType,
        marks: formMarks,
        difficulty: formDifficulty,
        chapter: formChapter,
        topic: formTopic,
        className: formClass,
        tradeName: formTrade,
        subjectName: formSubject,
        subjectCode: formSubjectCode,
        options: formType === "mcq" ? formOptions.filter((o) => o.trim() !== "") : undefined,
        correctAnswer: formCorrectAnswer,
        explanation: formExplanation,
      });
    } else {
      addQuestionBankItem({
        questionText: formStem.trim(),
        questionType: formType,
        marks: formMarks,
        difficulty: formDifficulty,
        cognitiveLevel: "understanding",
        chapter: formChapter,
        topic: formTopic,
        className: formClass,
        classId: "class-10",
        tradeName: formTrade,
        tradeId: "trade-ge",
        subjectName: formSubject,
        subjectCode: formSubjectCode,
        academicYear: "2026",
        options: formType === "mcq" ? formOptions.filter((o) => o.trim() !== "") : undefined,
        correctAnswer: formCorrectAnswer,
        explanation: formExplanation,
        tags: [formChapter, formTrade, formType],
        createdBy: "PTSC Teacher",
        source: "manual",
      });
    }

    setIsCreating(false);
    setEditingItem(null);
    refreshList();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-full max-h-[85vh]">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>প্রাতিষ্ঠানিক প্রশ্ন ব্যাংক (Question Bank)</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono">
                {filteredItems.length} টি প্রশ্ন
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              শ্রেণি, ট্রেড ও অধ্যায়ভিত্তিক প্রশ্ন সংগ্রহ ও ফিল্টারিং রিপোজিটরি
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন প্রশ্ন তৈরি</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="প্রশ্নের মূলভাব, ট্যাগ বা বিষয় দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Class Filter */}
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
        >
          <option value="all">সকল শ্রেণি</option>
          {ACADEMIC_CLASSES.map((c) => (
            <option key={c.id} value={c.nameBangla}>
              {c.nameBangla}
            </option>
          ))}
        </select>

        {/* Trade Filter */}
        <select
          value={selectedTrade}
          onChange={(e) => setSelectedTrade(e.target.value)}
          className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
        >
          <option value="all">সকল ট্রেড</option>
          {ALL_TRADES.map((t) => (
            <option key={t.id} value={t.nameBangla}>
              {t.nameBangla}
            </option>
          ))}
        </select>

        {/* Question Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
        >
          <option value="all">সকল প্রশ্নের ধরন</option>
          <option value="mcq">বহুনির্বাচনি (MCQ)</option>
          <option value="short">সংক্ষিপ্ত প্রশ্ন</option>
          <option value="broad">রচনামূলক প্রশ্ন</option>
          <option value="diagram">ডায়াগ্রাম / সার্কিট</option>
        </select>

        {/* Difficulty Filter */}
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
        >
          <option value="all">সকল কাঠিন্য মাত্রা</option>
          <option value="easy">সহজ (Easy)</option>
          <option value="medium">মধ্যম (Medium)</option>
          <option value="hard">কঠিন (Hard)</option>
          <option value="advanced">উচ্চতর (Advanced)</option>
        </select>

        {/* Bulk Action Buttons */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {selectedIds.size} টি নির্বাচিত
            </span>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছে ফেলুন</span>
            </button>
          </div>
        )}
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">কোনো প্রশ্ন পাওয়া যায়নি।</p>
            <p className="text-xs">ফিল্টারের মান পরিবর্তন করুন অথবা নতুন প্রশ্ন তৈরি করুন।</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(item.id)}
                      className="mt-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Meta badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {item.className}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                          {item.tradeName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {item.chapter}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          মান: {item.marks}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md uppercase font-mono ${
                            item.difficulty === "easy"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.difficulty === "hard" || item.difficulty === "advanced"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {item.difficulty}
                        </span>
                      </div>

                      {/* Question Stem */}
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                        {item.questionText}
                      </p>

                      {/* MCQ Options Display */}
                      {item.questionType === "mcq" && item.options && item.options.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                          {item.options.map((opt, optIdx) => {
                            const isCorrect =
                              item.correctAnswer &&
                              opt.trim().toLowerCase() === String(item.correctAnswer).trim().toLowerCase();
                            return (
                              <div
                                key={optIdx}
                                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                                  isCorrect
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold"
                                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <span className="text-[10px] opacity-70">({optIdx + 1})</span>
                                <span className="truncate">{opt}</span>
                                {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-auto" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {onInsertToExam && (
                      <button
                        type="button"
                        onClick={() => onInsertToExam(item)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>প্রশ্নপত্রে যুক্ত করুন</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      title="সম্পাদনা"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        duplicateQuestionBankItem(item.id);
                        refreshList();
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      title="অনুলিপি তৈরি"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("প্রশ্নটি কি নিশ্চিতভাবে মুছে ফেলতে চান?")) {
                          deleteQuestionBankItem(item.id);
                          refreshList();
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-500 cursor-pointer"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingItem ? "প্রশ্ন সম্পাদনা" : "প্রশ্ন ব্যাংকে নতুন প্রশ্ন সংযোজন"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs font-medium">
              {/* Question Stem */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">প্রশ্নের মূলভাব (Question Stem):</label>
                <textarea
                  required
                  rows={3}
                  value={formStem}
                  onChange={(e) => setFormStem(e.target.value)}
                  placeholder="প্রশ্নের সুস্পষ্ট বিবরণ লিখুন..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">প্রশ্নের ধরন:</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="mcq">বহুনির্বাচনি (MCQ)</option>
                    <option value="short">সংক্ষিপ্ত প্রশ্ন</option>
                    <option value="broad">রচনামূলক প্রশ্ন</option>
                    <option value="diagram">ডায়াগ্রাম / চিত্র</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold">পূর্ণমান:</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formMarks}
                    onChange={(e) => setFormMarks(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold">কাঠিন্য মাত্রা:</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="easy">সহজ (Easy)</option>
                    <option value="medium">মধ্যম (Medium)</option>
                    <option value="hard">কঠিন (Hard)</option>
                    <option value="advanced">উচ্চতর (Advanced)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold">অধ্যায়:</label>
                  <input
                    type="text"
                    value={formChapter}
                    onChange={(e) => setFormChapter(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* MCQ Options if MCQ */}
              {formType === "mcq" && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="font-bold block text-slate-800 dark:text-slate-200">
                    বহুনির্বাচনি অপশনসমূহ ও সঠিক উত্তর:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {formOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <span className="font-bold font-mono">({oIdx + 1})</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...formOptions];
                            next[oIdx] = e.target.value;
                            setFormOptions(next);
                          }}
                          placeholder={`অপশন ${oIdx + 1}`}
                          className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <span className="font-bold">সঠিক উত্তর:</span>
                    <input
                      type="text"
                      value={formCorrectAnswer}
                      onChange={(e) => setFormCorrectAnswer(e.target.value)}
                      placeholder="সঠিক অপশনটি হুবহু লিখুন"
                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

