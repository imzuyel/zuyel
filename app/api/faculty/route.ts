import { NextResponse } from "next/server";
import { institutionalDb, FacultyMember } from "@/lib/database";
import { extractRequestIdentity, requireAdmin } from "@/lib/serverAuthGuard";
import { isAuthorizedStaff } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // faculty or staff

    const identity = extractRequestIdentity(req);
    const isStaff = identity.isAuthenticated && isAuthorizedStaff(identity.userRole);

    let list = [...institutionalDb.faculty];
    if (type) {
      list = list.filter((f) => f.type === type);
    }

    // Contact Privacy: Redact private phone numbers for unauthenticated public viewers
    const sanitizedList = list.map((f) => {
      if (isStaff) return f;
      return {
        ...f,
        mobile: "",
        email: f.email ? `${f.email.slice(0, 3)}***@pgtsc.gov.bd` : "",
      };
    });

    return NextResponse.json({
      success: true,
      items: sanitizedList,
      total: sanitizedList.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireAdmin(req, "/api/faculty (POST)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const newMember: FacultyMember = {
      id: Date.now(),
      employeeId: body.employeeId || `EMP-${Date.now() % 1000}`,
      name: body.name,
      nameBangla: body.nameBangla || body.name,
      designation: body.designation,
      department: body.department,
      tradeCode: body.tradeCode,
      qualification: body.qualification || "",
      joiningDate: body.joiningDate || new Date().toISOString().slice(0, 10),
      mobile: body.mobile,
      email: body.email,
      photoUrl:
        body.photoUrl ||
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      order: institutionalDb.faculty.length + 1,
      type: body.type || "faculty",
    };

    institutionalDb.faculty.push(newMember);

    return NextResponse.json({
      success: true,
      member: newMember,
      message: "নতুন কর্মকর্তা/শিক্ষক সফলভাবে যোগ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = requireAdmin(req, "/api/faculty (PUT)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const idx = institutionalDb.faculty.findIndex((f) => f.id === Number(body.id));
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    institutionalDb.faculty[idx] = {
      ...institutionalDb.faculty[idx],
      ...body,
    };

    return NextResponse.json({
      success: true,
      member: institutionalDb.faculty[idx],
      message: "তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req, "/api/faculty (DELETE)");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    institutionalDb.faculty = institutionalDb.faculty.filter((f) => f.id !== Number(id));

    return NextResponse.json({
      success: true,
      message: "সদস্যের তথ্য সফলভাবে অপসারিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
