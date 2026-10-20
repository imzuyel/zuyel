/**
 * Technical Lab Equipment & Inventory Tracking Engine
 * Panchagarh Government Technical School and College (PTSC)
 * 
 * Manages machinery, hand tools, electronic components, and consumables across PTSC labs
 * (IT Support & IoT Lab, Electrical Workshop, Automotive Lab, RAC Lab) with issue/return tracking.
 */

export interface LabEquipment {
  id: string;
  itemCode: string; // e.g. LAB-IT-001
  name: string;
  nameBangla: string;
  tradeCode: "IT" | "EE" | "CIVIL" | "AMB" | "RAC" | "GENERAL";
  labLocation: string; // e.g. Room 204 - IoT Lab
  category: "Heavy Machinery" | "Hand Tools" | "Electronic Components" | "Consumables" | "Safety Gear";
  totalQuantity: number;
  availableQuantity: number;
  damagedQuantity: number;
  conditionStatus: "GOOD" | "UNDER_MAINTENANCE" | "DAMAGED" | "OBSOLETE";
  unitPrice: number;
  purchaseDate: string;
  supplier?: string;
  notes?: string;
  updatedAt: string;
}

export interface LabIssueRecord {
  id: string;
  equipmentId: string;
  itemCode: string;
  itemName: string;
  borrowerName: string;
  borrowerRole: "student" | "instructor" | "technician";
  rollOrId?: string;
  tradeCode: string;
  quantityIssued: number;
  issuedAt: string;
  expectedReturnDate: string;
  returnedAt?: string;
  status: "ISSUED" | "RETURNED" | "OVERDUE" | "DAMAGED_ON_RETURN";
}

// In-memory persistent preview storage for PTSC Labs
export const PTSC_INITIAL_LAB_EQUIPMENT: LabEquipment[] = [
  {
    id: "eq-1",
    itemCode: "LAB-IT-001",
    name: "Arduino Uno R3 Development Board",
    nameBangla: "আর্ডুইনো উনো আর৩ মাইক্রোকন্ট্রোলার বোর্ড",
    tradeCode: "IT",
    labLocation: "Room 204 - IoT Lab",
    category: "Electronic Components",
    totalQuantity: 50,
    availableQuantity: 42,
    damagedQuantity: 2,
    conditionStatus: "GOOD",
    unitPrice: 850,
    purchaseDate: "2025-01-15",
    supplier: "TechBD Electronics",
    notes: "সৈনিক ও আইটি ট্রেডের প্র্যাকটিক্যাল কাজের জন্য সংরক্ষিত।",
    updatedAt: new Date().toISOString()
  },
  {
    id: "eq-2",
    itemCode: "LAB-IT-002",
    name: "Digital Multimeter (Fluke 101)",
    nameBangla: "ডিজিটাল মাল্টিমিটার",
    tradeCode: "IT",
    labLocation: "Room 204 - IoT Lab",
    category: "Hand Tools",
    totalQuantity: 25,
    availableQuantity: 18,
    damagedQuantity: 1,
    conditionStatus: "GOOD",
    unitPrice: 2200,
    purchaseDate: "2025-02-10",
    supplier: "Karigari Store",
    notes: "ভোল্টেজ ও রেজিস্ট্যান্স পরিমাপের জন্য।",
    updatedAt: new Date().toISOString()
  },
  {
    id: "eq-3",
    itemCode: "LAB-EE-101",
    name: "AC/DC Training Panel Workbench",
    nameBangla: "এসি/ডিসি ট্রেনিং প্যানেল ওয়ার্কবেঞ্চ",
    tradeCode: "EE",
    labLocation: "Room 102 - Electrical Workshop",
    category: "Heavy Machinery",
    totalQuantity: 10,
    availableQuantity: 8,
    damagedQuantity: 1,
    conditionStatus: "UNDER_MAINTENANCE",
    unitPrice: 45000,
    purchaseDate: "2024-11-20",
    supplier: "BTEB Project Supplier",
    notes: "সার্কিট কানেকশন প্র্যাক্টিসের জন্য মূল প্যানেল।",
    updatedAt: new Date().toISOString()
  },
  {
    id: "eq-4",
    itemCode: "LAB-EE-102",
    name: "Insulated Heavy Duty Plier & Screwdriver Set",
    nameBangla: "ইনসুলেটেড প্লায়ার্স ও স্ক্রু ড্রাইভার সেট",
    tradeCode: "EE",
    labLocation: "Room 102 - Electrical Workshop",
    category: "Hand Tools",
    totalQuantity: 30,
    availableQuantity: 28,
    damagedQuantity: 0,
    conditionStatus: "GOOD",
    unitPrice: 1200,
    purchaseDate: "2025-01-05",
    supplier: "Local Hardware",
    notes: "ವೈরিং কাজের অপরিহার্য হ্যান্ড টুলস।",
    updatedAt: new Date().toISOString()
  },
  {
    id: "eq-5",
    itemCode: "LAB-AMB-301",
    name: "Hydraulic Car Floor Jack 3 Ton",
    nameBangla: "হাইড্রোলিক কার ফ্লোর জ্যাক ৩ টন",
    tradeCode: "AMB",
    labLocation: "Room 105 - Automotive Lab",
    category: "Heavy Machinery",
    totalQuantity: 4,
    availableQuantity: 3,
    damagedQuantity: 0,
    conditionStatus: "GOOD",
    unitPrice: 12500,
    purchaseDate: "2024-08-12",
    supplier: "Auto Workshop Solutions",
    notes: "অটোমোটিভ ইঞ্জিনিয়ারিং প্র্যাকটিক্যাল ল্যাব।",
    updatedAt: new Date().toISOString()
  },
  {
    id: "eq-6",
    itemCode: "LAB-RAC-401",
    name: "Manifold Gauge Set with Vacuum Pump",
    nameBangla: "ম্যানিফোল্ড গেজ ও ভ্যাকুয়াম পাম্প সেট",
    tradeCode: "RAC",
    labLocation: "Room 108 - RAC Lab",
    category: "Heavy Machinery",
    totalQuantity: 8,
    availableQuantity: 6,
    damagedQuantity: 1,
    conditionStatus: "GOOD",
    unitPrice: 14000,
    purchaseDate: "2025-03-01",
    supplier: "Cooling Tech Ltd",
    notes: "এসি ও রেফ্রিজারেটর গ্যাস চার্জিংয়ের জন্য।",
    updatedAt: new Date().toISOString()
  }
];

export const PTSC_INITIAL_ISSUE_RECORDS: LabIssueRecord[] = [
  {
    id: "iss-1",
    equipmentId: "eq-1",
    itemCode: "LAB-IT-001",
    itemName: "Arduino Uno R3 Development Board",
    borrowerName: "রিপন ইসলাম",
    borrowerRole: "student",
    rollOrId: "১০৪",
    tradeCode: "IT",
    quantityIssued: 2,
    issuedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    expectedReturnDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: "ISSUED"
  },
  {
    id: "iss-2",
    equipmentId: "eq-2",
    itemCode: "LAB-IT-002",
    itemName: "Digital Multimeter (Fluke 101)",
    borrowerName: "মো: আব্দুল কুদ্দুস",
    borrowerRole: "instructor",
    rollOrId: "INST-202",
    tradeCode: "IT",
    quantityIssued: 1,
    issuedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    expectedReturnDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    status: "ISSUED"
  }
];

export class LabInventoryManager {
  private static equipmentList: LabEquipment[] = [...PTSC_INITIAL_LAB_EQUIPMENT];
  private static issueRecords: LabIssueRecord[] = [...PTSC_INITIAL_ISSUE_RECORDS];

  public static getEquipment(): LabEquipment[] {
    return this.equipmentList;
  }

  public static getIssueRecords(): LabIssueRecord[] {
    return this.issueRecords;
  }

  public static addEquipment(item: Omit<LabEquipment, "id" | "updatedAt">): LabEquipment {
    const newItem: LabEquipment = {
      ...item,
      id: `eq-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    this.equipmentList.unshift(newItem);
    return newItem;
  }

  public static updateEquipment(id: string, partial: Partial<LabEquipment>): LabEquipment | null {
    const idx = this.equipmentList.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.equipmentList[idx] = {
      ...this.equipmentList[idx],
      ...partial,
      updatedAt: new Date().toISOString()
    };
    return this.equipmentList[idx];
  }

  public static issueItem(record: Omit<LabIssueRecord, "id" | "issuedAt" | "status">): LabIssueRecord {
    const eq = this.equipmentList.find(e => e.id === record.equipmentId);
    if (eq && eq.availableQuantity >= record.quantityIssued) {
      eq.availableQuantity -= record.quantityIssued;
      eq.updatedAt = new Date().toISOString();
    }

    const newIssue: LabIssueRecord = {
      ...record,
      id: `iss-${Date.now()}`,
      issuedAt: new Date().toISOString(),
      status: "ISSUED"
    };
    this.issueRecords.unshift(newIssue);
    return newIssue;
  }

  public static returnItem(issueId: string): boolean {
    const iss = this.issueRecords.find(i => i.id === issueId);
    if (!iss || iss.status === "RETURNED") return false;

    iss.status = "RETURNED";
    iss.returnedAt = new Date().toISOString();

    const eq = this.equipmentList.find(e => e.id === iss.equipmentId);
    if (eq) {
      eq.availableQuantity = Math.min(eq.totalQuantity, eq.availableQuantity + iss.quantityIssued);
      eq.updatedAt = new Date().toISOString();
    }
    return true;
  }
}
