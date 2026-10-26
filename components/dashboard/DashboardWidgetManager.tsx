"use client";

import React, { useState } from "react";
import {
  Users,
  CalendarCheck,
  GraduationCap,
  Award,
  Zap,
  Flame,
  Star,
  BookOpen,
  DollarSign,
  UserCheck,
  School,
  Cpu,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  FileText,
  Target,
  Heart,
  LayoutGrid,
  X,
  Sliders,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Info,
  Edit3,
} from "lucide-react";

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

export interface DashboardCustomWidget {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  iconName: string;
  gradient: string;
  shadowColor: string;
  targetTab?: string;
  badge?: string;
  isCustom: boolean;
  order: number;
  visible: boolean;
}

export interface CoreCardOverrides {
  totalStudentsOverride?: number | null;
  totalStudentsTitle?: string;
  totalStudentsSubtitle?: string;
  attendancePresentOverride?: number | null;
  attendanceAbsentOverride?: number | null;
  attendancePercentageOverride?: number | null;
  attendanceTitle?: string;
  attendanceMethod?: "deduplicated" | "period_1_only" | "manual";
  starsOverride?: number | null;
  quizAccuracyOverride?: number | null;
}

export interface WidgetVisibilityState {
  totalStudents: boolean;
  todayAttendance: boolean;
  learningStars: boolean;
  quizArena: boolean;
  feeCollection: boolean;
  studentDoubts: boolean;
  facultyStaff: boolean;
  examinations: boolean;
  analyticsChart: boolean;
  classCards: boolean;
  leaderboard: boolean;
  activityStream: boolean;
  announcement: boolean;
}

export const DEFAULT_WIDGET_VISIBILITY: WidgetVisibilityState = {
  totalStudents: true,
  todayAttendance: true,
  learningStars: true,
  quizArena: true,
  feeCollection: true,
  studentDoubts: true,
  facultyStaff: true,
  examinations: true,
  analyticsChart: true,
  classCards: true,
  leaderboard: true,
  activityStream: true,
  announcement: true,
};

export const DEFAULT_CORE_OVERRIDES: CoreCardOverrides = {
  totalStudentsOverride: null,
  totalStudentsTitle: "মোট শিক্ষার্থী",
  totalStudentsSubtitle: "সক্রিয় শিক্ষার্থী ডাটাবেজ",
  attendancePresentOverride: null,
  attendanceAbsentOverride: null,
  attendancePercentageOverride: null,
  attendanceTitle: "আজকের উপস্থিতি",
  attendanceMethod: "deduplicated",
  starsOverride: null,
  quizAccuracyOverride: null,
};

// =============================================================================
// GRADIENT THEMES & ICON METADATA PRESETS
// =============================================================================

export const GRADIENT_PRESETS = [
  {
    id: "indigo",
    label: "রয়েল ইন্ডিগো ও ভায়োলেট",
    gradient: "from-indigo-600 via-violet-600 to-purple-700",
    shadowColor: "shadow-indigo-500/20",
    previewClass: "bg-gradient-to-r from-indigo-600 to-purple-700",
  },
  {
    id: "emerald",
    label: "ভাইব্রেন্ট এমারেল্ড ও মিন্ট",
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
    shadowColor: "shadow-emerald-500/20",
    previewClass: "bg-gradient-to-r from-emerald-500 to-teal-600",
  },
  {
    id: "amber",
    label: "সানসেট অ্যাম্বার ও অরেঞ্জ",
    gradient: "from-amber-500 via-orange-500 to-rose-600",
    shadowColor: "shadow-orange-500/20",
    previewClass: "bg-gradient-to-r from-amber-500 to-orange-500",
  },
  {
    id: "cyan",
    label: "ডিপ ওশান সায়ান ও ব্লু",
    gradient: "from-cyan-500 via-blue-600 to-indigo-700",
    shadowColor: "shadow-blue-500/20",
    previewClass: "bg-gradient-to-r from-cyan-500 to-blue-600",
  },
  {
    id: "rose",
    label: "ক্রিমসন রোজ ও পিঙ্ক",
    gradient: "from-rose-500 via-pink-600 to-red-700",
    shadowColor: "shadow-rose-500/20",
    previewClass: "bg-gradient-to-r from-rose-500 to-pink-600",
  },
  {
    id: "purple",
    label: "রয়েল ফুশিয়া ও ম্যাজেন্টা",
    gradient: "from-purple-600 via-fuchsia-600 to-pink-600",
    shadowColor: "shadow-purple-500/20",
    previewClass: "bg-gradient-to-r from-purple-600 to-pink-600",
  },
  {
    id: "slate",
    label: "প্রিমিয়াম ডার্ক গ্লাস",
    gradient: "from-slate-800 via-slate-900 to-slate-950",
    shadowColor: "shadow-slate-900/40",
    previewClass: "bg-gradient-to-r from-slate-800 to-slate-950",
  },
];

export const AVAILABLE_WIDGET_ICONS: { name: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { name: "Users", label: "শিক্ষার্থী / ব্যবহারকারী", icon: Users },
  { name: "CalendarCheck", label: "হাজিরা ও ক্যালেন্ডার", icon: CalendarCheck },
  { name: "Award", label: "মেধা ও অ্যাওয়ার্ড", icon: Award },
  { name: "Zap", label: "লাইভ কুইজ / বিদ্যুৎ", icon: Zap },
  { name: "Flame", label: "হট / ট্রেন্ডিং", icon: Flame },
  { name: "Star", label: "স্টার / রেটিং", icon: Star },
  { name: "BookOpen", label: "বই ও সিলেবাস", icon: BookOpen },
  { name: "DollarSign", label: "হিসাব ও ফি", icon: DollarSign },
  { name: "UserCheck", label: "শিক্ষক ও কর্মকর্তা", icon: UserCheck },
  { name: "School", label: "বিদ্যালয় / শ্রেণি", icon: School },
  { name: "Cpu", label: "কম্পিউটার ও ল্যাব", icon: Cpu },
  { name: "Activity", label: "অ্যাক্টিভিটি / অ্যানালিটিক্স", icon: Activity },
  { name: "ShieldCheck", label: "নিরাপত্তা ও ভেরিফাইড", icon: ShieldCheck },
  { name: "Heart", label: "পছন্দ / যত্ন", icon: Heart },
  { name: "Sparkles", label: "এআই ও স্পেশাল", icon: Sparkles },
  { name: "CheckCircle2", label: "সম্পন্ন / চেক", icon: CheckCircle2 },
];

export const ICON_LOOKUP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  CalendarCheck,
  GraduationCap,
  Award,
  Zap,
  Flame,
  Star,
  BookOpen,
  DollarSign,
  UserCheck,
  School,
  Cpu,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  FileText,
  Target,
  Heart,
  LayoutGrid,
};

export function renderWidgetIcon(iconName: string, className = "w-5 h-5 text-white") {
  const IconComp = ICON_LOOKUP[iconName] || Sparkles;
  return <IconComp className={className} />;
}

// =============================================================================
// MODAL 1: ADD NEW CUSTOM WIDGET MODAL
// =============================================================================

export function AddWidgetModal({
  isOpen,
  onClose,
  onAddWidget,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widget: DashboardCustomWidget) => void;
}) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("টি");
  const [subtitle, setSubtitle] = useState("");
  const [badge, setBadge] = useState("লাইভ উইজেট");
  const [iconName, setIconName] = useState("Cpu");
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0]);
  const [targetTab, setTargetTab] = useState("students");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !value.trim()) {
      alert("অনুগ্রহ করে উইজেটের শিরোনাম এবং মান লিখুন।");
      return;
    }

    const newWidget: DashboardCustomWidget = {
      id: `custom_widget_${Date.now()}`,
      title: title.trim(),
      value: value.trim(),
      unit: unit.trim() || undefined,
      subtitle: subtitle.trim() || "অ্যাডমিন কর্তৃক কাস্টমাইজড উইজেট",
      badge: badge.trim() || undefined,
      iconName,
      gradient: selectedGradient.gradient,
      shadowColor: selectedGradient.shadowColor,
      targetTab,
      isCustom: true,
      order: Date.now(),
      visible: true,
    };

    onAddWidget(newWidget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                ✨ নতুন ড্যাশবোর্ড উইজেট / মেট্রিক কার্ড তৈরি
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ড্যাশবোর্ডে যে কোনো কাস্টম মেট্রিক, কাউন্টার বা স্ট্যাটাস যুক্ত করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="p-5 pb-0">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
            কার্ডের লাইভ প্রিভিউ:
          </label>
          <div
            className={`bg-gradient-to-br ${selectedGradient.gradient} text-white ${selectedGradient.shadowColor} shadow-lg rounded-2xl p-4.5 relative overflow-hidden flex flex-col justify-between min-h-[140px]`}
          >
            <div className="space-y-1 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/90">
                  {title.trim() || "উইজেটের শিরোনাম"}
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                  {renderWidgetIcon(iconName, "w-4 h-4 text-white")}
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5 pt-0.5">
                <span>{value.trim() || "০"}</span>
                {unit && <span className="text-xs font-bold text-white/80">{unit}</span>}
              </div>
            </div>

            <div className="mt-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px] font-bold text-white/95 relative z-10">
              <span className="truncate">{subtitle.trim() || "সক্রিয় পরিসংখ্যান"}</span>
              {badge && (
                <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] font-mono shrink-0">
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                উইজেটের নাম / শিরোনাম *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: কম্পিউটার ল্যাব পিসি"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  মান / সংখ্যা *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ৭৮"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  একক / সাফিক্স
                </label>
                <input
                  type="text"
                  placeholder="টি / জন / %"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                সাবটাইটেল / বিবরণ
              </label>
              <input
                type="text"
                placeholder="যেমন: সচল ও ব্যবহৃত ডিভাইস"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                ট্যাব / লিংক শর্টকাট
              </label>
              <select
                value={targetTab}
                onChange={(e) => setTargetTab(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden cursor-pointer"
              >
                <option value="students">শিক্ষার্থী ডাটাবেজ (Students)</option>
                <option value="attendance">ডিজিটাল হাজিরা (Attendance)</option>
                <option value="fee_collection">ফি কালেকশন (Accounts)</option>
                <option value="course_content_builder">লার্নিং বিল্ডার (LMS)</option>
                <option value="quiz_admin">লাইভ কুইজ স্টুডিও (Quizzes)</option>
                <option value="examinations">পরীক্ষা ও ফলাফল (Exams)</option>
                <option value="teacher_dashboard">শিক্ষক ড্যাশবোর্ড (Faculty)</option>
                <option value="routine_master">ক্লাস রুটিন (Routine)</option>
              </select>
            </div>
          </div>

          {/* Color Gradient Presets */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              কালার থিম ও গ্রেডিয়েন্ট নির্বাচন করুন
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGradient(g)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                    selectedGradient.id === g.id
                      ? "border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-lg shrink-0 ${g.previewClass}`} />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {g.label.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              আইকন নির্বাচন করুন
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVAILABLE_WIDGET_ICONS.map((item) => {
                const Icon = item.icon;
                const isSelected = iconName === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIconName(item.name)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 scale-105"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-black shadow-md shadow-indigo-600/30 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ উইজেট যুক্ত করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// MODAL 2: EDIT ANY COMPONENT / WIDGET MODAL
// =============================================================================

export function EditWidgetModal({
  widget,
  isOpen,
  onClose,
  onSaveWidget,
  onDeleteWidget,
}: {
  widget: DashboardCustomWidget | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveWidget: (updated: DashboardCustomWidget) => void;
  onDeleteWidget?: (id: string) => void;
}) {
  const [title, setTitle] = useState(widget?.title || "");
  const [value, setValue] = useState(String(widget?.value || ""));
  const [unit, setUnit] = useState(widget?.unit || "");
  const [subtitle, setSubtitle] = useState(widget?.subtitle || "");
  const [iconName, setIconName] = useState(widget?.iconName || "Cpu");
  const [selectedGradient, setSelectedGradient] = useState(
    GRADIENT_PRESETS.find((g) => g.gradient === widget?.gradient) || GRADIENT_PRESETS[0]
  );
  const [targetTab, setTargetTab] = useState(widget?.targetTab || "students");

  React.useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setValue(String(widget.value));
      setUnit(widget.unit || "");
      setSubtitle(widget.subtitle || "");
      setIconName(widget.iconName);
      setSelectedGradient(
        GRADIENT_PRESETS.find((g) => g.gradient === widget.gradient) || GRADIENT_PRESETS[0]
      );
      setTargetTab(widget.targetTab || "students");
    }
  }, [widget]);

  if (!isOpen || !widget) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !value.trim()) {
      alert("অনুগ্রহ করে শিরোনাম এবং মান পূরণ করুন।");
      return;
    }

    const updated: DashboardCustomWidget = {
      ...widget,
      title: title.trim(),
      value: value.trim(),
      unit: unit.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      iconName,
      gradient: selectedGradient.gradient,
      shadowColor: selectedGradient.shadowColor,
      targetTab,
    };

    onSaveWidget(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                ✏️ উইজেট কাস্টমাইজেশন ও এডিট
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                কার্ডের নাম, মান, একক, আইকন ও কালার পরিবর্তন করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="p-5 pb-0">
          <div
            className={`bg-gradient-to-br ${selectedGradient.gradient} text-white ${selectedGradient.shadowColor} shadow-lg rounded-2xl p-4.5 relative overflow-hidden flex flex-col justify-between min-h-[140px]`}
          >
            <div className="space-y-1 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/90">
                  {title || "উইজেটের নাম"}
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                  {renderWidgetIcon(iconName, "w-4 h-4 text-white")}
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5 pt-0.5">
                <span>{value || "০"}</span>
                {unit && <span className="text-xs font-bold text-white/80">{unit}</span>}
              </div>
            </div>

            <div className="mt-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px] font-bold text-white/95 relative z-10">
              <span className="truncate">{subtitle || "লাইভ মেট্রিক"}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] font-mono">
                সক্রিয়
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-3.5 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                উইজেটের নাম / শিরোনাম *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  মান / সংখ্যা *
                </label>
                <input
                  type="text"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  একক / সাফিক্স
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                সাবটাইটেল / বিবরণ
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                ট্যাব শর্টকাট
              </label>
              <select
                value={targetTab}
                onChange={(e) => setTargetTab(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden cursor-pointer"
              >
                <option value="students">শিক্ষার্থী ডাটাবেজ (Students)</option>
                <option value="attendance">ডিজিটাল হাজিরা (Attendance)</option>
                <option value="fee_collection">ফি কালেকশন (Accounts)</option>
                <option value="course_content_builder">লার্নিং বিল্ডার (LMS)</option>
                <option value="quiz_admin">লাইভ কুইজ স্টুডিও (Quizzes)</option>
                <option value="examinations">পরীক্ষা ও ফলাফল (Exams)</option>
                <option value="teacher_dashboard">শিক্ষক ড্যাশবোর্ড (Faculty)</option>
                <option value="routine_master">ক্লাস রুটিন (Routine)</option>
              </select>
            </div>
          </div>

          {/* Color Gradient Presets */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              কালার থিম নির্বাচন করুন
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGradient(g)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                    selectedGradient.id === g.id
                      ? "border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-lg shrink-0 ${g.previewClass}`} />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {g.label.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              আইকন নির্বাচন করুন
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVAILABLE_WIDGET_ICONS.map((item) => {
                const Icon = item.icon;
                const isSelected = iconName === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIconName(item.name)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 scale-105"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {onDeleteWidget && widget.isCustom ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`আপনি কি নিশ্চিতভাবে "${widget.title}" উইজেটটি মুছে ফেলতে চান?`)) {
                    onDeleteWidget(widget.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>উইজেট ডিলিট</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md shadow-amber-600/30 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// MODAL 3: TODAY'S ATTENDANCE CONFIGURATION & MULTI-PERIOD DEDUPLICATION MODAL
// =============================================================================

export function AttendanceConfigModal({
  isOpen,
  onClose,
  currentSummary,
  overrides,
  onSaveOverrides,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentSummary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  overrides: CoreCardOverrides;
  onSaveOverrides: (updated: Partial<CoreCardOverrides>) => void;
}) {
  const [method, setMethod] = useState<"deduplicated" | "period_1_only" | "manual">(
    overrides.attendanceMethod || "deduplicated"
  );
  const [customTitle, setCustomTitle] = useState(overrides.attendanceTitle || "আজকের উপস্থিতি");
  const [manualPresent, setManualPresent] = useState(
    overrides.attendancePresentOverride !== null && overrides.attendancePresentOverride !== undefined
      ? String(overrides.attendancePresentOverride)
      : String(currentSummary.present)
  );
  const [manualAbsent, setManualAbsent] = useState(
    overrides.attendanceAbsentOverride !== null && overrides.attendanceAbsentOverride !== undefined
      ? String(overrides.attendanceAbsentOverride)
      : String(currentSummary.absent)
  );

  React.useEffect(() => {
    setMethod(overrides.attendanceMethod || "deduplicated");
    setCustomTitle(overrides.attendanceTitle || "আজকের উপস্থিতি");
    if (overrides.attendancePresentOverride !== null && overrides.attendancePresentOverride !== undefined) {
      setManualPresent(String(overrides.attendancePresentOverride));
    } else {
      setManualPresent(String(currentSummary.present));
    }
    if (overrides.attendanceAbsentOverride !== null && overrides.attendanceAbsentOverride !== undefined) {
      setManualAbsent(String(overrides.attendanceAbsentOverride));
    } else {
      setManualAbsent(String(currentSummary.absent));
    }
  }, [overrides, currentSummary]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (method === "manual") {
      const pres = Number(manualPresent) || 0;
      const abs = Number(manualAbsent) || 0;
      const tot = pres + abs || currentSummary.total || 720;
      const pct = tot > 0 ? Number(((pres / tot) * 100).toFixed(1)) : 0;

      onSaveOverrides({
        attendanceTitle: customTitle.trim() || "আজকের উপস্থিতি",
        attendanceMethod: "manual",
        attendancePresentOverride: pres,
        attendanceAbsentOverride: abs,
        attendancePercentageOverride: pct,
      });
    } else {
      // Auto calculation methods
      onSaveOverrides({
        attendanceTitle: customTitle.trim() || "আজকের উপস্থিতি",
        attendanceMethod: method,
        attendancePresentOverride: null,
        attendanceAbsentOverride: null,
        attendancePercentageOverride: null,
      });
    }

    onClose();
  };

  const handleResetToAuto = () => {
    onSaveOverrides({
      attendanceTitle: "আজকের উপস্থিতি",
      attendanceMethod: "deduplicated",
      attendancePresentOverride: null,
      attendanceAbsentOverride: null,
      attendancePercentageOverride: null,
    });
    setMethod("deduplicated");
    setCustomTitle("আজকের উপস্থিতি");
    setManualPresent(String(currentSummary.present));
    setManualAbsent(String(currentSummary.absent));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                📲 আজকের উপস্থিতি কনফিগারেশন ও গণনা পদ্ধতি
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                মাল্টি-পিরিয়ড ডুপ্লিকেট রোধ নীতি ও সংখ্যা এডিট করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Rule Notice Banner */}
        <div className="p-4 mx-5 mt-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-800/60 text-xs space-y-1.5 text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-1.5 font-black text-[12px]">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>🎯 মাল্টি-পিরিয়ড হাজিরা গণনা নীতি:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
            আমাদের সিস্টেমে ১ম পিরিয়ড ও ২য় পিরিয়ডে হাজিরা নেওয়া যায়। তবে ড্যাশবোর্ডে দিনশেষে
            <strong> একই ক্লাসের প্রতিটি শিক্ষার্থীকে মাত্র ১ বারই গণনা করা হয়</strong> (কোনো ডুপ্লিকেট কাউন্ট হয় না)।
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              কার্ডের শিরোনাম
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-2">
              গণনা পদ্ধতি নির্বাচন করুন:
            </label>
            <div className="space-y-2">
              <label
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  method === "deduplicated"
                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="attMethod"
                  value="deduplicated"
                  checked={method === "deduplicated"}
                  onChange={() => setMethod("deduplicated")}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🎯 স্বয়ংক্রিয় ইউনিক শিক্ষার্থী গণনা (প্রস্তাবিত)</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                      ডিফল্ট
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    ১ম বা ২য় যে কোনো পিরিয়ডে শিক্ষার্থী উপস্থিত থাকলে দিনশেষে তাকে ১ বারই উপস্থিত ধরা হবে।
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  method === "period_1_only"
                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="attMethod"
                  value="period_1_only"
                  checked={method === "period_1_only"}
                  onChange={() => setMethod("period_1_only")}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    ⏱️ প্রারম্ভিক ১ম পিরিয়ড গণনা
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    শুধুমাত্র ১ম পিরিয়ডের হাজিরা শিটকে দিনের প্রাতিষ্ঠানিক প্রারম্ভিক হাজিরা হিসেবে গণ্য করবে।
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  method === "manual"
                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="attMethod"
                  value="manual"
                  checked={method === "manual"}
                  onChange={() => setMethod("manual")}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    ✍️ ম্যানুয়াল সংখ্যা এন্ট্রি / অ্যাডমিন ওভাররাইড
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    আজকের উপস্থিত ও অনুপস্থিতির সংখ্যা অ্যাডমিন নিজে হাতে সেট করবেন।
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Manual inputs when manual is selected */}
          {method === "manual" && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">
                ম্যানুয়াল সংখ্যা প্রদান করুন:
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    উপস্থিত সংখ্যা (জন) *
                  </label>
                  <input
                    type="number"
                    required
                    value={manualPresent}
                    onChange={(e) => setManualPresent(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    অনুপস্থিত সংখ্যা (জন) *
                  </label>
                  <input
                    type="number"
                    required
                    value={manualAbsent}
                    onChange={(e) => setManualAbsent(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Current Live Status Preview */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>লাইভ ডাটাবেস মান:</span>
            <span>
              উপস্থিত: {currentSummary.present} জন ({currentSummary.percentage}%) • অনুপস্থিত: {currentSummary.absent} জন
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToAuto}
              className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>স্বাভাবিক ডাটাবেস মান রিসেট</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/30 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// MODAL 4: TOTAL STUDENTS CONFIGURATION & EDIT MODAL
// =============================================================================

export function StudentsConfigModal({
  isOpen,
  onClose,
  currentCount,
  overrides,
  onSaveOverrides,
  onQuickAddStudent,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  overrides: CoreCardOverrides;
  onSaveOverrides: (updated: Partial<CoreCardOverrides>) => void;
  onQuickAddStudent: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"override" | "add">("override");
  const [customTitle, setCustomTitle] = useState(overrides.totalStudentsTitle || "মোট শিক্ষার্থী");
  const [customSubtitle, setCustomSubtitle] = useState(
    overrides.totalStudentsSubtitle || "সক্রিয় শিক্ষার্থী ডাটাবেজ"
  );
  const [isManual, setIsManual] = useState(
    overrides.totalStudentsOverride !== null && overrides.totalStudentsOverride !== undefined
  );
  const [manualCount, setManualCount] = useState(
    overrides.totalStudentsOverride ? String(overrides.totalStudentsOverride) : String(currentCount)
  );

  React.useEffect(() => {
    setCustomTitle(overrides.totalStudentsTitle || "মোট শিক্ষার্থী");
    setCustomSubtitle(overrides.totalStudentsSubtitle || "সক্রিয় শিক্ষার্থী ডাটাবেজ");
    if (overrides.totalStudentsOverride !== null && overrides.totalStudentsOverride !== undefined) {
      setIsManual(true);
      setManualCount(String(overrides.totalStudentsOverride));
    } else {
      setIsManual(false);
      setManualCount(String(currentCount));
    }
  }, [overrides, currentCount]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (isManual) {
      const num = Number(manualCount) || currentCount;
      onSaveOverrides({
        totalStudentsTitle: customTitle.trim() || "মোট শিক্ষার্থী",
        totalStudentsSubtitle: customSubtitle.trim() || "সক্রিয় শিক্ষার্থী ডাটাবেজ",
        totalStudentsOverride: num,
      });
    } else {
      onSaveOverrides({
        totalStudentsTitle: customTitle.trim() || "মোট শিক্ষার্থী",
        totalStudentsSubtitle: customSubtitle.trim() || "সক্রিয় শিক্ষার্থী ডাটাবেজ",
        totalStudentsOverride: null,
      });
    }

    onClose();
  };

  const handleResetToAuto = () => {
    onSaveOverrides({
      totalStudentsTitle: "মোট শিক্ষার্থী",
      totalStudentsSubtitle: "সক্রিয় শিক্ষার্থী ডাটাবেজ",
      totalStudentsOverride: null,
    });
    setIsManual(false);
    setManualCount(String(currentCount));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                👥 মোট শিক্ষার্থী কার্ড এডিট ও পরিচালনা
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                মোট সংখ্যা ম্যানুয়ালি এডিট করুন বা ডাটাবেসে নতুন শিক্ষার্থী ভর্তি করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toggle Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("override")}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "override"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            ✏️ সংখ্যা ও টাইটেল এডিট
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onQuickAddStudent();
            }}
            className="flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ নতুন শিক্ষার্থী ভর্তি ফর্ম</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                কার্ডের শিরোনাম
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                সাবটাইটেল / ক্যাপশন
              </label>
              <input
                type="text"
                value={customSubtitle}
                onChange={(e) => setCustomSubtitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
              />
            </div>
          </div>

          {/* Toggle between auto DB and manual override */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  ম্যানুয়াল সংখ্যা ওভাররাইড সক্রিয় করুন
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  অন থাকলে সরাসরি নিচে দেওয়া সংখ্যা প্রদর্শিত হবে
                </span>
              </div>
              <input
                type="checkbox"
                checked={isManual}
                onChange={(e) => setIsManual(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
              />
            </div>

            {isManual ? (
              <div>
                <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  মোট শিক্ষার্থীর সংখ্যা (জন) *
                </label>
                <input
                  type="number"
                  required
                  value={manualCount}
                  onChange={(e) => setManualCount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold outline-hidden"
                />
              </div>
            ) : (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>স্বয়ংক্রিয় ডাটাবেস গণনা সক্রিয়: বর্তমানে {currentCount} জন শিক্ষার্থী</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToAuto}
              className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>স্বাভাবিক মান রিসেট</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/30 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// MODAL 5: CUSTOMIZE DASHBOARD LAYOUT & WIDGET VISIBILITY DRAWER
// =============================================================================

export function CustomizeDashboardDrawer({
  isOpen,
  onClose,
  visibility,
  onToggleVisibility,
  customWidgets,
  onDeleteCustomWidget,
  onOpenAddWidget,
  onResetAll,
}: {
  isOpen: boolean;
  onClose: () => void;
  visibility: WidgetVisibilityState;
  onToggleVisibility: (key: keyof WidgetVisibilityState) => void;
  customWidgets: DashboardCustomWidget[];
  onDeleteCustomWidget: (id: string) => void;
  onOpenAddWidget: () => void;
  onResetAll: () => void;
}) {
  if (!isOpen) return null;

  const coreList: { key: keyof WidgetVisibilityState; label: string; desc: string; icon: any }[] = [
    { key: "totalStudents", label: "মোট শিক্ষার্থী কার্ড", desc: "মোট শিক্ষার্থী সংখ্যা ও শ্রেণি পরিসংখ্যান", icon: Users },
    { key: "todayAttendance", label: "আজকের উপস্থিতি কার্ড", desc: "দৈনিক হাজিরা হার ও উপস্থিত-অনুপস্থিত সংখ্যা", icon: CalendarCheck },
    { key: "learningStars", label: "লার্নিং ও স্টার অর্জন", desc: "সম্পন্ন অধ্যায়, লেসন ও লার্নিং স্টার", icon: Star },
    { key: "quizArena", label: "কুইজ মূল্যায়ন এরিনা", desc: "কুইজ সঠিকতা হার ও লাইভ সেশন", icon: Zap },
    { key: "feeCollection", label: "হিসাব ও ফি আদায়", desc: "আদায় হার, মোট কালেকশন ও বকেয়া", icon: DollarSign },
    { key: "studentDoubts", label: "শিক্ষার্থী জিজ্ঞাসা (Doubt)", desc: "পেন্ডিং প্রশ্নের তালিকা ও শিক্ষক রিভিউ", icon: HelpCircle },
    { key: "facultyStaff", label: "শিক্ষক ও কর্মকর্তা", desc: "মোট শিক্ষক ও সক্রিয় স্টাফ তথ্য", icon: UserCheck },
    { key: "examinations", label: "পরীক্ষা ও ফলাফল", desc: "পরীক্ষার সেশন, ফলাফল ও লেজার", icon: Award },
    { key: "analyticsChart", label: "অ্যানালিটিক্স ট্রেন্ড চার্ট", desc: "৭ দিনের উপস্থিতি ও পারফরম্যান্স এরিয়া/বার গ্রাফ", icon: Activity },
    { key: "classCards", label: "শ্রেণি ভিত্তিক লাইভ কার্ড", desc: "৬ষ্ঠ থেকে ১২শ শ্রেণির শিক্ষার্থী অনুপাত", icon: School },
    { key: "leaderboard", label: "সেরা ৫ মেধাবী শিক্ষার্থী", desc: "গ্যামিফাইড লিডারবোর্ড পোডিয়াম", icon: Award },
    { key: "activityStream", label: "সাম্প্রতিক কার্যক্রম লগ", desc: "লাইভ অডিট লগ ও নোটিফিকেশন স্ট্রিম", icon: Clock },
    { key: "announcement", label: "বিজ্ঞপ্তি ব্যানার", desc: "জরুরি সম্প্রচার নোটিশ স্ট্রিপ", icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slide-left">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                ✨ ড্যাশবোর্ড উইজেট কন্ট্রোল প্যানেল
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                যেকোনো উইজেট অন/অফ করুন বা নতুন তৈরি করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Widget Quick Button */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAddWidget();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ নতুন উইজেট / কার্ড যোগ করুন</span>
          </button>
        </div>

        {/* List of Widgets with Toggle Switches */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Custom Widgets Section */}
          {customWidgets.length > 0 && (
            <div>
              <span className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block mb-2">
                কাস্টম উইজেটসমূহ ({customWidgets.length}টি)
              </span>
              <div className="space-y-2">
                {customWidgets.map((cw) => (
                  <div
                    key={cw.id}
                    className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        {renderWidgetIcon(cw.iconName, "w-4 h-4 text-white")}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {cw.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          মান: {cw.value} {cw.unit || ""}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`"${cw.title}" উইজেটটি মুছে ফেলতে চান?`)) {
                          onDeleteCustomWidget(cw.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="ডিলিট করুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core System Widgets Section */}
          <div>
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-2">
              মূল ড্যাশবোর্ড উইজেটসমূহ
            </span>
            <div className="space-y-2">
              {coreList.map((item) => {
                const Icon = item.icon;
                const isVisible = visibility[item.key];

                return (
                  <div
                    key={item.key}
                    onClick={() => onToggleVisibility(item.key)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isVisible
                        ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80"
                        : "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isVisible
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(item.key);
                      }}
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                        isVisible ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          isVisible ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={() => {
              if (confirm("সকল কাস্টম উইজেট ও লেআউট ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?")) {
                onResetAll();
                onClose();
              }
            }}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ডিফল্ট লেআউট রিসেট</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black cursor-pointer shadow-md"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
}
