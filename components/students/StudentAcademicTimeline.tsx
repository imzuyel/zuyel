"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  RefreshCw,
  AlertTriangle,
  History as HistoryIcon,
  GraduationCap,
  Briefcase,
  UserCheck,
  UserX,
  Repeat,
  ExternalLink,
  Award,
} from "lucide-react";
import { StudentAcademicPlacement, StudentLifecycleEvent } from "@/lib/database";
import { toBengaliNumerals } from "@/lib/utils";

interface StudentAcademicTimelineProps {
  studentId: number;
}

export default function StudentAcademicTimeline({ studentId }: StudentAcademicTimelineProps) {
  const [history, setHistory] = useState<StudentAcademicPlacement[]>([]);
  const [events, setEvents] = useState<StudentLifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/students/lifecycle?studentId=${studentId}`);
        const data = await res.json();
        if (data.success) {
          setHistory(data.history || []);
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error("Failed to fetch student lifecycle data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">একাডেমিক হিস্ট্রি লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Academic Placement History (Vertical Stepper) */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">একাডেমিক প্লেসমেন্ট ইতিহাস</h3>
        </div>

        <div className="relative border-l-2 border-indigo-100 ml-4 pl-8 space-y-8">
          {history.length > 0 ? history.map((p, idx) => (
            <div key={p.id} className="relative">
              {/* Dot */}
              <div className={`absolute -left-[41px] w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${p.isCurrent ? "bg-indigo-600 animate-pulse" : "bg-slate-300"}`}>
                {p.isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />}
              </div>

              <div className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 transition-all hover:shadow-md ${p.isCurrent ? "border-indigo-200 shadow-sm" : "border-slate-200 dark:border-slate-800"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.isCurrent ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                        {toBengaliNumerals(p.academicYear)} শিক্ষাবর্ষ
                      </span>
                      {p.isCurrent && (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">বর্তমান</span>
                      )}
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{p.className}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">শাখা: {p.section}</span>
                      </div>
                      {p.tradeName && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">ট্রেড: {p.tradeName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">শিফট: {p.shift}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      p.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border border-emerald-100' :
                      p.status === 'Transferred' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 border border-amber-100' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <HistoryIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">কোনো প্লেসমেন্ট হিস্ট্রি পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. Lifecycle Events (Activity Feed) */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <HistoryIcon className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">লাইফসাইকেল ইভেন্ট লগ (Audit)</h3>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">ইভেন্ট</th>
                  <th className="px-6 py-4">পরিবর্তন (From → To)</th>
                  <th className="px-6 py-4">কারণ ও মন্তব্য</th>
                  <th className="px-6 py-4">কর্তৃপক্ষ</th>
                  <th className="px-6 py-4">সময়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {events.length > 0 ? events.map((e) => (
                  <tr key={e.id} className="hover:bg-indigo-50 dark:bg-indigo-950/40/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                          e.eventType === 'Promotion' ? 'bg-emerald-100 text-emerald-700' :
                          e.eventType === 'Admission' ? 'bg-indigo-100 text-indigo-700' :
                          e.eventType === 'Transfer Out' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {e.eventType === 'Promotion' && <Award className="w-3.5 h-3.5" />}
                          {e.eventType === 'Admission' && <UserCheck className="w-3.5 h-3.5" />}
                          {e.eventType === 'Transfer Out' && <UserX className="w-3.5 h-3.5" />}
                          {!['Promotion', 'Admission', 'Transfer Out'].includes(e.eventType) && <Layers className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{e.eventType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {e.previousState && e.newState ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">{e.previousState.className}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-indigo-600">{e.newState.className}</span>
                        </div>
                      ) : e.newState ? (
                        <span className="font-bold text-indigo-600">{e.newState.className}</span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 italic text-xs max-w-[200px] truncate" title={e.reason}>
                      {e.reason}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                      {e.performedBy}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-[10px] font-mono whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleString('bn-BD')}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      কোনো ইভেন্ট লগ পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
