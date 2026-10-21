"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import AdminSidebar, { AdminTab } from "@/components/navigation/AdminSidebar";
import AdminStaffProfileView from "@/components/admin/AdminStaffProfileView";

export default function AdminProfilePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Seamlessly synchronize to main unified admin shell with persistent sidebar
  useEffect(() => {
    router.replace("/admin?tab=profile");
  }, [router]);

  const handleSelectTab = (tab: AdminTab) => {
    router.push(`/admin?tab=${tab}`);
  };

  return (
    <div className="flex h-screen max-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Desktop Persistent Admin Sidebar */}
      <AdminSidebar
        activeTab="profile"
        onSelectTab={handleSelectTab}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={(target) => {
            if (target === "profile") {
              handleSelectTab("profile");
            } else {
              handleSelectTab(target as AdminTab);
            }
          }}
        />

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          <div className="max-w-7xl mx-auto space-y-6">
            <AdminStaffProfileView />
          </div>
        </div>
      </div>
    </div>
  );
}
