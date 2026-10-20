"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Sparkles,
  Flame,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Award,
  Zap,
  CheckCircle2,
  X,
  Play,
  RotateCw,
  Shield,
  Layers
} from "lucide-react";
import {
  useTheme,
  ICON_THEME_OPTIONS,
  IconThemeId,
  IconAnimationLevel
} from "@/context/ThemeContext";
import { getThemedIconStyle } from "@/lib/iconThemes";

interface IconThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IconThemeSelectorModal({
  isOpen,
  onClose,
}: IconThemeSelectorModalProps) {
  const { iconTheme, setIconTheme, iconAnimation, setIconAnimation } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<IconThemeId>(iconTheme);
  const [selectedAnim, setSelectedAnim] = useState<IconAnimationLevel>(iconAnimation);

  useEffect(() => {
    setSelectedTheme(iconTheme);
    setSelectedAnim(iconAnimation);
  }, [iconTheme, iconAnimation, isOpen]);

  if (!isOpen) return null;

  const handleApply = (themeId: IconThemeId) => {
    setSelectedTheme(themeId);
    setIconTheme(themeId);
  };

  const handleAnimChange = (anim: IconAnimationLevel) => {
    setSelectedAnim(anim);
    setIconAnimation(anim);
  };

  // Sample items to preview live
  const previewItems = [
    { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
    { id: "students", label: "শিক্ষার্থী", icon: Users },
    { id: "attendance", label: "হাজিরা", icon: CalendarCheck },
    { id: "quiz_admin", label: "লাইভ কুইজ", icon: Flame },
    { id: "examinations", label: "পরীক্ষা", icon: Award },
    { id: "routine_builder", label: "রুটিন", icon: Zap },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with Colorful Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 via-emerald-500 via-cyan-500 to-purple-600 animate-moving-gradient" />

        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 animate-icon-pulse">
              <Palette className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  আইকন থিম ও অ্যানিমেশন স্টুডিও
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-rose-500 text-white uppercase tracking-wider">
                  কালারফুল & অ্যানিমেটেড
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                পুরো স্কুল ইআরপি-এর সকল মেনু ও কার্ডের আইকন কালার, থিম এবং ডাইনামিক অ্যানিমেশন পছন্দ করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Live Preview Box */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                লাইভ আইকন প্রিভিউ (Live Preview)
              </span>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                হোভার করে অ্যানিমেশন পরীক্ষা করুন
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {previewItems.map((item) => {
                const IconComponent = item.icon;
                const style = getThemedIconStyle(item.id, selectedTheme, selectedAnim);

                return (
                  <div
                    key={item.id}
                    className="group p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${style.bgGradient} ${style.borderColor} border flex items-center justify-center shadow-md ${style.glowShadow} mb-1.5 transition-all duration-300`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${style.iconColor} ${style.animClass}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-full">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Icon Themes Selection Cards */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
              আইকন কালার থিম নির্বাচন করুন (Select Icon Theme)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ICON_THEME_OPTIONS.map((theme) => {
                const isSelected = selectedTheme === theme.id;

                return (
                  <button
                    key={theme.id}
                    onClick={() => handleApply(theme.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 relative overflow-hidden cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-500/10"
                        : "bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {/* Visual Color Swatch Ribbon */}
                    <div className="w-10 h-10 rounded-xl p-0.5 shrink-0 bg-gradient-to-tr flex items-center justify-center shadow-sm">
                      <div className={`w-full h-full rounded-lg bg-gradient-to-br ${theme.gradientClass} flex items-center justify-center shadow-inner`}>
                        <Sparkles className="w-4 h-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                          {theme.nameBangla}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {theme.description}
                      </p>

                      {/* Swatch dots */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {theme.previewColors.map((color, idx) => (
                          <span
                            key={idx}
                            className="w-2.5 h-2.5 rounded-full shadow-xs"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animation Level Picker */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
              আইকন অ্যানিমেশন মোড (Icon Animation Behavior)
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: "vibrant",
                  label: "চঞ্চল অ্যানিমেশন",
                  sublabel: "Vibrant / Bounce & Glow",
                  desc: "স্মুথ রোটেট, স্কেল ও গ্লো পালস",
                },
                {
                  id: "subtle",
                  label: "মৃদু অ্যানিমেশন",
                  sublabel: "Subtle Scale",
                  desc: "স্মার্ট জেন্টল স্কেল হোভার",
                },
                {
                  id: "none",
                  label: "স্থির মোড",
                  sublabel: "Static No Animation",
                  desc: "কোনও ট্রানজিশন ছাড়াই স্থির",
                },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => handleAnimChange(lvl.id as IconAnimationLevel)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedAnim === lvl.id
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-400 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="font-black text-xs">{lvl.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {lvl.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>স্বয়ংক্রিয়ভাবে সংরক্ষিত ও কার্যকর</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            সম্পন্ন করুন (Apply & Close)
          </button>
        </div>

      </div>
    </div>
  );
}
