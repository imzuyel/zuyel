"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { CalloutBlock, CalloutType } from "@/lib/tiptapCalloutExtension";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Highlighter,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  BookmarkCheck,
  Sparkles,
  HelpCircle,
  FileText,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "ব্লগ বা পাঠের বিস্তারিত বিষয়বস্তু এখানে লিখুন...",
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CalloutBlock,
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none min-h-[180px] p-4 focus:outline-none text-sm text-slate-800 dark:text-slate-100",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep content in sync if parent resets or loads asynchronously
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHtml = editor.getHTML();
      if (content !== currentHtml && (content !== "" || currentHtml !== "<p></p>")) {
        editor.commands.setContent(content || "");
      }
    }
  }, [content, editor]);

  // Insert predefined beautifully styled Callout Box/Block
  const insertCalloutBlock = (type: CalloutType) => {
    if (!editor) return;

    const templates: Record<CalloutType, { title: string; placeholder: string }> = {
      summary: {
        title: "📌 সারসংক্ষেপ (Summary)",
        placeholder: "এই পাঠের মূল বিষয়বস্তুর সারসংক্ষেপ এখানে লিখুন...",
      },
      keypoints: {
        title: "✨ গুরুত্বপূর্ণ পয়েন্টসমূহ (Key Points)",
        placeholder: "১. প্রথম মূল বিষয় বা টেকনিক্যাল তথ্য\n২. দ্বিতীয় মূল বিষয় বা সতর্কতা\n৩. ব্যবহারিক প্রয়োগ",
      },
      questions: {
        title: "❓ গুরুত্বপূর্ণ প্রশ্নসমূহ (Important Questions)",
        placeholder: "প্রশ্ন ১: এই পাঠ থেকে প্রধান সম্ভাব্য প্রশ্ন কী?\nউত্তর: এখানে শিক্ষার্থীদের জন্য সুস্পষ্ট দিকনির্দেশনা লিখুন।",
      },
    };

    const tpl = templates[type];
    const htmlSnippet = `<div data-callout-type="${type}" class="callout-block callout-${type}"><p class="callout-header"><strong>${tpl.title}</strong></p><p>${tpl.placeholder.replace(/\n/g, "<br/>")}</p></div><p></p>`;

    editor.chain().focus().insertContent(htmlSnippet).run();
  };

  if (!editor) {
    return (
      <div className="min-h-[220px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 animate-pulse flex items-center justify-center text-xs text-slate-400">
        রিচ টেক্সট এডিটর লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/60 ${className}`}
    >
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            editor.isActive("heading", { level: 1 })
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60"
          }`}
          title="Heading 1 (বড় শিরোনাম)"
        >
          <Heading1 className="w-4 h-4" />
          <span className="text-[10px]">H1</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            editor.isActive("heading", { level: 2 })
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60"
          }`}
          title="Heading 2 (উপ-শিরোনাম)"
        >
          <Heading2 className="w-4 h-4" />
          <span className="text-[10px]">H2</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Text Styles */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            editor.isActive("bold")
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60"
          }`}
          title="Bold (গাঢ় অক্ষর)"
        >
          <Bold className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            editor.isActive("italic")
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60"
          }`}
          title="Italic (তির্যক অক্ষর)"
        >
          <Italic className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Highlight */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            editor.isActive("highlight")
              ? "bg-amber-400 text-slate-950 font-bold shadow-xs"
              : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          }`}
          title="Highlight (গুরুত্বপূর্ণ টেক্সট হাইলাইট)"
        >
          <Highlighter className="w-4 h-4" />
          <span className="text-[10px] font-semibold hidden sm:inline">হাইলাইট</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            editor.isActive("bulletList")
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60"
          }`}
          title="Bullet List (বুলেট তালিকা)"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            editor.isActive("orderedList")
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60"
          }`}
          title="Numbered List (ক্রমিক সংখ্যা তালিকা)"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            editor.isActive("blockquote")
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60"
          }`}
          title="Quote (উদ্ধৃতি)"
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            editor.isActive("codeBlock")
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60"
          }`}
          title="Code Block (কোড ব্লক)"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Custom Structured Callout Templates */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertCalloutBlock("summary")}
            className="p-1 px-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/80 text-[11px] font-bold shadow-2xs"
            title="সারসংক্ষেপ কলআউট বক্স সন্নিবেশ করুন"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>সারসংক্ষেপ</span>
          </button>

          <button
            type="button"
            onClick={() => insertCalloutBlock("keypoints")}
            className="p-1 px-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300/80 dark:border-indigo-800/80 text-[11px] font-bold shadow-2xs"
            title="গুরুত্বপূর্ণ পয়েন্টসমূহ কলআউট বক্স সন্নিবেশ করুন"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>মূল পয়েন্ট</span>
          </button>

          <button
            type="button"
            onClick={() => insertCalloutBlock("questions")}
            className="p-1 px-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/80 text-[11px] font-bold shadow-2xs"
            title="গুরুত্বপূর্ণ প্রশ্নসমূহ কলআউট বক্স সন্নিবেশ করুন"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>গুরুত্বপূর্ণ প্রশ্ন</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Content Surface */}
      <EditorContent editor={editor} />
    </div>
  );
}
export default RichTextEditor;
