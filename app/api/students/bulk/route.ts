import { NextResponse } from "next/server";
import { institutionalDb, Student } from "@/lib/database";
import {
  doesClassHaveTrade,
  isTradeValidForClass,
  parseClassNumeric,
} from "@/lib/academicStructure";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, studentIds, updates, filterContext, performedBy = "Admin" } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "কোনো শিক্ষার্থী নির্বাচিত করা হয়নি।" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const auditLogId = `BULK-${Date.now()}`;
    const successList: string[] = [];
    const errorList: { studentId: string; name: string; error: string }[] = [];

    // Helper to find student
    const getStudent = (id: string | number) => {
      return institutionalDb.students.find(
        (s) => s.id === Number(id) || s.studentId === String(id)
      );
    };

    switch (action) {
      case "BULK_SECTION_UPDATE": {
        const { targetSection } = updates || {};
        if (!targetSection) {
          return NextResponse.json(
            { success: false, error: "টার্গেট শাখা (Section) নির্বাচন আবশ্যক।" },
            { status: 400 }
          );
        }

        studentIds.forEach((id) => {
          const student = getStudent(id);
          if (!student) {
            errorList.push({ studentId: String(id), name: "Unknown", error: "শিক্ষার্থী পাওয়া যায়নি" });
            return;
          }

          // Check if roll conflicts in the new section
          const conflict = institutionalDb.students.some(
            (s) =>
              s.id !== student.id &&
              s.classId === student.classId &&
              s.session === student.session &&
              s.section === targetSection &&
              Number(s.roll) === Number(student.roll)
          );

          if (conflict) {
            errorList.push({
              studentId: student.studentId,
              name: student.name,
              error: `শাখা ${targetSection}-এ ইতিমধ্যে রোল ${student.roll} বিদ্যমান।`,
            });
            return;
          }

          student.section = targetSection;
          successList.push(student.studentId);
        });
        break;
      }

      case "BULK_TRADE_UPDATE": {
        const { targetTradeId } = updates || {};
        if (!targetTradeId) {
          return NextResponse.json(
            { success: false, error: "টার্গেট কারিগরি ট্রেড (Trade) নির্বাচন আবশ্যক।" },
            { status: 400 }
          );
        }

        const tId = Number(targetTradeId);
        const matchedTrade = institutionalDb.trades.find((t) => t.id === tId);

        if (!matchedTrade) {
          return NextResponse.json(
            { success: false, error: "নির্বাচিত কারিগরি ট্রেডটি ডাটাবেসে পাওয়া যায়নি।" },
            { status: 400 }
          );
        }

        studentIds.forEach((id) => {
          const student = getStudent(id);
          if (!student) {
            errorList.push({ studentId: String(id), name: "Unknown", error: "শিক্ষার্থী পাওয়া যায়নি" });
            return;
          }

          const clsNum = parseClassNumeric(student.classId);
          // Strict Academic Rule: Class 6-8 cannot have trade
          if (!doesClassHaveTrade(clsNum)) {
            errorList.push({
              studentId: student.studentId,
              name: student.name,
              error: `শ্রেণি ${clsNum}-এ কোনো কারিগরি ট্রেড প্রযোজ্য নয় (Pre-Vocational)।`,
            });
            return;
          }

          // Validate trade for class
          if (!isTradeValidForClass(clsNum, tId)) {
            errorList.push({
              studentId: student.studentId,
              name: student.name,
              error: `ট্রেড (${matchedTrade.nameBangla}) শ্রেণি ${clsNum}-এর জন্য অনুমোদিত নয়।`,
            });
            return;
          }

          student.tradeId = matchedTrade.id;
          student.tradeName = matchedTrade.name;
          student.tradeNameBangla = matchedTrade.nameBangla;
          successList.push(student.studentId);
        });
        break;
      }

      case "BULK_STATUS_UPDATE": {
        const { targetStatus } = updates || {};
        const allowedStatuses = ["Active", "Inactive", "Transferred", "Dropped", "Graduated", "Alumni", "Archived"];
        if (!targetStatus || !allowedStatuses.includes(targetStatus)) {
          return NextResponse.json(
            { success: false, error: "সঠিক স্ট্যাটাস নির্বাচন করুন।" },
            { status: 400 }
          );
        }

        studentIds.forEach((id) => {
          const student = getStudent(id);
          if (!student) {
            errorList.push({ studentId: String(id), name: "Unknown", error: "শিক্ষার্থী পাওয়া যায়নি" });
            return;
          }

          student.status = targetStatus;
          successList.push(student.studentId);
        });
        break;
      }

      case "BULK_EDIT": {
        const {
          section,
          shift,
          presentAddress,
          permanentAddress,
          status,
          guardianRelationship,
          session,
        } = updates || {};

        studentIds.forEach((id) => {
          const student = getStudent(id);
          if (!student) {
            errorList.push({ studentId: String(id), name: "Unknown", error: "শিক্ষার্থী পাওয়া যায়নি" });
            return;
          }

          // Field-level change control: only apply non-empty, explicitly provided fields
          if (section !== undefined && section.trim() !== "") {
            student.section = section.trim();
          }
          if (shift !== undefined && shift.trim() !== "") {
            student.shift = shift as any;
            student.shiftBangla = shift === "Second Shift" ? "২য় শিফট" : "১ম শিফট";
          }
          if (presentAddress !== undefined && presentAddress.trim() !== "") {
            student.presentAddress = presentAddress.trim();
          }
          if (permanentAddress !== undefined && permanentAddress.trim() !== "") {
            student.permanentAddress = permanentAddress.trim();
          }
          if (status !== undefined && status.trim() !== "") {
            student.status = status;
          }
          if (guardianRelationship !== undefined && guardianRelationship.trim() !== "") {
            student.guardianRelationship = guardianRelationship.trim();
          }
          if (session !== undefined && session.trim() !== "") {
            student.session = session.trim();
          }

          successList.push(student.studentId);
        });
        break;
      }

      case "BULK_ARCHIVE": {
        studentIds.forEach((id) => {
          const student = getStudent(id);
          if (!student) {
            errorList.push({ studentId: String(id), name: "Unknown", error: "শিক্ষার্থী পাওয়া যায়নি" });
            return;
          }

          // Soft delete / archive safety
          student.status = "Archived";
          successList.push(student.studentId);
        });
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `অসমর্থিত বাল্ক অপারেশন: ${action}` },
          { status: 400 }
        );
    }

    // Log the bulk audit entry
    const auditRecord = {
      id: auditLogId,
      timestamp,
      performedBy,
      action,
      totalRequested: studentIds.length,
      successCount: successList.length,
      failureCount: errorList.length,
      affectedStudentIds: successList,
      fieldUpdates: updates,
    };

    return NextResponse.json({
      success: true,
      action,
      totalRequested: studentIds.length,
      successCount: successList.length,
      failureCount: errorList.length,
      affectedStudentIds: successList,
      errors: errorList,
      auditRecord,
      message: `${successList.length} জন শিক্ষার্থীর তথ্য সফলভাবে হালনাগাদ করা হয়েছে।${
        errorList.length > 0 ? ` (${errorList.length} জনের ক্ষেত্রে সতর্কতা/ত্রুটি হয়েছে)` : ""
      }`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
