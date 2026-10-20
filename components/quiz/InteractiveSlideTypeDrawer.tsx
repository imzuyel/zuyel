"use client";

import React, { useState } from "react";
import {
  X,
  BarChart3,
  Cloud,
  MessageSquare,
  Sliders,
  ListOrdered,
  MessageCircleQuestion,
  HelpCircle,
  PieChart,
  Grid2x2,
  FileEdit,
  MapPin,
  Trophy,
  Keyboard,
  Columns2,
  Type,
  Image as ImageIcon,
  Video,
  ListChecks,
  Presentation,
  Upload,
  Sparkles,
  Star,
  Info,
  CheckSquare,
  CheckCircle2,
  ArrowLeftRight,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type SlideCategory = "interactive" | "quiz" | "content" | "integrations";

export interface SlideTypeDefinition {
  id: string;
  name: string;
  nameBangla: string;
  category: SlideCategory;
  description: string;
  badge?: string;
  isStar?: boolean;
  color: string;
  iconBg: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  defaultData?: any;
}

export const SLIDE_TYPE_CATALOG: SlideTypeDefinition[] = [
  // --- 1. Interactive questions ---
  {
    id: "multiple_choice",
    name: "Multiple Choice",
    nameBangla: "মাল্টিপল চয়েস (বহুনির্বাচনী)",
    category: "interactive",
    description: "শিক্ষার্থীরা অপশন থেকে এক বা একাধিক সঠিক উত্তর নির্বাচন করে এবং লাইভ বার চার্ট তৈরি হয়।",
    color: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    icon: BarChart3,
    defaultData: {
      type: "mcq_single",
      options: ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
      correctIndex: 0
    }
  },
  {
    id: "word_cloud",
    name: "Word Cloud",
    nameBangla: "ওয়ার্ড ক্লাউড (শব্দ মেঘ)",
    category: "interactive",
    description: "শিক্ষার্থীদের প্রবেশ করানো শব্দ ও কিওয়ার্ডগুলো মিলে একটি আকর্ষণীয় লাইভ শব্দ মেঘ তৈরি হয়।",
    color: "text-rose-500 dark:text-rose-400",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    icon: Cloud,
    defaultData: {
      type: "word_cloud",
      entriesPerStudent: 3,
      words: []
    }
  },
  {
    id: "open_ended",
    name: "Open Ended",
    nameBangla: "উন্মুক্ত উত্তর (Open Ended)",
    category: "interactive",
    description: "শিক্ষার্থীরা বাক্য, প্যারাগ্রাফ বা মতামত লিখে পাঠায় যা গ্রিড বা লিস্ট ভিউতে প্রদর্শিত হয়।",
    color: "text-pink-500 dark:text-pink-400",
    iconBg: "bg-pink-500/10 dark:bg-pink-500/20",
    icon: MessageSquare,
    defaultData: {
      type: "open_ended",
      allowMultipleSubmissions: true
    }
  },
  {
    id: "scales",
    name: "Scales",
    nameBangla: "স্কেলস (রেটিং স্কেল)",
    category: "interactive",
    description: "১ থেকে ৫ বা ১ থেকে ১০ পয়েন্টের রেটিং স্টেটমেন্ট যাতে গড় স্কোর লাইভ পরিমাপ করা যায়।",
    color: "text-indigo-500 dark:text-indigo-400",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    icon: Sliders,
    defaultData: {
      type: "scales",
      scaleMin: 1,
      scaleMax: 5,
      statements: ["ধারণাটি সম্পূর্ণ স্পষ্ট", "ব্যবহারিক কাজের জন্য উপযোগী", "বোর্ড পরীক্ষার জন্য গুরুত্বপূর্ণ"]
    }
  },
  {
    id: "ranking",
    name: "Ranking",
    nameBangla: "র‍্যাংকিং (ক্রমবিন্যাস)",
    category: "interactive",
    description: "শিক্ষার্থীরা আইটেমগুলোকে তাদের গুরুত্ব বা সঠিক কাজের ধারানুসারে ক্রমান্বয়ে সাজায়।",
    color: "text-emerald-500 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    icon: ListOrdered,
    defaultData: {
      type: "ranking",
      items: ["ধাপ ১: পাওয়ার বন্ধ করা", "ধাপ ২: সার্কিট পরীক্ষা", "ধাপ ৩: কম্পোনেন্ট পরিবর্তন", "ধাপ ৪: চূড়ান্ত টেস্ট"]
    }
  },
  {
    id: "qa",
    name: "Q&A",
    nameBangla: "প্রশ্নোত্তর সেশন (Q&A)",
    category: "interactive",
    description: "শিক্ষার্থীরা শিক্ষককে সরাসরি প্রশ্ন পাঠাতে পারে এবং অন্যান্য শিক্ষার্থীরা আপভোট দেয়।",
    color: "text-rose-400 dark:text-rose-300",
    iconBg: "bg-rose-400/10 dark:bg-rose-400/20",
    icon: MessageCircleQuestion,
    defaultData: {
      type: "qa",
      allowAnonymous: true
    }
  },
  {
    id: "guess_number",
    name: "Guess the Number",
    nameBangla: "সংখ্যা অনুমান (Guess the Number)",
    category: "interactive",
    description: "একটি নির্দিষ্ট সংখ্যা বা মান অনুমান করার চ্যালেঞ্জ; সঠিক বা নিকটবর্তী অনুমান পয়েন্ট পায়।",
    color: "text-amber-500 dark:text-amber-400",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    icon: HelpCircle,
    defaultData: {
      type: "guess_number",
      targetNumber: 50,
      minRange: 0,
      maxRange: 100
    }
  },
  {
    id: "hundred_points",
    name: "100 Points",
    nameBangla: "১০০ পয়েন্ট বরাদ্দ (100 Points)",
    category: "interactive",
    description: "শিক্ষার্থীদের ১০০ পয়েন্ট দেওয়া হয় যা তারা বিভিন্ন বিষয়ের গুরুত্ব অনুসারে ভাগ করে দেয়।",
    color: "text-blue-500 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    icon: PieChart,
    defaultData: {
      type: "hundred_points",
      categories: ["তত্ত্বীয় জ্ঞান", "ল্যাব প্র্যাকটিক্যাল", "হাজিরা ও নিয়মানুবর্তিতা", "প্রজেক্ট কাজ"]
    }
  },
  {
    id: "grid_2x2",
    name: "2 x 2 Grid",
    nameBangla: "২ x ২ গ্রিড ম্যাট্রিক্স (2x2 Grid)",
    category: "interactive",
    description: "এক্স (X) ও ওয়াই (Y) অক্ষের ওপর আইটেমসমূহ প্লট করে কৌশলগত ম্যাট্রিক্স তৈরি।",
    color: "text-orange-500 dark:text-orange-400",
    iconBg: "bg-orange-500/10 dark:bg-orange-500/20",
    icon: Grid2x2,
    defaultData: {
      type: "grid_2x2",
      xAxisLabel: "সহজতা (Ease)",
      yAxisLabel: "গুরুত্ব (Impact)"
    }
  },
  {
    id: "quick_form",
    name: "Quick Form",
    nameBangla: "কুইক ফর্ম (Quick Form)",
    category: "interactive",
    description: "শিক্ষার্থীদের নাম, রোল, ফোন বা নির্দিষ্ট তথ্য দ্রুত সংগ্রহ করার জন্য ইন্টারেক্টিভ ফর্ম।",
    badge: "PRO",
    isStar: true,
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    icon: FileEdit,
    defaultData: {
      type: "quick_form",
      fields: ["নাম", "রোল", "ট্রেড", "ইমেইল"]
    }
  },
  {
    id: "pin_on_image",
    name: "Pin on Image",
    nameBangla: "ছবিতে পিন চিহ্নিতকরণ (Pin on Image)",
    category: "interactive",
    description: "ডায়াগ্রাম, সার্কিট বা যন্ত্রাংশের ছবির নির্দিষ্ট পয়েন্ট বা কম্পোনেন্টে পিন ড্রপ করা।",
    color: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    icon: MapPin,
    defaultData: {
      type: "pin_on_image",
      imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
      targetZone: { x: 50, y: 50, radius: 15 }
    }
  },

  // --- 2. Quiz competitions ---
  {
    id: "select_answer",
    name: "Select Answer",
    nameBangla: "সঠিক উত্তর নির্বাচন (Select Answer)",
    category: "quiz",
    description: "টাইমার ও স্কোর পয়েন্ট সহ সঠিক উত্তর নির্বাচন; দ্রুততম উত্তরকারী লিডারবোর্ডে এগিয়ে থাকে।",
    color: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    icon: Trophy,
    defaultData: {
      type: "mcq_single",
      timeLimit: 20,
      marks: 10,
      options: ["সঠিক উত্তর ১", "বিকল্প ২", "বিকল্প ৩", "বিকল্প ৪"],
      correctIndex: 0
    }
  },
  {
    id: "type_answer",
    name: "Type Answer",
    nameBangla: "টাইপ করে সঠিক উত্তর (Type Answer)",
    category: "quiz",
    description: "কোনো অপশন ছাড়া সরাসরি কিবোর্ড দিয়ে সঠিক শব্দ বা সংখ্যা টাইপ করে জমা দেওয়ার প্রতিযোগিতা।",
    color: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    icon: Keyboard,
    defaultData: {
      type: "short_answer",
      timeLimit: 30,
      marks: 10,
      expectedAnswerKeyword: "মাদারবোর্ড"
    }
  },
  {
    id: "true_false",
    name: "True or False",
    nameBangla: "সত্য / মিথ্যা কুইজ (True or False)",
    category: "quiz",
    description: "বিবৃতিটি সত্য নাকি মিথ্যা তা দ্রুত যাচাই করার রোমাঞ্চকর কুইজ প্রশ্ন।",
    color: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    icon: CheckCircle2,
    defaultData: {
      type: "true_false",
      timeLimit: 20,
      marks: 10,
      options: ["সত্য (True)", "মিথ্যা (False)"],
      correctAnswer: true
    }
  },
  {
    id: "matching",
    name: "Matching Pairs",
    nameBangla: "ডান পাশ-বাম পাশ মিলকরণ (Matching Pairs)",
    category: "quiz",
    description: "বাম পাশের আইটেমের সাথে ডান পাশের সঠিক তথ্য বা সূত্রের মিলকরণ প্রতিযোগিতা।",
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    icon: ArrowLeftRight,
    defaultData: {
      type: "matching",
      timeLimit: 40,
      marks: 15,
      pairs: [
        { left: "ওহমের সূত্র", right: "V = IR" },
        { left: "পাওয়ার সূত্র", right: "P = VI" },
        { left: "ফ্রিকোয়েন্সি একক", right: "Hz (হার্টজ)" }
      ]
    }
  },
  {
    id: "fill_blank",
    name: "Fill in the Blank",
    nameBangla: "শূন্যস্থান পূরণ (Fill in the Blank)",
    category: "quiz",
    description: "বাক্যের মধ্যে সঠিক শব্দ বা সংখ্যা বসিয়ে প্রশ্নের উত্তর প্রদান।",
    color: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    icon: FileEdit,
    defaultData: {
      type: "fill_blank",
      timeLimit: 30,
      marks: 10,
      acceptedAnswers: ["সঠিক উত্তর"]
    }
  },
  {
    id: "ordering",
    name: "Ordering Steps",
    nameBangla: "ধারাবাহিক ক্রমবিন্যাস (Ordering)",
    category: "quiz",
    description: "কাজের বা পদ্ধতির সঠিক ধাপগুলো ক্রমানুসারে সাজানোর ইন্টারেক্টিভ কুইজ।",
    color: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/10 dark:bg-purple-500/20",
    icon: ListOrdered,
    defaultData: {
      type: "ordering",
      timeLimit: 35,
      marks: 10,
      items: ["ধাপ ১: পরিমাপ গ্রহণ", "ধাপ ২: উপাদান সংযোগ", "ধাপ ৩: সার্কিট পরীক্ষা"]
    }
  },
  {
    id: "mcq_multiple",
    name: "Multiple Correct",
    nameBangla: "বহুপদী / একাধিক সঠিক উত্তর (Multi-select MCQ)",
    category: "quiz",
    description: "একটির বেশি সঠিক উত্তর সংবলিত বহুনির্বাচনী কুইজ প্রশ্ন।",
    color: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    icon: CheckSquare,
    defaultData: {
      type: "mcq_multiple",
      timeLimit: 25,
      marks: 10,
      options: ["সঠিক উত্তর ক", "সঠিক উত্তর খ", "ভুল উত্তর গ", "ভুল উত্তর ঘ"],
      correctIndices: [0, 1]
    }
  },

  // --- 3. Content slides ---
  {
    id: "compare_slides",
    name: "Compare slides",
    nameBangla: "তুলনামূলক স্লাইড (Compare slides)",
    category: "content",
    description: "পাশাপাশি দুটি তথ্য, চিত্র বা ধারণার তুলনামূলক উপস্থাপন ও বিশ্লেষণ।",
    color: "text-emerald-500 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    icon: Columns2,
    defaultData: {
      type: "compare_slides",
      leftTitle: "এসি কারেন্ট (AC)",
      rightTitle: "ডিসি কারেন্ট (DC)"
    }
  },
  {
    id: "text",
    name: "Text",
    nameBangla: "টেক্সট ও হেডিং (Text Slide)",
    category: "content",
    description: "মূল পাঠ্য বিষয়বস্তু, হেডিং, বুলেট পয়েন্ট ও গুরুত্বপূর্ণ সূত্রাবলী প্রদর্শনী।",
    color: "text-indigo-500 dark:text-indigo-400",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    icon: Type,
    defaultData: {
      type: "text_slide",
      title: "আজকের ক্লাসের মূল আলোচ্য বিষয়",
      content: "১. ওহমের সূত্র ও সার্কিট গণনা\n২. ব্যবহারিক মাল্টিমিটার টেস্ট\n৩. ল্যাব নিরাপত্তা নির্দেশিকা"
    }
  },
  {
    id: "image",
    name: "Image",
    nameBangla: "ছবি স্লাইড (Image Slide)",
    category: "content",
    description: "হাই-রেজুলেশন ডায়াগ্রাম, যন্ত্রপাতি বা বাস্তব কাজের ছবি প্রদর্শন।",
    color: "text-blue-500 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    icon: ImageIcon,
    defaultData: {
      type: "image_slide",
      title: "কারিগরি ওয়ার্কশপ সেটআপ",
      imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1000&auto=format&fit=crop&q=80"
    }
  },
  {
    id: "video",
    name: "Video",
    nameBangla: "ভিডিও স্লাইড (Video Slide)",
    category: "content",
    description: "ইউটিউব বা ভিডিও লেকচার সরাসরি স্লাইডের মধ্যে প্রদর্শন ও প্লেব্যাক।",
    color: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    icon: Video,
    defaultData: {
      type: "video_slide",
      title: "ব্যবহারিক ভিডিও টিউটোরিয়াল",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  },
  {
    id: "instructions",
    name: "Instructions",
    nameBangla: "নির্দেশনা স্লাইড (Instructions)",
    category: "content",
    description: "কুইজ শুরুর পূর্বে শিক্ষার্থীদের অংশগ্রহণের পিন ও নিয়মাবলী প্রদর্শনী।",
    color: "text-slate-600 dark:text-slate-400",
    iconBg: "bg-slate-500/10 dark:bg-slate-500/20",
    icon: ListChecks,
    defaultData: {
      type: "instructions_slide",
      title: "লাইভ কুইজের নিয়মাবলী",
      steps: ["১. আপনার মোবাইল বা ট্যাব থেকে পোর্টালে যান", "২. স্ক্রিনের ৬-সংখ্যার পিন কোড প্রবেশ করান", "৩. দ্রুত ও নির্ভুল উত্তর দিয়ে শীর্ষে থাকুন"]
    }
  },

  // --- 4. Integrations ---
  {
    id: "google_slides",
    name: "Google Slides",
    nameBangla: "Google Slides ইন্টিগ্রেশন",
    category: "integrations",
    description: "গুগল ড্রাইভ বা গুগল স্লাইডস প্রেজেন্টেশন সরাসরি যুক্ত করুন।",
    isStar: true,
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    icon: Presentation,
    defaultData: {
      type: "google_slides"
    }
  },
  {
    id: "powerpoint",
    name: "Powerpoint",
    nameBangla: "PowerPoint প্রেজেন্টেশন",
    category: "integrations",
    description: "মাইক্রোসফট পাওয়ারপয়েন্ট (.pptx) স্লাইড বা প্রেজেন্টেশন ইমপোর্ট।",
    isStar: true,
    color: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-500/10 dark:bg-orange-500/20",
    icon: Presentation,
    defaultData: {
      type: "powerpoint"
    }
  },
  {
    id: "miro",
    name: "Miro",
    nameBangla: "Miro হোয়াইটবোর্ড ইন্টিগ্রেশন",
    category: "integrations",
    description: "মিরো ইন্টারেক্টিভ ক্যানভাস ও হোয়াইটবোর্ড স্লাইড সরাসরি যুক্ত করুন।",
    isStar: true,
    color: "text-amber-500 dark:text-amber-300",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    icon: Sparkles,
    defaultData: {
      type: "miro"
    }
  }
];

interface InteractiveSlideTypeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (typeDef: SlideTypeDefinition) => void;
  onImportSlides?: () => void;
}

export default function InteractiveSlideTypeDrawer({
  isOpen,
  onClose,
  onSelectType,
  onImportSlides,
}: InteractiveSlideTypeDrawerProps) {
  const [selectedCategory, setSelectedCategory] = useState<SlideCategory | "all">("all");
  const [hoveredType, setHoveredType] = useState<SlideTypeDefinition | null>(null);

  if (!isOpen) return null;

  const interactiveList = SLIDE_TYPE_CATALOG.filter((t) => t.category === "interactive");
  const quizList = SLIDE_TYPE_CATALOG.filter((t) => t.category === "quiz");
  const contentList = SLIDE_TYPE_CATALOG.filter((t) => t.category === "content");
  const integrationsList = SLIDE_TYPE_CATALOG.filter((t) => t.category === "integrations");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "-100%", opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="relative z-10 w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                স্লাইড ও কুইজের ধরন নির্বাচন
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content (List styled exactly like Mentimeter) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 scrollbar-thin">
            
            {/* Section 1: Interactive questions */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Interactive questions</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {interactiveList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectType(item);
                        onClose();
                      }}
                      onMouseEnter={() => setHoveredType(item)}
                      onMouseLeave={() => setHoveredType(null)}
                      className="group flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-400 dark:hover:border-cyan-500 text-left transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                    >
                      <div className={`w-8 h-8 rounded-xl ${item.iconBg} ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
                            {item.name}
                          </span>
                          {item.isStar && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {item.nameBangla}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Quiz competitions */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Quiz competitions</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {quizList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectType(item);
                        onClose();
                      }}
                      onMouseEnter={() => setHoveredType(item)}
                      onMouseLeave={() => setHoveredType(null)}
                      className="group flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 text-left transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                    >
                      <div className={`w-8 h-8 rounded-xl ${item.iconBg} ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {item.nameBangla}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Content slides */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Content slides</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {contentList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectType(item);
                        onClose();
                      }}
                      onMouseEnter={() => setHoveredType(item)}
                      onMouseLeave={() => setHoveredType(null)}
                      className="group flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-400 dark:hover:border-emerald-500 text-left transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                    >
                      <div className={`w-8 h-8 rounded-xl ${item.iconBg} ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {item.nameBangla}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Integrations */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Integrations</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {integrationsList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectType(item);
                        onClose();
                      }}
                      onMouseEnter={() => setHoveredType(item)}
                      onMouseLeave={() => setHoveredType(null)}
                      className="group flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-amber-400 dark:hover:border-amber-500 text-left transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
                    >
                      <div className={`w-8 h-8 rounded-xl ${item.iconBg} ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
                            {item.name}
                          </span>
                          {item.isStar && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {item.nameBangla}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Tooltip / Preview Box */}
            {hoveredType && (
              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
                <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                  <span>{hoveredType.name} — {hoveredType.nameBangla}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {hoveredType.description}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Footer Action: Import Slides */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
            <button
              onClick={() => {
                if (onImportSlides) onImportSlides();
                else onClose();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer group"
            >
              <Upload className="w-4 h-4 text-indigo-600 dark:text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
              <span>↓ Import slides</span>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
