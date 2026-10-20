"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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
        <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 my-4">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4 pt-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {isChunkError
                  ? "নতুন সংস্করণ প্রস্তুত হয়েছে (New Version Available)"
                  : `${this.props.name || "কম্পোনেন্টটি"} লোড করতে সাময়িক ত্রুটি হয়েছে`}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto line-clamp-2 font-mono">
                {this.state.error?.message || "অজানা অভ্যন্তরীণ সমস্যা (Unknown render exception)"}
              </p>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              {isChunkError ? "পেজ রিফ্রেশ করুন (Reload)" : "পুনরায় চেষ্টা করুন (Try Again)"}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
