"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Users,
  Search,
  Phone,
  Mail,
  Award,
  Calendar,
  Briefcase,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function FacultyStaffView() {
  const { t, language } = useLanguage();
  const [filterType, setFilterType] = useState<"all" | "faculty" | "staff">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faculty")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMembers(data.items || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = members.filter((m) => {
    const matchesType = filterType === "all" ? true : m.type === filterType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      (m.nameBangla && m.nameBangla.includes(q)) ||
      m.designation.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q) ||
      m.employeeId.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              কর্মকর্তা ও কর্মচারী নির্দেশিকা (Faculty & Staff)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের শিক্ষক, ইন্সট্রাক্টর ও প্রশাসনিক কর্মকর্তাদের তথ্যাবলি
          </p>
        </div>

        {/* Filter Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === "all"
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-cyan-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            সকল ({members.length})
          </button>
          <button
            onClick={() => setFilterType("faculty")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === "faculty"
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-cyan-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            শিক্ষকমণ্ডলী ({members.filter((m) => m.type === "faculty").length})
          </button>
          <button
            onClick={() => setFilterType("staff")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === "staff"
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-cyan-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            কর্মচারী ({members.filter((m) => m.type === "staff").length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="নাম, পদবি, বিভাগ বা আইডি দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
        />
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          তথ্য লোড হচ্ছে...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          কোনও কর্মকর্তা বা কর্মচারী খুঁজে পাওয়া যায়নি।
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-cyan-500/50 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header Profile Photo & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="relative">
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/30 group-hover:scale-105 transition-transform shadow-md"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                        member.type === "faculty" ? "bg-emerald-500" : "bg-cyan-500"
                      }`}
                    />
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        member.type === "faculty"
                          ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-indigo-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {member.type === "faculty" ? "শিক্ষকমণ্ডলী" : "কর্মচারী"}
                    </span>
                    <span className="block font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                      {member.employeeId}
                    </span>
                  </div>
                </div>

                {/* Name & Designation */}
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                    {member.nameBangla || member.name}
                  </h3>
                  <p className="text-xs text-indigo-700 dark:text-cyan-400 font-bold mt-0.5">
                    {member.designation}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {member.department}
                  </p>
                </div>

                {/* Qualifications & Subject */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 shrink-0" />
                    <span className="truncate">{member.qualification}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      যোগদানের তারিখ: {member.joiningDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Contact Links */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <a
                  href={`tel:${member.mobile}`}
                  className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{member.mobile}</span>
                </a>
                <a
                  href={`mailto:${member.email}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={member.email}
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
