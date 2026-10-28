"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  NormalizedQuizQuestion,
  QuestionTypeUniversal,
  UniversalQuizEngineProps,
  MCQArchetypeTemplate,
} from "./types";
import { ArchetypeSkeleton } from "./archetypes/ArchetypeSkeleton";
import { isOptionMatch } from "./archetypes/shared";

/* =========================================================================
   PERFORMANCE & SPEED OPTIMIZATION (ZERO LAG):
   Code-split all question-type renderers and 10 archetypes using next/dynamic
   so ONLY the active template and active question-type renderer are in memory.
   Heavy @dnd-kit libraries and SVG line math are NOT bundled synchronously.
========================================================================= */

// Lazy Question Type Renderers
const DynamicMatchingBoard = dynamic(() => import("./MatchingBoardTemplates"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton title="ম্যাচিং বোর্ড লোড হচ্ছে..." />,
});

const DynamicFillBlanks = dynamic(() => import("./FillBlanksTemplates"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton title="শূন্যস্থান পূরণ লোড হচ্ছে..." />,
});

const DynamicReorderSequence = dynamic(() => import("./ReorderSequenceTemplates"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton title="ক্রমবিন্যাস বোর্ড লোড হচ্ছে..." />,
});

const DynamicTrueFalse = dynamic(() => import("./TrueFalseTemplates"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton title="সত্য / মিথ্যা লোড হচ্ছে..." />,
});

// Lazy 10 Distinct Structural Archetypes
const DynamicArchetype01 = dynamic(() => import("./archetypes/Archetype01"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton />,
});
const DynamicArchetype02 = dynamic(() => import("./archetypes/Archetype02"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton />,
});
const DynamicArchetype03 = dynamic(() => import("./archetypes/Archetype03"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton />,
});
const DynamicArchetype04 = dynamic(() => import("./archetypes/Archetype04"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton />,
});
const DynamicArchetype05 = dynamic(() => import("./archetypes/Archetype05"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton />,
});
const DynamicArchetype06 = dynamic(() => import("./archetypes/Archetype06"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton />,
});
const DynamicArchetype07 = dynamic(() => import("./archetypes/Archetype07"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton />,
});
const DynamicArchetype08 = dynamic(() => import("./archetypes/Archetype08"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton />,
});
const DynamicArchetype09 = dynamic(() => import("./archetypes/Archetype09"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton />,
});
const DynamicArchetype10 = dynamic(() => import("./archetypes/Archetype10"), {
  ssr: false,
  loading: () => <ArchetypeSkeleton />,
});

/* =========================================================================
   20 DISTINCT TEMPLATES REGISTRY (10 Archetypes x 2 Variants Each)
========================================================================= */
export const SHOWCASE_TEMPLATES: MCQArchetypeTemplate[] = [
  // 1. Archetype 1, Variant 1
  {
    id: 1,
    archetypeId: 1,
    archetypeName: "Open Cut-Frame & Corner Question Mark",
    archetypeNameBangla: "ওপেন কাট-ফ্রেম ও কর্নার প্রশ্নচিহ্ন",
    variantName: "Neon Cyan & Obsidian",
    accentColor: "#06B6D4",
    glowColor: "rgba(6,182,212,0.3)",
    component: (props) => (
      <DynamicArchetype01
        {...props}
        accentColor="#06B6D4"
        borderColor="border-cyan-500"
        bgGradient="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/60"
      />
    ),
  },
  // 2. Archetype 1, Variant 2
  {
    id: 2,
    archetypeId: 1,
    archetypeName: "Open Cut-Frame & Corner Question Mark",
    archetypeNameBangla: "ওপেন কাট-ফ্রেম ও কর্নার প্রশ্নচিহ্ন",
    variantName: "Solar Gold & Ember",
    accentColor: "#F59E0B",
    glowColor: "rgba(245,158,11,0.3)",
    component: (props) => (
      <DynamicArchetype01
        {...props}
        accentColor="#F59E0B"
        borderColor="border-amber-500"
        bgGradient="bg-gradient-to-br from-slate-950 via-amber-950/40 to-slate-950"
      />
    ),
  },
  // 3. Archetype 2, Variant 1
  {
    id: 3,
    archetypeId: 2,
    archetypeName: "Hexagonal Connected Nodes",
    archetypeNameBangla: "হেক্সাগনাল কানেক্টেড নোডস",
    variantName: "Cyber Jade Matrix",
    accentColor: "#10B981",
    glowColor: "rgba(16,185,129,0.3)",
    component: (props) => (
      <DynamicArchetype02
        {...props}
        accentColor="#10B981"
        bgClass="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950"
      />
    ),
  },
  // 4. Archetype 2, Variant 2
  {
    id: 4,
    archetypeId: 2,
    archetypeName: "Hexagonal Connected Nodes",
    archetypeNameBangla: "হেক্সাগনাল কানেক্টেড নোডস",
    variantName: "Deep Violet Quantum",
    accentColor: "#8B5CF6",
    glowColor: "rgba(139,92,246,0.3)",
    component: (props) => (
      <DynamicArchetype02
        {...props}
        accentColor="#8B5CF6"
        bgClass="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950"
      />
    ),
  },
  // 5. Archetype 3, Variant 1
  {
    id: 5,
    archetypeId: 3,
    archetypeName: "Keyhole Notch Neon Outline",
    archetypeNameBangla: "কিহোল নচ নিয়ন আউটলাইন",
    variantName: "Hot Pink Synthwave",
    accentColor: "#EC4899",
    glowColor: "rgba(236,72,153,0.3)",
    component: (props) => (
      <DynamicArchetype03
        {...props}
        accentColor="#EC4899"
        glowColor="rgba(236,72,153,0.3)"
      />
    ),
  },
  // 6. Archetype 3, Variant 2
  {
    id: 6,
    archetypeId: 3,
    archetypeName: "Keyhole Notch Neon Outline",
    archetypeNameBangla: "কিহোল নচ নিয়ন আউটলাইন",
    variantName: "Electric Aqua Tron",
    accentColor: "#06B6D4",
    glowColor: "rgba(6,182,212,0.3)",
    component: (props) => (
      <DynamicArchetype03
        {...props}
        accentColor="#06B6D4"
        glowColor="rgba(6,182,212,0.3)"
      />
    ),
  },
  // 7. Archetype 4, Variant 1
  {
    id: 7,
    archetypeId: 4,
    archetypeName: "3D Claymorphism Puffy Pillow",
    archetypeNameBangla: "থ্রিডি ক্লেমর্ফিজম পাফি পিলো",
    variantName: "Cotton Candy Lilac",
    accentColor: "#A855F7",
    glowColor: "rgba(168,85,247,0.3)",
    component: (props) => (
      <DynamicArchetype04
        {...props}
        pillowBg="bg-gradient-to-b from-purple-100 to-pink-100 dark:from-purple-950/60 dark:to-pink-950/60"
        accentBubble="bg-gradient-to-r from-purple-500 to-pink-500"
      />
    ),
  },
  // 8. Archetype 4, Variant 2
  {
    id: 8,
    archetypeId: 4,
    archetypeName: "3D Claymorphism Puffy Pillow",
    archetypeNameBangla: "থ্রিডি ক্লেমর্ফিজম পাফি পিলো",
    variantName: "Mint Pistachio Soft-Clay",
    accentColor: "#14B8A6",
    glowColor: "rgba(20,184,166,0.3)",
    component: (props) => (
      <DynamicArchetype04
        {...props}
        pillowBg="bg-gradient-to-b from-teal-100 to-emerald-100 dark:from-teal-950/60 dark:to-emerald-950/60"
        accentBubble="bg-gradient-to-r from-teal-500 to-emerald-500"
      />
    ),
  },
  // 9. Archetype 5, Variant 1
  {
    id: 9,
    archetypeId: 5,
    archetypeName: "3D Folded Ribbon Header",
    archetypeNameBangla: "থ্রিডি ফোল্ডেড রিবন হেডার",
    variantName: "Golden Amber Badge",
    accentColor: "#F59E0B",
    glowColor: "rgba(245,158,11,0.3)",
    component: (props) => (
      <DynamicArchetype05 {...props} ribbonColor="bg-amber-500" />
    ),
  },
  // 10. Archetype 5, Variant 2
  {
    id: 10,
    archetypeId: 5,
    archetypeName: "3D Folded Ribbon Header",
    archetypeNameBangla: "থ্রিডি ফোল্ডেড রিবন হেডার",
    variantName: "Crimson Ruby Badge",
    accentColor: "#EF4444",
    glowColor: "rgba(239,68,68,0.3)",
    component: (props) => (
      <DynamicArchetype05 {...props} ribbonColor="bg-rose-500" />
    ),
  },
  // 11. Archetype 6, Variant 1
  {
    id: 11,
    archetypeId: 6,
    archetypeName: "Giant Floating 3D '?' & Leaf Pills",
    archetypeNameBangla: "জায়ান্ট ফ্লোটিং প্রশ্নচিহ্ন ও লিফ পিল",
    variantName: "Cyan Monolith",
    accentColor: "#06B6D4",
    glowColor: "rgba(6,182,212,0.3)",
    component: (props) => (
      <DynamicArchetype06 {...props} accentColor="#06B6D4" />
    ),
  },
  // 12. Archetype 6, Variant 2
  {
    id: 12,
    archetypeId: 6,
    archetypeName: "Giant Floating 3D '?' & Leaf Pills",
    archetypeNameBangla: "জায়ান্ট ফ্লোটিং প্রশ্নচিহ্ন ও লিফ পিল",
    variantName: "Lime Volt Surge",
    accentColor: "#84CC16",
    glowColor: "rgba(132,204,22,0.3)",
    component: (props) => (
      <DynamicArchetype06 {...props} accentColor="#84CC16" />
    ),
  },
  // 13. Archetype 7, Variant 1
  {
    id: 13,
    archetypeId: 7,
    archetypeName: "3D Tilted Isometric Tray Card",
    archetypeNameBangla: "থ্রিডি টিল্টেড আইসোমেট্রিক ট্রে",
    variantName: "Construction Amber Heavy-Duty",
    accentColor: "#F59E0B",
    glowColor: "rgba(245,158,11,0.3)",
    component: (props) => (
      <DynamicArchetype07
        {...props}
        trayBorder="border-amber-500"
        headerBar="bg-amber-500"
      />
    ),
  },
  // 14. Archetype 7, Variant 2
  {
    id: 14,
    archetypeId: 7,
    archetypeName: "3D Tilted Isometric Tray Card",
    archetypeNameBangla: "থ্রিডি টিল্টেড আইসোমেট্রিক ট্রে",
    variantName: "Deep Slate Arcade Console",
    accentColor: "#3B82F6",
    glowColor: "rgba(59,130,246,0.3)",
    component: (props) => (
      <DynamicArchetype07
        {...props}
        trayBorder="border-blue-500"
        headerBar="bg-blue-600"
      />
    ),
  },
  // 15. Archetype 8, Variant 1
  {
    id: 15,
    archetypeId: 8,
    archetypeName: "Glassmorphic Center Prism with Torus",
    archetypeNameBangla: "গ্লাসমর্ফিক প্রিজম ও টোরাস রিংস",
    variantName: "Bioluminescent Lagoon",
    accentColor: "#06B6D4",
    glowColor: "rgba(6,182,212,0.3)",
    component: (props) => (
      <DynamicArchetype08 {...props} ringGradient="from-cyan-500 to-fuchsia-500" />
    ),
  },
  // 16. Archetype 8, Variant 2
  {
    id: 16,
    archetypeId: 8,
    archetypeName: "Glassmorphic Center Prism with Torus",
    archetypeNameBangla: "গ্লাসমর্ফিক প্রিজম ও টোরাস রিংস",
    variantName: "Aurora Borealis Frost",
    accentColor: "#10B981",
    glowColor: "rgba(16,185,129,0.3)",
    component: (props) => (
      <DynamicArchetype08 {...props} ringGradient="from-emerald-400 to-indigo-500" />
    ),
  },
  // 17. Archetype 9, Variant 1
  {
    id: 17,
    archetypeId: 9,
    archetypeName: "SVG Tree-Branch Mindmap Connectors",
    archetypeNameBangla: "এসভিজি মাইন্ডম্যাপ ব্রাঞ্চেস",
    variantName: "Cyan Neural Network",
    accentColor: "#06B6D4",
    glowColor: "rgba(6,182,212,0.3)",
    component: (props) => (
      <DynamicArchetype09 {...props} branchColor="#06B6D4" />
    ),
  },
  // 18. Archetype 9, Variant 2
  {
    id: 18,
    archetypeId: 9,
    archetypeName: "SVG Tree-Branch Mindmap Connectors",
    archetypeNameBangla: "এসভিজি মাইন্ডম্যাপ ব্রাঞ্চেস",
    variantName: "Magenta Synapse Bridge",
    accentColor: "#D946EF",
    glowColor: "rgba(217,70,239,0.3)",
    component: (props) => (
      <DynamicArchetype09 {...props} branchColor="#D946EF" />
    ),
  },
  // 19. Archetype 10, Variant 1
  {
    id: 19,
    archetypeId: 10,
    archetypeName: "Cyberpunk Chamfered HUD",
    archetypeNameBangla: "সাইবারপাঙ্ক চাম্ফার্ড এইচইউডি",
    variantName: "Matrix CRT Terminal",
    accentColor: "#22C55E",
    glowColor: "rgba(34,197,94,0.3)",
    component: (props) => (
      <DynamicArchetype10 {...props} techColor="#22C55E" />
    ),
  },
  // 20. Archetype 10, Variant 2
  {
    id: 20,
    archetypeId: 10,
    archetypeName: "Cyberpunk Chamfered HUD",
    archetypeNameBangla: "সাইবারপাঙ্ক চাম্ফার্ড এইচইউডি",
    variantName: "Night City Yellow HUD",
    accentColor: "#EAB308",
    glowColor: "rgba(234,179,8,0.3)",
    component: (props) => (
      <DynamicArchetype10 {...props} techColor="#FACC15" />
    ),
  },
];

/* Helper to get template by ID */
export function getShowcaseTemplateById(id: number): MCQArchetypeTemplate {
  const found = SHOWCASE_TEMPLATES.find((t) => t.id === id);
  return found || SHOWCASE_TEMPLATES[0];
}

/* =========================================================================
   UNIVERSAL QUIZ SHOWCASE ENGINE COMPONENT (React.memo)
========================================================================= */
export const UniversalQuizShowcaseEngine = React.memo(function UniversalQuizShowcaseEngine({
  question,
  questionIndex = 0,
  totalQuestions = 1,
  selectedAnswer,
  onSelectAnswer,
  onConfirmAnswer,
  isConfirmed = false,
  isCorrect,
  disabled = false,
  templateId: forcedTemplateId,
  autoRandomize = true,
  onTemplateChange,
  showProofBadge = true,
}: UniversalQuizEngineProps) {
  // Active template state (1-20)
  const [activeTemplateId, setActiveTemplateId] = useState<number>(() => {
    if (forcedTemplateId) return forcedTemplateId;
    if (autoRandomize) {
      return Math.floor(Math.random() * SHOWCASE_TEMPLATES.length) + 1;
    }
    return 1;
  });

  const lastQuestionKeyRef = useRef<string>("");

  // Normalize Question from ANY structure (Chapter Quiz or Live Quiz)
  const normalizedQuestion: NormalizedQuizQuestion = useMemo(() => {
    if (!question) {
      return {
        id: "placeholder",
        questionType: "MCQ",
        questionText: "প্রশ্ন প্রস্তুত হচ্ছে...",
        options: ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
        correctOptionIndex: 0,
      };
    }

    const snap = question.questionSnapshot || question.questionData || {};
    const rawType = String(
      question.questionType ||
      question.type ||
      snap.questionType ||
      snap.type ||
      "MCQ"
    ).toUpperCase();

    let resolvedType: QuestionTypeUniversal = "MCQ";
    if (rawType.includes("TRUE") || rawType.includes("TF") || rawType === "TRUE_FALSE") {
      resolvedType = "TRUE_FALSE";
    } else if (rawType.includes("BLANK") || rawType === "FILL_BLANKS" || rawType === "FILL_BLANK") {
      resolvedType = "FILL_BLANKS";
    } else if (rawType.includes("MATCH") || rawType === "MATCHING") {
      resolvedType = "MATCHING";
    } else if (
      rawType.includes("ORDER") ||
      rawType.includes("REARRANGE") ||
      rawType === "REORDER" ||
      rawType === "ORDERING"
    ) {
      resolvedType = "REORDER";
    }

    // Extract options
    let resolvedOptions: string[] = [];
    if (Array.isArray(question.options) && question.options.length > 0) {
      resolvedOptions = question.options.map((o: any) =>
        typeof o === "string" ? o : o.text || String(o)
      );
    } else if (Array.isArray(snap.options) && snap.options.length > 0) {
      resolvedOptions = snap.options.map((o: any) =>
        typeof o === "string" ? o : o.text || String(o)
      );
    } else if (Array.isArray(question.items) && question.items.length > 0) {
      resolvedOptions = question.items;
    } else if (Array.isArray(snap.items) && snap.items.length > 0) {
      resolvedOptions = snap.items;
    } else if (Array.isArray(snap.steps) && snap.steps.length > 0) {
      resolvedOptions = snap.steps;
    }

    // Extract pairs
    let resolvedPairs =
      question.pairs || question.matchingPairs || snap.pairs || snap.matchingPairs || [];
    if (
      (!Array.isArray(resolvedPairs) || resolvedPairs.length === 0) &&
      typeof (question.correctAnswer || snap.correctAnswer) === "string"
    ) {
      const candidate = String(question.correctAnswer || snap.correctAnswer).trim();
      if (candidate.startsWith("[")) {
        try {
          const parsed = JSON.parse(candidate);
          if (Array.isArray(parsed) && parsed.length > 0) resolvedPairs = parsed;
        } catch {}
      }
    }

    // Resolve correct option index and raw correct answer key
    const rawCorrect =
      question.correctAnswer ??
      snap.correctAnswer ??
      question.correctOption ??
      snap.correctOption ??
      question.correctOptionId ??
      snap.correctOptionId;

    let resolvedCorrectIndex = Number(
      question.correctOptionIndex ?? snap.correctOptionIndex ?? snap.correctIndex ?? -1
    );

    // If correctOptionIndex wasn't a valid index in options, resolve from rawCorrect
    if (resolvedCorrectIndex < 0 || resolvedCorrectIndex >= resolvedOptions.length) {
      if (rawCorrect !== undefined && rawCorrect !== null) {
        const found = resolvedOptions.findIndex((optStr, idx) =>
          isOptionMatch(optStr, idx, rawCorrect)
        );
        if (found !== -1) {
          resolvedCorrectIndex = found;
        } else if (
          !isNaN(Number(rawCorrect)) &&
          Number(rawCorrect) >= 0 &&
          Number(rawCorrect) < resolvedOptions.length
        ) {
          resolvedCorrectIndex = Number(rawCorrect);
        } else {
          resolvedCorrectIndex = 0;
        }
      } else {
        resolvedCorrectIndex = 0;
      }
    }

    // Resolve prompt text (with proper fallbacks for content / title in Fill Blanks, Matching, etc.)
    const resolvedPrompt =
      question.questionText ||
      (resolvedType === "FILL_BLANKS" ? (question.content || question.title) : (question.title || question.content)) ||
      snap.questionText ||
      snap.prompt ||
      snap.content ||
      snap.title ||
      "প্রশ্ন প্রস্তুত হচ্ছে...";

    return {
      id: question.id || `q-${questionIndex}`,
      questionType: resolvedType,
      questionText: resolvedPrompt,
      options: resolvedOptions,
      correctOptionIndex: resolvedCorrectIndex,
      correctAnswer: rawCorrect,
      correctBoolean:
        typeof question.correctBoolean === "boolean"
          ? question.correctBoolean
          : typeof question.correctAnswer === "boolean"
          ? question.correctAnswer
          : rawCorrect === true || rawCorrect === "true" || snap.correctAnswer === true || snap.correctAnswer === "true",
      acceptedAnswers:
        question.acceptedAnswers ||
        snap.acceptedAnswers ||
        (rawCorrect && typeof rawCorrect === "string" ? [rawCorrect] : []),
      matchingPairs: resolvedPairs,
      correctOrder:
        question.correctOrder || question.items || snap.items || snap.steps || resolvedOptions,
      explanation: question.explanation || snap.explanation,
      marks: question.marks || snap.marks || 1,
      timeLimit: question.timeLimit || snap.timeLimit || 60,
      conceptTopic: question.conceptTopic || snap.conceptTopic,
    };
  }, [question, questionIndex]);

  // Handle Dynamic Rotation on question change
  const currentKey = `${normalizedQuestion.id}_idx_${questionIndex}`;
  useEffect(() => {
    if (forcedTemplateId) {
      setActiveTemplateId(forcedTemplateId);
      return;
    }

    if (lastQuestionKeyRef.current !== currentKey) {
      lastQuestionKeyRef.current = currentKey;
      if (autoRandomize) {
        const total = SHOWCASE_TEMPLATES.length;
        const nextId = Math.floor(Math.random() * total) + 1;
        setActiveTemplateId(nextId);
        if (onTemplateChange) onTemplateChange(nextId);
      }
    }
  }, [currentKey, autoRandomize, forcedTemplateId, onTemplateChange]);

  const activeTemplateDef = useMemo(() => {
    return getShowcaseTemplateById(activeTemplateId);
  }, [activeTemplateId]);

  const ActiveMCQComponent = activeTemplateDef.component;

  return (
    <div className="relative w-full">

      {/* Main Dynamic Template Body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTemplateId}-${normalizedQuestion.id}-${normalizedQuestion.questionType}`}
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full"
        >
          {/* SPECIAL QUESTION TYPES (100% Full-Width Dedicated Templates via next/dynamic) */}
          {normalizedQuestion.questionType === "MATCHING" ? (
            <div className="w-full max-w-5xl mx-auto">
              <DynamicMatchingBoard
                question={normalizedQuestion}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={onSelectAnswer}
                onConfirmAnswer={onConfirmAnswer}
                isConfirmed={isConfirmed}
                isCorrect={isCorrect}
                disabled={disabled}
              />
            </div>
          ) : normalizedQuestion.questionType === "FILL_BLANKS" ? (
            <div className="w-full max-w-5xl mx-auto">
              <DynamicFillBlanks
                question={normalizedQuestion}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={onSelectAnswer}
                onConfirmAnswer={onConfirmAnswer}
                isConfirmed={isConfirmed}
                isCorrect={isCorrect}
                disabled={disabled}
              />
            </div>
          ) : normalizedQuestion.questionType === "REORDER" ? (
            <div className="w-full max-w-5xl mx-auto">
              <DynamicReorderSequence
                question={normalizedQuestion}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={onSelectAnswer}
                onConfirmAnswer={onConfirmAnswer}
                isConfirmed={isConfirmed}
                isCorrect={isCorrect}
                disabled={disabled}
              />
            </div>
          ) : normalizedQuestion.questionType === "TRUE_FALSE" ? (
            <div className="w-full max-w-5xl mx-auto">
              <DynamicTrueFalse
                question={normalizedQuestion}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={onSelectAnswer}
                onConfirmAnswer={onConfirmAnswer}
                isConfirmed={isConfirmed}
                isCorrect={isCorrect}
                disabled={disabled}
              />
            </div>
          ) : (
            /* MCQ ARCHETYPES (20 Rotating Templates via next/dynamic) */
            <ActiveMCQComponent
              question={normalizedQuestion}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
              selectedAnswer={selectedAnswer}
              onSelectAnswer={onSelectAnswer}
              isConfirmed={isConfirmed}
              isCorrect={isCorrect}
              disabled={disabled}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

export default UniversalQuizShowcaseEngine;
