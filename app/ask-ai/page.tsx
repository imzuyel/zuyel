"use client";

import React, { useState, useRef, useEffect } from "react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import { useTheme } from "@/context/ThemeContext";
import StreamingMessageText from "@/components/learning/StreamingMessageText";
import {
  Bot,
  User,
  Send,
  Loader2,
  Sparkles,
  Zap,
  Sliders,
  RotateCcw,
  Copy,
  Check,
  BookOpen,
  ArrowLeft,
  History,
  Trash2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Cpu,
  Terminal,
  ShieldCheck,
  ZapOff,
  Pencil,
  Cloud,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { getActiveStudentAccount, StudentAuthAccount } from "@/lib/studentIntelligenceStore";

interface Message {
  role: "user" | "assistant";
  text: string;
  modelUsed?: string;
  timestamp?: string;
  matchedKnowledge?: string[];
  isNew?: boolean;
}

const CATEGORIZED_PROMPTS = [
  {
    category: "⚡ ইলেকট্রিক্যাল",
    icon: Zap,
    color: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border-amber-500/20 dark:border-amber-500/30 text-amber-600 dark:text-amber-400",
    prompts: ["ওহমের সূত্র (V = IR) সহজ ভাষায় ব্যাখ্যা করো", "ইলেকট্রিক্যাল পাওয়ারের ফর্মুলা ও ওয়াট কী?"],
  },
  {
    category: "💻 কম্পিউটার ও নেটওয়ার্ক",
    icon: Terminal,
    color: "from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20 border-cyan-500/20 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
    prompts: ["IP Address এবং Router এর কাজ কী?", "কম্পিউটার নেটওয়ার্কিং এর ধরনগুলো কী কী?"],
  },
  {
    category: "🛡️ সেফটি ও ল্যাব রুলস",
    icon: ShieldCheck,
    color: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    prompts: ["কারিগরি ল্যাবে কাজ করার ৩টি প্রধান সেফটি নিয়ম", "আর্দিং (Earthing) কেন জরুরি?"],
  },
  {
    category: "📖 বেসিক সাইন্স ও সাধারণ",
    icon: Cpu,
    color: "from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border-purple-500/20 dark:border-purple-500/30 text-purple-600 dark:text-purple-400",
    prompts: ["রেজিস্ট্যান্স ও কন্ডাকট্যান্স এর পার্থক্য কী?", "একটি বাস্তব প্র্যাকটিক্যাল উদাহরণ দাও"],
  },
];

const MODEL_OPTIONS = [
  { id: "gemini-flash-latest", name: "Google Gemini 3.8 Flash (Latest)", badge: "Fastest", color: "from-blue-500 to-cyan-500" },
  { id: "gpt-4o-mini", name: "OpenAI GPT-4o Mini", badge: "Smart", color: "from-emerald-500 to-teal-500" },
  { id: "grok-2-mini", name: "xAI Grok 2 Mini", badge: "Realtime", color: "from-purple-500 to-indigo-500" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", badge: "Nuanced", color: "from-amber-500 to-orange-500" },
  { id: "deepseek-chat", name: "DeepSeek V3", badge: "Technical", color: "from-rose-500 to-pink-500" },
];

export default function AskAiPage() {
  const { mode } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-flash-latest");
  const [isGroundingEnabled, setIsGroundingEnabled] = useState(true);
  const [modelLatencies, setModelLatencies] = useState<Record<string, number>>({
    "gemini-flash-latest": 165,
    "gpt-4o-mini": 210,
    "grok-2-mini": 185,
    "claude-3-haiku": 280,
    "deepseek-chat": 195,
  });

  const [activeStudent, setActiveStudent] = useState<StudentAuthAccount | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "স্বাগতম! আমি PTSC AI কারিগরি টিউটর। পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের শিক্ষার্থী ও শিক্ষকদের সহায়তায় আমি নিয়োজিত। ইলেকট্রিক্যাল, কম্পিউটার, সেফটি বা যেকোনো কারিগরি বিষয় নিয়ে প্রশ্ন করুন!",
      modelUsed: "Google Gemini 3.8 Flash",
      timestamp: "10:00 AM",
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [micErrorMsg, setMicErrorMsg] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const active = getActiveStudentAccount();
    setActiveStudent(active);

    const historyKey = active ? `ptsc_ai_chat_history_${active.rollNumber}` : "ptsc_ai_chat_history_guest";

    try {
      const saved = localStorage.getItem("ptsc_recent_ai_queries");
      if (saved) {
        setRecentQueries(JSON.parse(saved));
      }
      const savedGrounding = localStorage.getItem("ptsc_ai_grounding_enabled");
      if (savedGrounding !== null) {
        setIsGroundingEnabled(JSON.parse(savedGrounding));
      }
      const cachedChat = localStorage.getItem(historyKey);
      if (cachedChat) {
        const parsed = JSON.parse(cachedChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const historyKey = activeStudent ? `ptsc_ai_chat_history_${activeStudent.rollNumber}` : "ptsc_ai_chat_history_guest";
      try {
        localStorage.setItem(historyKey, JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages, activeStudent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm("আপনি কি সক্রিয় চ্যাট হিস্ট্রি রিসেট করতে চান?")) {
      const resetMsg: Message = {
        role: "assistant",
        text: "চ্যাট রিসেট করা হয়েছে। কীভাবে সাহায্য করতে পারি?",
        modelUsed: MODEL_OPTIONS.find((m) => m.id === selectedModel)?.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([resetMsg]);
      localStorage.removeItem("ptsc_ai_active_chat_history");
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingIdx(null);
    }
  };

  const handleEditUserMessage = (text: string) => {
    setInputVal(text);
    setEditingBanner("প্রশ্নটি ইনপুট বক্সে নেওয়া হয়েছে। প্রয়োজন অনুযায়ী পরিবর্তন করে 'পাঠান' চাপুন।");
    setTimeout(() => setEditingBanner(null), 4500);
    inputRef.current?.focus();
  };

  const handleSpeak = (text: string, idx: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("আপনার ব্রাউজারে টেক্সট-টু-স্পিচ (TTS) সমর্থিত নয়।");
      return;
    }

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[*#_`~>]/g, "")
      .replace(/👉/g, "")
      .replace(/\(PTSC AI টিউটর সার্ভার রেসপন্স\)/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "bn-BD";
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find((v) => v.lang.includes("bn") || v.lang.includes("BD"));
    if (bnVoice) {
      utterance.voice = bnVoice;
    }

    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicErrorMsg("আপনার ব্রাউজারে ভয়েস ডিক্টেশন সমর্থিত নয়। Chrome বা Edge ব্যবহার করুন।");
      setTimeout(() => setMicErrorMsg(null), 5000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "bn-BD";

      recognition.onstart = () => {
        setIsListening(true);
        setMicErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");

        setInputVal(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        const errorType = event?.error;
        if (errorType === "not-allowed" || errorType === "service-not-allowed") {
          setMicErrorMsg("মাইক্রোফোন অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংসে অনুমতি নিশ্চিত করুন।");
          setTimeout(() => setMicErrorMsg(null), 5000);
        } else if (errorType === "audio-capture") {
          setMicErrorMsg("কোনো মাইক্রোফোন ডিভাইস পাওয়া যায়নি।");
          setTimeout(() => setMicErrorMsg(null), 5000);
        } else if (errorType !== "no-speech" && errorType !== "aborted") {
          console.warn("Speech recognition notice:", errorType);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      if (err?.name === "NotAllowedError" || err?.message?.includes("not-allowed")) {
        setMicErrorMsg("মাইক্রোফোন অনুমতি দেওয়া হয়নি।");
      } else {
        console.warn("Speech recognition start notice:", err);
      }
    }
  };

  const clearRecentQueries = () => {
    setRecentQueries([]);
    localStorage.removeItem("ptsc_recent_ai_queries");
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim() || isLoading) return;

    // Save to Recent Queries (max 5)
    setRecentQueries((prev) => {
      const filtered = prev.filter((q) => q !== query.trim());
      const updated = [query.trim(), ...filtered].slice(0, 5);
      try {
        localStorage.setItem("ptsc_recent_ai_queries", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = { role: "user", text: query, timestamp: timeString };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!textToSend) setInputVal("");
    setIsLoading(true);

    const startTime = performance.now();
    let providerConfig = null;
    try {
      const saved = localStorage.getItem("ptsc_ai_model_configs");
      if (saved) {
        const parsed = JSON.parse(saved);
        providerConfig = parsed[selectedModel];
      }
    } catch (e) {}

    const selectedModelObj = MODEL_OPTIONS.find((m) => m.id === selectedModel);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          currentLessonTitle: "PTSC Technical Studies",
          selectedModel,
          temperature: providerConfig?.temperature,
          topP: providerConfig?.topP,
          systemPrompt: providerConfig?.systemPrompt,
          useKnowledgeBase: isGroundingEnabled,
        }),
      });

      const duration = Math.round(performance.now() - startTime);
      setModelLatencies((prev) => ({ ...prev, [selectedModel]: duration }));

      const data = await response.json();
      const resTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (data.text) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.text,
            modelUsed: selectedModelObj?.name,
            timestamp: resTime,
            matchedKnowledge: data.matchedKnowledge,
            isNew: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "দুঃখিত, সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
            modelUsed: selectedModelObj?.name,
            timestamp: resTime,
            isNew: true,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "সার্ভারে যোগাযোগ করতে সমস্যা হচ্ছে।",
          modelUsed: selectedModelObj?.name,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentModelObj = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans relative overflow-x-hidden transition-colors">
      {/* Background Neural Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-cyan-500/20 dark:from-indigo-600/30 dark:via-purple-600/20 dark:to-cyan-500/30 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-600/10 dark:bg-cyan-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <PublicHeader />

        <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex flex-col h-[calc(100vh-80px)]">
          {/* Main ChatGPT / Claude Style Interface Container */}
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col flex-1 h-full relative">
            
            {/* Top Bar Header */}
            <div className="bg-slate-100 dark:bg-slate-950 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
                  <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-600 dark:text-cyan-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                    <span>PTSC AI কারিগরি টিউটর</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      v3.8 Live
                    </span>
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ • স্মার্ট লার্নিং হাব
                  </p>
                  
                  {/* Student Context Badge */}
                  <div className="pt-0.5">
                    {activeStudent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <Cloud className="w-3 h-3 text-emerald-500" />
                        <span>{activeStudent.studentName} (রোল: {activeStudent.rollNumber}) — সেভকৃত চ্যাট হিস্ট্রি</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        <span>👤 গেস্ট মোড — ব্রাউজার চ্যাট হিস্ট্রি (লগইন করে সিঙ্ক রাখুন)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons & Grounding Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Knowledge Base Grounding Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isGroundingEnabled;
                    setIsGroundingEnabled(nextVal);
                    try {
                      localStorage.setItem("ptsc_ai_grounding_enabled", JSON.stringify(nextVal));
                    } catch (e) {}
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isGroundingEnabled
                      ? "bg-cyan-500/10 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-500/40 shadow-sm"
                      : "bg-slate-200/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                  }`}
                  title="PTSC কারিগরি নলেজ বেস গ্রাউন্ডিং অন/অফ করুন"
                >
                  {isGroundingEnabled ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-cyan-500 animate-pulse" />
                      <span className="hidden sm:inline">গ্রাউন্ডিং: অন</span>
                      <span className="sm:hidden">গ্রাউন্ডিং</span>
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    </>
                  ) : (
                    <>
                      <ZapOff className="w-4 h-4 text-slate-400" />
                      <span className="hidden sm:inline">গ্রাউন্ডিং: অফ</span>
                      <span className="sm:hidden">অফ</span>
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                    </>
                  )}
                </button>

                <button
                  onClick={handleClearChat}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-300 dark:border-slate-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset Conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="hidden xs:inline">রিসেট</span>
                </button>
                <Link
                  href="/learning-library"
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/10 to-cyan-600/10 dark:from-indigo-600/30 dark:to-cyan-600/30 hover:bg-indigo-600/20 text-indigo-700 dark:text-cyan-300 text-xs font-bold border border-indigo-500/20 dark:border-cyan-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">লার্নিং হাব</span>
                </Link>
              </div>
            </div>

            {/* AI Model Selector Command Bar */}
            <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Zap className="w-4 h-4 text-amber-500" />
                  এআই প্রোভাইডার:
                </span>
                
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {MODEL_OPTIONS.map((m) => {
                    const isSelected = selectedModel === m.id;
                    const latency = modelLatencies[m.id] || 180;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedModel(m.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                          isSelected
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border-indigo-500/60 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                            : "bg-white dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${m.color}`} />
                        <span>{m.name.split(" ")[1] || m.name}</span>
                        <span className="text-[10px] font-mono opacity-60">({latency}ms)</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400/80 bg-cyan-50 dark:bg-cyan-950/30 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800/30">
                <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Engine: {currentModelObj.name}</span>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-6 bg-slate-50/30 dark:bg-slate-950/60 text-sm">
              
              {/* Category Prompts Grid (When only 1 welcome message exists) */}
              {messages.length <= 1 && (
                <div className="my-4 space-y-4 animate-fade-in">
                  <div className="text-center space-y-2 py-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-cyan-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-cyan-500/20 border border-indigo-200 dark:border-indigo-500/30 shadow-xl mb-1 text-indigo-600 dark:text-cyan-400">
                      <Sparkles className="w-7 h-7 animate-pulse" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                      স্বাগতম! আজ আপনি কারিগরি শিক্ষার কী শিখতে চান?
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      নিচের বিষয় থেকে চয়ন করুন অথবা নিচে আপনার প্রশ্ন লিখুন বা মুখে বলুন।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
                    {CATEGORIZED_PROMPTS.map((cat, idx) => {
                      const IconComp = cat.icon;
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-md flex flex-col justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{cat.category}</span>
                          </div>

                          <div className="space-y-1.5">
                            {cat.prompts.map((p, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleSendMessage(p)}
                                className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-cyan-300 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 text-xs font-medium transition-all cursor-pointer flex items-center justify-between group/p"
                              >
                                <span className="truncate pr-2">{p}</span>
                                <Send className="w-3 h-3 text-slate-400 group-hover/p:text-indigo-600 dark:group-hover/p:text-cyan-400 transition-colors shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chat Thread */}
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3.5 ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  {m.role === "assistant" && (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-600/20 shrink-0">
                      <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-600 dark:text-cyan-400">
                        <Bot className="w-5 h-5" />
                      </div>
                    </div>
                  )}

                  <div className="relative group max-w-[88%] sm:max-w-[80%] space-y-1.5">
                    
                    {/* Role / Model Metadata Header */}
                    <div className={`flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-1 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {m.role === "user" ? "আপনি" : m.modelUsed || "PTSC AI টিউটর"}
                      </span>
                      {m.timestamp && <span className="text-[10px] text-slate-400 dark:text-slate-500">· {m.timestamp}</span>}
                      {m.matchedKnowledge && m.matchedKnowledge.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-500/30 text-[10px] text-cyan-700 dark:text-cyan-300 font-mono flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          Knowledge Augmented: {m.matchedKnowledge.join(", ")}
                        </span>
                      )}
                    </div>

                    {/* Text Message Bubble */}
                    <div
                      className={`p-4 sm:p-5 rounded-3xl leading-relaxed text-xs sm:text-sm shadow-md ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-sm shadow-xl font-medium"
                          : "bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-slate-800/90 backdrop-blur-md"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <StreamingMessageText text={m.text} isNew={m.isNew} />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">{m.text}</pre>
                      )}
                    </div>

                    {/* User Message Edit Button */}
                    {m.role === "user" && (
                      <div className="flex items-center gap-1 justify-end pt-1 px-1">
                        <button
                          onClick={() => handleEditUserMessage(m.text)}
                          className="px-2.5 py-1 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold border border-slate-300 dark:border-slate-700/60"
                          title="প্রশ্নটি এডিট করুন"
                        >
                          <Pencil className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
                          <span>এডিট করুন</span>
                        </button>
                      </div>
                    )}

                    {/* Assistant Response Toolbar (TTS, Copy, Feedback) */}
                    {m.role === "assistant" && (
                      <div className="flex items-center gap-1 pt-1 px-1">
                        <button
                          onClick={() => handleSpeak(m.text, idx)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                            speakingIdx === idx
                              ? "bg-amber-500 text-slate-950 border-amber-400 font-bold animate-pulse shadow-lg shadow-amber-500/20"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                          }`}
                          title={speakingIdx === idx ? "ভয়েস থামান" : "শুনুন (Read Aloud)"}
                        >
                          {speakingIdx === idx ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-slate-950" />
                              <span>থামান</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                              <span>শুনুন</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(m.text, idx)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                          title="কপি করুন"
                        >
                          {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => setLikedMap((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                            likedMap[idx]
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                          }`}
                          title="ধন্যবাদ"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-md shadow-cyan-600/20 shrink-0">
                      <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-600 dark:text-cyan-300">
                        <User className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3.5 justify-start animate-pulse">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-cyan-500 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 rounded-3xl rounded-bl-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-cyan-400" />
                    <span className="text-xs font-semibold tracking-wide text-indigo-700 dark:text-indigo-300">
                      {currentModelObj.name} উত্তর প্রসেস করছে...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Editing Notice Banner */}
            {editingBanner && (
              <div className="mx-4 my-2 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs flex items-center justify-between gap-3 animate-fade-in relative z-20">
                <span className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-indigo-500" />
                  <span>{editingBanner}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="p-1 text-indigo-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Mic Permission Denied Message Container */}
            {micErrorMsg && (
              <div className="mx-4 my-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-3 animate-fade-in relative z-20">
                <span className="flex items-center gap-2">
                  <MicOff className="w-4 h-4 text-amber-500" />
                  <span>{micErrorMsg}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMicErrorMsg(null)}
                  className="p-1 text-amber-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Recent Queries Strip */}
            {recentQueries.length > 0 && (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-950/85 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
                    <History className="w-3.5 h-3.5" /> রিসেন্ট প্রশ্ন:
                  </span>
                  {recentQueries.map((rq, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(rq)}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/30 whitespace-nowrap transition-all cursor-pointer shrink-0 hover:scale-105"
                    >
                      {rq}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={clearRecentQueries}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  title="Clear Recent History"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Floating Command Bar Input Form */}
            <div className="p-3 sm:p-4 bg-slate-100 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800/90 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/30 rounded-2xl p-1.5 transition-all shadow-lg"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    isListening
                      ? "🎤 কথা বলুন... (Listening to Bengali speech)"
                      : "আপনার প্রশ্ন বা বিষয় এখানে টাইপ করুন (যেমন: ওহমের সূত্র কী)..."
                  }
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className={`flex-1 px-3 py-2.5 bg-transparent border-0 text-xs sm:text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none ${
                    isListening ? "text-rose-600 dark:text-rose-300 animate-pulse font-bold" : ""
                  }`}
                />

                {/* Microphone Dictation Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isListening
                      ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-600/40 ring-2 ring-rose-500/50"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                  }`}
                  title={isListening ? "ভয়েস বন্ধ করুন" : "মাইক্রোফোনে প্রশ্ন বলুন"}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />}
                  <span className="hidden sm:inline text-xs font-semibold">
                    {isListening ? "রেকর্ডিং..." : "ভয়েস"}
                  </span>
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isLoading || !inputVal.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-40 text-white font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden xs:inline text-xs">পাঠান</span>
                </button>
              </form>
              
              <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-slate-400 dark:text-slate-500">
                <span>PTSC AI টিউটর আপনাকে সঠিক উত্তর দিতে সর্বদা সচেষ্ট।</span>
                <span className="hidden sm:inline font-mono">Enter ↵ দিয়ে পাঠান</span>
              </div>
            </div>

          </div>
        </main>

        <PublicFooter />
      </div>
    </div>
  );
}
