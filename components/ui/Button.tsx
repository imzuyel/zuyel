"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs border border-emerald-500/30 focus-visible:ring-emerald-500/30 dark:bg-emerald-600 dark:hover:bg-emerald-500",
  secondary:
    "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200/80 focus-visible:ring-slate-400/20 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700",
  outline:
    "bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-300 focus-visible:ring-slate-400/20 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800/80",
  ghost:
    "bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-transparent focus-visible:ring-slate-400/20 dark:text-slate-200 dark:hover:bg-slate-800/60",
  danger:
    "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-rose-500/30 focus-visible:ring-rose-500/30 dark:bg-rose-600 dark:hover:bg-rose-500",
  success:
    "bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs border border-teal-500/30 focus-visible:ring-teal-500/30 dark:bg-teal-600 dark:hover:bg-teal-500",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-xs rounded-md gap-1.5",
  sm: "h-8 px-3 text-xs sm:text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2 min-h-[40px] sm:min-h-[40px]",
  lg: "h-11 px-5 text-base rounded-xl gap-2.5 min-h-[44px]",
  icon: "h-10 w-10 p-0 rounded-lg justify-center min-h-[40px] min-w-[40px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          "relative inline-flex items-center justify-center font-medium font-sans select-none whitespace-nowrap",
          "transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:border-transparent",
          "disabled:opacity-55 disabled:pointer-events-none disabled:shadow-none cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
