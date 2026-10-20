"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  School,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Award,
  Layers,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Users,
  Compass,
  FileCheck,
} from "lucide-react";
import AnimatedGears from "../common/AnimatedGears";

export default function CampusAboutView() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/institution")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
      })
      .catch((err) => console.error(err));
  }, []);

  const inst = data?.institution || {
    name: "Panchagarh Government Technical School and College",
    nameBangla: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
    eiin: "132244",
    established: 1999,
    areaLand: "১৪৭.৫ শতাংশ",
    buildings: 3,
    classrooms: 12,
    workshops: 4,
    labs: 9,
    library: 1,
    phoneLandline: "02589941021",
    principalMobile: "01712-394347",
    email: "panchagarhtsc@gmail.com",
    website: "https://tsc.panchagarh.gov.bd",
    principalName: "প্রকৌ. মো. রফিকুল ইসলাম",
    locationBangla: "পূর্ব জালাসী, তালমা নদী বাঁধ সংলগ্ন, পঞ্চগড় সদর, পঞ্চগড় - ৫০০০",
    principalMessage:
      "কারিগরি শিক্ষা গ্রহণ করি, সমৃদ্ধ বাংলাদেশ গড়ি। পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ ১৯৯৯ সাল থেকে উত্তরবঙ্গের সীমান্তবর্তী এই জনপদে কারিগরি ও বৃত্তিমূলক শিক্ষার আলো ছড়িয়ে আসছে। এখানে সাধারণ শিক্ষার পাশাপাশি ৪র্থ শিল্পবিপ্লবের উপযোগী আইটি সাপোর্ট, আইওটি, ইলেকট্রনিক্স, ইলেকট্রিক্যাল ও অ্যাপারেল ট্রেডে তরুণদের দক্ষ মানবসম্পদে রূপান্তর করা হচ্ছে।",
    vision: "আন্তর্জাতিক মানের দক্ষ কারিগরি মানবসম্পদ উন্নয়ন ও স্বনির্ভর স্মার্ট বাংলাদেশ বিনির্মাণ।",
    mission:
      "আধুনিক প্রযুক্তি, বিশ্বমানের ব্যবহারিক কর্মশালা ও যুগোপযোগী পাঠ্যক্রমের মাধ্যমে প্রতিটি শিক্ষার্থীকে কর্মসংস্থান ও আত্মকর্মসংস্থানে সক্ষম করে গড়ে তোলা।",
  };

  const officialLinks = [
    {
      title: "অফিসিয়াল গভ. পোর্টাল",
      url: "https://tsc.panchagarh.gov.bd",
      desc: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
      badge: "Govt Web",
    },
    {
      title: "কারিগরি শিক্ষা অধিদপ্তর",
      url: "http://www.techedu.gov.bd",
      desc: "Directorate of Technical Education (DTE)",
      badge: "DTE",
    },
    {
      title: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড",
      url: "http://www.bteb.gov.bd",
      desc: "Bangladesh Technical Education Board (BTEB)",
      badge: "BTEB",
    },
    {
      title: "কারিগরি ও মাদ্রাসা শিক্ষা বিভাগ",
      url: "http://www.tmed.gov.bd",
      desc: "শিক্ষা মন্ত্রণালয়, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার",
      badge: "TMED",
    },
    {
      title: "পঞ্চগড় জেলা জাতীয় বাতায়ন",
      url: "https://www.panchagarh.gov.bd",
      desc: "জেলা প্রশাসন, পঞ্চগড়",
      badge: "District Portal",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-20 pointer-events-none hidden md:block">
          <AnimatedGears size="lg" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-bold backdrop-blur-xs border border-white/20">
            <School className="w-3.5 h-3.5 text-teal-400" />
            <span>প্রতিষ্ঠান পরিচিতি ও ইতিহাস</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white">{inst.nameBangla}</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {inst.locationBangla} • EIIN: {inst.eiin} • স্থাপিত: ১৯৯৯ খ্রিষ্টাব্দ
          </p>
        </div>
      </div>

      {/* Grid: Principal Message & Vision/Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Principal Message (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400">
                <Users className="w-4 h-4" />
              </span>
              <span>অধ্যক্ষের বাণী (Principal&apos;s Message)</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
              PTSC Leadership
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="shrink-0 text-center space-y-1 mx-auto sm:mx-0">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80"
                alt="Principal"
                className="w-28 h-28 rounded-2xl object-cover border-2 border-indigo-600 shadow-md ring-4 ring-indigo-50 dark:ring-indigo-950"
              />
              <h4 className="font-bold text-xs text-slate-900 dark:text-white pt-1">{inst.principalName}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">অধ্যক্ষ (ভারপ্রাপ্ত)</p>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
              <p className="font-serif italic bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                &ldquo;{inst.principalMessage}&rdquo;
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{inst.principalMobile}</span>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{inst.email}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vision, Mission & Goals (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-teal-50 dark:from-slate-900 dark:to-indigo-950 p-6 rounded-3xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <h3 className="font-extrabold text-sm text-indigo-950 dark:text-cyan-200">রূপকল্প (Vision)</h3>
            </div>
            <p className="text-xs text-indigo-900/90 dark:text-slate-200 leading-relaxed font-medium">
              {inst.vision}
            </p>
          </div>

          <div className="bg-gradient-to-br from-teal-50 via-emerald-50 to-slate-50 dark:from-slate-900 dark:to-emerald-950 p-6 rounded-3xl border border-teal-200/80 dark:border-teal-800/80 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <h3 className="font-extrabold text-sm text-teal-950 dark:text-teal-200">অভিলক্ষ্য (Mission)</h3>
            </div>
            <p className="text-xs text-teal-900/90 dark:text-slate-200 leading-relaxed font-medium">
              {inst.mission}
            </p>
          </div>
        </div>
      </div>

      {/* Infrastructure & Campus Asset Numbers */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
          <span>ক্যাম্পাস অবকাঠামো ও সুবিধা (Infrastructure & Facilities)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">জমির পরিমাণ</span>
            <span className="text-lg font-black text-slate-900 dark:text-white block font-mono">১৪৭.৫ শতক</span>
            <span className="text-[10px] text-teal-700 dark:text-teal-400">১.৪৭৫ একর</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">ভবন সংখ্যা</span>
            <span className="text-lg font-black text-indigo-600 dark:text-cyan-400 block font-mono">০৩ টি</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">বহুতল কমপ্লেক্স</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">শ্রেণিকক্ষ</span>
            <span className="text-lg font-black text-indigo-600 dark:text-cyan-400 block font-mono">১২ টি</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">ডিজিটাল প্রজেক্টরসহ</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">কারিগরি ল্যাব</span>
            <span className="text-lg font-black text-teal-600 dark:text-teal-400 block font-mono">০৯ টি</span>
            <span className="text-[10px] text-teal-700">আইটি ও হার্ডওয়্যার</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">ওয়ার্কশপ</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 block font-mono">০৪ টি</span>
            <span className="text-[10px] text-amber-700">ব্যবহারিক যন্ত্রাংশ</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">কেন্দ্রীয় লাইব্রেরি</span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-400 block font-mono">০১ টি</span>
            <span className="text-[10px] text-purple-700">কারিগরি বই সম্ভার</span>
          </div>
        </div>
      </div>

      {/* Official Government Portals & Resource Links */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
          <span>সরকারি ওয়েব পোর্টাল ও দরকারি লিংক (Government Portals)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {officialLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-start justify-between group shadow-2xs"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-indigo-800">
                  {link.badge}
                </span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                  {link.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{link.desc}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors shrink-0 mt-1" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
