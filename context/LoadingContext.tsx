"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  startLoading: (message?: string) => void;
  stopLoading: (successMessage?: string) => void;
  withLoading: <T>(promiseFn: () => Promise<T>, message?: string, successMsg?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("কাজ চলছে... অনুগ্রহ করে অপেক্ষা করুন");
  const [toastSuccessMessage, setToastSuccessMessage] = useState<string | null>(null);
  const [progressWidth, setProgressWidth] = useState(0);

  // Top progress bar animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setProgressWidth(15);
      interval = setInterval(() => {
        setProgressWidth((prev) => {
          if (prev >= 85) return prev;
          return prev + Math.floor(Math.random() * 12) + 5;
        });
      }, 250);
    } else {
      setProgressWidth(100);
      const timer = setTimeout(() => {
        setProgressWidth(0);
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const startLoading = useCallback((message = "কাজ প্রসেসিং হচ্ছে...") => {
    setLoadingMessage(message);
    setToastSuccessMessage(null);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback((successMessage?: string) => {
    setIsLoading(false);
    if (successMessage) {
      setToastSuccessMessage(successMessage);
      setTimeout(() => {
        setToastSuccessMessage(null);
      }, 3000);
    }
  }, []);

  const withLoading = useCallback(
    async <T,>(promiseFn: () => Promise<T>, message = "কাজ সম্পন্ন করা হচ্ছে...", successMsg?: string): Promise<T> => {
      startLoading(message);
      try {
        const result = await promiseFn();
        stopLoading(successMsg);
        return result;
      } catch (err) {
        stopLoading();
        throw err;
      }
    },
    [startLoading, stopLoading]
  );

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        startLoading,
        stopLoading,
        withLoading,
      }}
    >
      {/* 1. Global Top Glowing Progress Bar */}
      {progressWidth > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-slate-800/20 overflow-hidden pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 via-purple-500 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-300 ease-out"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      )}

      {/* 2. Global Floating Action Loader Notification Toast */}
      {isLoading && (
        <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto max-w-sm z-[9999] animate-bounce-short">
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-slate-900/95 border border-cyan-500/50 text-white shadow-[0_10px_35px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md flex items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="absolute w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
            </div>
            <div className="text-xs space-y-0.5 min-w-0">
              <div className="font-extrabold bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                <span>প্রসেসিং মোড সক্রিয়</span>
              </div>
              <p className="text-slate-300 font-medium truncate">{loadingMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Success Toast Indicator */}
      {toastSuccessMessage && !isLoading && (
        <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto max-w-sm z-[9999] animate-fade-in">
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-emerald-950/95 border border-emerald-500/60 text-white shadow-[0_10px_35px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs min-w-0">
              <span className="font-bold text-emerald-300 block truncate">সফলভাবে সম্পন্ন হয়েছে</span>
              <p className="text-emerald-100 truncate">{toastSuccessMessage}</p>
            </div>
          </div>
        </div>
      )}

      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
