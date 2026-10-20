"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  UserCheck,
  Users,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Eye,
  Sliders,
  FileText,
  Clock,
  Terminal,
  Zap,
} from "lucide-react";
import { useAuth, Role } from "@/context/AuthContext";
import {
  CustomPermissionTag,
  PERMISSION_DEFINITIONS,
  ALL_CUSTOM_PERMISSIONS,
  SecurityAuditLog,
  getUserPermissions,
} from "@/lib/rbac";
import { institutionalDb } from "@/lib/database";

interface FacultyItem {
  id: number | string;
  name: string;
  nameBangla: string;
  employeeId: string;
  designation: string;
  department: string;
  role: Role;
  permissions: CustomPermissionTag[];
  isStudent?: boolean;
}

export default function SecurityGovernanceHub() {
  const {
    currentUser,
    isSuperOrPrincipal,
    customPermissions,
    grantPermission,
    revokePermission,
    setDynamicPermissions,
    auditLogs,
    refreshAuditLogs,
    recordSecurityEvent,
    showToast,
  } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<"matrix" | "audit" | "simulator">("matrix");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [auditFilter, setAuditFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulator state
  const [simulatedRole, setSimulatedRole] = useState<"student" | "teacher" | "principal">("student");
  const [simulatedEndpoint, setSimulatedEndpoint] = useState<
    "/api/ai/questions/generate" | "/api/attendance" | "/api/examination/marks"
  >("/api/ai/questions/generate");
  const [simulatedPermission, setSimulatedPermission] = useState<CustomPermissionTag>("generate_ai_questions");
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Build list of faculty from institutionalDb + preset users
  const [facultyUsers, setFacultyUsers] = useState<FacultyItem[]>([]);

  const loadFacultyData = () => {
    const list: FacultyItem[] = [
      {
        id: 1,
        name: "Md. Rafiqul Islam",
        nameBangla: "মো. রফিকুল ইসলাম",
        employeeId: "EMP-001",
        designation: "অধ্যক্ষ (ভারপ্রাপ্ত)",
        department: "প্রশাসন",
        role: "principal",
        permissions: [...ALL_CUSTOM_PERMISSIONS],
        isStudent: false,
      },
      {
        id: 2,
        name: "Kazi Nurul Huda",
        nameBangla: "কাজী নুরুল হুদা",
        employeeId: "EMP-002",
        designation: "সিস্টেম অ্যাডমিনিস্ট্রেটর ও ডেটা অফিসার",
        department: "আইসিটি ও ডেটা সেল",
        role: "admin",
        permissions: getUserPermissions(2, "admin"),
        isStudent: false,
      },
      {
        id: 3,
        name: "Engr. Mahmudul Hasan",
        nameBangla: "প্রকৌ. মাহমুদুল হাসান",
        employeeId: "EMP-003",
        designation: "চিফ ইন্সট্রাক্টর (আইটি ও আইওটি)",
        department: "কম্পিউটার ও আইওটি",
        role: "teacher",
        permissions: getUserPermissions(3, "teacher"),
        isStudent: false,
      },
      {
        id: 4,
        name: "Kazi Tanvir Hasan",
        nameBangla: "কাজী তানভীর হাসান (শিক্ষার্থী)",
        employeeId: "STU-132244-101",
        designation: "শিক্ষার্থী (Class 9 - IT/IoT)",
        department: "শিক্ষার্থী শাখা",
        role: "student",
        permissions: [],
        isStudent: true, // Immutable Zero-Trust Locked
      },
    ];

    // Merge in other instructors from institutionalDb
    if (institutionalDb.faculty) {
      institutionalDb.faculty.forEach((f) => {
        if (!list.some((u) => u.id === f.id)) {
          const role: Role = f.type === "faculty" ? "teacher" : "staff";
          list.push({
            id: f.id,
            name: f.name,
            nameBangla: f.nameBangla,
            employeeId: f.employeeId,
            designation: f.designation,
            department: f.department,
            role,
            permissions: getUserPermissions(f.id, role),
            isStudent: false,
          });
        }
      });
    }

    setFacultyUsers(list);
  };

  useEffect(() => {
    loadFacultyData();
  }, []);

  const handleTogglePermission = async (
    targetUser: FacultyItem,
    permission: CustomPermissionTag
  ) => {
    if (!isSuperOrPrincipal && currentUser.role !== "admin") {
      showToast("অননুমোদিত: শুধুমাত্র অধ্যক্ষ বা সুপার অ্যাডমিনের অনুমতি পরিবর্তনের অধিকার রয়েছে।", "error");
      return;
    }

    // DIRECTIVE 1 ENFORCEMENT: Zero-Trust for Students
    if (targetUser.isStudent || targetUser.role === "student" || String(targetUser.id) === "4") {
      showToast(
        "জিরো-ট্রাস্ট শিক্ষার্থী নীতি: শিক্ষার্থীদের প্রশাসনিক বা মিউটেশন পারমিশন প্রদান করা সম্পূর্ণ নিষিদ্ধ।",
        "error"
      );
      recordSecurityEvent({
        actionType: "STUDENT_ACCESS_BLOCKED",
        actorRole: currentUser.role,
        actorName: currentUser.nameBangla || currentUser.fullName,
        targetUserId: targetUser.id,
        targetUserName: targetUser.nameBangla,
        targetUserRole: "student",
        permissionTag: permission,
        status: "BLOCKED",
        details: "Attempted to grant administrative permission to a student in Governance Matrix. Intercepted.",
        detailsBangla: "শিক্ষার্থীকে প্রশাসনিক পারমিশন প্রদানের চেষ্টা গভর্ন্যান্স ম্যাট্রিক্সে প্রতিহত করা হয়েছে।",
      });
      return;
    }

    const hasTag = targetUser.permissions.includes(permission);
    if (hasTag) {
      await revokePermission(
        targetUser.id,
        permission,
        targetUser.nameBangla,
        targetUser.role,
        "Admin Governance Toggle"
      );
    } else {
      await grantPermission(
        targetUser.id,
        permission,
        targetUser.nameBangla,
        targetUser.role,
        "Admin Governance Toggle"
      );
    }

    // Refresh local list state
    setFacultyUsers((prev) =>
      prev.map((u) => {
        if (u.id === targetUser.id) {
          const updatedPerms = hasTag
            ? u.permissions.filter((p) => p !== permission)
            : [...u.permissions, permission];
          return { ...u, permissions: updatedPerms };
        }
        return u;
      })
    );
  };

  const handleGrantFullAcademic = async (targetUser: FacultyItem) => {
    if (targetUser.isStudent) {
      showToast("শিক্ষার্থী অ্যাকাউন্টে প্রশাসনিক পারমিশন প্রদান করা নিষিদ্ধ।", "error");
      return;
    }
    const academicTags: CustomPermissionTag[] = [
      "manage_attendance",
      "edit_marks",
      "manage_quizzes",
      "generate_ai_questions",
    ];
    await setDynamicPermissions(
      targetUser.id,
      academicTags,
      targetUser.nameBangla,
      targetUser.role,
      "Full Academic Clearance Delegation"
    );
    setFacultyUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, permissions: academicTags } : u))
    );
  };

  const handleRunSecuritySimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-role": simulatedRole,
        "x-user-id": simulatedRole === "student" ? "4" : simulatedRole === "teacher" ? "3" : "1",
        "x-user-name":
          simulatedRole === "student"
            ? "Kazi Tanvir Hasan (Simulated Student)"
            : simulatedRole === "teacher"
            ? "Engr. Mahmudul Hasan (Simulated Teacher)"
            : "Md. Rafiqul Islam (Simulated Principal)",
      };

      let bodyData: any = {};
      if (simulatedEndpoint === "/api/ai/questions/generate") {
        bodyData = {
          topic: "ওহমের সূত্র ও সার্কিট উপাদান (Security Test)",
          subjectId: 101,
          classId: 9,
          count: 3,
        };
      } else if (simulatedEndpoint === "/api/attendance") {
        bodyData = {
          action: "bulk_action",
          targetStatus: "P",
          classId: 9,
          studentIds: [101, 102],
        };
      } else if (simulatedEndpoint === "/api/examination/marks") {
        bodyData = {
          examId: 1,
          classId: 9,
          subjectCode: "VOK-901",
        };
      }

      const startTime = performance.now();
      const response = await fetch(simulatedEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyData),
      });

      const responseTime = Math.round(performance.now() - startTime);
      const json = await response.json();

      setSimulationResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        timeMs: responseTime,
        data: json,
      });

      refreshAuditLogs();
    } catch (err: any) {
      setSimulationResult({
        status: 500,
        error: err.message,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Filtered faculty list
  const filteredUsers = facultyUsers.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        u.name.toLowerCase().includes(q) ||
        u.nameBangla.includes(q) ||
        u.employeeId.toLowerCase().includes(q) ||
        u.designation.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCategory === "teachers") return u.role === "teacher";
    if (selectedCategory === "admins") return u.role === "admin" || u.role === "principal";
    if (selectedCategory === "students") return u.role === "student";
    return true;
  });

  // Filtered audit logs
  const filteredLogs = auditLogs.filter((log) => {
    if (auditFilter !== "all" && log.status !== auditFilter) return false;
    if (actionFilter !== "all" && log.actionType !== actionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Institutional Top Governance Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-800/40 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · কারিগরি শিক্ষা অধিদপ্তর</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>নিরাপত্তা ও অ্যাক্সেস গভর্ন্যান্স ইঞ্জিন</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold uppercase tracking-wider">
                RBAC v3.5
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজের প্রাতিষ্ঠানিক ডেটা সুরক্ষা, জিরো-ট্রাস্ট শিক্ষার্থী অভিভাবকত্ব, সর্বোচ্চ প্রশাসনিক কর্তৃত্ব এবং শিক্ষক-স্টাফ ডায়নামিক পারমিশন ডেলিগেশন হাব।
            </p>
          </div>

          {/* Quick Institutional Security Badges */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-rose-500/30 text-rose-300 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>জিরো-ট্রাস্ট শিক্ষার্থী সুরক্ষা: সক্রিয়</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>অধ্যক্ষ ও অ্যাডমিন কর্তৃত্ব: সার্বভৌম</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>সুরক্ষিত মডিউল</span>
            <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">১২টি</p>
          <p className="text-[11px] text-slate-500">সম্পূর্ণ প্রশাসনিক ইন্টারসেপশন</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>শিক্ষার্থী অ্যাক্সেস পলিসি</span>
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">১০০% জিরো-ট্রাস্ট</p>
          <p className="text-[11px] text-slate-500">মিউটেশন ও ব্যাকএন্ড সম্পূর্ণ নিষিদ্ধ</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>অনুমোদিত শিক্ষক ও স্টাফ</span>
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {facultyUsers.filter((u) => !u.isStudent).length} জন
          </p>
          <p className="text-[11px] text-slate-500">ডায়নামিক পারমিশন সক্রিয়</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>নিরাপত্তা ও অডিট রেকর্ডস</span>
            <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {auditLogs.length} টি
          </p>
          <p className="text-[11px] text-slate-500">লগ ট্র্যাকিং সক্রিয়</p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab("matrix")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "matrix"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>ডায়নামিক পারমিশন ম্যাট্রিক্স</span>
        </button>

        <button
          onClick={() => setActiveSubTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "audit"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <History className="w-4 h-4" />
          <span>সিকিউরিটি অডিট ও ইন্টারসেপশন লগ ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("simulator")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "simulator"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>সিকিউরিটি পেনিট্রেশন ও টেস্ট সিমুলেটর</span>
        </button>
      </div>

      {/* TAB 1: DYNAMIC PERMISSION DELEGATION MATRIX */}
      {activeSubTab === "matrix" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                অনুমোদন ব্যবস্থাপনা ও পারমিশন ডেলিগেশন
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                অধ্যক্ষ ও অ্যাডমিনগণ যেকোনো শিক্ষক বা স্টাফ সদস্যকে নির্দিষ্ট সংবেদনশীল পারমিশন অনুমোদন বা বাতিল করতে পারেন।
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="শিক্ষক বা আইডি খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              >
                <option value="all">সকল ইউজার</option>
                <option value="teachers">শুধু শিক্ষকবৃন্দ</option>
                <option value="admins">প্রশাসনিক কর্মকর্তা</option>
                <option value="students">শিক্ষার্থী (লকড)</option>
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4 w-72">ইউজার প্রোফাইল ও ভূমিকা</th>
                  <th className="py-3.5 px-4">ডায়নামিক অপারেশনাল পারমিশনসমূহ</th>
                  <th className="py-3.5 px-4 text-right w-44">দ্রুত অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((user) => {
                  const isUserStudent = user.isStudent || user.role === "student";
                  const isSuper = user.role === "principal" || user.role === "super_admin";

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isUserStudent ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
                      }`}
                    >
                      {/* User Info Column */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              isUserStudent
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                                : isSuper
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                            }`}
                          >
                            {isUserStudent ? "ST" : isSuper ? "ADM" : "FAC"}
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {user.nameBangla}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{user.designation}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <span className="font-mono">{user.employeeId}</span>
                              <span>·</span>
                              <span className="capitalize">{user.role}</span>
                            </div>

                            {/* Zero-Trust Notice for Students */}
                            {isUserStudent && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                                <ShieldAlert className="w-3 h-3 shrink-0" />
                                <span>জিরো-ট্রাস্ট: প্রশাসনিক পারমিশন স্থায়ীভাবে নিষিদ্ধ</span>
                              </div>
                            )}

                            {isSuper && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                                <ShieldCheck className="w-3 h-3 shrink-0" />
                                <span>সার্বভৌম কর্তৃত্ব (Super Admin Bypass)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Permissions Tags Column */}
                      <td className="py-4 px-4 align-top">
                        {isUserStudent ? (
                          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-rose-500 space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              <span>শূন্য পারমিশন (Zero Privileges Enforced)</span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              শিক্ষার্থী অ্যাকাউন্টে প্রশাসনিক ডেটা মিউটেশন বা AI প্রশ্ন জেনারেশনের কোনো অনুমতি মঞ্জুর করা সম্ভব নয়।
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {PERMISSION_DEFINITIONS.map((def) => {
                              const hasTag = isSuper || user.permissions.includes(def.tag);

                              return (
                                <button
                                  key={def.tag}
                                  onClick={() => handleTogglePermission(user, def.tag)}
                                  disabled={isSuper}
                                  title={`${def.title}: ${def.descriptionBangla}`}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                    hasTag
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 shadow-2xs"
                                      : "bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800 opacity-60 hover:opacity-100"
                                  } ${isSuper ? "cursor-default" : "cursor-pointer hover:scale-105 active:scale-95"}`}
                                >
                                  {hasTag ? (
                                    <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-slate-400" />
                                  )}
                                  <span>{def.titleBangla}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-4 align-top text-right">
                        {isUserStudent ? (
                          <span className="text-[11px] font-bold text-slate-400">লকড প্রোফাইল</span>
                        ) : isSuper ? (
                          <span className="text-[11px] font-bold text-indigo-500">সর্বোচ্চ কর্তৃত্ব</span>
                        ) : (
                          <div className="space-y-1.5">
                            <button
                              onClick={() => handleGrantFullAcademic(user)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 transition-colors block w-full text-center"
                            >
                              ফুল অ্যাকাডেমিক প্রদান
                            </button>
                            <button
                              onClick={() =>
                                setDynamicPermissions(user.id, [], user.nameBangla, user.role, "Admin Reset")
                              }
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-bold transition-colors block w-full text-center"
                            >
                              রিসেট (সকল বাতিল)
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT & INTERCEPTION LEDGER */}
      {activeSubTab === "audit" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                নিরাপত্তা অডিট ও ৪০৩ ইন্টারসেপশন রেকর্ডস
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সকল প্রশাসনিক প্রিভিলেজ পরিবর্তন, পারমিশন ডেলিগেশন এবং শিক্ষার্থী অনুপ্রবেশ প্রতিহতকরণ লগ।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              >
                <option value="all">সকল স্থিতি (All Status)</option>
                <option value="BLOCKED">আটকানো হয়েছে (BLOCKED)</option>
                <option value="MODIFIED">পরিবর্তিত (MODIFIED)</option>
                <option value="ALLOWED">অনুমোদিত (ALLOWED)</option>
              </select>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              >
                <option value="all">সকল অ্যাকশন টাইপ</option>
                <option value="STUDENT_ACCESS_BLOCKED">শিক্ষার্থী ইন্টারসেপশন</option>
                <option value="CLEARANCE_DENIED">ক্লিয়ারেন্স ডিনাইড</option>
                <option value="PERMISSION_GRANTED">পারমিশন গ্রান্টেড</option>
                <option value="PERMISSION_REVOKED">পারমিশন প্রত্যাহার</option>
                <option value="ROLE_SWITCH">ভূমিকা পরিবর্তন</option>
              </select>

              <button
                onClick={() => {
                  refreshAuditLogs();
                  showToast("অডিট লগ সফলভাবে রিফ্রেশ করা হয়েছে।", "info");
                }}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Audit Records List */}
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <History className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  কোনো অডিট রেকর্ড পাওয়া যায়নি
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isBlocked = log.status === "BLOCKED" || log.status === "INTERCEPTED";
                const isModified = log.status === "MODIFIED";

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border transition-all text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isBlocked
                        ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
                        : isModified
                        ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                        : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                            isBlocked
                              ? "bg-rose-600 text-white"
                              : isModified
                              ? "bg-amber-600 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {log.status}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.detailsBangla}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {log.details}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                        <span>অ্যাক্টর: <strong>{log.actorName}</strong> ({log.actorRole})</span>
                        {log.targetUserName && (
                          <>
                            <span>·</span>
                            <span>টার্গেট: <strong>{log.targetUserName}</strong></span>
                          </>
                        )}
                        {log.permissionTag && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-indigo-500">tag: {log.permissionTag}</span>
                          </>
                        )}
                        {log.routePath && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-rose-500">route: {log.routePath}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString("bn-BD", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                      <div className="text-[10px]">{new Date(log.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY SIMULATOR & TEST SANDBOX */}
      {activeSubTab === "simulator" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>লাইভ সিকিউরিটি পেনিট্রেশন ও পলিসি সিমুলেটর</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              সরাসরি ব্যাকএন্ড এন্ডপয়েন্টগুলোতে রিয়েল-টাইম রিকোয়েস্ট পাঠিয়ে জিরো-ট্রাস্ট শিক্ষার্থী ব্লকিং (৪০৩) এবং শিক্ষক পারমিশন ক্লিয়ারেন্স ভেরিফাই করুন।
            </p>
          </div>

          {/* Test Scenario Configurations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ১. টেস্ট করার ভূমিকা (Simulated Role)
              </label>
              <select
                value={simulatedRole}
                onChange={(e) => setSimulatedRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              >
                <option value="student">STUDENT (জিরো-ট্রাস্ট শিক্ষার্থী)</option>
                <option value="teacher">TEACHER (শিক্ষক - কন্ডিশনাল অ্যাক্সেস)</option>
                <option value="principal">PRINCIPAL (সার্বভৌম অ্যাডমিন)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                {simulatedRole === "student"
                  ? "সতর্কতা: শিক্ষার্থী রোল তাৎক্ষণিক ৪০৩ নিষিদ্ধ হবে।"
                  : simulatedRole === "teacher"
                  ? "শিক্ষকের প্রয়োজনীয় পারমিশন চেক করা হবে।"
                  : "অধ্যক্ষ সর্বদা অনুমোদিত হবেন।"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ২. টার্গেট ব্যাকএন্ড এন্ডপয়েন্ট
              </label>
              <select
                value={simulatedEndpoint}
                onChange={(e) => setSimulatedEndpoint(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
              >
                <option value="/api/ai/questions/generate">POST /api/ai/questions/generate</option>
                <option value="/api/attendance">POST /api/attendance (Bulk Action)</option>
                <option value="/api/examination/marks">POST /api/examination/marks (Entry)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">সুরক্ষিত সংবেদনশীল মিউটেশন রুট।</p>
            </div>

            <div className="flex flex-col justify-end">
              <button
                onClick={handleRunSecuritySimulation}
                disabled={isSimulating}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-60 transition-all cursor-pointer"
              >
                {isSimulating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>রিকোয়েস্ট প্রেরিত হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>সিকিউরিটি টেস্ট চালান</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Simulation Output Card */}
          {simulationResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  সার্ভার রেসপন্স রেজাল্ট (Live Interception Output):
                </span>
                <span
                  className={`text-xs font-mono font-black px-2.5 py-1 rounded-md ${
                    simulationResult.status === 403
                      ? "bg-rose-600 text-white"
                      : simulationResult.status === 200
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-600 text-white"
                  }`}
                >
                  HTTP {simulationResult.status} {simulationResult.statusText || ""} ({simulationResult.timeMs}ms)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 border border-slate-800 font-mono text-xs overflow-x-auto">
                <pre>{JSON.stringify(simulationResult.data || simulationResult, null, 2)}</pre>
              </div>

              {simulationResult.status === 403 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    ভেরিফিকেশন সফল: সিস্টেম সঠিকভাবে অবৈধ রিকোয়েস্টকে ৪০৩ নিষিদ্ধ কোড দিয়ে আটকে দিয়েছে এবং অডিট লগ লিপিবদ্ধ করেছে!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
