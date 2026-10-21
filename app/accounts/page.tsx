"use client";

import React from "react";
import dynamic from "next/dynamic";
import { TableSkeleton } from "@/components/ui/SkeletonScreens";

const FeeCollectionStudio = dynamic(
  () => import("@/components/accounts/FeeCollectionStudio"),
  {
    loading: () => (
      <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800">
        <TableSkeleton rows={5} cols={5} />
      </div>
    ),
  }
);

export default function AccountsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <FeeCollectionStudio />
      </div>
    </div>
  );
}
