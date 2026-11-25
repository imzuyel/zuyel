"use client";

import React from "react";
import { sanitizeHtml } from "@/lib/textSanitizer";

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
  as?: "div" | "span" | "p";
}

export default function SafeHtmlRenderer({
  html,
  className = "",
  as: Component = "div",
}: SafeHtmlRendererProps) {
  const cleanHtml = React.useMemo(() => sanitizeHtml(html), [html]);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
