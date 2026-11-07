"use client";

import React from "react";
import Sidebar, { UnifiedSidebarProps } from "@/components/layout/Sidebar";

export interface HierarchicalSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export default function HierarchicalSidebar(props: HierarchicalSidebarProps) {
  return <Sidebar {...props} />;
}

export { Sidebar as InstitutionalErpSidebar };
