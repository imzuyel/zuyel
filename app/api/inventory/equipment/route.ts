import { NextRequest, NextResponse } from "next/server";
import { LabInventoryManager } from "@/lib/labInventoryEngine";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    let equipment = LabInventoryManager.getEquipment();

    if (hasDatabaseUrl) {
      try {
        if (prisma && prisma.labEquipment) {
          const dbItems = await prisma.labEquipment.findMany();
          if (dbItems && dbItems.length > 0) {
            equipment = dbItems;
          }
        }
      } catch (err) {
        console.warn("[Inventory GET] Prisma fallback to memory:", err);
      }
    }

    return NextResponse.json({
      success: true,
      equipment,
      issueRecords: LabInventoryManager.getIssueRecords()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body || {};

    if (action === "ADD") {
      const newItem = LabInventoryManager.addEquipment({
        ...data,
        availableQuantity: data.totalQuantity || 1,
        damagedQuantity: 0,
        conditionStatus: "GOOD"
      });

      if (hasDatabaseUrl) {
        try {
          if (prisma && prisma.labEquipment) {
            await prisma.labEquipment.create({ data: newItem });
          }
        } catch (dbErr) {
          console.warn("[Inventory POST] Prisma create sync warning:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Equipment added successfully",
        item: newItem
      });
    }

    if (action === "ISSUE") {
      const record = LabInventoryManager.issueItem(data);
      return NextResponse.json({
        success: true,
        message: "Equipment issued successfully",
        record
      });
    }

    if (action === "RETURN") {
      const success = LabInventoryManager.returnItem(data.issueId);
      return NextResponse.json({
        success,
        message: success ? "Equipment returned successfully" : "Failed to return item"
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid inventory action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Inventory POST Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process inventory request" },
      { status: 500 }
    );
  }
}
