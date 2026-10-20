"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Edit3,
  MessageSquare,
  Hand,
  SlidersHorizontal,
  Monitor,
  Columns2,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Send,
  CheckCircle2,
  Trash2,
  Pin,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Eye,
  Star,
  Users,
  Smile
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface LiveInteractivitySettings {
  requireParticipantNames: boolean;
  selectedReactions: string[]; // ["cat", "heart", "question", "thumbs_up", "thumbs_down"]
  enableQA: boolean;
  qaVisibleToEveryone: boolean;
  qaModeration: boolean;
  enableLiveChat: boolean;
}

export interface LiveQAQuestion {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  upvotes: number;
  isAnswered: boolean;
  isPinned: boolean;
  approved?: boolean;
}

export interface LiveChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isHost?: boolean;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  x: number; // percentage from left (0 to 100)
}

interface LiveInteractivityDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  settings?: LiveInteractivitySettings;
  onSettingsChange?: (settings: LiveInteractivitySettings) => void;
  onTriggerReaction?: (reactionKey: string) => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onOpenAiHelper?: () => void;
  onOpenEditor?: () => void;
  isQuizLiveActive?: boolean;
  className?: string;
  activeSidebarTab?: "interactivity" | "chat" | "qa" | "none";
  onTabChange?: (tab: "interactivity" | "chat" | "qa" | "none") => void;
}

const DEFAULT_SETTINGS: LiveInteractivitySettings = {
  requireParticipantNames: false,
  selectedReactions: ["thumbs_up"], // In user's screenshot, thumbs_up is highlighted
  enableQA: false,
  qaVisibleToEveryone: true, // In user's screenshot, this switch is active/purple!
  qaModeration: false,
  enableLiveChat: false,
};

export default function LiveInteractivityDrawer({
  isOpen = true,
  onClose,
  settings: propSettings,
  onSettingsChange,
  onTriggerReaction,
  onToggleFullscreen,
  isFullscreen = false,
  onOpenAiHelper,
  onOpenEditor,
  isQuizLiveActive = false,
  className = "",
  activeSidebarTab = "interactivity",
  onTabChange,
}: LiveInteractivityDrawerProps) {
  const [settings, setSettings] = useState<LiveInteractivitySettings>(
    propSettings || DEFAULT_SETTINGS
  );

  const [activeTab, setActiveTab] = useState<"interactivity" | "chat" | "qa" | "none">(
    activeSidebarTab
  );

  useEffect(() => {
    if (activeSidebarTab !== activeTab) {
      setActiveTab(activeSidebarTab);
    }
  }, [activeSidebarTab]);

  // Sync external prop settings if updated
  useEffect(() => {
    if (propSettings) {
      setSettings(propSettings);
    }
  }, [propSettings]);

  const updateSetting = <K extends keyof LiveInteractivitySettings>(
    key: K,
    value: LiveInteractivitySettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    onSettingsChange?.(updated);
  };

  // Reactions definition matching screenshot: Cat, Heart, Question, Thumbs Up, Thumbs Down
  const REACTION_OPTIONS = [
    { key: "cat", label: "মার্জার / বিড়াল", icon: "🐱", symbol: "😺" },
    { key: "heart", label: "হৃদয় / ভালোবাসা", icon: "❤️", symbol: "❤️" },
    { key: "question", label: "প্রশ্ন / অস্পষ্ট", icon: "❓", symbol: "❓" },
    { key: "thumbs_up", label: "থাম্বস আপ / একমত", icon: "👍", symbol: "👍" },
    { key: "thumbs_down", label: "থাম্বস ডাউন / দ্বিমত", icon: "👎", symbol: "👎" },
  ];

  const toggleReactionSelection = (key: string) => {
    const current = settings.selectedReactions || [];
    let next: string[];
    if (current.includes(key)) {
      next = current.filter((k) => k !== key);
    } else {
      next = [...current, key];
    }
    updateSetting("selectedReactions", next);
    // Also trigger a live preview reaction!
    onTriggerReaction?.(key);
  };

  // Q&A Sample State
  const [qaList, setQaList] = useState<LiveQAQuestion[]>([
    {
      id: "qa-1",
      author: "রাকিব হাসান (রোল: ১০১)",
      text: "স্যার, পরবর্তী স্লাইডে কি ওহমের সূত্রের গাণিতিক উদাহরণ থাকবে?",
      timestamp: "২ মিনিট আগে",
      upvotes: 4,
      isAnswered: false,
      isPinned: false,
      approved: true,
    },
    {
      id: "qa-2",
      author: "সুমাইয়া জান্নাত (রোল: ১২৩)",
      text: "এই কুইজের পয়েন্ট কি ফাইনাল অ্যাসেসমেন্টে যুক্ত হবে?",
      timestamp: "১ মিনিট আগে",
      upvotes: 7,
      isAnswered: true,
      isPinned: true,
      approved: true,
    },
  ]);
  const [newQaText, setNewQaText] = useState("");

  // Live Chat Sample State
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
    {
      id: "msg-1",
      sender: "শিক্ষক (হোস্ট)",
      text: "সবাই প্রস্তুত তো? পরবর্তী প্রশ্নটি খুবই রোমাঞ্চকর!",
      timestamp: "১০:০৫",
      isHost: true,
    },
    {
      id: "msg-2",
      sender: "তানভীর আহমেদ",
      text: "হ্যাঁ স্যার! দ্রুত নেক্সট স্লাইড দিন 🔥",
      timestamp: "১০:০৬",
      isHost: false,
    },
  ]);
  const [newChatText, setNewChatText] = useState("");

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    const msg: LiveChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "শিক্ষক (হোস্ট)",
      text: newChatText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isHost: true,
    };
    setChatMessages((prev) => [...prev, msg]);
    setNewChatText("");
  };

  const handleSendQa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQaText.trim()) return;
    const item: LiveQAQuestion = {
      id: `qa-${Date.now()}`,
      author: "শিক্ষক / হোস্ট",
      text: newQaText.trim(),
      timestamp: "এখনই",
      upvotes: 1,
      isAnswered: false,
      isPinned: false,
      approved: true,
    };
    setQaList((prev) => [item, ...prev]);
    setNewQaText("");
  };

  const handleUpvoteQa = (id: string) => {
    setQaList((prev) =>
      prev.map((q) => (q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q))
    );
  };

  const handleTogglePinQa = (id: string) => {
    setQaList((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isPinned: !q.isPinned } : q))
    );
  };

  const handleToggleAnsweredQa = (id: string) => {
    setQaList((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isAnswered: !q.isAnswered } : q))
    );
  };

  const handleTabClick = (tab: "interactivity" | "chat" | "qa") => {
    if (activeTab === tab) {
      setActiveTab("none");
      onTabChange?.("none");
      onClose?.();
    } else {
      setActiveTab(tab);
      onTabChange?.(tab);
    }
  };

  return (
    <div className={`fixed right-0 top-0 bottom-0 z-50 flex pointer-events-auto select-none ${className}`}>
      {/* ------------------------------------------------------------- */}
      {/* MAIN DRAWER PANEL (Slides in from the right)                   */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {activeTab !== "none" && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="w-80 sm:w-96 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 z-20"
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {activeTab === "interactivity" && "Interactivity"}
                {activeTab === "chat" && "Live Chat"}
                {activeTab === "qa" && "Audience Q&A"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("none");
                  onTabChange?.("none");
                  onClose?.();
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {activeTab === "interactivity" && (
                <>
                  {/* ==================================================== */}
                  {/* 1. PARTICIPANT NAMES                                 */}
                  {/* ==================================================== */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          Participant names
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#166534] dark:bg-emerald-950/80 dark:text-emerald-300">
                          Pro
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Participant names are required
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.requireParticipantNames}
                      onClick={() =>
                        updateSetting(
                          "requireParticipantNames",
                          !settings.requireParticipantNames
                        )
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        settings.requireParticipantNames
                          ? "bg-indigo-600"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          settings.requireParticipantNames
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80" />

                  {/* ==================================================== */}
                  {/* 2. REACTIONS                                         */}
                  {/* ==================================================== */}
                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                        <span className="text-sm font-semibold">Reactions</span>
                        <span
                          title="Allow participants to send live reactions during the presentation"
                          className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        You can select multiple reactions
                      </p>
                    </div>

                    {/* Reaction Selection Cards (Cat, Heart, ?, Thumbs Up, Thumbs Down) */}
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {REACTION_OPTIONS.map((item) => {
                        const isSelected = settings.selectedReactions.includes(item.key);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleReactionSelection(item.key)}
                            title={`${item.label} (ক্লিক করে নির্বাচন/বাতিল করুন)`}
                            className={`h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl transition-all cursor-pointer shadow-2xs ${
                              isSelected
                                ? "bg-[#E0E7FF] text-[#4338CA] border-2 border-[#818CF8] dark:bg-indigo-950/70 dark:border-indigo-500 dark:text-indigo-200 scale-105"
                                : "bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                            }`}
                          >
                            <span>{item.icon}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Live Reaction Tester for Host / Presenter */}
                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>সরাসরি টেস্ট করতে ইমোজিতে চাপ দিন</span>
                      <button
                        type="button"
                        onClick={() => onTriggerReaction?.("thumbs_up")}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Smile className="w-3 h-3" />
                        <span>টেস্ট রিঅ্যাকশন</span>
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80" />

                  {/* ==================================================== */}
                  {/* 3. Q&A                                               */}
                  {/* ==================================================== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                      <span className="text-sm font-semibold">Q&A</span>
                      <span
                        title="Allow audience to ask questions live"
                        className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Enable Q&A Switch */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Enable Q&A
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={settings.enableQA}
                          onClick={() => updateSetting("enableQA", !settings.enableQA)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            settings.enableQA
                              ? "bg-indigo-600"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              settings.enableQA ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Questions are visible to everyone (ACTIVE PURPLE IN SCREENSHOT) */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Questions are visible to everyone
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={settings.qaVisibleToEveryone}
                          onClick={() =>
                            updateSetting(
                              "qaVisibleToEveryone",
                              !settings.qaVisibleToEveryone
                            )
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            settings.qaVisibleToEveryone
                              ? "bg-indigo-600"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              settings.qaVisibleToEveryone ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Moderation with green badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            Moderation
                          </span>
                          <span className="w-4 h-4 rounded-full bg-[#DCFCE7] text-[#166534] dark:bg-emerald-950/80 dark:text-emerald-300 inline-flex items-center justify-center">
                            <Star className="w-2.5 h-2.5 fill-current" />
                          </span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={settings.qaModeration}
                          onClick={() => updateSetting("qaModeration", !settings.qaModeration)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            settings.qaModeration
                              ? "bg-indigo-600"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              settings.qaModeration ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* If Q&A is enabled, provide shortcut to view Q&A list */}
                    {settings.enableQA && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("qa")}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold flex items-center justify-between hover:bg-indigo-100 transition"
                        >
                          <span>প্রশ্নোত্তর তালিকা দেখুন ({qaList.length})</span>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80" />

                  {/* ==================================================== */}
                  {/* 4. LIVE CHAT                                         */}
                  {/* ==================================================== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                      <span className="text-sm font-semibold">Live chat</span>
                      <span
                        title="Allow audience to chat in real-time"
                        className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Enable live chat
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.enableLiveChat}
                        onClick={() =>
                          updateSetting("enableLiveChat", !settings.enableLiveChat)
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          settings.enableLiveChat
                            ? "bg-indigo-600"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            settings.enableLiveChat ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {settings.enableLiveChat && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("chat")}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold flex items-center justify-between hover:bg-indigo-100 transition"
                        >
                          <span>লাইভ চ্যাট প্যানেল খুলুন ({chatMessages.length})</span>
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ======================================================== */}
              {/* TAB 2: LIVE CHAT STREAM                                 */}
              {/* ======================================================== */}
              {activeTab === "chat" && (
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>লাইভ কুইজ চলাকালীন দর্শক ও শিক্ষকের মেসেজ</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("interactivity")}
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      ← সেটিংসে ফিরুন
                    </button>
                  </div>

                  <div className="space-y-3 min-h-[300px]">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-2xl text-xs space-y-1 ${
                          msg.isHost
                            ? "bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 ml-4"
                            : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mr-4"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold ${
                              msg.isHost
                                ? "text-indigo-700 dark:text-indigo-300"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {msg.sender}
                          </span>
                          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendChat} className="pt-2 flex gap-2">
                    <input
                      type="text"
                      value={newChatText}
                      onChange={(e) => setNewChatText(e.target.value)}
                      placeholder="মেসেজ লিখুন..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-indigo-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
                      title="মেসেজ পাঠান"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: Q&A QUESTION STREAM                              */}
              {/* ======================================================== */}
              {activeTab === "qa" && (
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>শিক্ষার্থীদের প্রশ্নাবলি ও আপভোট</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("interactivity")}
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      ← সেটিংসে ফিরুন
                    </button>
                  </div>

                  <div className="space-y-3 min-h-[300px]">
                    {qaList.map((qa) => (
                      <div
                        key={qa.id}
                        className={`p-3.5 rounded-2xl text-xs space-y-2 border transition ${
                          qa.isPinned
                            ? "bg-amber-500/10 border-amber-400/50"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {qa.author}
                          </span>
                          <span className="text-[10px] text-slate-400">{qa.timestamp}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 text-xs font-medium">
                          {qa.text}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleUpvoteQa(qa.id)}
                            className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-bold cursor-pointer"
                          >
                            <ThumbsUp className="w-3 h-3 text-indigo-500" />
                            <span>{qa.upvotes}</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePinQa(qa.id)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                                qa.isPinned
                                  ? "bg-amber-500 text-slate-950"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {qa.isPinned ? "পিন করা" : "পিন"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAnsweredQa(qa.id)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                                qa.isAnswered
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {qa.isAnswered ? "উত্তর দেওয়া হয়েছে" : "উত্তর দিন"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendQa} className="pt-2 flex gap-2">
                    <input
                      type="text"
                      value={newQaText}
                      onChange={(e) => setNewQaText(e.target.value)}
                      placeholder="প্রশ্ন বা নোট যুক্ত করুন..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-indigo-500 text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
                      title="প্রশ্ন পাঠান"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* VERTICAL FLOATING TOOLBAR (Rightmost edge, exactly as in image)*/}
      {/* ------------------------------------------------------------- */}
      <div className="w-14 sm:w-16 h-full bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 flex flex-col items-center py-4 space-y-3 z-30 shadow-lg select-none">
        {/* 1. AI Sparkles Button (Gradient colored star icon) - Hidden when Quiz is live playing */}
        {!isQuizLiveActive && onOpenAiHelper && (
          <button
            type="button"
            onClick={onOpenAiHelper}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer group"
            title="AI কুইজ সহকারী ও স্মার্ট প্রশ্ন প্রম্পট"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </button>
        )}

        {/* 2. Edit (Pencil) Button - Hidden when Quiz is live playing */}
        {!isQuizLiveActive && onOpenEditor && (
          <button
            type="button"
            onClick={onOpenEditor}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="স্লাইড ও প্রশ্ন এডিটর"
          >
            <Edit3 className="w-5 h-5" />
          </button>
        )}

        {/* 3. Comments / Chat Button */}
        <button
          type="button"
          onClick={() => handleTabClick("chat")}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition cursor-pointer ${
            activeTab === "chat"
              ? "bg-[#E0E7FF] text-[#4338CA] dark:bg-indigo-950/80 dark:text-indigo-300 shadow-xs"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title="লাইভ চ্যাট"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* 4. Interactivity Button (ACTIVE PURPLE IN SCREENSHOT!) */}
        <button
          type="button"
          onClick={() => handleTabClick("interactivity")}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition cursor-pointer ${
            activeTab === "interactivity"
              ? "bg-[#E0E7FF] text-[#4338CA] dark:bg-indigo-950/90 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-300 dark:ring-indigo-700"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title="Interactivity (ইন্টারেক্টিভিটি, রিঅ্যাকশন ও প্রশ্নোত্তর)"
        >
          {/* Custom Hand / Finger Tap gesture icon matching the screenshot */}
          <Hand className="w-5 h-5 rotate-12" />
        </button>

        {/* 5. Presenter / Monitor Button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition cursor-pointer ${
            isFullscreen
              ? "bg-slate-900 text-cyan-400 dark:bg-cyan-500/20 dark:text-cyan-300"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title={isFullscreen ? "ফুলস্ক্রিন প্রস্থান" : "ফুলস্ক্রিন প্রেজেন্টার"}
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* 6. Layout / Split-screen Drawer Button */}
        <button
          type="button"
          onClick={() => handleTabClick("qa")}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition cursor-pointer ${
            activeTab === "qa"
              ? "bg-[#E0E7FF] text-[#4338CA] dark:bg-indigo-950/80 dark:text-indigo-300 shadow-xs"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title="Q&A প্রশ্নোত্তর উইন্ডো"
        >
          <Columns2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
