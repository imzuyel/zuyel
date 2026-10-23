import { Role } from "@/lib/rbac";

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  name?: string;
  nameBangla: string;
  role: Role;
  designation: string;
  mobile: string;
  avatarUrl: string;
  trade?: string;
  department?: string;
  roll?: number | string;
  studentId?: string;
  className?: string;
  address?: string;
}

export const PRESET_USERS: Record<string, UserProfile> = {
  super_admin: {
    id: 99,
    email: "superadmin@pgtsc.gov.bd",
    fullName: "System Super Administrator",
    nameBangla: "সুপার অ্যাডমিনিস্ট্রেটর",
    role: "super_admin",
    designation: "সিস্টেম আর্কিটেক্ট ও হেড অফ সিকিউরিটি",
    mobile: "01711-999999",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    department: "আইসিটি ও সিকিউরিটি গভর্ন্যান্স সেল",
  },
  principal: {
    id: 1,
    email: "principal@pgtsc.gov.bd",
    fullName: "Md. Rafiqul Islam",
    nameBangla: "মো. রফিকুল ইসলাম",
    role: "principal",
    designation: "অধ্যক্ষ (ভারপ্রাপ্ত)",
    mobile: "01711-000001",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    department: "প্রশাসন",
  },
  admin: {
    id: 2,
    email: "admin@pgtsc.gov.bd",
    fullName: "Kazi Nurul Huda",
    nameBangla: "কাজী নুরুল হুদা",
    role: "admin",
    designation: "সিস্টেম অ্যাডমিনিস্ট্রেটর ও ডেটা অফিসার",
    mobile: "01711-000002",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    department: "আইসিটি ও ডেটা সেল",
  },
  teacher: {
    id: 3,
    email: "teacher@pgtsc.gov.bd",
    fullName: "Engr. Mahmudul Hasan",
    nameBangla: "প্রকৌ. মাহমুদুল হাসান",
    role: "teacher",
    designation: "চিফ ইন্সট্রাক্টর (আইটি ও আইওটি)",
    mobile: "01711-000003",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    trade: "IT Support and IoT Basics",
    department: "কম্পিউটার ও আইওটি",
  },
  zuyel: {
    id: 37,
    email: "zuyelrana@pgtsc.gov.bd",
    fullName: "Md. Zuyel Rana",
    nameBangla: "মোহাম্মদ জুয়েল রানা",
    role: "teacher",
    designation: "জুনিয়র ইন্সট্রাক্টর (কম্পিউটার)",
    mobile: "01700-000218",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    trade: "IT Support and IoT Basics",
    department: "কম্পিউটার ও আইওটি",
  },
  accountant: {
    id: 6,
    email: "accounts@pgtsc.gov.bd",
    fullName: "Md. Faruq Ahmed",
    nameBangla: "মো. ফারুক আহমেদ",
    role: "accountant",
    designation: "প্রধান হিসাবরক্ষণ কর্মকর্তা",
    mobile: "01711-000006",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    department: "হিসাব ও অডিট শাখা",
  },
  student: {
    id: 4,
    email: "student@pgtsc.gov.bd",
    fullName: "Kazi Tanvir Hasan",
    nameBangla: "কাজী তানভীর হাসান",
    role: "student",
    designation: "শিক্ষার্থী (Class 9 - IT/IoT)",
    mobile: "01711-000004",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    trade: "IT Support and IoT Basics",
    department: "শিক্ষার্থী শাখা",
  },
  guardian: {
    id: 5,
    email: "guardian@pgtsc.gov.bd",
    fullName: "Md. Abdul Kuddus",
    nameBangla: "মো. আব্দুল কুদ্দুস",
    role: "guardian",
    designation: "অভিভাবক (তানভীরের পিতা)",
    mobile: "01711-000005",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
  },
  parent: {
    id: 5,
    email: "guardian@pgtsc.gov.bd",
    fullName: "Md. Abdul Kuddus",
    nameBangla: "মো. আব্দুল কুদ্দুস",
    role: "guardian",
    designation: "অভিভাবক (তানভীরের পিতা)",
    mobile: "01711-000005",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
  },
};
