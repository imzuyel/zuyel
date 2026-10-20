import { NextRequest, NextResponse } from "next/server";
import {
  institutionalDb,
  EmployeeAttendanceRecord,
  EmployeeAttendanceStatus,
  EmployeeAttendanceLock,
  FacultyMember,
} from "@/lib/database";

// Helper to check if a date is a weekly holiday or academic holiday
function checkHolidayStatus(dateStr: string) {
  const dateObj = new Date(dateStr);
  const dayOfWeek = dateObj.getDay(); // 5 = Friday
  const isWeekend = dayOfWeek === 5; // Technical schools off on Friday

  const matchedHoliday = institutionalDb.holidays.find(
    (h) => h.date === dateStr
  );

  return {
    isHoliday: isWeekend || !!matchedHoliday,
    holidayName: isWeekend
      ? "সাপ্তাহিক ছুটি (শুক্রবার)"
      : matchedHoliday
      ? matchedHoliday.titleBangla || matchedHoliday.title
      : undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const month = searchParams.get("month");
    const employeeId = searchParams.get("employeeId");
    const employeeType = searchParams.get("type"); // faculty, staff, all
    const status = searchParams.get("status");
    const action = searchParams.get("action");

    // 1. DATE-BASED HISTORY MATRIX
    if (action === "history") {
      const start = startDate || `${date.slice(0, 7)}-01`;
      const end = endDate || date;

      let historyRecords = institutionalDb.employeeAttendance.filter(
        (r) => r.date >= start && r.date <= end
      );

      if (employeeId) {
        const eId = Number(employeeId);
        historyRecords = historyRecords.filter((r) => r.employeeId === eId);
      }

      if (employeeType && employeeType !== "all") {
        historyRecords = historyRecords.filter((r) => r.type === employeeType);
      }

      return NextResponse.json({
        success: true,
        startDate: start,
        endDate: end,
        records: historyRecords,
        totalRecords: historyRecords.length,
      });
    }

    // 2. SUMMARY METRICS FOR A DATE OR MONTH
    if (action === "summary") {
      const targetDate = date;
      const targetRecords = institutionalDb.employeeAttendance.filter((r) => r.date === targetDate);
      const totalEmployees = institutionalDb.faculty.length;

      const present = targetRecords.filter((r) => r.status === "present").length;
      const late = targetRecords.filter((r) => r.status === "late").length;
      const absent = targetRecords.filter((r) => r.status === "absent").length;
      const onLeave = targetRecords.filter((r) => r.status === "on_leave").length;
      const halfDay = targetRecords.filter((r) => r.status === "half_day").length;
      const officialDuty = targetRecords.filter((r) => r.status === "official_duty").length;
      const holiday = targetRecords.filter((r) => r.status === "holiday").length;

      const effectivePresent = present + late + halfDay * 0.5;
      const percentage = totalEmployees > 0 ? Number(((effectivePresent / totalEmployees) * 100).toFixed(1)) : 0;

      const lock = institutionalDb.employeeAttendanceLocks.find((l) => l.date === targetDate);

      return NextResponse.json({
        success: true,
        date: targetDate,
        totalEmployees,
        present,
        late,
        absent,
        onLeave,
        halfDay,
        officialDuty,
        holiday,
        percentage,
        isLocked: lock ? lock.isLocked : false,
        lockDetails: lock,
      });
    }

    // 3. STANDARD RECORDS QUERY FOR SELECTED DATE OR RANGE
    let records = [...institutionalDb.employeeAttendance];

    if (startDate && endDate) {
      records = records.filter((r) => r.date >= startDate && r.date <= endDate);
    } else if (date) {
      records = records.filter((r) => r.date === date);
    }

    if (month) {
      const paddedMonth = month.padStart(2, "0");
      records = records.filter((r) => {
        const parts = r.date.split("-");
        return parts.length >= 2 && parts[1] === paddedMonth;
      });
    }

    if (employeeId) {
      const eId = Number(employeeId);
      records = records.filter((r) => r.employeeId === eId);
    }

    if (employeeType && employeeType !== "all") {
      records = records.filter((r) => r.type === employeeType);
    }

    if (status && status !== "all") {
      records = records.filter((r) => r.status === status);
    }

    // If records for target date don't exist yet, synthesize view with default/on_leave values
    let synthesizedRecords = [...records];
    if (date && records.length === 0) {
      const holidayInfo = checkHolidayStatus(date);

      synthesizedRecords = institutionalDb.faculty.map((f) => {
        // Check if teacher is on approved leave for this date
        const approvedLeave = institutionalDb.leaveRequests.find(
          (l) => l.employeeId === f.id && l.status === "Approved" && date >= l.startDate && date <= l.endDate
        );

        let initialStatus: EmployeeAttendanceStatus = "present";
        let initialRemarks = "";

        if (holidayInfo.isHoliday) {
          initialStatus = "holiday";
          initialRemarks = holidayInfo.holidayName || "ছুটি";
        } else if (approvedLeave) {
          initialStatus = "on_leave";
          initialRemarks = `${approvedLeave.leaveType} (${approvedLeave.reason})`;
        }

        return {
          id: `${date}_${f.id}`,
          date,
          employeeId: f.id,
          employeeCode: f.employeeId,
          employeeName: f.name,
          employeeNameBangla: f.nameBangla,
          designation: f.designation,
          department: f.department,
          type: f.type,
          photoUrl: f.photoUrl,
          status: initialStatus,
          remarks: initialRemarks,
          checkInTime: initialStatus === "present" ? "08:50 AM" : undefined,
          updatedBy: "Auto-Prepared",
          updatedAt: new Date().toISOString(),
        };
      });
    }

    const lock = institutionalDb.employeeAttendanceLocks.find((l) => l.date === date);

    return NextResponse.json({
      success: true,
      date,
      records: synthesizedRecords,
      total: synthesizedRecords.length,
      isLocked: lock ? lock.isLocked : false,
      lockInfo: lock,
      holidayInfo: checkHolidayStatus(date),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    // 1. LOCK / UNLOCK TOGGLE
    if (action === "toggle_lock") {
      const { date, isLocked, reason, changedBy = "অধ্যক্ষ", userRole = "admin" } = body;
      const isAuth = ["admin", "principal", "superadmin", "super_admin"].includes(String(userRole).toLowerCase());
      if (!isAuth) {
        return NextResponse.json(
          { success: false, error: "হাজিরা লক বা আনলক করার অনুমতি শুধুমাত্র অধ্যক্ষ বা অ্যাডমিনের রয়েছে।" },
          { status: 403 }
        );
      }

      let lock = institutionalDb.employeeAttendanceLocks.find((l) => l.date === date);
      if (lock) {
        lock.isLocked = !!isLocked;
        lock.lockedAt = new Date().toISOString();
        lock.lockedBy = changedBy;
        lock.reason = reason || (isLocked ? "হাজিরা চূড়ান্ত ও লক করা হয়েছে" : "হাজিরা সংশোধনের জন্য আনলক করা হয়েছে");
      } else {
        lock = {
          id: `${date}_all`,
          date,
          employeeType: "all",
          isLocked: !!isLocked,
          lockedAt: new Date().toISOString(),
          lockedBy: changedBy,
          reason: reason || (isLocked ? "হাজিরা চূড়ান্ত ও লক করা হয়েছে" : "হাজিরা আনলক করা হয়েছে"),
        };
        institutionalDb.employeeAttendanceLocks.push(lock);
      }

      return NextResponse.json({
        success: true,
        message: isLocked ? "হাজিরা সফলভাবে লক করা হয়েছে।" : "হাজিরা সফলভাবে আনলক করা হয়েছে।",
        lock,
      });
    }

    // 2. EXCEL IMPORT
    if (action === "import_excel") {
      const { date, rows, changedBy = "Admin", overrideLock = false } = body;
      if (!date || !Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ success: false, error: "তারিখ ও বৈধ এক্সেল ডাটা আবশ্যক।" }, { status: 400 });
      }

      const lock = institutionalDb.employeeAttendanceLocks.find((l) => l.date === date);
      if (lock && lock.isLocked && !overrideLock) {
        return NextResponse.json(
          { success: false, error: "এই তারিখের হাজিরা লক করা আছে। এক্সেল ইমপোর্ট অনুমোদিত নয়।" },
          { status: 403 }
        );
      }

      let imported = 0;
      let skipped = 0;

      rows.forEach((row: any) => {
        const empCode = String(row.employeeCode || row.employeeId || "").trim();
        const empName = String(row.name || row.employeeName || "").trim();
        const statusRaw = String(row.status || "present").trim().toLowerCase();

        const faculty = institutionalDb.faculty.find(
          (f) =>
            f.employeeId.toLowerCase() === empCode.toLowerCase() ||
            f.name.toLowerCase() === empName.toLowerCase() ||
            (f.nameBangla && f.nameBangla.includes(empName))
        );

        if (faculty) {
          const validStatus: EmployeeAttendanceStatus = [
            "present",
            "absent",
            "late",
            "early_leave",
            "half_day",
            "on_leave",
            "official_duty",
            "training",
            "meeting",
            "holiday",
            "working_day",
          ].includes(statusRaw)
            ? (statusRaw as EmployeeAttendanceStatus)
            : "present";

          const recId = `${date}_${faculty.id}`;
          const existingIdx = institutionalDb.employeeAttendance.findIndex((r) => r.id === recId);

          const recordData: EmployeeAttendanceRecord = {
            id: recId,
            date,
            employeeId: faculty.id,
            employeeCode: faculty.employeeId,
            employeeName: faculty.name,
            employeeNameBangla: faculty.nameBangla,
            designation: faculty.designation,
            department: faculty.department,
            type: faculty.type,
            photoUrl: faculty.photoUrl,
            status: validStatus,
            checkInTime: row.checkIn || row.checkInTime || (validStatus === "present" ? "08:50 AM" : undefined),
            checkOutTime: row.checkOut || row.checkOutTime || undefined,
            remarks: row.remarks || "Excel Import",
            updatedBy: changedBy,
            updatedAt: new Date().toISOString(),
          };

          if (existingIdx !== -1) {
            institutionalDb.employeeAttendance[existingIdx] = recordData;
          } else {
            institutionalDb.employeeAttendance.push(recordData);
          }
          imported++;
        } else {
          skipped++;
        }
      });

      return NextResponse.json({
        success: true,
        message: `এক্সেল থেকে ${imported} জন শিক্ষক/স্টাফের হাজিরা সফলভাবে আমদানি করা হয়েছে (${skipped} স্কিপ)।`,
        imported,
        skipped,
      });
    }

    // 3. BULK SAVE FOR A DATE
    if (action === "bulk_save") {
      const { date, records, changedBy = "Teacher/Admin", overrideLock = false } = body;
      if (!date || !Array.isArray(records)) {
        return NextResponse.json({ success: false, error: "তারিখ ও হাজিরা তালিকা আবশ্যক।" }, { status: 400 });
      }

      const lock = institutionalDb.employeeAttendanceLocks.find((l) => l.date === date);
      if (lock && lock.isLocked && !overrideLock) {
        return NextResponse.json(
          { success: false, error: "এই তারিখের হাজিরা লক করা আছে। পরিবর্তন করতে অধ্যক্ষের অনুমতি প্রয়োজন।" },
          { status: 403 }
        );
      }

      let count = 0;
      records.forEach((item: any) => {
        const recId = `${date}_${item.employeeId}`;
        const existingIdx = institutionalDb.employeeAttendance.findIndex((r) => r.id === recId);

        const newRecord: EmployeeAttendanceRecord = {
          id: recId,
          date,
          employeeId: Number(item.employeeId),
          employeeCode: item.employeeCode || `EMP-${item.employeeId}`,
          employeeName: item.employeeName || item.name,
          employeeNameBangla: item.employeeNameBangla || item.nameBangla,
          designation: item.designation,
          department: item.department,
          type: item.type || "faculty",
          photoUrl: item.photoUrl,
          status: item.status,
          checkInTime: item.checkInTime || item.checkIn,
          checkOutTime: item.checkOutTime || item.checkOut,
          remarks: item.remarks || "",
          updatedBy: changedBy,
          updatedAt: new Date().toISOString(),
          auditHistory: [
            ...(existingIdx !== -1 && institutionalDb.employeeAttendance[existingIdx].auditHistory
              ? institutionalDb.employeeAttendance[existingIdx].auditHistory!
              : []),
            {
              id: `audit_${Date.now()}_${item.employeeId}`,
              timestamp: new Date().toISOString(),
              changedBy,
              previousStatus: existingIdx !== -1 ? institutionalDb.employeeAttendance[existingIdx].status : undefined,
              newStatus: item.status,
              reason: item.remarks || "হাজিরা সংরক্ষণ",
            },
          ],
        };

        if (existingIdx !== -1) {
          institutionalDb.employeeAttendance[existingIdx] = newRecord;
        } else {
          institutionalDb.employeeAttendance.push(newRecord);
        }
        count++;
      });

      return NextResponse.json({
        success: true,
        message: `${count} জন শিক্ষক ও কর্মচারীর হাজিরা সফলভাবে ডাটাবেসে সংরক্ষিত হয়েছে।`,
        savedCount: count,
      });
    }

    // 4. SINGLE RECORD CREATE / UPDATE
    const { date, employeeId, status, checkInTime, checkOutTime, remarks, changedBy = "Admin" } = body;
    if (!date || !employeeId || !status) {
      return NextResponse.json(
        { success: false, error: "তারিখ, কর্মচারী আইডি এবং হাজিরা স্থিতি আবশ্যক।" },
        { status: 400 }
      );
    }

    const faculty = institutionalDb.faculty.find((f) => f.id === Number(employeeId));
    if (!faculty) {
      return NextResponse.json({ success: false, error: "শিক্ষক বা কর্মচারী পাওয়া যায়নি।" }, { status: 404 });
    }

    const lock = institutionalDb.employeeAttendanceLocks.find((l) => l.date === date);
    if (lock && lock.isLocked && !body.overrideLock) {
      return NextResponse.json(
        { success: false, error: "এই তারিখের হাজিরা লক করা আছে।" },
        { status: 403 }
      );
    }

    const recId = `${date}_${faculty.id}`;
    const existingIdx = institutionalDb.employeeAttendance.findIndex((r) => r.id === recId);

    const recordData: EmployeeAttendanceRecord = {
      id: recId,
      date,
      employeeId: faculty.id,
      employeeCode: faculty.employeeId,
      employeeName: faculty.name,
      employeeNameBangla: faculty.nameBangla,
      designation: faculty.designation,
      department: faculty.department,
      type: faculty.type,
      photoUrl: faculty.photoUrl,
      status,
      checkInTime,
      checkOutTime,
      remarks,
      updatedBy: changedBy,
      updatedAt: new Date().toISOString(),
      auditHistory: [
        ...(existingIdx !== -1 && institutionalDb.employeeAttendance[existingIdx].auditHistory
          ? institutionalDb.employeeAttendance[existingIdx].auditHistory!
          : []),
        {
          id: `audit_${Date.now()}`,
          timestamp: new Date().toISOString(),
          changedBy,
          previousStatus: existingIdx !== -1 ? institutionalDb.employeeAttendance[existingIdx].status : undefined,
          newStatus: status,
          reason: remarks || "একক হাজিরা এন্ট্রি",
        },
      ],
    };

    if (existingIdx !== -1) {
      institutionalDb.employeeAttendance[existingIdx] = recordData;
    } else {
      institutionalDb.employeeAttendance.push(recordData);
    }

    return NextResponse.json({
      success: true,
      message: `${faculty.name} এর হাজিরা সফলভাবে হালনাগাদ করা হয়েছে।`,
      record: recordData,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, checkInTime, checkOutTime, remarks, changedBy = "Teacher", reason } = body;

    const idx = institutionalDb.employeeAttendance.findIndex((r) => r.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
    }

    const current = institutionalDb.employeeAttendance[idx];
    const prevStatus = current.status;

    institutionalDb.employeeAttendance[idx] = {
      ...current,
      status: status || current.status,
      checkInTime: checkInTime !== undefined ? checkInTime : current.checkInTime,
      checkOutTime: checkOutTime !== undefined ? checkOutTime : current.checkOutTime,
      remarks: remarks !== undefined ? remarks : current.remarks,
      updatedBy: changedBy,
      updatedAt: new Date().toISOString(),
      auditHistory: [
        ...(current.auditHistory || []),
        {
          id: `audit_${Date.now()}`,
          timestamp: new Date().toISOString(),
          changedBy,
          previousStatus: prevStatus,
          newStatus: status || prevStatus,
          reason: reason || remarks || "হাজিরা তথ্য পরিবর্তন",
        },
      ],
    };

    return NextResponse.json({
      success: true,
      message: "হাজিরা তথ্য সফলভাবে সংশোধন করা হয়েছে।",
      record: institutionalDb.employeeAttendance[idx],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userRole = searchParams.get("userRole");

    const isAuth = ["admin", "principal", "superadmin", "super_admin"].includes(String(userRole).toLowerCase());
    if (!isAuth) {
      return NextResponse.json({ success: false, error: "শুধুমাত্র অ্যাডমিনের রেকর্ড মোছার অধিকার রয়েছে।" }, { status: 403 });
    }

    if (!id) return NextResponse.json({ success: false, error: "রেকর্ড আইডি আবশ্যক।" }, { status: 400 });

    institutionalDb.employeeAttendance = institutionalDb.employeeAttendance.filter((r) => r.id !== id);

    return NextResponse.json({
      success: true,
      message: "হাজিরা রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
