import { NextRequest, NextResponse } from "next/server";
import {
  institutionalDb,
  EmployeeLeaveRequest,
  EmployeeAttendanceRecord,
} from "@/lib/database";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const action = searchParams.get("action");

    let list = [...institutionalDb.leaveRequests];

    if (employeeId) {
      const eId = Number(employeeId);
      list = list.filter((l) => l.employeeId === eId);
    }

    if (status && status !== "all") {
      list = list.filter((l) => l.status === status);
    }

    if (startDate && endDate) {
      list = list.filter((l) => l.startDate <= endDate && l.endDate >= startDate);
    }

    if (action === "summary") {
      const totalLeaves = list.length;
      const approved = list.filter((l) => l.status === "Approved").length;
      const pending = list.filter((l) => l.status === "Submitted").length;
      const rejected = list.filter((l) => l.status === "Rejected").length;

      // Group by leave types
      const byType: Record<string, number> = {};
      list.forEach((l) => {
        byType[l.leaveType] = (byType[l.leaveType] || 0) + 1;
      });

      return NextResponse.json({
        success: true,
        summary: { totalLeaves, approved, pending, rejected, byType },
      });
    }

    return NextResponse.json({
      success: true,
      leaves: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      total: list.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      supportingDocUrl,
      substituteEmployeeId,
      userRole = "teacher",
      status = "Submitted",
      approvedBy,
    } = body;

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, error: "শিক্ষক আইডি, ছুটির ধরন, শুরুর তারিখ, শেষ তারিখ এবং কারণ আবশ্যক।" },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, error: "ছুটির শুরুর তারিখ শেষ তারিখের চেয়ে বড় হতে পারে না।" },
        { status: 400 }
      );
    }

    const faculty = institutionalDb.faculty.find((f) => f.id === Number(employeeId));
    if (!faculty) {
      return NextResponse.json({ success: false, error: "শিক্ষক বা কর্মচারী খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    // Check for overlapping leaves for the same employee
    const overlapping = institutionalDb.leaveRequests.find(
      (l) =>
        l.employeeId === Number(employeeId) &&
        l.status !== "Rejected" &&
        l.status !== "Cancelled" &&
        l.startDate <= endDate &&
        l.endDate >= startDate
    );

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          error: `এই শিক্ষক ইতিমধ্যে এই সময়ে (${overlapping.startDate} থেকে ${overlapping.endDate}) ছুটির জন্য আবেদন করেছেন (আইডি: ${overlapping.id})।`,
        },
        { status: 400 }
      );
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let substituteName: string | undefined = undefined;
    if (substituteEmployeeId) {
      if (Number(substituteEmployeeId) === Number(employeeId)) {
        return NextResponse.json(
          { success: false, error: "বিকল্প শিক্ষক এবং আবেদনকারী শিক্ষক একই ব্যক্তি হতে পারেন না।" },
          { status: 400 }
        );
      }
      const sub = institutionalDb.faculty.find((f) => f.id === Number(substituteEmployeeId));
      if (sub) substituteName = sub.nameBangla || sub.name;
    }

    const isAdmin = ["admin", "principal", "superadmin", "super_admin"].includes(String(userRole).toLowerCase());
    const initialStatus = isAdmin && status === "Approved" ? "Approved" : "Submitted";

    const newLeave: EmployeeLeaveRequest = {
      id: `LV-${new Date().getFullYear()}-${String(institutionalDb.leaveRequests.length + 1).padStart(3, "0")}`,
      employeeId: faculty.id,
      employeeCode: faculty.employeeId,
      employeeName: faculty.name,
      designation: faculty.designation,
      department: faculty.department,
      employeeType: faculty.type,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      supportingDocUrl,
      substituteEmployeeId: substituteEmployeeId ? Number(substituteEmployeeId) : undefined,
      substituteEmployeeName: substituteName,
      status: initialStatus,
      appliedDate: new Date().toISOString().split("T")[0],
      approvedBy: initialStatus === "Approved" ? approvedBy || "অধ্যক্ষ" : undefined,
      approvedDate: initialStatus === "Approved" ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    institutionalDb.leaveRequests.unshift(newLeave);

    // If pre-approved by admin, sync to employeeAttendance
    if (initialStatus === "Approved") {
      let curr = new Date(startDate);
      const last = new Date(endDate);
      while (curr <= last) {
        const dStr = curr.toISOString().split("T")[0];
        const recId = `${dStr}_${faculty.id}`;
        const existingIdx = institutionalDb.employeeAttendance.findIndex((r) => r.id === recId);

        const leaveAttRecord: EmployeeAttendanceRecord = {
          id: recId,
          date: dStr,
          employeeId: faculty.id,
          employeeCode: faculty.employeeId,
          employeeName: faculty.name,
          employeeNameBangla: faculty.nameBangla,
          designation: faculty.designation,
          department: faculty.department,
          type: faculty.type,
          photoUrl: faculty.photoUrl,
          status: "on_leave",
          remarks: `${leaveType} (${reason})`,
          updatedBy: "Leave Approval Sync",
          updatedAt: new Date().toISOString(),
        };

        if (existingIdx !== -1) {
          institutionalDb.employeeAttendance[existingIdx] = leaveAttRecord;
        } else {
          institutionalDb.employeeAttendance.push(leaveAttRecord);
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    return NextResponse.json({
      success: true,
      message: initialStatus === "Approved" ? "ছুটি অনুমোদিত ও সক্রিয় করা হয়েছে।" : "ছুটির আবেদন সফলভাবে দাখিল করা হয়েছে।",
      leave: newLeave,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, remarks, rejectionReason, approvedBy = "অধ্যক্ষ", userRole = "admin" } = body;

    const isAdmin = ["admin", "principal", "superadmin", "super_admin"].includes(String(userRole).toLowerCase());
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "ছুটি অনুমোদন বা প্রত্যাখ্যান করার অনুমতি শুধুমাত্র অধ্যক্ষ বা অ্যাডমিনের রয়েছে।" },
        { status: 403 }
      );
    }

    const idx = institutionalDb.leaveRequests.findIndex((l) => l.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "ছুটির আবেদন পাওয়া যায়নি।" }, { status: 404 });
    }

    const current = institutionalDb.leaveRequests[idx];
    const prevStatus = current.status;

    institutionalDb.leaveRequests[idx] = {
      ...current,
      status: status || current.status,
      remarks: remarks !== undefined ? remarks : current.remarks,
      rejectionReason: status === "Rejected" ? rejectionReason || "কর্তৃপক্ষ কর্তৃক ছুটি মঞ্জুর হয়নি" : undefined,
      approvedBy: status === "Approved" ? approvedBy : current.approvedBy,
      approvedDate: status === "Approved" ? new Date().toISOString() : current.approvedDate,
      updatedAt: new Date().toISOString(),
    };

    const updated = institutionalDb.leaveRequests[idx];

    // Auto-sync with Employee Attendance when Approved
    if (status === "Approved") {
      let curr = new Date(updated.startDate);
      const last = new Date(updated.endDate);
      while (curr <= last) {
        const dStr = curr.toISOString().split("T")[0];
        const recId = `${dStr}_${updated.employeeId}`;
        const existingIdx = institutionalDb.employeeAttendance.findIndex((r) => r.id === recId);

        const leaveAttRecord: EmployeeAttendanceRecord = {
          id: recId,
          date: dStr,
          employeeId: updated.employeeId,
          employeeCode: updated.employeeCode,
          employeeName: updated.employeeName,
          designation: updated.designation,
          department: updated.department,
          type: updated.employeeType,
          status: "on_leave",
          remarks: `${updated.leaveType} (${updated.reason})`,
          updatedBy: "Leave Approval Sync",
          updatedAt: new Date().toISOString(),
        };

        if (existingIdx !== -1) {
          institutionalDb.employeeAttendance[existingIdx] = leaveAttRecord;
        } else {
          institutionalDb.employeeAttendance.push(leaveAttRecord);
        }
        curr.setDate(curr.getDate() + 1);
      }
    } else if (prevStatus === "Approved" && (status === "Rejected" || status === "Cancelled")) {
      // Revert attendance records that were marked as on_leave
      let curr = new Date(updated.startDate);
      const last = new Date(updated.endDate);
      while (curr <= last) {
        const dStr = curr.toISOString().split("T")[0];
        const recId = `${dStr}_${updated.employeeId}`;
        const existingIdx = institutionalDb.employeeAttendance.findIndex((r) => r.id === recId);
        if (existingIdx !== -1 && institutionalDb.employeeAttendance[existingIdx].status === "on_leave") {
          institutionalDb.employeeAttendance[existingIdx].status = "absent";
          institutionalDb.employeeAttendance[existingIdx].remarks = "ছুটি বাতিল/প্রত্যাখ্যান হওয়ায় অনুপস্থিত";
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    return NextResponse.json({
      success: true,
      message: `ছুটির আবেদন সফলভাবে '${status}' করা হয়েছে।`,
      leave: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "আইডি আবশ্যক।" }, { status: 400 });

    const idx = institutionalDb.leaveRequests.findIndex((l) => l.id === id);
    if (idx === -1) return NextResponse.json({ success: false, error: "ছুটির আবেদন পাওয়া যায়নি।" }, { status: 404 });

    institutionalDb.leaveRequests.splice(idx, 1);

    return NextResponse.json({
      success: true,
      message: "ছুটির আবেদন সফলভাবে বাতিল ও মুছে ফেলা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
