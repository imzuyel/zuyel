"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  Bot,
  FileText,
  Radio,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function AiQuizSidebarSection() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const isLinkActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/learning") return pathname.startsWith("/learning");
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <aside className="bg-slate-950 text-slate-200 h-screen max-h-screen sticky top-0 w-64 border-r border-slate-800 flex flex-col p-4 select-none font-sans shrink-0 overflow-hidden">
      {/* Brand Header */}
      <div className="shrink-0 flex items-center gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-cyan-500/25">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-black text-white text-sm tracking-tight">PTSC ERP</h1>
          <p className="text-[10px] text-slate-400 font-medium">Institutional Management</p>
        </div>
      </div>

      {/* Navigation Section Container */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs font-bold">
        {/* Dashboard Link */}
        <Link
          href="/admin"
          className={`px-3 py-2.5 rounded-xl transition flex items-center gap-3 group ${
            isLinkActive("/admin")
              ? "bg-slate-900 text-cyan-400 border border-slate-800"
              : "text-slate-300 hover:text-white hover:bg-slate-900"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition" />
          <span>Dashboard</span>
        </Link>

        {/* AI Quiz & PDF Manager Parent Category with Collapsible Dropdown */}
        <div className="space-y-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-900 transition flex items-center justify-between group border border-slate-800/80"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition" />
              <span>AI Quiz & PDF Manager</span>
            </div>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition" />
            )}
          </button>

          {/* Sub-links */}
          {isOpen && (
            <div className="pl-7 space-y-1.5 border-l border-slate-800 ml-4 my-1 pt-1">
              <Link
                href="/ai/generator"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition group ${
                  isLinkActive("/ai/generator")
                    ? "bg-purple-950/50 text-purple-300 font-bold border border-purple-800/50"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-300 transition" />
                <span>AI Question Generator</span>
              </Link>

              <Link
                href="/ai/pdf-manager"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition group ${
                  isLinkActive("/ai/pdf-manager")
                    ? "bg-cyan-950/50 text-cyan-300 font-bold border border-cyan-800/50"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 transition" />
                <span>PDF Repository & Bank</span>
              </Link>

              <Link
                href="/live-quizzes"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition group ${
                  isLinkActive("/live-quizzes")
                    ? "bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-800/50"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300 transition" />
                <span>Live Quiz & Pin Lobby</span>
              </Link>

              <Link
                href="/learning"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition group ${
                  isLinkActive("/learning")
                    ? "bg-cyan-950/50 text-cyan-300 font-bold border border-cyan-800/50"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 transition" />
                <span>অধ্যায়ভিত্তিক লার্নিং হাব</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="shrink-0 mt-auto pt-3 border-t border-slate-800 text-[10px] text-slate-400 text-center font-medium">
        পঞ্চগড় সরকারি টিএসসি • অনলাইন সিস্টেম
      </div>
    </aside>
  );
}
