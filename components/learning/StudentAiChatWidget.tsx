"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import StreamingMessageText from "@/components/learning/StreamingMessageText";
import {
  Sparkles,
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  HelpCircle,
  Zap,
  History,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  Maximize2,
  Copy,
  Check,
  ThumbsUp,
  Pencil,
  ShieldCheck,
  ZapOff,
  Cloud,
} from "lucide-react";
import { getActiveStudentAccount, StudentAuthAccount } from "@/lib/studentIntelligenceStore";

interface Message {
  role: "user" | "assistant";
  text: string;
  modelUsed?: string;
  matchedKnowledge?: string[];
  isNew?: boolean;
}

interface StudentAiChatWidgetProps {
  currentLessonTitle?: string;
}

const QUICK_PROMPTS = [
  "সহজ করে বুঝিয়ে দিন",
  "একটি বাস্তব উদাহরণ দিন",
  "ওহমের সূত্র কী?",
  "সেফটি রুলস কী কী?",
];

const MODEL_OPTIONS = [
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "grok-2-mini", name: "Grok 2 Mini" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku" },
  { id: "deepseek-chat", name: "DeepSeek V3" },
];

export default function StudentAiChatWidget({ currentLessonTitle }: StudentAiChatWidgetProps) {
  const { mode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3.8-flash");
  const [isGroundingEnabled, setIsGroundingEnabled] = useState(true);
  const [modelLatencies, setModelLatencies] = useState<Record<string, number>>({
    "gemini-3.8-flash": 165,
    "gpt-4o-mini": 210,
    "grok-2-mini": 185,
    "claude-3-haiku": 280,
    "deepseek-chat": 195,
  });

  const [activeStudent, setActiveStudent] = useState<StudentAuthAccount | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "স্বাগতম! আমি PTSC AI কারিগরি টিউটর। ইলেকট্রিক্যাল, কম্পিউটার বা যেকোনো পাঠ্য বিষয় নিয়ে প্রশ্ন করুন, আমি সহজ করে বুঝিয়ে দেব।",
      modelUsed: "Gemini 3.8 Flash",
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [micErrorMsg, setMicErrorMsg] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const active = getActiveStudentAccount();
    setActiveStudent(active);

    const historyKey = active ? `ptsc_ai_chat_history_${active.rollNumber}` : "ptsc_ai_chat_history_guest";

    try {
      const saved = localStorage.getItem("ptsc_recent_ai_queries");
      if (saved) setRecentQueries(JSON.parse(saved));

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

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel(); } catch (err) {}
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (err) {}
      }
    };
  }, [isOpen]);

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
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleEditUserMessage = (text: string) => {
    setInputVal(text);
    setEditingBanner("প্রশ্নটি ইনপুট বক্সে নেওয়া হয়েছে। সংশোধন করে সেন্ড করুন।");
    setTimeout(() => setEditingBanner(null), 4000);
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
          setMicErrorMsg("মাইক্রোফোন অনুমতি দেওয়া হয়নি।");
          setTimeout(() => setMicErrorMsg(null), 5000);
        } else if (errorType === "audio-capture") {
          setMicErrorMsg("কোনো মাইক্রোফোন পাওয়া যায়নি।");
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
    } catch (err) {
      setIsListening(false);
      console.warn("Speech recognition start notice:", err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim() || isLoading) return;

    // Save recent query (max 5)
    setRecentQueries((prev) => {
      const filtered = prev.filter((q) => q !== query.trim());
      const updated = [query.trim(), ...filtered].slice(0, 5);
      try {
        localStorage.setItem("ptsc_recent_ai_queries", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const userMessage: Message = { role: "user", text: query };
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
          currentLessonTitle,
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
      if (data.text) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.text, modelUsed: selectedModelObj?.name, matchedKnowledge: data.matchedKnowledge, isNew: true },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "দুঃখিত, সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।", modelUsed: selectedModelObj?.name, isNew: true },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "সার্ভারে যোগাযোগ করতে সমস্যা হচ্ছে।", modelUsed: selectedModelObj?.name },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 640) {
                window.location.href = "/ask-ai";
              } else {
                setIsOpen(true);
              }
            }}
            className="group px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-indigo-400/30"
            title="Ask AI Tutor"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 animate-pulse text-cyan-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="tracking-wide">Ask AI টিউটর</span>
          </button>
        )}
      </div>

      {/* Floating Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-2 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-[440px] max-h-[90vh] bg-white dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[560px] animate-fade-in text-slate-900 dark:text-slate-100 transition-colors">
          
          {/* Chat Header */}
          <div className="bg-slate-100 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/20 shrink-0">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center text-indigo-600 dark:text-cyan-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  <span>PTSC AI টিউটর</span>
                  {activeStudent ? (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Cloud className="w-2.5 h-2.5" />
                      <span>{activeStudent.studentName} (রোল: {activeStudent.rollNumber})</span>
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                  {currentLessonTitle ? `প্রসঙ্গ: ${currentLessonTitle}` : "ভোকেশনাল ও টেকনিক্যাল হেল্পলাইন"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href="/ask-ai"
                className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-700 dark:text-cyan-300 hover:text-indigo-900 dark:hover:text-white text-[10px] font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1 transition-colors"
                title="Open in Full Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">ফুল পেজ</span>
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Model Selector & Grounding Toggle Bar */}
          <div className="bg-slate-50 dark:bg-slate-950/80 px-3 py-2 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> মডেল:
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-[11px] font-bold bg-white dark:bg-slate-900 text-indigo-700 dark:text-cyan-300 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({modelLatencies[m.id] || 180}ms)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextVal = !isGroundingEnabled;
                setIsGroundingEnabled(nextVal);
                try {
                  localStorage.setItem("ptsc_ai_grounding_enabled", JSON.stringify(nextVal));
                } catch (e) {}
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                isGroundingEnabled
                  ? "bg-cyan-500/10 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-500/40"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
              }`}
              title="Knowledge Base Grounding (PTSC Docs)"
            >
              {isGroundingEnabled ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-cyan-500 animate-pulse" />
                  <span>গ্রাউন্ডিং: অন</span>
                </>
              ) : (
                <>
                  <ZapOff className="w-3 h-3 text-slate-400" />
                  <span>গ্রাউন্ডিং: অফ</span>
                </>
              )}
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="relative group max-w-[84%] space-y-1">
                  <div
                    className={`p-3 rounded-2xl leading-relaxed ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-xs shadow-md"
                        : "bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-800 shadow-sm"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <StreamingMessageText text={m.text} isNew={m.isNew} />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-xs">{m.text}</pre>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="flex items-center gap-1 justify-end pt-0.5">
                      <button
                        onClick={() => handleEditUserMessage(m.text)}
                        className="px-2 py-0.5 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-cyan-300 text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 border border-slate-300 dark:border-slate-700"
                        title="প্রশ্নটি এডিট করুন"
                      >
                        <Pencil className="w-3 h-3 text-indigo-500 dark:text-cyan-400" />
                        <span>এডিট</span>
                      </button>
                    </div>
                  )}

                  {m.role === "assistant" && m.matchedKnowledge && m.matchedKnowledge.length > 0 && (
                    <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800/40">
                      <Zap className="w-2.5 h-2.5 text-amber-500" />
                      <span>Knowledge: {m.matchedKnowledge.join(", ")}</span>
                    </div>
                  )}

                  {m.role === "assistant" && (
                    <div className="flex items-center gap-1 pt-0.5">
                      <button
                        onClick={() => handleSpeak(m.text, idx)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                          speakingIdx === idx
                            ? "bg-amber-500 text-slate-950 font-bold animate-pulse"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                        title={speakingIdx === idx ? "ভয়েস থামান" : "শুনুন"}
                      >
                        {speakingIdx === idx ? (
                          <VolumeX className="w-3 h-3 text-slate-950" />
                        ) : (
                          <Volume2 className="w-3 h-3 text-indigo-600 dark:text-cyan-400" />
                        )}
                        <span>{speakingIdx === idx ? "থামান" : "শুনুন"}</span>
                      </button>

                      <button
                        onClick={() => handleCopy(m.text, idx)}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="কপি করুন"
                      >
                        {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-2xl rounded-bl-xs border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-cyan-400" />
                  <span className="text-[11px] font-bold">এআই উত্তর টাইপ করছে...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Editing Notice Banner */}
          {editingBanner && (
            <div className="mx-3 my-1 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] flex items-center justify-between gap-2 animate-fade-in relative z-20">
              <span className="flex items-center gap-1.5">
                <Pencil className="w-3 h-3 text-indigo-500" />
                <span>{editingBanner}</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="text-indigo-500 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Mic Permission Denied Message Container */}
          {micErrorMsg && (
            <div className="mx-3 my-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] flex items-center justify-between gap-2 animate-fade-in relative z-20">
              <span className="flex items-center gap-1.5">
                <MicOff className="w-3.5 h-3.5 text-amber-500" />
                <span>{micErrorMsg}</span>
              </span>
              <button
                type="button"
                onClick={() => setMicErrorMsg(null)}
                className="text-amber-500 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Recent Queries Section */}
          {recentQueries.length > 0 && (
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
                <History className="w-3 h-3" /> রিসেন্ট:
              </span>
              {recentQueries.map((rq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(rq)}
                  className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-semibold border border-amber-500/30 whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {rq}
                </button>
              ))}
            </div>
          )}

          {/* Quick Prompt Suggestions */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qp)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={isListening ? "🎤 কথা বলুন..." : "আপনার প্রশ্ন এখানে লিখুন..."}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className={`flex-1 p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                isListening ? "border-rose-500 text-rose-600 dark:text-rose-300 animate-pulse font-bold" : "border-slate-200 dark:border-slate-800"
              }`}
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/40"
                  : "bg-slate-50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
              }`}
              title={isListening ? "ভয়েস বন্ধ করুন" : "ভয়েসে কথা বলুন"}
            >
              {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />}
            </button>
            <button
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-40 text-white font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
