"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Play,
  ShieldCheck,
  Search,
  Eye,
  Lock,
  Globe,
  Settings2,
} from "lucide-react";
import { toBengaliNumerals } from "@/lib/utils";
import { ACADEMIC_CLASSES } from "@/lib/academicStructure";

export default function ResultLifecycleManager() {
  const [loading, setLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>("1");
  const [selectedClassId, setSelectedClassId] = useState<string>("4");
  const [academicYear] = useState(2026);
  
  const [validationResult, setValidationResult] = useState<any>(null);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [step, setStep] = useState<"select" | "validate" | "generate" | "review">("select");

  const exams = [
    { id: 1, name: "অর্ধবার্ষিক মূল্যায়ন ২০২৬" },
    { id: 2, name: "বার্ষিক মূল্যায়ন ২০২৬" },
  ];

  const handleValidate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/results/calculate", {
        method: "POST",
        body: JSON.stringify({
          action: "validate",
          examId: selectedExamId,
          classId: selectedClassId,
          academicYear,
        }),
      });
      const data = await res.json();
      setValidationResult(data);
      if (data.success) {
        setStep("validate");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/results/calculate", {
        method: "POST",
        body: JSON.stringify({
          action: "generate",
          examId: selectedExamId,
          classId: selectedClassId,
          academicYear,
        }),
      });
      const data = await res.json();
      setGenerationResult(data);
      if (data.success) {
        setStep("review");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
      setLoading(true);
      try {
          const res = await fetch("/api/results/calculate", {
              method: "POST",
              body: JSON.stringify({
                  action: "publish",
                  examId: selectedExamId,
                  classId: selectedClassId,
              }),
          });
          const data = await res.json();
          if (data.success) {
              alert("ফলাফল সফলভাবে প্রকাশিত হয়েছে।");
              handleGenerate(); // refresh
          }
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const handleLock = async () => {
    if (!confirm("একবার লক করলে সাধারণ পরিবর্তন বন্ধ হয়ে যাবে। আপনি কি নিশ্চিত?")) return;
    setLoading(true);
    try {
        const res = await fetch("/api/results/calculate", {
            method: "POST",
            body: JSON.stringify({
                action: "lock",
                examId: selectedExamId,
                classId: selectedClassId,
            }),
        });
        const data = await res.json();
        if (data.success) {
            alert("ফলাফল সফলভাবে লক করা হয়েছে।");
            handleGenerate(); // refresh
        }
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                System Workflow
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Result Lifecycle & Governance</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              ফলাফল জেনারেশন ও লাইফসাইকেল ম্যানেজমেন্ট
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              পরীক্ষার নম্বরসমূহ যাচাইপূর্বক ফলাফল ক্যালকুলেশন, মেধা তালিকা প্রণয়ন ও অফিসিয়াল প্রকাশনা।
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${step === (["select", "validate", "generate", "review"][i-1]) ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                        {i}
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Config & Selection */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-600" />
              প্রসেস কনফিগারেশন
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">পরীক্ষা নির্বাচন করুন</label>
                <select 
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">শ্রেণি নির্বাচন করুন</label>
                <select 
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  {ACADEMIC_CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleValidate}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  ভ্যালিডেশন রান করুন
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl">
             <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2">
               <ShieldCheck className="w-4 h-4" />
               নিরাপত্তা নীতিমালা
             </h4>
             <ul className="text-xs space-y-2 text-slate-300">
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                 ফলাফল জেনারেট করার পূর্বে অবশ্যই সকল বিষয়ের নম্বর এন্ট্রি নিশ্চিত করুন।
               </li>
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                 ফলাফল লক (Locked) অবস্থায় কোনো নম্বর পরিবর্তন করা যাবে না।
               </li>
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                 পাবলিশ করার পর শিক্ষার্থীরা তাদের ড্যাশবোর্ডে ফলাফল দেখতে পারবে।
               </li>
             </ul>
          </div>
        </div>

        {/* Right Column: Execution & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 2: Validation Result */}
          {validationResult && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ভ্যালিডেশন রিপোর্ট
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${validationResult.status === 'success' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                  {validationResult.status === 'success' ? 'PASSED' : 'ATTENTION REQUIRED'}
                </span>
              </div>
              <div className="p-5 space-y-3">
                {validationResult.messages.map((m: string, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${validationResult.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                    {validationResult.status === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                    <p className="text-sm font-medium">{m}</p>
                  </div>
                ))}

                {validationResult.status !== 'error' && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                      ফলাফল জেনারেট (ক্যালকুলেশন) করুন
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Generation/Review */}
          {generationResult && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        ফলাফল ক্যালকুলেশন প্রিভিউ
                    </h3>
                    <div className="flex gap-2">
                        <button className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition shadow-xs">
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">শিক্ষার্থী</th>
                                <th className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">রোল</th>
                                <th className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">মোট নম্বর</th>
                                <th className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">GPA</th>
                                <th className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">গ্রেড</th>
                                <th className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 text-center">অবস্থা</th>
                                <th className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 text-center">মেধা</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {generationResult.results.map((r: any) => (
                                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-950/50 transition-colors">
                                    <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">{r.studentName}</td>
                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400 font-mono">{toBengaliNumerals(r.roll)}</td>
                                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-300">{toBengaliNumerals(r.totalMarks)}</td>
                                    <td className="px-5 py-3 font-bold text-indigo-600">{toBengaliNumerals(r.gpa.toFixed(2))}</td>
                                    <td className="px-5 py-3 font-black text-slate-900 dark:text-slate-100">{r.letterGrade}</td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.resultStatus === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {r.resultStatus === 'Passed' ? 'পাস' : 'ফেইল'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center font-bold text-amber-600">
                                        {r.meritPosition ? toBengaliNumerals(r.meritPosition) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        * এটি একটি ড্রাফট প্রিভিউ। মেধা তালিকা ও জিপিএ চূড়ান্ত করার আগে পুনরায় যাচাই করুন।
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleLock}
                            disabled={loading}
                            className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 px-5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Lock className="w-4 h-4" />
                            ফাইনাল লক করুন
                        </button>
                        <button 
                            onClick={handlePublish}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Globe className="w-4 h-4" />
                            রেজাল্ট পাবলিশ করুন
                        </button>
                    </div>
                </div>
            </div>
          )}

          {!validationResult && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mb-6">
                      <Search className="w-10 h-10 text-slate-300" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-400">কোনো ভ্যালিডেশন রিপোর্ট নেই</h4>
                  <p className="text-slate-400 text-sm max-w-xs mt-2 leading-relaxed">
                      বামে শ্রেণি ও পরীক্ষা নির্বাচন করে "ভ্যালিডেশন রান করুন" বাটনে ক্লিক করে প্রসেস শুরু করুন।
                  </p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
