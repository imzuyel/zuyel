"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import AdminStaffProfileView from "@/components/admin/AdminStaffProfileView";
import StudentProfilePortalView from "@/components/student/StudentProfilePortalView";

interface UserProfileManagerProps {
  mode?: "page" | "modal";
  onClose?: () => void;
}

/**
 * Universal Profile Management Studio (CRUD)
 * Dispatches to AdminStaffProfileView for Staff/Teachers/Admins,
 * and StudentProfilePortalView for Students.
 */
export default function UserProfileManager({ mode = "page", onClose }: UserProfileManagerProps) {
  const { currentUser } = useAuth();
  const isStudent = currentUser?.role === "student";

  const content = isStudent ? <StudentProfilePortalView /> : <AdminStaffProfileView />;

  if (mode === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-50 dark:bg-slate-950 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-rose-500 hover:text-white transition"
            >
              ✕ বন্ধ করুন
            </button>
          )}
          {content}
        </div>
      </div>
    );
  }

  return content;
}

export { AdminStaffProfileView, StudentProfilePortalView };
