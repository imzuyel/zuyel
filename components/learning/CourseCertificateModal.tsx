"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Award,
  Download,
  Printer,
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  User,
  BookOpen,
  Share2,
  Loader2,
  ShieldCheck,
  Star,
} from "lucide-react";
import { toast } from "sonner";

interface CourseCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentRoll: string;
  courseTitle: string;
  courseTitleBangla: string;
  className?: string;
  tradeName?: string;
  completionDate?: string;
  earnedXp?: number;
  totalStars?: number;
  certificateId?: string;
}

export function CourseCertificateModal({
  isOpen,
  onClose,
  studentName,
  studentRoll,
  courseTitle,
  courseTitleBangla,
  className = "কারিগরি শাখা",
  tradeName = "জেনারেল ভোকেশনাল",
  completionDate,
  earnedXp = 250,
  totalStars = 5,
  certificateId,
}: CourseCertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const formattedDate =
    completionDate ||
    new Intl.DateTimeFormat("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());

  const certNumber =
    certificateId ||
    `PTSC-CERT-${studentRoll.replace(/\D/g, "") || "2026"}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Download certificate as high-resolution PDF
  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;

    try {
      setDownloading(true);
      toast.info("সনদপত্রের হাই-রেজোলিউশন পিডিএফ তৈরি হচ্ছে...");

      // Render DOM element to canvas with high scale for crisp print quality
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#fffdfa",
      });

      const imgData = canvas.toDataURL("image/png");

      // Landscape A4 orientation (297mm x 210mm)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Fit image neatly onto A4 page with margins
      const margin = 10;
      const printWidth = pdfWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", margin, (pdfHeight - printHeight) / 2, printWidth, printHeight);

      const fileName = `PTSC_Certificate_${studentRoll || "Student"}_${courseTitle.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);

      toast.success("সনদপত্র সফলভাবে ডাউনলোড হয়েছে! 🎉");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("পিডিএফ তৈরি করতে সমস্যা হয়েছে। দয়া করে প্রিন্ট বাটন ব্যবহার করুন।");
    } finally {
      setDownloading(false);
    }
  };

  // Direct Browser Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                অফিসিয়াল কোর্স সমাপ্তি স্বীকৃতি
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                কোর্স কমপ্লিশন সনদপত্র (Certificate of Completion)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{downloading ? "পিডিএফ তৈরি হচ্ছে..." : "PDF ডাউনলোড"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer hidden sm:flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Certificate Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/60 flex items-center justify-center">
          {/* THE CERTIFICATE CANVAS DOM NODE */}
          <div
            ref={certificateRef}
            id="ptsc-course-certificate"
            className="w-full max-w-[900px] bg-[#fffdfa] text-slate-900 rounded-2xl p-6 sm:p-10 border-8 border-double border-amber-600/70 shadow-2xl relative overflow-hidden select-none"
            style={{
              fontFamily: "'Hind Siliguri', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            }}
          >
            {/* Guilloche / Luxury Gold Ornaments Background */}
            <div className="absolute inset-2 border-2 border-amber-500/30 rounded-xl pointer-events-none" />
            <div className="absolute top-2 left-2 w-12 h-12 border-t-4 border-l-4 border-amber-600/80 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2 right-2 w-12 h-12 border-t-4 border-r-4 border-amber-600/80 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-12 h-12 border-b-4 border-l-4 border-amber-600/80 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-12 h-12 border-b-4 border-r-4 border-amber-600/80 rounded-br-lg pointer-events-none" />

            {/* Subtle Watermark Seal */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035]">
              <div className="w-80 h-80 rounded-full border-[12px] border-amber-900 flex items-center justify-center text-7xl font-black">
                PTSC
              </div>
            </div>

            {/* Header: Republic Crest & Institution Name */}
            <div className="text-center space-y-1 relative z-10">
              <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · কারিগরি শিক্ষা অধিদপ্তর</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
                পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Panchagarh Govt. Technical School & College · ই-লার্নিং ও দক্ষতা মূল্যায়ন সেল
              </p>
            </div>

            {/* Certificate Title Banner */}
            <div className="my-6 text-center relative z-10">
              <div className="inline-block relative">
                <h2 className="text-xl sm:text-3xl font-black text-amber-700 uppercase tracking-widest px-8 py-2 border-b-2 border-amber-500/60">
                  কোর্স সমাপ্তির সম্মানসূচক সনদপত্র
                </h2>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                  Certificate of Course Completion & Technical Competency
                </span>
              </div>
            </div>

            {/* Student Accolade Body */}
            <div className="space-y-4 text-center max-w-2xl mx-auto my-6 relative z-10">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                এতদ্বারা প্রত্যয়ন করা যাচ্ছে যে, সফলভাবে ও নিষ্ঠার সাথে সকল পাঠ, অধ্যায় এবং ব্যবহারিক কুইজ সম্পন্ন করায় শিক্ষার্থী—
              </p>

              <div className="py-2">
                <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight underline decoration-amber-500/60 decoration-2 underline-offset-8">
                  {studentName}
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs sm:text-sm font-semibold text-slate-700">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                    রোল নং: <strong>{studentRoll}</strong>
                  </span>
                  <span>•</span>
                  <span>{className}</span>
                  <span>•</span>
                  <span className="text-amber-800 font-bold">{tradeName}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                অত্র প্রতিষ্ঠানের ডিজিটাল লার্নিং পাঠ্যক্রমের আওতায় নিম্নলিখিত কারিগরি বিষয়টি সাফল্যের সাথে সম্পন্ন করেছেন:
              </p>

              {/* Course Title Highlight Box */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 shadow-xs">
                <h4 className="text-base sm:text-xl font-black text-amber-900">
                  {courseTitleBangla}
                </h4>
                <span className="text-xs text-amber-700 font-medium">({courseTitle})</span>
              </div>
            </div>

            {/* Gamification & Academic Performance Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto my-6 text-center relative z-10 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">অর্জিত দক্ষতা</span>
                <span className="text-sm sm:text-base font-black text-amber-700 font-mono">
                  +{earnedXp} XP
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">মাস্টারি রেটিং</span>
                <div className="flex items-center justify-center gap-0.5 pt-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < totalStars ? "fill-amber-400 text-amber-500" : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">ইস্যুর তারিখ</span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 block pt-0.5">
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Official Signatures & Verification Stamp */}
            <div className="pt-6 border-t border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 mt-6">
              {/* Left Signoff: Trade Instructor */}
              <div className="text-center space-y-1">
                <div className="w-36 h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                  <span className="text-xs font-serif text-slate-500 italic">Signature Verified</span>
                </div>
                <p className="text-xs font-bold text-slate-800">ট্রেড ইনস্ট্রাক্টর</p>
                <span className="text-[10px] text-slate-500 block">বিভাগীয় প্রধান, পিটিএসসি</span>
              </div>

              {/* Center Official Crest / Seal */}
              <div className="text-center space-y-1">
                <div className="w-16 h-16 rounded-full border-2 border-amber-600 bg-amber-50 flex items-center justify-center text-amber-800 font-black text-[10px] mx-auto shadow-inner">
                  <span>PTSC<br />OFFICIAL<br />SEAL</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 block tracking-tight">
                  আইডি: {certNumber}
                </span>
              </div>

              {/* Right Signoff: Principal */}
              <div className="text-center space-y-1">
                <div className="w-36 h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                  <span className="text-xs font-serif text-slate-700 italic font-bold">Md. Principal</span>
                </div>
                <p className="text-xs font-bold text-slate-900">অধ্যক্ষ / প্রতিষ্ঠান প্রধান</p>
                <span className="text-[10px] text-slate-500 block">পঞ্চগড় সরকারি টিএসসি</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 shrink-0 flex items-center justify-between px-5">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>সনদপত্রটি আপনার প্রাতিষ্ঠানিক ডিজিটাল প্রোফাইলে স্থায়ীভাবে সংরক্ষিত হয়েছে।</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold underline cursor-pointer"
          >
            পরবর্তী শিক্ষাক্রমে ফিরুন
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseCertificateModal;
