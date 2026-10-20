"use client";

import React from "react";
import FeeCollectionStudio from "@/components/accounts/FeeCollectionStudio";

export default function AccountsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <FeeCollectionStudio />
      </div>
    </div>
  );
}
