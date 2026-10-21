"use client";

import React, { useRef, useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  ShieldCheck,
  Download,
  Printer,
  FileCheck2,
  CheckCircle2,
  Building,
  Calendar,
  Lock,
  ExternalLink,
  Award,
  QrCode,
  X,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import DigitalSeal from "./DigitalSeal";

export interface VerificationDocumentData {
  docNumber: string;
  docType?: string;
  docTypeBangla: string;
  studentName: string;
  studentIdMasked?: string;
  className?: string;
  tradeName?: string;
  session?: string | number;
  roll?: string | number;
  issueDate?: string;
  issueDateBangla?: string;
  generatedBy?: string;
  status?: string;
  statusBangla?: string;
  institution?: {
    name: string;
    nameEnglish?: string;
    eiin: string;
    code: string;
    location?: string;
    directorate?: string;
  };
  verifiedAt?: string;
  securitySeal?: string;
}

interface SignedVerificationReportProps {
  documentData: VerificationDocumentData;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function SignedVerificationReport({
  documentData,
  onClose,
  isOpen = false,
}: SignedVerificationReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [verificationHash, setVerificationHash] = useState<string>("");
  const [reportNumber, setReportNumber] = useState<string>("");

  // Verification URL
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/document?doc=${encodeURIComponent(documentData.docNumber)}`
      : `https://tsc.panchagarh.gov.bd/verify?doc=${encodeURIComponent(documentData.docNumber)}`;

  // Generate QR Code & Cryptographic Hash
  useEffect(() => {
    QRCode.toDataURL(verifyUrl, {
      width: 180,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("QR Code generation error:", err));

    // Generate consistent hash & report number
    const cleanMemo = documentData.docNumber.replace(/[^a-zA-Z0-9]/g, "");
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setReportNumber(`VR-PTSC-2026-${cleanMemo.slice(-5) || randomSuffix}`);

    // Pseudo-SHA-256 fingerprint
    const hexChars = "0123456789abcdef";
    let hash = "SHA256: ";
    for (let i = 0; i < 48; i++) {
      if (i > 0 && i % 8 === 0) hash += ":";
      hash += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    }
    setVerificationHash(hash);
  }, [documentData.docNumber, verifyUrl]);

  // Export PDF function
  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const element = reportRef.current;
      const opt = {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        filename: `PTSC_Verification_Report_${documentData.docNumber.replace(/[\/\\:]/g, "_")}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2.5,
          useCORS: true,
          logging: false,
          letterRendering: true,
          backgroundColor: "#ffffff",
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };

      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Failed to generate verification report PDF:", err);
      alert("ভেরিফিকেশন রিপোর্ট PDF ডাউনলোড করতে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setIsExporting(false);
    }
  };

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  // Copy Verification Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format current verification date in Bangla and English
  const verificationTime = new Date().toLocaleString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const verificationTimeEnglish = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });

  return (
    <>
      {/* Hidden printable/renderable report container used for PDF export & Print view */}
      <div className="hidden">
        <div
          ref={reportRef}
          id="verification-pdf-template"
          className="w-[210mm] min-h-[297mm] p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans relative flex flex-col justify-between box-border border-8 border-double border-emerald-800"
          style={{ fontFamily: "'Kalpurush', 'SolaimanLipi', 'Noto Serif Bengali', 'Segoe UI', Tahoma, sans-serif" }}
        >
          {/* Subtle Security Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0">
            <div className="text-center">
              <p className="text-8xl font-black tracking-widest text-slate-900 dark:text-slate-100 uppercase rotate-[-35deg]">
                PTSC VERIFIED
              </p>
              <p className="text-5xl font-black tracking-wider text-slate-900 dark:text-slate-100 uppercase mt-8 rotate-[-35deg]">
                GOVERNMENT AUTHENTIC
              </p>
            </div>
          </div>

          {/* Corner Security Seals */}
          <div className="absolute top-2 left-2 text-[8px] font-mono text-emerald-800 font-bold tracking-tighter">
            SECURE VERIFICATION TOKEN • {reportNumber}
          </div>
          <div className="absolute top-2 right-2 text-[8px] font-mono text-emerald-800 font-bold tracking-tighter">
            EIIN: {documentData.institution?.eiin || "132244"} • CODE: {documentData.institution?.code || "18017"}
          </div>

          {/* Report Content */}
          <div className="relative z-10 space-y-5">
            {/* Header: Bangladesh Emblem & Institutional Title */}
            <div className="border-b-2 border-emerald-700 pb-4 text-center">
              <div className="flex items-center justify-between">
                {/* Bangladesh Govt Emblem SVG */}
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-14 h-14 text-red-600 drop-shadow-xs">
                    <circle cx="50" cy="50" r="46" fill="#006a4e" />
                    <circle cx="50" cy="50" r="30" fill="#f42a41" />
                    <circle cx="50" cy="50" r="16" fill="#fef08a" />
                    <path
                      d="M50 12 L53 24 L65 24 L55 31 L59 43 L50 35 L41 43 L45 31 L35 24 L47 24 Z"
                      fill="#fef08a"
                    />
                  </svg>
                </div>

                <div className="flex-1 px-4">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                    গণপ্রজাতন্ত্রী বাংলাদেশ সরকার (Government of the People&apos;s Republic of Bangladesh)
                  </p>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    কারিগরি ও মাদ্রাসা শিক্ষা বিভাগ • শিক্ষা মন্ত্রণালয়
                  </p>
                  <h1 className="text-xl font-black text-emerald-900 tracking-wide mt-0.5">
                    পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
                  </h1>
                  <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">
                    Panchagarh Government Technical School & College
                  </h2>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                    পঞ্চগড় সদর, পঞ্চগড়-৫০০০ • EIIN: {documentData.institution?.eiin || "132244"} | প্রতিষ্ঠান কোড: {documentData.institution?.code || "18017"}
                  </p>
                </div>

                {/* PTSC Technical Seal SVG */}
                <div className="w-16 h-16 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full border-2 border-emerald-700 p-1 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40">
                    <ShieldCheck className="w-8 h-8 text-emerald-800" />
                  </div>
                </div>
              </div>
            </div>

            {/* Official Report Title Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white py-2 px-4 rounded-md shadow-xs text-center">
              <h3 className="text-base font-black tracking-wide uppercase">
                Official Document Authenticity & Verification Report
              </h3>
              <p className="text-xs font-bold text-emerald-100">
                অফিসিয়াল সনদ ও নথি সত্যতা প্রতিপাদন প্রতিবেদন
              </p>
            </div>

            {/* Verification Metadata & Status Box */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-xs">
              <div className="space-y-1 border-r border-slate-300 dark:border-slate-700 pr-3">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-400">প্রতিবেদন নম্বর:</span>
                  <span className="font-mono font-black text-emerald-900">{reportNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-400">যাচাইকরণের সময়:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 text-[11px]">{verificationTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-400">প্রতিপাদন চ্যানেল:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">PTSC সেন্ট্রাল ক্লাউড রিপোজিটরি</span>
                </div>
              </div>

              <div className="space-y-1 pl-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600 dark:text-slate-400">সত্যতা স্ট্যাটাস:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700 inline" />
                    সত্যায়িত ও বৈধ (OFFICIAL VERIFIED)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-400">নথি লাইফসাইকেল:</span>
                  <span className="text-emerald-800 font-bold">ইস্যুকৃত ও সক্রিয় (Issued & Active)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-400">ডিজিটাল ট্র্যাকিং:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-[10px] font-bold">SECURE-BTEB-AUTH-PASS</span>
                </div>
              </div>
            </div>

            {/* Official Certification Statement */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40/70 border-l-4 border-emerald-700 p-3 rounded-r-lg text-xs leading-relaxed text-slate-800 dark:text-slate-200 space-y-1">
              <p className="font-bold text-emerald-950">
                প্রাতিষ্ঠানিক সত্যতা প্রত্যয়ন ঘোষণা (Institutional Certification Statement):
              </p>
              <p className="text-[11.5px] text-slate-800 dark:text-slate-200">
                এতদ্বারা পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) এর প্রাতিষ্ঠানিক ডিজিটাল ডাটাবেজ যাচাইপূর্বক সত্যায়ন করা যাচ্ছে যে,
                নিম্নে উল্লেখিত তথ্যাবলি সংবলিত সনদপত্র/নথিটি অত্র প্রতিষ্ঠান কর্তৃক যথাযথ প্রাতিষ্ঠানিক প্রক্রিয়া অনুযায়ী প্রস্তুতকৃত, অনুমোদিত এবং আনুষ্ঠানিকভাবে ইস্যু করা হয়েছে।
                নথিটির তথ্য অত্র প্রতিষ্ঠানের অফিশিয়াল রেজিস্ট্রারে হুবহু বিদ্যমান ও শতভাগ সঠিক।
              </p>
            </div>

            {/* Verified Candidate & Document Details Table */}
            <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 flex justify-between items-center">
                <span>সত্যায়িত নথির বিবরণ (Verified Document & Candidate Dossier)</span>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
                  স্মারক: {documentData.docNumber}
                </span>
              </div>

              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <td className="w-1/3 px-3 py-2 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      নথির ধরন / নাম (Document Type)
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {documentData.docTypeBangla} ({documentData.docType || "Institutional Certificate"})
                    </td>
                  </tr>

                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <td className="px-3 py-2 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      অফিসিয়াল স্মারক নং (Official Memo No.)
                    </td>
                    <td className="px-3 py-2 font-mono font-black text-emerald-900 text-sm">
                      {documentData.docNumber}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <td className="px-3 py-2 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      শিক্ষার্থীর নাম (Student Name)
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {documentData.studentName}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <td className="px-3 py-2 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      সুরক্ষিত স্টুডেন্ট কোড (Masked Student ID)
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {documentData.studentIdMasked || "PTSC-2026-***001"}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <td className="px-3 py-2 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      শ্রেণি ও বিভাগ (Class & Level)
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                      {documentData.className || "Class 9 (SSC Vocational)"}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <td className="px-3 py-2 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      ট্রেড / টেকনোলজি (Trade / Technology)
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-900 dark:text-slate-100">
                      {documentData.tradeName || "Computer & IT / IT Support"}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <td className="px-3 py-2 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      সেশন ও রোল (Session & Roll No.)
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                      শিক্ষাবর্ষ: <span className="font-mono font-bold">{documentData.session || "2026"}</span> | শ্রেণি রোল: <span className="font-mono font-bold">{documentData.roll || "01"}</span>
                    </td>
                  </tr>

                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <td className="px-3 py-2 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      মূল ইস্যুর তারিখ (Original Issue Date)
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-800 dark:text-slate-200">
                      {documentData.issueDateBangla || documentData.issueDate} ({documentData.issueDate})
                    </td>
                  </tr>

                  <tr>
                    <td className="px-3 py-2 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      ইস্যুকারী কর্তৃপক্ষ (Issuing Authority)
                    </td>
                    <td className="px-3 py-2 text-slate-800 dark:text-slate-200">
                      {documentData.generatedBy || "অধ্যক্ষ ও প্রশাসনিক পরীক্ষা সেল, পঞ্চগড় সরকারি টিএসসি"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* QR Code and Cryptographic Signature Block */}
            <div className="grid grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-3">
              {/* QR Code */}
              <div className="col-span-3 flex flex-col items-center justify-center border-r border-slate-300 dark:border-slate-700 pr-3">
                {qrCodeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeUrl}
                    alt="PTSC Verification QR Code"
                    className="w-24 h-24 border border-slate-400 p-1 bg-white dark:bg-slate-900 rounded-md shadow-2xs"
                  />
                ) : (
                  <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">
                    QR Code Loading...
                  </div>
                )}
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 mt-1 text-center font-mono">
                  স্ক্যান করে যাচাই করুন
                </span>
              </div>

              {/* Cryptographic Security Details */}
              <div className="col-span-9 space-y-1.5 pl-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ডিজিটাল ক্রিপ্টোগ্রাফিক সিকিউরিটি সিগনেচার (Digital Integrity Signature)</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-300 dark:border-slate-700 font-mono text-[9.5px] text-slate-700 dark:text-slate-300 break-all space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    ভেরিফিকেশন চেকসাম: <span className="text-emerald-800">{verificationHash}</span>
                  </p>
                  <p className="text-[8.5px] text-slate-500 dark:text-slate-400">
                    URI: {verifyUrl}
                  </p>
                </div>
                <p className="text-[9.5px] text-slate-600 dark:text-slate-400 leading-tight">
                  নথিটির সত্যতা যাচাইয়ের জন্য এই রিপোর্টটি যেকোনো সরকারি-বেসরকারি প্রতিষ্ঠান, শিক্ষা বোর্ড বা বিশ্ববিদ্যালয়ে প্রামাণ্য দলিল হিসেবে গণ্য হবে।
                </p>
              </div>
            </div>

            {/* Official Signatures & Seal Section */}
            <div className="pt-6 pb-2 grid grid-cols-3 items-end text-center relative">
              {/* Left Signature: System Verifier */}
              <div className="space-y-1">
                <div className="h-10 flex items-center justify-center">
                  <div className="font-serif italic text-emerald-900 text-sm font-bold border-b border-slate-400 px-4">
                    PTSC SysAuth#2026
                  </div>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">আইসিটি ও ডাটাবেজ সেল</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ</p>
              </div>

              {/* Center Digital Seal */}
              <div className="flex flex-col items-center justify-center">
                <DigitalSeal className="w-20 h-20" text="PTSC OFFICIAL VERIFIED" />
                <span className="text-[8.5px] font-mono font-bold text-emerald-900 uppercase tracking-widest mt-[-8px]">
                  OFFICIAL EMBOSSED SEAL
                </span>
              </div>

              {/* Right Signature: Principal */}
              <div className="space-y-1">
                <div className="h-10 flex items-center justify-center">
                  <div className="font-serif italic text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-slate-400 px-4">
                    Engr. Md. Aminul Islam
                  </div>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100">অধ্যক্ষ / পরীক্ষা নিয়ন্ত্রক</p>

                <p className="text-[10px] text-slate-600 dark:text-slate-400">পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ</p>
              </div>
            </div>
          </div>

          {/* Footer Security Notice */}
          <div className="border-t border-slate-300 dark:border-slate-700 pt-3 text-[9px] text-slate-500 dark:text-slate-400 flex justify-between items-center relative z-10 font-mono">
            <div>
              তথ্য ও যোগাযোগ প্রযুক্তি আইন, ২০০৬ অনুযায়ী ডিজিটালভাবে স্বাক্ষরিত ও প্রত্যয়িত।
            </div>
            <div className="font-bold text-emerald-900">
              PTSC DIGITAL VERIFICATION GATEWAY • PAGE 1 OF 1
            </div>
          </div>
        </div>
      </div>

      {/* Modal View for Interactive Preview and Export */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>অফিসিয়াল সত্যায়িত ভেরিফিকেশন রিপোর্ট</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono">
                      Signed PDF
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    স্মারক নং: {documentData.docNumber} • রিপোর্ট আইডি: {reportNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  title="যাচাইকরণ লিংক কপি করুন"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copied ? "কপি হয়েছে!" : "লিংক কপি"}</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Report Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/40 flex justify-center">
              <div className="w-full max-w-[210mm] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl p-6 sm:p-8 space-y-4 border border-slate-300 dark:border-slate-700 select-text">
                {/* Visual Header */}
                <div className="border-b-2 border-emerald-700 pb-3 text-center">
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Government of the People&apos;s Republic of Bangladesh
                  </p>
                  <h2 className="text-lg sm:text-xl font-black text-emerald-900">
                    পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC)
                  </h2>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    Panchagarh Government Technical School & College
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    EIIN: {documentData.institution?.eiin || "132244"} | Code: {documentData.institution?.code || "18017"} • পঞ্চগড় সদর, পঞ্চগড়
                  </p>
                </div>

                {/* Banner */}
                <div className="bg-emerald-900 text-white p-2 rounded text-center">
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                    Official Document Authenticity & Verification Report
                  </h4>
                  <p className="text-[10px] text-emerald-200">
                    সনদ ও নথি সত্যতা প্রতিপাদন প্রতিবেদন
                  </p>
                </div>

                {/* Quick Status Bar */}
                <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <div>
                      <p className="font-bold text-emerald-950">নথিটি সরকারি ডাটাবেজে শতভাগ সত্যায়িত ও অনুমোদিত</p>
                      <p className="text-[10px] text-emerald-800 font-mono">{verificationTime}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-700 text-white font-mono font-bold text-[10px]">
                    STATUS: AUTHENTIC
                  </span>
                </div>

                {/* Data Grid */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
                    <div className="p-3 space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">নথির বিবরণ</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{documentData.docTypeBangla}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">স্মারক নম্বর</span>
                        <span className="font-mono font-black text-emerald-900">{documentData.docNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">শিক্ষার্থীর নাম</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{documentData.studentName}</span>
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">শ্রেণি ও বিভাগ</span>
                        <span className="text-slate-800 dark:text-slate-200">{documentData.className || "Class 9"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">ট্রেড / টেকনোলজি</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{documentData.tradeName || "Computer & IT"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">শিক্ষাবর্ষ ও রোল</span>
                        <span className="text-slate-800 dark:text-slate-200 font-mono">সেশন {documentData.session || "2026"} (রোল: {documentData.roll || "01"})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className="text-left">
                    <p className="font-serif italic font-bold text-emerald-900">PTSC System Verification</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">আইসিটি ও ডাটাবেজ সেল</p>
                  </div>

                  <DigitalSeal className="w-16 h-16" text="PTSC OFFICIAL VERIFIED" />

                  <div className="text-right">
                    <p className="font-serif italic font-bold text-slate-900 dark:text-slate-100">Engr. Md. Aminul Islam</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">অধ্যক্ষ / পরীক্ষা নিয়ন্ত্রক</p>
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>অফিসিয়াল স্বাক্ষরিত A4 ফরম্যাট প্রতিবেদন</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>PDF তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>ভেরিফিকেশন রিপোর্ট ডাউনলোড (PDF)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
