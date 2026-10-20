"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in [${this.props.name || "Unknown"}]:`, error, errorInfo);

    // If ChunkLoadError occurs, auto-refresh once to fetch fresh bundles
    const isChunkError =
      error?.name === "ChunkLoadError" ||
      error?.message?.toLowerCase().includes("loading chunk") ||
      error?.message?.toLowerCase().includes("chunkloaderror");

    if (isChunkError && typeof window !== "undefined") {
      const reloadKey = "ptsc_chunk_reload_attempt";
      const lastReload = sessionStorage.getItem(reloadKey);
      if (!lastReload) {
        sessionStorage.setItem(reloadKey, Date.now().toString());
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    const isChunkError =
      this.state.error?.name === "ChunkLoadError" ||
      this.state.error?.message?.toLowerCase().includes("loading chunk") ||
      this.state.error?.message?.toLowerCase().includes("chunkloaderror");

    if (isChunkError && typeof window !== "undefined") {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunkError =
        this.state.error?.name === "ChunkLoadError" ||
        this.state.error?.message?.toLowerCase().includes("loading chunk") ||
        this.state.error?.message?.toLowerCase().includes("chunkloaderror");

      return (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-8 h-8 animate-bounce" />
            <span className="text-sm font-black uppercase tracking-wider">
              {isChunkError ? "আপডেট লোডিং বাফার (New Build Loaded)" : "রেন্ডারিং ত্রুটি (Rendering Error)"}
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isChunkError
                ? "অ্যাপ্লিকেশনের নতুন সংস্করণ প্রস্তুত হয়েছে। পেজটি রিফ্রেশ করুন।"
                : `${this.props.name || "কম্পোনেন্টটি"} লোড করতে সাময়িক ত্রুটি হয়েছে।`}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto line-clamp-2 font-mono">
              {this.state.error?.message || "অজানা ত্রুটি (Unknown internal error)"}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isChunkError ? "পেজ রিফ্রেশ করুন" : "পুনরায় রিলোড করুন"}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
