"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Play,
  Settings2,
  ChevronRight,
  UserCheck,
  UserX,
  Repeat,
  Download,
  FileText,
  Save,
  Lock,
  Layers,
  Briefcase,
} from "lucide-react";
import { toBengaliNumerals } from "@/lib/utils";
import { ACADEMIC_CLASSES } from "@/lib/academicStructure";

type LifecycleTab = "rollover" | "section" | "trade" | "status";

export default function StudentLifecycleDashboard() {
  const [activeTab, setActiveTab] = useState<LifecycleTab>("rollover");
  const [loading, setLoading] = useState(false);
  const [sourceYear, setSourceYear] = useState(2026);
  const [targetYear, setTargetYear] = useState(2027);
  
  // Selection state
  const [selectedClassId, setSelectedClassId] = useState<string>("4"); // Class 9
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  const handleFetchPreview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students/rollover", {
        method: "POST",
        body: JSON.stringify({
          action: "preview",
          sourceYear,
          targetYear,
          studentIds: null, // all students of that class in that year
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewData(data.stats);
        // Default select all eligible
        // (In a real app, you'd filter by the selected class)
        setSelectedStudentIds([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRollover = async () => {
    if (selectedStudentIds.length === 0) {
      alert("অন্তত একজন শিক্ষার্থী নির্বাচন করুন।");
      return;
    }

    if (!confirm(`${selectedStudentIds.length} জন শিক্ষার্থীর রোলওভার নিশ্চিত করছেন?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/students/rollover", {
        method: "POST",
        body: JSON.stringify({
          action: "execute",
          sourceYear,
          targetYear,
          studentIds: selectedStudentIds,
          classMappings: {
            "4": 5, // Class 9 -> Class 10
            "1": 2, // 6 -> 7
            "2": 3, // 7 -> 8
            "3": 4, // 8 -> 9
            "5": 6, // 10 -> 11
          },
          performedBy: "Admin",
          options: { sectionAssignment: "preserve", tradeAssignment: "preserve" }
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        handleFetchPreview();
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                Academic Operations
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lifecycle & Governance Hub</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">শিক্ষার্থী একাডেমিক লাইফসাইকেল ম্যানেজমেন্ট</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">শিক্ষাবর্ষ পরিবর্তন, প্রমোশন, শাখা পরিবর্তন ও ট্রান্সফার সংক্রান্ত কার্যাবলী।</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition">
              <Settings2 className="w-4 h-4" />
              নীতিমালা সেটআপ
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-8 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("rollover")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${activeTab === "rollover" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            <RefreshCw className="w-4 h-4" />
            শিক্ষাবর্ষ রোলওভার
          </button>
          <button
            onClick={() => setActiveTab("section")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${activeTab === "section" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            <Layers className="w-4 h-4" />
            শাখা পরিবর্তন
          </button>
          <button
            onClick={() => setActiveTab("trade")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${activeTab === "trade" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            <Briefcase className="w-4 h-4" />
            ট্রেড পরিবর্তন
          </button>
          <button
            onClick={() => setActiveTab("status")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${activeTab === "status" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            <Repeat className="w-4 h-4" />
            ট্রান্সফার ও স্ট্যাটাস
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              ফিল্টার ও প্যারামিটার
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">বর্তমান শিক্ষাবর্ষ</label>
                <select 
                  value={sourceYear}
                  onChange={(e) => setSourceYear(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                >
                  <option value={2025}>২০২৫</option>
                  <option value={2026}>২০২৬</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">টার্গেট শিক্ষাবর্ষ</label>
                <select 
                  value={targetYear}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                >
                  <option value={2026}>২০২৬</option>
                  <option value={2027}>২০২৭</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">উৎস শ্রেণি</label>
                <select 
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                >
                  {ACADEMIC_CLASSES.map(c => <option key={c.id} value={c.id}>{c.nameBangla}</option>)}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={handleFetchPreview}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  প্রিভিউ জেনারেট করুন
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl">
             <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2">
               <ShieldCheck className="w-4 h-4" />
               সিস্টেম পলিসি
             </h4>
             <ul className="text-xs space-y-2 text-slate-300">
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                 প্রমোশন সম্পন্ন হলে আগের শিক্ষাবর্ষের ডাটাবেজ অপরিবর্তিত থাকবে।
               </li>
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                 ফেল করা শিক্ষার্থীদের পুনরায় একই শ্রেণিতে ভর্তি করা যাবে।
               </li>
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                 আইডি পরিবর্তন না করে কেবলমাত্র ক্লাস ও শাখা আপডেট হবে।
               </li>
             </ul>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-3 space-y-6">
          {previewData ? (
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">মোট শিক্ষার্থী</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{toBengaliNumerals(previewData.total)}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                  <p className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-wider">প্রমোশন যোগ্য</p>
                  <p className="text-2xl font-black text-emerald-700">{toBengaliNumerals(previewData.eligible)}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-100 shadow-sm">
                  <p className="text-xs font-bold text-amber-600 mb-1 uppercase tracking-wider">ম্যানুয়াল রিভিউ</p>
                  <p className="text-2xl font-black text-amber-700">{toBengaliNumerals(previewData.pending)}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-100 shadow-sm">
                  <p className="text-xs font-bold text-rose-600 mb-1 uppercase tracking-wider">অযোগ্য/ফেইল</p>
                  <p className="text-2xl font-black text-rose-700">{toBengaliNumerals(previewData.notEligible)}</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    শিক্ষার্থী তালিকা ও প্রমোশন স্ট্যাটাস
                  </h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedStudentIds(previewData.previews.filter((p: any) => p.status === 'Eligible').map((p: any) => p.studentId))}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      সিলেক্ট যোগ্য সব
                    </button>
                    <button 
                      onClick={() => setSelectedStudentIds([])}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      ক্লিয়ার সিলেকশন
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 w-10">
                          <input 
                            type="checkbox" 
                            checked={selectedStudentIds.length === previewData.previews.length && previewData.previews.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStudentIds(previewData.previews.map((p: any) => p.studentId));
                              else setSelectedStudentIds([]);
                            }}
                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" 
                          />
                        </th>
                        <th className="px-6 py-4">শিক্ষার্থী</th>
                        <th className="px-6 py-4">রোল</th>
                        <th className="px-6 py-4">GPA/Result</th>
                        <th className="px-6 py-4">যোগ্যতা</th>
                        <th className="px-6 py-4">মন্তব্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {previewData.previews.map((p: any) => (
                        <tr key={p.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-950/50 transition-colors">
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              checked={selectedStudentIds.includes(p.studentId)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, p.studentId]);
                                else setSelectedStudentIds(selectedStudentIds.filter(id => id !== p.studentId));
                              }}
                              className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" 
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{p.studentId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono">{toBengaliNumerals(p.roll)}</td>
                          <td className="px-6 py-4">
                            {p.metrics ? (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-600">{toBengaliNumerals(p.metrics.gpa || 0)}</span>
                                <span className="text-slate-300">|</span>
                                <span className={`text-[10px] font-bold ${p.metrics.failed > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {p.metrics.failed > 0 ? `${toBengaliNumerals(p.metrics.failed)}টি ফেল` : 'সব পাস'}
                                </span>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              p.status === 'Eligible' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              p.status === 'Pending Result' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              'bg-rose-100 text-rose-700 border-rose-200'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 italic max-w-[150px] truncate" title={p.reason}>
                            {p.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    নির্বাচিত: <span className="font-bold text-indigo-600">{toBengaliNumerals(selectedStudentIds.length)}</span> জন শিক্ষার্থী
                  </p>
                  <div className="flex gap-3">
                    <button className="px-5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                      রিপোর্ট ডাউনলোড (Excel)
                    </button>
                    <button 
                      onClick={handleExecuteRollover}
                      disabled={loading || selectedStudentIds.length === 0}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      সিলেক্টেড রোলওভার সম্পন্ন করুন
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h4 className="text-xl font-bold text-slate-400">কোনো প্রিভিউ জেনারেট করা নেই</h4>
              <p className="text-slate-400 text-sm max-w-xs mt-2 leading-relaxed">
                বামে বর্তমান ও টার্গেট শিক্ষাবর্ষ এবং শ্রেণি নির্বাচন করে "প্রিভিউ জেনারেট করুন" বাটনে ক্লিক করুন।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
