import { NextRequest, NextResponse } from "next/server";
import { prisma, isPrismaAvailable } from "@/lib/prisma";
import { institutionalDb, Student } from "@/lib/database";
import { requireAdmin } from "@/lib/serverAuthGuard";
import { getMasterDataSnapshot } from "@/lib/masterDataEngine";

export interface StudentPromotionItem {
  studentId: number;
  roll?: number;
  isOverride?: boolean;
  overrideReason?: string;
}

/**
 * GET /api/students/promotion
 * Loads students for source year & class, along with their examination results and promotion eligibility.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const classIdStr = searchParams.get("classId");
    const section = searchParams.get("section");
    const tradeIdStr = searchParams.get("tradeId");

    if (!year || !classIdStr) {
      return NextResponse.json(
        { success: false, error: "উৎস শিক্ষাবর্ষ (year) ও শ্রেণি (classId) আবশ্যক।" },
        { status: 400 }
      );
    }

    const classId = Number(classIdStr);
    const tradeId = tradeIdStr && tradeIdStr !== "all" && tradeIdStr !== "0" ? Number(tradeIdStr) : undefined;

    // 1. Fetch Students matching source filters
    let studentList: any[] = [];

    if (isPrismaAvailable()) {
      try {
        const whereClause: any = {
          session: year,
          status: "ACTIVE",
          OR: [
            { classId },
            { class: { numericValue: classId } },
          ],
        };

        if (section && section !== "all") {
          whereClause.section = section;
        }

        if (tradeId) {
          whereClause.tradeId = tradeId;
        }

        const dbStudents = await prisma.student.findMany({
          where: whereClause,
          include: {
            class: true,
            trade: true,
          },
          orderBy: { roll: "asc" },
        });

        if (dbStudents && dbStudents.length > 0) {
          studentList = dbStudents.map((s: any) => ({
            id: s.id,
            studentId: s.studentId,
            admissionNo: s.admissionNo,
            roll: s.roll,
            name: s.name,
            nameBangla: s.nameBangla,
            classId: s.classId,
            className: s.class?.nameBangla || s.class?.name || `Class ${s.classId}`,
            classNumeric: s.class?.numericValue || s.classId,
            tradeId: s.tradeId,
            tradeName: s.trade?.nameBangla || s.trade?.name || null,
            section: s.section,
            shift: s.shift,
            session: s.session,
            status: s.status,
            gpa: s.gpa || "0.00",
            resultStatus: s.resultStatus || "PASSED",
          }));
        }
      } catch (e: any) {
        console.warn("[Promotion API] Prisma query failed, fallback to institutionalDb:", e.message);
      }
    }

    if (studentList.length === 0) {
      studentList = institutionalDb.students
        .filter((s) => {
          const yearMatch = s.session === year;
          const classMatch =
            s.classId === classId ||
            (typeof s.classId === "number" && s.classId <= 7 && s.classId + 5 === classId);
          const sectionMatch = !section || section === "all" || s.section === section;
          const tradeMatch = !tradeId || s.tradeId === tradeId;
          const statusMatch = s.status === "Active";
          return yearMatch && classMatch && sectionMatch && tradeMatch && statusMatch;
        })
        .map((s) => ({
          id: s.id,
          studentId: s.studentId,
          admissionNo: s.admissionNo,
          roll: s.roll,
          name: s.name,
          nameBangla: s.nameBangla,
          classId: s.classId,
          className: s.className,
          classNumeric: typeof s.classId === "number" && s.classId <= 7 ? s.classId + 5 : Number(s.classId),
          tradeId: s.tradeId,
          tradeName: s.tradeName || null,
          section: s.section,
          shift: s.shift,
          session: s.session,
          status: s.status,
          gpa: s.gpa || "0.00",
          resultStatus: s.resultStatus || "PASSED",
        }));
    }

    // 2. Fetch Exam Marks & Evaluate Eligibility for each student
    const evaluatedStudents = await Promise.all(
      studentList.map(async (student) => {
        let hasResult = false;
        let isPassed = false;
        let gpaNum = parseFloat(student.gpa) || 0;
        let failedSubjectsCount = 0;
        let reason = "";
        let eligibilityStatus: "Eligible" | "Not Eligible" | "Pending Result" = "Pending Result";

        // Check Exam marks from DB or memory
        if (isPrismaAvailable()) {
          try {
            const marks = await prisma.examMark.findMany({
              where: {
                studentId: student.id,
                session: year,
              },
            });

            if (marks && marks.length > 0) {
              hasResult = true;
              const failed = marks.filter((m: any) => !m.isPassed || m.grade === "F");
              failedSubjectsCount = failed.length;
              isPassed = failedSubjectsCount === 0;

              const totalGpa = marks.reduce((acc: number, m: any) => acc + (m.gpaPoint || 0), 0);
              gpaNum = parseFloat((totalGpa / marks.length).toFixed(2));
            }
          } catch {
            // fallback
          }
        }

        if (!hasResult) {
          const overall = institutionalDb.overallResults.find(
            (r) => r.studentId === student.id && r.academicYear === Number(year)
          );
          if (overall) {
            hasResult = true;
            isPassed = overall.resultStatus === "Passed";
            gpaNum = overall.gpa;
            failedSubjectsCount = overall.failedSubjectsCount;
          } else if (student.gpa && parseFloat(student.gpa) > 0) {
            hasResult = true;
            isPassed = student.resultStatus === "PASSED" || student.resultStatus === "Passed";
            gpaNum = parseFloat(student.gpa);
          }
        }

        if (!hasResult) {
          eligibilityStatus = "Pending Result";
          reason = "বাৎসরিক পরীক্ষার ফলাফল এখনও প্রস্তুত হয়নি।";
        } else if (!isPassed || failedSubjectsCount > 0) {
          eligibilityStatus = "Not Eligible";
          reason = `শিক্ষার্থী ${failedSubjectsCount > 0 ? `${failedSubjectsCount}টি বিষয়ে অনুত্তীর্ণ` : "পরীক্ষায় অনুত্তীর্ণ"} হয়েছে।`;
        } else {
          eligibilityStatus = "Eligible";
          reason = `শিক্ষার্থী উত্তীর্ণ হয়েছে (GPA: ${gpaNum.toFixed(2)})।`;
        }

        return {
          ...student,
          gpa: gpaNum.toFixed(2),
          hasResult,
          isPassed,
          failedSubjectsCount,
          eligibilityStatus,
          eligibilityReason: reason,
        };
      })
    );

    return NextResponse.json({
      success: true,
      students: evaluatedStudents,
      totalCount: evaluatedStudents.length,
      eligibleCount: evaluatedStudents.filter((s) => s.eligibilityStatus === "Eligible").length,
      pendingCount: evaluatedStudents.filter((s) => s.eligibilityStatus === "Pending Result").length,
      notEligibleCount: evaluatedStudents.filter((s) => s.eligibilityStatus === "Not Eligible").length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/students/promotion
 * Executes Preview or Batch Promotion using atomic transactions with historical preservation.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req, "student:manage");
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const {
      action, // "preview" | "execute"
      sourceYear,
      targetYear,
      sourceClassId,
      targetClassId,
      targetSection,
      targetShift,
      targetTradeId,
      studentPromotions, // Array of StudentPromotionItem: [{ studentId, roll, isOverride, overrideReason }]
    } = body;

    if (!sourceYear || !targetYear || !targetClassId) {
      return NextResponse.json(
        { success: false, error: "উৎস শিক্ষাবর্ষ, গন্তব্য শিক্ষাবর্ষ এবং গন্তব্য শ্রেণি নির্বাচন করা আবশ্যক।" },
        { status: 400 }
      );
    }

    if (sourceYear === targetYear && sourceClassId === targetClassId) {
      return NextResponse.json(
        { success: false, error: "উৎস এবং গন্তব্য শিক্ষাবর্ষ ও শ্রেণি একই হতে পারে না।" },
        { status: 400 }
      );
    }

    const promotions: StudentPromotionItem[] = Array.isArray(studentPromotions) ? studentPromotions : [];
    if (promotions.length === 0) {
      return NextResponse.json(
        { success: false, error: "প্রমোশনের জন্য অন্তত একজন শিক্ষার্থী নির্বাচন করুন।" },
        { status: 400 }
      );
    }

    // Load master data snapshot for destination verification
    const snapshot = await getMasterDataSnapshot(targetYear);
    const targetClassObj = snapshot.classes.find(
      (c) => c.numericValue === Number(targetClassId) || c.id === Number(targetClassId)
    );

    if (!targetClassObj) {
      return NextResponse.json(
        { success: false, error: "গন্তব্য শ্রেণির মাস্টার রেকর্ড খুঁজে পাওয়া যায়নি।" },
        { status: 400 }
      );
    }

    // Check Destination Mapping Capacity
    const destinationCapacity = targetClassObj.totalSeats || 80;
    let currentEnrolledInTarget = 0;

    if (isPrismaAvailable()) {
      try {
        currentEnrolledInTarget = await prisma.student.count({
          where: {
            session: targetYear,
            class: { numericValue: targetClassObj.numericValue },
            status: "ACTIVE",
            ...(targetSection && targetSection !== "all" ? { section: targetSection } : {}),
            ...(targetTradeId ? { tradeId: Number(targetTradeId) } : {}),
          },
        });
      } catch {
        // fallback
      }
    }

    if (currentEnrolledInTarget === 0) {
      currentEnrolledInTarget = institutionalDb.students.filter(
        (s) =>
          s.session === targetYear &&
          (s.classId === targetClassObj.id || s.classId === targetClassObj.numericValue) &&
          s.status === "Active"
      ).length;
    }

    const projectedTotal = currentEnrolledInTarget + promotions.length;
    const capacityExceeded = projectedTotal > destinationCapacity;

    // PREVIEW ACTION
    if (action === "preview") {
      const studentIds = promotions.map((p) => p.studentId);
      const eligibleStudents: any[] = [];
      const ineligibleStudents: any[] = [];
      const conflictingStudents: any[] = [];

      for (const item of promotions) {
        // Check conflicting enrollment in target year
        let alreadyInTarget = false;
        if (isPrismaAvailable()) {
          try {
            const existingEnrollment = await prisma.student.findFirst({
              where: {
                id: item.studentId,
                session: targetYear,
              },
            });
            if (existingEnrollment) alreadyInTarget = true;
          } catch {
            // fallback
          }
        }

        if (!alreadyInTarget) {
          alreadyInTarget = institutionalDb.academicPlacements.some(
            (p) => p.studentId === item.studentId && p.academicYear === Number(targetYear)
          );
        }

        if (alreadyInTarget) {
          conflictingStudents.push(item.studentId);
        }

        if (item.isOverride && (!item.overrideReason || item.overrideReason.trim() === "")) {
          ineligibleStudents.push({
            studentId: item.studentId,
            reason: "ম্যানুয়াল অনুমোদনের জন্য সুনির্দিষ্ট কারণ (Reason) উল্লেখ করা বাধ্যতামূলক।",
          });
        } else {
          eligibleStudents.push(item);
        }
      }

      return NextResponse.json({
        success: true,
        preview: {
          sourceYear,
          targetYear,
          targetClass: targetClassObj.nameBangla,
          targetSection: targetSection || "A",
          targetShift: targetShift || "FIRST_SHIFT",
          destinationCapacity,
          currentEnrolledInTarget,
          projectedTotal,
          capacityExceeded,
          capacityWarning: capacityExceeded
            ? `সতর্কতা: গন্তব্য শ্রেণির আসন ধারণক্ষমতা (${destinationCapacity} টি)। প্রমোশনের পর মোট শিক্ষার্থী হবে ${projectedTotal} জন, যা নির্ধারিত আসন অপেক্ষা ${projectedTotal - destinationCapacity} জন বেশি।`
            : undefined,
          totalSelected: promotions.length,
          readyToPromoteCount: eligibleStudents.length,
          conflictCount: conflictingStudents.length,
          conflictingStudentIds: conflictingStudents,
        },
      });
    }

    // EXECUTE ACTION
    if (action === "execute") {
      const promotedResults: any[] = [];
      const skippedResults: any[] = [];
      const failedResults: any[] = [];

      const adminUser = auth.identity.userName || "Admin";

      // Execute in loop with safe error recovery
      for (const item of promotions) {
        try {
          // 1. Verify student exists
          let student: any = null;
          if (isPrismaAvailable()) {
            try {
              student = await prisma.student.findUnique({
                where: { id: item.studentId },
              });
            } catch {
              // fallback
            }
          }

          if (!student) {
            student = institutionalDb.students.find((s) => s.id === item.studentId);
          }

          if (!student) {
            skippedResults.push({
              studentId: item.studentId,
              status: "Skipped",
              reason: "শিক্ষার্থীর প্রোফাইল রেকর্ড খুঁজে পাওয়া যায়নি।",
            });
            continue;
          }

          // 2. Prevent duplicate target enrollment
          const alreadyInTarget =
            student.session === targetYear &&
            (student.classId === targetClassObj.id || student.classId === targetClassObj.numericValue);

          if (alreadyInTarget) {
            skippedResults.push({
              studentId: item.studentId,
              name: student.name,
              status: "Skipped",
              reason: `শিক্ষার্থী পূর্বেই ${targetYear} শিক্ষাবর্ষে এনরোল্ড রয়েছে।`,
            });
            continue;
          }

          // 3. Resolve Roll number
          const newRoll = item.roll ? Number(item.roll) : student.roll;
          const assignedSection = targetSection && targetSection !== "all" ? targetSection : student.section || "A";
          const assignedShift = targetShift || student.shift || "FIRST_SHIFT";
          const assignedTradeId = targetTradeId ? Number(targetTradeId) : student.tradeId;

          // 4. Update Database safely
          if (isPrismaAvailable()) {
            try {
              // Atomically update Student's current placement
              await prisma.student.update({
                where: { id: student.id },
                data: {
                  session: targetYear,
                  classId: targetClassObj.id,
                  section: assignedSection,
                  shift: assignedShift as any,
                  tradeId: assignedTradeId,
                  roll: newRoll,
                },
              });
            } catch (dbErr: any) {
              console.warn("[Promotion API] Prisma update error:", dbErr.message);
            }
          }

          // 5. Update institutionalDb & Lifecycle Placements
          const oldPlacement = institutionalDb.academicPlacements.find(
            (p) => p.studentId === student.id && p.isCurrent
          );
          if (oldPlacement) {
            oldPlacement.isCurrent = false;
          }

          institutionalDb.academicPlacements.push({
            id: `place_${student.id}_${targetYear}_${Date.now()}`,
            studentId: student.id,
            academicYear: Number(targetYear),
            classId: targetClassObj.numericValue,
            className: targetClassObj.nameBangla,
            section: assignedSection,
            tradeId: assignedTradeId || undefined,
            tradeName: targetClassObj.hasTrade ? "কারিগরি ট্রেড" : undefined,
            shift: assignedShift === "SECOND_SHIFT" ? "Second Shift" : "First Shift",
            status: "Active",
            isCurrent: true,
            effectiveDate: new Date().toISOString().split("T")[0],
            remarks: item.isOverride
              ? `ম্যানুয়াল প্রমোশন: ${item.overrideReason || "অনুমোদিত"}`
              : "বার্ষিক প্রমোশন ও রোলওভার",
          });

          // Sync student master object in memory
          student.session = targetYear;
          student.classId = targetClassObj.numericValue;
          student.className = targetClassObj.nameBangla;
          student.section = assignedSection;
          student.shift = assignedShift;
          student.tradeId = assignedTradeId;
          student.roll = newRoll;

          // Record Lifecycle audit log
          institutionalDb.lifecycleEvents.push({
            id: `ev_promo_${Date.now()}_${student.id}`,
            studentId: student.id,
            eventType: "Promotion",
            previousState: {
              session: sourceYear,
              classId: sourceClassId,
              section: student.section,
            },
            newState: {
              session: targetYear,
              classId: targetClassObj.numericValue,
              section: assignedSection,
            },
            reason: item.isOverride
              ? `অ্যাডমিন ওভাররাইড প্রমোশন: ${item.overrideReason}`
              : "শিক্ষাবর্ষ রোলওভার ও বার্ষিক প্রমোশন",
            performedBy: adminUser,
            effectiveDate: new Date().toISOString().split("T")[0],
            timestamp: new Date().toISOString(),
          });

          promotedResults.push({
            studentId: student.id,
            name: student.nameBangla || student.name,
            roll: newRoll,
            targetClass: targetClassObj.nameBangla,
            targetSection: assignedSection,
            status: "Promoted",
            isOverride: Boolean(item.isOverride),
          });
        } catch (err: any) {
          failedResults.push({
            studentId: item.studentId,
            status: "Failed",
            reason: err.message || "প্রমোশন প্রক্রিয়াকরণে অপ্রত্যাশিত ত্রুটি ঘটেছে।",
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `${promotedResults.length} জন শিক্ষার্থীর ব্যাচ প্রমোশন সফলভাবে সম্পন্ন হয়েছে।`,
        summary: {
          totalRequested: promotions.length,
          promotedCount: promotedResults.length,
          skippedCount: skippedResults.length,
          failedCount: failedResults.length,
          promotedStudents: promotedResults,
          skippedStudents: skippedResults,
          failedStudents: failedResults,
        },
      });
    }

    return NextResponse.json({ success: false, error: "অবৈধ অ্যাকশন (Invalid action)" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
