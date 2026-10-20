"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollReveal(options?: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const currentElement = elementRef.current;
    if (!currentElement) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        // Unobserve to trigger entrance animation once
        observer.unobserve(currentElement);
      }
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
      ...options
    });

    observer.observe(currentElement);

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [options]);

  return [elementRef, isVisible] as const;
}
