import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma, isPrismaAvailable, markPrismaFailure } from "@/lib/prisma";
import { institutionalDb } from "@/lib/database";
import { getHybridStore, saveHybridStore, HybridStudent } from "@/lib/hybridStorageEngine";
import { requireAdmin } from "@/lib/serverAuthGuard";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "students");

function sanitizeRoll(raw: string | null | undefined): string {
  const cleaned = String(raw || "student")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned || "student";
}

function resolveExtensionFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("webp")) return "webp";
  if (m.includes("png")) return "png";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("gif")) return "gif";
  return "webp";
}

/**
 * POST /api/upload/student-photo
 * Saves uploaded student image to public/uploads/students/[roll]-[timestamp].webp
 * and persists the resulting photoUrl to MySQL Student table + hybrid storage.
 */
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req, "/api/upload/student-photo");
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let buffer: Buffer | null = null;
    let ext = "webp";
    let roll = "student";
    let studentId: string | number | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      roll = sanitizeRoll((formData.get("roll") as string) || (formData.get("studentId") as string));
      studentId = (formData.get("studentId") as string) || null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "ছবির ফাইল পাওয়া যায়নি।" },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে পারবে।" },
          { status: 400 }
        );
      }

      const arrayBuf = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuf);
      ext = resolveExtensionFromMime(file.type || file.name || "image/webp");
    } else {
      const body = await req.json();
      roll = sanitizeRoll(body.roll || body.studentId);
      studentId = body.studentId || body.id || null;
      const imageData: string = body.imageData || body.photoUrl || "";

      if (!imageData.startsWith("data:image/")) {
        return NextResponse.json(
          { success: false, error: "বৈধ ইমেজ ফরম্যাট (Base64 বা File) প্রদান করুন।" },
          { status: 400 }
        );
      }

      const match = imageData.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json(
          { success: false, error: "অবৈধ ইমেজ ডেটা ফরম্যাট।" },
          { status: 400 }
        );
      }
      ext = resolveExtensionFromMime(match[1]);
      buffer = Buffer.from(match[2], "base64");
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "খালি ইমেজ ফাইল।" },
        { status: 400 }
      );
    }

    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${roll}-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.promises.writeFile(filePath, buffer);

    const photoUrl = `/uploads/students/${filename}`;

    // Persist photoUrl to MySQL Student table if studentId or numeric roll is provided
    if (studentId && isPrismaAvailable() && prisma) {
      try {
        const numericId = Number(studentId);
        if (!Number.isNaN(numericId) && numericId > 0) {
          await prisma.student.updateMany({
            where: {
              OR: [{ id: numericId }, { roll: numericId }],
            },
            data: { photoUrl },
          });
        } else {
          await prisma.student.updateMany({
            where: { studentId: String(studentId) },
            data: { photoUrl },
          });
        }
      } catch (dbErr) {
        const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
        if (msg.includes("P1001") || msg.includes("ECONNREFUSED") || msg.includes("timed out")) {
          markPrismaFailure();
        } else {
          console.error("[Upload Student Photo] MySQL update failed:", msg);
          return NextResponse.json(
            { success: false, error: `MySQL ছবি আপডেট ব্যর্থ হয়েছে: ${msg}` },
            { status: 500 }
          );
        }
      }
    }

    // Also update in-memory institutionalDb and hybridStorageEngine
    if (studentId) {
      const sIdx = institutionalDb.students.findIndex(
        (s) => String(s.id) === String(studentId) || String(s.studentId) === String(studentId) || String(s.roll) === String(roll)
      );
      if (sIdx >= 0) {
        institutionalDb.students[sIdx].photoUrl = photoUrl;
      }

      const hStore = getHybridStore();
      const hIdx = hStore.students.findIndex(
        (s: HybridStudent) => String(s.id) === String(studentId) || String(s.studentId) === String(studentId) || String(s.roll) === String(roll)
      );
      if (hIdx >= 0) {
        hStore.students[hIdx].avatar = photoUrl;
        saveHybridStore(hStore);
      }
    }

    return NextResponse.json({
      success: true,
      photoUrl,
      filename,
      message: "শিক্ষার্থীর ছবি সফলভাবে আপলোড ও সংরক্ষিত হয়েছে।",
    });
  } catch (error: any) {
    console.error("[Upload Student Photo] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "ছবি আপলোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
