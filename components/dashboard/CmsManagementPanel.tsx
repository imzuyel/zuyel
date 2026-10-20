"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  School,
  Sparkles,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Plus,
  Search,
  FileText,
  Calendar,
  Image as ImageIcon,
  Save,
  Check,
  Loader2,
  X,
  ExternalLink,
  ChevronRight,
  Sliders,
  Settings,
  Bell,
  Download,
  Award
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function CmsManagementPanel() {
  const { showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<"general" | "sections" | "notices" | "events" | "gallery" | "downloads" | "results">("general");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // States for datasets
  const [cmsConfig, setCmsConfig] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals / Editors
  const [modalType, setModalType] = useState<"notice" | "event" | "gallery" | "download" | "result" | null>(null);
  const [editItem, setEditItem] = useState<any>(null);

  // Fetch all CMS relevant data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cmsRes, noticeRes, eventRes, galleryRes, downloadRes, resultRes] = await Promise.all([
        fetch("/api/cms"),
        fetch("/api/notices"),
        fetch("/api/events"),
        fetch("/api/gallery"),
        fetch("/api/downloads"),
        fetch("/api/results")
      ]);

      const [cmsData, noticeData, eventData, galleryData, downloadData, resultData] = await Promise.all([
        cmsRes.json(),
        noticeRes.json(),
        eventRes.json(),
        galleryRes.json(),
        downloadRes.json(),
        resultRes.json()
      ]);

      if (cmsData.success) setCmsConfig(cmsData.config);
      if (noticeData.success) setNotices(noticeData.items);
      if (eventData.success) setEvents(eventData.items);
      if (galleryData.success) setGallery(galleryData.items);
      if (downloadData.success) setDownloads(downloadData.items);
      if (resultData.success) setResults(resultData.pdfs);
    } catch (err) {
      console.error("Error loading CMS datasets:", err);
      showToast("সিএমএস ডাটা লোড করতে সমস্যা হয়েছে", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmsConfig),
      });
      const data = await res.json();
      if (data.success) {
        showToast("ওয়েবসাইট সিএমএস কনফিগারেশন সফলভাবে আপডেট করা হয়েছে।", "success");
        setCmsConfig(data.config);
      } else {
        showToast(data.error || "হালনাগাদ ব্যর্থ হয়েছে", "error");
      }
    } catch (err) {
      showToast("সার্ভার সংযোগে ত্রুটি", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSection = async (sectionKey: string) => {
    const updatedVisibility = {
      ...cmsConfig.sectionsVisibility,
      [sectionKey]: !cmsConfig.sectionsVisibility[sectionKey],
    };
    const updatedConfig = {
      ...cmsConfig,
      sectionsVisibility: updatedVisibility,
    };
    setCmsConfig(updatedConfig);

    try {
      const res = await fetch("/api/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`সেকশন '${sectionKey}' সফলভাবে ${updatedVisibility[sectionKey] ? "অন" : "অফ"} করা হয়েছে`, "success");
      }
    } catch (err) {
      showToast("সেকশন সেটিং সংরক্ষণ করা যায়নি", "error");
    }
  };

  // Generic CRUD Handlers
  const openAddModal = (type: typeof modalType) => {
    setModalType(type);
    setEditItem({});
  };

  const openEditModal = (type: typeof modalType, item: any) => {
    setModalType(type);
    setEditItem(item);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const isEdit = editItem.id !== undefined;
    const method = isEdit ? "PUT" : "POST";
    let endpoint = "";

    if (modalType === "notice") endpoint = "/api/notices";
    else if (modalType === "event") endpoint = "/api/events";
    else if (modalType === "gallery") endpoint = "/api/gallery";
    else if (modalType === "download") endpoint = "/api/downloads";
    else if (modalType === "result") endpoint = "/api/results";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "সংরক্ষণ সফল হয়েছে।", "success");
        setModalType(null);
        setEditItem(null);
        fetchData(); // reload
      } else {
        showToast(data.error || "সংরক্ষণ করা যায়নি", "error");
      }
    } catch (err) {
      showToast("নেটওয়ার্ক ত্রুটি ঘটেছে", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (type: typeof modalType, id: number) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই আইটেমটি ওয়েবসাইট থেকে সম্পূর্ণ মুছে ফেলতে চান?")) return;
    
    let endpoint = "";
    if (type === "notice") endpoint = `/api/notices?id=${id}`;
    else if (type === "event") endpoint = `/api/events?id=${id}`;
    else if (type === "gallery") endpoint = `/api/gallery?id=${id}`;
    else if (type === "download") endpoint = `/api/downloads?id=${id}`;
    else if (type === "result") endpoint = `/api/results?id=${id}`;

    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে।", "success");
        fetchData();
      } else {
        showToast(data.error || "মুছে ফেলা যায়নি", "error");
      }
    } catch (err) {
      showToast("সার্ভার ত্রুটি", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs">সিএমএস কন্ট্রোল প্যানেল লোড হচ্ছে...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Professional Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-bold border border-white/20">
            <Globe className="w-3.5 h-3.5" />
            <span>অফিশিয়াল ওয়েবসাইট সিএমএস (CMS Portal)</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            পাবলিক ওয়েবসাইট কন্টেন্ট ম্যানেজমেন্ট সিস্টেম
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            এখানে করা যেকোনো পরিবর্তন সরাসরি পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের পাবলিক পোর্টালে দৃশ্যমান হবে।
          </p>
        </div>
      </div>

      {/* Grid Tabs Selector */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: "general", label: "হোম ও প্রধান বাণী", icon: Settings },
          { id: "sections", label: "সেকশন নিয়ন্ত্রণ", icon: Sliders },
          { id: "notices", label: "নোটিশ বোর্ড", icon: Bell },
          { id: "events", label: "ক্যাম্পাস ইভেন্টস", icon: Calendar },
          { id: "gallery", label: "গ্যালারি ও ক্যাম্পাস", icon: ImageIcon },
          { id: "downloads", label: "ডাউনলোড হাব", icon: FileText },
          { id: "results", label: "অফিশিয়াল ফলাফল", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchQuery("");
                setCategoryFilter("all");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-6">
        
        {/* 1. GENERAL & HERO PANEL */}
        {activeTab === "general" && cmsConfig && (
          <form onSubmit={handleSaveGeneral} className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-600" />
                <span>প্রধান ব্যানার ও ল্যান্ডিং কন্টেন্ট (Hero Banner Settings)</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">পাবলিক হোমপেজের প্রধান আকর্ষণ ও ব্যানার টেক্সট এখান থেকে পরিবর্তন করুন।</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="font-bold block mb-1">ব্যানার মূল টাইটেল (Bangla)</label>
                <input
                  type="text"
                  value={cmsConfig.heroBanner.title}
                  onChange={(e) => setCmsConfig({
                    ...cmsConfig,
                    heroBanner: { ...cmsConfig.heroBanner, title: e.target.value }
                  })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">ব্যানার সাবটাইটেল / প্রতিষ্ঠানের নাম</label>
                <input
                  type="text"
                  value={cmsConfig.heroBanner.subtitle}
                  onChange={(e) => setCmsConfig({
                    ...cmsConfig,
                    heroBanner: { ...cmsConfig.heroBanner, subtitle: e.target.value }
                  })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-bold block mb-1">ব্যানার ভূমিকা বর্ণনা (Description)</label>
                <textarea
                  value={cmsConfig.heroBanner.description}
                  onChange={(e) => setCmsConfig({
                    ...cmsConfig,
                    heroBanner: { ...cmsConfig.heroBanner, description: e.target.value }
                  })}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">ব্যানার ব্যাকগ্রাউন্ড ইমেজ লিঙ্ক (Unsplash/Direct link)</label>
                <input
                  type="text"
                  value={cmsConfig.heroBanner.imageUrl}
                  onChange={(e) => setCmsConfig({
                    ...cmsConfig,
                    heroBanner: { ...cmsConfig.heroBanner, imageUrl: e.target.value }
                  })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">কল টু অ্যাকশন বাটন টেক্সট</label>
                <input
                  type="text"
                  value={cmsConfig.heroBanner.buttonText}
                  onChange={(e) => setCmsConfig({
                    ...cmsConfig,
                    heroBanner: { ...cmsConfig.heroBanner, buttonText: e.target.value }
                  })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* TVET Slogans Slider Editor */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-500 animate-pulse" />
                  <span>কারিগরি শিক্ষা টেক্সট স্লাইডার স্লোগান (TVET Slogans Slider)</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">ল্যান্ডিং পেইজের প্রধান ব্যানারের নিচে ঘুরতে থাকা প্রিমিয়াম বাণীবদ্ধ লাইনসমূহ (প্রতি লাইনে একটি করে স্লোগান লিখুন):</p>
              </div>
              <div>
                <textarea
                  value={cmsConfig.heroBanner.heroSlides ? cmsConfig.heroBanner.heroSlides.join("\n") : ""}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n").filter((l) => l.trim() !== "");
                    setCmsConfig({
                      ...cmsConfig,
                      heroBanner: {
                        ...cmsConfig.heroBanner,
                        heroSlides: lines
                      }
                    });
                  }}
                  rows={5}
                  className="w-full p-3 font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white"
                  placeholder="কারিগরি শিক্ষায় গড়ব দেশ, স্মার্ট বাংলাদেশ গড়ার প্রত্যয়&#10;দক্ষ হাত, বিশ্বজুড়ে কর্মসংস্থান—কারিগরি শিক্ষার মূল অবদান"
                />
              </div>
            </div>

            {/* Principal message section */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>অধ্যক্ষ মহোদয়ের বাণী ও পরিচিতি (Principal Message Settings)</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">অধ্যক্ষের ছবি, নাম, পদবি এবং উক্তি বা বাণী কাস্টমাইজ করুন।</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="font-bold block mb-1">অধ্যক্ষের নাম</label>
                  <input
                    type="text"
                    value={cmsConfig.principal.name}
                    onChange={(e) => setCmsConfig({
                      ...cmsConfig,
                      principal: { ...cmsConfig.principal, name: e.target.value }
                    })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">পদবি (Designation)</label>
                  <input
                    type="text"
                    value={cmsConfig.principal.designation}
                    onChange={(e) => setCmsConfig({
                      ...cmsConfig,
                      principal: { ...cmsConfig.principal, designation: e.target.value }
                    })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">অধ্যক্ষের ছবি লিঙ্ক (Photo Link)</label>
                  <input
                    type="text"
                    value={cmsConfig.principal.photoUrl}
                    onChange={(e) => setCmsConfig({
                      ...cmsConfig,
                      principal: { ...cmsConfig.principal, photoUrl: e.target.value }
                    })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="font-bold block mb-1">অধ্যক্ষের বাণী / মূল বার্তা (Message)</label>
                  <textarea
                    value={cmsConfig.principal.message}
                    onChange={(e) => setCmsConfig({
                      ...cmsConfig,
                      principal: { ...cmsConfig.principal, message: e.target.value }
                    })}
                    rows={4}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl leading-relaxed"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>সেটিংস পরিবর্তন সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* 2. SECTIONS VISIBILITY CONTROL */}
        {activeTab === "sections" && cmsConfig && (
          <div className="space-y-6 text-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <span>হোমপেজ সেকশন নিয়ন্ত্রণ (Homepage Layout Switches)</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">ক্যাম্পাস ওয়েবসাইটের কোন কোন অংশ দর্শনার্থীদের সামনে প্রদর্শিত হবে তা নির্ধারণ করুন।</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: "hero", label: "১. প্রধান ব্যানার স্লাইডার", desc: "হোমপেজের প্রধান ব্যানার কন্টেন্ট" },
                { key: "ticker", label: "২. জরুরি ঘোষণা স্ক্রল", desc: "ব্যানারের নিচে জরুরি নোটিশ স্ক্রলার" },
                { key: "stats", label: "৩. প্রাতিষ্ঠানিক পরিসংখ্যান", desc: "মোট ছাত্র, ল্যাব, শিক্ষক ইত্যাদি" },
                { key: "intro", label: "৪. ইনস্টিটিউট পরিচিতি সারসংক্ষেপ", desc: "স্থাপিত সাল, ইতিহাস ও সংক্ষিপ্ত বর্ণনা" },
                { key: "principalMessage", label: "৫. অধ্যক্ষ মহোদয়ের বাণী", desc: "অধ্যক্ষের বাণী, পরিচিতি ও ছবি" },
                { key: "featuredNotices", label: "৬. সাম্প্রতিক নোটিশ প্রিভিউ", desc: "নোটিশ বোর্ডের শেষ ৩টি নোটিশ" },
                { key: "upcomingEvents", label: "৭. আপকামিং ইভেন্টস", desc: "ক্যাম্পাসে অনুষ্ঠিতব্য বিভিন্ন প্রোগ্রাম" },
                { key: "trades", label: "৮. বিভাগ ও কারিগরি ট্রেডসমূহ", desc: "জেনারেল ইলেকট্রনিক্স, আইটি ল্যাব ইত্যাদি" },
                { key: "results", label: "৯. সাম্প্রতিক ফলাফল গেজেট", desc: "বার্ষিক পরীক্ষার গ্রেড শিটের গেজেট" },
                { key: "galleryPreview", label: "১০. ফটো গ্যালারি প্রিভিউ", desc: "ক্যাম্পাসের শেষ কয়েকটি সুন্দর মুহূর্ত" },
                { key: "quickLinks", label: "১১. দ্রুত লিংক সমূহ", desc: "কারিগরি শিক্ষা বোর্ড, মন্ত্রণালয়ের ওয়েবসাইট" },
                { key: "contact", label: "১২. যোগাযোগ ও গুগল ম্যাপ", desc: "যোগাযোগের ঠিকানা, ল্যান্ডলাইন ও ম্যাপ" },
              ].map((sec) => {
                const isVisible = cmsConfig.sectionsVisibility[sec.key];
                return (
                  <div
                    key={sec.key}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isVisible
                        ? "bg-indigo-50/40 dark:bg-slate-800/40 border-indigo-200 dark:border-indigo-900/50"
                        : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-800 dark:text-white">{sec.label}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{sec.desc}</p>
                    </div>

                    <button
                      onClick={() => handleToggleSection(sec.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isVisible ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-900 shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isVisible ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. NOTICES MANAGEMENT PANEL */}
        {activeTab === "notices" && (
          <div className="space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  <span>নোটিশ বোর্ড ও জরুরি বুলেটিন ব্যবস্থাপনা</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">সব নোটিশ যোগ, সম্পাদন বা মুছে ফেলার কন্ট্রোল রুম।</p>
              </div>

              <button
                onClick={() => openAddModal("notice")}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন নোটিশ প্রকাশ করুন</span>
              </button>
            </div>

            {/* Notice Search & Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="নোটিশের শিরোনাম বা বিষয় দিয়ে সার্চ করুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">সকল নোটিশ</option>
                <option value="academic">একাডেমিক নোটিশ</option>
                <option value="exam">পরীক্ষা সংক্রান্ত</option>
                <option value="urgent">জরুরি নোটিশ</option>
                <option value="holiday">ছুটি সংক্রান্ত</option>
                <option value="admission">ভর্তি নোটিশ</option>
              </select>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-extrabold border-b border-slate-200/80 dark:border-slate-800">
                    <th className="p-4">তারিখ</th>
                    <th className="p-4">শ্রেনী / ক্যাটাগরি</th>
                    <th className="p-4">শিরোনাম (Bangla)</th>
                    <th className="p-4">সংযুক্তি ফাইল</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notices
                    .filter((n) => {
                      const matchSearch = n.titleBangla.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchCat = categoryFilter === "all" || n.category === categoryFilter;
                      return matchSearch && matchCat;
                    })
                    .map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/50 dark:hover:bg-slate-900/30 font-medium">
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">{n.publishedAt}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            n.isUrgent || n.category === "urgent"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
                              : "bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300"
                          }`}>
                            {n.categoryBangla || n.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-extrabold text-slate-900 dark:text-white">{n.titleBangla}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{n.content}</p>
                        </td>
                        <td className="p-4">
                          {n.attachmentName ? (
                            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <FileText className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="font-mono text-[11px] truncate max-w-[120px]">{n.attachmentName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal("notice", n)}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 dark:bg-indigo-950/40 hover:text-indigo-600 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                              title="সম্পাদন করুন"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem("notice", n.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:bg-rose-950/40 hover:text-rose-600 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. EVENTS MANAGEMENT PANEL */}
        {activeTab === "events" && (
          <div className="space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span>ক্যাম্পাস ইভেন্টস ও একাডেমিক ক্যালেন্ডার</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">বিজ্ঞান মেলা, সাংস্কৃতিক উৎসব, ক্রীড়া ও একাডেমিক প্রোগ্রামের সিডিউল কাস্টমাইজ করুন।</p>
              </div>

              <button
                onClick={() => openAddModal("event")}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ক্যাম্পেইন/ইভেন্ট যুক্ত করুন</span>
              </button>
            </div>

            {/* List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => (
                <div key={ev.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-slate-800 text-indigo-700 dark:text-cyan-400 font-bold text-[10px] uppercase">
                        {ev.type}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal("event", ev)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 dark:bg-indigo-950/40 hover:text-indigo-600 text-slate-500 dark:text-slate-400 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem("event", ev.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:bg-rose-950/40 hover:text-rose-600 text-slate-500 dark:text-slate-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{ev.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{ev.description}</p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} হতে ${ev.endDate}`}</span>
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{ev.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. PHOTO GALLERY MANAGEMENT PANEL */}
        {activeTab === "gallery" && (
          <div className="space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <span>ফটোগ্যালারি ও অ্যালবাম এডমিন প্যানেল</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">ক্যাম্পাসের ল্যাব, বিজ্ঞান মেলা ও সুন্দর মুহূর্তের ছবিসমূহ আপলোড ও এডিট করুন।</p>
              </div>

              <button
                onClick={() => openAddModal("gallery")}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ছবি আপলোড করুন</span>
              </button>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((img) => (
                <div key={img.id} className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between">
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={img.imageUrl}
                      alt={img.titleBangla}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white font-bold text-[10px]">
                      {img.categoryBangla}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{img.titleBangla}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{img.description}</p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-[11px] mt-2">
                      <span className="font-mono text-slate-400">{img.date}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal("gallery", img)}
                          className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem("gallery", img.id)}
                          className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. DOWNLOADS HUB MANAGEMENT */}
        {activeTab === "downloads" && (
          <div className="space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>ডাউনলোড হাব ও অফিসিয়াল ডক কন্টেন্ট</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">সিলেবাস, ভর্তি আবেদন ফরম, ক্যালেন্ডার ইত্যাদি ডাউনলোড ফাইলগুলো ম্যানেজ করুন।</p>
              </div>

              <button
                onClick={() => openAddModal("download")}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ডাউনলোড ফাইল যুক্ত করুন</span>
              </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-extrabold border-b border-slate-200/80 dark:border-slate-800">
                    <th className="p-4">ক্রম</th>
                    <th className="p-4">ফাইল ক্যাটাগরি</th>
                    <th className="p-4">ফাইলের নাম ও বিবরণ</th>
                    <th className="p-4 font-mono">ফাইল সাইজ</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {downloads.map((dl) => (
                    <tr key={dl.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/50 dark:hover:bg-slate-900/30 font-medium">
                      <td className="p-4 font-bold text-slate-400">{dl.displayOrder}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-slate-800 dark:text-amber-300">
                          {dl.categoryBangla}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-slate-900 dark:text-white">{dl.titleBangla}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">{dl.description || dl.fileName}</p>
                      </td>
                      <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{dl.fileSize}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={dl.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-500 cursor-pointer"
                            title="ব্রাউজ করুন"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => openEditModal("download", dl)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:bg-indigo-950/40 hover:text-indigo-600 text-slate-500 dark:text-slate-400 cursor-pointer"
                            title="সম্পাদন করুন"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem("download", dl.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:bg-rose-950/40 hover:text-rose-600 text-slate-500 dark:text-slate-400 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. OFFICIAL EXAM RESULTS PDF PUBLICATION */}
        {activeTab === "results" && (
          <div className="space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span>অফিশিয়াল পরীক্ষার ফলাফল প্রকাশ গেজেট</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">শিক্ষার্থীরা পাবলিক পোর্টালে তাদের রোল/রেজি দিয়ে ফলাফল দেখার পাশাপাশি অফিশিয়াল গেজেট ও মার্কশিট পিডিএফ ডাউনলোড করতে পারবে।</p>
              </div>

              <button
                onClick={() => openAddModal("result")}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ফলাফল গেজেট প্রকাশ করুন</span>
              </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-extrabold border-b border-slate-200/80 dark:border-slate-800">
                    <th className="p-4">প্রকাশের তারিখ</th>
                    <th className="p-4">পরীক্ষার নাম</th>
                    <th className="p-4">শ্রেণি ও বিভাগ</th>
                    <th className="p-4">সংযুক্ত গেজেট ফাইল</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60/50 dark:hover:bg-slate-900/30 font-medium">
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">{res.publishedDate}</td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{res.examName}</td>
                      <td className="p-4">
                        <p className="font-extrabold">{res.className}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{res.tradeName}</p>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-mono text-[11px]">{res.fileName} ({res.fileSize})</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal("result", res)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:bg-indigo-950/40 hover:text-indigo-600 text-slate-500 dark:text-slate-400 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem("result", res.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:bg-rose-950/40 hover:text-rose-600 text-slate-500 dark:text-slate-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* COMPACT FLOATING SAVE/EDIT MODAL OVERLAY */}
      {modalType && editItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {editItem.id ? "আইটেমটি সম্পাদন বা পরিবর্তন করুন" : "নতুন তথ্য বা ফাইল যুক্ত করুন"}
              </h3>
              <button
                onClick={() => {
                  setModalType(null);
                  setEditItem(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveItem} className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-300">
              
              {/* NOTICE FORM */}
              {modalType === "notice" && (
                <>
                  <div>
                    <label className="font-bold block mb-1">নোটিশের শিরোনাম (Bangla)</label>
                    <input
                      type="text"
                      value={editItem.titleBangla || ""}
                      onChange={(e) => setEditItem({ ...editItem, titleBangla: e.target.value, title: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      placeholder="যেমন: কারিগরি ব্যবহারিক পরীক্ষা ২০২৬ এর সময়সূচি"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">নোটিশ ক্যাটাগরি</label>
                    <select
                      value={editItem.category || "academic"}
                      onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="academic">একাডেমিক</option>
                      <option value="exam">পরীক্ষা সংক্রান্ত</option>
                      <option value="urgent">জরুরি বিজ্ঞপ্তি</option>
                      <option value="holiday">ছুটি ও উৎসব</option>
                      <option value="admission">ভর্তি নোটিশ</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">বিস্তারিত বার্তা কন্টেন্ট (Content)</label>
                    <textarea
                      value={editItem.content || ""}
                      onChange={(e) => setEditItem({ ...editItem, content: e.target.value })}
                      rows={4}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl leading-relaxed"
                      placeholder="বিস্তারিত ঘোষণা বা বার্তা লিখুন..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">প্রকাশক / লেখক</label>
                      <input
                        type="text"
                        value={editItem.author || "অধ্যক্ষের কার্যালয়"}
                        onChange={(e) => setEditItem({ ...editItem, author: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">সংযুক্ত ফাইল নাম (পিডিএফ)</label>
                      <input
                        type="text"
                        value={editItem.attachmentName || ""}
                        onChange={(e) => setEditItem({ ...editItem, attachmentName: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        placeholder="practical_routine.pdf"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isUrgent"
                      checked={Boolean(editItem.isUrgent)}
                      onChange={(e) => setEditItem({ ...editItem, isUrgent: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded-sm"
                    />
                    <label htmlFor="isUrgent" className="font-bold">জরুরি ফ্ল্যাগ অন করুন (অনলাইন টিকারে হাইলাইট হবে)</label>
                  </div>
                </>
              )}

              {/* EVENT FORM */}
              {modalType === "event" && (
                <>
                  <div>
                    <label className="font-bold block mb-1">ইভেন্ট বা ক্যাম্পেইনের নাম</label>
                    <input
                      type="text"
                      value={editItem.title || ""}
                      onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">শুরুর তারিখ</label>
                      <input
                        type="date"
                        value={editItem.startDate || ""}
                        onChange={(e) => setEditItem({ ...editItem, startDate: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">শেষের তারিখ (ঐচ্ছিক)</label>
                      <input
                        type="date"
                        value={editItem.endDate || ""}
                        onChange={(e) => setEditItem({ ...editItem, endDate: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">অনুষ্ঠানের স্থান (Location)</label>
                      <input
                        type="text"
                        value={editItem.location || ""}
                        onChange={(e) => setEditItem({ ...editItem, location: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">ক্যাটাগরি</label>
                      <select
                        value={editItem.type || "academic"}
                        onChange={(e) => setEditItem({ ...editItem, type: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value="academic">একাডেমিক</option>
                        <option value="workshop">ওয়ার্কশপ ও ফেয়ার</option>
                        <option value="holiday">জাতীয় উৎসব/ছুটি</option>
                        <option value="exam">পরীক্ষা</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">ইভেন্ট বিবরণ</label>
                    <textarea
                      value={editItem.description || ""}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      rows={3}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                </>
              )}

              {/* GALLERY FORM */}
              {modalType === "gallery" && (
                <>
                  <div>
                    <label className="font-bold block mb-1">ছবির ক্যাপশন (Bangla)</label>
                    <input
                      type="text"
                      value={editItem.titleBangla || ""}
                      onChange={(e) => setEditItem({ ...editItem, titleBangla: e.target.value, title: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">ক্যাটাগরি</label>
                      <select
                        value={editItem.category || "campus"}
                        onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value="campus">ক্যাম্পাস ভবন</option>
                        <option value="labs">কারিগরি ল্যাব</option>
                        <option value="fair">বিজ্ঞান ও মেলা</option>
                        <option value="cultural">সাংস্কৃতিক অনুষ্ঠান</option>
                        <option value="sports">খেলাধুলা</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold block mb-1">তারিখ</label>
                      <input
                        type="date"
                        value={editItem.date || ""}
                        onChange={(e) => setEditItem({ ...editItem, date: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">ছবি লিঙ্ক (Unsplash URL / Direct URL)</label>
                    <input
                      type="text"
                      value={editItem.imageUrl || ""}
                      onChange={(e) => setEditItem({ ...editItem, imageUrl: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      placeholder="https://images.unsplash.com/..."
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">সংক্ষিপ্ত বিবরণ</label>
                    <textarea
                      value={editItem.description || ""}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* DOWNLOAD FORM */}
              {modalType === "download" && (
                <>
                  <div>
                    <label className="font-bold block mb-1">ডকুমেন্ট / সিলেবাসের নাম (Bangla)</label>
                    <input
                      type="text"
                      value={editItem.titleBangla || ""}
                      onChange={(e) => setEditItem({ ...editItem, titleBangla: e.target.value, title: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">ডকুমেন্ট ক্যাটাগরি</label>
                      <select
                        value={editItem.category || "syllabus"}
                        onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        <option value="syllabus">সিলেবাস ও কারিকুলাম</option>
                        <option value="form">ভর্তি ফরম ও আবেদন</option>
                        <option value="routine">পরীক্ষা ও ক্লাস রুটিন</option>
                        <option value="calendar">একাডেমিক ক্যালেন্ডার</option>
                        <option value="question_paper">বিগত বছরের প্রশ্ন</option>
                        <option value="other">অন্যান্য অফিসিয়াল নোটিশ</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold block mb-1">প্রদর্শনের ক্রম (Display Order)</label>
                      <input
                        type="number"
                        value={editItem.displayOrder || 10}
                        onChange={(e) => setEditItem({ ...editItem, displayOrder: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">ফাইলের নাম</label>
                      <input
                        type="text"
                        value={editItem.fileName || ""}
                        onChange={(e) => setEditItem({ ...editItem, fileName: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        placeholder="ssc_vocational_2026.pdf"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold block mb-1">ফাইলের সাইজ (যেমন: 1.5 MB)</label>
                      <input
                        type="text"
                        value={editItem.fileSize || ""}
                        onChange={(e) => setEditItem({ ...editItem, fileSize: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        placeholder="যেমন: ১.২ মেগাবাইট বা 1.2 MB"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">ডাউনলোড ফাইল লিংক (Direct File URL)</label>
                    <input
                      type="text"
                      value={editItem.downloadUrl || ""}
                      onChange={(e) => setEditItem({ ...editItem, downloadUrl: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      placeholder="https://..."
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">ডকুমেন্ট সম্পর্কে ছোট বিবরণ</label>
                    <textarea
                      value={editItem.description || ""}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* RESULTS PDF FORM */}
              {modalType === "result" && (
                <>
                  <div>
                    <label className="font-bold block mb-1">ফলাফল গেজেট শিরোনাম (Bangla)</label>
                    <input
                      type="text"
                      value={editItem.examName || ""}
                      onChange={(e) => setEditItem({ ...editItem, examName: e.target.value, title: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      placeholder="যেমন: অর্ধবার্ষিক পরীক্ষা ২০২৬ এর গ্রেড শিট ও মার্কস গেজেট"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">শ্রেণি (যেমন: Class 9)</label>
                      <input
                        type="text"
                        value={editItem.className || ""}
                        onChange={(e) => setEditItem({ ...editItem, className: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold block mb-1">ট্রেড বা বিভাগ (যেমন: General Electronics)</label>
                      <input
                        type="text"
                        value={editItem.tradeName || ""}
                        onChange={(e) => setEditItem({ ...editItem, tradeName: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">ফাইলের নাম</label>
                      <input
                        type="text"
                        value={editItem.fileName || ""}
                        onChange={(e) => setEditItem({ ...editItem, fileName: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        placeholder="electronics_midterm_2026.pdf"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold block mb-1">ফাইলের সাইজ (যেমন: 1.5 MB)</label>
                      <input
                        type="text"
                        value={editItem.fileSize || ""}
                        onChange={(e) => setEditItem({ ...editItem, fileSize: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        placeholder="যেমন: ১.১ এমবি"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">পিডিএফ ডাউনলোড ফাইল লিংক (Direct PDF URL)</label>
                    <input
                      type="text"
                      value={editItem.downloadUrl || ""}
                      onChange={(e) => setEditItem({ ...editItem, downloadUrl: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      placeholder="https://..."
                      required
                    />
                  </div>
                </>
              )}

              {/* Modal Buttons */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalType(null);
                    setEditItem(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-bold transition-all cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
