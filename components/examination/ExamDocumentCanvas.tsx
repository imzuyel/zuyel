"use client";

import React from "react";
import {
  ExamDocument,
  ExamBlock,
  SectionBlock,
  QuestionNode,
  HorizontalLineBlock,
  TextOrTableBlock,
} from "@/lib/examPaperEngine";
import { formatIndexToBadge } from "@/lib/examNumberingEngine";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Columns,
  Table,
  Image,
  GripVertical,
  Minus,
} from "lucide-react";

interface ExamDocumentCanvasProps {
  doc: ExamDocument;
  onUpdateDoc: (updater: (prev: ExamDocument) => ExamDocument) => void;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  isPrintMode?: boolean;
}

export default function ExamDocumentCanvas({
  doc,
  onUpdateDoc,
  selectedNodeId,
  onSelectNode,
  isPrintMode = false,
}: ExamDocumentCanvasProps) {
  const header = doc.blocks.find((b) => b.type === "HEADER_BLOCK");

  const handleUpdateHeader = (updates: Partial<typeof header>) => {
    onUpdateDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.type === "HEADER_BLOCK" ? { ...b, ...updates } : b
      ),
    }));
  };

  const handleUpdateQuestion = (
    sectionId: string,
    questionId: string,
    updates: Partial<QuestionNode>
  ) => {
    onUpdateDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.type !== "SECTION_BLOCK" || b.id !== sectionId) return b;
        return {
          ...b,
          questions: b.questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
        };
      }),
    }));
  };

  const handleDeleteQuestion = (sectionId: string, questionId: string) => {
    onUpdateDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.type !== "SECTION_BLOCK" || b.id !== sectionId) return b;
        return {
          ...b,
          questions: b.questions.filter((q) => q.id !== questionId),
        };
      }),
    }));
  };

  const handleMoveQuestion = (
    sectionId: string,
    questionIndex: number,
    direction: "up" | "down"
  ) => {
    onUpdateDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.type !== "SECTION_BLOCK" || b.id !== sectionId) return b;
        const targetIdx = direction === "up" ? questionIndex - 1 : questionIndex + 1;
        if (targetIdx < 0 || targetIdx >= b.questions.length) return b;

        const newQ = [...b.questions];
        [newQ[questionIndex], newQ[targetIdx]] = [newQ[targetIdx], newQ[questionIndex]];
        return { ...b, questions: newQ };
      }),
    }));
  };

  const handleAddQuestionToSection = (sectionId: string) => {
    onUpdateDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.type !== "SECTION_BLOCK" || b.id !== sectionId) return b;
        const newQ: QuestionNode = {
          id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          questionType: b.questions[0]?.questionType || "mcq",
          stem: "নতুন প্রশ্ন লিখুন...",
          marks: b.defaultMarks || 1,
          options: b.questions[0]?.questionType === "mcq" ? ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"] : undefined,
          correctAnswer: "অপশন ১",
        };
        return {
          ...b,
          questions: [...b.questions, newQ],
        };
      }),
    }));
  };

  const handleDeleteBlock = (blockId: string) => {
    onUpdateDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== blockId),
    }));
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= doc.blocks.length) return;
    onUpdateDoc((prev) => {
      const nextBlocks = [...prev.blocks];
      [nextBlocks[index], nextBlocks[targetIdx]] = [nextBlocks[targetIdx], nextBlocks[index]];
      return { ...prev, blocks: nextBlocks };
    });
  };

  // Convert mm margin to Tailwind padding or inline style
  const marginStyle = {
    paddingTop: `${doc.pageConfig.margins.topMm}mm`,
    paddingRight: `${doc.pageConfig.margins.rightMm}mm`,
    paddingBottom: `${doc.pageConfig.margins.bottomMm}mm`,
    paddingLeft: `${doc.pageConfig.margins.leftMm}mm`,
  };

  return (
    <div className="flex justify-center p-4 sm:p-8 bg-slate-200/70 dark:bg-slate-950/90 min-h-full overflow-y-auto print:p-0 print:m-0 print:bg-white print:overflow-visible">
      {/* A4 Sheet Container: 210mm wide */}
      <div
        id="exam-paper-canvas"
        style={marginStyle}
        className="w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl rounded-xs print:shadow-none print:w-full print:min-h-0 print:rounded-none relative text-[11pt] leading-[1.3] font-['Hind_Siliguri','Kalpurush',sans-serif] selection:bg-indigo-100"
      >
        {/* Render Blocks Sequentially */}
        {doc.blocks.map((block, bIdx) => {
          const isSelected = selectedNodeId === block.id;

          // ========================================================
          // 1. HEADER BLOCK (Strict BTEB Format with No Student Fill-ins)
          // ========================================================
          if (block.type === "HEADER_BLOCK") {
            return (
              <header
                key={block.id}
                onClick={() => onSelectNode(block.id)}
                className={`group relative pb-2 text-center transition-all ${
                  isSelected && !isPrintMode ? "ring-2 ring-indigo-500 rounded-lg p-2" : ""
                }`}
              >
                {/* Institution Name */}
                <h1
                  contentEditable={!isPrintMode}
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    handleUpdateHeader({ institutionName: e.currentTarget.innerText })
                  }
                  className="text-[17pt] sm:text-[18pt] font-black tracking-normal text-slate-950 leading-tight focus:outline-hidden"
                >
                  {block.institutionName}
                </h1>

                {/* Subtitle / Location */}
                <p
                  contentEditable={!isPrintMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateHeader({ subLocation: e.currentTarget.innerText })}
                  className="text-[9.5pt] font-semibold text-slate-700 leading-tight mt-0.5 focus:outline-hidden"
                >
                  {block.subLocation || "কারিগরি শিক্ষা বোর্ড অনুমোদিত • পঞ্চগড়-৫০০০"}
                </p>

                {/* Exam Title */}
                <h2
                  contentEditable={!isPrintMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateHeader({ examTitle: e.currentTarget.innerText })}
                  className="text-[13pt] sm:text-[14pt] font-black text-slate-950 mt-1 focus:outline-hidden"
                >
                  {block.examTitle}
                </h2>

                {/* Metadata Row: Class, Trade, Subject Code */}
                <div className="flex items-center justify-between text-[10pt] font-bold text-slate-900 mt-2 px-1 border-t border-slate-300 pt-1">
                  <span>
                    শ্রেণি:{" "}
                    <span
                      contentEditable={!isPrintMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdateHeader({ className: e.currentTarget.innerText })}
                      className="font-black focus:outline-hidden"
                    >
                      {block.className}
                    </span>
                  </span>

                  <span>
                    ট্রেড:{" "}
                    <span
                      contentEditable={!isPrintMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdateHeader({ tradeName: e.currentTarget.innerText })}
                      className="font-black focus:outline-hidden"
                    >
                      {block.tradeName}
                    </span>
                  </span>

                  <span>
                    বিষয় কোড:{" "}
                    <span
                      contentEditable={!isPrintMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdateHeader({ subjectCode: e.currentTarget.innerText })}
                      className="font-black font-mono focus:outline-hidden"
                    >
                      {block.subjectCode}
                    </span>
                  </span>
                </div>

                {/* Subject, Duration & Total Marks */}
                <div className="flex items-center justify-between text-[10pt] font-bold text-slate-900 px-1 border-b border-slate-300 pb-1 mt-0.5">
                  <div className="text-left">
                    <span>বিষয়: </span>
                    <span
                      contentEditable={!isPrintMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdateHeader({ subjectName: e.currentTarget.innerText })}
                      className="font-black focus:outline-hidden"
                    >
                      {block.subjectName}
                    </span>
                  </div>

                  {/* Left: Duration */}
                  <div className="text-center font-bold">
                    <span>সময়: </span>
                    <span
                      contentEditable={!isPrintMode}
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdateHeader({ duration: e.currentTarget.innerText })}
                      className="font-black focus:outline-hidden"
                    >
                      {block.duration}
                    </span>
                  </div>

                  {/* Right: Total Marks */}
                  <div className="text-right font-bold">
                    <span>পূর্ণমান: </span>
                    <span
                      contentEditable={!isPrintMode}
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        handleUpdateHeader({ totalMarks: parseInt(e.currentTarget.innerText, 10) || 50 })
                      }
                      className="font-black focus:outline-hidden"
                    >
                      {block.totalMarks}
                    </span>
                  </div>
                </div>

                {/* General Instructions Note */}
                <p
                  contentEditable={!isPrintMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateHeader({ instructions: e.currentTarget.innerText })}
                  className="text-[9pt] italic text-slate-700 mt-1 focus:outline-hidden"
                >
                  {block.instructions || "[দ্রষ্টব্য: সকল প্রশ্নের মান সমান। ডান পাশের সংখ্যা প্রশ্নের পূর্ণমান নির্দেশ করে।]"}
                </p>
              </header>
            );
          }

          // ========================================================
          // 2. HORIZONTAL LINE BLOCK
          // ========================================================
          if (block.type === "HORIZONTAL_LINE") {
            const hLine = block as HorizontalLineBlock;
            return (
              <div
                key={block.id}
                onClick={() => onSelectNode(block.id)}
                className={`group relative my-1 transition-all ${
                  isSelected && !isPrintMode ? "ring-2 ring-indigo-500 rounded p-1" : ""
                }`}
              >
                <hr
                  style={{
                    borderTopWidth: `${hLine.thicknessPx}px`,
                    borderTopStyle: hLine.lineStyle === "double" ? "double" : hLine.lineStyle === "dashed" ? "dashed" : "solid",
                    borderColor: "#000",
                    marginTop: `${hLine.marginY}px`,
                    marginBottom: `${hLine.marginY}px`,
                  }}
                />
                {!isPrintMode && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white border border-slate-200 shadow-xs px-1.5 py-0.5 rounded text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleMoveBlock(bIdx, "up")}
                      className="hover:text-indigo-600"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveBlock(bIdx, "down")}
                      className="hover:text-indigo-600"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          }

          // ========================================================
          // 3. TEXT OR TABLE BLOCK
          // ========================================================
          if (block.type === "TEXT_OR_TABLE_BLOCK") {
            const txt = block as TextOrTableBlock;
            return (
              <div
                key={block.id}
                onClick={() => onSelectNode(block.id)}
                className={`group relative my-2 ${
                  isSelected && !isPrintMode ? "ring-2 ring-indigo-500 rounded p-1" : ""
                }`}
              >
                {txt.textType === "instruction" ? (
                  <p
                    contentEditable={!isPrintMode}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      onUpdateDoc((prev) => ({
                        ...prev,
                        blocks: prev.blocks.map((b) =>
                          b.id === block.id ? { ...b, content: e.currentTarget.innerText } : b
                        ),
                      }));
                    }}
                    className="text-[9.5pt] font-semibold italic text-slate-800 text-center py-1 bg-slate-50 border-y border-slate-300 print:bg-transparent"
                  >
                    {txt.content}
                  </p>
                ) : txt.textType === "table" && txt.htmlTable ? (
                  <table className="w-full border-collapse border border-black text-[10pt] my-2">
                    {txt.htmlTable.headers && (
                      <thead>
                        <tr className="bg-slate-100 print:bg-transparent font-bold">
                          {txt.htmlTable.headers.map((h, hIdx) => (
                            <th key={hIdx} className="border border-black p-1 text-center">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {txt.htmlTable.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="border border-black p-1 text-center">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p
                    contentEditable={!isPrintMode}
                    suppressContentEditableWarning
                    className="text-[10pt] leading-relaxed focus:outline-hidden"
                  >
                    {txt.content}
                  </p>
                )}
              </div>
            );
          }

          // ========================================================
          // 4. SECTION BLOCK (Questions with Baseline Alignment)
          // ========================================================
          if (block.type === "SECTION_BLOCK") {
            const sec = block as SectionBlock;
            const isTwoColumn = sec.columns === 2;

            return (
              <section
                key={block.id}
                onClick={() => onSelectNode(block.id)}
                className={`group relative my-3 transition-all ${
                  isSelected && !isPrintMode ? "ring-2 ring-indigo-500 rounded-lg p-2 bg-indigo-50/20" : ""
                }`}
              >
                {/* Section Header */}
                <div className="flex items-center justify-between pb-1 border-b border-black mb-2">
                  <h3 className="text-[11.5pt] font-black text-black">
                    {sec.parentNumberLabel && <span>{sec.parentNumberLabel}: </span>}
                    <span
                      contentEditable={!isPrintMode}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        onUpdateDoc((prev) => ({
                          ...prev,
                          blocks: prev.blocks.map((b) =>
                            b.id === block.id ? { ...b, title: e.currentTarget.innerText } : b
                          ),
                        }));
                      }}
                      className="focus:outline-hidden"
                    >
                      {sec.title}
                    </span>
                  </h3>

                  {sec.sectionTotalMarks > 0 && (
                    <span className="text-[10pt] font-black text-black">
                      [মান: {sec.sectionTotalMarks}]
                    </span>
                  )}
                </div>

                {/* Section Instructions if any */}
                {sec.sectionInstructions && (
                  <p
                    contentEditable={!isPrintMode}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      onUpdateDoc((prev) => ({
                        ...prev,
                        blocks: prev.blocks.map((b) =>
                          b.id === block.id
                            ? { ...b, sectionInstructions: e.currentTarget.innerText }
                            : b
                        ),
                      }));
                    }}
                    className="text-[9pt] italic text-slate-700 mb-2 focus:outline-hidden"
                  >
                    {sec.sectionInstructions}
                  </p>
                )}

                {/* Questions Container: 1 Col or 2 Col */}
                <div
                  className={`grid gap-x-6 gap-y-2.5 ${
                    isTwoColumn
                      ? "grid-cols-2 relative after:content-[''] after:absolute after:top-0 after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[1px] after:bg-slate-300 print:after:bg-black"
                      : "grid-cols-1"
                  }`}
                >
                  {sec.questions.map((q, qIdx) => {
                    const badge = formatIndexToBadge(
                      qIdx,
                      sec.questionNumberSystem,
                      q.customNumberOverride
                    );

                    return (
                      <div
                        key={q.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNode(q.id);
                        }}
                        className={`group/q relative p-1 rounded transition-all break-inside-avoid ${
                          selectedNodeId === q.id && !isPrintMode
                            ? "bg-indigo-50 ring-1 ring-indigo-400"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* Question Row with Exact Baseline Alignment */}
                        <div className="grid grid-cols-[max-content_1fr_max-content] items-baseline gap-x-1.5">
                          {/* Question Number Badge */}
                          <span
                            contentEditable={!isPrintMode}
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              handleUpdateQuestion(sec.id, q.id, {
                                customNumberOverride: e.currentTarget.innerText.trim(),
                              })
                            }
                            className="font-bold font-['Kalpurush',sans-serif] select-none text-[10.5pt] focus:outline-hidden"
                          >
                            {badge}
                          </span>

                          {/* Editable Question Stem */}
                          <div
                            contentEditable={!isPrintMode}
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              handleUpdateQuestion(sec.id, q.id, {
                                stem: e.currentTarget.innerText,
                              })
                            }
                            className="text-justify text-[10.5pt] leading-[1.35] focus:outline-hidden pr-1"
                          >
                            {q.stem}
                          </div>

                          {/* Question Marks in Brackets */}
                          <span
                            contentEditable={!isPrintMode}
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              handleUpdateQuestion(sec.id, q.id, {
                                marks: parseInt(e.currentTarget.innerText.replace(/[^0-9]/g, ""), 10) || 1,
                              })
                            }
                            className="font-bold text-[9.5pt] whitespace-nowrap select-none focus:outline-hidden"
                          >
                            [{q.marks}]
                          </span>
                        </div>

                        {/* MCQ Options Layout */}
                        {q.questionType === "mcq" && q.options && q.options.length > 0 && (
                          <div
                            className={`mt-1.5 pl-6 ${
                              sec.optionLayout === "INLINE_4"
                                ? "flex flex-wrap items-center gap-x-4 gap-y-1"
                                : sec.optionLayout === "VERTICAL_1"
                                ? "flex flex-col gap-1"
                                : "grid grid-cols-2 gap-x-3 gap-y-1"
                            } text-[10pt]`}
                          >
                            {q.options.map((opt, optIdx) => {
                              const optBadge = formatIndexToBadge(optIdx, sec.optionNumberSystem);
                              return (
                                <div key={optIdx} className="flex items-baseline gap-1">
                                  <span className="font-bold select-none text-[9.5pt]">
                                    {optBadge}
                                  </span>
                                  <span
                                    contentEditable={!isPrintMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const nextOpts = [...(q.options || [])];
                                      nextOpts[optIdx] = e.currentTarget.innerText;
                                      handleUpdateQuestion(sec.id, q.id, { options: nextOpts });
                                    }}
                                    className="focus:outline-hidden"
                                  >
                                    {opt}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Floating Question Action Toolbar */}
                        {!isPrintMode && (
                          <div className="absolute right-0 -top-3 opacity-0 group-hover/q:opacity-100 flex items-center gap-0.5 bg-white border border-slate-300 rounded shadow-xs px-1 text-[10px] z-10">
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(sec.id, qIdx, "up")}
                              disabled={qIdx === 0}
                              className="p-1 hover:text-indigo-600 disabled:opacity-30"
                              title="উপরে নিন"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(sec.id, qIdx, "down")}
                              disabled={qIdx === sec.questions.length - 1}
                              className="p-1 hover:text-indigo-600 disabled:opacity-30"
                              title="নিচে নিন"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(sec.id, q.id)}
                              className="p-1 hover:text-red-600"
                              title="মুছুন"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Section Add Question Button */}
                {!isPrintMode && (
                  <div className="mt-2 pt-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleAddQuestionToSection(sec.id)}
                      className="px-3 py-1 rounded-lg border border-dashed border-indigo-400 text-indigo-600 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>এই সেকশনে প্রশ্ন যোগ করুন</span>
                    </button>
                  </div>
                )}
              </section>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

