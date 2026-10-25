"use client";

import confetti from "canvas-confetti";

/**
 * Trigger an exciting burst of colorful confetti for correct answers
 */
export const triggerCorrectAnswerConfetti = () => {
  if (typeof window === "undefined") return;
  try {
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.65 },
      colors: ["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6", "#ec4899", "#3b82f6"],
      disableForReducedMotion: true,
      zIndex: 9999,
    });
  } catch (e) {
    console.warn("Confetti animation error:", e);
  }
};

/**
 * Full-screen celebratory fireworks for Podium or Top Leaderboard transitions
 */
export const triggerFireworks = () => {
  if (typeof window === "undefined") return;
  try {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 45 * (timeLeft / duration);
      // Fireworks from left edge
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.35), y: Math.random() * 0.4 + 0.1 },
        colors: ["#06b6d4", "#a855f7", "#10b981", "#f59e0b", "#ec4899"],
      });
      // Fireworks from right edge
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.65, 0.9), y: Math.random() * 0.4 + 0.1 },
        colors: ["#3b82f6", "#6366f1", "#f43f5e", "#eab308", "#14b8a6"],
      });
    }, 250);
  } catch (e) {
    console.warn("Fireworks error:", e);
  }
};

/**
 * Premium Multi-Stage Block Completion Celebration
 * Triggers a satisfying, gamified confetti explosion (Center Burst + Angled Side Cannons + Star Sparkles)
 */
export const triggerBlockCompletionCelebration = () => {
  if (typeof window === "undefined") return;
  try {
    // Stage 1: High-energy central burst with colorful confetti and stars
    confetti({
      particleCount: 85,
      spread: 75,
      startVelocity: 42,
      origin: { y: 0.62 },
      colors: ["#10b981", "#06b6d4", "#f59e0b", "#6366f1", "#ec4899", "#3b82f6"],
      shapes: ["circle", "square"],
      scalar: 1.15,
      zIndex: 9999,
      disableForReducedMotion: true,
    });

    // Stage 2: Dual angled side cannons (120ms delay)
    setTimeout(() => {
      // Left cannon firing diagonally right-upwards
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        startVelocity: 50,
        origin: { x: 0.1, y: 0.8 },
        colors: ["#10b981", "#06b6d4", "#eab308", "#f43f5e"],
        zIndex: 9999,
        disableForReducedMotion: true,
      });

      // Right cannon firing diagonally left-upwards
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        startVelocity: 50,
        origin: { x: 0.9, y: 0.8 },
        colors: ["#6366f1", "#a855f7", "#3b82f6", "#14b8a6"],
        zIndex: 9999,
        disableForReducedMotion: true,
      });
    }, 120);

    // Stage 3: Golden milestone sparkle shower (260ms delay)
    setTimeout(() => {
      confetti({
        particleCount: 35,
        spread: 100,
        startVelocity: 25,
        origin: { y: 0.45 },
        colors: ["#fbbf24", "#f59e0b", "#fde047", "#ffffff"],
        shapes: ["circle"],
        scalar: 0.9,
        ticks: 90,
        gravity: 0.8,
        zIndex: 9999,
        disableForReducedMotion: true,
      });
    }, 260);
  } catch (err) {
    console.warn("Block completion celebration error:", err);
  }
};
