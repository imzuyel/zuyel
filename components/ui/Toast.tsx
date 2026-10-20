"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => string;
  removeToast: (id: string) => void;
  showSuccess: (message: string, title?: string) => string;
  showError: (message: string, title?: string) => string;
  showWarning: (message: string, title?: string) => string;
  showInfo: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
};

const borderClasses: Record<ToastVariant, string> = {
  success: "border-teal-200 dark:border-teal-800/60 bg-white dark:bg-slate-900",
  error: "border-rose-200 dark:border-rose-800/60 bg-white dark:bg-slate-900",
  warning: "border-amber-200 dark:border-amber-800/60 bg-white dark:bg-slate-900",
  info: "border-sky-200 dark:border-sky-800/60 bg-white dark:bg-slate-900",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, variant = "info", durationMs = 4500 }: Omit<ToastMessage, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastMessage = { id, title, message, variant, durationMs };

      setToasts((prev) => [...prev, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }

      return id;
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, title?: string) => addToast({ message, title, variant: "success" }),
    [addToast]
  );

  const showError = useCallback(
    (message: string, title?: string) => addToast({ message, title, variant: "error", durationMs: 6000 }),
    [addToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string) => addToast({ message, title, variant: "warning" }),
    [addToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string) => addToast({ message, title, variant: "info" }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border",
              "animate-slideUp transition-all duration-200",
              borderClasses[t.variant || "info"]
            )}
          >
            <div className="pt-0.5">{icons[t.variant || "info"]}</div>
            <div className="flex-1 space-y-0.5 pr-2">
              {t.title && (
                <h5 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {t.title}
                </h5>
              )}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {t.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="মুছে ফেলুন (Dismiss)"
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside ToastProvider
    return {
      toasts: [],
      addToast: () => "",
      removeToast: () => {},
      showSuccess: (msg: string) => { console.info("[Toast Success]:", msg); return ""; },
      showError: (msg: string) => { console.error("[Toast Error]:", msg); return ""; },
      showWarning: (msg: string) => { console.warn("[Toast Warning]:", msg); return ""; },
      showInfo: (msg: string) => { console.info("[Toast Info]:", msg); return ""; },
    };
  }
  return context;
}

export default ToastProvider;
