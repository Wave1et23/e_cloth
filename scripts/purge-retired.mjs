import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const RETIRED_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
const dryRun = process.argv.includes("--dry-run");
const cutoff = new Date(Date.now() - RETIRED_RETENTION_MS);
const uploadsRoot = path.resolve(process.cwd(), "uploads");
const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.garment.findMany({
    where: {
      status: "RETIRED",
      retiredAt: { not: null, lte: cutoff },
    },
    select: { id: true, name: true, photoPath: true },
  });

  console.log(
    JSON.stringify({
      cutoff: cutoff.toISOString(),
      dryRun,
      candidates: candidates.length,
      items: candidates.map((item) => ({ id: item.id, name: item.name })),
    }),
  );
  if (dryRun || candidates.length === 0) return;

  const deleted = await prisma.garment.deleteMany({
    where: {
      id: { in: candidates.map((item) => item.id) },
      status: "RETIRED",
      retiredAt: { not: null, lte: cutoff },
    },
  });

  let photoFailures = 0;
  for (const item of candidates) {
    const target = path.resolve(uploadsRoot, item.photoPath);
    if (!target.startsWith(uploadsRoot + path.sep)) {
      photoFailures += 1;
      console.error(`[purge-retired] unsafe photo path: ${item.id}`);
      continue;
    }
    try {
      fs.rmSync(target, { force: true });
    } catch (error) {
      photoFailures += 1;
      console.error(
        `[purge-retired] photo delete failed ${item.id}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  console.log(
    JSON.stringify({
      deleted: deleted.count,
      photoFailures,
      cutoff: cutoff.toISOString(),
    }),
  );
}

main()
  .catch((error) => {
    console.error("[purge-retired] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
