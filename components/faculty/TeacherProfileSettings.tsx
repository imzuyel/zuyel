"use client";

import React, { useState } from "react";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Award,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Plus,
  X,
  Save,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TEACHER, withPermissions, usePermissions } from "@/lib/rbac";
import { GlowButton } from "@/components/ui/animation-effects";
import { toBengaliNumerals } from "@/lib/utils";

function TeacherProfileSettingsComponent() {
  const { currentUser, showToast } = useAuth();

  const [fullName, setFullName] = useState(currentUser.fullName || "Engr. Mahmudul Hasan");
  const [nameBangla, setNameBangla] = useState(currentUser.nameBangla || "প্রকৌ. মাহমুদুল হাসান");
  const [designation, setDesignation] = useState(currentUser.designation || "চিফ ইন্সট্রাক্টর (আইটি ও আইওটি)");
  const [department, setDepartment] = useState(currentUser.department || "কম্পিউটার ও আইওটি বিভাগ");
  const [mobile, setMobile] = useState(currentUser.mobile || "01711-000003");
  const [email, setEmail] = useState(currentUser.email || "teacher@pgtsc.gov.bd");
  const [officeRoom, setOfficeRoom] = useState("অ্যাকাডেমিক ভবন-২, রুম ২০৪");

  // Expertise Tags state
  const [tags, setTags] = useState<string[]>([
    "IoT & Microcontrollers",
    "Python Programming",
    "Computer Networks",
    "Electrical Wiring & Circuit Design",
  ]);
  const [newTagInput, setNewTagInput] = useState("");

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    if (!tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("শিক্ষক প্রোফাইল ও দক্ষতা সফলভাবে আপডেট করা হয়েছে!", "success");
  };

  // Check if user is teacher
  const isTeacher = currentUser.role === "teacher" || currentUser.role === "admin" || currentUser.role === "principal";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-3xl shadow-xl border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/25 shrink-0">
            {nameBangla.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                TEACHER PROFILE & EXPERTISE SETTINGS
              </span>
              <span className="text-xs text-emerald-200 font-bold">
                রোল: {currentUser.role}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {nameBangla}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {designation} • {department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md border border-white/20 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>রোল-বেসড প্রোফাইল প্রটেক্টেড</span>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSaveProfile} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            <span>ব্যক্তিগত তথ্য ও যোগাযোগের বিবরণ</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            আপনার অফিশিয়াল প্রোফাইল তথ্য এবং যোগাযোগের নম্বর পরিবর্তন করুন।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              পূর্ণ নাম (বাংলায়):
            </label>
            <input
              type="text"
              value={nameBangla}
              onChange={(e) => setNameBangla(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Full Name (English):
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              পদবি (Designation):
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              বিভাগ (Department):
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              মোবাইল নম্বর (Mobile):
            </label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              অফিশিয়াল ইমেইল (Email):
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              অফিস রুম / ল্যাব লোকেশন:
            </label>
            <input
              type="text"
              value={officeRoom}
              onChange={(e) => setOfficeRoom(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Expertise Tags Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>দক্ষতা ও বিশেষায়িত বিষয়সমূহ (Expertise & Subject Tags)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              আপনার একাডেমিক ও কারিগরি দক্ষতার ট্যাগগুলো যোগ বা পরিবর্তন করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-emerald-600 hover:text-rose-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 max-w-md">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="নতুন দক্ষতা বা বিষয় যোগ করুন..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition flex items-center gap-1 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <GlowButton
            type="submit"
            variant="cyan"
            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>প্রোফাইল পরিবর্তন সংরক্ষণ করুন</span>
          </GlowButton>
        </div>
      </form>
    </div>
  );
}

// Export wrapped with withPermissions HOC restricted to teacher module / role
export default withPermissions(TeacherProfileSettingsComponent, "attendance", "view");
