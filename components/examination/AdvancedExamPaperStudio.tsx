"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ExamDocument,
  ExamBlock,
  SectionBlock,
  QuestionNode,
  createDefaultExamDocument,
  calculateExamTotalMarks,
  countExamQuestions,
  serializeExamDocument,
  deserializeExamDocument,
} from "@/lib/examPaperEngine";
import { validateExamDocument, ValidationSummary } from "@/lib/examPaperValidator";
import { exportToWordDocx, triggerSystemPrint } from "@/lib/examExportEngine";
import ExamPaperRibbon from "./ExamPaperRibbon";
import ExamDocumentCanvas from "./ExamDocumentCanvas";
import ExamPropertiesPanel from "./ExamPropertiesPanel";
import QuestionBankStudio from "./QuestionBankStudio";
import ExamValidationModal from "./ExamValidationModal";
import ExamVariantModal from "./ExamVariantModal";
import ExamAnswerKeyModal from "./ExamAnswerKeyModal";
import ExamBlueprintModal from "./ExamBlueprintModal";
import {
  Layers,
  BookOpen,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Save,
  CheckCircle2,
  Printer,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const STORAGE_DRAFT_KEY = "pgtsc_exam_paper_draft_v2";

interface AdvancedExamPaperStudioProps {
  initialDocument?: ExamDocument;
  onSaveToDatabase?: (doc: ExamDocument) => Promise<boolean>;
}

export default function AdvancedExamPaperStudio({
  initialDocument,
  onSaveToDatabase,
}: AdvancedExamPaperStudioProps) {
  // Master Document State
  const [doc, setDoc] = useState<ExamDocument>(() => {
    if (initialDocument) return initialDocument;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_DRAFT_KEY);
        if (saved) return deserializeExamDocument(saved);
      } catch (e) {}
    }
    return createDefaultExamDocument();
  });

  // History Stack for Undo/Redo
  const [history, setHistory] = useState<ExamDocument[]>([doc]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Selected Element State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Panels visibility
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Modals visibility
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isAnswerKeyModalOpen, setIsAnswerKeyModalOpen] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);

  // Save status state
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Validation Summary computation
  const validationSummary: ValidationSummary = useMemo(() => {
    return validateExamDocument(doc);
  }, [doc]);

  // Update Document with History Tracking
  const updateDocument = (updater: (prev: ExamDocument) => ExamDocument) => {
    setDoc((prev) => {
      const next = updater(prev);
      next.updatedAt = new Date().toISOString();

      // Record to history stack
      setHistory((prevHist) => {
        const sliced = prevHist.slice(0, historyIndex + 1);
        return [...sliced, next];
      });
      setHistoryIndex((prevIdx) => prevIdx + 1);

      setSaveStatus("unsaved");
      return next;
    });
  };

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      setHistoryIndex(targetIdx);
      setDoc(history[targetIdx]);
      setSaveStatus("unsaved");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetIdx = historyIndex + 1;
      setHistoryIndex(targetIdx);
      setDoc(history[targetIdx]);
      setSaveStatus("unsaved");
    }
  };

  // Debounced Autosave to localStorage & Hybrid Persistence
  useEffect(() => {
    if (saveStatus === "unsaved") {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_DRAFT_KEY, serializeExamDocument(doc));
          setSaveStatus("saved");
        } catch (e) {
          console.warn("Autosave draft failed:", e);
        }
      }, 1200);
    }
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [doc, saveStatus]);

  // Keyboard Shortcuts Handler (Ctrl+S, Ctrl+Z, Ctrl+Y, Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        triggerSystemPrint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history, doc]);

  const handleManualSave = async () => {
    setSaveStatus("saving");
    try {
      localStorage.setItem(STORAGE_DRAFT_KEY, serializeExamDocument(doc));

      // Attempt to save to backend database via /api/exams
      await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: doc.title,
          classId: doc.academicMeta.classId || "class-10",
          tradeId: doc.academicMeta.tradeId || "trade-ge",
          subjectId: doc.academicMeta.subjectId || "sub-6212",
          totalMarks: calculateExamTotalMarks(doc),
          contentJson: serializeExamDocument(doc),
        }),
      }).catch(() => null);

      if (onSaveToDatabase) {
        await onSaveToDatabase(doc);
      }
      setSaveStatus("saved");
    } catch (e) {
      setSaveStatus("unsaved");
    }
  };

  const handleInsertFromBank = (bankItem: any) => {
    // Find target section or default to first section
    let targetSectionId = "";
    for (const b of doc.blocks) {
      if (b.type === "SECTION_BLOCK") {
        if (b.id === selectedNodeId) {
          targetSectionId = b.id;
          break;
        }
        if (!targetSectionId) targetSectionId = b.id;
      }
    }

    if (!targetSectionId) {
      // Create new section
      targetSectionId = `sec-${Date.now()}`;
      updateDocument((prev) => ({
        ...prev,
        blocks: [
          ...prev.blocks,
          {
            type: "SECTION_BLOCK",
            id: targetSectionId,
            title: "সংযোজিত প্রশ্নমালা",
            columns: bankItem.questionType === "mcq" ? 2 : 1,
            showCenterLine: bankItem.questionType === "mcq",
            columnGapPx: 20,
            questionNumberSystem: "BN_NUM",
            optionNumberSystem: "BN_ALPHA_PAREN",
            optionLayout: "AUTO_LAYOUT",
            defaultMarks: bankItem.marks,
            sectionTotalMarks: bankItem.marks,
            questions: [
              {
                id: `q-${Date.now()}`,
                questionType: bankItem.questionType,
                stem: bankItem.questionText,
                marks: bankItem.marks,
                options: bankItem.options ? [...bankItem.options] : undefined,
                correctAnswer: bankItem.correctAnswer,
                difficulty: bankItem.difficulty,
                chapter: bankItem.chapter,
              },
            ],
          },
        ],
      }));
    } else {
      updateDocument((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => {
          if (b.type !== "SECTION_BLOCK" || b.id !== targetSectionId) return b;
          return {
            ...b,
            questions: [
              ...b.questions,
              {
                id: `q-${Date.now()}`,
                questionType: bankItem.questionType,
                stem: bankItem.questionText,
                marks: bankItem.marks,
                options: bankItem.options ? [...bankItem.options] : undefined,
                correctAnswer: bankItem.correctAnswer,
                difficulty: bankItem.difficulty,
                chapter: bankItem.chapter,
              },
            ],
          };
        }),
      }));
    }

    setIsQuestionBankOpen(false);
  };

  const sectionsList = doc.blocks.filter((b) => b.type === "SECTION_BLOCK") as SectionBlock[];

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. Sticky MS-Word Style Multi-Tab Ribbon Toolbar */}
      <ExamPaperRibbon
        doc={doc}
        onUpdateDoc={updateDocument}
        selectedNodeId={selectedNodeId}
        validationSummary={validationSummary}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleManualSave}
        saveStatus={saveStatus}
        onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
        onOpenValidationModal={() => setIsValidationModalOpen(true)}
        onOpenVariantManager={() => setIsVariantModalOpen(true)}
        onOpenAnswerKeyModal={() => setIsAnswerKeyModalOpen(true)}
        onExportWord={() => exportToWordDocx(doc)}
        onTriggerPrint={triggerSystemPrint}
      />

      {/* 2. Workspace Body: Left Outline + Center Canvas + Right Properties */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* ======================================================== */}
        {/* LEFT NAVIGATOR / OUTLINE PANEL */}
        {/* ======================================================== */}
        {leftPanelOpen && (
          <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-sm shrink-0 select-none text-xs">
            {/* Header */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>প্রশ্নপত্র আউটলাইন</span>
              </span>
              <button
                type="button"
                onClick={() => setLeftPanelOpen(false)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsBlueprintModalOpen(true)}
                className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold flex items-center justify-center gap-1 hover:bg-indigo-100"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>অটো জেনারেটর</span>
              </button>
              <button
                type="button"
                onClick={() => setIsQuestionBankOpen(true)}
                className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold flex items-center gap-1"
                title="প্রশ্ন ব্যাংক"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Outline Tree */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {/* Header block pill */}
              <button
                type="button"
                onClick={() => setSelectedNodeId(doc.blocks[0]?.id || null)}
                className={`w-full text-left p-2 rounded-xl transition flex items-center gap-2 ${
                  selectedNodeId === doc.blocks[0]?.id
                    ? "bg-indigo-600 text-white font-bold"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">১. প্রাতিষ্ঠানিক হেডার</span>
              </button>

              {/* Sections & questions tree */}
              {sectionsList.map((sec, sIdx) => {
                const isSecSelected = selectedNodeId === sec.id;
                return (
                  <div key={sec.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId(sec.id)}
                      className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between gap-2 font-bold ${
                        isSecSelected
                          ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <span className="truncate">
                        {sec.parentNumberLabel ? `${sec.parentNumberLabel}: ` : ""}
                        {sec.title}
                      </span>
                      <span className="text-[10px] opacity-70 font-mono">
                        ({sec.questions.length})
                      </span>
                    </button>

                    {/* Question items */}
                    <div className="pl-3 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-800 ml-3">
                      {sec.questions.map((q, qIdx) => {
                        const isQSelected = selectedNodeId === q.id;
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setSelectedNodeId(q.id)}
                            className={`w-full text-left py-1 px-2 rounded-lg truncate text-[11px] transition ${
                              isQSelected
                                ? "bg-indigo-500 text-white font-bold"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span>
                              {q.customNumberOverride || `${qIdx + 1}।`}{" "}
                              {q.stem ? q.stem.substring(0, 20) : "খালি প্রশ্ন"}...
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Left Toggle Button if closed */}
        {!leftPanelOpen && (
          <button
            type="button"
            onClick={() => setLeftPanelOpen(true)}
            className="absolute left-2 top-2 z-20 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-slate-600 dark:text-slate-300 hover:text-indigo-600"
            title="আউটলাইন খুলুন"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* ======================================================== */}
        {/* CENTER A4 DOCUMENT EDITING CANVAS */}
        {/* ======================================================== */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto">
          <ExamDocumentCanvas
            doc={doc}
            onUpdateDoc={updateDocument}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </main>

        {/* Right Toggle Button if closed */}
        {!rightPanelOpen && (
          <button
            type="button"
            onClick={() => setRightPanelOpen(true)}
            className="absolute right-2 top-2 z-20 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-slate-600 dark:text-slate-300 hover:text-indigo-600"
            title="প্রোপার্টিজ খুলুন"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* ======================================================== */}
        {/* RIGHT CONTEXTUAL PROPERTIES PANEL */}
        {/* ======================================================== */}
        {rightPanelOpen && (
          <ExamPropertiesPanel
            doc={doc}
            onUpdateDoc={updateDocument}
            selectedNodeId={selectedNodeId}
            onClose={() => setRightPanelOpen(false)}
          />
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. MODALS & DRAWERS */}
      {/* ======================================================== */}

      {/* Question Bank Modal */}
      {isQuestionBankOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[90vh]">
            <QuestionBankStudio
              onInsertToExam={handleInsertFromBank}
              onClose={() => setIsQuestionBankOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {isValidationModalOpen && (
        <ExamValidationModal
          summary={validationSummary}
          onClose={() => setIsValidationModalOpen(false)}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            setIsValidationModalOpen(false);
          }}
        />
      )}

      {/* Variant Shuffler Modal */}
      {isVariantModalOpen && (
        <ExamVariantModal
          doc={doc}
          onApplyVariant={(variantDoc) => updateDocument(() => variantDoc)}
          onClose={() => setIsVariantModalOpen(false)}
        />
      )}

      {/* Answer Key Modal */}
      {isAnswerKeyModalOpen && (
        <ExamAnswerKeyModal doc={doc} onClose={() => setIsAnswerKeyModalOpen(false)} />
      )}

      {/* Blueprint Generator Modal */}
      {isBlueprintModalOpen && (
        <ExamBlueprintModal
          onApplyGeneratedDoc={(genDoc) => updateDocument(() => genDoc)}
          onClose={() => setIsBlueprintModalOpen(false)}
        />
      )}
    </div>
  );
}

