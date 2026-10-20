"use client";

import React from "react";
import Link from "next/link";
import {
  School,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  Lock,
  ArrowUp
} from "lucide-react";

export default function PublicFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-slate-950 text-slate-400 border-t border-slate-800 text-xs mt-auto overflow-hidden">
      {/* Upper Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: Institution Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                🎓
              </div>
              <div>
                <h3 className="font-black text-white text-sm">
                  পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ
                </h3>
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">
                  EIIN: 132244 • ESTD: 1999
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              কারিগরি ও কর্মমুখী শিক্ষায় উত্তরবঙ্গের অন্যতম শীর্ষ সরকারি প্রতিষ্ঠান। আধুনিক ব্যবহারিক কর্মশালা, আইটি ল্যাব ও দক্ষ শিক্ষক দ্বারা পরিচালিত।
            </p>

            <div className="pt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-[10px] font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>BTEB & DTE Affiliated</span>
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>গুরুত্বপূর্ণ পেজসমূহ</span>
            </h4>
            <ul className="space-y-2 font-medium">
              {[
                { href: "/about", label: "প্রতিষ্ঠান পরিচিতি ও ইতিহাস" },
                { href: "/academic", label: "একাডেমিক কাঠামো ও ট্রেডসমূহ" },
                { href: "/notices", label: "সর্বশেষ নোটিশ ও সার্কুলার" },
                { href: "/results", label: "অনলাইন পরীক্ষার ফলাফল" },
                { href: "/verify", label: "ডিজিটাল সনদ ও প্রত্যয়নপত্র যাচাই" },
                { href: "/faculty", label: "শিক্ষক ও কর্মকর্তা পরিষদ" },
                { href: "/gallery", label: "ফটোগ্যালারি ও ক্যাম্পাস" },
                { href: "/downloads", label: "সিলেবাস ও ফরম ডাউনলোড" },
                { href: "/admin", label: "প্রাতিষ্ঠানিক ERP লগইন" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Academic Programs & Live Systems */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>কারিগরি ট্রেড ও পোর্টাল</span>
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li className="text-slate-300 font-semibold">• জেনারেল ইলেকট্রনিক্স (GE)</li>
              <li className="text-slate-300 font-semibold">• আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস (IT-IoT)</li>
              <li className="text-slate-300 font-semibold">• জেনারেল ইলেকট্রিক্যাল ওয়ার্কস (EE)</li>
              <li className="text-slate-300 font-semibold">• অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস (AMB)</li>
              <li className="pt-2">
                <Link
                  href="/quiz/join"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all text-xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>লাইভ কুইজ প্রতিযোগিতা</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Information */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>যোগাযোগের ঠিকানা</span>
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>পূর্ব জালাসী, তালমা নদী বাঁধ সংলগ্ন, পঞ্চগড় সদর, পঞ্চগড় - ৫০০০</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-mono">০২৫৮৯৯৪১০২১, ০১৭১২-৩৯৪৩৪৭</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-mono">panchagarhtsc@gmail.com</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-1 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 block">সরকারি পোর্টাল লিংক:</span>
              <div className="flex flex-wrap gap-2 text-cyan-400">
                <a
                  href="http://www.bteb.gov.bd"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-0.5"
                >
                  <span>BTEB</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span>•</span>
                <a
                  href="http://www.dte.gov.bd"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-0.5"
                >
                  <span>DTE</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span>•</span>
                <a
                  href="http://www.moedu.gov.bd"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-0.5"
                >
                  <span>MoEdu</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Sub-bar */}
      <div className="border-t border-slate-900 bg-slate-950/80 py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div className="text-center sm:text-left">
            <p className="text-slate-400">
              © ২০২৬ পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) • সর্বস্বত্ব সংরক্ষিত।
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5">
              কারিগরি ও মাদ্রাসা শিক্ষা বিভাগ, শিক্ষা মন্ত্রণালয়, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 font-mono transition-colors"
            >
              <Lock className="w-3 h-3 text-indigo-400" />
              <span>ERP Admin Login</span>
            </Link>
            
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Scroll to top"
              title="শীর্ষে যান"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
