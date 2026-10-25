"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "মুছে ফেলার নিশ্চিতকরণ",
  description = "আপনি কি নিশ্চিতভাবে এই আইটেমটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।",
  itemName,
  confirmButtonText = "মুছে ফেলুন",
  cancelButtonText = "বাতিল",
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, isDeleting, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!isDeleting) onClose();
            }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-900 dark:text-slate-100 space-y-5 overflow-hidden"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
          >
            {/* Top red accent aura */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

            {/* Header row with icon & close button */}
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>

              {!isDeleting && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3
                id="delete-modal-title"
                className="text-lg font-black text-slate-900 dark:text-white tracking-tight"
              >
                {title}
              </h3>
              <p
                id="delete-modal-description"
                className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium"
              >
                {description}
              </p>

              {itemName && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 break-words line-clamp-2">
                  &ldquo;{itemName}&rdquo;
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {cancelButtonText}
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  await onConfirm();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs flex items-center gap-2 shadow-sm hover:shadow-rose-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>মুছে ফেলা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{confirmButtonText}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
