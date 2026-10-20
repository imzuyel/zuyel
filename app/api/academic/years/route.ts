import { NextRequest, NextResponse } from "next/server";
import { prisma, isPrismaAvailable } from "@/lib/prisma";

// Fallback in-memory academic years store for preview resilience
let academicYearsStore = [
  { id: 1, name: "2026", startDate: "2026-01-01", endDate: "2026-12-31", status: "Active", isCurrent: true },
  { id: 2, name: "2025", startDate: "2025-01-01", endDate: "2025-12-31", status: "Inactive", isCurrent: false },
  { id: 3, name: "2027", startDate: "2027-01-01", endDate: "2027-12-31", status: "Upcoming", isCurrent: false },
];

export async function GET(req: NextRequest) {
  try {
    if (isPrismaAvailable()) {
      try {
        const dbYears = await prisma.academicYear.findMany({
          orderBy: { id: "asc" },
        });

        if (dbYears && dbYears.length > 0) {
          return NextResponse.json({
            success: true,
            academicYears: dbYears,
            source: "database",
          });
        }

        // Seed default academic years if empty
        const seeded = [];
        for (const item of academicYearsStore) {
          const created = await prisma.academicYear.upsert({
            where: { name: item.name },
            update: {},
            create: {
              name: item.name,
              startDate: item.startDate,
              endDate: item.endDate,
              status: item.status,
              isCurrent: item.isCurrent,
            },
          });
          seeded.push(created);
        }

        return NextResponse.json({
          success: true,
          academicYears: seeded,
          source: "database_seeded",
        });
      } catch (dbErr: any) {
        console.warn("[Academic Years API] DB query failed, falling back to memory store:", dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      academicYears: academicYearsStore,
      source: "memory_fallback",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, startDate, endDate, status, isCurrent } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Academic year name is required." }, { status: 400 });
    }

    // Sync memory store
    if (isCurrent) {
      academicYearsStore = academicYearsStore.map((y) => ({
        ...y,
        isCurrent: false,
        status: y.status === "Active" ? "Inactive" : y.status,
      }));
    }

    const fallbackNewYear = {
      id: Date.now(),
      name,
      startDate: startDate || `${name}-01-01`,
      endDate: endDate || `${name}-12-31`,
      status: status || (isCurrent ? "Active" : "Inactive"),
      isCurrent: !!isCurrent,
    };
    academicYearsStore.unshift(fallbackNewYear);

    if (isPrismaAvailable()) {
      try {
        if (isCurrent) {
          await prisma.academicYear.updateMany({
            data: { isCurrent: false, status: "Inactive" },
          });
        }

        const createdDbYear = await prisma.academicYear.create({
          data: {
            name,
            startDate: startDate || `${name}-01-01`,
            endDate: endDate || `${name}-12-31`,
            status: status || (isCurrent ? "Active" : "Inactive"),
            isCurrent: !!isCurrent,
          },
        });

        const allDbYears = await prisma.academicYear.findMany({ orderBy: { id: "asc" } });

        return NextResponse.json({
          success: true,
          message: "Academic Year created successfully in database.",
          academicYear: createdDbYear,
          academicYears: allDbYears,
          source: "database",
        });
      } catch (dbErr: any) {
        console.warn("[Academic Years API] DB write failed, fallback active:", dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Academic Year created successfully.",
      academicYear: fallbackNewYear,
      academicYears: academicYearsStore,
      source: "memory_fallback",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, startDate, endDate, status, isCurrent } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Academic Year ID is required." }, { status: 400 });
    }

    // Sync memory store
    const index = academicYearsStore.findIndex((y) => y.id === Number(id));
    if (index !== -1) {
      if (isCurrent) {
        academicYearsStore = academicYearsStore.map((y) => ({
          ...y,
          isCurrent: false,
        }));
      }
      academicYearsStore[index] = {
        ...academicYearsStore[index],
        name: name || academicYearsStore[index].name,
        startDate: startDate || academicYearsStore[index].startDate,
        endDate: endDate || academicYearsStore[index].endDate,
        status: status || academicYearsStore[index].status,
        isCurrent: isCurrent !== undefined ? isCurrent : academicYearsStore[index].isCurrent,
      };
    }

    if (isPrismaAvailable()) {
      try {
        if (isCurrent) {
          await prisma.academicYear.updateMany({
            data: { isCurrent: false },
          });
        }

        const updatedDbYear = await prisma.academicYear.update({
          where: { id: Number(id) },
          data: {
            ...(name && { name }),
            ...(startDate && { startDate }),
            ...(endDate && { endDate }),
            ...(status && { status }),
            ...(isCurrent !== undefined && { isCurrent: Boolean(isCurrent) }),
          },
        });

        const allDbYears = await prisma.academicYear.findMany({ orderBy: { id: "asc" } });

        return NextResponse.json({
          success: true,
          message: "Academic Year updated successfully in database.",
          academicYear: updatedDbYear,
          academicYears: allDbYears,
          source: "database",
        });
      } catch (dbErr: any) {
        console.warn("[Academic Years API] DB update failed, fallback active:", dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Academic Year updated successfully.",
      academicYears: academicYearsStore,
      source: "memory_fallback",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
