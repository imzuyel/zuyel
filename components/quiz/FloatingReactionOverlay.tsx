"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface FloatingItem {
  id: string;
  emoji: string;
  xOffset: number; // percentage offset
  size: number;
}

const EMOJI_MAP: Record<string, string> = {
  cat: "🐱",
  heart: "❤️",
  question: "❓",
  thumbs_up: "👍",
  thumbs_down: "👎",
};

interface FloatingReactionOverlayProps {
  // Allows parent to expose a trigger function
  triggerReaction?: (key: string) => void;
}

export default function FloatingReactionOverlay() {
  const [particles, setParticles] = useState<FloatingItem[]>([]);

  // Function to add a reaction
  const addReaction = useCallback((reactionKey: string) => {
    const emoji = EMOJI_MAP[reactionKey] || reactionKey;
    const newItem: FloatingItem = {
      id: `p-${Date.now()}-${Math.random()}`,
      emoji,
      xOffset: Math.random() * 80 - 40, // -40px to +40px
      size: Math.floor(Math.random() * 12) + 28, // 28px to 40px
    };

    setParticles((prev) => [...prev.slice(-25), newItem]);

    // Clean up after 2.8 seconds
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newItem.id));
    }, 2800);
  }, []);

  // Listen for window-level custom events so any component can trigger reactions
  useEffect(() => {
    const handleCustomReaction = (e: any) => {
      if (e.detail?.reactionKey) {
        addReaction(e.detail.reactionKey);
      }
    };
    window.addEventListener("live-quiz-reaction" as any, handleCustomReaction);
    return () => {
      window.removeEventListener("live-quiz-reaction" as any, handleCustomReaction);
    };
  }, [addReaction]);

  return (
    <div className="pointer-events-none fixed bottom-16 right-20 sm:right-28 z-40 w-44 h-96 overflow-hidden flex flex-col justify-end items-center">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 50, scale: 0.5, x: p.xOffset }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -300,
              scale: [0.6, 1.2, 1],
              x: p.xOffset + Math.sin(p.size) * 30,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2.5,
              ease: "easeOut",
            }}
            style={{ fontSize: `${p.size}px` }}
            className="absolute bottom-4 drop-shadow-lg select-none"
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Utility function to dispatch reactions anywhere
export function emitLiveReaction(reactionKey: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("live-quiz-reaction", { detail: { reactionKey } })
    );
  }
}
