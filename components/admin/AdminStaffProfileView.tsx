"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
  RefreshCw,
  LogOut,
  Sparkles,
  Camera,
  Upload,
  Eye,
  EyeOff,
  MapPin,
  Check,
  Image as ImageIcon,
  CheckCheck,
} from "lucide-react";
import { useAuth, UserProfile } from "@/context/AuthContext";
import { CustomPermissionTag } from "@/lib/rbac";
import { toast } from "sonner";

interface StaffData {
  id: number | string;
  fullName: string;
  nameBangla: string;
  email: string;
  mobile: string;
  role: string;
  designation: string;
  department: string;
  avatarUrl: string;
  address?: string;
  trade?: string;
  permissions: CustomPermissionTag[];
  isSupremeAdmin: boolean;
  isAdministrator: boolean;
}

const PRESET_AVATARS = [
  {
    label: "অফিসিয়াল পোট্রেট ১",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80",
  },
  {
    label: "অফিসিয়াল পোট্রেট ২",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80",
  },
  {
    label: "প্রফেশনাল এক্সিকিউটিভ",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80",
  },
  {
    label: "সিস্টেম আর্কিটেক্ট",
    url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80",
  },
  {
    label: "একাডেমিক ইন্সট্রাক্টর ১",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80",
  },
  {
    label: "একাডেমিক ইন্সট্রাক্টর ২",
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80",
  },
  {
    label: "কারিগরি স্পেশালিস্ট",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80",
  },
  {
    label: "আইসিটি কো-অর্ডিনেটর",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80",
  },
];

const PERMISSION_DESCRIPTIONS: Record<string, { label: string; desc: string }> = {
  manage_students: { label: "শিক্ষার্থী পরিচালনা", desc: "শিক্ষার্থী ভর্তি, প্রোফাইল সম্পাদন ও বার্ষিক রোলওভার" },
  edit_marks: { label: "নম্বর এন্ট্রি ও মূল্যায়ন", desc: "ক্লাস টেস্ট, ব্যবহারিক ও টার্ম পরীক্ষার নম্বর সংরক্ষণ" },
  manage_attendance: { label: "ডিজিটাল হাজিরা", desc: "দৈনিক ও মাসিক হাজিরা খাতা এবং QR স্ক্যান নিয়ন্ত্রণ" },
  manage_quizzes: { label: "লাইভ কুইজ ও প্রশ্নব্যাংক", desc: "কুইজ সেশন তৈরি, প্রশ্ন অনুমোদন ও লাইভ হোস্টিং" },
  manage_fees: { label: "হিসাব ও ফি সংগ্রহ", desc: "শিক্ষার্থী ফি সংগ্রহ, রসিদ প্রদান ও অ্যাকাউন্টস লেজার" },
  manage_routines: { label: "মাস্টার রুটিন ও সাবস্টিটিউট", desc: "সাপ্তাহিক ক্লাস রুটিন তৈরি ও শিক্ষক প্রতিস্থাপন" },
  manage_faculty: { label: "ফ্যাকাল্টি প্রশাসন", desc: "শিক্ষক ও কর্মকর্তা তালিকা এবং দায়িত্ব বণ্টন" },
  send_sms: { label: "অভিভাবক এসএমএস গেটওয়ে", desc: "জরুরি নোটিশ ও হাজিরা অ্যালার্ট এসএমএস প্রেরণ" },
  view_audit_logs: { label: "সিকিউরিটি অডিট ট্রেইল", desc: "সিস্টেম ও নিরাপত্তা অডিট লগ পর্যবেক্ষণ" },
  issue_certificates: { label: "ডিজিটাল সনদপত্র ইস্যু", desc: "প্রত্যয়নপত্র, প্রশংসাপত্র ও চারিত্রিক সনদ ইস্যু" },
  generate_ai_questions: { label: "এআই প্রশ্ন জেনারেটর", desc: "সিলেবাস ও পিডিএফ থেকে স্বয়ংক্রিয় প্রশ্ন তৈরি" },
};

export default function AdminStaffProfileView() {
  const router = useRouter();
  const { logout, showToast, updateCurrentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [staff, setStaff] = useState<StaffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "avatar" | "password" | "permissions">("profile");

  // Form states: Personal Info
  const [fullName, setFullName] = useState("");
  const [nameBangla, setNameBangla] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [address, setAddress] = useState("");

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState("");
  const [customAvatarInput, setCustomAvatarInput] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStaffProfile = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/profile");
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setStaff(data.user);
        setFullName(data.user.fullName || "");
        setNameBangla(data.user.nameBangla || "");
        setEmail(data.user.email || "");
        setMobile(data.user.mobile || "");
        setDesignation(data.user.designation || "");
        setDepartment(data.user.department || "");
        setAvatarUrl(data.user.avatarUrl || "");
        setCustomAvatarInput(data.user.avatarUrl || "");
        setAddress(data.user.address || "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ ক্যাম্পাস, পঞ্চগড়");
      } else if (res.status === 401) {
        router.push("/login?role=admin&callbackUrl=/admin?tab=profile");
      } else {
        setErrorMsg(data.error || "প্রোফাইল লোড করা যায়নি।");
      }
    } catch {
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffProfile();
  }, []);

  // 1. Personal Information Save
  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          nameBangla,
          email,
          mobile,
          designation,
          department,
          address,
          avatarUrl,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const msg = data.message || "প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।";
        setSuccessMsg(msg);
        showToast(msg, "success");
        toast.success(msg);

        // Instant UI reflection across header and sidebar
        if (typeof updateCurrentUser === "function") {
          updateCurrentUser({
            fullName: data.user?.fullName || fullName,
            nameBangla: data.user?.nameBangla || nameBangla,
            mobile: data.user?.mobile || mobile,
            email: data.user?.email || email,
            designation: data.user?.designation || designation,
            department: data.user?.department || department,
            avatarUrl: data.user?.avatarUrl || avatarUrl,
            address: data.user?.address || address,
          });
        }

        if (data.user) {
          setStaff((prev) => (prev ? { ...prev, ...data.user } : null));
        }
      } else {
        const err = data.error || "সংরক্ষণ ব্যর্থ হয়েছে।";
        setErrorMsg(err);
        showToast(err, "error");
        toast.error(err);
      }
    } catch {
      const err = "সার্ভারে অনুরোধ প্রেরণে সমস্যা হয়েছে।";
      setErrorMsg(err);
      toast.error(err);
    } finally {
      setSavingInfo(false);
    }
  };

  // 2. Avatar Selection & Upload
  const handleSelectPresetAvatar = (url: string) => {
    setAvatarUrl(url);
    setCustomAvatarInput(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("শুধুমাত্র ইমেজ ফাইল (JPG, PNG, WebP) নির্বাচন করুন।");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("ছবির আকার ২ মেগাবাইটের কম হতে হবে।");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        setCustomAvatarInput(result);
        toast.info("নতুন ছবি প্রিভিউ করা হয়েছে। 'অ্যাভাটার সংরক্ষণ করুন' বাটনে ক্লিক করুন।");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarUrl.trim()) {
      toast.error("অনুগ্রহ করে একটি ছবি নির্বাচন বা URL প্রদান করুন।");
      return;
    }
    setSavingInfo(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const msg = "প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে।";
        setSuccessMsg(msg);
        showToast(msg, "success");
        toast.success(msg);

        if (typeof updateCurrentUser === "function") {
          updateCurrentUser({ avatarUrl });
        }
        setStaff((prev) => (prev ? { ...prev, avatarUrl } : null));
      } else {
        const err = data.error || "ছবি সংরক্ষণ ব্যর্থ হয়েছে।";
        setErrorMsg(err);
        toast.error(err);
      }
    } catch {
      toast.error("সার্ভারে অনুরোধ প্রেরণে ব্যর্থ হয়েছে।");
    } finally {
      setSavingInfo(false);
    }
  };

  // 3. Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      const err = "নতুন পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।";
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    if (newPassword !== confirmPassword) {
      const err = "নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি!";
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const msg = "অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তিত ও সুরক্ষিত হয়েছে।";
        setSuccessMsg(msg);
        showToast(msg, "success");
        toast.success(msg);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const err = data.error || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।";
        setErrorMsg(err);
        toast.error(err);
      }
    } catch {
      toast.error("সার্ভারের সাথে সংযোগ ব্যাহত হয়েছে।");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login?role=admin");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans animate-fade-in pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link href="/admin" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition">
              অ্যাডমিন ড্যাশবোর্ড
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">প্রোফাইল ও নিরাপত্তা স্টুডিও</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white pt-1 flex items-center gap-2.5">
            <span>অফিসিয়াল স্টাফ প্রোফাইল ও সিকিউরিটি স্টুডিও</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
              CRUD Active
            </span>
          </h1>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>লগআউট করুন</span>
        </button>
      </div>

      {loading && (
        <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-center shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            প্রশাসনিক প্রোফাইল ও নিরাপত্তা ক্রেডেনশিয়াল লোড হচ্ছে...
          </p>
        </div>
      )}

      {!loading && staff && (
        <>
          {/* Identity Hero Card */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              {/* Avatar with Camera Trigger */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 shadow-xl overflow-hidden">
                  <img
                    src={avatarUrl || staff.avatarUrl}
                    alt={staff.nameBangla || staff.fullName}
                    className="w-full h-full object-cover rounded-2xl bg-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("avatar")}
                  className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg border-2 border-slate-900 cursor-pointer transition transform group-hover:scale-110"
                  title="ছবি পরিবর্তন করুন"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Staff Details */}
              <div className="space-y-1.5 text-center md:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider">
                    প্রাতিষ্ঠানিক কর্মকর্তা
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold font-mono uppercase">
                    রোল: {staff.role}
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold">
                    সক্রিয় সেশন
                  </span>
                </div>

                <h2 className="text-2xl font-black text-white truncate">
                  {staff.nameBangla || staff.fullName}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  {staff.designation} • {staff.department}
                </p>

                <p className="text-xs text-slate-400 font-mono flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                  <span>ইমেইল: {staff.email}</span>
                  <span>•</span>
                  <span>মোবাইল: {staff.mobile}</span>
                </p>

                {address && (
                  <p className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-1 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{address}</span>
                  </p>
                )}
              </div>

              {/* Security Level Card */}
              <div className="shrink-0 p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 text-center space-y-1 min-w-[150px]">
                <span className="text-[10px] text-slate-400 uppercase font-black">নিরাপত্তা স্তর</span>
                <p className="text-lg font-black text-cyan-400 font-mono">
                  {staff.isSupremeAdmin ? "Level 100" : staff.isAdministrator ? "Level 80" : "Level 50"}
                </p>
                <span className="text-[10px] text-emerald-400 font-bold block">
                  {staff.isSupremeAdmin ? "সর্বোচ্চ ক্ষমতা" : staff.isAdministrator ? "সিস্টেম অ্যাডমিন" : "একাডেমিক শিক্ষক"}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Banners */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-3 animate-fade-in shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Navigation Tabs Bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "profile"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400"
              }`}
            >
              <User className="w-4 h-4" />
              <span>ব্যক্তিগত ও যোগাযোগ তথ্য</span>
            </button>

            <button
              onClick={() => setActiveTab("avatar")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "avatar"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>ছবি ও অ্যাভাটার স্টুডিও</span>
            </button>

            <button
              onClick={() => setActiveTab("password")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "password"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>পাসওয়ার্ড পরিবর্তন</span>
            </button>

            <button
              onClick={() => setActiveTab("permissions")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "permissions"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-400"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>নির্ধারিত পারমিশন ({staff.permissions.length})</span>
            </button>
          </div>

          {/* TAB 1: Personal Information Editing */}
          {activeTab === "profile" && (
            <form onSubmit={handleSavePersonalInfo} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    ব্যক্তিগত ও প্রাতিষ্ঠানিক তথ্য হালনাগাদ
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    নাম, ইমেইল, মোবাইল ও ঠিকানা সংশোধন করে সংরক্ষণ করুন।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingInfo}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 transition"
                >
                  {savingInfo ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{savingInfo ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bangla Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    পূর্ণ নাম (বাংলায়):
                  </label>
                  <input
                    type="text"
                    value={nameBangla}
                    onChange={(e) => setNameBangla(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* English Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    পূর্ণ নাম (ইংরেজিতে):
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    প্রাতিষ্ঠানিক ইমেইল:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    মোবাইল নম্বর:
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Designation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    পদবি (Designation):
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    বিভাগ বা সেল (Department):
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  বর্তমান / প্রাতিষ্ঠানিক ঠিকানা (Address):
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ ক্যাম্পাস, পঞ্চগড়"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Role Protection Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-3 text-amber-900 dark:text-amber-200">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-bold">নিরাপত্তা ও ভূমিকা অপরিবর্তনশীলতা নীতি:</strong>
                  <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                    সরকারি ও প্রাতিষ্ঠানিক জিরো-ট্রাস্ট প্রটোকল অনুসারে কর্মকর্তা বা শিক্ষক নিজের অ্যাকাউন্ট থেকে ভূমিকা (Role) বা অ্যাডমিন লেভেল পরিবর্তন করতে পারবেন না।
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingInfo ? "সংরক্ষণ করা হচ্ছে..." : "পরিবর্তনসমূহ সংরক্ষণ করুন"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Photo & Avatar Studio */}
          {activeTab === "avatar" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    প্রোফাইল ছবি ও অ্যাভাটার স্টুডিও
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    প্রফেশনাল প্রিসেট থেকে নির্বাচন করুন অথবা নিজের ছবি আপলোড করুন।
                  </p>
                </div>

                <button
                  onClick={handleSaveAvatar}
                  disabled={savingInfo}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 transition"
                >
                  {savingInfo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>অ্যাভাটার সংরক্ষণ করুন</span>
                </button>
              </div>

              {/* Current Active Preview */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-indigo-500 to-cyan-400 shadow-lg">
                    <img
                      src={avatarUrl || staff.avatarUrl}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover rounded-xl bg-slate-800"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white">
                    <CheckCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    বর্তমান সক্রিয় প্রিভিউ
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    সংরক্ষণ করার সাথে সাথেই উপরের হেডার ও সাইডবারে এই ছবি তাৎক্ষণিকভাবে প্রতিফলিত হবে।
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>ডিভাইস থেকে ছবি আপলোড করুন</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Presets Gallery */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  অফিসিয়াল প্রফেশনাল প্রিসেট গ্যালারি (ক্লিক করে নির্বাচন করুন):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESET_AVATARS.map((preset, idx) => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handleSelectPresetAvatar(preset.url)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative group flex items-center gap-3 ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/30"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 bg-slate-800"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                            {preset.label}
                          </p>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            HD Portrait
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL Input */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  সরাসরি ইমেজ লিংক (Direct Image URL):
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="url"
                      value={customAvatarInput}
                      onChange={(e) => {
                        setCustomAvatarInput(e.target.value);
                        setAvatarUrl(e.target.value);
                      }}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (customAvatarInput) {
                        setAvatarUrl(customAvatarInput);
                        toast.success("প্রিভিউ আপডেট করা হয়েছে");
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    প্রিভিউ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Secure Password Change */}
          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
                    <span>অ্যাকাউন্টের নিরাপত্তা ও পাসওয়ার্ড পরিবর্তন</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    আপনার প্রশাসনিক বা শিক্ষক অ্যাকাউন্টের জন্য নতুন ও শক্তিশালী পাসওয়ার্ড সেট করুন।
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-w-xl">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    বর্তমান বা পুরাতন পাসওয়ার্ড:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                      className="w-full pl-9 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    নতুন পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর):
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ড প্রবেশ করান"
                      className="w-full pl-9 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="flex items-center gap-2 text-[11px] pt-1">
                      <span className={`font-bold ${newPassword.length >= 6 ? "text-emerald-500" : "text-amber-500"}`}>
                        {newPassword.length >= 6 ? "✓ দৈর্ঘ্য সন্তোষজনক" : "✕ কমপক্ষে ৬ অক্ষর প্রয়োজন"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    নতুন পাসওয়ার্ড নিশ্চিতকরণ:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  {confirmPassword && (
                    <div className="text-[11px] pt-1">
                      {newPassword === confirmPassword ? (
                        <span className="text-emerald-500 font-bold">✓ পাসওয়ার্ড দুটি হুবহু মিলেছে</span>
                      ) : (
                        <span className="text-rose-500 font-bold">✕ পাসওয়ার্ড মেলেনি</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Password Policy Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <span className="font-black text-slate-900 dark:text-white block">
                  নিরাপত্তা নির্দেশিকা:
                </span>
                <p className="leading-relaxed">
                  পাসওয়ার্ড পরিবর্তন করার পর প্রাতিষ্ঠানিক অডিট ট্রেইলে স্বয়ংক্রিয়ভাবে একটি নিরাপত্তা লগ সংরক্ষিত হবে। পাসওয়ার্ড নিয়মিত পরিবর্তন প্রাতিষ্ঠানিক ডেটার নিরাপত্তা জোরদার করে।
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 transition"
                >
                  {savingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{savingPassword ? "আপডেট হচ্ছে..." : "পাসওয়ার্ড আপডেট ও সংরক্ষণ করুন"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Assigned Permissions Matrix */}
          {activeTab === "permissions" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>আপনার অ্যাকাউন্টে সক্রিয় অনুমোদিত পারমিশনসমূহ</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  নিচের মডিউলগুলোতে আপনার ব্যবহারের অধিকার সরকারি RBAC নীতি অনুযায়ী সক্রিয় রয়েছে।
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff.permissions.map((tag) => {
                  const meta = PERMISSION_DESCRIPTIONS[tag] || {
                    label: tag,
                    desc: "প্রাতিষ্ঠানিক কার্যকরী অধিকার",
                  };
                  return (
                    <div
                      key={tag}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3"
                    >
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-xs text-slate-900 dark:text-white">
                            {meta.label}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                            {tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {meta.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {staff.isSupremeAdmin && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span>
                    সুপার অ্যাডমিনিস্ট্রেটর হিসেবে আপনার অ্যাকাউন্টে সিস্টেমের সকল মডিউলের আনরেস্ট্রিক্টেড এক্সেস সক্রিয় রয়েছে।
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
