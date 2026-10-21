import { NextRequest, NextResponse } from "next/server";
import { parseClassNumeric, doesClassHaveTrade, isTradeValidForClass } from "@/lib/academicStructure";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { academicYear, classVal, tradeVal, subjectCode } = body;

    const errors: string[] = [];

    // 1. Validate Academic Year
    if (!academicYear) {
      errors.push("Academic Year is required and must be valid.");
    }

    // 2. Validate Class
    const numericClass = parseClassNumeric(classVal);
    if (numericClass < 6 || numericClass > 12) {
      errors.push(`Invalid Class value: "${classVal}". Must be between Class 6 and Class 12.`);
    }

    // 3. Validate Trade Applicability Rule
    const hasTrade = doesClassHaveTrade(numericClass);
    if (!hasTrade) {
      // Pre-Vocational Class 6-8 must NOT have trade
      if (tradeVal !== undefined && tradeVal !== null && tradeVal !== "" && tradeVal !== "None" && tradeVal !== 0 && tradeVal !== "0") {
        errors.push(`Violation: Pre-Vocational Class ${numericClass} cannot have a vocational trade assigned.`);
      }
    } else {
      // SSC / HSC Class 9-12 must have a valid trade
      if (!isTradeValidForClass(numericClass, tradeVal)) {
        errors.push(`Violation: Class ${numericClass} requires a valid applicable vocational trade.`);
      }
    }

    // 4. Validate Theory/Practical Mark Splits (BTEB Regulations)
    const { fullMarks, theoryMarks, practicalMarks, passMarks } = body;
    if (fullMarks !== undefined) {
      const fMarks = Number(fullMarks);
      if (Number.isNaN(fMarks) || fMarks <= 0 || fMarks > 300) {
        errors.push("Full marks must be a positive integer between 1 and 300.");
      } else {
        const tMarks = theoryMarks !== undefined ? Number(theoryMarks) : 0;
        const pMarks = practicalMarks !== undefined ? Number(practicalMarks) : 0;
        if (tMarks < 0 || pMarks < 0) {
          errors.push("Theory and practical marks cannot be negative.");
        } else if (tMarks + pMarks > fMarks) {
          errors.push(`Sum of Theory (${tMarks}) and Practical (${pMarks}) cannot exceed Full Marks (${fMarks}).`);
        }

        if (passMarks !== undefined) {
          const pass = Number(passMarks);
          if (pass < 0 || pass > fMarks) {
            errors.push(`Pass marks (${pass}) must be between 0 and full marks (${fMarks}).`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        valid: false,
        errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: "Academic context validation passed successfully on authoritative backend.",
      normalized: {
        academicYear,
        numericClass,
        hasTrade,
        tradeVal: tradeVal || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
