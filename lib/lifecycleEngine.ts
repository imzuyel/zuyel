import { 
  institutionalDb, 
  Student, 
  StudentAcademicPlacement, 
  StudentLifecycleEvent, 
  PromotionRule,
  StudentOverallResult
} from "./database";
import { ACADEMIC_CLASSES } from "./academicStructure";

export class LifecycleEngine {
  /**
   * Get current placement for a student.
   * Authoritative query for the student's current location.
   */
  static getCurrentPlacement(studentId: number): StudentAcademicPlacement | null {
    return institutionalDb.academicPlacements.find(p => p.studentId === studentId && p.isCurrent) || null;
  }

  /**
   * Get complete academic history timeline for a student.
   */
  static getAcademicHistory(studentId: number): StudentAcademicPlacement[] {
    return institutionalDb.academicPlacements
      .filter(p => p.studentId === studentId)
      .sort((a, b) => b.academicYear - a.academicYear);
  }

  /**
   * Get lifecycle events for audit/timeline.
   */
  static getLifecycleEvents(studentId: number): StudentLifecycleEvent[] {
    return institutionalDb.lifecycleEvents
      .filter(e => e.studentId === studentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Authoritative method to update a student's placement.
   * This preserves historical integrity by setting isCurrent=false on old records.
   */
  static updatePlacement(
    studentId: number,
    data: Partial<StudentAcademicPlacement>,
    reason: string,
    performedBy: string,
    eventType: StudentLifecycleEvent["eventType"] = "Status Change"
  ): StudentAcademicPlacement {
    const student = institutionalDb.students.find(s => s.id === studentId);
    if (!student) throw new Error("Student not found");

    // 1. Deactivate old current placement
    const oldPlacements = institutionalDb.academicPlacements.filter(p => p.studentId === studentId && p.isCurrent);
    const previousState = oldPlacements.length > 0 ? { ...oldPlacements[0] } : null;
    
    oldPlacements.forEach(p => {
      p.isCurrent = false;
    });

    // 2. Create new placement record
    const newPlacement: StudentAcademicPlacement = {
      id: `${studentId}_${data.academicYear || 2026}_${Date.now()}`,
      studentId,
      academicYear: data.academicYear || 2026,
      classId: data.classId || student.classId,
      className: data.className || student.className,
      section: data.section || student.section,
      tradeId: data.tradeId || student.tradeId,
      tradeName: data.tradeName || student.tradeName,
      shift: data.shift || student.shift,
      status: data.status || student.status,
      isCurrent: true,
      effectiveDate: data.effectiveDate || new Date().toISOString().split("T")[0],
      remarks: data.remarks || reason,
    };

    institutionalDb.academicPlacements.push(newPlacement);

    // 3. Sync Student Master (Current state only)
    student.classId = newPlacement.classId;
    student.className = newPlacement.className;
    student.section = newPlacement.section;
    student.tradeId = newPlacement.tradeId;
    student.tradeName = newPlacement.tradeName;
    student.status = newPlacement.status as any;
    student.shift = newPlacement.shift as any;

    // 4. Record Lifecycle Event
    this.recordEvent({
      studentId,
      eventType,
      previousState,
      newState: newPlacement,
      reason,
      performedBy,
      effectiveDate: newPlacement.effectiveDate,
    });

    return newPlacement;
  }

  /**
   * Evaluate if a student is eligible for promotion.
   */
  static evaluatePromotion(
    studentId: number, 
    sourceYear: number, 
    targetYear: number
  ): { eligible: boolean; status: string; reason: string; metrics: any } {
    const result = institutionalDb.overallResults.find(r => r.studentId === studentId && r.academicYear === sourceYear);
    const rule = institutionalDb.promotionRules.find(r => r.academicYear === sourceYear); // Simplification: one rule per year

    if (!result) {
      return { eligible: false, status: "Pending Result", reason: "Annual result not yet generated.", metrics: null };
    }

    if (result.resultStatus === "Failed") {
      return { eligible: false, status: "Not Eligible", reason: `Student failed in ${result.failedSubjectsCount} subjects.`, metrics: result };
    }

    // Custom rule checks
    if (rule) {
      if (rule.minGpa && result.gpa < rule.minGpa) {
        return { eligible: false, status: "Below GPA", reason: `GPA ${result.gpa} is below required ${rule.minGpa}`, metrics: result };
      }
    }

    return { 
      eligible: true, 
      status: "Eligible", 
      reason: "Meets all academic requirements for promotion.",
      metrics: { gpa: result.gpa, failed: result.failedSubjectsCount }
    };
  }

  /**
   * Execute bulk rollover/promotion.
   */
  static executeRollover(
    studentIds: number[],
    sourceYear: number,
    targetYear: number,
    targetClassMapping: Record<number, number>, // sourceClassId -> targetClassId
    performedBy: string,
    options: { sectionAssignment: "preserve" | "reset"; tradeAssignment: "preserve" | "reset" } = { sectionAssignment: "preserve", tradeAssignment: "preserve" }
  ): { success: number; failed: number; results: any[] } {
    let success = 0;
    let failed = 0;
    const results: any[] = [];

    studentIds.forEach(id => {
      try {
        const evaluation = this.evaluatePromotion(id, sourceYear, targetYear);
        const student = institutionalDb.students.find(s => s.id === id);
        
        if (!evaluation.eligible || !student) {
          failed++;
          results.push({ id, status: "Failed", reason: evaluation.reason });
          return;
        }

        const targetClassId = targetClassMapping[student.classId];
        if (!targetClassId) {
          failed++;
          results.push({ id, status: "Failed", reason: "Target class mapping missing." });
          return;
        }

        const targetClass = ACADEMIC_CLASSES.find(c => c.id === targetClassId);
        
        this.updatePlacement(
          id,
          {
            academicYear: targetYear,
            classId: targetClassId,
            className: targetClass?.name || student.className,
            status: "Active",
            section: options.sectionAssignment === "preserve" ? student.section : "A",
            tradeId: options.tradeAssignment === "preserve" ? student.tradeId : undefined,
            tradeName: options.tradeAssignment === "preserve" ? student.tradeName : undefined,
          },
          evaluation.eligible ? "Promotion (System Automated)" : "Manual Promotion",
          performedBy,
          "Promotion"
        );

        success++;
        results.push({ id, status: "Success" });
      } catch (err: any) {
        failed++;
        results.push({ id, status: "Error", reason: err.message });
      }
    });

    return { success, failed, results };
  }

  /**
   * Record a lifecycle event in the audit log.
   */
  static recordEvent(event: Omit<StudentLifecycleEvent, "id" | "timestamp">): void {
    const newEvent: StudentLifecycleEvent = {
      ...event,
      id: `ev_${Date.now()}_${event.studentId}`,
      timestamp: new Date().toISOString(),
    };
    institutionalDb.lifecycleEvents.push(newEvent);
  }

  /**
   * Duplicate detection foundation.
   */
  static findPotentialDuplicates(student: Partial<Student>): Student[] {
    return institutionalDb.students.filter(s => {
      // Direct matches
      if (s.studentId === student.studentId) return true;
      if (s.birthRegNo && s.birthRegNo === student.birthRegNo) return true;
      
      // Fuzzy matches (Name + DOB)
      const nameMatch = s.name.toLowerCase() === student.name?.toLowerCase();
      const dobMatch = s.dob === student.dob;
      if (nameMatch && dobMatch) return true;

      return false;
    });
  }
}
