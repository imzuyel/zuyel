"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  User,
  LogOut,
  Lock,
  Trophy,
  Layers,
  Flame,
} from "lucide-react";
import SequentialLearningPathView from "./SequentialLearningPathView";
import StudentAiChatWidget from "./StudentAiChatWidget";
import StudentProgressDashboard from "./StudentProgressDashboard";
import StudentLearningLeaderboard from "./StudentLearningLeaderboard";
import StudentLoginModal from "@/components/auth/StudentLoginModal";
import StudentProfileView from "./StudentProfileView";
import {
  getActiveStudentAccount,
  logoutStudentAccount,
  StudentAuthAccount,
} from "@/lib/studentIntelligenceStore";

export default function StudentLearningHub() {
  // Navigation tab: 'learning_path' | 'progress' | 'leaderboard' | 'profile'
  const [activeTab, setActiveTab] = useState<"learning_path" | "progress" | "leaderboard" | "profile">("learning_path");

  // Active Logged In Student Account state
  const [activeStudent, setActiveStudent] = useState<StudentAuthAccount | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    setActiveStudent(getActiveStudentAccount());

    const handleAuthEvent = () => {
      setActiveStudent(getActiveStudentAccount());
    };

    window.addEventListener("ptsc_student_auth_changed", handleAuthEvent);
    window.addEventListener("ptsc_student_logout", handleAuthEvent);
    return () => {
      window.removeEventListener("ptsc_student_auth_changed", handleAuthEvent);
      window.removeEventListener("ptsc_student_logout", handleAuthEvent);
    };
  }, []);

  const handleLogout = () => {
    logoutStudentAccount();
    setActiveStudent(null);
    if (activeTab === "profile") {
      setActiveTab("learning_path");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-cyan-300 text-xs font-black tracking-wider uppercase">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>PTSC Smart ERP Student Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3">
              <BookOpen className="w-8 h-8 text-emerald-400 shrink-0" />
              <span>শিক্ষার্থী লার্নিং হাব: সোলোলার্ন পাথ ও কুইজ</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের স্লাইডভিত্তিক লার্নিং পাথ, স্টেপ-বাই-স্টেপ প্র্যাকটিস কুইজ, দুর্বল টপিক ট্র্যাকিং এবং লিডারবোর্ড।
            </p>
          </div>

          {/* Student Login / Account Button Bar */}
          <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-indigo-500/30 space-y-2 shrink-0 w-full md:w-auto text-center">
            {activeStudent ? (
              <div className="space-y-2">
                <div className="text-xs text-indigo-200 font-bold">
                  স্বাগতম, <strong className="text-white">{activeStudent.studentName}</strong>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 border border-rose-800/50 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>লগআউট করুন</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-amber-300 font-bold">
                  কুইজ স্কোর ও প্রোগ্রেস ক্লাউডে সেভ রাখতে:
                </p>
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>লগইন / পাসওয়ার্ড সেটআপ</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("learning_path")}
          className={`px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "learning_path"
              ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/30"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-300" />
          <span>🚀 SoloLearn লার্নিং পাথ</span>
        </button>

        <button
          onClick={() => setActiveTab("progress")}
          className={`px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "progress"
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Flame className="w-4 h-4 fill-current text-amber-500" />
          <span>🔥 আমার অগ্রগতি ও লার্নিং স্ট্রিক</span>
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "leaderboard"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>🏆 মেধা তালিকা ও লিডারবোর্ড</span>
        </button>

        <button
          onClick={() => {
            if (!activeStudent) {
              setLoginModalOpen(true);
            } else {
              setActiveTab("profile");
            }
          }}
          className={`px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "profile"
              ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <User className="w-4 h-4 text-cyan-400" />
          <span>👤 আমার প্রোফাইল {activeStudent ? `(${activeStudent.studentName})` : ""}</span>
        </button>
      </div>

      {/* TAB CONTENT: Sequential Chapter Learning Path */}
      {activeTab === "learning_path" && <SequentialLearningPathView />}

      {/* TAB CONTENT: Progress Dashboard */}
      {activeTab === "progress" && <StudentProgressDashboard />}

      {/* TAB CONTENT: Student Merit Leaderboard */}
      {activeTab === "leaderboard" && (
        <StudentLearningLeaderboard onOpenLoginModal={() => setLoginModalOpen(true)} />
      )}

      {/* TAB CONTENT: Student Profile View */}
      {activeTab === "profile" && activeStudent && (
        <StudentProfileView
          account={activeStudent}
          onLogout={() => {
            handleLogout();
            setActiveTab("learning_path");
          }}
        />
      )}

      {/* Student Login Modal */}
      {loginModalOpen && (
        <StudentLoginModal
          onClose={() => setLoginModalOpen(false)}
          onSuccessLogin={(acc) => setActiveStudent(acc)}
        />
      )}

      <StudentAiChatWidget currentLessonTitle="PTSC Student Learning Hub" />
    </div>
  );
}
