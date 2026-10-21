import { PrismaClient, Shift, StudentStatus, FacultyType } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

// ============================================================================
// Internal Normalized Student Data Interface
// ============================================================================
interface NormalizedStudent {
  classNumeric: number;
  section: string;
  roll: number;
  rawKey: string;
  studentId: string;
  admissionNo: string;
  name: string;
  nameBangla: string;
  fatherName: string;
  motherName: string;
  dob: string;
  brn: string | null;
  mobile: string;
  gender: string;
  religion: string;
  presentAddress: string;
  permanentAddress: string;
  tradeCode: string | null;
  status: StudentStatus;
}

// ============================================================================
// Normalization & Sanitization Helpers
// ============================================================================

/**
 * Normalizes mobile number to standard Bangladeshi 11-digit format (01XXXXXXXXX).
 * Restores leading zeros stripped by spreadsheet software.
 */
function cleanMobileNumber(val: any): string {
  if (!val) return "01700-000000";
  let str = String(val).replace(/\D/g, "");
  if (str.length === 10 && str.startsWith("1")) {
    str = "0" + str;
  }
  return str.length >= 10 ? str : "01700-000000";
}

/**
 * Normalizes date to ISO YYYY-MM-DD format.
 * Accurately handles Excel integer serial dates (e.g. 41456), DD/MM/YYYY, and malformed strings.
 */
function cleanDateOfBirth(val: any, classNum: number): string {
  if (!val) {
    const defaultYears: Record<number, number> = {
      6: 2014,
      7: 2013,
      8: 2012,
      9: 2011,
      10: 2010,
      11: 2008,
      12: 2007,
    };
    return `${defaultYears[classNum] || 2010}-01-01`;
  }

  // Handle Excel serial date numbers (days since 1900-01-01)
  if (typeof val === "number" || /^\d{5}$/.test(String(val).trim())) {
    const serial = typeof val === "number" ? val : parseInt(String(val).trim(), 10);
    const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  }

  const str = String(val).trim().replace("//", "/");
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const parts = str.split("/");
  if (parts.length === 3) {
    const d = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${y}-${m}-${d}`;
  }

  return "2010-01-01";
}

/**
 * Resolves trade code based on official PTSC institutional trades:
 * 1. General Electronics (code: "GE")
 * 2. IT Support and IoT Basics (code: "IT-IoT")
 * 3. General Electrical Workshop / General Electrical Works (code: "EE")
 * 4. Apparel Manufacturing Basics (code: "AMB")
 * Note: Classes 6, 7, and 8 have NO trades (returns null).
 */
function resolveOfficialTradeCode(val: any, classNum: number): string | null {
  if ([6, 7, 8].includes(classNum)) {
    return null; // Classes 6, 7, 8 strictly have no trade
  }

  const text = String(val || "").toLowerCase();

  // 1. General Electrical Workshop / General Electrical Works / Electrical Works and Maintenance / 90 / EE
  if (text.includes("electrical") || text.includes("90") || /\bee\b/.test(text)) {
    return "EE";
  }

  // 2. General Electronics / Electronic Control and Communication / 62 / GE
  if (text.includes("electronic") || text.includes("62") || /\bge\b/.test(text)) {
    return "GE";
  }

  // 3. IT Support and IoT Basics / Computer and IoT Systems / 88 / IT-IoT
  if (text.includes("iot") || text.includes("computer") || text.includes("88") || text.includes("it support")) {
    return "IT-IoT";
  }

  // 4. Apparel Manufacturing Basics / Clothing and Garments Finishing / 81 / AMB
  if (text.includes("apparel") || text.includes("garment") || text.includes("clothing") || text.includes("81") || /\bamb\b/.test(text)) {
    return "AMB";
  }

  return null;
}

// ============================================================================
// Multi-Source Data Ingestion Engine (Excel Primary, Staging JSON Fallback)
// ============================================================================

function loadStudentRecordsFromExcelOrStaging(): NormalizedStudent[] {
  const students: NormalizedStudent[] = [];

  // Search paths for Excel directory
  const possibleDataDirs = [
    path.join(__dirname, "data"),
    path.join(process.cwd(), "prisma", "data"),
    path.join(process.cwd(), "data"),
  ];

  let excelDir: string | null = null;
  for (const dir of possibleDataDirs) {
    if (fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith(".xlsx"))) {
      excelDir = dir;
      break;
    }
  }

  if (excelDir) {
    console.log(`📂 Ingestion Source: Direct Excel Workbooks from "${excelDir}"`);

    // 1. CLASS-6-A.xlsx
    const file6A = path.join(excelDir, "CLASS-6-A.xlsx");
    if (fs.existsSync(file6A)) {
      const wb = XLSX.readFile(file6A);
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || !r[0]) continue;
        const roll = parseInt(String(r[0]), 10);
        const rawKey = String(r[0]).trim();
        students.push({
          classNumeric: 6,
          section: "A",
          roll,
          rawKey,
          studentId: `PTSC-2026-6-${rawKey}`,
          admissionNo: `ADM-2026-6-${rawKey}`,
          name: r[1] ? String(r[1]).trim() : `Student ${rawKey}`,
          nameBangla: r[1] ? String(r[1]).trim() : `শিক্ষার্থী ${rawKey}`,
          fatherName: r[2] ? String(r[2]).trim() : "N/A",
          motherName: r[3] ? String(r[3]).trim() : "N/A",
          dob: cleanDateOfBirth(r[4], 6),
          brn: r[5] ? String(r[5]).trim() : null,
          mobile: cleanMobileNumber(r[6]),
          gender: String(r[7] || "").toUpperCase() === "FEMALE" ? "Female" : "Male",
          religion: String(r[8] || "").toUpperCase() === "HINDU" ? "Hindu" : "Islam",
          presentAddress: `${r[10] || "Panchagarh"}, ${r[11] || "Sadar"}, ${r[12] || "Panchagarh"}`,
          permanentAddress: `${r[10] || "Panchagarh"}, ${r[11] || "Sadar"}, ${r[12] || "Panchagarh"}`,
          tradeCode: null,
          status: StudentStatus.ACTIVE,
        });
      }
    }

    // 2. CLASS-6-B.xlsx
    const file6B = path.join(excelDir, "CLASS-6-B.xlsx");
    if (fs.existsSync(file6B)) {
      const wb = XLSX.readFile(file6B);
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || !r[0]) continue;
        const roll = parseInt(String(r[0]), 10);
        const rawKey = String(r[0]).trim();
        students.push({
          classNumeric: 6,
          section: "B",
          roll,
          rawKey,
          studentId: `PTSC-2026-6-${rawKey}`,
          admissionNo: `ADM-2026-6-${rawKey}`,
          name: r[1] ? String(r[1]).trim() : `Student ${rawKey}`,
          nameBangla: r[1] ? String(r[1]).trim() : `শিক্ষার্থী ${rawKey}`,
          fatherName: r[2] ? String(r[2]).trim() : "N/A",
          motherName: r[3] ? String(r[3]).trim() : "N/A",
          dob: cleanDateOfBirth(r[4], 6),
          brn: r[5] ? String(r[5]).trim() : null,
          mobile: cleanMobileNumber(r[6]),
          gender: String(r[7] || "").toUpperCase() === "FEMALE" ? "Female" : "Male",
          religion: String(r[8] || "").toUpperCase() === "HINDU" ? "Hindu" : "Islam",
          presentAddress: `${r[10] || "Panchagarh"}, ${r[11] || "Sadar"}, ${r[12] || "Panchagarh"}`,
          permanentAddress: `${r[10] || "Panchagarh"}, ${r[11] || "Sadar"}, ${r[12] || "Panchagarh"}`,
          tradeCode: null,
          status: StudentStatus.ACTIVE,
        });
      }
    }

    // 3. CLASS-7-A.xlsx
    const file7A = path.join(excelDir, "CLASS-7-A.xlsx");
    if (fs.existsSync(file7A)) {
      const wb = XLSX.readFile(file7A);
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || !r[3]) continue;
        const roll = parseInt(String(r[3]), 10);
        const rawKey = String(r[3]).trim();
        students.push({
          classNumeric: 7,
          section: "A",
          roll,
          rawKey,
          studentId: `PTSC-2026-7-${rawKey}`,
          admissionNo: `ADM-2026-7-${rawKey}`,
          name: r[4] ? String(r[4]).trim() : `Student ${rawKey}`,
          nameBangla: r[4] ? String(r[4]).trim() : `শিক্ষার্থী ${rawKey}`,
          fatherName: r[5] ? String(r[5]).trim() : "N/A",
          motherName: r[7] ? String(r[7]).trim() : "N/A",
          dob: cleanDateOfBirth(r[8], 7),
          brn: r[9] ? String(r[9]).trim() : null,
          mobile: cleanMobileNumber(r[6]),
          gender: String(r[10] || "").toUpperCase() === "FEMALE" ? "Female" : "Male",
          religion: String(r[11] || "").toUpperCase() === "HINDU" ? "Hindu" : "Islam",
          presentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
          permanentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
          tradeCode: null,
          status: r[4] ? StudentStatus.ACTIVE : StudentStatus.INACTIVE,
        });
      }
    }

    // 4. CLASS-8-A.xlsx
    const file8A = path.join(excelDir, "CLASS-8-A.xlsx");
    if (fs.existsSync(file8A)) {
      const wb = XLSX.readFile(file8A);
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || !r[3]) continue;
        const roll = parseInt(String(r[3]), 10);
        const rawKey = String(r[3]).trim();
        students.push({
          classNumeric: 8,
          section: "A",
          roll,
          rawKey,
          studentId: `PTSC-2026-8-${rawKey}`,
          admissionNo: `ADM-2026-8-${rawKey}`,
          name: r[5] ? String(r[5]).trim() : `Student ${rawKey}`,
          nameBangla: r[5] ? String(r[5]).trim() : `শিক্ষার্থী ${rawKey}`,
          fatherName: r[9] ? String(r[9]).trim() : "N/A",
          motherName: r[11] ? String(r[11]).trim() : "N/A",
          dob: cleanDateOfBirth(r[12], 8),
          brn: null,
          mobile: cleanMobileNumber(r[10]),
          gender: "Male",
          religion: "Islam",
          presentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
          permanentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
          tradeCode: null,
          status: r[5] ? StudentStatus.ACTIVE : StudentStatus.INACTIVE,
        });
      }
    }

    // 5. CLASS-8-B.xlsx
    const file8B = path.join(excelDir, "CLASS-8-B.xlsx");
    if (fs.existsSync(file8B)) {
      const wb = XLSX.readFile(file8B);
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || !r[3]) continue;
        const roll = parseInt(String(r[3]), 10);
        const rawKey = String(r[3]).trim();
        students.push({
          classNumeric: 8,
          section: "B",
          roll,
          rawKey,
          studentId: `PTSC-2026-8-${rawKey}`,
          admissionNo: `ADM-2026-8-${rawKey}`,
          name: r[5] ? String(r[5]).trim() : `Student ${rawKey}`,
          nameBangla: r[5] ? String(r[5]).trim() : `শিক্ষার্থী ${rawKey}`,
          fatherName: r[9] ? String(r[9]).trim() : "N/A",
          motherName: r[11] ? String(r[11]).trim() : "N/A",
          dob: cleanDateOfBirth(r[12], 8),
          brn: r[13] ? String(r[13]).trim() : null,
          mobile: cleanMobileNumber(r[10]),
          gender: String(r[14] || "").toUpperCase() === "FEMALE" ? "Female" : "Male",
          religion: String(r[15] || "").toUpperCase() === "HINDU" ? "Hindu" : "Islam",
          presentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
          permanentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
          tradeCode: null,
          status: r[5] ? StudentStatus.ACTIVE : StudentStatus.INACTIVE,
        });
      }
    }

    // 6. CLASS NINE.xlsx
    const file9 = path.join(excelDir, "CLASS NINE.xlsx");
    if (fs.existsSync(file9)) {
      const wb = XLSX.readFile(file9);
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || (!r[0] && !r[3])) continue;
        const rollNum = parseInt(String(r[3] || r[0]).replace(/\D/g, ""), 10);
        const rawKey = String(r[3] || r[0]).trim();
        students.push({
          classNumeric: 9,
          section: "A",
          roll: rollNum,
          rawKey,
          studentId: `PTSC-2026-9-${rawKey}`,
          admissionNo: `ADM-2026-9-${rawKey}`,
          name: r[4] ? String(r[4]).trim() : `Student ${rawKey}`,
          nameBangla: r[4] ? String(r[4]).trim() : `শিক্ষার্থী ${rawKey}`,
          fatherName: r[5] ? String(r[5]).trim() : "N/A",
          motherName: r[8] ? String(r[8]).trim() : "N/A",
          dob: cleanDateOfBirth(r[9], 9),
          brn: null,
          mobile: cleanMobileNumber(r[7]),
          gender: String(r[10] || "").toUpperCase() === "FEMALE" ? "Female" : "Male",
          religion: String(r[11] || "").toUpperCase() === "HINDU" ? "Hindu" : "Islam",
          presentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
          permanentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
          tradeCode: resolveOfficialTradeCode(r[6], 9),
          status: StudentStatus.ACTIVE,
        });
      }
    }

    // 7. CLASS TEN.xlsx
    const file10 = path.join(excelDir, "CLASS TEN.xlsx");
    if (fs.existsSync(file10)) {
      const wb = XLSX.readFile(file10);
      const sheetName = wb.SheetNames.includes("ten-2026") ? "ten-2026" : wb.SheetNames[0];
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0 || !r[1]) continue;
        const rollNum = parseInt(String(r[1]).replace(/\D/g, ""), 10);
        const rawKey = String(r[1]).trim();
        students.push({
          classNumeric: 10,
          section: "A",
          roll: rollNum,
          rawKey,
          studentId: `PTSC-2026-10-${rawKey}`,
          admissionNo: `ADM-2026-10-${rawKey}`,
          name: r[2] ? String(r[2]).trim() : `Student ${rawKey}`,
          nameBangla: r[2] ? String(r[2]).trim() : `শিক্ষার্থী ${rawKey}`,
          fatherName: "N/A",
          motherName: "N/A",
          dob: cleanDateOfBirth(null, 10),
          brn: null,
          mobile: "01700-000000",
          gender: "Male",
          religion: "Islam",
          presentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
          permanentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
          tradeCode: resolveOfficialTradeCode(r[3], 10),
          status: StudentStatus.ACTIVE,
        });
      }
    }

    // 8. CLASS ELEVEN.xlsx (Sheet1 & Sheet2)
    const file11 = path.join(excelDir, "CLASS ELEVEN.xlsx");
    if (fs.existsSync(file11)) {
      const wb = XLSX.readFile(file11);

      // Sheet 1 (HSC Vocational Main Cohort)
      if (wb.Sheets["Sheet1"]) {
        const rows1: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Sheet1"], { header: 1 });
        for (let i = 1; i < rows1.length; i++) {
          const r = rows1[i];
          if (!r || r.length === 0 || (!r[0] && !r[2])) continue;
          const rawKey = String(r[2] || r[0]).trim();
          let rollNum: number;
          if (r[2] && !isNaN(parseInt(String(r[2]), 10))) {
            rollNum = parseInt(String(r[2]).replace(/\D/g, ""), 10);
          } else if (r[0]) {
            // 10-digit registration number: take last 6 digits to safely fit in 32-bit signed integer
            rollNum = parseInt(String(r[0]).replace(/\D/g, "").slice(-6), 10);
          } else {
            rollNum = i;
          }

          students.push({
            classNumeric: 11,
            section: "A",
            roll: rollNum,
            rawKey,
            studentId: `PTSC-2026-11-${rawKey}`,
            admissionNo: `ADM-2026-11-${rawKey}`,
            name: r[3] ? String(r[3]).trim() : `Student ${rawKey}`,
            nameBangla: r[3] ? String(r[3]).trim() : `শিক্ষার্থী ${rawKey}`,
            fatherName: r[4] ? String(r[4]).trim() : "N/A",
            motherName: r[5] ? String(r[5]).trim() : "N/A",
            dob: cleanDateOfBirth(null, 11),
            brn: r[0] ? String(r[0]).trim() : null,
            mobile: "01700-000000",
            gender: "Male",
            religion: "Islam",
            presentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
            permanentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
            tradeCode: resolveOfficialTradeCode(r[6], 11),
            status: r[3] ? StudentStatus.ACTIVE : StudentStatus.INACTIVE,
          });
        }
      }

      // Sheet 2 (HSC Vocational Specialized Cohort)
      if (wb.Sheets["Sheet2"]) {
        const rows2: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Sheet2"], { header: 1 });
        for (let i = 1; i < rows2.length; i++) {
          const r = rows2[i];
          if (!r || r.length === 0 || !r[0]) continue;
          const rawKey = String(r[0]).trim();
          const rollNum = parseInt(rawKey.replace(/\D/g, ""), 10);
          students.push({
            classNumeric: 11,
            section: "A",
            roll: rollNum,
            rawKey,
            studentId: `PTSC-2026-11-${rawKey}`,
            admissionNo: `ADM-2026-11-${rawKey}`,
            name: r[2] ? String(r[2]).trim() : `Student ${rawKey}`,
            nameBangla: r[2] ? String(r[2]).trim() : `শিক্ষার্থী ${rawKey}`,
            fatherName: r[3] ? String(r[3]).trim() : "N/A",
            motherName: r[4] ? String(r[4]).trim() : "N/A",
            dob: cleanDateOfBirth(null, 11),
            brn: null,
            mobile: cleanMobileNumber(r[6]),
            gender: String(r[7] || "").toUpperCase() === "FEMALE" ? "Female" : "Male",
            religion: String(r[8] || "").toUpperCase() === "HINDU" ? "Hindu" : "Islam",
            presentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
            permanentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
            tradeCode: resolveOfficialTradeCode(r[5], 11),
            status: StudentStatus.ACTIVE,
          });
        }
      }
    }

    return students;
  }

  // Fallback: Read from students-staging.json
  const stagingPaths = [
    path.join(__dirname, "students-staging.json"),
    path.join(process.cwd(), "students-staging.json"),
    path.join(process.cwd(), "prisma", "students-staging.json"),
  ];

  let stagingFilePath: string | null = null;
  for (const p of stagingPaths) {
    if (fs.existsSync(p)) {
      stagingFilePath = p;
      break;
    }
  }

  if (stagingFilePath) {
    console.log(`📂 Ingestion Source: Staging JSON from "${stagingFilePath}"`);
    const rawData = JSON.parse(fs.readFileSync(stagingFilePath, "utf8"));
    const records: any[] = rawData.records || [];

    for (const r of records) {
      const classNumeric = Number(r.class_candidate);
      const rawKey = String(r.class_roll || r.reg_no || r.roll_raw || String(r.seq).padStart(4, "0")).trim();
      let rollNum: number;
      if (r.class_roll) {
        rollNum = parseInt(String(r.class_roll).replace(/\D/g, ""), 10);
      } else if (r.roll_raw) {
        rollNum = parseInt(String(r.roll_raw).replace(/\D/g, ""), 10);
      } else if (r.serial_no) {
        rollNum = Number(r.serial_no);
      } else if (r.reg_no) {
        rollNum = parseInt(String(r.reg_no).slice(-6), 10);
      } else {
        rollNum = r.seq;
      }

      students.push({
        classNumeric,
        section: r.group_candidate === "B" ? "B" : "A",
        roll: rollNum,
        rawKey,
        studentId: `PTSC-2026-${classNumeric}-${rawKey}`,
        admissionNo: `ADM-2026-${classNumeric}-${rawKey}`,
        name: (r.name || r.name_raw || `Student ${rawKey}`).trim(),
        nameBangla: (r.nameBangla || r.name || r.name_raw || `শিক্ষার্থী ${rawKey}`).trim(),
        fatherName: (r.father_name || "N/A").trim(),
        motherName: (r.mother_name || "N/A").trim(),
        dob: cleanDateOfBirth(r.dob_as_read, classNumeric),
        brn: r.brn ? String(r.brn).trim() : null,
        mobile: cleanMobileNumber(r.mobile),
        gender: r.gender === "FEMALE" ? "Female" : "Male",
        religion: r.religion === "HINDU" ? "Hindu" : "Islam",
        presentAddress: `${r.post_office || "Panchagarh"}, ${r.upazila || "Sadar"}, ${r.district || "Panchagarh"}`,
        permanentAddress: `${r.post_office || "Panchagarh"}, ${r.upazila || "Sadar"}, ${r.district || "Panchagarh"}`,
        tradeCode: resolveOfficialTradeCode(
          `${r.trade_candidate || ""} ${r.trade_raw || ""} ${r.trade_code || ""}`,
          classNumeric
        ),
        status: r.name ? StudentStatus.ACTIVE : StudentStatus.INACTIVE,
      });
    }

    return students;
  }

  throw new Error("❌ No data source found! Neither prisma/data/*.xlsx nor students-staging.json could be located.");
}

// ============================================================================
// Main Execution Function
// ============================================================================
async function main() {
  console.log("============================================================================");
  console.log("🌱 PTSC ERP — COMPREHENSIVE MASTER DATA & BULK STUDENT SEEDER");
  console.log("============================================================================");

  // 1. Password Hashing with Bcrypt
  const defaultPassword = "password";
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
  console.log(`🔑 Bcrypt password hash generated for default system accounts.`);

  // 2. Master Data: Academic Year 2026
  console.log("\n📦 [1/5] Upserting Academic Year 2026...");
  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2026" },
    update: { status: "Active", isCurrent: true },
    create: {
      name: "2026",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "Active",
      isCurrent: true,
    },
  });
  console.log(`   ✓ Academic Year: ${academicYear.name} (Active, Current)`);

  // 3. Master Data: Academic Classes (6, 7, 8, 9, 10, 11)
  console.log("\n🏫 [2/5] Upserting Academic Classes (6, 7, 8, 9, 10, 11)...");
  const classConfigs = [
    { numericValue: 6, name: "Class 6", nameBangla: "ষষ্ঠ শ্রেণি", level: "general", hasTrade: false },
    { numericValue: 7, name: "Class 7", nameBangla: "সপ্তম শ্রেণি", level: "general", hasTrade: false },
    { numericValue: 8, name: "Class 8", nameBangla: "অষ্টম শ্রেণি", level: "general", hasTrade: false },
    { numericValue: 9, name: "Class 9 (Vocational)", nameBangla: "নবম শ্রেণি (ভোকেশনাল)", level: "technical", hasTrade: true },
    { numericValue: 10, name: "Class 10 (Vocational)", nameBangla: "দশম শ্রেণি (ভোকেশনাল)", level: "technical", hasTrade: true },
    { numericValue: 11, name: "Class 11 (Vocational)", nameBangla: "একাদশ শ্রেণি (ভোকেশনাল)", level: "technical", hasTrade: true },
  ];

  const classMap: Record<number, number> = {};
  for (const cfg of classConfigs) {
    const cls = await prisma.academicClass.upsert({
      where: { numericValue: cfg.numericValue },
      update: {
        name: cfg.name,
        nameBangla: cfg.nameBangla,
        level: cfg.level,
        hasTrade: cfg.hasTrade,
        sections: "A,B",
        shifts: "FIRST_SHIFT,SECOND_SHIFT",
      },
      create: {
        numericValue: cfg.numericValue,
        name: cfg.name,
        nameBangla: cfg.nameBangla,
        level: cfg.level,
        hasTrade: cfg.hasTrade,
        sections: "A,B",
        shifts: "FIRST_SHIFT,SECOND_SHIFT",
      },
    });
    classMap[cfg.numericValue] = cls.id;
    console.log(`   ✓ Class ${cfg.numericValue}: ${cfg.name} (hasTrade: ${cfg.hasTrade})`);
  }

  // 4. Master Data: Academic Sections (A, B)
  console.log("\n👥 [3/5] Upserting Academic Sections / Groups (A, B)...");
  const targetClasses = [6, 7, 8, 9, 10, 11];
  for (const classNum of targetClasses) {
    for (const secName of ["A", "B"]) {
      await prisma.academicSection.upsert({
        where: {
          unique_year_class_section: {
            academicYear: "2026",
            classNumeric: classNum,
            sectionName: secName,
          },
        },
        update: { status: "Active" },
        create: {
          academicYear: "2026",
          classNumeric: classNum,
          className: `Class ${classNum}`,
          sectionName: secName,
          status: "Active",
        },
      });
    }
  }
  console.log(`   ✓ Seeded Sections A and B across Classes 6, 7, 8, 9, 10, and 11.`);

  // 5. Master Data: The 4 Official Institutional Trades
  console.log("\n⚙️ [4/5] Upserting Official 4 Technical Trades...");
  const officialTrades = [
    {
      code: "GE",
      name: "General Electronics",
      nameBangla: "জেনারেল ইলেকট্রনিক্স",
      description: "অ্যানালগ ও ডিজিটাল ইলেকট্রনিক্স, সার্কিট ডিজাইন, মাইক্রোকন্ট্রোলার ও অটোমেশন প্রযুক্তি।",
      duration: "2 Years (SSC) / 2 Years (HSC)",
      intakeCapacity: 80,
      totalLabs: 2,
      badgeGradient: "from-blue-600 to-indigo-700",
      iconName: "Cpu",
    },
    {
      code: "IT-IoT",
      name: "IT Support and IoT Basics",
      nameBangla: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
      description: "কম্পিউটার হার্ডওয়্যার, নেটওয়ার্কিং, ইন্টারনেট অব থিংস (IoT) সেন্সর প্রোগ্রামিং ও স্মার্ট সিস্টেম।",
      duration: "2 Years (SSC) / 2 Years (HSC)",
      intakeCapacity: 80,
      totalLabs: 3,
      badgeGradient: "from-cyan-500 to-blue-600",
      iconName: "Wifi",
    },
    {
      code: "EE",
      name: "General Electrical Workshop",
      nameBangla: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কশপ",
      description: "হাউস ও ইন্ডাস্ট্রিয়াল ওয়্যারিং, মোটর ওয়াইন্ডিং, সাব-স্টেশন রক্ষণাবেক্ষণ ও সৌরবিদ্যুৎ সংযোগ। (General Electrical Works)",
      duration: "2 Years (SSC) / 2 Years (HSC)",
      intakeCapacity: 80,
      totalLabs: 2,
      badgeGradient: "from-amber-500 to-orange-600",
      iconName: "Zap",
    },
    {
      code: "AMB",
      name: "Apparel Manufacturing Basics",
      nameBangla: "অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস",
      description: "গার্মেন্টস টেকনোলজি, প্যাটার্ন ডিজাইন, ইন্ডাস্ট্রিয়াল সুইং মেশিন চালনা ও কোয়ালিটি কন্ট্রোল।",
      duration: "2 Years (SSC) / 2 Years (HSC)",
      intakeCapacity: 80,
      totalLabs: 2,
      badgeGradient: "from-fuchsia-600 to-rose-600",
      iconName: "Scissors",
    },
  ];

  const tradeMap: Record<string, number> = {};
  for (const t of officialTrades) {
    const tradeRecord = await prisma.trade.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        nameBangla: t.nameBangla,
        description: t.description,
        duration: t.duration,
        intakeCapacity: t.intakeCapacity,
        totalLabs: t.totalLabs,
        badgeGradient: t.badgeGradient,
        iconName: t.iconName,
      },
      create: t,
    });
    tradeMap[t.code] = tradeRecord.id;
    console.log(`   ✓ Trade [${t.code}]: ${t.name} (DB ID: ${tradeRecord.id})`);
  }

  // 6. Master Data: Core System Roles & Test Users
  console.log("\n🛡️ Upserting Core RBAC Roles & System Credentials...");
  const roles = [
    { name: "super_admin", displayName: "Super Administrator", displayNameBangla: "সুপার অ্যাডমিনিস্ট্রেটর", level: 100, isSystemRole: true },
    { name: "admin", displayName: "System Administrator", displayNameBangla: "সিস্টেম অ্যাডমিনিস্ট্রেটর", level: 80, isSystemRole: true },
    { name: "principal", displayName: "Principal", displayNameBangla: "অধ্যক্ষ", level: 90, isSystemRole: true },
    { name: "teacher", displayName: "Faculty / Teacher", displayNameBangla: "শিক্ষক / প্রশিক্ষক", level: 50, isSystemRole: true },
    { name: "student", displayName: "Student", displayNameBangla: "শিক্ষার্থী", level: 10, isSystemRole: true },
  ];

  const roleMap: Record<string, number> = {};
  for (const r of roles) {
    const roleRecord = await prisma.roleDefinition.upsert({
      where: { name: r.name },
      update: { displayName: r.displayName, displayNameBangla: r.displayNameBangla, level: r.level },
      create: r,
    });
    roleMap[r.name] = roleRecord.id;
  }

  // Admin User: admin / password
  await prisma.systemUser.upsert({
    where: { email: "admin@pgtsc.gov.bd" },
    update: { passwordHash: hashedPassword, roleName: "admin", roleId: roleMap["admin"], fullName: "Kazi Nurul Huda", nameBangla: "কাজী নুরুল হুদা", isActive: true },
    create: { email: "admin@pgtsc.gov.bd", passwordHash: hashedPassword, roleName: "admin", roleId: roleMap["admin"], fullName: "Kazi Nurul Huda", nameBangla: "কাজী নুরুল হুদা", isActive: true },
  });
  await prisma.systemUser.upsert({
    where: { email: "admin" },
    update: { passwordHash: hashedPassword, roleName: "admin", roleId: roleMap["admin"], fullName: "Administrator", nameBangla: "প্রশাসক", isActive: true },
    create: { email: "admin", passwordHash: hashedPassword, roleName: "admin", roleId: roleMap["admin"], fullName: "Administrator", nameBangla: "প্রশাসক", isActive: true },
  });

  // Teacher User: teacher / password
  const teacherFaculty = await prisma.faculty.upsert({
    where: { employeeId: "FAC-003" },
    update: {
      email: "teacher@pgtsc.gov.bd",
      name: "Engr. Mahmudul Hasan",
      nameBangla: "প্রকৌ. মাহমুদুল হাসান",
      designation: "চিফ ইন্সট্রাক্টর (আইটি ও আইওটি)",
      department: "কম্পিউটার ও আইওটি",
      qualification: "B.Sc in Computer Science & Engineering",
      joiningDate: "2018-03-01",
      mobile: "01711-000003",
      tradeId: tradeMap["IT-IoT"],
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80",
    },
    create: {
      employeeId: "FAC-003",
      email: "teacher@pgtsc.gov.bd",
      name: "Engr. Mahmudul Hasan",
      nameBangla: "প্রকৌ. মাহমুদুল হাসান",
      designation: "চিফ ইন্সট্রাক্টর (আইটি ও আইওটি)",
      department: "কম্পিউটার ও আইওটি",
      qualification: "B.Sc in Computer Science & Engineering",
      joiningDate: "2018-03-01",
      mobile: "01711-000003",
      tradeId: tradeMap["IT-IoT"],
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80",
    },
  });

  await prisma.systemUser.upsert({
    where: { email: "teacher@pgtsc.gov.bd" },
    update: { passwordHash: hashedPassword, roleName: "teacher", roleId: roleMap["teacher"], facultyId: teacherFaculty.id, fullName: "Engr. Mahmudul Hasan", nameBangla: "প্রকৌ. মাহমুদুল হাসান", isActive: true },
    create: { email: "teacher@pgtsc.gov.bd", passwordHash: hashedPassword, roleName: "teacher", roleId: roleMap["teacher"], facultyId: teacherFaculty.id, fullName: "Engr. Mahmudul Hasan", nameBangla: "প্রকৌ. মাহমুদুল হাসান", isActive: true },
  });
  await prisma.systemUser.upsert({
    where: { email: "teacher" },
    update: { passwordHash: hashedPassword, roleName: "teacher", roleId: roleMap["teacher"], fullName: "Engr. Mahmudul Hasan", nameBangla: "প্রকৌ. মাহমুদুল হাসান", isActive: true },
    create: { email: "teacher", passwordHash: hashedPassword, roleName: "teacher", roleId: roleMap["teacher"], fullName: "Engr. Mahmudul Hasan", nameBangla: "প্রকৌ. মাহমুদুল হাসান", isActive: true },
  });
  console.log(`   ✓ Admin ("admin") and Teacher ("teacher") credentials ready.`);

  // 6.1 Master Faculty & Instructors
  console.log("\n👨‍🏫 Upserting Official PTSC Faculty & Instructors...");
  const officialFaculty = [
    { employeeId: "EMP-001", name: "Dr. Engr. Md. Rafiqul Islam", nameBangla: "ড. প্রকৌশলী মো. রফিকুল ইসলাম", designation: "অধ্যক্ষ", department: "প্রশাসনিক ও একাডেমিক", qualification: "B.Sc Engr. (EEE), M.Sc, Ph.D", joiningDate: "2015-03-01", mobile: "01712-394347", email: "principal@tsc.panchagarh.gov.bd", order: 1 },
    { employeeId: "EMP-201", name: "Abdul Matin Dali", nameBangla: "আব্দুল মতিন ডালি", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল বিভাগ", qualification: "B.Sc in Engineering", joiningDate: "2018-01-10", mobile: "01700-000201", email: "abdulmatin@pgtsc.gov.bd", order: 2 },
    { employeeId: "EMP-202", name: "Abu Kalam", nameBangla: "আবু কালাম", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল বিভাগ", qualification: "B.Sc in Engineering", joiningDate: "2018-01-10", mobile: "01700-000202", email: "abukalam@pgtsc.gov.bd", order: 3 },
    { employeeId: "EMP-203", name: "Bidush Roy", nameBangla: "বিদুশ রায়", designation: "জুনিয়র ইন্সট্রাক্টর", department: "সাধারণ বিভাগ", qualification: "B.Sc / Diploma", joiningDate: "2019-02-10", mobile: "01700-000203", email: "bidushroy@pgtsc.gov.bd", order: 4 },
    { employeeId: "EMP-204", name: "Chandana Roy", nameBangla: "চন্দনা রায়", designation: "জুনিয়র ইন্সট্রাক্টর", department: "সাধারণ বিভাগ", qualification: "B.Sc / Diploma", joiningDate: "2019-02-10", mobile: "01700-000204", email: "chandanaroy@pgtsc.gov.bd", order: 5 },
    { employeeId: "EMP-205", name: "Dipak Roy", nameBangla: "দীপক রায়", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল বিভাগ", qualification: "B.Sc in Engineering", joiningDate: "2017-05-12", mobile: "01700-000205", email: "dipakroy@pgtsc.gov.bd", order: 6 },
    { employeeId: "EMP-206", name: "Gourango Nath Roy", nameBangla: "গৌরাঙ্গ নাথ রায়", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল বিভাগ", qualification: "B.Sc in Engineering", joiningDate: "2017-05-12", mobile: "01700-000206", email: "gourangoroy@pgtsc.gov.bd", order: 7 },
    { employeeId: "EMP-207", name: "Jagesh Chandra Paul", nameBangla: "জগেশ চন্দ্র পাল", designation: "জুনিয়র ইন্সট্রাক্টর", department: "গণিত ও বিজ্ঞান", qualification: "B.Sc / Diploma", joiningDate: "2018-06-15", mobile: "01700-000207", email: "jageshpaul@pgtsc.gov.bd", order: 8 },
    { employeeId: "EMP-208", name: "Joydeb Chandra Roy", nameBangla: "জয়দেব চন্দ্র রায়", designation: "ইন্সট্রাক্টর", department: "ধর্ম ও নৈতিক শিক্ষা", qualification: "M.A / B.Ed", joiningDate: "2016-08-20", mobile: "01700-000208", email: "joydebroy@pgtsc.gov.bd", order: 9 },
    { employeeId: "EMP-209", name: "Kajal Chakroborty", nameBangla: "কাজল চক্রবর্তী", designation: "জুনিয়র ইন্সট্রাক্টর", department: "রসায়ন ও পদার্থ", qualification: "B.Sc", joiningDate: "2019-09-10", mobile: "01700-000209", email: "kajal@pgtsc.gov.bd", order: 10 },
    { employeeId: "EMP-210", name: "Kamla Kanto Barman", nameBangla: "কমলা কান্ত বর্মণ", designation: "ইন্সট্রাক্টর", department: "পদার্থবিজ্ঞান", qualification: "M.Sc in Physics", joiningDate: "2015-11-05", mobile: "01700-000210", email: "kamlakanto@pgtsc.gov.bd", order: 11 },
    { employeeId: "EMP-211", name: "Manik Chandra Shorma", nameBangla: "মানিক চন্দ্র শর্মা", designation: "জুনিয়র ইন্সট্রাক্টর", department: "ভোকেশনাল", qualification: "Diploma in Engineering", joiningDate: "2020-01-15", mobile: "01700-000211", email: "manikshorma@pgtsc.gov.bd", order: 12 },
    { employeeId: "EMP-212", name: "Md Sofiul Alom", nameBangla: "মো. সোফিউল আলম", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল", qualification: "B.Sc in Engineering", joiningDate: "2017-03-20", mobile: "01700-000212", email: "sofiulalom@pgtsc.gov.bd", order: 13 },
    { employeeId: "EMP-213", name: "Md. Abdul Aziz", nameBangla: "মো. আব্দুল আজিজ", designation: "জুনিয়র ইন্সট্রাক্টর", department: "বিজ্ঞান বিভাগ", qualification: "B.Sc", joiningDate: "2019-04-10", mobile: "01700-000213", email: "abdulaziz@pgtsc.gov.bd", order: 14 },
    { employeeId: "EMP-214", name: "Md. Abubakar Siddique", nameBangla: "মো. আবুবকার সিদ্দিক", designation: "ইন্সট্রাক্টর", department: "ভাষা ও সাহিত্য", qualification: "M.A in Bangla", joiningDate: "2016-05-15", mobile: "01700-000214", email: "abubakar@pgtsc.gov.bd", order: 15 },
    { employeeId: "EMP-215", name: "Md. Afsar Ud Zaman", nameBangla: "মো. আফসার উদ্দ জামান", designation: "জুনিয়র ইন্সট্রাক্টর", department: "বিজ্ঞান", qualification: "B.Sc", joiningDate: "2020-02-10", mobile: "01700-000215", email: "afsar@pgtsc.gov.bd", order: 16 },
    { employeeId: "EMP-216", name: "Md. Babul Hossain", nameBangla: "মো. বাবুল হোসেন", designation: "ইন্সট্রাক্টর", department: "গণিত", qualification: "M.Sc in Math", joiningDate: "2015-08-12", mobile: "01700-000216", email: "babulhossain@pgtsc.gov.bd", order: 17 },
    { employeeId: "EMP-217", name: "Md. Hafezul islam", nameBangla: "মো. হাফেজুল ইসলাম", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল", qualification: "B.Sc in Engineering", joiningDate: "2018-09-10", mobile: "01700-000217", email: "hafezul@pgtsc.gov.bd", order: 18 },
    { employeeId: "EMP-218", name: "Md. Zuyel Rana", nameBangla: "মোহাম্মদ জুয়েল রানা", designation: "জুনিয়র ইন্সট্রাক্টর (কম্পিউটার)", department: "আইটি সাপোর্ট অ্যান্ড আইওটি", qualification: "B.Sc in CSE", joiningDate: "2025-01-10", mobile: "01700-000218", email: "zuyelrana@pgtsc.gov.bd", order: 19 },
    { employeeId: "EMP-219", name: "Mithun Roy", nameBangla: "মিথুন রায়", designation: "জুনিয়র ইন্সট্রাক্টর", department: "কম্পিউটার", qualification: "Diploma in CSE", joiningDate: "2021-03-15", mobile: "01700-000219", email: "mithunroy@pgtsc.gov.bd", order: 20 },
    { employeeId: "EMP-220", name: "Mukti Rani Paul", nameBangla: "মুক্তি রানী পাল", designation: "জুনিয়র ইন্সট্রাক্টর", department: "সাধারণ শিক্ষা", qualification: "B.A / B.Ed", joiningDate: "2019-06-20", mobile: "01700-000220", email: "muktirani@pgtsc.gov.bd", order: 21 },
    { employeeId: "EMP-221", name: "Sandip Kumar Roy", nameBangla: "সন্দীপ কুমার রায়", designation: "জুনিয়র ইন্সট্রাক্টর", department: "সাধারণ শিক্ষা", qualification: "B.Sc", joiningDate: "2020-04-10", mobile: "01700-000221", email: "sandiproy@pgtsc.gov.bd", order: 22 },
    { employeeId: "EMP-222", name: "Sujan Ali", nameBangla: "সুজন আলী", designation: "জুনিয়র ইন্সট্রাক্টর", department: "ধর্ম শিক্ষা", qualification: "M.A", joiningDate: "2018-11-15", mobile: "01700-000222", email: "sujanali@pgtsc.gov.bd", order: 23 },
  ];

  for (const f of officialFaculty) {
    await prisma.faculty.upsert({
      where: { employeeId: f.employeeId },
      update: {
        name: f.name,
        nameBangla: f.nameBangla,
        designation: f.designation,
        department: f.department,
        qualification: f.qualification,
        joiningDate: f.joiningDate,
        mobile: f.mobile,
        email: f.email,
        order: f.order,
        type: FacultyType.FACULTY,
      },
      create: {
        employeeId: f.employeeId,
        name: f.name,
        nameBangla: f.nameBangla,
        designation: f.designation,
        department: f.department,
        qualification: f.qualification,
        joiningDate: f.joiningDate,
        mobile: f.mobile,
        email: f.email,
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80",
        order: f.order,
        type: FacultyType.FACULTY,
      },
    });
  }
  console.log(`   ✓ Seeded ${officialFaculty.length + 1} faculty members into DB.`);

  // 7. Load Student Records
  console.log("\n📊 [5/5] Ingesting Student Records across All Classes...");
  const studentRecords = loadStudentRecordsFromExcelOrStaging();
  console.log(`   ✓ Found ${studentRecords.length} validated student records to ingest.`);

  // Clean existing student records for pristine idempotency
  console.log(`   🧹 Clearing existing student table for pristine idempotent seed...`);
  await prisma.student.deleteMany();

  // Ingest in isolated transactional chunks of 100
  const batchSize = 100;
  let successCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < studentRecords.length; i += batchSize) {
    const batch = studentRecords.slice(i, i + batchSize);

    await prisma.$transaction(
      async (tx) => {
        for (const s of batch) {
          const classId = classMap[s.classNumeric];
          if (!classId) {
            throw new Error(`Invalid class numeric ${s.classNumeric} for student ${s.studentId}`);
          }

          const tradeId = s.tradeCode ? tradeMap[s.tradeCode] || null : null;
          const photoUrl = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80";

          await tx.student.upsert({
            where: { studentId: s.studentId },
            update: {
              roll: s.roll,
              admissionNo: s.admissionNo,
              name: s.name,
              nameBangla: s.nameBangla,
              gender: s.gender,
              dob: s.dob,
              bloodGroup: "B+",
              birthRegNo: s.brn,
              fatherName: s.fatherName,
              motherName: s.motherName,
              guardianMobile: s.mobile,
              studentMobile: s.mobile === "01700-000000" ? null : s.mobile,
              email: `student.${s.roll}.${s.classNumeric}@pgtsc.gov.bd`,
              presentAddress: s.presentAddress,
              permanentAddress: s.permanentAddress,
              classId,
              tradeId,
              section: s.section,
              session: "2026",
              status: s.status,
              shift: Shift.FIRST_SHIFT,
              shiftBangla: "১ম শিফট",
            },
            create: {
              studentId: s.studentId,
              admissionNo: s.admissionNo,
              roll: s.roll,
              name: s.name,
              nameBangla: s.nameBangla,
              gender: s.gender,
              dob: s.dob,
              bloodGroup: "B+",
              birthRegNo: s.brn,
              fatherName: s.fatherName,
              motherName: s.motherName,
              guardianMobile: s.mobile,
              studentMobile: s.mobile === "01700-000000" ? null : s.mobile,
              email: `student.${s.roll}.${s.classNumeric}@pgtsc.gov.bd`,
              presentAddress: s.presentAddress,
              permanentAddress: s.permanentAddress,
              photoUrl,
              classId,
              tradeId,
              shift: Shift.FIRST_SHIFT,
              shiftBangla: "১ম শিফট",
              section: s.section,
              session: "2026",
              status: s.status,
            },
          });

          successCount++;
        }
      },
      {
        maxWait: 15000,
        timeout: 60000,
      }
    );

    const progress = Math.min(i + batchSize, studentRecords.length);
    const percent = ((progress / studentRecords.length) * 100).toFixed(1);
    console.log(`   ⏳ Ingestion progress: ${progress}/${studentRecords.length} records (${percent}%)`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ Ingested ${successCount} student records across classes 6, 7, 8, 9, 10, 11 in ${durationSec}s.`);

  // Dev Demo Student Account (Roll 101, Class 9)
  const class9Id = classMap[9];
  if (class9Id) {
    await prisma.student.upsert({
      where: { studentId: "PTSC-2026-9-101" },
      update: {
        admissionNo: "ADM-TEST-0101",
        roll: 101,
        name: "Tanvir Ahmed",
        nameBangla: "তানভীর আহমেদ",
        gender: "Male",
        dob: "2010-05-15",
        bloodGroup: "A+",
        fatherName: "Abdur Rashid",
        motherName: "Tahmina Begum",
        guardianMobile: "01711-101101",
        studentMobile: "01811-101101",
        email: "student.101@pgtsc.gov.bd",
        presentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
        permanentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
        photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80",
        classId: class9Id,
        tradeId: tradeMap["IT-IoT"],
        section: "A",
        session: "2026",
        shift: Shift.FIRST_SHIFT,
        shiftBangla: "১ম শিফট",
        status: StudentStatus.ACTIVE,
      },
      create: {
        studentId: "PTSC-2026-9-101",
        admissionNo: "ADM-TEST-0101",
        roll: 101,
        name: "Tanvir Ahmed",
        nameBangla: "তানভীর আহমেদ",
        gender: "Male",
        dob: "2010-05-15",
        bloodGroup: "A+",
        fatherName: "Abdur Rashid",
        motherName: "Tahmina Begum",
        guardianMobile: "01711-101101",
        studentMobile: "01811-101101",
        email: "student.101@pgtsc.gov.bd",
        presentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
        permanentAddress: "পঞ্চগড় সদর, পঞ্চগড়",
        photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80",
        classId: class9Id,
        tradeId: tradeMap["IT-IoT"],
        section: "A",
        session: "2026",
        shift: Shift.FIRST_SHIFT,
        shiftBangla: "১ম শিফট",
        status: StudentStatus.ACTIVE,
      },
    });
    console.log(`   ✓ Dev Test Student ready: Roll 101 (Class 9) for portal testing.`);
  }

  // 8. Verification & Summary Report
  const totalStudentsInDb = await prisma.student.count();
  const classBreakdown = await prisma.academicClass.findMany({
    include: {
      _count: {
        select: { students: true },
      },
    },
    orderBy: { numericValue: "asc" },
  });

  const tradeBreakdown = await prisma.trade.findMany({
    include: {
      _count: {
        select: { students: true },
      },
    },
    orderBy: { code: "asc" },
  });

  console.log("\n============================================================================");
  console.log("📊 PTSC DATABASE SEEDING VERIFICATION SUMMARY");
  console.log("============================================================================");
  console.log(`Total Students in Database: ${totalStudentsInDb}`);
  console.log("\n📌 Distribution by Academic Class:");
  for (const c of classBreakdown) {
    console.log(`   - Class ${c.numericValue.toString().padEnd(2)} (${c.name}): ${c._count.students} students`);
  }

  console.log("\n📌 Distribution by Technical Trade (Classes 9, 10 & 11):");
  for (const t of tradeBreakdown) {
    console.log(`   - [${t.code.padEnd(6)}] ${t.name.padEnd(30)}: ${t._count.students} students`);
  }

  console.log("\n🔐 Default System Login Credentials:");
  console.log("   - Admin:   username: admin   | password: password");
  console.log("   - Teacher: username: teacher | password: password");
  console.log("   - Student: roll/id:  101     | password: password (or 1234)");
  console.log("============================================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Fatal Error during PTSC database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
