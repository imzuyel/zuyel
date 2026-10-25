"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import {
  Image as ImageIcon,
  Camera,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
  ZoomIn,
} from "lucide-react";
import { SkeletonBox } from "@/components/ui/SkeletonScreens";
import { AOSReveal } from "@/components/ui/animation-effects";
import SocialReactionCommentSection from "@/components/common/SocialReactionCommentSection";

export default function PhotoGalleryView() {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: "all", label: "সকল ছবি" },
    { id: "campus", label: "ক্যাম্পাস প্রাঙ্গণ" },
    { id: "labs", label: "কারিগরি ল্যাব ও ওয়ার্কশপ" },
    { id: "fair", label: "বিজ্ঞান ও প্রযুক্তি মেলা" },
    { id: "cultural", label: "জাতীয় দিবস ও সংস্কৃতি" },
  ];

  useEffect(() => {
    fetch("/api/gallery")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setGalleryItems(data.items || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = galleryItems.filter(
    (item) => activeCategory === "all" || item.category === activeCategory
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const prevImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! === 0 ? filtered.length - 1 : prev! - 1));
  };

  const nextImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! + 1) % filtered.length);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400">
              <Camera className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              ফটোগ্যালারি ও ক্যাম্পাস কার্যক্রম (Campus Photo Gallery)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের ল্যাবরেটরি, প্রজেক্ট উদ্ভাবন ও ক্যাম্পাস ইভেন্টসমূহ
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-cyan-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Images Masonry Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3 p-3"
            >
              <SkeletonBox className="w-full aspect-video" rounded="rounded-2xl" />
              <div className="space-y-2 p-2">
                <SkeletonBox className="w-3/4 h-4" rounded="rounded-md" />
                <SkeletonBox className="w-1/2 h-3" rounded="rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          কোনও ছবি পাওয়া যায়নি।
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => openLightbox(idx)}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-cyan-500/50 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative overflow-hidden aspect-video bg-slate-800 rounded-t-3xl">
                <Image
                  src={item.imageUrl}
                  alt={item.titleBangla || item.title || "ক্যাম্পাস ফটো"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized={Boolean(item.imageUrl?.startsWith("data:") || item.imageUrl?.startsWith("blob:"))}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-10">
                  <span className="text-white text-xs font-bold flex items-center gap-1.5">
                    <ZoomIn className="w-4 h-4 text-cyan-300" />
                    <span>বড় করে দেখুন</span>
                  </span>
                </div>
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/60 text-white backdrop-blur-md border border-white/20 z-10">
                  {item.categoryBangla}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                  {item.titleBangla || item.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {item.description}
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{item.date}</span>
                  </span>
                  <span className="text-indigo-600 dark:text-cyan-400 font-bold">PTSC Gallery</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2.5 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full text-center space-y-4">
            <div className="relative w-full max-h-[75vh] h-[65vh] flex items-center justify-center">
              <Image
                src={filtered[lightboxIndex].imageUrl}
                alt={filtered[lightboxIndex].titleBangla || filtered[lightboxIndex].title || "গ্যালারি ছবি"}
                fill
                sizes="(max-width: 1200px) 90vw, 1200px"
                priority
                className="rounded-2xl shadow-2xl object-contain border border-white/15"
                unoptimized={Boolean(filtered[lightboxIndex].imageUrl?.startsWith("data:") || filtered[lightboxIndex].imageUrl?.startsWith("blob:"))}
              />
            </div>
            <div className="text-white space-y-1">
              <h3 className="text-base sm:text-lg font-bold">
                {filtered[lightboxIndex].titleBangla || filtered[lightboxIndex].title}
              </h3>
              <p className="text-xs text-slate-300 max-w-xl mx-auto">
                {filtered[lightboxIndex].description}
              </p>
              <span className="inline-block text-[11px] text-teal-400 font-mono pt-1">
                {lightboxIndex + 1} / {filtered.length} • {filtered[lightboxIndex].date}
              </span>
            </div>

            {/* Social Reaction, Heart & Comment in Lightbox */}
            <div className="max-w-xl mx-auto text-left text-white bg-slate-900/90 p-4 rounded-3xl border border-slate-800 shadow-xl">
              <SocialReactionCommentSection
                key={filtered[lightboxIndex].id}
                contentId={`gallery-${filtered[lightboxIndex].id}`}
                contentType="gallery"
                initialLikes={18}
                initialUnlikes={0}
                initialHearts={24}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
