"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "outline"
  | "info";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-slate-100 text-slate-800 border-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
  primary:
    "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
  success:
    "bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60",
  warning:
    "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
  danger:
    "bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60",
  outline:
    "bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700",
  info:
    "bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] gap-1 rounded-md",
  md: "px-2.5 py-0.5 text-xs gap-1.5 rounded-md",
  lg: "px-3 py-1 text-sm gap-2 rounded-lg",
};

export function Badge({
  className,
  variant = "default",
  size = "md",
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border select-none leading-normal",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
