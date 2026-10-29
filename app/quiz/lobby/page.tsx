"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function LobbyRedirector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams ? searchParams.toString() : "";
    const target = params ? `/quiz/live?${params}` : "/quiz/live";
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-4 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
      <p className="text-sm font-bold text-slate-300 animate-pulse">
        লাইভ কুইজ এরিনায় যুক্ত করা হচ্ছে...
      </p>
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      }
    >
      <LobbyRedirector />
    </Suspense>
  );
}
