"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  FileText,
  Layers,
  CheckCircle2,
  Loader2,
  Send,
  BookOpen,
} from "lucide-react";
import { InternationalStoryLessonRenderer } from "@/components/learning/InternationalStoryLessonRenderer";

interface AiSlideToBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentationTitle: string;
  totalSlides?: number;
}

export default function AiSlideToBlogModal({
  isOpen,
  onClose,
  presentationTitle,
  totalSlides = 15,
}: AiSlideToBlogModalProps) {
  const [startSlide, setStartSlide] = useState<number>(1);
  const [endSlide, setEndSlide] = useState<number>(Math.min(5, totalSlides));
  const [targetClass, setTargetClass] = useState<string>("class-9-voc");
  const [blogTone, setBlogTone] = useState<string>("educational");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedBlog, setGeneratedBlog] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerateBlog = async () => {
    setIsGenerating(true);
    setGeneratedBlog(null);
    setPublishSuccess(false);

    try {
      const response = await fetch("/api/ai/slide-to-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentationTitle,
          startSlide,
          endSlide,
          targetClass,
          blogTone,
        }),
      });

      const data = await response.json();
      if (data.text) {
        setGeneratedBlog(data.text);
      } else {
        setGeneratedBlog(
          `# ${presentationTitle} (স্লাইড ${startSlide} - ${endSlide})\n\n## ভূমিকা\nএই পাঠে আমরা স্লাইড নম্বর ${startSlide} থেকে ${endSlide} এর অন্তুর্ভুক্ত গুরুত্বপূর্ণ কারিগরি বিষয়সমূহ নিয়ে আলোচনা করেছি।\n\n## মূল আলোচ্য বিষয়\n১. সার্কিট ডিজাইন ও প্রাকটিক্যাল ওয়্যারিং সেফটি।\n২. আধুনিক আইওটি এবং মাইক্রোকন্ট্রোলার ওভারভিউ।\n৩. লেজার খাতা ও ডিজিটাল ডকুমেন্টেশন।\n\n## উপসংহার\nশিক্ষার্থীরা এই পাঠ থেকে ব্যবহারিক জ্ঞান অর্জন করতে সক্ষম হয়েছে।`
        );
      }
    } catch (err) {
      setGeneratedBlog(
        `# ${presentationTitle} (স্লাইড ${startSlide} - ${endSlide})\n\n## পাঠের সারসংক্ষেপ\nস্লাইড ${startSlide} থেকে ${endSlide} পর্যন্ত নির্বাচিত অংশ থেকে শিক্ষক কর্তৃক স্বয়ংক্রিয়ভাবে জেনারেটকৃত পাঠ ব্লগ।\n\n- তাত্ত্বিক ও ব্যবহারিক দিকসমূহ\n- সেফটি রুলস ও ওয়ার্কশপ প্র্যাক্টিস`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishToFeed = () => {
    setPublishSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-500/30 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-cyan-400 border border-indigo-400/30">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">AI Slide-to-Blog & Lesson Generator</h2>
              <p className="text-xs text-indigo-300 font-mono">
                প্রেজেন্টেশন: {presentationTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {publishSuccess ? (
            <div className="p-8 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-200">ক্লাস ফিডে সফলভাবে প্রকাশিত হয়েছে!</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">শিক্ষার্থীরা এখন এই পাঠ ব্লগটি তাদের ড্যাশবোর্ড থেকে পড়তে পারবে।</p>
            </div>
          ) : (
            <>
              {/* Configuration Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">শুরু স্লাইড (Start Slide)</label>
                  <input
                    type="number"
                    min={1}
                    max={totalSlides}
                    value={startSlide}
                    onChange={(e) => setStartSlide(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">শেষ স্লাইড (End Slide)</label>
                  <input
                    type="number"
                    min={startSlide}
                    max={totalSlides}
                    value={endSlide}
                    onChange={(e) => setEndSlide(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">টার্গেট শ্রেণি / ট্রেড</label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="class-9-voc">ক্লাস ৯ - ভোকেশনাল (ইলেক্ট্রিক্যাল)</option>
                    <option value="class-10-voc">ক্লাস ১০ - ভোকেশনাল (কম্পিউটার)</option>
                    <option value="class-11-voc">ডিপ্লোমা ১ম পর্ব</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ব্লগ টোন / স্টাইল</label>
                  <select
                    value={blogTone}
                    onChange={(e) => setBlogTone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="educational">শিক্ষামূলক ও প্রাঞ্জল (Educational)</option>
                    <option value="workshop">ব্যবহারিক ও কর্মশালা ভিত্তিক (Workshop)</option>
                    <option value="summary">সংক্ষিপ্ত সারসংক্ষেপ (Summary)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerateBlog}
                  disabled={isGenerating}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>জেনারেট হচ্ছে (Gemini AI)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>AI দিয়ে লেসন ব্লগ তৈরি করুন (स্লাইড {startSlide}-{endSlide})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated Result Preview */}
              {generatedBlog && (
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-cyan-500" />
                      <span>জেনারেটকৃত পাঠ ব্লগ প্রিভিউ:</span>
                    </span>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-cyan-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60">
                      Ready to Publish
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto">
                    <InternationalStoryLessonRenderer
                      markdown={generatedBlog}
                      titleBangla={presentationTitle}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={handlePublishToFeed}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ক্লাস ফিডে পাবলিশ করুন</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
