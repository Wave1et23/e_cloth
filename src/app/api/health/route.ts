import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, data: { db: "up" } });
  } catch {
    return Response.json(
      { ok: false, code: "INTERNAL", msg: "数据库不可用" },
      { status: 503 },
    );
  }
}
