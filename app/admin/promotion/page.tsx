"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import AdminSidebar, { AdminTab } from "@/components/navigation/AdminSidebar";
import StudentPromotionView from "@/components/students/StudentPromotionView";

export default function AdminPromotionPage() {
  const router = useRouter();

  // Seamlessly synchronize to main unified admin shell with active tab
  useEffect(() => {
    router.replace("/admin?tab=student_promotion");
  }, [router]);

  return (
    <div className="flex h-screen max-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <AdminSidebar
        activeTab="student_promotion"
        onSelectTab={(tab: AdminTab) => router.push(`/admin?tab=${tab}`)}
        mobileOpen={false}
        onCloseMobile={() => {}}
      />
      <div className="flex-1 min-h-0 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onToggleSidebar={() => {}} />
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
          <StudentPromotionView />
        </div>
      </div>
    </div>
  );
}
