"use client";

import React from "react";

interface SafeHtmlRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders HTML content (from TipTap rich text editor) or plain text/markdown safely
 * with high quality EdTech typography and prose styling.
 */
export function SafeHtmlRenderer({ content, className = "" }: SafeHtmlRendererProps) {
  if (!content || typeof content !== "string") {
    return <p className="text-slate-400 italic text-sm">কোনো কনটেন্ট পাওয়া যায়নি।</p>;
  }

  // Check if content is HTML from TipTap or markdown
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return (
      <div
        className={`prose dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h1:text-xl sm:prose-h1:text-2xl prose-h2:text-lg sm:prose-h2:text-xl prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-mark:bg-amber-300/80 dark:prose-mark:bg-amber-400/30 dark:prose-mark:text-amber-100 prose-mark:px-1 prose-mark:py-0.5 prose-mark:rounded-sm ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // If plain text with simple paragraphs, split by double newlines
  const paragraphs = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-4 text-slate-700 dark:text-slate-200 leading-relaxed text-sm sm:text-base ${className}`}>
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={idx} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-2">
              {trimmed.replace(/^#\s+/, "")}
            </h1>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={idx} className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 pt-2">
              {trimmed.replace(/^##\s+/, "")}
            </h2>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n/).map((li) => li.replace(/^[-*]\s+/, ""));
          return (
            <ul key={idx} className="list-disc list-inside space-y-1.5 pl-2">
              {items.map((item, itemIdx) => (
                <li key={itemIdx}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={idx}>{trimmed}</p>;
      })}
    </div>
  );
}

export default SafeHtmlRenderer;
