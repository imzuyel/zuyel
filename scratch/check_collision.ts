import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const dataDir = "d:/zuyel/prisma/data";

function checkAllFiles() {
  const rollsByClass: Record<number, Map<string, any>> = {};

  function addRecord(classNum: number, section: string, roll: number, info: any) {
    if (!rollsByClass[classNum]) rollsByClass[classNum] = new Map();
    const key = `${section}-${roll}`;
    if (rollsByClass[classNum].has(key)) {
      console.log(`❌ COLLISION in Class ${classNum}: key "${key}"`);
      console.log("   Existing:", rollsByClass[classNum].get(key));
      console.log("   New:     ", info);
    } else {
      rollsByClass[classNum].set(key, info);
    }
  }

  // 1. CLASS-6-A.xlsx
  const file6A = path.join(dataDir, "CLASS-6-A.xlsx");
  if (fs.existsSync(file6A)) {
    const wb = XLSX.readFile(file6A);
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;
      addRecord(6, "A", parseInt(String(r[0]), 10), { file: "6A", row: i, name: r[1], roll: r[0] });
    }
  }

  // 2. CLASS-6-B.xlsx
  const file6B = path.join(dataDir, "CLASS-6-B.xlsx");
  if (fs.existsSync(file6B)) {
    const wb = XLSX.readFile(file6B);
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;
      addRecord(6, "B", parseInt(String(r[0]), 10), { file: "6B", row: i, name: r[1], roll: r[0] });
    }
  }

  // 3. CLASS-7-A.xlsx
  const file7A = path.join(dataDir, "CLASS-7-A.xlsx");
  if (fs.existsSync(file7A)) {
    const wb = XLSX.readFile(file7A);
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[3]) continue;
      addRecord(7, "A", parseInt(String(r[3]), 10), { file: "7A", row: i, name: r[4], roll: r[3] });
    }
  }

  // 4. CLASS-7-B.xlsx
  const file7B = path.join(dataDir, "CLASS-7-B.xlsx");
  if (fs.existsSync(file7B)) {
    const wb = XLSX.readFile(file7B);
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[3]) continue;
      addRecord(7, "B", parseInt(String(r[3]), 10), { file: "7B", row: i, name: r[4], roll: r[3] });
    }
  }

  // 5. CLASS-8-A.xlsx
  const file8A = path.join(dataDir, "CLASS-8-A.xlsx");
  if (fs.existsSync(file8A)) {
    const wb = XLSX.readFile(file8A);
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[3]) continue;
      addRecord(8, "A", parseInt(String(r[3]), 10), { file: "8A", row: i, name: r[5], roll: r[3] });
    }
  }

  // 6. CLASS-8-B.xlsx
  const file8B = path.join(dataDir, "CLASS-8-B.xlsx");
  if (fs.existsSync(file8B)) {
    const wb = XLSX.readFile(file8B);
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[3]) continue;
      addRecord(8, "B", parseInt(String(r[3]), 10), { file: "8B", row: i, name: r[5], roll: r[3] });
    }
  }

  // 7. CLASS NINE.xlsx
  const file9 = path.join(dataDir, "CLASS NINE.xlsx");
  if (fs.existsSync(file9)) {
    const wb = XLSX.readFile(file9);
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || (!r[0] && !r[3])) continue;
      const roll = parseInt(String(r[3] || r[0]).replace(/\D/g, ""), 10);
      addRecord(9, "A", roll, { file: "9", row: i, name: r[4], roll: r[3] || r[0] });
    }
  }

  // 8. CLASS TEN.xlsx
  const file10 = path.join(dataDir, "CLASS TEN.xlsx");
  if (fs.existsSync(file10)) {
    const wb = XLSX.readFile(file10);
    const sheetName = wb.SheetNames.includes("ten-2026") ? "ten-2026" : wb.SheetNames[0];
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[1]) continue;
      const roll = parseInt(String(r[1]).replace(/\D/g, ""), 10);
      addRecord(10, "A", roll, { file: "10", row: i, name: r[2], roll: r[1] });
    }
  }

  // 9. CLASS ELEVEN.xlsx
  const file11 = path.join(dataDir, "CLASS ELEVEN.xlsx");
  if (fs.existsSync(file11)) {
    const wb = XLSX.readFile(file11);
    if (wb.Sheets["Sheet1"]) {
      const rows1: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Sheet1"], { header: 1 });
      for (let i = 1; i < rows1.length; i++) {
        const r = rows1[i];
        if (!r || (!r[0] && !r[2])) continue;
        const key = String(r[2] || r[0]).trim();
        const roll = parseInt(key.replace(/\D/g, ""), 10);
        addRecord(11, "A", roll, { file: "11_Sheet1", row: i, name: r[3], roll: key });
      }
    }
    if (wb.Sheets["Sheet2"]) {
      const rows2: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Sheet2"], { header: 1 });
      for (let i = 1; i < rows2.length; i++) {
        const r = rows2[i];
        if (!r || !r[0]) continue;
        const roll = parseInt(String(r[0]).replace(/\D/g, ""), 10);
        addRecord(11, "A", roll, { file: "11_Sheet2", row: i, name: r[2], roll: r[0] });
      }
    }
  }

  for (const c of Object.keys(rollsByClass)) {
    console.log(`Class ${c}: Total records = ${rollsByClass[Number(c)].size}`);
  }
}

checkAllFiles();
