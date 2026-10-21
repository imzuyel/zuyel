import React from "react";
import { Metadata } from "next";
import StudentProfilePortalView from "@/components/student/StudentProfilePortalView";

export const metadata: Metadata = {
  title: "শিক্ষার্থী প্রোফাইল সেলফ-সার্ভিস | পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
  description:
    "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) এর শিক্ষার্থী প্রোফাইল ও ব্যক্তিগত তথ্য ব্যবস্থাপনা পোর্টাল।",
};

export default function StudentProfilePage() {
  return <StudentProfilePortalView />;
}
