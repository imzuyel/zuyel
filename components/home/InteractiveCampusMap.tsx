"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Building,
  Compass,
  Bus,
  Train,
  CheckCircle2,
  Car,
  Layers,
} from "lucide-react";

export default function InteractiveCampusMap() {
  const [activeLandmark, setActiveLandmark] = useState<number>(1);

  const landmarks = [
    {
      id: 1,
      name: "মূল প্রশাসনিক ও একাডেমিক ভবন",
      nameEnglish: "Main Administrative & Academic Complex",
      desc: "অধ্যক্ষের কার্যালয়, শিক্ষক লাউঞ্জ, কনফারেন্স রুম ও ডিজিটাল মাল্টিমিডিয়া ক্লাসরুম।",
      badge: "Building A",
      coord: "North Wing",
      color: "bg-indigo-600",
    },
    {
      id: 2,
      name: "আইটি সাপোর্ট ও কম্পিউটার ল্যাব ভবন",
      nameEnglish: "IT Support, IoT & Electronics Labs",
      desc: "ESP32 মাইক্রোকন্ট্রোলার ল্যাব, হার্ডওয়্যার ওয়্যারহাউজ, পিসিবি ল্যাব ও নেটওয়ার্কিং সেটআপ।",
      badge: "Building B",
      coord: "East Wing",
      color: "bg-cyan-600",
    },
    {
      id: 3,
      name: "ভারী প্রকৌশল ও কারিগরি ওয়ার্কশপ",
      nameEnglish: "Heavy Technical & Electrical Workshop",
      desc: "ইন্ডাস্ট্রিয়াল ওয়্যারিং সেটআপ, ৩-ফেজ মোটর টেস্ট বেঞ্চ ও অ্যাপারেল সুইং মেশিন শপ।",
      badge: "Building C",
      coord: "South Wing",
      color: "bg-amber-600",
    },
    {
      id: 4,
      name: "তালমা নদী বাঁধ সংলগ্ন উন্মুক্ত প্রাঙ্গণ",
      nameEnglish: "Talma River Dam Promenade & Sports Ground",
      desc: "ক্যাম্পাসের মনোরম প্রাকৃতিক পরিবেশ, শহিদ মিনার প্রাঙ্গণ ও বার্ষিক ক্রীড়া মাঠ।",
      badge: "Campus Ground",
      coord: "West Boundary",
      color: "bg-emerald-600",
    },
  ];

  const travelGuides = [
    {
      mode: "পঞ্চগড় চৌরঙ্গী মোড় থেকে",
      desc: "ইজিবাইক বা অটোরিকশা যোগে পূর্ব জালাসী তালমা বাঁধ রোড হয়ে মাত্র ১০-১৫ মিনিটে ক্যাম্পাসে পৌঁছানো যায়।",
      icon: Car,
      dist: "৪.২ কি.মি.",
    },
    {
      mode: "বীর মুক্তিযোদ্ধা সিরাজুল ইসলাম রেলওয়ে স্টেশন থেকে",
      desc: "পঞ্চগড় স্টেশন থেকে রিকশা বা সিএনজি যোগে জালাসী ব্রিজ পার হয়ে সরাসরি টেকনিক্যাল স্কুল ও কলেজে যাতায়াত।",
      icon: Train,
      dist: "৫.৫ কি.মি.",
    },
    {
      mode: "ঢাকা-পঞ্চগড় কেন্দ্রীয় বাস টার্মিনাল থেকে",
      desc: "টার্মিনাল থেকে লোকাল অটোরিকশায় তালমা বাঁধ সংলগ্ন টেকনিক্যাল রোডে খুব সহজে যাতায়াত সম্ভব।",
      icon: Bus,
      dist: "৩.৮ কি.মি.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <MapPin className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              ক্যাম্পাস ম্যাপ ও ভৌগোলিক অবস্থান (Campus Location)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            পূর্ব জালাসী, তালমা নদী বাঁধ সংলগ্ন, পঞ্চগড় সদর, পঞ্চগড় - ৫০০০ • জেলা কোড: ৫০
          </p>
        </div>

        <a
          href="https://maps.google.com/?q=Panchagarh+Government+Technical+School+and+College"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all"
        >
          <Navigation className="w-4 h-4" />
          <span>গুগল ম্যাপে নেভিগেশন</span>
          <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
        </a>
      </div>

      {/* Grid: Interactive Visual Vector Map & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Map Render (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>ইন্টারেক্টিভ ক্যাম্পাস স্থাপত্য নকশা (Interactive Vector Layout)</span>
            </h3>
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
              ১৪৭.৫ শতাংশ ভূমি
            </span>
          </div>

          {/* Stylized Architectural Vector Blueprint Canvas */}
          <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-slate-800 p-4 select-none">
            {/* Blueprint Grid Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="campusMapGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M30 0 L0 0 0 30" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#campusMapGrid)" />
            </svg>

            {/* Talma River Vector Wave along the side */}
            <svg className="absolute top-0 right-0 h-full w-24 opacity-40 pointer-events-none" viewBox="0 0 100 300">
              <path
                d="M30,0 Q70,75 40,150 T50,300 L100,300 L100,0 Z"
                fill="#0284c7"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <text x="50" y="150" fill="#bae6fd" fontSize="10" transform="rotate(90 50 150)" fontWeight="bold">
                তালমা নদী (Talma River)
              </text>
            </svg>

            {/* Interactive Campus Buildings */}
            <div className="relative z-10 h-full flex flex-col justify-between">
              {/* North: Building A */}
              <button
                onClick={() => setActiveLandmark(1)}
                className={`w-48 p-2.5 rounded-xl border text-left transition-all ${
                  activeLandmark === 1
                    ? "bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-300 shadow-lg scale-105"
                    : "bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <span className="text-[10px] font-mono font-bold block opacity-70">Building A</span>
                <span className="text-xs font-bold block truncate">মূল একাডেমিক ও প্রশাসনিক ভবন</span>
              </button>

              {/* Center: Main Courtyard & Flagpole */}
              <div className="flex items-center justify-around pr-20">
                <button
                  onClick={() => setActiveLandmark(4)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                    activeLandmark === 4
                      ? "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300 shadow-md scale-105"
                      : "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                  }`}
                >
                  জাতীয় পতাকা ও শহিদ মিনার প্রাঙ্গণ
                </button>

                <button
                  onClick={() => setActiveLandmark(2)}
                  className={`w-44 p-2.5 rounded-xl border text-left transition-all ${
                    activeLandmark === 2
                      ? "bg-cyan-600 text-white border-cyan-400 ring-2 ring-cyan-300 shadow-lg scale-105"
                      : "bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold block opacity-70">Building B</span>
                  <span className="text-xs font-bold block truncate">আইটি ও ইলেকট্রনিক্স ল্যাব</span>
                </button>
              </div>

              {/* South: Building C */}
              <button
                onClick={() => setActiveLandmark(3)}
                className={`w-52 p-2.5 rounded-xl border text-left transition-all ${
                  activeLandmark === 3
                    ? "bg-amber-600 text-white border-amber-400 ring-2 ring-amber-300 shadow-lg scale-105"
                    : "bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <span className="text-[10px] font-mono font-bold block opacity-70">Building C</span>
                <span className="text-xs font-bold block truncate">ইলেকট্রিক্যাল ও অ্যাপারেল শপ</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center italic">
            * উপরে যে-কোনো ভবনে ক্লিক করে বিস্তারিত জানতে পারেন।
          </p>
        </div>

        {/* Selected Landmark Card & Travel Directions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Landmark Card */}
          {(() => {
            const current = landmarks.find((l) => l.id === activeLandmark) || landmarks[0];
            return (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-indigo-800">
                    {current.badge} • {current.coord}
                  </span>
                  <span className={`w-3 h-3 rounded-full ${current.color}`} />
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                  {current.name}
                </h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {current.nameEnglish}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl">
                  {current.desc}
                </p>
              </div>
            );
          })()}

          {/* Travel Directions Guide */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>যাতায়াত ও পৌঁছানোর নির্দেশিকা (How to Reach)</span>
            </h4>

            <div className="space-y-2.5">
              {travelGuides.map((guide, idx) => {
                const Icon = guide.icon;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900 dark:text-white text-xs">{guide.mode}</h5>
                        <span className="font-mono text-[10px] font-bold text-teal-700 dark:text-teal-400">
                          {guide.dist}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {guide.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
