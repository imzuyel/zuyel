"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, CheckCircle2, Sparkles, UploadCloud, ChevronDown, X, 
  FileCheck, AlertCircle, Loader2, Plus, ArrowRight, ShieldCheck, Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DocumentRepoItem } from "@/lib/documentRepository";
import { toast } from "sonner";

interface SmartPdfPickerDropdownProps {
  classId: string;
  tradeCode?: string;
  onSelectDocument: (doc: DocumentRepoItem) => void;
  onClearDocument?: () => void;
  activeDocumentId?: string;
}

export default function SmartPdfPickerDropdown({
  classId,
  tradeCode,
  onSelectDocument,
  onClearDocument,
  activeDocumentId
}: SmartPdfPickerDropdownProps) {
  const [documents, setDocuments] = useState<DocumentRepoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Upload Form States
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState<"Syllabus" | "Curriculum PDF" | "Lecture Notes">("Syllabus");
  const [uploadText, setUploadText] = useState("");
  const [submittingUpload, setSubmittingUpload] = useState(false);

  // Fetch matching documents whenever classId or tradeCode changes
  useEffect(() => {
    fetchMatchingDocs();
  }, [classId, tradeCode]);

  const fetchMatchingDocs = async () => {
    setLoading(true);
    try {
      let url = `/api/documents/repository`;
      const queryParams = new URLSearchParams();
      if (classId && classId !== "undefined" && classId !== "null") {
        queryParams.append("classId", String(classId));
      }
      if (tradeCode && tradeCode !== "undefined" && tradeCode !== "null") {
        queryParams.append("tradeCode", String(tradeCode));
      }
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[SmartPdfPicker] HTTP ${res.status} returned from ${url}`);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("[SmartPdfPicker] Received non-JSON response from server");
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.warn("Error loading documents safely caught:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (docId: string) => {
    const matched = documents.find((d) => d.id === docId);
    if (matched) {
      onSelectDocument(matched);
      toast.success(`'${matched.titleBangla}' সিলেক্ট ও অটো-ডিটেক্ট করা হয়েছে!`);
    }
  };

  const handleUploadNew = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!uploadTitle.trim()) {
      toast.error("অনুগ্রহ করে সিলেবাস বা পিডিএফ ফাইলের নাম লিখুন।");
      return;
    }

    setSubmittingUpload(true);
    try {
      const res = await fetch("/api/documents/repository", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle,
          titleBangla: uploadTitle,
          classId,
          tradeCode: tradeCode || "SSC-T1",
          category: uploadCategory,
          extractedTextSnippet: uploadText || "বিটিইবি প্রাকটিক্যাল ল্যাব ও থিওরি সিলেবাস গাইড।",
          fileSize: "2.5 MB"
        })
      });

      if (!res.ok) {
        toast.error("আপলোড সার্ভিস থেকে রেসপন্স ব্যর্থ হয়েছে।");
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        toast.error("সার্ভার থেকে রেসপন্স ফরম্যাট সঠিক নয়।");
        return;
      }

      const data = await res.json();
      if (data.success && data.document) {
        toast.success("নতুন সিলেবাস রিপোজিটরিতে যুক্ত এবং অটো-সিলেক্ট করা হয়েছে!");
        setDocuments((prev) => [data.document, ...prev]);
        onSelectDocument(data.document);
        setUploadModalOpen(false);
        setUploadTitle("");
        setUploadText("");
      } else {
        toast.error(data.error || "আপলোড করতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      toast.error("সার্ভার সংযোগে ত্রুটি।");
    } finally {
      setSubmittingUpload(false);
    }
  };

  const selectedDoc = documents.find((d) => d.id === activeDocumentId);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>স্মার্ট সিলেবাস ও কারিকুলাম পিডিএফ (Auto-Detection)</span>
        </label>

        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>নতুন PDF আপলোড</span>
        </button>
      </div>

      {loading ? (
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          <span>উপযুক্ত সিলেবাস পিডিএফ অটো-ডিটেক্ট করা হচ্ছে...</span>
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-2">
          <div className="relative">
            <select
              value={activeDocumentId || ""}
              onChange={(e) => {
                if (e.target.value === "new") {
                  setUploadModalOpen(true);
                } else if (e.target.value === "") {
                  if (onClearDocument) onClearDocument();
                } else {
                  handleSelect(e.target.value);
                }
              }}
              className="w-full p-2.5 pr-8 bg-slate-950/90 border border-cyan-500/30 rounded-xl text-xs font-bold text-white focus:border-cyan-400 outline-hidden cursor-pointer"
            >
              <option value="">-- পূর্বে আপলোডকৃত সিলেবাস সিলেক্ট করুন ({documents.length}টি) --</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  📄 {doc.titleBangla} ({doc.category} • {doc.fileSize})
                </option>
              ))}
              <option value="new">➕ নতুন সিলেবাস পিডিএফ আপলোড করুন...</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
          </div>

          {/* Active Auto-Detected Badge Indicator */}
          {selectedDoc && (
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-cyan-200 flex items-start justify-between gap-2 animate-fade-in">
              <div className="space-y-0.5">
                <span className="font-extrabold flex items-center gap-1 text-cyan-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>অটো-ডিটেক্টেড: {selectedDoc.titleBangla}</span>
                </span>
                <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                  "{selectedDoc.extractedTextSnippet}"
                </p>
              </div>

              {onClearDocument && (
                <button
                  type="button"
                  onClick={onClearDocument}
                  className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white shrink-0"
                  title="রিমুভ করুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px]">এই শ্রেণি ও ট্রেডের জন্য কোনো পূর্ববর্তী পিডিএফ পাওয়া যায়নি।</span>
          </div>

          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold shrink-0 transition"
          >
            আপলোড করুন
          </button>
        </div>
      )}

      {/* FALLBACK UPLOAD MODAL */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">নতুন সিলেবাস PDF রিপোজিটরিতে যোগ করুন</h3>
                    <p className="text-[10px] text-slate-400">সেন্ট্রাল ডাটাবেজে ফাইল ও বিষয়বস্তু সিঙ্ক হবে</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">পিডিএফ / সিলেবাসের নাম *</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="যেমন: ১০ম শ্রেণি জেনারেল ইলেকট্রিক্যাল ওয়ার্কস প্রাকটিক্যাল গাইড"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">ক্যাটাগরি</label>
                  <select
                    value={uploadCategory}
                    onChange={(e: any) => setUploadCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold text-slate-200 outline-hidden"
                  >
                    <option value="Syllabus">Syllabus (পাঠ্যসূচি)</option>
                    <option value="Curriculum PDF">Curriculum PDF (কারিকুলাম)</option>
                    <option value="Lecture Notes">Lecture Notes (লেকচার নোট)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">সিলেবাস এক্সট্র্যাক্ট নোটস / মূল অধ্যায়সমূহ</label>
                  <textarea
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    placeholder="এই পিডিএফের মূল টপিক বা অধ্যায়ের বিবরণ লিখুন..."
                    rows={3}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-medium text-slate-200 outline-hidden resize-none"
                  />
                </div>

                <div className="p-3 rounded-2xl border border-dashed border-cyan-500/40 bg-cyan-500/5 text-center text-slate-400 space-y-1">
                  <FileText className="w-6 h-6 text-cyan-400 mx-auto" />
                  <p className="text-[11px] font-bold text-slate-300">পিডিএফ ড্রাগ অ্যান্ড ড্রপ করুন (Drag & Drop)</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400">সর্বোচ্চ ১০ মেগাবাইট • PDF, DOCX সমর্থিত</p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadNew}
                    disabled={submittingUpload}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {submittingUpload ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>রিপোজিটরিতে সেভ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
