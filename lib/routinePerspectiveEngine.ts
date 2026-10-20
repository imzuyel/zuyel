/**
 * Multi-Perspective Routine Engine for Panchagarh Government Technical School and College (PTSC)
 * Supports Class-wise, Teacher-wise, Room-wise, and Lab-wise slicing and filtering.
 */

import { RoutineSlot, RoutineConfig, RoutineEngineManager } from "./routineEngine";

export type PerspectiveType = "class" | "teacher" | "room" | "lab";

export interface PerspectiveFilterParams {
  viewType: PerspectiveType;
  targetId?: string;
  targetName?: string;
}

export interface PerspectiveResult {
  viewType: PerspectiveType;
  title: string;
  subtitle: string;
  totalWeeklyPeriods: number;
  config: RoutineConfig;
  slots: RoutineSlot[];
  meta?: {
    teacherLoad?: number;
    roomUtilizationPercent?: number;
    labName?: string;
  };
}

export class RoutinePerspectiveEngine {
  public static getPerspectiveData(params: PerspectiveFilterParams): PerspectiveResult {
    const allSlots = RoutineEngineManager.getSlots();
    const config = RoutineEngineManager.getConfig();

    const { viewType, targetId, targetName } = params;

    let filteredSlots: RoutineSlot[] = [];
    let title = "";
    let subtitle = "";
    let meta: any = {};

    switch (viewType) {
      case "class": {
        const targetClass = targetName || "ডিপ্লোমা (১০ম শ্রেণি)";
        filteredSlots = allSlots.filter((s) => s.className === targetClass || s.classId === targetId);
        title = `শ্রেণিভিত্তিক রুটিন: ${targetClass}`;
        subtitle = "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ - অ্যাকাডেমিক সেশন ২০২৫-২০২৬";
        break;
      }
      case "teacher": {
        const teacher = targetName || "প্রকৌ: মো: তৌহিদুল ইসলাম";
        filteredSlots = allSlots.filter((s) => s.teacherName === teacher || s.teacherId === targetId);
        const weeklyLoad = filteredSlots.length;
        title = `শিক্ষকভিত্তিক রুটিন: ${teacher}`;
        subtitle = `শিক্ষকের সাপ্তাহিক মোট ক্লাস: ${weeklyLoad}টি`;
        meta = { teacherLoad: weeklyLoad };
        break;
      }
      case "room": {
        const room = targetName || "Room 204";
        filteredSlots = allSlots.filter((s) => s.roomNo === room);
        const utilization = Math.round((filteredSlots.length / (6 * config.totalPeriods)) * 100);
        title = `রুমভিত্তিক শিডিউল: ${room}`;
        subtitle = `রুম ব্যবহার হার (Utilization): ${utilization}%`;
        meta = { roomUtilizationPercent: utilization };
        break;
      }
      case "lab": {
        const lab = targetName || "IoT Lab";
        filteredSlots = allSlots.filter((s) => s.labName === lab || s.roomNo.includes(lab));
        title = `প্র্যাকটিক্যাল ল্যাব ও ওয়ার্কশপ শিডিউল: ${lab}`;
        subtitle = "টেকনিক্যাল প্র্যাকটিক্যাল ও ওয়ার্কশপ সেশন";
        meta = { labName: lab };
        break;
      }
      default:
        filteredSlots = allSlots;
        title = "মাস্টার রুটিন";
        subtitle = "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ";
    }

    return {
      viewType,
      title,
      subtitle,
      totalWeeklyPeriods: filteredSlots.length,
      config,
      slots: filteredSlots,
      meta
    };
  }
}
