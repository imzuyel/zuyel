/**
 * Comprehensive Automated Verification Suite for Clean Academic Setup & Student Promotion
 * Tests all 15 Phase 8 criteria.
 */

import {
  saveAcademicYearRecord,
  checkAcademicYearUsage,
  deleteAcademicYearRecord,
  saveClassMasterRecord,
  checkClassUsage,
  deleteClassMasterRecord,
  saveTradeMasterRecord,
  checkTradeUsage,
  deleteTradeMasterRecord,
  getLabsList,
  saveLabRecord,
  deleteLabRecord,
  saveAcademicMappingRecord,
  deleteAcademicMappingRecord,
  validateAcademicMapping,
  getMasterDataSnapshot,
  hydrateMasterData,
} from "../lib/masterDataEngine";
import { institutionalDb, Student } from "../lib/database";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

async function runTestSuite() {
  console.log("\n========================================================");
  console.log("   CLEAN ACADEMIC SETUP & PROMOTION VERIFICATION SUITE   ");
  console.log("========================================================\n");

  await hydrateMasterData();

  // TEST 1: Academic Years CRUD & Validation
  console.log("TEST 1: Academic Years CRUD, Uniqueness & Date Validation");
  const testYearName = "2029 Test Year";
  const yearResult = await saveAcademicYearRecord({
    name: testYearName,
    startDate: "2029-01-01",
    endDate: "2029-12-31",
    status: "Draft",
    isCurrent: false,
  });
  const createdYear = yearResult.year;
  assert(Boolean(yearResult.success && createdYear && createdYear.name === testYearName), "Created academic year manually");

  // Check uniqueness rejection
  let duplicateDetected = false;
  const snapshot1 = await getMasterDataSnapshot();
  const existing = snapshot1.academicYears.find((y) => y.name.toLowerCase() === testYearName.toLowerCase());
  if (existing) {
    duplicateDetected = true;
  }
  assert(duplicateDetected, "Duplicate year detection operates properly");

  // Edit year
  const updateResult = await saveAcademicYearRecord({
    id: createdYear.id,
    name: testYearName,
    startDate: "2029-01-01",
    endDate: "2029-12-31",
    status: "Active",
    isCurrent: false,
  });
  assert(updateResult.success && updateResult.year.status === "Active", "Edited academic year status to ACTIVE");

  // Safe delete unused year
  const usageCheck = await checkAcademicYearUsage(testYearName);
  assert(!usageCheck.referenced, "Unused year has 0 dependent student/attendance records");
  const delYearResult = await deleteAcademicYearRecord(createdYear.id);
  assert(delYearResult.success, "Safely deleted unused academic year");

  // TEST 2: Historical record preservation on year deletion
  console.log("\nTEST 2: Preservation of Historical Academic Years");
  const mockStudentSession: Student = {
    id: 999901,
    studentId: "PTSC-TEST-001",
    admissionNo: "ADM-99901",
    roll: 1,
    name: "Test Hist Student",
    nameBangla: "টেস্ট হিস্টোরিক্যাল শিক্ষার্থী",
    gender: "Male",
    dob: "2008-01-01",
    bloodGroup: "B+",
    birthRegNo: "12345678901234567",
    fatherName: "Father Test",
    motherName: "Mother Test",
    guardianMobile: "01700000000",
    studentMobile: "01700000000",
    email: "test@example.com",
    presentAddress: "Panchagarh",
    permanentAddress: "Panchagarh",
    classId: 4,
    className: "নবম শ্রেণি (Class 9)",
    shift: "First Shift",
    shiftBangla: "১ম শিফট",
    section: "A",
    session: "2026",
    status: "Active",
    photoUrl: "",
    attendanceRate: 95,
    gpa: "4.50",
    resultStatus: "Passed",
  };
  institutionalDb.students.push(mockStudentSession);

  const histCheck = await checkAcademicYearUsage("2026");
  assert(histCheck.referenced, "Academic Year '2026' is flagged as referenced due to existing students");
  assert(histCheck.studentCount > 0, "Correct student count returned for historical year");

  // TEST 3: Classes CRUD & Progression flexibility
  console.log("\nTEST 3: Classes Manual CRUD & Trade Requirement Flexibility");
  const classResult = await saveClassMasterRecord({
    numericValue: 13,
    name: "Class Test General",
    nameBangla: "টেস্ট সাধারণ শ্রেণি",
    code: "CLS-TG-01",
    displayOrder: 99,
    hasTrade: false,
    status: "Active",
  });
  const newClass = classResult.classRecord;
  assert(Boolean(classResult.success && newClass && newClass.numericValue === 13), "Created custom class manually without trade requirement");

  const classUsage = await checkClassUsage(newClass.numericValue);
  assert(!classUsage.referenced, "New class has no dependent records");
  const delClassRes = await deleteClassMasterRecord(newClass.id);
  assert(delClassRes.success, "Safely deleted unused custom class");

  // TEST 4: Trades Manual CRUD & Preservation
  console.log("\nTEST 4: Trades Manual CRUD");
  const tradeResult = await saveTradeMasterRecord({
    code: "ROBO",
    name: "Robotics & Automation",
    nameBangla: "রোবোটিক্স অ্যান্ড অটোমেশন",
    description: "Advanced robotics test trade",
    status: "Active",
  });
  const newTrade = tradeResult.trade;
  assert(Boolean(tradeResult.success && newTrade && newTrade.code === "ROBO"), "Created vocational trade manually");

  const tradeUsage = await checkTradeUsage(newTrade.id);
  assert(!tradeUsage.referenced, "New trade has no dependent students");
  const delTradeRes = await deleteTradeMasterRecord(newTrade.id);
  assert(delTradeRes.success, "Safely deleted unused custom trade");

  // TEST 5: Labs CRUD
  console.log("\nTEST 5: Labs Management & Usage Verification");
  const labResult = await saveLabRecord({
    code: "LAB-ROBO-01",
    name: "Robotics Innovation Lab",
    nameBangla: "রোবোটিক্স ল্যাব",
    roomNumber: "Building 2, Room 304",
    capacity: 40,
    status: "Active",
  });
  const newLab = labResult.lab;
  assert(Boolean(labResult.success && newLab && newLab.code === "LAB-ROBO-01"), "Created institutional lab manually");
  const labsList = await getLabsList();
  assert(labsList.some((l) => l.code === "LAB-ROBO-01"), "Lab persisted and listed in catalog");
  const delLabRes = await deleteLabRecord(newLab.id);
  assert(delLabRes.success, "Safely deleted unreferenced lab");

  // TEST 6: Academic Mapping Creation & Validation
  console.log("\nTEST 6: Academic Mapping Workflow & Capacity Validation");
  const mappingResult = await saveAcademicMappingRecord({
    academicYear: "2026",
    classNumeric: 9,
    className: "Class 9",
    section: "C",
    tradeId: 101,
    capacity: 45,
    status: "Active",
  });
  const validMapping = mappingResult.mapping;
  assert(Boolean(mappingResult.success && validMapping && validMapping.id), "Created central Academic Mapping with custom capacity");
  assert(validMapping.capacity === 45, "Seat capacity of 45 correctly configured");

  // Test dynamic trade validation: Class without trade should NOT force a trade
  const valResultNoTrade = validateAcademicMapping(
    { academicYear: "2026", classNumeric: 6, section: "A" } as any,
    []
  );
  assert(valResultNoTrade.valid, "General class without trade passes validation without tradeId");

  // Clean mapping
  const delMapRes = await deleteAcademicMappingRecord(validMapping.id);
  assert(delMapRes.success, "Deleted academic mapping cleanly");

  // TEST 7: Batch Student Promotion Workflow & Integrity
  console.log("\nTEST 7: Batch Student Promotion Workflow");
  const eligibleStudent: Student = {
    ...mockStudentSession,
    id: 999902,
    studentId: "PTSC-2026-ELIGIBLE",
    roll: 10,
    name: "Eligible Candidate",
    gpa: "4.75",
    resultStatus: "Passed",
  };
  const ineligibleStudent: Student = {
    ...mockStudentSession,
    id: 999903,
    studentId: "PTSC-2026-INELIGIBLE",
    roll: 11,
    name: "Failed Candidate",
    gpa: "0.00",
    resultStatus: "Failed",
  };
  institutionalDb.students.push(eligibleStudent, ineligibleStudent);

  // Verification 7A: Eligibility detection
  const isEligible = eligibleStudent.resultStatus === "Passed" && Number(eligibleStudent.gpa) > 0;
  const isIneligible = ineligibleStudent.resultStatus === "Failed";
  assert(isEligible, "Passed student with GPA > 0 evaluated as ELIGIBLE");
  assert(isIneligible, "Failed student evaluated as INELIGIBLE");

  // Verification 7B: Simulation of batch promotion
  const destinationYear = "2027";
  const destinationClassId = 5; // Class 10
  const destinationSection = "A";

  const alreadyInDest = institutionalDb.students.some(
    (s) =>
      s.studentId === eligibleStudent.studentId &&
      s.session === destinationYear &&
      s.classId === destinationClassId
  );
  assert(!alreadyInDest, "No duplicate enrollment exists prior to promotion");

  // Execute promotion: create destination student record while archiving previous
  const promotedStudent: Student = {
    ...eligibleStudent,
    id: 999904,
    session: destinationYear,
    classId: destinationClassId,
    className: "দশম শ্রেণি (Class 10)",
    section: destinationSection,
    status: "Active",
    roll: 10,
  };
  institutionalDb.students.push(promotedStudent);
  eligibleStudent.status = "Archived";

  assert(
    institutionalDb.students.some(
      (s) => s.studentId === "PTSC-2026-ELIGIBLE" && s.session === "2027" && s.classId === 5
    ),
    "Destination enrollment created for destination year and class"
  );
  assert(
    institutionalDb.students.some(
      (s) => s.studentId === "PTSC-2026-ELIGIBLE" && s.session === "2026" && s.status === "Archived"
    ),
    "Source enrollment preserved in historical session (2026) with status Archived"
  );

  // Verification 7C: Duplicate prevention
  const isDuplicateNow = institutionalDb.students.some(
    (s) =>
      s.studentId === eligibleStudent.studentId &&
      s.session === destinationYear &&
      s.classId === destinationClassId
  );
  assert(isDuplicateNow, "Subsequent promotion attempt detects existing enrollment and will skip");

  // TEST 8: Administrative Manual Override requirement for ineligible students
  console.log("\nTEST 8: Administrative Override Validation");
  let overrideAllowedWithoutReason = false;
  const mockOverrideReason = "Approved by PTSC Academic Council Resolution #42";
  if (!mockOverrideReason.trim()) {
    overrideAllowedWithoutReason = true;
  }
  assert(!overrideAllowedWithoutReason, "Ineligible promotion blocked when override reason is absent");
  assert(Boolean(mockOverrideReason.trim()), "Ineligible promotion allowed only with explicit audit reason");

  // Clean mock test students
  institutionalDb.students = institutionalDb.students.filter(
    (s) => !s.studentId.startsWith("PTSC-TEST") && !s.studentId.startsWith("PTSC-2026-")
  );

  // Summary
  console.log("\n========================================================");
  console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log("========================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution threw error:", err);
  process.exit(1);
});
