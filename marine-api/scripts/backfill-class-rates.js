// One-off: set per-user A/B rates for any User still on the schema zero-default.
// Mirrors the previous hardcoded rates so quotes created by existing users keep
// working after the move to per-user rates.
//
// Usage:  node scripts/backfill-class-rates.js

import { disconnectPrisma, getPrismaClient } from "../src/config/db.js";

const DEFAULT_CLASS_A_RATE = 0.1;
const DEFAULT_CLASS_B_RATE = 0.007;

async function main() {
  const prisma = getPrismaClient();
  const result = await prisma.user.updateMany({
    where: { classARate: 0, classBRate: 0 },
    data: { classARate: DEFAULT_CLASS_A_RATE, classBRate: DEFAULT_CLASS_B_RATE },
  });
  console.log(
    `Backfilled ${result.count} user(s) with A=${DEFAULT_CLASS_A_RATE}, B=${DEFAULT_CLASS_B_RATE}.`,
  );
}

main()
  .catch((err) => {
    console.error("backfill-class-rates failed:", err);
    process.exitCode = 1;
  })
  .finally(disconnectPrisma);
