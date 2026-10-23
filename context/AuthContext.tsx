"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  hasPermission as checkPermission,
  Action,
  Role,
  CustomPermissionTag,
  getUserPermissions,
  hasCustomPermission as checkCustomPermission,
  grantCustomPermission,
  revokeCustomPermission,
  setDynamicUserPermissions,
  SecurityAuditLog,
  getSecurityAuditLogs,
  recordSecurityAuditLog,
  isSupremeAdmin,
  isAdministrator,
  isStudent,
  normalizeRole,
} from "@/lib/rbac";
import LoginRequiredModal from "@/components/auth/LoginRequiredModal";

export { type Role } from "@/lib/rbac";
export type UserRole = Role;
export { type UserProfile, PRESET_USERS } from "@/lib/presetUsers";
import { PRESET_USERS, UserProfile } from "@/lib/presetUsers";

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp?: string;
  type: "urgent" | "exam" | "academic" | "system";
  isRead: boolean;
  read?: boolean;
}

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface AuthContextType {
  currentUser: UserProfile;
  user: {
    name: string;
    role: string;
    avatar: string;
  };
  isLoggedIn: boolean;
  login: (role?: Role | string, customUser?: UserProfile) => void;
  logout: () => void;
  switchRole: (role: Role | string) => void;
  activeChildId: number;
  setActiveChildId: (id: number) => void;
  toasts: ToastItem[];
  toastMessage: string | null;
  toastType: "success" | "error" | "info" | "warning";
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  removeToast: (id: string) => void;
  alerts: AlertNotification[];
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;
  markAlertAsRead: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  addAlert: (alert: Omit<AlertNotification, "id" | "isRead">) => void;
  canEditStudents: boolean;
  canEditMarks: boolean;
  canTakeAttendance: boolean;
  canManageFinance: boolean;
  isSuperOrPrincipal: boolean;
  isStudentZeroTrust: boolean;
  hasPermission: (module: string, action: Action) => boolean;
  // Dynamic Custom Permissions
  customPermissions: CustomPermissionTag[];
  hasCustomPermission: (tag: CustomPermissionTag) => boolean;
  grantPermission: (
    targetUserId: string | number,
    tag: CustomPermissionTag,
    targetName?: string,
    targetRole?: Role,
    reason?: string
  ) => Promise<{ success: boolean; message: string }>;
  revokePermission: (
    targetUserId: string | number,
    tag: CustomPermissionTag,
    targetName?: string,
    targetRole?: Role,
    reason?: string
  ) => Promise<{ success: boolean; message: string }>;
  setDynamicPermissions: (
    targetUserId: string | number,
    tags: CustomPermissionTag[],
    targetName?: string,
    targetRole?: Role,
    reason?: string
  ) => Promise<{ success: boolean; message: string }>;
  // Security Audit Trail
  auditLogs: SecurityAuditLog[];
  refreshAuditLogs: () => void;
  recordSecurityEvent: (entry: Omit<SecurityAuditLog, "id" | "timestamp">) => void;
  // Login Modal
  isLoginModalOpen: boolean;
  loginModalReason: string;
  openLoginModal: (reason?: string) => void;
  closeLoginModal: () => void;
  // Live Profile Mutation Sync
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const toastSeqRef = React.useRef(0);
  const alertSeqRef = React.useRef(0);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeRole, setActiveRole] = useState<Role>("student");
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [permissionsVersion, setPermissionsVersion] = useState<number>(0);

  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("pgtsc_is_logged_in");
      const savedRole = localStorage.getItem("pgtsc_user_role") as Role;
      const savedProfile = localStorage.getItem("pgtsc_user_profile");

      if (savedAuth === "true") {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }

      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed && parsed.role) {
            setCurrentUserProfile(parsed);
            setActiveRole(parsed.role);
          }
        } catch {}
      } else if (savedRole && PRESET_USERS[savedRole]) {
        setActiveRole(savedRole);
        setCurrentUserProfile(PRESET_USERS[savedRole]);
      }
      setAuditLogs(getSecurityAuditLogs({ limit: 100 }));
    } catch {}
  }, []);

  const currentUser = currentUserProfile || PRESET_USERS[activeRole] || PRESET_USERS.student;

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    setCurrentUserProfile((prev) => {
      const base = prev || PRESET_USERS[activeRole] || PRESET_USERS.student;
      const merged: UserProfile = {
        ...base,
        ...updates,
      };
      try {
        localStorage.setItem("pgtsc_user_profile", JSON.stringify(merged));
        if (updates.fullName) {
          localStorage.setItem("pgtsc_user_name", updates.fullName);
          document.cookie = `pgtsc_user_name=${encodeURIComponent(updates.fullName)}; path=/; max-age=86400; SameSite=Lax`;
        }
      } catch {}
      return merged;
    });
  };

  const syncIdentityCookies = (role: string, user: UserProfile) => {
    try {
      // Store in cookies for instant Edge middleware extraction
      document.cookie = `pgtsc_user_role=${role}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `pgtsc_user_id=${user.id}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `pgtsc_user_name=${encodeURIComponent(user.fullName)}; path=/; max-age=86400; SameSite=Lax`;
      localStorage.setItem("pgtsc_user_id", String(user.id));
      localStorage.setItem("pgtsc_user_name", user.fullName);
      localStorage.setItem("pgtsc_user_profile", JSON.stringify(user));
    } catch {}
  };

  const login = (roleOrKey?: Role | string, customUser?: UserProfile) => {
    let user: UserProfile;
    if (customUser) {
      user = customUser;
    } else if (roleOrKey && PRESET_USERS[roleOrKey]) {
      user = PRESET_USERS[roleOrKey];
    } else if (roleOrKey && PRESET_USERS[roleOrKey.toLowerCase()]) {
      user = PRESET_USERS[roleOrKey.toLowerCase()];
    } else {
      user = PRESET_USERS[activeRole] || PRESET_USERS.principal;
    }

    const targetRole = user.role;
    setCurrentUserProfile(user);
    setActiveRole(targetRole);
    setIsLoggedIn(true);
    try {
      localStorage.setItem("pgtsc_is_logged_in", "true");
      localStorage.setItem("pgtsc_user_role", targetRole);
      syncIdentityCookies(targetRole, user);
    } catch {}

    // Record login audit
    recordSecurityAuditLog({
      actionType: "ROLE_SWITCH",
      actorRole: targetRole,
      actorName: user.nameBangla || user.fullName,
      status: "ALLOWED",
      details: `User logged in with role: ${targetRole} (${user.fullName})`,
      detailsBangla: `${user.nameBangla || user.fullName} (${user.designation || targetRole}) অ্যাকাউন্টে সফলভাবে লগইন করেছেন।`,
    });
    setAuditLogs(getSecurityAuditLogs({ limit: 100 }));

    showToast(`লগইন সফল হয়েছে! (${user.nameBangla || user.fullName})`, "success");
  };

  const logout = async () => {
    try {
      // Invalidate HTTP-only cookies and server tokens
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Server logout request failed:", e);
    }

    setIsLoggedIn(false);
    setCurrentUserProfile(null);
    setActiveRole("student");
    try {
      localStorage.removeItem("pgtsc_is_logged_in");
      localStorage.removeItem("pgtsc_user_profile");
      localStorage.removeItem("pgtsc_user_id");
      localStorage.removeItem("pgtsc_user_name");
      localStorage.removeItem("ptsc_active_student_session");
      localStorage.setItem("pgtsc_user_role", "student");
      document.cookie = `pgtsc_user_role=student; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `ptsc_user_role=student; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `pgtsc_user_id=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `ptsc_user_id=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `pgtsc_user_name=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `ptsc_user_name=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `ptsc_student_roll=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `pgtsc_student_roll=; path=/; max-age=0; SameSite=Lax`;
    } catch {}
    showToast("সফলভাবে লগআউট করা হয়েছে।", "info");
  };

  const [activeChildId, setActiveChildId] = useState<number>(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([
    {
      id: "alt-1",
      title: "ব্যবহারিক পরীক্ষা শুরু",
      message: "২৫ মার্চ ২০২৬ থেকে কারিগরি অর্ধবার্ষিক ব্যবহারিক মূল্যায়ন শুরু হচ্ছে।",
      time: "১০ মিনিট আগে",
      timestamp: "১০ মিনিট আগে",
      type: "exam",
      isRead: false,
      read: false,
    },
    {
      id: "alt-2",
      title: "জাতীয় বিজ্ঞান মেলা নিবন্ধন",
      message: "কারিগরি উদ্ভাবন মেলা ২০২৬-এ প্রকল্প জমার শেষ তারিখ ১৮ মার্চ।",
      time: "১ ঘণ্টা আগে",
      timestamp: "১ ঘণ্টা আগে",
      type: "academic",
      isRead: false,
      read: false,
    },
    {
      id: "alt-3",
      title: "বৃত্তির নোটিশ প্রকাশিত",
      message: "এসএসসি (ভোক) ও এইচএসসি (ভোক) শিক্ষার্থীদের উপবৃত্তি তালিকা বোর্ড পোর্টালে উন্মুক্ত করা হয়েছে।",
      time: "২ ঘণ্টা আগে",
      timestamp: "২ ঘণ্টা আগে",
      type: "system",
      isRead: true,
      read: true,
    },
  ]);

  const switchRole = (role: Role | string) => {
    const target = PRESET_USERS[role] || PRESET_USERS.principal;
    setActiveRole(target.role);
    try {
      localStorage.setItem("pgtsc_user_role", target.role);
      syncIdentityCookies(target.role, target);
    } catch {}

    // Record role switch in security audit log
    recordSecurityAuditLog({
      actionType: "ROLE_SWITCH",
      actorRole: target.role,
      actorName: target.nameBangla || target.fullName,
      status: "ALLOWED",
      details: `Switched active session role to: ${target.role}`,
      detailsBangla: `সেশন ভূমিকা পরিবর্তন করে '${target.role}' (${target.nameBangla}) করা হয়েছে।`,
    });
    setAuditLogs(getSecurityAuditLogs({ limit: 100 }));
    setPermissionsVersion((v) => v + 1);

    showToast(`ভূমিকা পরিবর্তিত হয়েছে: ${target.nameBangla}`, "info");
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "success"
  ) => {
    toastSeqRef.current += 1;
    const id = `toast_${toastSeqRef.current}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAlertAsRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true, read: true } : a))
    );
  };

  const clearAllNotifications = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true, read: true })));
  };

  const addAlert = (alert: Omit<AlertNotification, "id" | "isRead">) => {
    alertSeqRef.current += 1;
    const newAlert: AlertNotification = {
      ...alert,
      id: `alt_${alertSeqRef.current}`,
      isRead: false,
      read: false,
      timestamp: alert.time || "এখনই",
    };
    setAlerts((prev) => [newAlert, ...prev]);
    showToast(`নতুন নোটিফিকেশন: ${alert.title}`, "info");
  };

  // Dynamic Custom Permissions for current user
  const customPermissions = getUserPermissions(currentUser.id, currentUser.role);

  const hasCustomPermissionTag = (tag: CustomPermissionTag): boolean => {
    return checkCustomPermission(currentUser.id, currentUser.role, tag);
  };

  // Admin dynamic delegation handlers
  const grantPermission = async (
    targetUserId: string | number,
    tag: CustomPermissionTag,
    targetName?: string,
    targetRole?: Role,
    reason?: string
  ) => {
    const actor = {
      id: currentUser.id,
      name: currentUser.nameBangla || currentUser.fullName,
      role: currentUser.role,
      email: currentUser.email,
    };
    const target = {
      id: targetUserId,
      name: targetName || `User #${targetUserId}`,
      role: targetRole || "teacher",
    };

    const res = grantCustomPermission(actor, target, tag, reason);
    setPermissionsVersion((v) => v + 1);
    setAuditLogs(getSecurityAuditLogs({ limit: 100 }));
    if (res.success) {
      showToast(res.message, "success");
    } else {
      showToast(res.message, "error");
    }
    return res;
  };

  const revokePermission = async (
    targetUserId: string | number,
    tag: CustomPermissionTag,
    targetName?: string,
    targetRole?: Role,
    reason?: string
  ) => {
    const actor = {
      id: currentUser.id,
      name: currentUser.nameBangla || currentUser.fullName,
      role: currentUser.role,
      email: currentUser.email,
    };
    const target = {
      id: targetUserId,
      name: targetName || `User #${targetUserId}`,
      role: targetRole || "teacher",
    };

    const res = revokeCustomPermission(actor, target, tag, reason);
    setPermissionsVersion((v) => v + 1);
    setAuditLogs(getSecurityAuditLogs({ limit: 100 }));
    if (res.success) {
      showToast(res.message, "warning");
    } else {
      showToast(res.message, "error");
    }
    return res;
  };

  const setDynamicPermissions = async (
    targetUserId: string | number,
    tags: CustomPermissionTag[],
    targetName?: string,
    targetRole?: Role,
    reason?: string
  ) => {
    const actor = {
      id: currentUser.id,
      name: currentUser.nameBangla || currentUser.fullName,
      role: currentUser.role,
      email: currentUser.email,
    };
    const target = {
      id: targetUserId,
      name: targetName || `User #${targetUserId}`,
      role: targetRole || "teacher",
    };

    const res = setDynamicUserPermissions(actor, target, tags, reason);
    setPermissionsVersion((v) => v + 1);
    setAuditLogs(getSecurityAuditLogs({ limit: 100 }));
    if (res.success) {
      showToast(res.message, "success");
    } else {
      showToast(res.message, "error");
    }
    return res;
  };

  const refreshAuditLogs = () => {
    setAuditLogs(getSecurityAuditLogs({ limit: 100 }));
  };

  const recordSecurityEvent = (entry: Omit<SecurityAuditLog, "id" | "timestamp">) => {
    recordSecurityAuditLog(entry);
    setAuditLogs(getSecurityAuditLogs({ limit: 100 }));
  };

  const canEditStudents =
    ["super_admin", "principal", "admin"].includes(currentUser.role) ||
    hasCustomPermissionTag("manage_students");

  const canEditMarks =
    ["super_admin", "principal", "admin"].includes(currentUser.role) ||
    hasCustomPermissionTag("edit_marks");

  const canTakeAttendance =
    ["super_admin", "principal", "admin"].includes(currentUser.role) ||
    hasCustomPermissionTag("manage_attendance");

  const canManageFinance =
    ["super_admin", "principal", "admin", "accountant"].includes(currentUser.role) ||
    hasCustomPermissionTag("manage_fees");

  const isSuperOrPrincipal = isSupremeAdmin(currentUser.role);
  const isStudentZeroTrust = isStudent(currentUser.role);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalReason, setLoginModalReason] = useState(
    "লাইক, কমেন্ট বা রিঅ্যাকশন দিতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।"
  );

  const openLoginModal = (reason?: string) => {
    if (reason) setLoginModalReason(reason);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleLoginSuccess = (role: Role) => {
    login(role);
    setIsLoginModalOpen(false);
  };

  const notifications = alerts.map((a) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    timestamp: a.timestamp || a.time,
    read: a.read ?? a.isRead,
  }));

  const latestToast = toasts[toasts.length - 1];

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: {
          name: currentUser.nameBangla || currentUser.fullName,
          role: currentUser.designation,
          avatar: currentUser.avatarUrl,
        },
        isLoggedIn,
        login,
        logout,
        switchRole,
        activeChildId,
        setActiveChildId,
        toasts,
        toastMessage: latestToast ? latestToast.message : null,
        toastType: latestToast ? latestToast.type : "info",
        showToast,
        removeToast,
        alerts,
        notifications,
        markAlertAsRead,
        markNotificationRead: markAlertAsRead,
        clearAllNotifications,
        addAlert,
        canEditStudents,
        canEditMarks,
        canTakeAttendance,
        canManageFinance,
        isSuperOrPrincipal,
        isStudentZeroTrust,
        hasPermission: (module: string, action: Action) =>
          checkPermission(activeRole, module, action),
        customPermissions,
        hasCustomPermission: hasCustomPermissionTag,
        grantPermission,
        revokePermission,
        setDynamicPermissions,
        auditLogs,
        refreshAuditLogs,
        recordSecurityEvent,
        isLoginModalOpen,
        loginModalReason,
        openLoginModal,
        closeLoginModal,
        updateCurrentUser,
      }}
    >
      {children}
      <LoginRequiredModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onLoginSuccess={handleLoginSuccess}
        reason={loginModalReason}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
