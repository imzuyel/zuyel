"use client";

import React, { useState } from "react";
import {
  Lock,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Heart,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  GraduationCap,
  User,
  KeyRound,
  ArrowRight
} from "lucide-react";
import { Role, PRESET_USERS } from "@/context/AuthContext";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: Role) => void;
  reason?: string;
}

export default function LoginRequiredModal({
  isOpen,
  onClose,
  onLoginSuccess,
  reason = "লাইক, কমেন্ট, লাভ রিঅ্যাকশন বা মতামত প্রদান করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করা আবশ্যক।"
}: LoginRequiredModalProps) {
  const [activeTab, setActiveTab] = useState<"quick" | "form">("quick");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickLogin = (role: Role) => {
    onLoginSuccess(role);
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setFeedbackMessage("অনুগ্রহ করে আপনার আইডি বা ইউজারনেম প্রদান করুন।");
      return;
    }
    onLoginSuccess(selectedRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-500/30 shadow-2xl w-full max-w-lg overflow-hidden my-auto flex flex-col relative text-slate-900 dark:text-slate-100">
        
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                <span>অ্যাকশন লকড (Action Locked)</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              <span>লগইন আবশ্যক (Login Required)</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">

          {/* Action Reason Notice Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100">
                কেন লগইন প্রয়োজন?
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {reason}
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-bold text-indigo-600 dark:text-cyan-400">
                <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> লাইক</span>
                <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> আনলাইক</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> হার্ট</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> কমেন্ট</span>
              </div>
            </div>
          </div>

          {/* Login Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("quick")}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "quick"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>এক-ক্লিকে লগইন (Quick Role)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "form"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>ইউজার পাসওয়ার্ড ফর্ম</span>
            </button>
          </div>

          {/* Quick One-Click Login Roles */}
          {activeTab === "quick" ? (
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                আপনার অ্যাকাউন্ট নির্বাচন করুন:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    role: "student" as Role,
                    title: "শিক্ষার্থী (Student)",
                    name: PRESET_USERS.student.nameBangla,
                    desc: PRESET_USERS.student.designation,
                    color: "border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400"
                  },
                  {
                    role: "teacher" as Role,
                    title: "শিক্ষক (Teacher)",
                    name: PRESET_USERS.teacher.nameBangla,
                    desc: PRESET_USERS.teacher.designation,
                    color: "border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400"
                  },
                  {
                    role: "guardian" as Role,
                    title: "অভিভাবক (Guardian)",
                    name: PRESET_USERS.guardian.nameBangla,
                    desc: PRESET_USERS.guardian.designation,
                    color: "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400"
                  },
                  {
                    role: "principal" as Role,
                    title: "অধ্যক্ষ / অ্যাডমিন",
                    name: PRESET_USERS.principal.nameBangla,
                    desc: PRESET_USERS.principal.designation,
                    color: "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400"
                  }
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleQuickLogin(item.role)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 hover:scale-[1.02] ${item.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/60 border border-white/10">
                        {item.title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900 dark:text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Standard User Form */
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {feedbackMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                  {feedbackMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-black block">ভূমিকা নির্বাচন:</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="student">শিক্ষার্থী (Student)</option>
                  <option value="teacher">শিক্ষক (Teacher)</option>
                  <option value="guardian">অভিভাবক (Guardian/Parent)</option>
                  <option value="admin">সিস্টেম অ্যাডমিন (System Admin)</option>
                  <option value="principal">অধ্যক্ষ (Principal)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black block">আইডি / ইমেইল / মোবাইল:</label>
                <input
                  type="text"
                  placeholder="আপনার আইডি বা ইমেইল লিখুন"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black block">পাসওয়ার্ড:</label>
                <input
                  type="password"
                  placeholder="পাসওয়ার্ড লিখুন"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>লগইন নিশ্চিত করুন</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
