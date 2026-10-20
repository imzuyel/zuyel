/**
 * Master Routine Engine for Panchagarh Government Technical School and College (PTSC) - 2026
 * Fully seeded with PTSC 2026 data.
 */

import { INITIAL_MASTER_ROUTINE, PTSC_TEACHERS_CATALOG, PTSC_CLASSES_LIST, MasterRoutineSlot, PTSC_TIME_CONFIG } from "./seedRoutineData";

let masterRoutineSlots: MasterRoutineSlot[] = [...INITIAL_MASTER_ROUTINE];

export class MasterRoutineEngine {
  public static getAllSlots(): MasterRoutineSlot[] {
    return masterRoutineSlots;
  }

  public static getClassRoutine(classGroup: string, day: string): MasterRoutineSlot[] {
    return masterRoutineSlots.filter(
      (s) => s.day === day && s.classGroups.includes(classGroup)
    );
  }

  public static getTeacherRoutine(teacherName: string, day?: string): MasterRoutineSlot[] {
    if (day) {
      return masterRoutineSlots.filter((s) => s.teacherName === teacherName && s.day === day);
    }
    return masterRoutineSlots.filter((s) => s.teacherName === teacherName);
  }

  public static getAvailableTeachers(day: string, period: number, excludeTeacher?: string) {
    const busyTeachers = new Set(
      masterRoutineSlots
        .filter((s) => s.day === day && s.period === period)
        .map((s) => s.teacherName)
    );

    return PTSC_TEACHERS_CATALOG
      .filter((t) => !busyTeachers.has(t.name) && t.name !== excludeTeacher)
      .map((t) => {
        const weeklyLoad = masterRoutineSlots.filter((s) => s.teacherName === t.name).length;
        return { teacherName: t.name, weeklyLoad, designation: t.designation };
      });
  }

  public static reassignSlot(slotId: string, newTeacherName: string): MasterRoutineSlot {
    let slot = masterRoutineSlots.find((s) => s.id === slotId);
    if (!slot) {
      // If slot not found by id, create a mock slot or fallback
      throw new Error("Routine slot not found");
    }

    const conflict = masterRoutineSlots.find(
      (s) => s.day === slot!.day && s.period === slot!.period && s.teacherName === newTeacherName && s.id !== slotId
    );

    if (conflict) {
      throw new Error(`Conflict: Teacher ${newTeacherName} is already assigned on ${slot.day} period ${slot.period}`);
    }

    slot.teacherName = newTeacherName;
    return slot;
  }

  public static resetRoutine() {
    masterRoutineSlots = [...INITIAL_MASTER_ROUTINE];
  }

  public static addCustomSlot(slot: MasterRoutineSlot) {
    masterRoutineSlots.push(slot);
  }
}

export { PTSC_TEACHERS_CATALOG, PTSC_CLASSES_LIST, PTSC_TIME_CONFIG };
