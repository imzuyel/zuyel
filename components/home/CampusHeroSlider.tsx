"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Cpu, Wifi, Zap, ArrowRight, Play, Pause } from "lucide-react";
import AnimatedGears from "../common/AnimatedGears";

interface SlideItem {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  imageUrl: string;
  ctaText: string;
  ctaAction: string;
  accentIcon: any;
}

interface CampusHeroSliderProps {
  onNavigate: (tab: string) => void;
}

export default function CampusHeroSlider({ onNavigate }: CampusHeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const slides: SlideItem[] = [
    {
      id: 1,
      title: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
      subtitle: "স্থাপিত ১৯৯৯ • দক্ষ জনশক্তি গড়ে তুলতে ৪টি আধুনিক কারিগরি ট্রেড ও সাধারণ শিক্ষা",
      badge: "স্মার্ট ক্যাম্পাস ২০২৬",
      badgeColor: "from-amber-400 to-orange-500 text-slate-950",
      imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80",
      ctaText: "প্রতিষ্ঠান পরিচিতি",
      ctaAction: "about_campus",
      accentIcon: Sparkles,
    },
    {
      id: 2,
      title: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস ল্যাব",
      subtitle: "কম্পিউটার হার্ডওয়্যার, নেটওয়ার্কিং ও মাইক্রোকন্ট্রোলার আইওটি সেন্সর ভিত্তিক বাস্তব শিক্ষা",
      badge: "৪র্থ শিল্পবিপ্লব প্রস্তুতি",
      badgeColor: "from-cyan-400 to-blue-600 text-white",
      imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600&auto=format&fit=crop&q=80",
      ctaText: "কারিগরি ট্রেডসমূহ",
      ctaAction: "academic_structure",
      accentIcon: Wifi,
    },
    {
      id: 3,
      title: "ইলেকট্রনিক্স ও মাইক্রোকন্ট্রোলার কর্মশালা",
      subtitle: "সার্কিট ডিজাইন, পিসিবি ফেব্রিকেশন, স্বয়ংক্রিয় রোবটিক্স ও ইন্ডাস্ট্রিয়াল অটোমেশন",
      badge: "জেনারেল ইলেকট্রনিক্স",
      badgeColor: "from-indigo-500 to-purple-600 text-white",
      imageUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1600&auto=format&fit=crop&q=80",
      ctaText: "ল্যাব ও ওয়ার্কশপ",
      ctaAction: "labs",
      accentIcon: Cpu,
    },
    {
      id: 4,
      title: "ইলেকট্রিক্যাল পাওয়ার ও সাবস্টেশন রক্ষণাবেক্ষণ",
      subtitle: "হাউস ও ইন্ডাস্ট্রিয়াল ওয়্যারিং, মোটর ওয়াইন্ডিং এবং আধুনিক সৌরবিদ্যুৎ সংযোগ",
      badge: "জেনারেল ইলেকট্রিক্যাল",
      badgeColor: "from-emerald-400 to-teal-600 text-slate-950",
      imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1600&auto=format&fit=crop&q=80",
      ctaText: "ক্লাস ও ল্যাব রুটিন",
      ctaAction: "routine",
      accentIcon: Zap,
    },
  ];

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const current = slides[currentSlide];
  const AccentIcon = current.accentIcon;

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-950 text-white min-h-[360px] sm:min-h-[440px] flex flex-col justify-between group">
      {/* Background Image with Dynamic Transitions */}
      {slides.map((s, idx) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? "opacity-40 scale-100" : "opacity-0 scale-105 pointer-events-none"
          }`}
          style={{
            backgroundImage: `url(${s.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}

      {/* Dynamic Ambient Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-indigo-950/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

      {/* Animated Floating Technical Circuit Lines & Gears */}
      <div className="absolute top-4 right-4 pointer-events-none z-10 hidden sm:block opacity-60">
        <AnimatedGears size="md" />
      </div>

      {/* Decorative Technical Glowing Beams */}
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Tag */}
      <div className="relative z-10 p-5 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-lg bg-gradient-to-r ${current.badgeColor}`}
          >
            <AccentIcon className="w-3.5 h-3.5 animate-pulse" />
            <span>{current.badge}</span>
          </span>
          <span className="text-[11px] font-mono font-semibold text-slate-300 hidden sm:inline bg-black/40 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
            EIIN: ১৩২২৪৪ • স্থাপিত: ১৯৯৯
          </span>
        </div>

        {/* Play / Pause Toggle */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-xl bg-white dark:bg-slate-900/10 hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900/20 border border-white/15 text-slate-200 transition-all backdrop-blur-md"
          title={isPlaying ? "স্লাইডার থামান" : "স্লাইডার চালু করুন"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Middle Content: Animated Heading & Subtitle */}
      <div className="relative z-10 px-5 sm:px-8 py-4 max-w-3xl space-y-3">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md">
          {current.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed drop-shadow-sm max-w-2xl">
          {current.subtitle}
        </p>

        {/* Call to Action Row */}
        <div className="pt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate(current.ctaAction)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-600 to-teal-400 hover:from-indigo-600 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all transform hover:scale-[1.03] active:scale-95"
          >
            <span>{current.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onNavigate("public_results")}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900/10 hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900/20 border border-white/20 text-white text-xs font-bold transition-all backdrop-blur-md"
          >
            ফলাফল অনুসন্ধান
          </button>

          <button
            onClick={() => onNavigate("id_cards")}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900/10 hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900/20 border border-white/20 text-amber-300 text-xs font-bold transition-all backdrop-blur-md flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>স্মার্ট আইডি কার্ড</span>
          </button>
        </div>
      </div>

      {/* Bottom Nav: Indicators & Controls */}
      <div className="relative z-10 p-5 sm:p-8 flex items-center justify-between border-t border-white/10 bg-black/30 backdrop-blur-sm">
        {/* Step Dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? "w-8 bg-gradient-to-r from-teal-400 to-indigo-400" : "w-2 bg-white dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900/60"
              }`}
            />
          ))}
        </div>

        {/* Slide Counter & Arrow Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 font-bold mr-2">
            ০{currentSlide + 1} / ০{slides.length}
          </span>
          <button
            onClick={prevSlide}
            className="p-2 rounded-xl bg-white dark:bg-slate-900/10 hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900/25 border border-white/15 text-white transition-all active:scale-90"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-xl bg-white dark:bg-slate-900/10 hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900/25 border border-white/15 text-white transition-all active:scale-90"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
