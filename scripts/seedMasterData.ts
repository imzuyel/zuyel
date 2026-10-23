/**
 * ERP Global Master Data & Academic Mapping Idempotent Seeder
 * PTSC (Panchagarh Government Technical School & College)
 * Run via: npx tsx scripts/seedMasterData.ts
 */

import { seedDefaultMasterData, getMasterDataSnapshot } from "../lib/masterDataEngine";

async function runSeed() {
  console.log("================================================================================");
  console.log("🌱 PTSC ERP: SEEDING GLOBAL MASTER DATA & ACADEMIC MAPPINGS");
  console.log("================================================================================");

  try {
    const result = await seedDefaultMasterData({ forceReset: false });
    console.log(`✅ ${result.message}`);
    console.log("📊 Master Data Summary:");
    console.log(`   - Academic Years:  ${result.summary.yearsCount}`);
    console.log(`   - Academic Programs: ${result.summary.programsCount}`);
    console.log(`   - Classes:          ${result.summary.classesCount}`);
    console.log(`   - Trades (BTEB):    ${result.summary.tradesCount}`);
    console.log(`   - Academic Mappings: ${result.summary.mappingsCount}`);

    const snapshot = await getMasterDataSnapshot("2026");
    console.log("\n🏫 Institution Profile:");
    console.log(`   Name: ${snapshot.institution.nameBangla} (${snapshot.institution.name})`);
    console.log(`   EIIN: ${snapshot.institution.eiin} | Code: ${snapshot.institution.code}`);
    console.log(`   Active Year: ${snapshot.activeYear.name} (${snapshot.activeYear.code})`);
    console.log("\n🎉 Seeding completed successfully. All data is ready for entire ERP consumption!");
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

runSeed();
