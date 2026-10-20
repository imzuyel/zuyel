import { NextRequest } from "next/server";
import { ACADEMIC_CLASSES, ALL_TRADES, getApplicableTradesForClass, getSubjectsForClass, parseClassNumeric } from "@/lib/academicStructure";
import { apiSuccess, apiError } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classVal = searchParams.get("classVal");
    const tradeVal = searchParams.get("tradeVal");
    const academicYear = searchParams.get("academicYear") || "2026";

    const numericClass = parseClassNumeric(classVal);
    const applicableTrades = numericClass > 0 ? getApplicableTradesForClass(numericClass) : ALL_TRADES;
    const applicableSubjects = numericClass > 0 ? getSubjectsForClass(numericClass, tradeVal) : [];

    return apiSuccess({
      academicYear,
      selectedClass: numericClass || null,
      hasTrade: numericClass >= 9 && numericClass <= 12,
      classes: ACADEMIC_CLASSES,
      allTrades: ALL_TRADES,
      applicableTrades,
      applicableSubjects,
    }, {
      message: "Academic context loaded successfully",
      extraKeys: {
        context: {
          academicYear,
          selectedClass: numericClass || null,
          hasTrade: numericClass >= 9 && numericClass <= 12,
          classes: ACADEMIC_CLASSES,
          allTrades: ALL_TRADES,
          applicableTrades,
          applicableSubjects,
        },
      },
    });
  } catch (error: any) {
    return apiError(error, { fallbackMessage: "একাডেমিক কনটেক্সট লোড করতে ব্যর্থ হয়েছে" });
  }
}
