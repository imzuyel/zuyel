"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl bg-white dark:bg-slate-900",
          "border border-slate-200/80 dark:border-slate-800/80",
          "shadow-xs text-slate-900 dark:text-slate-100",
          hoverEffect &&
            "transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-5 pb-3", className)}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        "font-semibold text-lg leading-tight tracking-tight text-slate-900 dark:text-slate-100",
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-xs sm:text-sm text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />;
});
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-5 pt-3 border-t border-slate-100 dark:border-slate-800/60",
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

export default Card;
