/**
 * Complete PTSC 2026 Master Routine Seed Data & Time Configuration
 * Panchagarh Government Technical School and College
 */

export interface MasterRoutineSlot {
  id: string;
  teacherName: string;
  day: "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY";
  period: number; // 1 to 8
  subject: string;
  classGroups: string[]; // e.g. ["6th"], ["7th"], ["8th"], ["10th-Voc"], etc.
  roomOrLab: string;
  isLab: boolean;
  span: number;
}

export interface PeriodTimeConfig {
  period: number;
  startTime: string;
  endTime: string;
  isTiffinAfter?: boolean;
}

export const PTSC_TIME_CONFIG: PeriodTimeConfig[] = [
  { period: 1, startTime: "08:00", endTime: "08:40" },
  { period: 2, startTime: "08:40", endTime: "09:20" },
  { period: 3, startTime: "09:20", endTime: "10:00", isTiffinAfter: true }, // Tiffin 10:00 - 10:20
  { period: 4, startTime: "10:20", endTime: "11:00" },
  { period: 5, startTime: "11:00", endTime: "11:40" },
  { period: 6, startTime: "11:40", endTime: "12:20" },
  { period: 7, startTime: "12:20", endTime: "13:00" },
  { period: 8, startTime: "13:00", endTime: "13:40" }
];

export const PTSC_TEACHERS_CATALOG = [
  { name: "Md. Zuyel Rana", designation: "Instructor (IT)", load: 26 },
  { name: "Abdul Matin Dali", designation: "Junior Instructor", load: 12 },
  { name: "Abu Kalam", designation: "Senior Teacher", load: 29 },
  { name: "Bidush Roy", designation: "Assistant Teacher", load: 24 },
  { name: "Chandana Roy", designation: "Assistant Teacher", load: 20 },
  { name: "Dipak Roy", designation: "Junior Instructor", load: 22 },
  { name: "Gourango Nath Roy", designation: "Instructor", load: 18 },
  { name: "Jagesh Chandra Paul", designation: "Senior Teacher", load: 25 },
  { name: "Joydeb Chandra Roy", designation: "Assistant Teacher", load: 21 },
  { name: "Kajal Chakroborty", designation: "Senior Teacher", load: 27 },
  { name: "Kamla Kanto Barman", designation: "Assistant Teacher", load: 23 },
  { name: "Manik Chandra Shorma", designation: "Senior Teacher", load: 30 },
  { name: "Md Sofiul Alom", designation: "Instructor", load: 19 },
  { name: "Md. Abdul Aziz", designation: "Assistant Teacher", load: 22 },
  { name: "Md. Abubakar Siddique", designation: "Assistant Teacher", load: 24 },
  { name: "Md. Afsar Ud Zaman", designation: "Assistant Teacher", load: 21 },
  { name: "Md. Babul Hossain", designation: "Junior Instructor", load: 20 },
  { name: "Md. Hafezul islam", designation: "Instructor", load: 18 },
  { name: "Mithun Roy", designation: "Assistant Teacher (ICT)", load: 22 },
  { name: "Mukti Rani Paul", designation: "Assistant Teacher", load: 19 },
  { name: "Sandip Kumar Roy", designation: "Junior Instructor", load: 21 },
  { name: "Sujan Ali", designation: "Assistant Teacher", load: 26 }
];

export const PTSC_CLASSES_LIST = [
  "6th",
  "7th",
  "8th",
  "9th-Voc",
  "10th-Voc",
  "11th-Voc",
  "12th-Voc"
];

export const INITIAL_MASTER_ROUTINE: MasterRoutineSlot[] = [
  // ================= 6TH CLASS =================
  // Sunday 6th
  { id: "6-sun-1", teacherName: "Abdul Matin Dali", day: "SUNDAY", period: 1, subject: "Voc. Ed", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "6-sun-2", teacherName: "Joydeb Chandra Roy", day: "SUNDAY", period: 2, subject: "Bangla-1", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "6-sun-4", teacherName: "Sujan Ali", day: "SUNDAY", period: 4, subject: "Math", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "6-sun-5", teacherName: "Sandip Kumar Roy", day: "SUNDAY", period: 5, subject: "ICT", classGroups: ["6th"], roomOrLab: "App Lab", isLab: true, span: 1 },
  { id: "6-sun-6", teacherName: "Bidush Roy", day: "SUNDAY", period: 6, subject: "Religion", classGroups: ["6th"], roomOrLab: "App Lab", isLab: false, span: 1 },
  { id: "6-sun-7", teacherName: "Bidush Roy", day: "SUNDAY", period: 7, subject: "English-1", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },

  // Monday 6th
  { id: "6-mon-1", teacherName: "Sujan Ali", day: "MONDAY", period: 1, subject: "Religion", classGroups: ["6th"], roomOrLab: "New Bldg-1", isLab: false, span: 1 },
  { id: "6-mon-2", teacherName: "Bidush Roy", day: "MONDAY", period: 2, subject: "English-1", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "6-mon-3", teacherName: "Manik Chandra Shorma", day: "MONDAY", period: 3, subject: "Bangla-1", classGroups: ["6th"], roomOrLab: "New Bldg-1", isLab: false, span: 1 },
  { id: "6-mon-5", teacherName: "Sujan Ali", day: "MONDAY", period: 5, subject: "BGS", classGroups: ["6th"], roomOrLab: "New Bldg-1", isLab: false, span: 1 },
  { id: "6-mon-6", teacherName: "Sujan Ali", day: "MONDAY", period: 6, subject: "Math", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "6-mon-7", teacherName: "Md. Abubakar Siddique", day: "MONDAY", period: 7, subject: "Science", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },

  // Tuesday 6th
  { id: "6-tue-1", teacherName: "Abdul Matin Dali", day: "TUESDAY", period: 1, subject: "Voc. Ed", classGroups: ["6th"], roomOrLab: "New Bldg-1", isLab: false, span: 1 },
  { id: "6-tue-3", teacherName: "Kajal Chakroborty", day: "TUESDAY", period: 3, subject: "Science", classGroups: ["6th"], roomOrLab: "New Bldg-2", isLab: false, span: 1 },
  { id: "6-tue-4", teacherName: "Sujan Ali", day: "TUESDAY", period: 4, subject: "Math", classGroups: ["6th"], roomOrLab: "New Bldg-1", isLab: false, span: 1 },
  { id: "6-tue-5", teacherName: "Bidush Roy", day: "TUESDAY", period: 5, subject: "English-2", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 2 },

  // Wednesday 6th
  { id: "6-wed-1", teacherName: "Joydeb Chandra Roy", day: "WEDNESDAY", period: 1, subject: "Religion", classGroups: ["6th"], roomOrLab: "Lab-1", isLab: false, span: 1 },
  { id: "6-wed-2", teacherName: "Sujan Ali", day: "WEDNESDAY", period: 2, subject: "Religion", classGroups: ["6th"], roomOrLab: "New Bldg-1", isLab: false, span: 1 },
  { id: "6-wed-3", teacherName: "Md. Afsar Ud Zaman", day: "WEDNESDAY", period: 3, subject: "Bangla-2", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "6-wed-8", teacherName: "Bidush Roy", day: "WEDNESDAY", period: 8, subject: "English-2", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },

  // Thursday 6th
  { id: "6-thu-1", teacherName: "Abdul Matin Dali", day: "THURSDAY", period: 1, subject: "Voc. Ed", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "6-thu-2", teacherName: "Sujan Ali", day: "THURSDAY", period: 2, subject: "BGS", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "6-thu-3", teacherName: "Md. Afsar Ud Zaman", day: "THURSDAY", period: 3, subject: "Bangla-2", classGroups: ["6th"], roomOrLab: "New Bldg-2", isLab: false, span: 1 },
  { id: "6-thu-4", teacherName: "Sujan Ali", day: "THURSDAY", period: 4, subject: "Math", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "6-thu-5", teacherName: "Bidush Roy", day: "THURSDAY", period: 5, subject: "English-1", classGroups: ["6th"], roomOrLab: "New Bldg", isLab: false, span: 1 },

  // ================= 7TH CLASS =================
  // Sunday 7th
  { id: "7-sun-1", teacherName: "Bidush Roy", day: "SUNDAY", period: 1, subject: "Bangla-1", classGroups: ["7th"], roomOrLab: "New Bldg-1", isLab: false, span: 1 },
  { id: "7-sun-3", teacherName: "Md. Abdul Aziz", day: "SUNDAY", period: 3, subject: "Science", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-sun-4", teacherName: "Kamla Kanto Barman", day: "SUNDAY", period: 4, subject: "English-1", classGroups: ["7th"], roomOrLab: "New Bldg-2", isLab: false, span: 1 },
  { id: "7-sun-5", teacherName: "Manik Chandra Shorma", day: "SUNDAY", period: 5, subject: "English-1", classGroups: ["7th"], roomOrLab: "New Bldg-2", isLab: false, span: 1 },
  { id: "7-sun-6", teacherName: "Kamla Kanto Barman", day: "SUNDAY", period: 6, subject: "Math", classGroups: ["7th"], roomOrLab: "New Bldg-1", isLab: false, span: 1 },
  { id: "7-sun-7", teacherName: "Manik Chandra Shorma", day: "SUNDAY", period: 7, subject: "Voc. Ed", classGroups: ["7th"], roomOrLab: "New Bldg-2", isLab: false, span: 1 },

  // Monday 7th
  { id: "7-mon-1", teacherName: "Manik Chandra Shorma", day: "MONDAY", period: 1, subject: "BGS", classGroups: ["7th"], roomOrLab: "New Bldg-2", isLab: false, span: 1 },
  { id: "7-mon-2", teacherName: "Md. Abubakar Siddique", day: "MONDAY", period: 2, subject: "Science", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-mon-3", teacherName: "Kajal Chakroborty", day: "MONDAY", period: 3, subject: "Voc. Ed", classGroups: ["7th"], roomOrLab: "Workshop", isLab: true, span: 1 },

  // Tuesday 7th
  { id: "7-tue-1", teacherName: "Bidush Roy", day: "TUESDAY", period: 1, subject: "Religion", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-tue-2", teacherName: "Jagesh Chandra Paul", day: "TUESDAY", period: 2, subject: "Religion", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-tue-3", teacherName: "Md. Abdul Aziz", day: "TUESDAY", period: 3, subject: "Bangla-1", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-tue-4", teacherName: "Bidush Roy", day: "TUESDAY", period: 4, subject: "English-2", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-tue-5", teacherName: "Joydeb Chandra Roy", day: "TUESDAY", period: 5, subject: "Religion", classGroups: ["7th"], roomOrLab: "Room 101", isLab: false, span: 1 },
  { id: "7-tue-6", teacherName: "Sujan Ali", day: "TUESDAY", period: 6, subject: "Religion", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-tue-7", teacherName: "Bidush Roy", day: "TUESDAY", period: 7, subject: "Bangla-2", classGroups: ["7th"], roomOrLab: "New Bldg-1", isLab: false, span: 1 },
  { id: "7-tue-8", teacherName: "Kajal Chakroborty", day: "TUESDAY", period: 8, subject: "Bangla-2", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },

  // Wednesday 7th
  { id: "7-wed-1", teacherName: "Manik Chandra Shorma", day: "WEDNESDAY", period: 1, subject: "Voc. Ed", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-wed-2", teacherName: "Manik Chandra Shorma", day: "WEDNESDAY", period: 2, subject: "BGS", classGroups: ["7th"], roomOrLab: "New Bldg-1", isLab: false, span: 1 },
  { id: "7-wed-3", teacherName: "Abdul Matin Dali", day: "WEDNESDAY", period: 3, subject: "Voc. Ed", classGroups: ["7th"], roomOrLab: "New Bldg-2", isLab: false, span: 1 },
  { id: "7-wed-4", teacherName: "Kamla Kanto Barman", day: "WEDNESDAY", period: 4, subject: "Math", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-wed-5", teacherName: "Kamla Kanto Barman", day: "WEDNESDAY", period: 5, subject: "English-1", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-wed-6", teacherName: "Bidush Roy", day: "WEDNESDAY", period: 6, subject: "English-2", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-wed-8", teacherName: "Mithun Roy", day: "WEDNESDAY", period: 8, subject: "ICT", classGroups: ["7th"], roomOrLab: "ICT Lab", isLab: true, span: 1 },

  // Thursday 7th
  { id: "7-thu-1", teacherName: "Kajal Chakroborty", day: "THURSDAY", period: 1, subject: "Voc. Ed", classGroups: ["7th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "7-thu-3", teacherName: "Sandip Kumar Roy", day: "THURSDAY", period: 3, subject: "Voc. Ed Practical", classGroups: ["7th"], roomOrLab: "New Bldg-1", isLab: true, span: 2 },
  { id: "7-thu-5", teacherName: "Manik Chandra Shorma", day: "THURSDAY", period: 5, subject: "English-1", classGroups: ["7th"], roomOrLab: "New Bldg-2", isLab: false, span: 1 },
  { id: "7-thu-6", teacherName: "Kamla Kanto Barman", day: "THURSDAY", period: 6, subject: "Math", classGroups: ["7th"], roomOrLab: "New Bldg-1", isLab: false, span: 1 },

  // ================= 8TH CLASS =================
  // Sunday 8th
  { id: "8-sun-1", teacherName: "Manik Chandra Shorma", day: "SUNDAY", period: 1, subject: "Voc. Ed", classGroups: ["8th"], roomOrLab: "New Bldg-2", isLab: false, span: 1 },
  { id: "8-sun-2", teacherName: "Md. Abubakar Siddique", day: "SUNDAY", period: 2, subject: "Science", classGroups: ["8th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "8-sun-3", teacherName: "Kajal Chakroborty", day: "SUNDAY", period: 3, subject: "Bangla-1", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-sun-4", teacherName: "Jagesh Chandra Paul", day: "SUNDAY", period: 4, subject: "Math", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-sun-5", teacherName: "Manik Chandra Shorma", day: "SUNDAY", period: 5, subject: "English-1", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-sun-6", teacherName: "Bidush Roy", day: "SUNDAY", period: 6, subject: "English-2", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-sun-7", teacherName: "Kamla Kanto Barman", day: "SUNDAY", period: 7, subject: "BGS", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },

  // Monday 8th
  { id: "8-mon-2", teacherName: "Kajal Chakroborty", day: "MONDAY", period: 2, subject: "Bangla-1", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-mon-3", teacherName: "Manik Chandra Shorma", day: "MONDAY", period: 3, subject: "Voc. Ed", classGroups: ["8th"], roomOrLab: "Room 404", isLab: true, span: 2 },

  // Tuesday 8th
  { id: "8-tue-1", teacherName: "Manik Chandra Shorma", day: "TUESDAY", period: 1, subject: "English-1", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-tue-2", teacherName: "Manik Chandra Shorma", day: "TUESDAY", period: 2, subject: "Voc. Ed", classGroups: ["8th"], roomOrLab: "New Bldg-2", isLab: false, span: 1 },
  { id: "8-tue-3", teacherName: "Md. Abubakar Siddique", day: "TUESDAY", period: 3, subject: "Science", classGroups: ["8th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "8-tue-5", teacherName: "Jagesh Chandra Paul", day: "TUESDAY", period: 5, subject: "Math", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-tue-6", teacherName: "Kajal Chakroborty", day: "TUESDAY", period: 6, subject: "Bangla-2", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },

  // Wednesday 8th
  { id: "8-wed-1", teacherName: "Bidush Roy", day: "WEDNESDAY", period: 1, subject: "English-2", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-wed-2", teacherName: "Joydeb Chandra Roy", day: "WEDNESDAY", period: 2, subject: "Religion", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-wed-3", teacherName: "Md. Abubakar Siddique", day: "WEDNESDAY", period: 3, subject: "Science", classGroups: ["8th"], roomOrLab: "New Bldg", isLab: false, span: 1 },
  { id: "8-wed-4", teacherName: "Sujan Ali", day: "WEDNESDAY", period: 4, subject: "Religion", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-wed-5", teacherName: "Jagesh Chandra Paul", day: "WEDNESDAY", period: 5, subject: "Math", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-wed-6", teacherName: "Manik Chandra Shorma", day: "WEDNESDAY", period: 6, subject: "Voc. Ed", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-wed-8", teacherName: "Mithun Roy", day: "WEDNESDAY", period: 8, subject: "ICT", classGroups: ["8th"], roomOrLab: "ICT Lab-2", isLab: true, span: 1 },

  // Thursday 8th
  { id: "8-thu-1", teacherName: "Jagesh Chandra Paul", day: "THURSDAY", period: 1, subject: "Math", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-thu-2", teacherName: "Manik Chandra Shorma", day: "THURSDAY", period: 2, subject: "Voc. Ed", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-thu-4", teacherName: "Kajal Chakroborty", day: "THURSDAY", period: 4, subject: "BGS", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-thu-5", teacherName: "Manik Chandra Shorma", day: "THURSDAY", period: 5, subject: "English-1", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },
  { id: "8-thu-6", teacherName: "Mukti Rani Paul", day: "THURSDAY", period: 6, subject: "Religion", classGroups: ["8th"], roomOrLab: "App Lab", isLab: false, span: 1 },
  { id: "8-thu-7", teacherName: "Sujan Ali", day: "THURSDAY", period: 7, subject: "Religion", classGroups: ["8th"], roomOrLab: "Room 404", isLab: false, span: 1 },

  // ================= 9TH & 10TH VOCATIONAL =================
  // Sunday 9th/10th
  { id: "10-sun-1", teacherName: "Md. Zuyel Rana", day: "SUNDAY", period: 1, subject: "Computer Peripherals", classGroups: ["10th-Voc"], roomOrLab: "IoT Lab", isLab: true, span: 2 },
  { id: "10-sun-3", teacherName: "Abu Kalam", day: "SUNDAY", period: 3, subject: "English-I", classGroups: ["10th-Voc"], roomOrLab: "Room 201", isLab: false, span: 1 },
  { id: "10-sun-4", teacherName: "Dipak Roy", day: "SUNDAY", period: 4, subject: "Electrical Circuits-I", classGroups: ["10th-Voc"], roomOrLab: "Electrical Shop", isLab: true, span: 2 },
  { id: "10-sun-6", teacherName: "Md. Afsar Ud Zaman", day: "SUNDAY", period: 6, subject: "Physics-II", classGroups: ["10th-Voc"], roomOrLab: "Science Lab", isLab: true, span: 2 },

  // Monday 9th/10th
  { id: "10-mon-1", teacherName: "Md. Zuyel Rana", day: "MONDAY", period: 1, subject: "Computer Programming", classGroups: ["10th-Voc"], roomOrLab: "Computer Lab 1", isLab: true, span: 3 },
  { id: "10-mon-4", teacherName: "Gourango Nath Roy", day: "MONDAY", period: 4, subject: "Mathematics-II", classGroups: ["10th-Voc"], roomOrLab: "Room 202", isLab: false, span: 1 },
  { id: "10-mon-5", teacherName: "Abu Kalam", day: "MONDAY", period: 5, subject: "English-II", classGroups: ["10th-Voc"], roomOrLab: "Room 202", isLab: false, span: 1 },
  { id: "10-mon-6", teacherName: "Md. Abdul Aziz", day: "MONDAY", period: 6, subject: "Bangla-II", classGroups: ["10th-Voc"], roomOrLab: "Room 202", isLab: false, span: 1 },

  // Tuesday 9th/10th
  { id: "10-tue-1", teacherName: "Md. Zuyel Rana", day: "TUESDAY", period: 1, subject: "Database Management", classGroups: ["10th-Voc"], roomOrLab: "IoT Lab", isLab: true, span: 2 },
  { id: "10-tue-3", teacherName: "Md Sofiul Alom", day: "TUESDAY", period: 3, subject: "Drafting & CAD", classGroups: ["10th-Voc"], roomOrLab: "Drawing Lab", isLab: true, span: 2 },
  { id: "10-tue-5", teacherName: "Mithun Roy", day: "TUESDAY", period: 5, subject: "IT Applications", classGroups: ["10th-Voc"], roomOrLab: "ICT Lab", isLab: true, span: 2 },

  // Wednesday 9th/10th
  { id: "10-wed-1", teacherName: "Md. Zuyel Rana", day: "WEDNESDAY", period: 1, subject: "Networking Essentials", classGroups: ["10th-Voc"], roomOrLab: "Computer Lab 2", isLab: true, span: 2 },
  { id: "10-wed-3", teacherName: "Md. Hafezul islam", day: "WEDNESDAY", period: 3, subject: "Machine Shop Practice", classGroups: ["10th-Voc"], roomOrLab: "Mechanical Workshop", isLab: true, span: 3 },
  { id: "10-wed-6", teacherName: "Md. Babul Hossain", day: "WEDNESDAY", period: 6, subject: "Electrical Wiring", classGroups: ["10th-Voc"], roomOrLab: "Electrical Lab", isLab: true, span: 2 },

  // Thursday 9th/10th
  { id: "10-thu-1", teacherName: "Md. Zuyel Rana", day: "THURSDAY", period: 1, subject: "Web Development", classGroups: ["10th-Voc"], roomOrLab: "IoT Lab", isLab: true, span: 3 },
  { id: "10-thu-4", teacherName: "Abu Kalam", day: "THURSDAY", period: 4, subject: "Social Studies", classGroups: ["10th-Voc"], roomOrLab: "Room 205", isLab: false, span: 1 },
  { id: "10-thu-5", teacherName: "Gourango Nath Roy", day: "THURSDAY", period: 5, subject: "Higher Math", classGroups: ["10th-Voc"], roomOrLab: "Room 205", isLab: false, span: 1 },

  // ================= 11TH & 12TH VOCATIONAL =================
  // Sunday 12th
  { id: "12-sun-1", teacherName: "Md. Zuyel Rana", day: "SUNDAY", period: 1, subject: "Advanced Programming & IoT", classGroups: ["12th-Voc"], roomOrLab: "IoT Lab", isLab: true, span: 3 },
  { id: "12-sun-4", teacherName: "Dipak Roy", day: "SUNDAY", period: 4, subject: "Electrical Power Distribution", classGroups: ["12th-Voc"], roomOrLab: "Electrical Lab", isLab: true, span: 2 },

  // Monday 12th
  { id: "12-mon-1", teacherName: "Md. Zuyel Rana", day: "MONDAY", period: 1, subject: "Database Systems & SQL", classGroups: ["12th-Voc"], roomOrLab: "Computer Lab 1", isLab: true, span: 2 },
  { id: "12-mon-3", teacherName: "Mithun Roy", day: "MONDAY", period: 3, subject: "Computer Graphics & CAD", classGroups: ["12th-Voc"], roomOrLab: "ICT Lab", isLab: true, span: 2 },

  // Tuesday 12th
  { id: "12-tue-1", teacherName: "Md. Zuyel Rana", day: "TUESDAY", period: 1, subject: "Software Engineering", classGroups: ["12th-Voc"], roomOrLab: "IoT Lab", isLab: true, span: 2 },

  // Wednesday 12th
  { id: "12-wed-1", teacherName: "Md. Zuyel Rana", day: "WEDNESDAY", period: 1, subject: "Network Administration", classGroups: ["12th-Voc"], roomOrLab: "Computer Lab 2", isLab: true, span: 3 },

  // Thursday 12th
  { id: "12-thu-1", teacherName: "Md. Zuyel Rana", day: "THURSDAY", period: 1, subject: "Project & Thesis Lab", classGroups: ["12th-Voc"], roomOrLab: "IoT Lab", isLab: true, span: 3 }
];
