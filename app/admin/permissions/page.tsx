"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Users,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  CheckSquare,
  Square,
  UserCheck,
  Info,
  Zap,
  Database,
  BookOpen,
  Calculator,
  MessagesSquare,
  Key,
  Eye,
  ChevronDown,
  ChevronRight,
  Shield,
  Star,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  CustomPermissionTag,
  PermissionDefinition,
  Role,
  isSupremeAdmin,
  normalizeRole,
} from "@/lib/rbac";
import {
  GRANULAR_PERMISSIONS_CATALOG,
  ALL_GRANULAR_PERMISSION_KEYS,
  type GranularPermission,
} from "@/lib/rbac-db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManagedUser {
  id: number | string;
  employeeId?: string;
  name: string;
  nameBangla?: string;
  designation?: string;
  department?: string;
  tradeCode?: string;
  role: Role;
  permissions: CustomPermissionTag[];
  granularPermissions: string[];
  isStudent?: boolean;
}

type CategoryId = "all" | "academic" | "examination" | "administrative" | "security";

const CATEGORY_CONFIG: Record<CategoryId, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: "সকল পারমিশন", icon: Shield, color: "slate" },
  academic: { label: "একাডেমিক", icon: BookOpen, color: "blue" },
  examination: { label: "পরীক্ষা ও মূল্যায়ন", icon: Calculator, color: "violet" },
  administrative: { label: "প্রশাসনিক", icon: Settings, color: "amber" },
  security: { label: "নিরাপত্তা ও অডিট", icon: Eye, color: "rose" },
};

const RISK_CONFIG = {
  low: { label: "সাধারণ", cls: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  medium: { label: "মধ্যম", cls: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
  high: { label: "উচ্চ", cls: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" },
  critical: { label: "সংকটজনক", cls: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractGranularPerms(user: ManagedUser | null): string[] {
  if (!user) return [];
  if (Array.isArray(user.granularPermissions) && user.granularPermissions.length > 0) {
    return user.granularPermissions.filter((k) => typeof k === "string");
  }
  return [];
}

function getRoleColor(role: string) {
  switch (role) {
    case "principal":    return "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    case "admin":        return "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "teacher":      return "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    case "accountant":   return "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
    default:             return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  }
}

function getRoleBangla(role: string) {
  const map: Record<string, string> = {
    principal: "অধ্যক্ষ", admin: "অ্যাডমিন", teacher: "শিক্ষক",
    accountant: "হিসাবরক্ষক", staff: "কর্মচারী", vice_principal: "উপাধ্যক্ষ",
  };
  return map[role] || role;
}

// ─── Module grouping for catalog ──────────────────────────────────────────────

function groupByModule(catalog: GranularPermission[]) {
  const groups: Record<string, GranularPermission[]> = {};
  for (const p of catalog) {
    if (!groups[p.module]) groups[p.module] = [];
    groups[p.module].push(p);
  }
  return groups;
}

const MODULE_LABELS: Record<string, string> = {
  quiz: "কুইজ মডিউল",
  routine: "রুটিন মডিউল",
  attendance: "হাজিরা মডিউল",
  ai: "AI মডিউল",
  marks: "পরীক্ষা মডিউল",
  certificate: "সার্টিফিকেট মডিউল",
  student: "শিক্ষার্থী মডিউল",
  faculty: "শিক্ষক মডিউল",
  fee: "ফি মডিউল",
  sms: "SMS মডিউল",
  notice: "নোটিশ মডিউল",
  audit: "অডিট মডিউল",
  permission: "পারমিশন মডিউল",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPermissionsPage() {
  const { currentUser, isStudentZeroTrust, showToast } = useAuth();

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [users, setUsers]           = useState<ManagedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | number | null>(null);
  const [userGranularPerms, setUserGranularPerms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery]       = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryId>("all");
  const [roleFilter, setRoleFilter]         = useState<string>("all");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["quiz", "attendance", "ai"]));
  const [viewMode, setViewMode]     = useState<"grid" | "module">("module");
  const [isDirty, setIsDirty]       = useState(false);

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchPermissionsData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/permissions", {
        headers: {
          "x-user-role": currentUser?.role || "principal",
          "x-user-id": String(currentUser?.id || "1"),
          "x-user-name": currentUser?.name || currentUser?.fullName || "Admin",
        },
      });
      const data = await res.json();

      if (data.success) {
        const fetchedUsers: ManagedUser[] = (data.users || []).map((u: any) => ({
          ...u,
          granularPermissions: u.granularPermissions || [],
        }));
        setUsers(fetchedUsers);

        if (!selectedUserId && fetchedUsers.length > 0) {
          const first = fetchedUsers[0];
          setSelectedUserId(first.id);
          setUserGranularPerms(extractGranularPerms(first));
        }
      } else {
        showToast(data.error || "পারমিশন ডেটা লোড করা যায়নি", "error");
      }
    } catch (err: any) {
      showToast(err.message || "সার্ভার সংযোগ সমস্যা", "error");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchPermissionsData(); }, [fetchPermissionsData]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const isLockedSuperUser = selectedUser
    ? isSupremeAdmin(selectedUser.role) || selectedUser.role === "admin"
    : false;

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(q) ||
        (u.nameBangla && u.nameBangla.includes(q)) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q));
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  const filteredCatalog = useMemo(() => {
    if (categoryFilter === "all") return GRANULAR_PERMISSIONS_CATALOG;
    return GRANULAR_PERMISSIONS_CATALOG.filter((p) => p.category === categoryFilter);
  }, [categoryFilter]);

  const catalogByModule = useMemo(() => groupByModule(filteredCatalog), [filteredCatalog]);

  const grantedCount = userGranularPerms.length;
  const totalCount   = ALL_GRANULAR_PERMISSION_KEYS.length;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectUser = (user: ManagedUser) => {
    if (isDirty && !confirm("সংরক্ষণ না করেই ব্যবহারকারী পরিবর্তন করবেন? পরিবর্তন হারিয়ে যাবে।")) return;
    setSelectedUserId(user.id);
    setUserGranularPerms(extractGranularPerms(user));
    setIsDirty(false);
  };

  const togglePermission = (key: string) => {
    if (!selectedUser) return;
    if (selectedUser.isStudent) {
      showToast("জিরো-ট্রাস্ট: শিক্ষার্থীদের পারমিশন দেওয়া নিষিদ্ধ।", "error");
      return;
    }
    if (isLockedSuperUser) return; // Super-user perms are immutable
    setUserGranularPerms((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setIsDirty(true);
  };

  const handleSelectAll = () => {
    if (!selectedUser || selectedUser.isStudent || isLockedSuperUser) return;
    setUserGranularPerms([...ALL_GRANULAR_PERMISSION_KEYS]);
    setIsDirty(true);
  };

  const handleClearAll = () => {
    if (!selectedUser || selectedUser.isStudent || isLockedSuperUser) return;
    setUserGranularPerms([]);
    setIsDirty(true);
  };

  const handleReset = () => {
    if (!selectedUser) return;
    setUserGranularPerms(extractGranularPerms(selectedUser));
    setIsDirty(false);
    showToast("পরিবর্তন বাতিল করে আগের অবস্থায় ফিরিয়ে আনা হয়েছে।", "info");
  };

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedUserId || !selectedUser) {
      showToast("কোনো ব্যবহারকারী নির্বাচিত হয়নি।", "error");
      return;
    }
    if (selectedUser.isStudent) {
      showToast("জিরো-ট্রাস্ট: শিক্ষার্থীদের পারমিশন দেওয়া সম্ভব নয়।", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "principal",
          "x-user-id": String(currentUser?.id || "1"),
          "x-user-name": currentUser?.name || currentUser?.fullName || "Admin",
        },
        body: JSON.stringify({
          action: "set_granular",
          targetUserId: selectedUserId,
          targetUserName: selectedUser.name,
          targetRole: selectedUser.role,
          granularKeys: userGranularPerms,
          reason: "Admin Permission Update",
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("পারমিশন সফলভাবে সংরক্ষণ করা হয়েছে!", "success");
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUserId ? { ...u, granularPermissions: userGranularPerms } : u
          )
        );
        setIsDirty(false);
      } else {
        showToast(data.error || "পারমিশন সংরক্ষণে সমস্যা হয়েছে।", "error");
      }
    } catch (err: any) {
      showToast(err.message || "সার্ভার সংযোগ সমস্যা।", "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Zero-Trust Student Block ──────────────────────────────────────────────

  if (isStudentZeroTrust || currentUser?.role === "student") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          </div>
          <p className="text-[10px] font-black tracking-widest text-rose-400 uppercase">
            PTSC Zero-Trust Security Engine
          </p>
          <h2 className="text-2xl font-black text-white">৪০৩ — প্রবেশ নিষিদ্ধ</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            শিক্ষার্থী হিসেবে আপনি পারমিশন কন্ট্রোল প্যানেলে প্রবেশ করতে পারবেন না। এটি
            প্রশাসনিক কর্মকর্তাদের জন্য সংরক্ষিত।
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> হোমপেজে ফিরুন
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main Layout ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  পারমিশন ম্যানেজমেন্ট
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                PTSC — গ্রানুলার রোল-ভিত্তিক অ্যাক্সেস কন্ট্রোল (RBAC) ইঞ্জিন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-700 animate-pulse">
                ● সংরক্ষিত হয়নি
              </span>
            )}
            <button
              onClick={handleReset}
              disabled={loading || saving || !isDirty}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> রিসেট
            </button>
            <button
              onClick={handleSave}
              disabled={loading || saving || !selectedUser || isLockedSuperUser || !isDirty}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all disabled:opacity-40"
            >
              {saving ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> সংরক্ষণ হচ্ছে...</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> সংরক্ষণ করুন</>
              )}
            </button>
          </div>
        </div>

        {/* ── Security Policy Banner ── */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center gap-3 text-xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 text-indigo-900 dark:text-indigo-200">
            <strong>জিরো-ট্রাস্ট সুরক্ষা সক্রিয়:</strong>{" "}
            শিক্ষার্থীদের পারমিশন তালিকা সম্পূর্ণ লক। অধ্যক্ষ ও অ্যাডমিনের পারমিশন পরিবর্তনযোগ্য নয়।
            শিক্ষক ও স্টাফদের পারমিশন দায়িত্ব অনুসারে কাস্টমাইজ করুন।
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-200 dark:border-emerald-800">
              ✓ ACTIVE
            </span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800">
              {totalCount} পারমিশন
            </span>
          </div>
        </div>

        {/* ── Main 2-Column Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── LEFT: User Selector ── */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Panel header */}
              <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  ব্যবহারকারী ({filteredUsers.length})
                </h2>
                {selectedUser && (
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${isDirty ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isDirty ? "অসংরক্ষিত" : "সংরক্ষিত"}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="নাম, ID বা বিভাগ খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Role filter pills */}
                <div className="flex gap-1 flex-wrap">
                  {["all", "principal", "admin", "teacher", "accountant", "staff"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        roleFilter === role
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {role === "all" ? "সকল" : getRoleBangla(role)}
                    </button>
                  ))}
                </div>
              </div>

              {/* User list */}
              <div className="max-h-[calc(100vh-380px)] overflow-y-auto px-3 pb-3 space-y-1.5">
                {loading ? (
                  <div className="py-10 text-center space-y-2">
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">লোড হচ্ছে...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-xs text-center py-8 text-slate-400">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = u.id === selectedUserId;
                    const perms = u.granularPermissions || [];
                    const isSuperUser = isSupremeAdmin(u.role) || u.role === "admin";

                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`w-full text-left p-3 rounded-xl border transition-all group ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                              isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}>
                              {(u.nameBangla || u.name).charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {u.nameBangla || u.name}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {u.designation || u.department || "Faculty"}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${getRoleColor(u.role)}`}>
                            {getRoleBangla(u.role)}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-mono">{u.employeeId || `#${u.id}`}</span>
                          <span className={`font-bold ${isSuperUser ? "text-violet-600 dark:text-violet-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                            {isSuperUser ? "★ সর্বময় ক্ষমতা" : `${perms.length}/${totalCount} পারমিশন`}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Permission Matrix ── */}
          <div className="lg:col-span-8 space-y-4">
            {selectedUser ? (
              <>
                {/* Selected User Header */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shadow-sm ${
                        isLockedSuperUser
                          ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                          : "bg-gradient-to-br from-indigo-500 to-blue-600 text-white"
                      }`}>
                        {(selectedUser.nameBangla || selectedUser.name).charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {selectedUser.nameBangla || selectedUser.name}
                          </h3>
                          {isLockedSuperUser && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[10px] font-black">
                              <Lock className="w-2.5 h-2.5" /> সুপার অ্যাক্সেস
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedUser.designation} • <span className="font-mono text-[11px]">{selectedUser.employeeId || `#${selectedUser.id}`}</span>
                        </p>
                      </div>
                    </div>

                    {!isLockedSuperUser && (
                      <div className="flex items-center gap-2">
                        {/* Progress circle */}
                        <div className="text-center">
                          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">
                            {grantedCount}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">/{totalCount}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                        <button
                          onClick={handleSelectAll}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-500" /> সব নির্বাচন
                        </button>
                        <button
                          onClick={handleClearAll}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-300 dark:hover:border-rose-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
                        >
                          <Square className="w-3.5 h-3.5 text-rose-500" /> ক্লিয়ার
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {!isLockedSuperUser && (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">পারমিশন স্তর</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {Math.round((grantedCount / totalCount) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                          style={{ width: `${(grantedCount / totalCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Super-user notice */}
                {isLockedSuperUser && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800/50 flex items-center gap-3">
                    <Star className="w-5 h-5 text-violet-500 shrink-0" />
                    <div className="text-xs text-violet-900 dark:text-violet-200">
                      <strong>{selectedUser.nameBangla || selectedUser.name}</strong>-এর রোল হলো{" "}
                      <strong className="font-mono">{selectedUser.role}</strong>, যা সর্বোচ্চ
                      কর্তৃত্বের অধিকারী। এই অ্যাকাউন্টের পারমিশন সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে
                      সম্পূর্ণ মঞ্জুর থাকে এবং ম্যানুয়ালি পরিবর্তনযোগ্য নয়।
                    </div>
                  </div>
                )}

                {/* Category filter tabs */}
                {!isLockedSuperUser && (
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {(Object.keys(CATEGORY_CONFIG) as CategoryId[]).map((cat) => {
                      const { label, icon: Icon, color } = CATEGORY_CONFIG[cat];
                      const isActive = categoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                            isActive
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Permission catalog by module */}
                {!isLockedSuperUser ? (
                  <div className="space-y-3">
                    {Object.entries(catalogByModule).map(([module, perms]) => {
                      const isExpanded = expandedModules.has(module);
                      const moduleGranted = perms.filter((p) => userGranularPerms.includes(p.key)).length;
                      const moduleTotal = perms.length;
                      const allGranted = moduleGranted === moduleTotal;

                      return (
                        <div
                          key={module}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                        >
                          {/* Module header */}
                          <button
                            onClick={() => toggleModule(module)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <Key className="w-4 h-4 text-indigo-500" />
                              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                {MODULE_LABELS[module] || module}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                ({module})
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                allGranted
                                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                  : moduleGranted > 0
                                  ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              }`}>
                                {moduleGranted}/{moduleTotal}
                              </span>
                              {isExpanded
                                ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                : <ChevronRight className="w-4 h-4 text-slate-400" />
                              }
                            </div>
                          </button>

                          {/* Permission cards */}
                          {isExpanded && (
                            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                              {perms.map((def) => {
                                const isGranted = userGranularPerms.includes(def.key);
                                const { label: riskLabel, cls: riskCls } = RISK_CONFIG[def.riskLevel];

                                return (
                                  <button
                                    key={def.key}
                                    onClick={() => togglePermission(def.key)}
                                    className={`w-full text-left p-3.5 rounded-xl border transition-all group ${
                                      isGranted
                                        ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-600 shadow-sm"
                                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                        {/* Checkbox indicator */}
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                          isGranted
                                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                                            : "border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-400"
                                        }`}>
                                          {isGranted && (
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                                            {def.titleBangla}
                                          </p>
                                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                            {def.descriptionBangla}
                                          </p>
                                        </div>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase whitespace-nowrap shrink-0 ${riskCls}`}>
                                        {riskLabel}
                                      </span>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
                                      <code className="text-[10px] text-slate-400 font-mono">
                                        {def.key}
                                      </code>
                                      <span className={`text-[11px] font-extrabold ${
                                        isGranted ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                                      }`}>
                                        {isGranted ? "✓ অনুমোদিত" : "✗ নিষিদ্ধ"}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Super-user: show all permissions as granted read-only */
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      সকল {ALL_GRANULAR_PERMISSION_KEYS.length} টি পারমিশন স্বয়ংক্রিয়ভাবে মঞ্জুর
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ALL_GRANULAR_PERMISSION_KEYS.map((key) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <code className="text-[10px] text-emerald-800 dark:text-emerald-300 font-mono truncate">{key}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No user selected */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-600 dark:text-slate-400 mb-1">
                  ব্যবহারকারী নির্বাচন করুন
                </h3>
                <p className="text-xs text-slate-400">
                  বাম পাশের তালিকা থেকে একজন শিক্ষক বা কর্মচারী নির্বাচন করে পারমিশন কাস্টমাইজ করুন।
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
