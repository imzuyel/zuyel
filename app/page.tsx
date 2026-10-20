"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  School,
  Award,
  Bell,
  GraduationCap,
  Sparkles,
  Compass,
  Layers,
  ChevronRight,
  ArrowRight,
  Flame,
  Calendar,
  Users,
  MapPin,
  Cpu,
  Wifi,
  Zap,
  Scissors,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Phone,
  Clock,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { safeFetchJson } from "@/lib/safeFetch";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import StudentQuickQuizPopup from "@/components/quiz/StudentQuickQuizPopup";
import HeroTechVisual from "@/components/home/HeroTechVisual";
import InteractiveCampusMap from "@/components/home/InteractiveCampusMap";
import {
  GlowCard,
  AnimatedCounter,
  AnimatedBorder,
  GlowButton,
  AnimatedIcon,
  GradientText,
  AnimatedBackground,
  BorderGlowCard,
  AOSReveal,
  StaggerContainer,
  StaggerItem,
  ParallaxElement,
  ScrollGlowReveal,
  CyberHeaderDecoration,
  CyberBadge,
} from "@/components/ui/animation-effects";
import {
  InstitutionTechnicalSealSVG,
  StudentAchievementTrophySVG,
} from "@/components/ui/animated-svgs";
import {
  NoticeCardSkeleton,
  GalleryGridSkeleton,
} from "@/components/ui/SkeletonScreens";

export default function HomePage() {
  const [cmsConfig, setCmsConfig] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [urgentNotice, setUrgentNotice] = useState<any>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 1250,
    teachers: 42,
    trades: 4,
    labs: 9,
    passRate: "98.6%"
  });

  useEffect(() => {
    // Fetch CMS settings
    safeFetchJson("/api/cms").then((data) => {
      if (data.success && data.config) {
        setCmsConfig(data.config);
      }
    });

    // Fetch latest notices
    safeFetchJson("/api/notices")
      .then((data) => {
        if (data.success && data.items) {
          setNotices(data.items.slice(0, 4));
          const urgent = data.items.find((n: any) => n.isUrgent);
          if (urgent) setUrgentNotice(urgent);
          else if (data.items.length > 0) setUrgentNotice(data.items[0]);
        }
      })
      .finally(() => setNoticesLoading(false));

    // Fetch gallery items
    safeFetchJson("/api/gallery")
      .then((data) => {
        if (data.success && data.items) {
          setGalleryItems(data.items.slice(0, 6));
        }
      })
      .finally(() => setGalleryLoading(false));
  }, []);

  const banner = cmsConfig?.heroBanner || {
    title: "কারিগরি শিক্ষা গ্রহণ করি, সমৃদ্ধ বাংলাদেশ গড়ি",
    subtitle: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • কারিগরি শিক্ষা অধিদপ্তর",
    description:
      "একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবিলায় আধুনিক ল্যাব, দক্ষ শিক্ষক এবং কর্মমুখী শিক্ষায় উৎকর্ষ সাধনে আমরা বদ্ধপরিকর। জ্ঞান, দক্ষতা ও কর্মসংস্থানই আমাদের মূল ভিত্তি।",
    buttonText: "🚀 লাইভ কুইজে অংশগ্রহণ করুন",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80",
    heroSlides: [
      "কারিগরি শিক্ষায় গড়ব দেশ, স্মার্ট বাংলাদেশ গড়ার প্রত্যয়",
      "দক্ষ হাত, বিশ্বজুড়ে কর্মসংস্থান—কারিগরি শিক্ষার মূল অবদান",
      "৪র্থ শিল্পবিপ্লবের চ্যালেঞ্জ মোকাবিলায় আধুনিক কারিগরি ও আইওটি শিক্ষা",
      "পড়াশোনার পাশাপাশি বাস্তবমুখী প্রশিক্ষণ, আত্মনির্ভরশীল ভবিষ্যৎ",
      "নারী-পুরুষ নির্বিশেষে কারিগরি শিক্ষা, সমৃদ্ধ অর্থনীতির চাবিকাঠি"
    ]
  };

  const slides = banner.heroSlides || [
    "কারিগরি শিক্ষায় গড়ব দেশ, স্মার্ট বাংলাদেশ গড়ার প্রত্যয়",
    "দক্ষ হাত, বিশ্বজুড়ে কর্মসংস্থান—কারিগরি শিক্ষার মূল অবদান",
    "৪র্থ শিল্পবিপ্লবের চ্যালেঞ্জ মোকাবিলায় আধুনিক কারিগরি ও আইওটি শিক্ষা",
    "পড়াশোনার পাশাপাশি বাস্তবমুখী প্রশিক্ষণ, আত্মনির্ভরশীল ভবিষ্যৎ",
    "নারী-পুরুষ নির্বিশেষে কারিগরি শিক্ষা, সমৃদ্ধ অর্থনীতির চাবিকাঠি"
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const principal = cmsConfig?.principal || {
    name: "প্রকৌ. মো. রফিকুল ইসলাম",
    designation: "অধ্যক্ষ (ভারপ্রাপ্ত)",
    message:
      "কারিগরি শিক্ষা জাতির মেরুদণ্ড। পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ ১৯৯৯ সাল থেকে উত্তরবঙ্গের সীমান্তবর্তী এই জনপদে কারিগরি ও বৃত্তিমূলক শিক্ষার আলো ছড়িয়ে আসছে। আমরা শিক্ষার্থীদের আধুনিক কর্মমুখী শিক্ষায় যোগ্য করে তুলতে প্রতিশ্রুতিবদ্ধ।",
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PublicHeader />
      <StudentQuickQuizPopup />

      {/* 1. URGENT NOTIFICATION TICKER - Compact and sits directly below header */}
      {urgentNotice && (
        <div className="w-full bg-slate-50 dark:bg-slate-950 py-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
            <AnimatedBorder variant="amber" speed="normal" className="shadow-xs">
              <div className="bg-amber-500/10 dark:bg-amber-950/40 px-3 sm:px-4 py-2 flex items-center gap-2.5 sm:gap-3 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider shrink-0 bg-amber-500 text-slate-950 px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] shadow-xs">
                  <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current animate-bounce" />
                  <span>জরুরি নোটিশ</span>
                </div>
                <div className="overflow-hidden whitespace-nowrap w-full">
                  <Link
                    href={`/notices/${urgentNotice.id}`}
                    className="font-bold hover:underline truncate block text-[11px] sm:text-xs"
                  >
                    {urgentNotice.titleBangla || urgentNotice.content} ({urgentNotice.publishedAt})
                  </Link>
                </div>
                <Link
                  href="/notices"
                  className="shrink-0 text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-0.5"
                >
                  <span className="hidden xs:inline">সব নোটিশ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </AnimatedBorder>
          </div>
        </div>
      )}

      <main className="flex-1 space-y-6 lg:space-y-10 pb-12 sm:pb-16">
        
        {/* 2. ANIMATED GLOW COLORFUL HERO SECTION WITH AOS REVEAL & ZERO EXCESSIVE MOBILE GAP */}
        <section className="relative overflow-hidden bg-slate-950 text-white pt-4 sm:pt-6 lg:pt-8 pb-6 sm:pb-10 lg:pb-16 border-b border-indigo-900/40">
          {/* Ambient Multi-Color Animated Glowing Orbs */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/20 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-64 sm:w-[28rem] h-64 sm:h-[28rem] bg-purple-600/25 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none animate-pulse delay-1000" />
          <div className="absolute top-1/3 right-10 w-56 sm:w-80 h-56 sm:h-80 bg-pink-500/20 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none animate-pulse delay-700" />
          <div className="absolute bottom-1/4 left-10 w-56 sm:w-72 h-56 sm:h-72 bg-emerald-500/20 rounded-full blur-[80px] sm:blur-[110px] pointer-events-none animate-pulse delay-500" />

          <AnimatedBackground variant="tech-grid" className="w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-10 items-center">
                
                {/* Left Column: Headlines & CTAs */}
                <div className="lg:col-span-7 space-y-3 sm:space-y-4 lg:space-y-6 text-center lg:text-left">
                  {/* Animated Badge with Conic Light Border and AOS Reveal */}
                  <AOSReveal animation="fade-down" delay={0.05} duration={0.45}>
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/40 text-cyan-300 text-[11px] sm:text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md hover:border-cyan-400 transition-all duration-300 cursor-default">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                      <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent font-extrabold">
                        {banner.subtitle}
                      </span>
                    </div>
                  </AOSReveal>

                  {/* Hero Main Headline with Vivid Animated Moving Gradient Text and AOS Reveal */}
                  <AOSReveal animation="fade-up" delay={0.1} duration={0.5}>
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-tight">
                      <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 via-purple-300 via-pink-300 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(168,85,247,0.45)] animate-moving-gradient block">
                        {banner.title}
                      </span>
                    </h1>
                  </AOSReveal>

                  {/* PREMIUM HIGHLY POLISHED SLOGAN TEXT CAROUSEL / SLIDER */}
                  <AOSReveal animation="fade-up" delay={0.15} duration={0.5}>
                    <div className="relative overflow-hidden bg-slate-900/60 dark:bg-slate-950/45 border border-cyan-500/25 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md max-w-2xl mx-auto lg:mx-0">
                      <div className="relative min-h-[48px] flex items-center justify-center lg:justify-start">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                            className="text-xs sm:text-sm lg:text-base font-black text-cyan-300 dark:text-cyan-200 tracking-wide text-center lg:text-left flex items-center gap-2"
                          >
                            <span className="text-emerald-400">⚡</span>
                            <span>{slides[currentSlide]}</span>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Slider Navigation & Indicators */}
                      <div className="flex items-center justify-center lg:justify-start gap-4 mt-3 pt-3 border-t border-slate-800/80">
                        <div className="flex gap-1">
                          {slides.map((_: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentSlide(idx)}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                idx === currentSlide
                                  ? "w-6 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                                  : "w-1.5 bg-slate-700 hover:bg-slate-500"
                              }`}
                              title={`Slide ${idx + 1}`}
                            />
                          ))}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider font-bold">
                          {(currentSlide + 1).toString().padStart(2, '0')} / {slides.length.toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  </AOSReveal>

                  {/* Hero Description with Neon Accent Highlights and AOS Reveal */}
                  <AOSReveal animation="fade-up" delay={0.18} duration={0.5}>
                    <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                      {banner.description}
                    </p>
                  </AOSReveal>

                  {/* Glowing Colorful CTA Buttons with AOS Reveal & Smooth CSS Transitions */}
                  <AOSReveal animation="fade-up" delay={0.25} duration={0.5}>
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3.5 pt-1 sm:pt-2">
                      <Link
                        href="/learning"
                        className="px-4.5 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-xs sm:text-sm transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.55)] hover:shadow-[0_0_40px_rgba(6,182,212,0.8)] flex items-center gap-2 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 shine-effect"
                      >
                        <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-300 animate-spin" />
                        <span>📚 বিষয় ও লার্নিং প্ল্যাটফর্ম</span>
                      </Link>

                      <Link
                        href="/quiz/join"
                        className="px-4.5 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.55)] hover:shadow-[0_0_40px_rgba(6,182,212,0.8)] flex items-center gap-2 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 shine-effect"
                      >
                        <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        <span>🚀 লাইভ কুইজ প্রতিযোগিতা</span>
                      </Link>

                      <Link
                        href="/academic"
                        className="px-4 sm:px-5.5 py-2.5 sm:py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-cyan-500/40 hover:border-cyan-400 text-white font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.45)] transform hover:-translate-y-0.5 hover:scale-[1.02]"
                      >
                        <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-400" />
                        <span>একাডেমিক কাঠামো</span>
                      </Link>

                      <Link
                        href="/results"
                        className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 hover:border-purple-400 text-purple-200 font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_30px_rgba(168,85,247,0.45)] transform hover:-translate-y-0.5 hover:scale-[1.02]"
                      >
                        <GraduationCap className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-300" />
                        <span>ফলাফল অনুসন্ধান</span>
                      </Link>
                    </div>
                  </AOSReveal>

                  {/* Micro Info Badges with Glowing Dot Indicator and AOS Reveal */}
                  <AOSReveal animation="fade-up" delay={0.32} duration={0.5}>
                    <div className="pt-2 sm:pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-300 font-mono">
                      <div className="px-2.5 sm:px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 flex items-center gap-1.5 sm:gap-2 shadow-xs transition-transform duration-200 hover:scale-105">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>EIIN: <strong className="text-cyan-300">132244</strong></span>
                      </div>
                      <div className="px-2.5 sm:px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 flex items-center gap-1.5 sm:gap-2 shadow-xs transition-transform duration-200 hover:scale-105">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        <span>প্রতিষ্ঠিত: <strong className="text-purple-300">১৯৯৯ খ্রিষ্টাব্দ</strong></span>
                      </div>
                      <div className="px-2.5 sm:px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 flex items-center gap-1.5 sm:gap-2 shadow-xs transition-transform duration-200 hover:scale-105">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>ক্যাম্পাস: <strong className="text-emerald-300">১৪৭.৫ শতাংশ</strong></span>
                      </div>
                    </div>
                  </AOSReveal>
                </div>

                {/* Right Column: Hero Vector & Technical Visual with AOS Reveal */}
                <div className="lg:col-span-5 flex items-center justify-center relative mt-2 lg:mt-0">
                  <AOSReveal animation="zoom-in" delay={0.15} duration={0.6} className="w-full">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl animate-pulse" />
                      <div className="relative z-10 w-full transition-transform duration-500 hover:scale-105">
                        <HeroTechVisual />
                      </div>
                    </div>
                  </AOSReveal>
                </div>

              </div>
            </motion.div>
          </AnimatedBackground>
        </section>

        {/* 3. KEY INSTITUTIONAL HIGHLIGHTS & STATS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer staggerDelay={0.08} className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "মোট শিক্ষার্থী", num: 1250, suffix: "+", icon: Users, variant: "cyan" as const, color: "text-cyan-500" },
              { label: "দক্ষ শিক্ষক ও কর্মকর্তা", num: 42, suffix: " জন", icon: Award, variant: "indigo" as const, color: "text-indigo-500" },
              { label: "কারিগরি ট্রেড", num: 4, suffix: "টি", icon: Cpu, variant: "emerald" as const, color: "text-emerald-500" },
              { label: "ব্যবহারিক ল্যাব ও ওয়ার্কশপ", num: 13, suffix: "টি", icon: Layers, variant: "amber" as const, color: "text-amber-500" },
              { label: "বোর্ড পাসের হার", num: 98.6, decimals: 1, suffix: "%", icon: CheckCircle2, variant: "teal" as const, color: "text-teal-500" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <StaggerItem key={i} animation="fade-up">
                  <GlowCard
                    variant={stat.variant}
                    intensity="medium"
                    animatedBorder="hover"
                    shineSweep={true}
                    className="p-5 flex flex-col items-center text-center space-y-2 h-full"
                  >
                    <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 ${stat.color} shadow-xs`}>
                      <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                      <AnimatedCounter
                        value={stat.num}
                        suffix={stat.suffix}
                        decimals={stat.decimals || 0}
                        isBengali={true}
                      />
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {stat.label}
                    </span>
                  </GlowCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>

        {/* 4. QUICK ACCESS SERVICES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AOSReveal animation="fade-up" duration={0.5} className="text-center space-y-2 mb-8">
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
              সেবাসমূহ ও পোর্টাল
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              দ্রুত প্রবেশযোগ্য ই-সেবা
            </h2>
          </AOSReveal>

          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: "অনলাইন নোটিশ বোর্ড",
                description: "সকল প্রাতিষ্ঠানিক প্রজ্ঞাপন, ছুটির নোটিশ ও জরুরি নির্দেশিকা।",
                href: "/notices",
                icon: Bell,
                gradient: "from-blue-600 to-indigo-700",
                buttonText: "নোটিশ দেখুন",
                variant: "indigo" as const,
              },
              {
                title: "ফলাফল অনুসন্ধান",
                description: "সেমিস্টার ও বার্ষিক পরীক্ষার মার্কশিট, গ্রেডশিট ও ফলাফল যাচাই।",
                href: "/results",
                icon: GraduationCap,
                gradient: "from-indigo-600 to-purple-700",
                buttonText: "ফলাফল দেখুন",
                variant: "purple" as const,
              },
              {
                title: "লাইভ কুইজ পোর্টাল",
                description: "৬-সংখ্যার পিন দিয়ে সরাসরি লাইভ কুইজ প্রতিযোগিতায় অংশগ্রহণ।",
                href: "/quiz/join",
                icon: Award,
                gradient: "from-emerald-500 to-teal-600",
                buttonText: "কুইজে প্রবেশ",
                highlight: true,
                variant: "emerald" as const,
              },
              {
                title: "ডাউনলোড হাব",
                description: "ভোকেশনাল সিলেবাস, একাডেমিক ক্যালেন্ডার ও ভর্তি ফরম সংগ্রহ।",
                href: "/downloads",
                icon: Download,
                gradient: "from-amber-500 to-orange-600",
                buttonText: "ডাউনলোড করুন",
                variant: "amber" as const,
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <StaggerItem key={i} animation="zoom-in">
                  <GlowCard
                    variant={card.variant}
                    intensity={card.highlight ? "strong" : "medium"}
                    animatedBorder="hover"
                    shineSweep={true}
                    className="p-6 flex flex-col justify-between space-y-4 h-full"
                  >
                    <Link href={card.href} className="flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.gradient} flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                          {card.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-cyan-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>{card.buttonText}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </GlowCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>

        {/* 5. ACADEMIC TRADES & PROGRAMS SHOWCASE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AOSReveal animation="fade-up" duration={0.6}>
            <div className="bg-white dark:bg-slate-900/70 p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 relative">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-widest">
                      কারিগরি ট্রেড ও ল্যাব
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    ৪টি বিশেষায়িত কারিগরি শিক্ষা শাখা
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ৯ম ও ১০ম শ্রেণিতে এসএসসি (ভোকেশনাল) এবং ১১শ ও ১২শ শ্রেণিতে এইচএসসি (ভোকেশনাল) কোর্স পরিচালিত হয়।
                  </p>
                </div>

                <Link
                  href="/academic"
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>বিস্তারিত কাঠামো দেখুন</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    code: "GE",
                    name: "জেনারেল ইলেকট্রনিক্স",
                    nameEn: "General Electronics",
                    desc: "অ্যানালগ ও ডিজিটাল ইলেকট্রনিক্স, মাইক্রোকন্ট্রোলার ও অটোমেশন প্রযুক্তি।",
                    labs: "২টি অত্যাধুনিক ল্যাব",
                    icon: Cpu,
                    gradient: "from-blue-600 to-indigo-700",
                    variant: "indigo" as const,
                  },
                  {
                    code: "IT-IoT",
                    name: "আইটি সাপোর্ট অ্যান্ড আইওটি",
                    nameEn: "IT Support & IoT Basics",
                    desc: "কম্পিউটার হার্ডওয়্যার, নেটওয়ার্কিং, ইন্টারনেট অফ থিংস ও স্মার্ট সেন্সর।",
                    labs: "৩টি হাই-স্পিড কম্পিউটার ল্যাব",
                    icon: Wifi,
                    gradient: "from-cyan-500 to-blue-600",
                    variant: "cyan" as const,
                  },
                  {
                    code: "EE",
                    name: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কস",
                    nameEn: "General Electrical Works",
                    desc: "হাউস ও ইন্ডাস্ট্রিয়াল ওয়্যারিং, মোটর ওয়াইন্ডিং ও পাওয়ার সাব-স্টেশন।",
                    labs: "২টি হেভি মেশিনারি ল্যাব",
                    icon: Zap,
                    gradient: "from-amber-500 to-orange-600",
                    variant: "amber" as const,
                  },
                  {
                    code: "AMB",
                    name: "অ্যাপারেল ম্যানুফ্যাকচারিং",
                    nameEn: "Apparel Manufacturing Basics",
                    desc: "গার্মেন্টস টেকনোলজি, প্যাটার্ন মেকিং ও ইন্ডাস্ট্রিয়াল সুইং মেশিন।",
                    labs: "২টি ইন্ডাস্ট্রিয়াল টেক্সটাইল ল্যাব",
                    icon: Scissors,
                    gradient: "from-fuchsia-600 to-rose-600",
                    variant: "rose" as const,
                  },
                ].map((trade) => {
                  const Icon = trade.icon;
                  return (
                    <StaggerItem key={trade.code} animation="fade-up">
                      <BorderGlowCard
                        glowColor={trade.variant}
                        glowType="conic-spin"
                        className="h-full"
                      >
                        <div className="p-5 flex flex-col justify-between h-full space-y-3.5">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${trade.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                {trade.code}
                              </span>
                            </div>

                            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                              {trade.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {trade.nameEn}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                              {trade.desc}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-cyan-400">
                            <span>{trade.labs}</span>
                            <Link href="/academic" className="hover:underline">
                              সিলেবাস →
                            </Link>
                          </div>
                        </div>
                      </BorderGlowCard>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </div>
          </AOSReveal>
        </section>

        {/* 6. PRINCIPAL'S ADDRESS & VISION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AOSReveal animation="zoom-in" duration={0.6}>
            <ScrollGlowReveal glowColor="cyan">
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 rounded-3xl border border-indigo-900/60 shadow-xl flex flex-col lg:flex-row items-center gap-8">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 border-2 border-cyan-400/40 shadow-xl bg-slate-950">
                  <img
                    src={principal.photoUrl}
                    alt={principal.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-3 text-center lg:text-left flex-1">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">
                    প্রতিষ্ঠানের বার্তা
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {principal.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    {principal.designation}, পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                  </p>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal italic pt-1">
                    &ldquo;{principal.message}&rdquo;
                  </p>
                </div>

                <div className="shrink-0 flex flex-col gap-2">
                  <Link
                    href="/about"
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs text-center transition-all"
                  >
                    সম্পূর্ণ পরিচিতি
                  </Link>
                  <Link
                    href="/faculty"
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center transition-all border border-white/20 hover:border-white/40 shadow-sm"
                  >
                    শিক্ষক পরিষদ
                  </Link>
                </div>
              </div>
            </ScrollGlowReveal>
          </AOSReveal>
        </section>

        {/* 7. LATEST NOTICES PREVIEW */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AOSReveal animation="fade-up" className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-widest">
                বিজ্ঞপ্তি ও প্রজ্ঞাপন
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                সাম্প্রতিক নোটিশসমূহ
              </h2>
            </div>

            <Link
              href="/notices"
              className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>সকল নোটিশ ({notices.length > 0 ? notices.length + "+" : "সব"})</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </AOSReveal>

          {noticesLoading ? (
            <NoticeCardSkeleton count={4} />
          ) : (
            <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map((n) => (
                <StaggerItem key={n.id} animation="slide-up">
                  <Link
                    href={`/notices/${n.id}`}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex items-start justify-between gap-4 group h-full"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="font-mono text-slate-400 flex items-center gap-1 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {n.publishedAt}
                        </span>
                        <span className="px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                          {n.categoryBangla}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                        {n.titleBangla}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
                        {n.content}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 group-hover:translate-x-1.5 transition-all duration-300 shrink-0 self-center" />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </section>

        {/* 8. PHOTO GALLERY PREVIEW */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AOSReveal animation="fade-up" className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-widest">
                ছবি ও ক্যাম্পাস জীবন
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                ফটোগ্যালারি ও ইভেন্টস
              </h2>
            </div>

            <Link
              href="/gallery"
              className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>সব ছবি দেখুন</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </AOSReveal>

          {galleryLoading ? (
            <GalleryGridSkeleton count={6} />
          ) : (
            <StaggerContainer staggerDelay={0.08} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {galleryItems.map((item) => (
                <StaggerItem key={item.id} animation="zoom-in">
                  <Link
                    href="/gallery"
                    className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-800 block transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.titleBangla}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2.5 flex flex-col justify-end">
                      <span className="text-[10px] text-white font-bold truncate">
                        {item.titleBangla}
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </section>

        {/* 9. INTERACTIVE CAMPUS LOCATION MAP */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AOSReveal animation="fade-up" duration={0.6}>
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-widest">
                    ক্যাম্পাস অবস্থান
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    তালমা নদী বাঁধ সংলগ্ন মনোরম ক্যাম্পাস
                  </h3>
                </div>
                <Link
                  href="/contact"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-cyan-400 font-bold text-xs flex items-center gap-1 hover:bg-indigo-100"
                >
                  <span>যোগাযোগ পাতা</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <InteractiveCampusMap />
            </div>
          </AOSReveal>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
