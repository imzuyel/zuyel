# 🎓 PTSC ERP — Database Seeding & Bulk Student Import Guide

Comprehensive guide for executing the master institutional database seed on **Panchagarh Govt. Technical School and College (PTSC) ERP** using **Next.js**, **Prisma ORM**, and **TypeScript**.

---

## 📌 Executive Summary

The database seeder ([prisma/seed.ts](file:///d:/zuyel/prisma/seed.ts)) is engineered with a **dual-source, idempotent ingestion pipeline**:
1. **Primary Ingestion:** Direct multi-workbook parsing of institutional Excel spreadsheets located in `prisma/data/`.
2. **Fallback Ingestion:** Automatic fallback to `prisma/students-staging.json` (or root `students-staging.json`) if Excel files are unavailable.
3. **Academic Master Seeding:** Pre-populates Academic Year (`2026`), Classes (`6, 7, 8, 9, 10, 11`), Sections/Groups (`A, B`), the 4 Official Vocational Trades, and core RBAC roles & test accounts.
4. **Zero-Trust Safety & Idempotency:** Implements deterministic unique keys (`studentId`, `admissionNo`) and isolated transactional chunking (`prisma.$transaction`) with automatic rollback on error.

---

## 🏛️ Academic Rules & Mapping Chain

```mermaid
graph TD
    AY["Academic Year (2026)"] --> Class["Classes (6, 7, 8, 9, 10, 11)"]
    Class --> Sec["Sections / Groups (A, B)"]
    Class --> TradeRules{"Class Level"}
    TradeRules -- "Classes 6, 7, 8" --> NoTrade["No Trade (tradeId = null)"]
    TradeRules -- "Classes 9, 10, 11" --> Trades["Official 4 Technical Trades"]
    Trades --> GE["[GE] General Electronics"]
    Trades --> IT["[IT-IoT] IT Support and IoT Basics"]
    Trades --> EE["[EE] General Electrical Workshop"]
    Trades --> AMB["[AMB] Apparel Manufacturing Basics"]
    NoTrade --> Student["Student Enrollment Record"]
    GE --> Student
    IT --> Student
    EE --> Student
    AMB --> Student
```

### 1. The 4 Official Technical Trades
| Code | Official Trade Name | Bengali Name | Trade Variants Handled |
| :--- | :--- | :--- | :--- |
| `GE` | **General Electronics** | জেনারেল ইলেকট্রনিক্স | `(62) General Electronics`, `Electronic Control and Communication`, `Electronics` |
| `IT-IoT` | **IT Support and IoT Basics** | আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস | `(88) IT Support and IoT Basics`, `Computer and IoT Systems`, `IT Support` |
| `EE` | **General Electrical Workshop** | জেনারেল ইলেকট্রিক্যাল ওয়ার্কশপ | `(90) General Electrical Works`, `Electrical Works and Maintenance`, `Electrical` |
| `AMB` | **Apparel Manufacturing Basics** | অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস | `(81) Apparel Manufacturing Basics`, `Clothing and Garments Finishing`, `Apparel` |

### 2. General Section Rule (Classes 6, 7, and 8)
- Students in Classes 6, 7, and 8 strictly have **NO TRADE** (`tradeId: null`).

---

## 📂 Source Data Files Supported

The seeder automatically detects and parses the following uploaded Excel files in [prisma/data/](file:///d:/zuyel/prisma/data):

| Filename | Class | Cohort / Section | Total Students |
| :--- | :---: | :--- | :---: |
| `CLASS-6-A.xlsx` | 6 | Section A | 55 |
| `CLASS-6-B.xlsx` | 6 | Section B | 52 |
| `CLASS-7-A.xlsx` | 7 | Section A | 40 |
| `CLASS-7-B.xlsx` | 7 | Section B (Synchronized) | 40 |
| `CLASS-8-A.xlsx` | 8 | Section A | 55 |
| `CLASS-8-B.xlsx` | 8 | Section B | 49 |
| `CLASS NINE.xlsx` | 9 | SSC Vocational (4 Trades) | 224 |
| `CLASS TEN.xlsx` | 10 | SSC Vocational (4 Trades) | 161 |
| `CLASS ELEVEN.xlsx` | 11 | HSC Vocational (Sheet 1 & 2) | 425 |
| **Combined Total** | | | **1,061+ Students** |

---

## ⚙️ `package.json` Configuration Snippet

Ensure the following configuration exists under the root [package.json](file:///d:/zuyel/package.json):

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

---

## 🚀 Step-by-Step Execution Instructions

### Step 1: Install Dependencies
Verify that `xlsx` and `ts-node` are installed in your project:
```bash
npm install xlsx
npm install -D ts-node @types/node typescript
```

### Step 2: Configure Environment Variables
Verify your `.env` database connection string:
```env
# PostgreSQL Example:
DATABASE_URL="postgresql://postgres:password@localhost:5432/pgtsc_erp_db?schema=public"

# MySQL Example (Default local PTSC configuration):
DATABASE_URL="mysql://root:@127.0.0.1:3306/pgtsc_erp_db"
```

### Step 3: Synchronize Prisma Schema
Generate the latest Prisma client and push any pending schema changes:
```bash
npx prisma generate
npx prisma db push
```

### Step 4: Run the Master Seeder
Execute the database seeding script:
```bash
npx prisma db seed
# Or alternatively:
npm run db:seed
```

---

## 🔍 Database Verification

### 1. View Data in Prisma Studio
Launch Prisma's visual database explorer:
```bash
npx prisma studio
```
Navigate to `http://localhost:5555` to inspect the `Student`, `AcademicClass`, and `Trade` tables.

### 2. Verify via CLI / Node Script
Run a quick terminal query to check student count and class distribution:
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function verify() {
  const total = await prisma.student.count();
  console.log('Total Students in DB:', total);
  const classes = await prisma.academicClass.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { numericValue: 'asc' }
  });
  classes.forEach(c => console.log('Class ' + c.numericValue + ': ' + c._count.students + ' students'));
}
verify().finally(() => prisma.\$disconnect());
"
```

### 3. Verify via Raw SQL Query
Run in `psql` or MySQL workbench:
```sql
-- Total Students
SELECT COUNT(*) AS total_students FROM students;

-- Distribution by Class
SELECT c.numericValue AS class, c.name, COUNT(s.id) AS total_students
FROM academic_classes c
LEFT JOIN students s ON s.classId = c.id
GROUP BY c.id, c.numericValue, c.name
ORDER BY c.numericValue ASC;

-- Distribution by Technical Trade (Classes 9, 10, 11)
SELECT t.code, t.name, COUNT(s.id) AS enrolled_students
FROM trades t
LEFT JOIN students s ON s.tradeId = t.id
GROUP BY t.id, t.code, t.name
ORDER BY t.code ASC;
```

---

## 🔐 Default Institutional System Credentials

The seeder pre-configures default test credentials for the login portal:

| Portal Role | Username / Identifier | Password | Associated Account |
| :--- | :--- | :--- | :--- |
| **Admin / Root** | `admin` or `admin@pgtsc.gov.bd` | `password` | Kazi Nurul Huda (System Admin) |
| **Teacher / Faculty** | `teacher` or `teacher@pgtsc.gov.bd` | `password` | Engr. Mahmudul Hasan (Chief Instructor) |
| **Student** | `101` or `PTSC-2026-9-101` | `password` | Tanvir Ahmed (Class 9, Roll 101) |

---

## 🛡️ Idempotency & Safety Guarantees

- **Deterministic Identifiers:** Every student is assigned a globally deterministic unique `studentId` (`PTSC-2026-${classNumeric}-${rawKey}`) and `admissionNo` (`ADM-2026-${classNumeric}-${rawKey}`).
- **32-Bit Integer Safety:** 10-digit board registration numbers are stored in `birthRegNo` and `studentId` as strings, while their integer rolls are safely constrained to fit within 32-bit signed integers (`Int` $\le 2,147,483,647$).
- **Transactional Atomicity:** Bulk records are processed in isolated transactional chunks of 100 (`prisma.$transaction`). If any network or database error occurs, the batch is automatically rolled back with zero data corruption.
