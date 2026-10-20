"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] md:max-w-6xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
  closeOnBackdrop = true,
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card (Responsive Drawer on mobile, centered modal on desktop) */}
      <div
        ref={modalRef}
        className={cn(
          "relative z-10 w-full bg-white dark:bg-slate-900",
          "rounded-t-2xl sm:rounded-2xl shadow-xl",
          "border-t sm:border border-slate-200/80 dark:border-slate-800/80",
          "flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden",
          "animate-slideUp sm:animate-scaleIn",
          sizeClasses[size],
          className
        )}
      >
        {/* Mobile Drag Indicator Pill */}
        <div className="flex sm:hidden justify-center pt-2.5 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-5 pb-4 border-b border-slate-100 dark:border-slate-800/70 shrink-0">
            <div className="space-y-1 pr-6">
              {title && (
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
                  "hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                )}
                aria-label="বন্ধ করুন (Close)"
              >
                <X className="w-5 h-5 shrink-0" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="p-4 sm:p-5 pt-3 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
