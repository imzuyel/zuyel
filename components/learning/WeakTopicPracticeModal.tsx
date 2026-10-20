"use client";

import React, { useState } from "react";
import {
  Zap,
  Target,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  Award,
  ArrowRight,
  Flame,
} from "lucide-react";
import {
  getWeakTopics,
  clearWeakTopic,
  WeakTopicItem,
  StudentQuizQuestion,
  getActiveStudentAccount,
} from "@/lib/studentIntelligenceStore";

interface WeakTopicPracticeModalProps {
  onClose: () => void;
  onRefreshStats?: () => void;
}

export default function WeakTopicPracticeModal({
  onClose,
  onRefreshStats,
}: WeakTopicPracticeModalProps) {
  const activeStudent = getActiveStudentAccount();
  const weakTopics = getWeakTopics(activeStudent?.rollNumber);

  // Compile targeted questions based on the student's weak topics
  const targetedQuestions: StudentQuizQuestion[] = React.useMemo(() => {
    if (weakTopics.length === 0) return [];

    const compiled: StudentQuizQuestion[] = [];

    weakTopics.forEach((wt, idx) => {
      if (wt.topicName.includes("ওহমের সূত্র") || wt.topicName.includes("গাণিতিক")) {
        compiled.push({
          id: `wt-${idx}-1`,
          questionText: `[দূর্বল বিষয় টার্গেটেড] ২০০ ওহম রেজিস্ট্যান্সের সার্কিটে ২২ ভোল্ট থাকলে কারেন্ট কত হবে?`,
          options: ["০.১১ অ্যাম্পিয়ার (0.11 A)", "৪.৪ অ্যাম্পিয়ার", "২২০ অ্যাম্পিয়ার", "১.১ অ্যাম্পিয়ার"],
          correctAnswerIndex: 0,
          explanation: "I = V / R = 22 / 200 = 0.11 A। ভোল্টেজ ও রেজিস্ট্যান্সের সঠিক একক বসানো জরুরি।",
          conceptTopic: wt.topicName,
        });
      } else if (wt.topicName.includes("CMOS") || wt.topicName.includes("বায়োস")) {
        compiled.push({
          id: `wt-${idx}-2`,
          questionText: `[দূর্বল বিষয় টার্গেটেড] কম্পিউটার প্রতিবার চালুর সময় টাইম ও ডেট ভুল দেখালে মাদারবোর্ডে কী পরিবর্তন করা উচিত?`,
          options: ["CMOS ব্যাটারি (CR2032)", "মেমোরি স্লট", "পাওয়ার সাপ্লাই কেবল", "হার্ডড্রাইভ"],
          correctAnswerIndex: 0,
          explanation: "CR2032 CMOS ব্যাটারি ৩.৩ ভোল্ট মেমোরি পাওয়ার সরবরাহ করে যা টাইম-ডেট ধরে রাখে।",
          conceptTopic: wt.topicName,
        });
      } else if (wt.topicName.includes("৪-স্ট্রোক") || wt.topicName.includes("Power")) {
        compiled.push({
          id: `wt-${idx}-3`,
          questionText: `[দূর্বল বিষয় টার্গেটেড] অটোমোবাইল ইঞ্জিনে স্পার্ক প্লাগ কখন স্পার্ক উৎপন্ন করে?`,
          options: ["Compression Stroke-এর শেষে (Power Stroke-এর শুরুতে)", "Suction Stroke-এর শুরুতে", "Exhaust Stroke-এর শেষে", "ইঞ্জিন বন্ধ করার সময়"],
          correctAnswerIndex: 0,
          explanation: "কম্প্রেশন স্ট্রোকে গ্যাস সংকুচিত হলে স্পার্ক দিয়ে বিস্ফোরণ ঘটিয়ে পাওয়ার পাওয়া যায়।",
          conceptTopic: wt.topicName,
        });
      } else {
        compiled.push({
          id: `wt-${idx}-gen`,
          questionText: `[টার্গেটেড স্পেশাল রিভিশন] '${wt.topicName}' ধারণায় কীভাবে প্রস্তুতি শক্তিশালী করবেন?`,
          options: [
            "মূল সুত্র ও স্লাইডের প্রয়োগগুলো খাতায় লিখে অনুশীলন করা",
            "শুধুমাত্র রিভিশন না দিয়ে পরীক্ষা দেওয়া",
            "কেবল মাত্র মুখস্থ করা",
            "কাজের আগে প্র্যাক্টিক্যাল এড়িয়ে চলা",
          ],
          correctAnswerIndex: 0,
          explanation: "কারিগরি শিক্ষার যেকোনো চিহ্নিত দুর্বল বিষয়ে হ্যান্ডস-অন খাতায় নোট ও প্র্যাকটিস সর্বোচ্চ কার্যকর।",
          conceptTopic: wt.topicName,
        });
      }
    });

    return compiled;
  }, [weakTopics]);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    let calcScore = 0;
    targetedQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        calcScore += 1;
        // Clear or decrease weak topic
        clearWeakTopic(q.conceptTopic, activeStudent?.rollNumber);
      }
    });

    setScore(calcScore);
    setSubmitted(true);
    if (onRefreshStats) onRefreshStats();
  };

  if (weakTopics.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl">
            🎉
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            কোনো চিহ্নিত দুর্বল টপিক নেই!
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            অভিনন্দন! আপনার পূর্বে ভুল হওয়া সকল বিষয় আপনি সফলভাবে আয়ত্ত করেছেন। নতুন কোনো পাঠের কুইজ অংশ নিয়ে আপনার প্রস্তুতি যাচাই করুন।
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 cursor-pointer"
          >
            ধন্যবাদ, ঠিক আছে
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/40 shadow-2xl w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-amber-500/30 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                TARGETED WEAK TOPICS PRACTICE
              </span>
              <span className="text-xs text-amber-300 font-mono">
                {weakTopics.length} টি বিষয় চিহ্নিত
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-white">
              চিহ্নিত দুর্বল টপিকের ওপর টার্গেটেড মিনি-কুইজ
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          
          {/* Weak topics overview list */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>আপনার পূর্বে মিস হওয়া নির্দিষ্ট টপিকসমূহ:</span>
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              {weakTopics.map((wt) => (
                <span
                  key={wt.topicName}
                  className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-300 dark:border-amber-700"
                >
                  ⚠️ {wt.topicName} ({wt.missedCount} বার মিস)
                </span>
              ))}
            </div>
          </div>

          {!submitted ? (
            <div className="space-y-6">
              {targetedQuestions.map((q, qIdx) => {
                const selectedOption = selectedAnswers[qIdx];

                return (
                  <div
                    key={q.id}
                    className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          {q.questionText}
                        </h3>
                        <span className="inline-block text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-slate-900 px-2 py-0.5 rounded-md mt-1">
                          টার্গেটেড কনসেপ্ট: {q.conceptTopic}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedOption === optIdx;

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`p-3.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-3 cursor-pointer ${
                              isSelected
                                ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-md shadow-amber-500/20 scale-[1.01]"
                                : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="p-8 rounded-3xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-emerald-950 text-white border border-emerald-500/30 space-y-4 shadow-xl">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl">
                  🌟
                </div>
                <h3 className="text-2xl font-black">
                  টার্গেটেড প্র্যাকটিস সম্পন্ন! ({score}/{targetedQuestions.length})
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  যেসব প্রশ্নের সঠিক উত্তর আপনি দিয়েছেন, সেগুলোর দূর্বলতা সংকেত অপসারিত হয়েছে এবং আপনার লার্নিং ড্যাশবোর্ড আপডেট করা হয়েছে!
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          {!submitted ? (
            <div className="flex justify-between w-full">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleSubmit}
                disabled={Object.keys(selectedAnswers).length === 0}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                <span>মূল্যায়ন জমা দিন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
            >
              ড্যাশবোর্ডে ফিরে যান
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
