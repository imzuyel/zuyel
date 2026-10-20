import { Student } from "./database";

export const generateDummyStudents = (count: number): Student[] => {
  const students: Student[] = [];
  for (let i = 1; i <= count; i++) {
    students.push({
      id: 10000 + i,
      studentId: `PTSC-2026-DUMMY-${i.toString().padStart(4, '0')}`,
      admissionNo: `ADM-2026-DUMMY-${i.toString().padStart(4, '0')}`,
      roll: i,
      name: `Dummy Student ${i}`,
      nameBangla: `ডামি শিক্ষার্থী ${i}`,
      gender: i % 2 === 0 ? "Male" : "Female",
      dob: "2012-01-01",
      bloodGroup: "O+",
      birthRegNo: `2012561823400${i.toString().padStart(5, '0')}`,
      fatherName: `Father ${i}`,
      motherName: `Mother ${i}`,
      guardianMobile: `01700-000000`,
      studentMobile: `01700-000001`,
      email: `dummy${i}@pgtsc.gov.bd`,
      presentAddress: "Panchagarh",
      permanentAddress: "Panchagarh",
      classId: 4,
      className: "Class 9 (SSC Vocational)",
      tradeId: 2,
      tradeName: "IT Support and IoT Basics",
      tradeNameBangla: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
      shift: "First Shift",
      shiftBangla: "১ম শিফট",
      section: "A",
      session: "2026",
      status: "Active",
      photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
      attendanceRate: 85.0,
      gpa: "4.00",
      resultStatus: "Passed",
    });
  }
  return students;
};
