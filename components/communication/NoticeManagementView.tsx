"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Trash2, Edit2, Archive, Calendar, AlertCircle } from "lucide-react";
import { Notice } from "@/lib/database";

export default function NoticeManagementView() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.items) {
          setNotices(data.items);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">নোটিশ ব্যবস্থাপনা</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer">
          <Plus className="w-4 h-4" /> নতুন নোটিশ তৈরি
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">লোড হচ্ছে...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase">
              <tr>
                <th className="p-4">শিরোনাম</th>
                <th className="p-4">ক্যাটাগরি</th>
                <th className="p-4">প্রকাশের তারিখ</th>
                <th className="p-4">অবস্থা</th>
                <th className="p-4">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {notices.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{n.titleBangla}</td>
                  <td className="p-4">{n.categoryBangla}</td>
                  <td className="p-4">{n.publishedAt}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${n.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'}`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button className="text-indigo-500 hover:text-indigo-700"><Edit2 className="w-4 h-4"/></button>
                    <button className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
