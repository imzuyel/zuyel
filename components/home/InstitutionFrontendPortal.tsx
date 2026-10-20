"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  School,
  Users,
  Image as ImageIcon,
  Bell,
  Award,
  Sparkles,
  Compass,
  GraduationCap,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Flame,
  Calendar,
  Layers,
  ArrowRight,
  ChevronRight,
  Download,
  FileText
} from "lucide-react";
import CampusAboutView from "./CampusAboutView";
import FacultyStaffView from "./FacultyStaffView";
import PhotoGalleryView from "./PhotoGalleryView";
import PublicNoticeBoard from "./PublicNoticeBoard";
import PublicDownloadsHub from "./PublicDownloadsHub";
import PublicResultPortal from "@/components/results/PublicResultPortal";
import { StudentJoinContentComponent } from "@/components/quiz/StudentJoinContentComponent";

// Static pure particle definitions to satisfy strict eslint rules
const STATIC_PARTICLES = [
  { size: 6, delay: 0, duration: 12, left: "12%", top: "25%" },
  { size: 4, delay: 1, duration: 15, left: "34%", top: "65%" },
  { size: 8, delay: 2, duration: 10, left: "56%", top: "15%" },
  { size: 5, delay: 0.5, duration: 18, left: "78%", top: "85%" },
  { size: 7, delay: 1.5, duration: 14, left: "90%", top: "45%" },
  { size: 4, delay: 3, duration: 16, left: "23%", top: "55%" },
  { size: 6, delay: 2.5, duration: 13, left: "45%", top: "75%" },
  { size: 5, delay: 4, duration: 17, left: "67%", top: "35%" }
];

function FloatingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {STATIC_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.1, left: p.left, top: p.top }}
          animate={{
            y: [0, -25, 0],
            x: [0, 10, 0],
            opacity: [0.1, 0.4, 0.1]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute rounded-full bg-cyan-500/30"
          style={{
            width: p.size,
            height: p.size,
            filter: "blur(0.5px)"
          }}
        />
      ))}
    </div>
  );
}

function TechGrid() {
  return (
    <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none z-0">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="1" className="text-white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
    </div>
  );
}

function TechLine() {
  return (
    <div className="relative w-full py-4 flex items-center justify-center select-none overflow-hidden my-2">
      {/* Base Circuit Line */}
      <div className="relative w-full h-[1px] bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent">
        {/* Subtle Tech Glow Base */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/30 dark:via-cyan-400/40 to-transparent" />

        {/* Micro Circuit Nodes */}
        <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-cyan-400/60 shadow-[0_0_4px_#22d3ee]" />
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-cyan-400/60 shadow-[0_0_4px_#22d3ee]" />

        {/* Periodic Electric Current / Lightning Pulse */}
        <motion.div
          animate={{
            x: ["-100%", "250%"],
            opacity: [0, 0.2, 1, 1, 0.4, 0],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            repeatDelay: 3.2,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 -translate-y-1/2 w-36 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-white dark:via-cyan-300 dark:to-white shadow-[0_0_10px_#22d3ee,0_0_18px_#06b6d4]"
        >
          {/* Spark Head */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#ffffff,0_0_12px_#38bdf8,0_0_20px_#06b6d4]" />
        </motion.div>
      </div>
    </div>
  );
}

export default function InstitutionFrontendPortal() {
  const [activePortalTab, setActivePortalTab] = useState<string>("home");
  const [cmsConfig, setCmsConfig] = useState<any>(null);
  const [urgentNotice, setUrgentNotice] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load CMS settings and latest notices
    const loadPortalData = async () => {
      try {
        const [cmsRes, noticeRes] = await Promise.all([
          fetch("/api/cms"),
          fetch("/api/notices")
        ]);

        const [cmsData, noticeData] = await Promise.all([
          cmsRes.json(),
          noticeRes.json()
        ]);

        if (cmsData.success) {
          setCmsConfig(cmsData.config);
        }
        if (noticeData.success && noticeData.items) {
          const urgent = noticeData.items.find((n: any) => n.isUrgent) || noticeData.items[0];
          setUrgentNotice(urgent);
        }
      } catch (err) {
        console.error("Error loading portal datasets:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPortalData();
  }, []);

  // Standard Fallback configurations if CMS isn't fully loaded
  const banner = cmsConfig?.heroBanner || {
    title: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
    subtitle: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • কারিগরি শিক্ষা অধিদপ্তর",
    description: "কারিগরি শিক্ষা গ্রহণ করি, সমৃদ্ধ বাংলাদেশ গড়ি। একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবিলায় আধুনিক ল্যাব, দক্ষ শিক্ষক এবং কর্মমুখী শিক্ষায় উৎকর্ষ সাধনে আমরা বদ্ধপরিকর।",
    buttonText: "🚀 লাইভ কুইজে অংশগ্রহণ করুন (Live Quiz)",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80"
  };

  const principal = cmsConfig?.principal || {
    name: "প্রকৌ. মো. রফিকুল ইসলাম",
    designation: "অধ্যক্ষ",
    message: "কারিগরি শিক্ষা জাতির মেরুদণ্ড। আমরা আমাদের সর্বাত্মক প্রচেষ্টা দিয়ে শিক্ষার্থীদেরকে দক্ষ জনশক্তিতে রূপান্তর করতে প্রতিশ্রুতিবদ্ধ।",
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80"
  };

  const sections = cmsConfig?.sectionsVisibility || {
    hero: true,
    ticker: true,
    stats: true,
    intro: true,
    principalMessage: true,
    featuredNotices: true,
    upcomingEvents: true,
    trades: true,
    results: true,
    galleryPreview: true,
    quickLinks: true,
    contact: true
  };

  return (
    <div className="pb-16 space-y-4 sm:space-y-6">
      
      {/* 0. URGENT ANNOUNCEMENT TICKER - Compact and sits nicely right below header */}
      {sections.ticker && urgentNotice && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl px-3.5 sm:px-4 py-2 flex items-center gap-2.5 sm:gap-3 text-xs text-amber-800 dark:text-amber-300 shadow-xs -mb-2">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider shrink-0 bg-amber-500 text-slate-950 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] shadow-[0_0_10px_rgba(245,158,11,0.5)]">
            <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
            <span>জরুরি ঘোষণা</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap w-full">
            <p className="animate-pulse font-bold text-slate-900 dark:text-slate-100 truncate text-[11px] sm:text-xs">
              {urgentNotice.titleBangla || urgentNotice.content} ({urgentNotice.publishedAt})
            </p>
          </div>
        </div>
      )}

      {/* 1. HERO BANNER & MAIN FRONTEND HEADER */}
      {sections.hero && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 sm:p-10 text-white shadow-2xl border border-indigo-950 flex flex-col justify-center min-h-[350px]"
          style={{
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.92), rgba(30, 27, 75, 0.96)), url(${banner.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Interactive Particle Atmosphere & Sci-Fi Tech Grid */}
          <TechGrid />
          <FloatingParticles />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-5 max-w-2xl text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>{banner.subtitle || "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • কারিগরি শিক্ষা অধিদপ্তর"}</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-snug text-white"
              >
                {banner.title}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal"
              >
                {banner.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2"
              >
                <button
                  onClick={() => setActivePortalTab("live_quiz")}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition-all shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-2 cursor-pointer transform hover:scale-105"
                >
                  <Award className="w-4 h-4" />
                  <span>🚀 লাইভ কুইজে অংশগ্রহণ করুন (Live Quiz)</span>
                </button>

                <button
                  onClick={() => setActivePortalTab("about")}
                  className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md shadow-sm"
                >
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>প্রতিষ্ঠান পরিচিতি</span>
                </button>
              </motion.div>
            </div>

            {/* Quick Stats Card with Tech-Glow Hover and Slide Entrance */}
            {sections.stats && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="w-full lg:w-auto bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4 min-w-[280px] hover:border-cyan-500/35 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">
                    অফিশিয়াল তথ্য
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">EIIN কোড:</span>
                    <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md">132244</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">স্থাপিত সাল:</span>
                    <span className="font-mono font-bold text-white">১৯৯৯ খ্রিষ্টাব্দ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">ক্যাম্পাস এলাকা:</span>
                    <span className="font-mono font-bold text-emerald-400">১৪৭.৫ শতাংশ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">প্রধান অধ্যক্ষ:</span>
                    <span className="font-bold text-cyan-300">{principal.name}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* 2. PUBLIC FRONTEND NAVIGATION BAR */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto sticky top-4 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
        {[
          { id: "home", label: "হোম ও ঘোষণা", icon: School },
          { id: "about", label: "পরিচিতি ও ইতিহাস", icon: Compass },
          { id: "faculty", label: "কর্মকর্তা ও শিক্ষকবৃন্দ", icon: Users },
          { id: "gallery", label: "গ্যালারি ও ক্যাম্পাস", icon: ImageIcon },
          { id: "notices", label: "নোটিশ বোর্ড", icon: Bell },
          { id: "results", label: "পরীক্ষার ফলাফল", icon: GraduationCap },
          { id: "downloads", label: "সিলেবাস ও ডাউনলোড", icon: FileText },
          { id: "live_quiz", label: "লাইভ কুইজ পোর্টাল", icon: Award, highlight: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activePortalTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActivePortalTab(tab.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? tab.highlight
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    : "bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  : tab.highlight
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT VIEWS (ANIMATED TRANSITIONS) */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePortalTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activePortalTab === "home" && (
              <div className="space-y-8">
                
                {/* Featured Quick Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    onClick={() => setActivePortalTab("live_quiz")}
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="group p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900 border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer space-y-3.5 shadow-xs hover:shadow-emerald-500/10"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors">
                      🎮 লাইভ কুইজ প্রতিযোগিতা
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      শিক্ষকের দেওয়া ৬-সংখ্যার পিন কোড দিয়ে সরাসরি লাইভ কুইজ প্রতিযোগিতায় অংশগ্রহণ করুন ও র‍্যাংক দেখুন।
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 pt-1">
                      <span>কুইজে প্রবেশ করুন</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>

                  <motion.div
                    onClick={() => setActivePortalTab("notices")}
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer space-y-3.5 shadow-xs hover:shadow-indigo-500/10"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                      <Bell className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">
                      📢 নোটিশ ও ঘোষণা বোর্ড
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      সকল একাডেমিক নোটিশ, পরীক্ষার রুটিন, ছুটির ঘোষণা এবং জরুরি নির্দেশনা একসাথে দেখুন।
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 pt-1">
                      <span>নোটিশ দেখুন</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>

                  <motion.div
                    onClick={() => setActivePortalTab("results")}
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer space-y-3.5 shadow-xs hover:shadow-blue-500/10"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors">
                      🎓 পরীক্ষার ফলাফল পোর্টাল
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      সেমিস্টার ও বার্ষিক পরীক্ষার গ্রেড শিট, মার্কশিট ও ফলাফল অনলাইনে অনুসন্ধান করুন।
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-blue-500 pt-1">
                      <span>ফলাফল যাচাই করুন</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </div>

                {/* Principal Message Section (Live CMS Driven with TechLine) */}
                {sections.principalMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-center hover:border-cyan-500/30 transition-colors group"
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-md shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-950 transition-transform duration-300 group-hover:scale-105">
                      <img
                        src={principal.photoUrl}
                        alt={principal.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-2 text-center md:text-left flex-1">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider block">
                        প্রতিষ্ঠানের বাণী
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {principal.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                        {principal.designation}, পঞ্চগড় সরকারি টিএসসি
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal italic pt-1 relative">
                        &ldquo;{principal.message}&rdquo;
                      </p>
                    </div>
                  </motion.div>
                )}

                <TechLine />

                {/* About Preview embedded on Home */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="bg-slate-50 dark:bg-slate-900/30 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800"
                >
                  <CampusAboutView />
                </motion.div>
              </div>
            )}

            {activePortalTab === "about" && <CampusAboutView />}
            {activePortalTab === "faculty" && <FacultyStaffView />}
            {activePortalTab === "gallery" && <PhotoGalleryView />}
            {activePortalTab === "notices" && <PublicNoticeBoard />}
            {activePortalTab === "results" && <PublicResultPortal />}
            {activePortalTab === "downloads" && <PublicDownloadsHub />}
            {activePortalTab === "live_quiz" && <StudentJoinContentComponent />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. PROFESSIONAL INSTITUTION FOOTER */}
      <footer className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-slate-600 dark:text-slate-400">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              🏫
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ</h4>
          </div>
          <p className="leading-relaxed">
            কারিগরি শিক্ষায় উন্নত জাতি গঠনে প্রতিশ্রুতিবদ্ধ। বাংলাদেশ কারিগরি শিক্ষা বোর্ডের অধীনে পরিচালিত একটি সরকারি শিক্ষা প্রতিষ্ঠান।
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3">যোগাযোগের ঠিকানা</h4>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>পঞ্চগড় সদর, পঞ্চগড় - ৫০০০, বাংলাদেশ</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>+৮৮০ ৫৬৮১-XXXXX</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>info@pstsc.edu.bd</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">দরকারি লিংক</h4>
          <div className="flex flex-col space-y-1.5 font-medium">
            <a href="https://bteb.gov.bd" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
              • বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)
            </a>
            <a href="https://moedu.gov.bd" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
              • শিক্ষা মন্ত্রণালয়
            </a>
            <a href="https://dte.gov.bd" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
              • কারিগরি শিক্ষা অধিদপ্তর (DTE)
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
