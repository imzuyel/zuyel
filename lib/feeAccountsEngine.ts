/**
 * Smart Fee and Accounts Collection Engine
 * Panchagarh Government Technical School and College (PTSC)
 * 
 * Manages tuition fees, admission fees, board registration, exam fees,
 * due balance tracking, and instant Bengali money receipt generation.
 */

export type FeeHeadType =
  | "ADMISSION"
  | "TUITION"
  | "SEMESTER_EXAM"
  | "SESSION_CHARGE"
  | "BOARD_REGISTRATION"
  | "ID_CARD"
  | "TC_FEE"
  | "MISCELLANEOUS";

export interface FeeItemDetail {
  head: FeeHeadType;
  titleBangla: string;
  amount: number;
}

export interface FeeInvoice {
  id: string;
  invoiceNumber: string; // e.g. PTSC-FEE-2026-0042
  studentId: string;
  studentCode: string;
  roll: string;
  name: string;
  className: string;
  tradeName: string;
  items: FeeItemDetail[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: "CASH" | "BKASH" | "NAGAD" | "BANK_DEPOSIT";
  transactionId?: string;
  receiptDate: string;
  collectedBy: string;
  status: "PAID" | "PARTIAL" | "DUE";
}

export const PTSC_INITIAL_FEE_INVOICES: FeeInvoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "PTSC-FEE-2026-0001",
    studentId: "std-104",
    studentCode: "2026104",
    roll: "১০৪",
    name: "রিপন ইসলাম",
    className: "ডিপ্লোমা (১০ম শ্রেণি)",
    tradeName: "IT Support & IoT",
    items: [
      { head: "TUITION", titleBangla: "মাসিক টিউশন ফি (জানুয়ারি-ফেব্রুয়ারি)", amount: 600 },
      { head: "SEMESTER_EXAM", titleBangla: "সেমিস্টার ফাইনাল পরীক্ষা ফি", amount: 450 },
      { head: "SESSION_CHARGE", titleBangla: "সেশন চার্জ ও ল্যাব মেইনটেন্যান্স", amount: 500 }
    ],
    totalAmount: 1550,
    paidAmount: 1550,
    dueAmount: 0,
    paymentMethod: "BKASH",
    transactionId: "9G874XYZ12",
    receiptDate: new Date().toISOString(),
    collectedBy: "প্রধান হিসাবরক্ষক (PTSC Accounts)",
    status: "PAID"
  },
  {
    id: "inv-2",
    invoiceNumber: "PTSC-FEE-2026-0002",
    studentId: "std-105",
    studentCode: "2026105",
    roll: "১০৫",
    name: "সুমাইয়া আক্তার",
    className: "ভোকেশনাল (৯ম শ্রেণি)",
    tradeName: "Electrical Works",
    items: [
      { head: "BOARD_REGISTRATION", titleBangla: "বোর্ড রেজিস্ট্রেশন ফি (BTEB)", amount: 850 },
      { head: "ID_CARD", titleBangla: "স্মার্ট আইডি কার্ড ও লোগো", amount: 150 }
    ],
    totalAmount: 1000,
    paidAmount: 500,
    dueAmount: 500,
    paymentMethod: "CASH",
    receiptDate: new Date(Date.now() - 86400000).toISOString(),
    collectedBy: "হিসাব সহকারী",
    status: "PARTIAL"
  },
  {
    id: "inv-3",
    invoiceNumber: "PTSC-FEE-2026-0003",
    studentId: "std-101",
    studentCode: "2026101",
    roll: "১০১",
    name: "আরিফ হোসেন",
    className: "ডিপ্লোমা (১০ম শ্রেণি)",
    tradeName: "Computer Science & Tech",
    items: [
      { head: "TUITION", titleBangla: "মাসিক টিউশন ফি (জানুয়ারি)", amount: 600 },
      { head: "SEMESTER_EXAM", titleBangla: "সেমিস্টার ফাইনাল ফি", amount: 450 }
    ],
    totalAmount: 1050,
    paidAmount: 1050,
    dueAmount: 0,
    paymentMethod: "NAGAD",
    transactionId: "7821990ABX",
    receiptDate: new Date(Date.now() - 172800000).toISOString(),
    collectedBy: "ক্যাশ কাউন্টার-০১",
    status: "PAID"
  },
  {
    id: "inv-4",
    invoiceNumber: "PTSC-FEE-2026-0004",
    studentId: "std-102",
    studentCode: "2026102",
    roll: "১০২",
    name: "তানজিলা রহমান",
    className: "ভোকেশনাল (১০ম শ্রেণি)",
    tradeName: "Civil Technology",
    items: [
      { head: "ADMISSION", titleBangla: "বার্ষিক ভর্তি ও সেশন ফি", amount: 1200 },
      { head: "ID_CARD", titleBangla: "ডিজিটাল আইডি কার্ড", amount: 150 }
    ],
    totalAmount: 1350,
    paidAmount: 1350,
    dueAmount: 0,
    paymentMethod: "CASH",
    receiptDate: new Date(Date.now() - 259200000).toISOString(),
    collectedBy: "প্রধান হিসাবরক্ষক",
    status: "PAID"
  },
  {
    id: "inv-5",
    invoiceNumber: "PTSC-FEE-2026-0005",
    studentId: "std-103",
    studentCode: "2026103",
    roll: "১০৩",
    name: "মেহেদী হাসান",
    className: "ডিপ্লোমা (৯ম শ্রেণি)",
    tradeName: "Mechanical Technology",
    items: [
      { head: "BOARD_REGISTRATION", titleBangla: "কারিগরি বোর্ড রেজিস্ট্রেশন ফি", amount: 850 },
      { head: "TUITION", titleBangla: "টিউশন ফি (জানুয়ারি)", amount: 600 }
    ],
    totalAmount: 1450,
    paidAmount: 1000,
    dueAmount: 450,
    paymentMethod: "BKASH",
    transactionId: "BKASH981240",
    receiptDate: new Date(Date.now() - 345600000).toISOString(),
    collectedBy: "ক্যাশ কাউন্টার-০২",
    status: "PARTIAL"
  }
];

export class FeeAccountsManager {
  private static invoices: FeeInvoice[] = [...PTSC_INITIAL_FEE_INVOICES];

  public static getInvoices(): FeeInvoice[] {
    return this.invoices;
  }

  public static createInvoice(data: Omit<FeeInvoice, "id" | "invoiceNumber" | "receiptDate">): FeeInvoice {
    const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);
    const dueAmount = Math.max(0, totalAmount - data.paidAmount);
    let status: "PAID" | "PARTIAL" | "DUE" = "DUE";
    if (data.paidAmount >= totalAmount) {
      status = "PAID";
    } else if (data.paidAmount > 0) {
      status = "PARTIAL";
    }

    const newInvoice: FeeInvoice = {
      ...data,
      id: `inv-${Date.now()}`,
      invoiceNumber: `PTSC-FEE-2026-${String(this.invoices.length + 1).padStart(4, "0")}`,
      totalAmount,
      dueAmount,
      status,
      receiptDate: new Date().toISOString()
    };

    this.invoices.unshift(newInvoice);
    return newInvoice;
  }
}
