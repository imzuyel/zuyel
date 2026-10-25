"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  Target,
  CheckCircle2,
  Copy,
  Check,
  BookOpen,
  Clock,
  Award,
  Terminal,
  Info,
  ChevronRight,
  Lightbulb,
} from "lucide-react";

interface InternationalStoryLessonRendererProps {
  markdown?: string;
  titleBangla?: string;
  summary?: string;
  keyTakeaways?: string[];
  durationMinutes?: number;
  readTimeMinutes?: number;
  xpReward?: number;
  blogPartNumber?: number;
}

export function InternationalStoryLessonRenderer({
  markdown = "",
  titleBangla,
  summary,
  keyTakeaways,
  durationMinutes,
  readTimeMinutes,
  xpReward,
  blogPartNumber,
}: InternationalStoryLessonRendererProps) {
  // Track copied code blocks by index
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  // Parse markdown into rich semantic blocks
  const blocks = useMemo(() => {
    if (!markdown) return [];
    const lines = markdown.split("\n");
    const parsed: Array<{
      type: "h1" | "h2" | "h3" | "hr" | "callout" | "code" | "list" | "table" | "p";
      content: string;
      meta?: string;
      items?: string[];
      calloutVariant?: "tip" | "warning" | "info" | "application";
      tableHeaders?: string[];
      tableRows?: string[][];
    }> = [];

    let inCode = false;
    let codeBuffer: string[] = [];
    let codeLang = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code Block Boundary
      if (line.trim().startsWith("```")) {
        if (!inCode) {
          inCode = true;
          codeLang = line.trim().slice(3).trim() || "কোড / টেকনিক্যাল সিনট্যাক্স";
          codeBuffer = [];
        } else {
          inCode = false;
          parsed.push({ type: "code", content: codeBuffer.join("\n"), meta: codeLang });
          codeBuffer = [];
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(line);
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed) continue;

      // Table detection
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const tableLines = [trimmed];
        while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|") && lines[i + 1].trim().endsWith("|")) {
          i++;
          tableLines.push(lines[i].trim());
        }

        if (tableLines.length >= 2) {
          const rawHeaders = tableLines[0]
            .split("|")
            .map((h) => h.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          // Skip line 1 if it's the separator |---|---|
          const contentRows = tableLines.slice(1).filter((r) => !/^[|\s-:]+$/.test(r));
          const rows = contentRows.map((r) =>
            r
              .split("|")
              .map((c) => c.trim())
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          );

          parsed.push({
            type: "table",
            content: "",
            tableHeaders: rawHeaders,
            tableRows: rows,
          });
          continue;
        }
      }

      // Horizontal Rule
      if (trimmed === "---" || trimmed === "***") {
        parsed.push({ type: "hr", content: "" });
        continue;
      }

      // Headings
      if (trimmed.startsWith("# ")) {
        parsed.push({ type: "h1", content: trimmed.slice(2).trim() });
        continue;
      }
      if (trimmed.startsWith("## ")) {
        parsed.push({ type: "h2", content: trimmed.slice(3).trim() });
        continue;
      }
      if (trimmed.startsWith("### ")) {
        parsed.push({ type: "h3", content: trimmed.slice(4).trim() });
        continue;
      }

      // Callout / Info Box
      if (trimmed.startsWith("> ")) {
        const rawContent = trimmed.slice(2).trim();
        let calloutVariant: "tip" | "warning" | "info" | "application" = "info";

        if (
          rawContent.includes("💡") ||
          rawContent.toLowerCase().includes("tip") ||
          rawContent.includes("টিপস")
        ) {
          calloutVariant = "tip";
        } else if (
          rawContent.includes("⚠️") ||
          rawContent.toLowerCase().includes("warn") ||
          rawContent.includes("সতর্কতা") ||
          rawContent.includes("নিরাপত্তা") ||
          rawContent.includes("সেফটি")
        ) {
          calloutVariant = "warning";
        } else if (
          rawContent.includes("📌") ||
          rawContent.includes("বাস্তব") ||
          rawContent.includes("প্রয়োগ") ||
          rawContent.toLowerCase().includes("case study")
        ) {
          calloutVariant = "application";
        }

        parsed.push({
          type: "callout",
          content: rawContent,
          calloutVariant,
        });
        continue;
      }

      // Numbered or Bullet Lists
      if (/^(\d+\.|\-|\*)\s+/.test(trimmed)) {
        const listItems = [trimmed.replace(/^(\d+\.|\-|\*)\s+/, "")];
        while (i + 1 < lines.length && /^(\d+\.|\-|\*)\s+/.test(lines[i + 1].trim())) {
          i++;
          listItems.push(lines[i].trim().replace(/^(\d+\.|\-|\*)\s+/, ""));
        }
        parsed.push({ type: "list", content: "", items: listItems });
        continue;
      }

      // Standard Paragraph
      parsed.push({ type: "p", content: trimmed });
    }

    if (inCode && codeBuffer.length > 0) {
      parsed.push({ type: "code", content: codeBuffer.join("\n"), meta: codeLang });
    }

    return parsed;
  }, [markdown]);

  // Format inline bold, italic, code pills, and tags
  const renderFormattedText = (text: string) => {
    // Regex matches **bold**, *italic*, `code`, or $math$
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$]+\$)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-extrabold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={idx} className="italic text-slate-700 dark:text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (
        (part.startsWith("`") && part.endsWith("`")) ||
        (part.startsWith("$") && part.endsWith("$"))
      ) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-cyan-300 font-mono font-bold text-xs border border-indigo-200 dark:border-indigo-800"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 font-sans text-left">
      {/* 1. EXECUTIVE SUMMARY (Notion/Medium Briefing Banner) */}
      {summary && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/80 via-cyan-50/40 to-slate-50 dark:from-indigo-950/40 dark:via-cyan-950/20 dark:to-slate-900/40 border border-indigo-200/80 dark:border-indigo-800/60 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-cyan-400 flex items-center gap-1.5">
                <span>সারসংক্ষেপ ও মূল উদ্দেশ্য (Executive Briefing)</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                {renderFormattedText(summary)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN STORY PARSED CONTENT (International EdTech Layout) */}
      {/<\/?[a-z][\s\S]*>/i.test(markdown) ? (
        <div
          className="prose dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h1:text-xl sm:prose-h1:2xl prose-h2:text-lg sm:prose-h2:xl prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-mark:bg-amber-300/80 dark:prose-mark:bg-amber-400/30 dark:prose-mark:text-amber-100 prose-mark:px-1.5 prose-mark:py-0.5 prose-mark:rounded-md text-sm sm:text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: markdown }}
        />
      ) : (
        <div className="space-y-4">
          {blocks.map((block, idx) => {
          // Heading 1
          if (block.type === "h1") {
            return (
              <h1
                key={idx}
                className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5"
              >
                <span className="w-2.5 h-6 rounded-full bg-gradient-to-b from-cyan-500 to-indigo-600 shrink-0" />
                <span>{renderFormattedText(block.content)}</span>
              </h1>
            );
          }

          // Heading 2
          if (block.type === "h2") {
            return (
              <h2
                key={idx}
                className="text-base sm:text-lg font-black text-slate-900 dark:text-white pt-4 pb-1 pl-3 border-l-4 border-cyan-500 flex items-center gap-2"
              >
                <span>{renderFormattedText(block.content)}</span>
              </h2>
            );
          }

          // Heading 3
          if (block.type === "h3") {
            return (
              <h3
                key={idx}
                className="text-xs sm:text-sm font-extrabold text-cyan-600 dark:text-cyan-400 pt-3 flex items-center gap-1.5"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{renderFormattedText(block.content)}</span>
              </h3>
            );
          }

          // Divider
          if (block.type === "hr") {
            return (
              <div key={idx} className="py-2">
                <hr className="border-slate-200 dark:border-slate-800" />
              </div>
            );
          }

          // Colorful Callout / Info Box
          if (block.type === "callout") {
            const v = block.calloutVariant;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-start gap-3 my-3 shadow-xs transition-colors ${
                  v === "warning"
                    ? "bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 text-rose-950 dark:text-rose-200"
                    : v === "tip"
                    ? "bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/60 text-amber-950 dark:text-amber-200"
                    : v === "application"
                    ? "bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200"
                    : "bg-cyan-50/90 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-900/60 text-cyan-950 dark:text-cyan-200"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {v === "warning" ? (
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                  ) : v === "tip" ? (
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  ) : v === "application" ? (
                    <Target className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  )}
                </div>
                <div className="space-y-0.5 flex-1 text-xs sm:text-sm leading-relaxed">
                  <span className="font-black block text-[11px] uppercase tracking-wider opacity-90">
                    {v === "warning"
                      ? "⚠️ নিরাপত্তা ও সতর্কতা (Safety & Warning)"
                      : v === "tip"
                      ? "💡 বিশেষ টিপস ও শর্টকাট (Pro Tips)"
                      : v === "application"
                      ? "📌 বাস্তব জীবনের প্রায়োগিক উদাহরণ (Real-World Case)"
                      : "ℹ️ গুরুত্বপূর্ণ তথ্য ও নোট (Important Note)"}
                  </span>
                  <div>{renderFormattedText(block.content)}</div>
                </div>
              </div>
            );
          }

          // Code Block with Copy Button
          if (block.type === "code") {
            const isCopied = copiedIndex === idx;
            return (
              <div
                key={idx}
                className="my-4 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-cyan-300 font-mono text-xs shadow-md"
              >
                <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{block.meta || "কোড / টেকনিক্যাল সিনট্যাক্স"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(block.content, idx)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                    title="কোড কপি করুন"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent font-mono text-[12px] sm:text-xs">
                  {block.content}
                </pre>
              </div>
            );
          }

          // Numbered Step Cards / List Items
          if (block.type === "list" && block.items) {
            return (
              <div key={idx} className="space-y-2.5 my-3">
                {block.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <span className="w-5 h-5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-cyan-200 dark:border-cyan-800">
                      {itemIdx + 1}
                    </span>
                    <div className="leading-relaxed flex-1">
                      {renderFormattedText(item)}
                    </div>
                  </div>
                ))}
              </div>
            );
          }

          // Table
          if (block.type === "table" && block.tableHeaders && block.tableRows) {
            return (
              <div key={idx} className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black">
                      {block.tableHeaders.map((head, hIdx) => (
                        <th key={hIdx} className="p-3">
                          {renderFormattedText(head)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {block.tableRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={
                          rIdx % 2 === 0
                            ? "bg-white dark:bg-slate-900"
                            : "bg-slate-50/60 dark:bg-slate-850"
                        }
                      >
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3 text-slate-700 dark:text-slate-300">
                            {renderFormattedText(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          // Default Paragraph
          return (
            <p
              key={idx}
              className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed sm:leading-loose font-sans font-normal"
            >
              {renderFormattedText(block.content)}
            </p>
          );
        })}
      </div>
      )}

      {/* 3. KEY TAKEAWAYS (🎯 মূল শিখনফল Checklist Box) */}
      {keyTakeaways && keyTakeaways.length > 0 && (
        <div className="mt-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-800/50 p-4 sm:p-5 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
              মূল শিখনফল (Key Takeaways Checklist)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {keyTakeaways.map((item, kIdx) => (
              <div
                key={kIdx}
                className="flex items-start gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-200/60 dark:border-emerald-900/50 text-xs text-slate-800 dark:text-slate-200"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{renderFormattedText(item)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Backward compatibility export
export const RichArticleRenderer = InternationalStoryLessonRenderer;
