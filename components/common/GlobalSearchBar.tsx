"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, ArrowRight, User, Bell, BookOpen, X } from "lucide-react";
import { safeFetchJson } from "@/lib/safeFetch";
import { cn } from "@/lib/utils";

export interface SearchResultItem {
  id: string | number;
  type: "student" | "notice" | "faculty" | "trade" | string;
  title: string;
  subtitle: string;
  link: string;
}

export default function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMac, setIsMac] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect OS for shortcut hint
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    }
  }, []);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search Query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await safeFetchJson<{ results: SearchResultItem[] }>(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );
        if (res.ok && res.data?.results) {
          setResults(res.data.results);
          setSelectedIndex(-1);
        } else if (res.ok && Array.isArray((res as any).results)) {
          setResults((res as any).results);
          setSelectedIndex(-1);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setIsOpen(true);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Navigate dropdown with Keyboard
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        window.location.href = results[selectedIndex].link;
      }
    },
    [results, selectedIndex]
  );

  const getResultIcon = (type: string) => {
    switch (type) {
      case "student":
        return <User className="w-3.5 h-3.5 text-emerald-500" />;
      case "notice":
        return <Bell className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div className="relative w-full max-w-md select-none" ref={searchRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="সার্চ করুন (নাম, রোল, নোটিশ)..."
          className={cn(
            "w-full h-9 pl-9 pr-16 text-xs font-medium rounded-lg",
            "bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100",
            "border border-slate-200/80 dark:border-slate-700/80",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 dark:focus:border-emerald-500",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-150"
          )}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                inputRef.current?.focus();
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-700/60 rounded border border-slate-300/60 dark:border-slate-600/60">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {results.length > 0 ? (
            <div className="max-h-72 overflow-y-auto custom-scrollbar p-1">
              {results.map((r, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <a
                    key={`${r.type}-${r.id}-${i}`}
                    href={r.link}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group",
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
                        {getResultIcon(r.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {r.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {r.subtitle}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </a>
                );
              })}
            </div>
          ) : !loading ? (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
              "{query}" সংক্রান্ত কোনো ফলাফল পাওয়া যায়নি।
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
