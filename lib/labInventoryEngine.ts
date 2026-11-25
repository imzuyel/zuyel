import { getHybridInventory, upsertHybridEquipment } from "@/lib/hybridStorageEngine";

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
    id: "eq-pc-1",
    itemCode: "LAB-IT-PC01",
    name: "Dell OptiPlex Core i5 Desktop Computer Workstation",
    nameBangla: "ডেল অপটিপ্লেক্স কোর আই৫ ডেস্কটপ ওয়ার্কস্টেশন",
    tradeCode: "IT",
    labLocation: "Room 203 - Computer & Programming Lab",
    category: "Heavy Machinery",
    totalQuantity: 40,
    availableQuantity: 38,
    damagedQuantity: 2,
    conditionStatus: "GOOD",
    unitPrice: 58000,
    purchaseDate: "2024-09-10",
    supplier: "Global Brand Pvt Ltd",
    notes: "সফটওয়্যার ডেভেলপমেন্ট ও অফিস অ্যাপ্লিকেশনের প্রধান কম্পিউটার ল্যাব।",
    updatedAt: new Date().toISOString()
  },
  {
    id: "eq-1",
    itemCode: "LAB-IT-001",
    name: "Arduino Uno R3 Development Board Starter Kit",
    nameBangla: "আর্ডুইনো উনো আর৩ মাইক্রোকন্ট্রোলার স্টার্টার কিট",
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
    id: "eq-esp-1",
    itemCode: "LAB-IT-003",
    name: "ESP32 NodeMCU WiFi & Bluetooth IoT Dev Board",
    nameBangla: "ইএসপি৩২ নোডএমসিইউ ওয়াইফাই ও ব্লুটুথ আইওটি মডিউল",
    tradeCode: "IT",
    labLocation: "Room 204 - IoT Lab",
    category: "Electronic Components",
    totalQuantity: 45,
    availableQuantity: 40,
    damagedQuantity: 1,
    conditionStatus: "GOOD",
    unitPrice: 950,
    purchaseDate: "2025-02-01",
    supplier: "TechBD Electronics",
    notes: "স্মার্ট হোম ও ক্লাউড আইওটি প্রজেক্ট বাস্তবায়নের জন্য।",
    updatedAt: new Date().toISOString()
  },
  {
    id: "eq-sensor-1",
    itemCode: "LAB-IT-004",
    name: "IoT Sensor Kit (DHT22 Temp, HC-SR04 Ultrasonic & PIR Motion)",
    nameBangla: "আইওটি মাল্টি-সেন্সর কিট (তাপমাত্রা, আল্ট্রাসনিক ও পিআইআর মোশন)",
    tradeCode: "IT",
    labLocation: "Room 204 - IoT Lab",
    category: "Electronic Components",
    totalQuantity: 60,
    availableQuantity: 55,
    damagedQuantity: 3,
    conditionStatus: "GOOD",
    unitPrice: 420,
    purchaseDate: "2025-02-15",
    supplier: "Robotics Bangladesh",
    notes: "এনভায়রনমেন্ট সেন্সিং ও অটোমেশন ল্যাব টেস্ট।",
    updatedAt: new Date().toISOString()
  },
  {
    id: "eq-router-1",
    itemCode: "LAB-IT-005",
    name: "TP-Link Archer Gigabit Wireless Lab Router AX55 WiFi 6",
    nameBangla: "টিপি-লিংক গিগাবিট ওয়্যারলেস ল্যাব রাউটার (ওয়াইফাই ৬)",
    tradeCode: "IT",
    labLocation: "Room 204 - IoT Lab",
    category: "Heavy Machinery",
    totalQuantity: 6,
    availableQuantity: 5,
    damagedQuantity: 0,
    conditionStatus: "GOOD",
    unitPrice: 7200,
    purchaseDate: "2025-01-20",
    supplier: "Excel Technologies Ltd",
    notes: "আইওটি নেটওয়ার্কিং ও লোকাল সার্ভার টেস্টিং ব্যাকবোন।",
    updatedAt: new Date().toISOString()
  },
  {
    id: "eq-2",
    itemCode: "LAB-IT-002",
    name: "Digital Multimeter (Fluke 101 Pocket Standard)",
    nameBangla: "ডিজিটাল মাল্টিমিটার (ফ্লুক ১০১ স্ট্যান্ডার্ড)",
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
    notes: "ভোল্টেজ, কারেন্ট ও রেজিস্ট্যান্স পরিমাপের জন্য।",
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
    notes: "ওয়্যারিং কাজের অপরিহার্য হ্যান্ড টুলস।",
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
    try {
      const hybrid = getHybridInventory();
      if (hybrid && hybrid.length > 0) {
        return hybrid as LabEquipment[];
      }
    } catch {
      // Fallback
    }
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
    try {
      upsertHybridEquipment(newItem);
    } catch (err) {
      console.warn("[LabInventoryEngine] Failed to save equipment to hybrid engine:", err);
    }
    return newItem;
  }

  public static updateEquipment(id: string, partial: Partial<LabEquipment>): LabEquipment | null {
    const list = this.getEquipment();
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;
    const updated = {
      ...list[idx],
      ...partial,
      updatedAt: new Date().toISOString()
    };
    list[idx] = updated;
    this.equipmentList = list;
    try {
      upsertHybridEquipment(updated);
    } catch (err) {
      console.warn("[LabInventoryEngine] Failed to update equipment in hybrid engine:", err);
    }
    return updated;
  }

  public static issueItem(record: Omit<LabIssueRecord, "id" | "issuedAt" | "status">): LabIssueRecord {
    const list = this.getEquipment();
    const eq = list.find(e => e.id === record.equipmentId);
    if (eq && eq.availableQuantity >= record.quantityIssued) {
      eq.availableQuantity -= record.quantityIssued;
      eq.updatedAt = new Date().toISOString();
      try {
        upsertHybridEquipment(eq);
      } catch (err) {
        console.warn("[LabInventoryEngine] Failed to sync issued equipment:", err);
      }
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

    const list = this.getEquipment();
    const eq = list.find(e => e.id === iss.equipmentId);
    if (eq) {
      eq.availableQuantity = Math.min(eq.totalQuantity, eq.availableQuantity + iss.quantityIssued);
      eq.updatedAt = new Date().toISOString();
      try {
        upsertHybridEquipment(eq);
      } catch (err) {
        console.warn("[LabInventoryEngine] Failed to sync returned equipment:", err);
      }
    }
    return true;
  }
}
