import { NextRequest, NextResponse } from "next/server";
import { FeeAccountsManager } from "@/lib/feeAccountsEngine";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { verifyBackendAuthorization, requireStaffOrAdmin } from "@/lib/serverAuthGuard";

export async function GET(req: NextRequest) {
  const auth = requireStaffOrAdmin(req, "/api/accounts/fees");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    let invoices = FeeAccountsManager.getInvoices();

    if (hasDatabaseUrl) {
      try {
        if (prisma && prisma.feeInvoice) {
          const dbInvoices = await prisma.feeInvoice.findMany({
            orderBy: { receiptDate: "desc" }
          });
          if (dbInvoices && dbInvoices.length > 0) {
            invoices = dbInvoices.map((inv: any) => ({
              ...inv,
              items: typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items
            }));
          }
        }
      } catch (err) {
        console.warn("[Fee GET] Prisma fallback to memory:", err);
      }
    }

    return NextResponse.json({
      success: true,
      invoices
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch fee invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyBackendAuthorization(req, {
    requiredPermission: "manage_fees",
    endpointName: "/api/accounts/fees",
  });
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const newInvoice = FeeAccountsManager.createInvoice(body);

    if (hasDatabaseUrl) {
      try {
        if (prisma && prisma.feeInvoice) {
          await prisma.feeInvoice.create({
            data: {
              ...newInvoice,
              items: JSON.stringify(newInvoice.items)
            }
          });
        }
      } catch (dbErr) {
        console.warn("[Fee POST] Prisma sync warning:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Fee collected and receipt generated successfully",
      invoice: newInvoice
    });
  } catch (error: any) {
    console.error("[Fee POST Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to collect fee" },
      { status: 500 }
    );
  }
}
