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
  hydrateSubjectEngineFromHybrid,
  persistSubjectEngineToHybrid,
  AcademicSubjectMapping,
} from "@/lib/subjectEngine";
import { parseClassNumeric, doesClassHaveTrade, getApplicableTradesForClass, ALL_TRADES } from "@/lib/academicStructure";
import { getMasterDataSnapshot, saveClassMasterRecord, saveTradeMasterRecord } from "@/lib/masterDataEngine";
import { isPrismaAvailable, safePrismaQuery } from "@/lib/prisma";
import { requireAdmin } from "@/lib/serverAuthGuard";

/**
 * Explicit Safe Projections for Class and Trade Configurations.
 * Enforces Class 6-8 (hasDepartment=false) and Class 9-12 (hasDepartment=true).
 */
function sanitizeClassConfig(c: any) {
  if (!c) return null;
  const numericValue = Number(c.numericValue);
  const enforcedHasDepartment = numericValue >= 9 && numericValue <= 12;
  return {
    id: Number(c.id),
    numericValue,
    name: String(c.name || `Class ${numericValue}`),
    nameBangla: String(c.nameBangla || c.name || `Class ${numericValue}`),
    tier: c.tier || (numericValue <= 8 ? "Pre-Vocational" : numericValue <= 10 ? "SSC (Vocational)" : "HSC (Vocational)"),
    hasTrade: enforcedHasDepartment,
    hasDepartment: enforcedHasDepartment,
    totalSeats: Number(c.totalSeats) || 0,
    sections: Array.isArray(c.defaultSections) ? c.defaultSections : Array.isArray(c.sections) ? c.sections : [],
    shifts: Array.isArray(c.defaultShifts) ? c.defaultShifts : Array.isArray(c.shifts) ? c.shifts : [],
    status: c.status === "Inactive" ? "Inactive" : "Active",
  };
}

function sanitizeTradeConfig(t: any, idx = 0) {
  if (!t) return null;
  return {
    id: Number(t.id),
    tradeNumber: t.tradeNumber || ((idx % 4) + 1),
    code: String(t.code),
    name: String(t.name),
    nameBangla: String(t.nameBangla),
    seats: Number(t.seats ?? t.intakeCapacity) || 50,
    level: t.level || "SSC",
    applicableClass: Number(t.applicableClass) || 9,
    descriptionBangla: String(t.descriptionBangla ?? t.description ?? ""),
    status: t.status === "Inactive" ? "Inactive" : "Active",
  };
}

async function persistMappingToMySQL(mapping: AcademicSubjectMapping): Promise<void> {
  if (!isPrismaAvailable() || !mapping) return;
  await safePrismaQuery(async (client) => {
    const dbSub = await client.subjectMaster.upsert({
      where: { code: mapping.subjectCode },
      update: {
        name: mapping.subjectName,
        nameBangla: mapping.subjectNameBangla || mapping.subjectName,
        subjectType: mapping.subjectType,
        fullMarks: Number(mapping.fullMarks) || 100,
        passMarks: Number(mapping.passMarks) || 33,
      },
      create: {
        code: mapping.subjectCode,
        name: mapping.subjectName,
        nameBangla: mapping.subjectNameBangla || mapping.subjectName,
        nameEnglish: mapping.subjectName,
        shortName: mapping.subjectCode,
        subjectType: mapping.subjectType,
        fullMarks: Number(mapping.fullMarks) || 100,
        passMarks: Number(mapping.passMarks) || 33,
        theoryMarks: Number(mapping.theoryMarks) || 100,
        practicalMarks: Number(mapping.practicalMarks) || 0,
        vivaMarks: Number(mapping.vivaMarks) || 0,
        continuousMarks: Number(mapping.continuousMarks) || 40,
      },
    });
    const cleanTradeId =
      mapping.numericClass >= 9 && mapping.tradeId && Number(mapping.tradeId) > 0
        ? Number(mapping.tradeId)
        : null;
    await client.academicSubjectMapping.upsert({
      where: {
        unique_year_class_trade_section_subject: {
          academicYear: mapping.academicYear,
          classId: Number(mapping.classId),
          tradeId: cleanTradeId ?? 0,
          section: mapping.section || "all",
          subjectId: dbSub.id,
        },
      },
      update: {
        className: mapping.className,
        numericClass: Number(mapping.numericClass),
        tradeCode: cleanTradeId ? mapping.tradeCode || null : null,
        tradeName: cleanTradeId ? mapping.tradeName || null : null,
        subjectCode: mapping.subjectCode,
        subjectName: mapping.subjectName,
        subjectNameBangla: mapping.subjectNameBangla,
        subjectType: mapping.subjectType,
        weeklyPeriods: Number(mapping.weeklyPeriods) || 4,
        status: mapping.status || "Active",
      },
      create: {
        academicYear: mapping.academicYear,
        classId: Number(mapping.classId),
        className: mapping.className,
        numericClass: Number(mapping.numericClass),
        section: mapping.section || "all",
        tradeId: cleanTradeId,
        tradeCode: cleanTradeId ? mapping.tradeCode || null : null,
        tradeName: cleanTradeId ? mapping.tradeName || null : null,
        subjectId: dbSub.id,
        subjectCode: mapping.subjectCode,
        subjectName: mapping.subjectName,
        subjectNameBangla: mapping.subjectNameBangla,
        subjectType: mapping.subjectType,
        isOptional: Boolean(mapping.isOptional),
        weeklyPeriods: Number(mapping.weeklyPeriods) || 4,
        theoryPeriods: Number(mapping.theoryPeriods) || 3,
        practicalPeriods: Number(mapping.practicalPeriods) || 0,
        labPeriods: Number(mapping.labPeriods) || 0,
        requiredWeeklyHours: Number(mapping.requiredWeeklyHours) || 3.0,
        fullMarks: Number(mapping.fullMarks) || 100,
        passMarks: Number(mapping.passMarks) || 33,
        theoryMarks: Number(mapping.theoryMarks) || 100,
        practicalMarks: Number(mapping.practicalMarks) || 0,
        vivaMarks: Number(mapping.vivaMarks) || 0,
        continuousMarks: Number(mapping.continuousMarks) || 40,
        displayOrder: Number(mapping.displayOrder) || 1,
        status: mapping.status || "Active",
      },
    });
  }, null);
}

export async function GET(req: NextRequest) {
  try {
    hydrateSubjectEngineFromHybrid();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "overview";
    const academicYear = searchParams.get("academicYear") || "2026";

    // 1. Overview summary stats (sourced from Single Source of Truth master snapshot)
    if (action === "overview") {
      const snapshot = await getMasterDataSnapshot(academicYear);
      const rawClasses = snapshot.classes?.length ? snapshot.classes : getAllClassConfigurations();
      const rawTrades = snapshot.trades?.length ? snapshot.trades : getAllTradeConfigurations();
      const classes = rawClasses.map(sanitizeClassConfig).filter(Boolean);
      const trades = rawTrades.map((t: any, i: number) => sanitizeTradeConfig(t, i)).filter(Boolean);
      const masters = getSubjectMasters({ status: "Active" });
      const mappings = getSubjectMappings({ academicYear });

      const totalSeats = classes.reduce((sum: number, c: any) => sum + (c.totalSeats || 0), 0);
      const totalTradeSeats = trades.reduce((sum: number, t: any) => sum + (t.seats || 0), 0);

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
      const snapshot = await getMasterDataSnapshot(academicYear);
      const rawClasses = snapshot.classes?.length ? snapshot.classes : getAllClassConfigurations();
      const rawTrades = snapshot.trades?.length ? snapshot.trades : getAllTradeConfigurations();
      const classes = rawClasses.map(sanitizeClassConfig).filter(Boolean);
      const trades = rawTrades.map((t: any, i: number) => sanitizeTradeConfig(t, i)).filter(Boolean);
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

      const numericClass = parseClassNumeric(classVal);
      const hasTrade = numericClass >= 9 && numericClass <= 12;
      const tradeVal = hasTrade ? (searchParams.get("tradeVal") || searchParams.get("tradeId") || undefined) : undefined;
      const subjects = getSingleSourceSubjects({
        classVal,
        tradeVal,
        academicYear,
        includeInactive: false,
      });

      const snapshot = await getMasterDataSnapshot(academicYear);
      const applicableTrades = hasTrade
        ? (snapshot.trades?.length ? snapshot.trades : getApplicableTradesForClass(numericClass))
        : [];

      return NextResponse.json({
        success: true,
        academicYear,
        classNumeric: numericClass,
        hasTrade,
        hasDepartment: hasTrade,
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
    hydrateSubjectEngineFromHybrid();
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

      const numCls = parseClassNumeric(mapping.numericClass || mapping.classId);
      const cleanMapping =
        numCls > 0 && numCls <= 8
          ? { ...mapping, tradeId: undefined, tradeCode: undefined, tradeName: undefined }
          : mapping;

      const res = saveSubjectMapping(cleanMapping, user);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      persistSubjectEngineToHybrid();
      if (res.mapping) {
        await persistMappingToMySQL(res.mapping);
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

      persistSubjectEngineToHybrid();

      return NextResponse.json({
        success: true,
        message: "Subject mapping removed successfully.",
      });
    }

    // 3. Update Class Configuration (persisted to Hybrid + MySQL, enforcing 6-8 no-department)
    if (action === "update_class") {
      const { classId, updates } = body;
      if (!classId || !updates) {
        return NextResponse.json({ success: false, error: "classId and updates are required" }, { status: 400 });
      }

      const numVal = parseClassNumeric(updates.numericValue || classId);
      const enforcedHasDept = numVal >= 9 && numVal <= 12;
      const safeUpdates = { ...updates, hasTrade: enforcedHasDept };

      const updated = updateClassConfiguration(Number(classId), safeUpdates);
      const snapshot = await getMasterDataSnapshot();
      const targetClass = snapshot.classes.find(
        (c: any) => Number(c.id) === Number(classId) || Number(c.numericValue) === numVal
      );

      if (!updated && !targetClass) {
        return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 });
      }

      const masterRes = await saveClassMasterRecord({
        id: targetClass?.id || Number(classId),
        numericValue: targetClass?.numericValue || numVal,
        name: safeUpdates.name || targetClass?.name || updated?.name,
        nameBangla: safeUpdates.nameBangla || targetClass?.nameBangla || updated?.nameBangla,
        hasTrade: enforcedHasDept,
        defaultSections: Array.isArray(safeUpdates.sections) ? safeUpdates.sections : undefined,
        defaultShifts: Array.isArray(safeUpdates.shifts) ? safeUpdates.shifts : undefined,
        totalSeats: safeUpdates.totalSeats ? Number(safeUpdates.totalSeats) : undefined,
        status: safeUpdates.status,
      });

      return NextResponse.json({
        success: true,
        message: "Class configuration updated and persisted successfully.",
        classConfig: sanitizeClassConfig(masterRes.classRecord || updated),
      });
    }

    // 4. Update Trade Configuration (persisted to Hybrid + MySQL)
    if (action === "update_trade") {
      const { tradeId, updates } = body;
      if (!tradeId || !updates) {
        return NextResponse.json({ success: false, error: "tradeId and updates are required" }, { status: 400 });
      }

      const updated = updateTradeConfiguration(Number(tradeId), updates);
      const snapshot = await getMasterDataSnapshot();
      const targetTrade = snapshot.trades.find((t: any) => Number(t.id) === Number(tradeId));

      if (!updated && !targetTrade) {
        return NextResponse.json({ success: false, error: "Trade not found" }, { status: 404 });
      }

      const masterRes = await saveTradeMasterRecord({
        id: targetTrade?.id || Number(tradeId),
        code: updates.code || targetTrade?.code || updated?.code,
        name: updates.name || targetTrade?.name || updated?.name,
        nameBangla: updates.nameBangla || targetTrade?.nameBangla || updated?.nameBangla,
        intakeCapacity: updates.seats ? Number(updates.seats) : undefined,
        description: updates.descriptionBangla || updates.description,
        status: updates.status,
      });

      return NextResponse.json({
        success: true,
        message: "Trade configuration updated and persisted successfully.",
        tradeConfig: sanitizeTradeConfig(masterRes.trade || updated),
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

      persistSubjectEngineToHybrid();
      for (const m of addedMappings) {
        await persistMappingToMySQL(m);
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
        persistSubjectEngineToHybrid();
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
        persistSubjectEngineToHybrid();
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
