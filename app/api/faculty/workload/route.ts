import { NextRequest } from "next/server";
import { institutionalDb, FacultyMember, RoutineItem } from "@/lib/database";
import { calculateTeacherWorkload, WEEK_DAYS } from "@/lib/routineEngine";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    const department = searchParams.get("department");

    // Compute workload from real institutional routines
    const workloadData = calculateTeacherWorkload(
      institutionalDb.routines,
      institutionalDb.faculty
    );

    // If a specific teacher's workload is requested:
    if (teacherId) {
      const tId = Number(teacherId);
      const teacher = institutionalDb.faculty.find((f) => f.id === tId);
      if (!teacher) {
        return apiError("শিক্ষক পাওয়া যায়নি (Teacher not found)", { status: 404 });
      }

      // Find all routines assigned to this teacher
      const routines = institutionalDb.routines.filter(
        (r) =>
          r.teacherId === tId ||
          (r.teacherName && r.teacherName.trim().toLowerCase() === teacher.name.trim().toLowerCase())
      );

      // Daily distribution
      const dailyBreakdown: Record<string, { periods: number; practical: number; theory: number; routines: RoutineItem[] }> = {
        Sunday: { periods: 0, practical: 0, theory: 0, routines: [] },
        Monday: { periods: 0, practical: 0, theory: 0, routines: [] },
        Tuesday: { periods: 0, practical: 0, theory: 0, routines: [] },
        Wednesday: { periods: 0, practical: 0, theory: 0, routines: [] },
        Thursday: { periods: 0, practical: 0, theory: 0, routines: [] },
      };

      let totalTeachingMinutes = 0;
      let practicalCount = 0;
      let theoryCount = 0;

      const assignedSubjectsMap = new Map<string, { code: string; name: string; class: string; section: string; isLab: boolean }>();

      routines.forEach((r) => {
        if (dailyBreakdown[r.day]) {
          dailyBreakdown[r.day].periods++;
          dailyBreakdown[r.day].routines.push(r);
        }

        const isLab =
          r.isLab ||
          (r.durationMinutes && r.durationMinutes >= 80) ||
          r.periodType === "lab_block" ||
          r.periodType === "practical" ||
          r.subjectCode.includes("-902") ||
          r.subjectCode.includes("-1002");

        if (isLab) {
          practicalCount++;
          if (dailyBreakdown[r.day]) dailyBreakdown[r.day].practical++;
        } else {
          theoryCount++;
          if (dailyBreakdown[r.day]) dailyBreakdown[r.day].theory++;
        }

        totalTeachingMinutes += r.durationMinutes || 45;

        const subjectKey = `${r.classId}_${r.subjectCode}_${r.section}`;
        if (!assignedSubjectsMap.has(subjectKey)) {
          assignedSubjectsMap.set(subjectKey, {
            code: r.subjectCode,
            name: r.subjectName,
            class: r.className,
            section: r.section || "A",
            isLab: !!isLab,
          });
        }
      });

      // Free periods calculation (Standard 7 periods per academic day = 35 weekly slots)
      const standardDailyCapacity = 7;
      const freePeriodsDaily: Record<string, number> = {};
      WEEK_DAYS.forEach((day) => {
        const busy = dailyBreakdown[day] ? dailyBreakdown[day].periods : 0;
        freePeriodsDaily[day] = Math.max(0, standardDailyCapacity - busy);
      });

      const weeklyClassesCount = routines.length;
      const monthlyWorkloadEstimated = Math.round(weeklyClassesCount * 4.2);
      const totalTeachingHours = Number((totalTeachingMinutes / 60).toFixed(1));
      const maxWeeklyCapacity = 24; // Standard technical school teacher ceiling
      const workloadPercentage = Math.round((weeklyClassesCount / maxWeeklyCapacity) * 100);

      let workloadStatus: "Optimal Workload" | "Light Workload" | "Overloaded" = "Optimal Workload";
      let statusBangla = "সুষম কাজের চাপ (Optimal)";
      if (weeklyClassesCount > 22) {
        workloadStatus = "Overloaded";
        statusBangla = "অতিরিক্ত কাজের চাপ (>২২ পিরিয়ড)";
      } else if (weeklyClassesCount < 12) {
        workloadStatus = "Light Workload";
        statusBangla = "হালকা কাজের চাপ (<১২ পিরিয়ড)";
      }

      return apiSuccess({
        teacherId: tId,
        name: teacher.name,
        nameBangla: teacher.nameBangla,
        designation: teacher.designation,
        department: teacher.department,
        tradeCode: teacher.tradeCode,
        weeklyClassesCount,
        monthlyWorkloadEstimated,
        totalTeachingHours,
        totalTeachingMinutes,
        theoryPeriods: theoryCount,
        practicalPeriods: practicalCount,
        assignedSubjects: Array.from(assignedSubjectsMap.values()),
        assignedSubjectsCount: assignedSubjectsMap.size,
        dailyBreakdown,
        freePeriodsDaily,
        totalFreePeriodsWeekly: 35 - weeklyClassesCount,
        maxWeeklyCapacity,
        workloadPercentage,
        status: workloadStatus,
        statusBangla,
      }, {
        extraKeys: {
          workload: {
            teacherId: tId,
            name: teacher.name,
            nameBangla: teacher.nameBangla,
            designation: teacher.designation,
            department: teacher.department,
            tradeCode: teacher.tradeCode,
            weeklyClassesCount,
            monthlyWorkloadEstimated,
            totalTeachingHours,
            totalTeachingMinutes,
            theoryPeriods: theoryCount,
            practicalPeriods: practicalCount,
            assignedSubjects: Array.from(assignedSubjectsMap.values()),
            assignedSubjectsCount: assignedSubjectsMap.size,
            dailyBreakdown,
            freePeriodsDaily,
            totalFreePeriodsWeekly: 35 - weeklyClassesCount,
            maxWeeklyCapacity,
            workloadPercentage,
            status: workloadStatus,
            statusBangla,
          },
        },
      });
    }

    // Otherwise return institutional all-faculty workload summary
    let teachers = workloadData.teachers || [];
    if (department && department !== "all") {
      teachers = teachers.filter((t: any) => t.department === department);
    }

    // Explicitly select and sanitize faculty workload properties to strictly prevent sensitive data leaks
    const processedTeachers = teachers.map((t: any) => {
      const weeklyPeriods = Number(t.totalWeeklyPeriods) || 0;
      const totalMinutes = Number(t.totalMinutes) || 0;
      const isOverloaded = weeklyPeriods > 22;
      const isLight = weeklyPeriods < 12;

      return {
        id: t.id,
        teacherId: t.id,
        name: t.name,
        nameBangla: t.nameBangla || t.name,
        designation: t.designation,
        department: t.department,
        tradeCode: t.tradeCode || null,
        totalWeeklyPeriods: weeklyPeriods,
        totalMinutes,
        monthlyWorkloadEstimated: Math.round(weeklyPeriods * 4.2),
        totalTeachingHours: Number((totalMinutes / 60).toFixed(1)),
        freePeriodsCount: Math.max(0, 35 - weeklyPeriods),
        status: isOverloaded ? "Overloaded" : isLight ? "Light Workload" : "Optimal Workload",
        statusBangla: isOverloaded
          ? "অতিরিক্ত কাজের চাপ (>২২ পিরিয়ড)"
          : isLight
          ? "হালকা কাজের চাপ (<১২ পিরিয়ড)"
          : "সুষম কাজের চাপ (Optimal)",
      };
    });

    const responsePayload = {
      institutionalAverage: workloadData.institutionalAverage || 18,
      recommendations: workloadData.recommendations || ["শিক্ষক কর্মভার বণ্টন পর্যালোচনা সম্পন্ন হয়েছে।"],
      teachers: processedTeachers,
      totalFacultyEvaluated: processedTeachers.length,
    };

    return apiSuccess(responsePayload, {
      extraKeys: responsePayload,
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "শিক্ষক কর্মভার হিসাব করতে ব্যর্থ হয়েছে" });
  }
}
