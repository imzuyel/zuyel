import { NextRequest, NextResponse } from "next/server";
import {
  getAllClassConfigurations,
  getAllTradeConfigurations,
  updateClassConfiguration,
  updateTradeConfiguration,
  getSingleSourceSubjects,
  ClassConfiguration,
  TradeConfiguration,
} from "@/lib/globalSubjectMappingHub";
import {
  getSubjectMasters,
  getSubjectMappings,
  saveSubjectMapping,
  removeSubjectMapping,
  createSubjectMaster,
  updateSubjectMaster,
  getSubjectAuditLogs,
  AcademicSubjectMapping,
} from "@/lib/subjectEngine";
import { parseClassNumeric, doesClassHaveTrade, getApplicableTradesForClass, ALL_TRADES } from "@/lib/academicStructure";
import { requireAdmin } from "@/lib/serverAuthGuard";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "overview";
    const academicYear = searchParams.get("academicYear") || "2026";

    // 1. Overview summary stats
    if (action === "overview") {
      const classes = getAllClassConfigurations();
      const trades = getAllTradeConfigurations();
      const masters = getSubjectMasters({ status: "Active" });
      const mappings = getSubjectMappings({ academicYear });

      const totalSeats = classes.reduce((sum, c) => sum + (c.totalSeats || 0), 0);
      const totalTradeSeats = trades.reduce((sum, t) => sum + (t.seats || 0), 0);

      return NextResponse.json({
        success: true,
        academicYear,
        summary: {
          totalClasses: classes.length,
          totalTrades: trades.length,
          totalMasterSubjects: masters.length,
          totalMappedSubjects: mappings.length,
          totalSanctionedSeats: totalSeats,
          totalTradeSeats,
        },
        classes,
        trades,
      });
    }

    // 2. Class & Trade configurations
    if (action === "classes") {
      const classes = getAllClassConfigurations();
      const trades = getAllTradeConfigurations();
      return NextResponse.json({
        success: true,
        classes,
        trades,
      });
    }

    // 3. Mapped subjects for Class & Trade (Single Source of Truth)
    if (action === "mapped_subjects") {
      const classVal = searchParams.get("classVal") || searchParams.get("classId");
      if (!classVal) {
        return NextResponse.json({ success: false, error: "classVal parameter is required" }, { status: 400 });
      }

      const tradeVal = searchParams.get("tradeVal") || searchParams.get("tradeId") || undefined;
      const subjects = getSingleSourceSubjects({
        classVal,
        tradeVal,
        academicYear,
        includeInactive: false,
      });

      const numericClass = parseClassNumeric(classVal);
      const hasTrade = doesClassHaveTrade(numericClass);
      const applicableTrades = hasTrade ? getApplicableTradesForClass(numericClass) : [];

      return NextResponse.json({
        success: true,
        academicYear,
        classNumeric: numericClass,
        hasTrade,
        applicableTrades,
        count: subjects.length,
        subjects,
      });
    }

    // 4. Master Subjects Catalog
    if (action === "master_subjects") {
      const search = searchParams.get("search") || undefined;
      const type = searchParams.get("type") || undefined;
      const subjects = getSubjectMasters({ search, type, status: "Active" });
      return NextResponse.json({
        success: true,
        count: subjects.length,
        subjects,
      });
    }

    // 5. Subject Mapping Audit Logs
    if (action === "audit_logs") {
      const limit = Number(searchParams.get("limit") || 50);
      const logs = getSubjectAuditLogs(limit);
      return NextResponse.json({
        success: true,
        count: logs.length,
        logs,
      });
    }

    // Default fallback
    return NextResponse.json({
      success: true,
      message: "PTSC Global Settings & Subject Mapping API active.",
    });
  } catch (error: any) {
    console.error("GET /api/academic/global-settings error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "academic-settings:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { action } = body;

    // 1. Save or Update Subject Mapping
    if (action === "save_mapping") {
      const { mapping, user = "Admin" } = body;
      if (!mapping || !mapping.classId || !mapping.subjectId) {
        return NextResponse.json(
          { success: false, error: "Missing required mapping properties: classId and subjectId" },
          { status: 400 }
        );
      }

      const res = saveSubjectMapping(mapping, user);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Subject successfully mapped.",
        mapping: res.mapping,
      });
    }

    // 2. Delete / Unmap Subject
    if (action === "delete_mapping") {
      const { mappingId, user = "Admin" } = body;
      if (!mappingId) {
        return NextResponse.json({ success: false, error: "mappingId is required" }, { status: 400 });
      }

      const res = removeSubjectMapping(mappingId, user);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Subject mapping removed successfully.",
      });
    }

    // 3. Update Class Configuration
    if (action === "update_class") {
      const { classId, updates } = body;
      if (!classId || !updates) {
        return NextResponse.json({ success: false, error: "classId and updates are required" }, { status: 400 });
      }

      const updated = updateClassConfiguration(Number(classId), updates);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Class configuration updated successfully.",
        classConfig: updated,
      });
    }

    // 4. Update Trade Configuration
    if (action === "update_trade") {
      const { tradeId, updates } = body;
      if (!tradeId || !updates) {
        return NextResponse.json({ success: false, error: "tradeId and updates are required" }, { status: 400 });
      }

      const updated = updateTradeConfiguration(Number(tradeId), updates);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Trade not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Trade configuration updated successfully.",
        tradeConfig: updated,
      });
    }

    // 5. Apply Official BTEB / NCTB Presets for a Class
    if (action === "apply_preset") {
      const { classVal, tradeVal, academicYear = "2026", user = "Admin" } = body;
      const numericClass = parseClassNumeric(classVal);
      if (!numericClass) {
        return NextResponse.json({ success: false, error: "Invalid class" }, { status: 400 });
      }

      const masters = getSubjectMasters({ status: "Active" });
      const addedMappings: AcademicSubjectMapping[] = [];

      // Determine subjects based on class & trade
      if (numericClass <= 8) {
        // Class 6-8: NCTB Pre-Vocational Subjects (Bangla, English, Math, Science, Religion, ICT)
        const prevocCodes = ["061", "062", "063", "064", "065", "066"];
        for (const code of prevocCodes) {
          const sub = masters.find((m) => m.code === code);
          if (sub) {
            const res = saveSubjectMapping(
              {
                academicYear,
                classId: numericClass - 5, // 1 for Class 6, 2 for Class 7, 3 for Class 8
                className: `Class ${numericClass}`,
                numericClass,
                section: "all",
                subjectId: sub.id,
                subjectCode: sub.code,
                subjectName: sub.name,
                subjectNameBangla: sub.nameBangla,
                subjectType: sub.subjectType,
                isOptional: false,
                weeklyPeriods: 4,
                theoryPeriods: sub.subjectType === "Theory" ? 4 : 2,
                practicalPeriods: sub.subjectType === "Practical" || sub.subjectType === "Workshop" ? 2 : 0,
                labPeriods: sub.subjectType === "Lab" ? 2 : 0,
                requiredWeeklyHours: 3.0,
                fullMarks: sub.fullMarks,
                passMarks: sub.passMarks,
                theoryMarks: sub.theoryMarks,
                practicalMarks: sub.practicalMarks,
                vivaMarks: sub.vivaMarks,
                continuousMarks: sub.continuousMarks,
                displayOrder: sub.displayOrder,
                status: "Active",
              },
              user
            );
            if (res.success && res.mapping) addedMappings.push(res.mapping);
          }
        }
      } else {
        // Class 9-12 Vocational: Map common subjects (101, 102, 107, 108, 109, 136, 137, 150)
        const commonCodes = ["101", "102", "107", "108", "109", "136", "137", "150"];
        for (const code of commonCodes) {
          const sub = masters.find((m) => m.code === code);
          if (sub) {
            const res = saveSubjectMapping(
              {
                academicYear,
                classId: numericClass - 5,
                className: `Class ${numericClass} (Vocational)`,
                numericClass,
                section: "all",
                subjectId: sub.id,
                subjectCode: sub.code,
                subjectName: sub.name,
                subjectNameBangla: sub.nameBangla,
                subjectType: sub.subjectType,
                isOptional: false,
                weeklyPeriods: 4,
                theoryPeriods: 3,
                practicalPeriods: sub.practicalMarks > 0 ? 1 : 0,
                labPeriods: 0,
                requiredWeeklyHours: 3.0,
                fullMarks: sub.fullMarks,
                passMarks: sub.passMarks,
                theoryMarks: sub.theoryMarks,
                practicalMarks: sub.practicalMarks,
                vivaMarks: sub.vivaMarks,
                continuousMarks: sub.continuousMarks,
                displayOrder: sub.displayOrder,
                status: "Active",
              },
              user
            );
            if (res.success && res.mapping) addedMappings.push(res.mapping);
          }
        }

        // If specific trade selected (e.g. IT-IoT = 101)
        if (tradeVal && tradeVal !== "all") {
          const tradeNum = Number(tradeVal);
          const tradeObj = ALL_TRADES.find((t) => t.id === tradeNum);
          if (tradeObj) {
            // Find trade specific subjects in masters
            const tradeSubs = masters.filter(
              (m) =>
                m.code.startsWith(tradeObj.code) ||
                (tradeNum === 101 && m.code.includes("IT")) ||
                (tradeNum === 102 && m.code.includes("EE")) ||
                (tradeNum === 103 && m.code.includes("GE")) ||
                (tradeNum === 104 && m.code.includes("AMB"))
            );

            for (const sub of tradeSubs) {
              const res = saveSubjectMapping(
                {
                  academicYear,
                  classId: numericClass - 5,
                  className: `Class ${numericClass} (Vocational)`,
                  numericClass,
                  section: "all",
                  tradeId: tradeObj.id,
                  tradeCode: tradeObj.code,
                  tradeName: tradeObj.name,
                  subjectId: sub.id,
                  subjectCode: sub.code,
                  subjectName: sub.name,
                  subjectNameBangla: sub.nameBangla,
                  subjectType: sub.subjectType,
                  isOptional: false,
                  weeklyPeriods: 6,
                  theoryPeriods: 2,
                  practicalPeriods: 4,
                  labPeriods: 4,
                  requiredWeeklyHours: 4.5,
                  fullMarks: sub.fullMarks,
                  passMarks: sub.passMarks,
                  theoryMarks: sub.theoryMarks,
                  practicalMarks: sub.practicalMarks,
                  vivaMarks: sub.vivaMarks,
                  continuousMarks: sub.continuousMarks,
                  displayOrder: 20 + sub.displayOrder,
                  status: "Active",
                },
                user
              );
              if (res.success && res.mapping) addedMappings.push(res.mapping);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `BTEB/NCTB preset applied successfully. ${addedMappings.length} subjects aligned.`,
        count: addedMappings.length,
      });
    }

    // 6. Save or Update Master Subject
    if (action === "save_master_subject") {
      const { subject, user = "Admin" } = body;
      if (!subject || !subject.code || !subject.name) {
        return NextResponse.json({ success: false, error: "Subject code and name are required." }, { status: 400 });
      }

      if (subject.id) {
        const res = updateSubjectMaster(Number(subject.id), subject, user);
        if (!res.success) {
          return NextResponse.json({ success: false, error: res.error }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          message: "Subject master updated successfully.",
          subject: res.subject,
        });
      } else {
        const res = createSubjectMaster(subject, user);
        if (!res.success) {
          return NextResponse.json({ success: false, error: res.error }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          message: "New master subject created successfully.",
          subject: res.subject,
        });
      }
    }

    // 7. Copy Mappings between Academic Years
    if (action === "copy_year_mappings") {
      const { sourceYear, targetYear, user = "Admin" } = body;
      if (!sourceYear || !targetYear) {
        return NextResponse.json({ success: false, error: "sourceYear and targetYear are required." }, { status: 400 });
      }

      const sourceMappings = getSubjectMappings({ academicYear: sourceYear });
      let copiedCount = 0;

      for (const map of sourceMappings) {
        const res = saveSubjectMapping(
          {
            ...map,
            academicYear: targetYear,
          },
          user
        );
        if (res.success) copiedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Successfully migrated ${copiedCount} subject mappings from ${sourceYear} to ${targetYear}.`,
        count: copiedCount,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/academic/global-settings error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
