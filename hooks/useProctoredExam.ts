"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseProctoredExamProps {
  sessionId?: string;
  playerId?: string;
  playerName?: string;
  isActive?: boolean;
  strictMode?: boolean;
  onAutoSubmit?: (reason: string) => void;
}

export interface ProctoringState {
  strikes: number;
  maxStrikes: number;
  isDisqualified: boolean;
  isFullscreen: boolean;
  lastViolationType: string | null;
  warningModalOpen: boolean;
  warningMessage: string;
}

export function useProctoredExam({
  sessionId,
  playerId,
  playerName,
  isActive = false,
  strictMode = true,
  onAutoSubmit,
}: UseProctoredExamProps) {
  const [strikes, setStrikes] = useState<number>(0);
  const maxStrikes = 3;
  const [isDisqualified, setIsDisqualified] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [warningModalOpen, setWarningModalOpen] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>("");
  const [lastViolationType, setLastViolationType] = useState<string | null>(null);

  const lastViolationTimeRef = useRef<number>(0);
  const isAutoSubmittedRef = useRef<boolean>(false);

  // Send violation to server
  const reportViolation = useCallback(
    async (type: "TAB_SWITCH" | "WINDOW_BLUR" | "FULLSCREEN_EXIT" | "DEVTOOLS_SHORTCUT" | "RIGHT_CLICK", details?: string) => {
      const now = Date.now();
      // Debounce violations within 2.5 seconds to prevent cascade from a single alt-tab
      if (now - lastViolationTimeRef.current < 2500) return;
      lastViolationTimeRef.current = now;

      setLastViolationType(type);

      let newStrikes = strikes + 1;
      setStrikes(newStrikes);

      let message = "";
      if (type === "TAB_SWITCH") {
        message = "সতর্কতা: পরীক্ষা চলাকালীন অন্য ট্যাবে যাওয়া বা ব্রাউজার মিনিমাইজ করা সম্পূর্ণ নিষিদ্ধ!";
      } else if (type === "WINDOW_BLUR") {
        message = "সতর্কতা: পরীক্ষা উইন্ডো থেকে ফোকাস সরানো যাবে না!";
      } else if (type === "FULLSCREEN_EXIT") {
        message = "সতর্কতা: প্রক্টরিং সুরক্ষার জন্য ফুলস্ক্রিন মোড চালু রাখা বাধ্যতামূলক!";
      } else if (type === "DEVTOOLS_SHORTCUT") {
        message = "সতর্কতা: ডেভেলপার টুলস বা সোর্স কোড শর্টকাট ব্যবহার নিষিদ্ধ!";
      } else if (type === "RIGHT_CLICK") {
        message = "সতর্কতা: রাইট-ক্লিক কনটেক্সট মেনু নিষ্ক্রিয় করা হয়েছে!";
      }

      setWarningMessage(message);
      setWarningModalOpen(true);

      // Log to backend
      if (sessionId && playerId) {
        try {
          const res = await fetch(`/api/live-quizzes/sessions/${sessionId}/proctoring`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId,
              playerName: playerName || "Student",
              violationType: type,
              details: details || message,
            }),
          });
          const data = await res.json();
          if (data.success) {
            setStrikes(data.strikes);
            if (data.isDisqualified) {
              setIsDisqualified(true);
              if (!isAutoSubmittedRef.current && onAutoSubmit) {
                isAutoSubmittedRef.current = true;
                onAutoSubmit("সর্বোচ্চ ৩টি সতর্কবার্তা অতিক্রম করায় পরীক্ষা অটো-সাবমিট হয়েছে।");
              }
            }
          }
        } catch (e) {
          console.error("Failed to report proctoring event:", e);
        }
      }

      if (newStrikes >= maxStrikes) {
        setIsDisqualified(true);
        if (!isAutoSubmittedRef.current && onAutoSubmit) {
          isAutoSubmittedRef.current = true;
          onAutoSubmit("সর্বোচ্চ ৩টি সতর্কবার্তা অতিক্রম করায় পরীক্ষা অটো-সাবমিট হয়েছে।");
        }
      }
    },
    [sessionId, playerId, playerName, strikes, maxStrikes, onAutoSubmit]
  );

  // Request Fullscreen helper
  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (e) {
      console.warn("Fullscreen request not permitted or declined by user:", e);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn("Exit fullscreen failed:", e);
    }
  }, []);

  // Event Listeners for Proctoring
  useEffect(() => {
    if (!isActive || isDisqualified) return;

    // 1. Tab Visibility Change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation("TAB_SWITCH", "User switched tab or minimized browser window.");
      }
    };

    // 2. Window Blur (e.g. clicked outside or opened another app)
    const handleWindowBlur = () => {
      reportViolation("WINDOW_BLUR", "Browser window lost focus.");
    };

    // 3. Fullscreen Exit
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen && strictMode) {
        reportViolation("FULLSCREEN_EXIT", "User exited fullscreen mode during examination.");
      }
    };

    // 4. Shortcut Block & Detection (F12, Ctrl+Shift+I, Ctrl+U, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!strictMode) return;

      // F12
      if (e.key === "F12") {
        e.preventDefault();
        reportViolation("DEVTOOLS_SHORTCUT", "F12 Inspect key pressed.");
        return false;
      }

      // Ctrl + Shift + I or Ctrl + Shift + J or Ctrl + Shift + C
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) {
        e.preventDefault();
        reportViolation("DEVTOOLS_SHORTCUT", "DevTools shortcut key combination pressed.");
        return false;
      }

      // Ctrl + U (View Source)
      if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        reportViolation("DEVTOOLS_SHORTCUT", "View source shortcut pressed.");
        return false;
      }
    };

    // 5. Right Click Context Menu Block
    const handleContextMenu = (e: MouseEvent) => {
      if (strictMode) {
        e.preventDefault();
        reportViolation("RIGHT_CLICK", "Right click menu attempted.");
        return false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isActive, isDisqualified, strictMode, reportViolation]);

  return {
    strikes,
    maxStrikes,
    isDisqualified,
    isFullscreen,
    warningModalOpen,
    warningMessage,
    lastViolationType,
    setWarningModalOpen,
    requestFullscreen,
    exitFullscreen,
  };
}
