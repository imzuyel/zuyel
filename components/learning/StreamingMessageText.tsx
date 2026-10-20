"use client";

import React, { useState, useEffect } from "react";

interface StreamingMessageTextProps {
  text: string;
  isNew?: boolean;
  onComplete?: () => void;
  speed?: number; // ms per interval
}

export default function StreamingMessageText({
  text,
  isNew = false,
  onComplete,
  speed = 18,
}: StreamingMessageTextProps) {
  const [displayedText, setDisplayedText] = useState(isNew ? "" : text);
  const [isTyping, setIsTyping] = useState(isNew);

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    let currentIndex = 0;
    setIsTyping(true);
    const totalLength = text.length;

    // Dynamically calculate chunk size so longer texts finish in a natural 1.5-2.5s window
    const chunkSize = Math.max(1, Math.ceil(totalLength / 90));

    const timer = setInterval(() => {
      currentIndex += chunkSize;
      if (currentIndex >= totalLength) {
        setDisplayedText(text);
        setIsTyping(false);
        clearInterval(timer);
        if (onComplete) onComplete();
      } else {
        setDisplayedText(text.slice(0, currentIndex));
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, isNew, speed, onComplete]);

  return (
    <span className="relative">
      <span className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed inline">
        {displayedText}
      </span>
      {isTyping && (
        <span
          className="inline-block w-2 h-4 ml-1 bg-indigo-600 dark:bg-cyan-400 animate-pulse rounded-xs align-middle"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
