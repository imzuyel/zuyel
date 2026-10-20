"use client";

import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      leftIcon,
      rightElement,
      id: customId,
      disabled,
      required,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={cn("w-full flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 select-none flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-rose-500 ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            required={required}
            aria-invalid={hasError ? "true" : undefined}
            className={cn(
              "w-full h-10 min-h-[40px] px-3 py-2 text-sm rounded-lg",
              "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
              "border border-slate-300 dark:border-slate-700/80",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "transition-all duration-150 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 dark:focus:border-emerald-500",
              "disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed",
              leftIcon && "pl-9",
              rightElement && "pr-10",
              hasError &&
                "border-rose-500 focus:border-rose-600 focus:ring-rose-500/20 dark:border-rose-500 text-rose-900 dark:text-rose-100",
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
