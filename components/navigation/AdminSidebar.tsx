"use client";

import React from "react";
import Sidebar from "@/components/layout/Sidebar";

export type AdminTab =
  | "dashboard"
  | "global_academic_hub"
  | "universal_print_hub"
  | "course_content_builder"
  | "quiz_admin"
  | "quiz_studio"
  | "ai_quiz_import"
  | "prepare_class"
  | "slide_to_blog"
  | "student_doubts"
  | "weak_topic_analytics"
  | "ai_presentation_studio"
  | "learning_library"
  | "presentations"
  | "written_question_builder"
  | "examinations"
  | "marks_results"
  | "bteb_annual_ledger"
  | "classes_trades"
  | "academic_years"
  | "classes_sections"
  | "trades_management"
  | "subjects"
  | "lab_inventory"
  | "fee_collection"
  | "students"
  | "student_promotion"
  | "id_cards"
  | "bangla_docs"
  | "excel_wizard"
  | "teacher_dashboard"
  | "teacher_profile_settings"
  | "teacher_workload"
  | "attendance"
  | "attendance_report"
  | "routine_master"
  | "notices"
  | "notifications"
  | "sms_studio"
  | "cms_management"
  | "mysql_workbench"
  | "security_governance"
  | "profile";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Unified Sidebar adapter for legacy AdminSidebar callers.
 * Delegates strictly to the single shared Sidebar component + navigationConfig.
 */
export default function AdminSidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  return (
    <Sidebar
      activeTab={activeTab}
      onSelectTab={(tab) => onSelectTab(tab as AdminTab)}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    />
  );
}
