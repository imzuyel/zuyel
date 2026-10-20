"use client";

import React, { useState, useEffect } from "react";
import { toBengaliNumerals } from "@/lib/utils";

interface DynamicCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  isBengali?: boolean;
}

export default function DynamicCounter({
  end,
  duration = 1800,
  suffix = "",
  isBengali = true,
}: DynamicCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  const displayVal = isBengali ? toBengaliNumerals(count) : count;

  return (
    <span className="font-mono font-black tabular-nums">
      {displayVal}
      {suffix}
    </span>
  );
}
