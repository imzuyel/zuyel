"use client";

import React, { createContext, useContext, useState, useEffect, useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark";
export type ThemeColor =
  | "navy"
  | "emerald"
  | "cyber"
  | "crimson"
  | "purple"
  | "national"
  | "amber";

export type BackgroundVector =
  | "none"
  | "circuit"
  | "gears"
  | "guilloche"
  | "hex_grid"
  | "waves"
  | "micro_dots";

export type IconThemeId =
  | "rainbow"
  | "cyber_neon"
  | "golden_luxury"
  | "emerald_matrix"
  | "sunset_aurora"
  | "electric_violet"
  | "plasma_synth"
  | "deep_ocean"
  | "ruby_crimson"
  | "amber_copper"
  | "monochrome_minimal"
  | "tokyo_cyberpunk";

export type IconAnimationLevel = "vibrant" | "subtle" | "none";

export interface IconThemeOption {
  id: IconThemeId;
  name: string;
  nameBangla: string;
  description: string;
  previewColors: string[];
  gradientClass: string;
  accentClass: string;
}

export const ICON_THEME_OPTIONS: IconThemeOption[] = [
  {
    id: "rainbow",
    name: "Colorful Spectrum / Rainbow",
    nameBangla: "কালারফুল রামধনু ও স্পেকট্রাম",
    description: "প্রতিটি মডিউলের জন্য উজ্জ্বল, বহুরঙিন ভাইব্রেন্ট প্যালেট ও অ্যানিমেশন",
    previewColors: ["#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6"],
    gradientClass: "from-rose-500 via-amber-500 via-emerald-500 via-cyan-500 to-purple-600",
    accentClass: "text-amber-400 shadow-amber-500/40",
  },
  {
    id: "cyber_neon",
    name: "Cyber Neon Glow",
    nameBangla: "সাইবার নিয়ন ও লেজার গ্লো",
    description: "উজ্জ্বল নিয়ন সায়ান, ম্যাজেন্টা ও ইলেকট্রিক পার্পল গ্লো ইফেক্ট",
    previewColors: ["#06b6d4", "#a855f7", "#ec4899", "#22d3ee"],
    gradientClass: "from-cyan-400 via-purple-500 to-pink-500",
    accentClass: "text-cyan-400 shadow-cyan-500/40",
  },
  {
    id: "golden_luxury",
    name: "Royal Gold & Amber",
    nameBangla: "রয়েল গোল্ড ও অ্যাম্বার লাক্সারি",
    description: "অভিজাত সোনালী, ব্রোঞ্জ ও ওয়ার্ম অ্যাম্বারের ঝলকানি",
    previewColors: ["#f59e0b", "#d97706", "#fbbf24", "#eab308"],
    gradientClass: "from-amber-400 via-yellow-500 to-orange-500",
    accentClass: "text-amber-400 shadow-amber-500/40",
  },
  {
    id: "emerald_matrix",
    name: "Emerald Tech Matrix",
    nameBangla: "পান্না গ্রিন ও টেক ম্যাট্রিক্স",
    description: "সবুজ পান্না, মিন্ট ও টিল হাই-টেক কোড ভাইব",
    previewColors: ["#10b981", "#059669", "#14b8a6", "#2dd4bf"],
    gradientClass: "from-emerald-400 via-teal-500 to-cyan-500",
    accentClass: "text-emerald-400 shadow-emerald-500/40",
  },
  {
    id: "sunset_aurora",
    name: "Sunset Aurora Flame",
    nameBangla: "সানসেট অরোরা ও ফায়ার কোরাল",
    description: "উত্তেজনাপূর্ণ লালচে-গোলাপি, রুবি ও সানসেট অরেঞ্জ",
    previewColors: ["#f43f5e", "#fb7185", "#f97316", "#e11d48"],
    gradientClass: "from-rose-500 via-orange-500 to-amber-500",
    accentClass: "text-rose-400 shadow-rose-500/40",
  },
  {
    id: "electric_violet",
    name: "Electric Violet & Indigo",
    nameBangla: "ইলেকট্রিক ভায়োলেট ও গ্যালাক্সি",
    description: "গভীর গ্যালাক্সি ভায়োলেট, ইন্ডিগো ও ইলেকট্রিক ব্লু",
    previewColors: ["#8b5cf6", "#6366f1", "#3b82f6", "#a855f7"],
    gradientClass: "from-violet-500 via-indigo-500 to-blue-600",
    accentClass: "text-purple-400 shadow-purple-500/40",
  },
  {
    id: "plasma_synth",
    name: "Plasma Synthwave",
    nameBangla: "প্লাজমা সিন্থ ও নিউন পিঙ্ক",
    description: "হাইপার-ফিউচারিস্টিক পার্পল, মেজেন্টা ও লেজার ভাইব",
    previewColors: ["#d946ef", "#a855f7", "#ec4899", "#f43f5e"],
    gradientClass: "from-fuchsia-500 via-purple-600 to-pink-500",
    accentClass: "text-fuchsia-400 shadow-fuchsia-500/40",
  },
  {
    id: "deep_ocean",
    name: "Deep Ocean Sapphire",
    nameBangla: "ডিপ ওশান সাফায়ার ও একুয়া ব্লু",
    description: "গভীর মহাসাগরের নীল, সাফায়ার ও ক্রিস্টাল একুয়া",
    previewColors: ["#0284c7", "#0369a1", "#06b6d4", "#38bdf8"],
    gradientClass: "from-sky-500 via-blue-600 to-indigo-700",
    accentClass: "text-sky-400 shadow-sky-500/40",
  },
  {
    id: "ruby_crimson",
    name: "Royal Ruby Crimson",
    nameBangla: "রয়েল রুবি ক্রিমসন ও রেড রোজ",
    description: "গাঢ় রাজকীয় লাল, ক্রিমসন ও রোজ গ্ল্যামার",
    previewColors: ["#be123c", "#e11d48", "#f43f5e", "#fda4af"],
    gradientClass: "from-rose-600 via-red-600 to-pink-600",
    accentClass: "text-rose-400 shadow-rose-500/40",
  },
  {
    id: "amber_copper",
    name: "Metallic Copper & Bronze",
    nameBangla: "অ্যাম্বার কপার ও মেটালিক ব্রোঞ্জ",
    description: "ওয়ার্ম কপার, মেটালিক ব্রোঞ্জ ও ওয়ার্ম অ্যাম্বার",
    previewColors: ["#b45309", "#d97706", "#f59e0b", "#fbbf24"],
    gradientClass: "from-amber-600 via-orange-600 to-yellow-500",
    accentClass: "text-amber-400 shadow-amber-500/40",
  },
  {
    id: "monochrome_minimal",
    name: "Sleek Platinum Glass",
    nameBangla: "প্লাটিনাম গ্লাস ও গ্লেসিয়াল আইস",
    description: "অভিজাত গ্লাস রূপালী, স্লিক প্লাটিনাম ও মেটালিক গ্রে",
    previewColors: ["#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"],
    gradientClass: "from-slate-600 via-slate-500 to-zinc-400",
    accentClass: "text-slate-300 shadow-slate-400/40",
  },
  {
    id: "tokyo_cyberpunk",
    name: "Tokyo Cyberpunk Neon",
    nameBangla: "টোকিও সাইবারপাঙ্ক ও নিয়ন ইয়োলো",
    description: "আল্ট্রা-ভাইব্রেন্ট নিয়ন হলুদ, সাইবার সায়ান ও হট পিঙ্ক",
    previewColors: ["#facc15", "#eab308", "#06b6d4", "#ec4899"],
    gradientClass: "from-yellow-400 via-cyan-400 to-pink-500",
    accentClass: "text-yellow-400 shadow-yellow-500/40",
  },
];

export interface ProjectThemeConfig {
  id: ThemeColor;
  name: string;
  nameBangla: string;
  primaryColor: string;
  accentColor: string;
  previewGradient: string;
  activeClass: string;
}

export const PROJECT_THEMES: ProjectThemeConfig[] = [
  {
    id: "navy",
    name: "BTEB Royal Navy & Gold",
    nameBangla: "রয়েল নেভি ও গোল্ডেন গ্লো",
    primaryColor: "#1e3a8a",
    accentColor: "#f59e0b",
    previewGradient: "from-blue-900 via-indigo-900 to-amber-500",
    activeClass: "border-blue-600 ring-blue-400",
  },
  {
    id: "emerald",
    name: "Technical Royal Emerald",
    nameBangla: "রয়েল পান্না সবুজ ও ব্রোঞ্জ",
    primaryColor: "#065f46",
    accentColor: "#10b981",
    previewGradient: "from-emerald-800 to-teal-500",
    activeClass: "border-emerald-600 ring-emerald-400",
  },
  {
    id: "cyber",
    name: "Cyber IoT & Electric Cyan",
    nameBangla: "সাইবার আইওটি ও ইলেকট্রিক সায়ান",
    primaryColor: "#0284c7",
    accentColor: "#06b6d4",
    previewGradient: "from-cyan-600 via-blue-600 to-indigo-700",
    activeClass: "border-cyan-500 ring-cyan-300",
  },
  {
    id: "crimson",
    name: "Technical Crimson Energy",
    nameBangla: "রক্তিম ক্রিস্টাল রুবি ও গোল্ড",
    primaryColor: "#9f1239",
    accentColor: "#f43f5e",
    previewGradient: "from-rose-700 to-red-500",
    activeClass: "border-rose-600 ring-rose-400",
  },
  {
    id: "purple",
    name: "Futuristic Purple Neon",
    nameBangla: "ফিউচারিস্টিক পার্পল ও নিয়ন পিঙ্ক",
    primaryColor: "#581c87",
    accentColor: "#c084fc",
    previewGradient: "from-purple-800 to-pink-600",
    activeClass: "border-purple-600 ring-purple-400",
  },
  {
    id: "national",
    name: "National Bangladesh Flag",
    nameBangla: "জাতীয় পতাকার সবুজ ও রক্তিম লাল",
    primaryColor: "#064e3b",
    accentColor: "#dc2626",
    previewGradient: "from-emerald-800 to-red-600",
    activeClass: "border-emerald-600 ring-emerald-400",
  },
  {
    id: "amber",
    name: "Sunset Golden Amber",
    nameBangla: "সানসেট গোল্ডেন অ্যাম্বার ও ব্রোঞ্জ",
    primaryColor: "#78350f",
    accentColor: "#f59e0b",
    previewGradient: "from-amber-600 to-orange-600",
    activeClass: "border-amber-600 ring-amber-400",
  },
];

export interface BackgroundVectorOption {
  id: BackgroundVector;
  name: string;
  nameBangla: string;
  description: string;
}

export const BG_VECTOR_OPTIONS: BackgroundVectorOption[] = [
  {
    id: "none",
    name: "Clean Minimalist",
    nameBangla: "স্বচ্ছ ব্যাকগ্রাউন্ড",
    description: "কোনও ব্যাকগ্রাউন্ড ওয়াটারমার্ক ছাড়াই ক্লীন ভিউ",
  },
  {
    id: "circuit",
    name: "IoT & Circuit Traces",
    nameBangla: "ইলেকট্রনিক্স সার্কিট ও আইওটি নোড",
    description: "কারিগরি শিক্ষার সার্কিট ট্র্যাক ও পালসিং নোড",
  },
  {
    id: "gears",
    name: "Animated Technical Gears",
    nameBangla: "ঘূর্ণায়মান টেকনিক্যাল গিয়ার",
    description: "প্রকৌশল ও কারিগরি শিক্ষার গিয়ার মেকানিজম",
  },
  {
    id: "guilloche",
    name: "Guilloche Banknote Rosettes",
    nameBangla: "গিলোচে সিকিউরিটি রিং",
    description: "অফিসিয়াল সার্টিফিকেট ও ব্যাংকনোটের সিকিউরিটি রিং",
  },
  {
    id: "hex_grid",
    name: "Technical Hexagon Grid",
    nameBangla: "টেকনিক্যাল হেক্সাগন গ্রিড",
    description: "ন্যানো-টেকনোলজি ও মাইক্রোপ্রসেসর আর্কিটেকচার",
  },
  {
    id: "waves",
    name: "Dynamic Fluid Waves",
    nameBangla: "ডায়নামিক ফ্লুইড ওয়েভস",
    description: "প্রিমিয়াম মসৃণ রঙিন তরঙ্গের বিচ্ছুরণ",
  },
  {
    id: "micro_dots",
    name: "Micro-Dot Matrix",
    nameBangla: "মাইক্রো-ডট ম্যাট্রিক্স",
    description: "ডিজিটাল সিকিউরিটি ও টেকনিক্যাল ডট প্যাটার্ন",
  },
];

interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemeMode;
  themeColor: ThemeColor;
  bgVector: BackgroundVector;
  iconTheme: IconThemeId;
  iconAnimation: IconAnimationLevel;
  toggleMode: () => void;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
  setBgVector: (vector: BackgroundVector) => void;
  setIconTheme: (themeId: IconThemeId) => void;
  setIconAnimation: (anim: IconAnimationLevel) => void;
  currentTheme: ProjectThemeConfig;
  currentIconTheme: IconThemeOption;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("pgtsc_theme_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("pgtsc_theme_change", callback);
  };
}

function getModeSnapshot(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const savedMode = localStorage.getItem("pgtsc_theme_mode") as ThemeMode;
    if (savedMode === "light" || savedMode === "dark") return savedMode;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {}
  return "light";
}

function getThemeColorSnapshot(): ThemeColor {
  if (typeof window === "undefined") return "navy";
  try {
    const savedColor = localStorage.getItem("pgtsc_theme_color") as ThemeColor;
    if (savedColor && PROJECT_THEMES.some((t) => t.id === savedColor)) return savedColor;
  } catch {}
  return "navy";
}

function getBgVectorSnapshot(): BackgroundVector {
  if (typeof window === "undefined") return "circuit";
  try {
    const savedVector = localStorage.getItem("pgtsc_bg_vector") as BackgroundVector;
    if (savedVector && BG_VECTOR_OPTIONS.some((v) => v.id === savedVector)) return savedVector;
  } catch {}
  return "circuit";
}

function getIconThemeSnapshot(): IconThemeId {
  if (typeof window === "undefined") return "rainbow";
  try {
    const savedIconTheme = localStorage.getItem("pgtsc_icon_theme") as IconThemeId;
    if (savedIconTheme && ICON_THEME_OPTIONS.some((t) => t.id === savedIconTheme)) return savedIconTheme;
  } catch {}
  return "rainbow";
}

function getIconAnimSnapshot(): IconAnimationLevel {
  if (typeof window === "undefined") return "vibrant";
  try {
    const savedAnim = localStorage.getItem("pgtsc_icon_animation") as IconAnimationLevel;
    if (savedAnim === "vibrant" || savedAnim === "subtle" || savedAnim === "none") return savedAnim;
  } catch {}
  return "vibrant";
}

function getServerModeSnapshot(): ThemeMode {
  return "light";
}
function getServerThemeColorSnapshot(): ThemeColor {
  return "navy";
}
function getServerBgVectorSnapshot(): BackgroundVector {
  return "circuit";
}
function getServerIconThemeSnapshot(): IconThemeId {
  return "rainbow";
}
function getServerIconAnimSnapshot(): IconAnimationLevel {
  return "vibrant";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribeTheme, getModeSnapshot, getServerModeSnapshot);
  const themeColor = useSyncExternalStore(subscribeTheme, getThemeColorSnapshot, getServerThemeColorSnapshot);
  const bgVector = useSyncExternalStore(subscribeTheme, getBgVectorSnapshot, getServerBgVectorSnapshot);
  const iconTheme = useSyncExternalStore(subscribeTheme, getIconThemeSnapshot, getServerIconThemeSnapshot);
  const iconAnimation = useSyncExternalStore(subscribeTheme, getIconAnimSnapshot, getServerIconAnimSnapshot);

  const applyModeToDom = (m: ThemeMode) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const body = document.body;
    if (m === "dark") {
      root.classList.add("dark");
      if (body) body.classList.add("dark");
      root.setAttribute("data-mode", "dark");
      if (body) body.setAttribute("data-mode", "dark");
    } else {
      root.classList.remove("dark");
      if (body) body.classList.remove("dark");
      root.setAttribute("data-mode", "light");
      if (body) body.setAttribute("data-mode", "light");
    }
  };

  useEffect(() => {
    try {
      applyModeToDom(mode);

      const theme = PROJECT_THEMES.find((t) => t.id === themeColor) || PROJECT_THEMES[0];
      const body = document.body;
      const root = document.documentElement;
      if (body) {
        body.style.setProperty("--pgtsc-primary", theme.primaryColor);
        body.style.setProperty("--pgtsc-accent", theme.accentColor);
      }
      root.setAttribute("data-theme-color", themeColor);
      root.setAttribute("data-bg-vector", bgVector);
      root.setAttribute("data-icon-theme", iconTheme);
      root.setAttribute("data-icon-anim", iconAnimation);
    } catch (err) {
      console.error("Theme apply error:", err);
    }
  }, [mode, themeColor, bgVector, iconTheme, iconAnimation]);

  const toggleMode = () => {
    const current = getModeSnapshot();
    const next: ThemeMode = current === "light" ? "dark" : "light";
    applyModeToDom(next);
    try {
      localStorage.setItem("pgtsc_theme_mode", next);
      window.dispatchEvent(new Event("pgtsc_theme_change"));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const setMode = (m: ThemeMode) => {
    applyModeToDom(m);
    try {
      localStorage.setItem("pgtsc_theme_mode", m);
      window.dispatchEvent(new Event("pgtsc_theme_change"));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const setThemeColor = (c: ThemeColor) => {
    try {
      localStorage.setItem("pgtsc_theme_color", c);
      window.dispatchEvent(new Event("pgtsc_theme_change"));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const setBgVector = (v: BackgroundVector) => {
    try {
      localStorage.setItem("pgtsc_bg_vector", v);
      window.dispatchEvent(new Event("pgtsc_theme_change"));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const setIconTheme = (t: IconThemeId) => {
    try {
      localStorage.setItem("pgtsc_icon_theme", t);
      window.dispatchEvent(new Event("pgtsc_theme_change"));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const setIconAnimation = (a: IconAnimationLevel) => {
    try {
      localStorage.setItem("pgtsc_icon_animation", a);
      window.dispatchEvent(new Event("pgtsc_theme_change"));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const currentTheme = PROJECT_THEMES.find((t) => t.id === themeColor) || PROJECT_THEMES[0];
  const currentIconTheme = ICON_THEME_OPTIONS.find((t) => t.id === iconTheme) || ICON_THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: mode,
        themeColor,
        bgVector,
        iconTheme,
        iconAnimation,
        toggleMode,
        toggleTheme: toggleMode,
        setMode,
        setThemeColor,
        setBgVector,
        setIconTheme,
        setIconAnimation,
        currentTheme,
        currentIconTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
