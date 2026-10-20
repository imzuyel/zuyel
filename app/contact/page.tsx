"use client";

import React, { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Building,
  ShieldCheck,
  Compass
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import InteractiveCampusMap from "@/components/home/InteractiveCampusMap";
import { useLoading } from "@/context/LoadingContext";
import { InlineLoadingSpinner } from "@/components/ui/SkeletonScreens";
import { AOSReveal } from "@/components/ui/animation-effects";

export default function ContactPage() {
  const { startLoading, stopLoading } = useLoading();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "ভর্তি সংক্রান্ত অনুসন্ধান",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    startLoading("আপনার বার্তাটি সার্ভারে প্রেরণ করা হচ্ছে...");

    // Simulate submission to institutional admin mailbox
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      stopLoading("আপনার বার্তা সফলভাবে কর্তৃপক্ষের কাছে পৌঁছেছে!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "ভর্তি সংক্রান্ত অনুসন্ধান",
        message: "",
      });
    }, 700);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <PublicHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 space-y-6 sm:space-y-10">
        
        {/* Header Title Banner with AOS Reveal */}
        <AOSReveal animation="fade-down" duration={0.5}>
          <div className="bg-slate-950 text-white p-5 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl border border-indigo-950 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] sm:text-xs font-bold font-mono">
                <Compass className="w-4 h-4" />
                <span>OFFICIAL CONTACT & LOCATION</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                যোগাযোগ ও ক্যাম্পাস ঠিকানা
              </h1>

              <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
                পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের সাথে যেকোনো একাডেমিক, ভর্তি বা প্রশাসনিক তথ্যের জন্য নিচের যোগাযোগের মাধ্যম ও বার্তা ফর্ম ব্যবহার করুন।
              </p>
            </div>
          </div>
        </AOSReveal>

        {/* Contact Info Cards & Message Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Official Contact Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Address */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                ক্যাম্পাসের ঠিকানা
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                পূর্ব জালাসী, তালমা নদী বাঁধ সংলগ্ন, পঞ্চগড় সদর, পঞ্চগড় - ৫০০০, বাংলাদেশ
              </p>
            </div>

            {/* Telephone & Mobile */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                টেলিফোন ও হটলাইন
              </h3>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono">
                <p>ল্যান্ডলাইন: <strong className="text-slate-900 dark:text-white">০২৫৮৯৯৪১০২১</strong></p>
                <p>অধ্যক্ষ (মোবাইল): <strong className="text-cyan-600 dark:text-cyan-400">০১৭১২-৩৯৪৩৪৭</strong></p>
              </div>
            </div>

            {/* Email */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                ইমেইল ও অফিসিয়াল যোগাযোগ
              </h3>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono">
                <p>panchagarhtsc@gmail.com</p>
                <p>info@pstsc.edu.bd</p>
              </div>
            </div>

            {/* Office Hours */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                অফিস ও ক্লাস সময়সূচি
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                রবিবার হতে বৃহস্পতিবার: সকাল ৮:০০ টা হতে বিকাল ৪:০০ টা পর্যন্ত (শুক্রবার ও শনিবার বন্ধ)।
              </p>
            </div>

          </div>

          {/* Right Column: Contact Inquiry Form (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                অনলাইন বার্তা ও অনুসন্ধান ফর্ম
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                আপনার যেকোনো প্রশ্ন বা পরামর্শ সরাসরি অধ্যক্ষের কার্যালয়ে প্রেরণ করতে ফর্মটি পূরণ করুন।
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                  আপনার বার্তা সফলভাবে গ্রহণ করা হয়েছে!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  আমাদের প্রশাসনিক প্রতিনিধি দ্রুত আপনার প্রদত্ত মোবাইল নম্বর বা ইমেইলে যোগাযোগ করবেন।
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold mt-2 cursor-pointer"
                >
                  আরেকটি বার্তা পাঠান
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      আপনার নাম *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: মো. আব্দুল্লাহ"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      মোবাইল নম্বর *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="০১৭১X-XXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      ইমেইল ঠিকানা
                    </label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      বিষয়
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ভর্তি সংক্রান্ত অনুসন্ধান">ভর্তি সংক্রান্ত অনুসন্ধান</option>
                      <option value="পরীক্ষা ও ফলাফল বিষয়ক">পরীক্ষা ও ফলাফল বিষয়ক</option>
                      <option value="সার্টিফিকেট ও প্রশংসাপত্র">সার্টিফিকেট ও প্রশংসাপত্র</option>
                      <option value="ট্রেড ও ল্যাবরেটরি তথ্য">ট্রেড ও ল্যাবরেটরি তথ্য</option>
                      <option value="অন্যান্য সাধারণ জিজ্ঞাসা">অন্যান্য সাধারণ জিজ্ঞাসা</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    আপনার বার্তা বিস্তারিত লিখুন *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="এখানে আপনার বার্তা বিস্তারিত লিখুন..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all duration-300 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {loading ? (
                    <InlineLoadingSpinner text="প্রেরণ করা হচ্ছে..." size="sm" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>বার্তা পাঠান</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

        </div>

        {/* Map Section */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">
              স্যাটেলাইট ও ক্যাম্পাস ম্যাপ ভিউ
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">26.3440° N, 88.5583° E</span>
          </div>
          <InteractiveCampusMap />
        </div>

      </main>

      <PublicFooter />
    </div>
  );
}
