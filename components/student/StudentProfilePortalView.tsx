"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShieldCheck,
  Lock,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Save,
  LogOut,
  Sparkles,
  AlertTriangle,
  Award,
  Flame,
  ArrowRight,
  RefreshCw,
  Camera,
  Layers,
  Heart,
  AlertCircle,
  Home,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import StudentLoginModal from "@/components/auth/StudentLoginModal";
import {
  getActiveStudentAccount,
  logoutStudentAccount,
  updateStudentPassword,
  UNIVERSAL_DEFAULT_PASSWORD,
} from "@/lib/studentIntelligenceStore";

interface StudentData {
  id: number;
  studentId: string;
  admissionNo: string;
  roll: number;
  name: string;
  nameBangla: string;
  gender: string;
  dob: string;
  dobBangla: string;
  bloodGroup: string;
  birthRegNo: string;
  fatherName: string;
  motherName: string;
  guardianMobile: string;
  studentMobile: string;
  email: string;
  presentAddress: string;
  permanentAddress: string;
  photoUrl: string;
  className: string;
  tradeName: string;
  shiftBangla: string;
  section: string;
  session: string;
  status: string;
  attendanceRate: number;
  gpa: string;
  resultStatus: string;
  emergencyContact: string;
  nationality: string;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80",
];

export default function StudentProfilePortalView() {
  const router = useRouter();
  const { logout, showToast, updateCurrentUser } = useAuth();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states (Editable personal fields)
  const [name, setName] = useState("");
  const [nameBangla, setNameBangla] = useState("");
  const [studentMobile, setStudentMobile] = useState("");
  const [guardianMobile, setGuardianMobile] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Password change states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passChanging, setPassChanging] = useState(false);
  const [passMessage, setPassMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);

    if (newPassword === UNIVERSAL_DEFAULT_PASSWORD) {
      setPassMessage({
        text: "নতুন পাসওয়ার্ড ডিফল্ট পাসওয়ার্ড (1234)-এর মতো হতে পারবে না। ভিন্ন পাসওয়ার্ড নির্ধারণ করুন।",
        isError: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMessage({
        text: "উভয় পাসওয়ার্ড হুবহু মেলেনি। অনুগ্রহ করে সতর্কতার সাথে লিখুন।",
        isError: true,
      });
      return;
    }

    if (newPassword.trim().length < 4) {
      setPassMessage({
        text: "পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের বা সংখ্যার হতে হবে।",
        isError: true,
      });
      return;
    }

    setPassChanging(true);
    try {
      const studentRoll = String(student?.roll || "");
      const res = updateStudentPassword(studentRoll, newPassword.trim(), student?.className);

      if (res.success) {
        setPassMessage({ text: res.message, isError: false });
        showToast("আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত ও হালনাগাদ করা হয়েছে।", "success");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPassMessage({ text: res.message, isError: true });
        showToast(res.message, "error");
      }
    } catch (e) {
      setPassMessage({ text: "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।", isError: true });
    } finally {
      setPassChanging(false);
    }
  };

  // Fetch student profile from secure API
  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const activeAcc = getActiveStudentAccount();
      const headers: Record<string, string> = {};
      if (activeAcc?.rollNumber) {
        headers["x-student-roll"] = activeAcc.rollNumber;
      }
      const res = await fetch("/api/student/profile", { headers });
      const data = await res.json();

      if (res.ok && data.success && data.student) {
        setStudent(data.student);
        setName(data.student.name || "");
        setNameBangla(data.student.nameBangla || "");
        setStudentMobile(data.student.studentMobile || "");
        setGuardianMobile(data.student.guardianMobile || "");
        setPresentAddress(data.student.presentAddress || "");
        setPermanentAddress(data.student.permanentAddress || "");
        setBloodGroup(data.student.bloodGroup || "B+");
        setEmergencyContact(data.student.emergencyContact || "");
        setPhotoUrl(data.student.photoUrl || "");
      } else if (res.status === 401) {
        setShowLoginModal(true);
        setErrorMsg("প্রোফাইল ও সেটিংস অ্যাক্সেস করতে অনুগ্রহ করে শিক্ষার্থী একাউন্টে লগইন করুন।");
      } else {
        setErrorMsg(data.error || "প্রোফাইল লোড করতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nameBangla,
          studentMobile,
          guardianMobile,
          presentAddress,
          permanentAddress,
          bloodGroup,
          emergencyContact,
          photoUrl,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || "প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।");
        showToast("প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।", "success");
        if (data.student) {
          setStudent(data.student);
          updateCurrentUser({
            fullName: data.student.name,
            nameBangla: data.student.nameBangla,
            mobile: data.student.studentMobile,
            avatarUrl: data.student.photoUrl,
          });
        }
      } else {
        setErrorMsg(data.error || "সংরক্ষণ ব্যর্থ হয়েছে।");
        showToast(data.error || "সংরক্ষণ ব্যর্থ হয়েছে।", "error");
      }
    } catch (err) {
      setErrorMsg("সার্ভারে ডেটা পাঠাতে ত্রুটি হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    logoutStudentAccount();
    setStudent(null);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans">
      <PublicHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 my-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>হোম</span>
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-900 dark:text-white">শিক্ষার্থী প্রোফাইল ও সেলফ-সার্ভিস</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/learning"
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>লার্নিং ড্যাশবোর্ড</span>
            </Link>
            <Link
              href="/quiz/join"
              className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>লাইভ কুইজ</span>
            </Link>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-center shadow-sm">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              আপনার শিক্ষার্থী প্রোফাইল ও রেকর্ড লোড হচ্ছে...
            </p>
          </div>
        )}

        {!loading && student && (
          <>
            {/* Top Identity Hero Card */}
            <div className="rounded-3xl sm:rounded-[32px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                {/* Avatar with edit overlay */}
                <div className="relative group shrink-0">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl p-1 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 shadow-2xl overflow-hidden">
                    <img
                      src={photoUrl || student.photoUrl}
                      alt={student.nameBangla || student.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-2xl bg-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(true)}
                    className="absolute -bottom-2 right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="প্রোফাইল ছবি পরিবর্তন করুন"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="text-[10px]">পরিবর্তন</span>
                  </button>
                </div>

                {/* Identity Information */}
                <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
                      সরকারি টেকনিক্যাল শিক্ষার্থী পোর্টাল
                    </span>
                    <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold font-mono">
                      EIIN: 132244 • PTSC
                    </span>
                    <span className="px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold font-mono">
                      সেশন: {student.session}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                    {student.nameBangla || student.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 font-medium flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span>
                      ক্লাস রোল: <strong className="text-cyan-300 font-mono font-black">{student.roll}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      স্টুডেন্ট আইডি: <strong className="text-amber-300 font-mono font-black">{student.studentId}</strong>
                    </span>
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-bold text-slate-300">
                    <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
                      {student.className}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
                      ট্রেড: {student.tradeName}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
                      {student.shiftBangla}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
                  <button
                    onClick={handleLogout}
                    className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট করুন</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Alerts */}
            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-3 animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Main Form & Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Editable Personal & Contact Details */}
              <div className="lg:col-span-2 space-y-6">
                <form
                  onSubmit={handleSave}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
                        <span>ব্যক্তিগত ও যোগাযোগ তথ্য সম্পাদনা</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        শিক্ষার্থীরা তাদের নিজস্ব নাম, মোবাইল ও ঠিকানা এখান থেকে আপডেট করতে পারেন।
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 transition"
                    >
                      {saving ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{saving ? "সংরক্ষণ হচ্ছে..." : "তথ্য সংরক্ষণ করুন"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name (Bangla) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        শিক্ষার্থীর নাম (বাংলায়):
                      </label>
                      <input
                        type="text"
                        value={nameBangla}
                        onChange={(e) => setNameBangla(e.target.value)}
                        placeholder="যেমন: কাজী তানভীর হাসান"
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    {/* Name (English) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        শিক্ষার্থীর নাম (ইংরেজি):
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Kazi Tanvir Hasan"
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    {/* Student Mobile */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        শিক্ষার্থীর মোবাইল নম্বর:
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          value={studentMobile}
                          onChange={(e) => setStudentMobile(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Guardian Mobile */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        অভিভাবকের মোবাইল নম্বর:
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          value={guardianMobile}
                          onChange={(e) => setGuardianMobile(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Blood Group */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        রক্তের গ্রুপ (Blood Group):
                      </label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="A+">A Positive (A+)</option>
                        <option value="A-">A Negative (A-)</option>
                        <option value="B+">B Positive (B+)</option>
                        <option value="B-">B Negative (B-)</option>
                        <option value="AB+">AB Positive (AB+)</option>
                        <option value="AB-">AB Negative (AB-)</option>
                        <option value="O+">O Positive (O+)</option>
                        <option value="O-">O Negative (O-)</option>
                      </select>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        জরুরি যোগাযোগের নম্বর:
                      </label>
                      <div className="relative">
                        <Heart className="w-4 h-4 text-rose-400 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Present Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      বর্তমান ঠিকানা (Present Address):
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={presentAddress}
                        onChange={(e) => setPresentAddress(e.target.value)}
                        placeholder="যেমন: পূর্ব জালাসী, পঞ্চগড় সদর, পঞ্চগড়"
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Permanent Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      স্থায়ী ঠিকানা (Permanent Address):
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={permanentAddress}
                        onChange={(e) => setPermanentAddress(e.target.value)}
                        placeholder="যেমন: পূর্ব জালাসী, পঞ্চগড় সদর, পঞ্চগড়"
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Bottom Save Trigger */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 transition"
                    >
                      {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{saving ? "সংরক্ষণ করা হচ্ছে..." : "পরিবর্তনসমূহ সংরক্ষণ করুন"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Read-Only Academic & Institutional Status */}
              <div className="space-y-6">
                
                {/* Academic Status Card (Read-Only) */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                      <span>প্রাতিষ্ঠানিক ও বোর্ড রেকর্ড</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>লকড রেকর্ড</span>
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-slate-500 font-bold">শ্রেণি ও শাখা:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{student.className} (শাখা {student.section})</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-slate-500 font-bold">কারিগরি ট্রেড:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{student.tradeName}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-slate-500 font-bold">শিফট:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{student.shiftBangla}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-slate-500 font-bold">জন্ম তারিখ:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{student.dobBangla || student.dob}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-slate-500 font-bold">পিতার নাম:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{student.fatherName}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-slate-500 font-bold">মাতার নাম:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{student.motherName}</strong>
                    </div>
                  </div>
                </div>

                {/* Performance & Attendance Badges */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>একাডেমিক পারফরম্যান্স মেট্রিক</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-center space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">উপস্থিতি হার</span>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {student.attendanceRate}%
                      </p>
                    </div>

                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 text-center space-y-1">
                      <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase">জিপিএ (GPA)</span>
                      <p className="text-xl font-black text-indigo-600 dark:text-cyan-400 font-mono">
                        {student.gpa}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-bold">ফলাফল মূল্যায়ন:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-[10px]">
                      {student.resultStatus}
                    </span>
                  </div>
                </div>

                {/* Password Security Self-Service Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-cyan-500" />
                      <span>পাসওয়ার্ড পরিবর্তন ও নিরাপত্তা</span>
                    </h3>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
                      Self-Service
                    </span>
                  </div>

                  {passMessage && (
                    <div
                      className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2 ${
                        passMessage.isError
                          ? "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
                          : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {passMessage.isError ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      <span>{passMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        নতুন পাসওয়ার্ড (New Password):
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        পাসওয়ার্ড নিশ্চিতকরণ (Confirm Password):
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      * ডিফল্ট পাসওয়ার্ড (1234) পরিবর্তন করে এখানে যেকোনো সময় ব্যক্তিগত নতুন পাসওয়ার্ড সেট করুন।
                    </p>

                    <button
                      type="submit"
                      disabled={passChanging}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>পাসওয়ার্ড হালনাগাদ করুন</span>
                    </button>
                  </form>
                </div>

                {/* Anti-Tamper Security Policy Banner */}
                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs space-y-1.5 text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>প্রাতিষ্ঠানিক ডেটা সুরক্ষা নীতি</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    বিটিইবি প্রটোকল অনুসারে রোল, ফলাফল বা উপস্থিতি রেকর্ড শিক্ষার্থীরা পরিবর্তন করতে পারবে না। কোনো সংশোধনের প্রয়োজন হলে দায়িত্বপ্রাপ্ত শ্রেণি শিক্ষকের সাথে যোগাযোগ করুন।
                  </p>
                </div>

              </div>

            </div>
          </>
        )}
      </main>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-500/30 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              প্রোফাইল ছবি নির্বাচন করুন
            </h3>

            <div className="grid grid-cols-5 gap-3">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPhotoUrl(url);
                    setShowAvatarModal(false);
                  }}
                  className={`relative rounded-2xl overflow-hidden p-0.5 border-2 transition cursor-pointer ${
                    photoUrl === url ? "border-indigo-500 scale-105" : "border-transparent hover:border-slate-300"
                  }`}
                >
                  <img src={url} alt="Preset" className="w-full h-16 object-cover rounded-xl" />
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                অথবা ছবির সরাসরি ওয়েব লিঙ্ক (URL) দিন:
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streamlined Universal Student Login Modal */}
      <StudentLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccessLogin={() => {
          setShowLoginModal(false);
          fetchProfile();
        }}
      />

      <PublicFooter />
    </div>
  );
}
