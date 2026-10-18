import { getCurrentUser } from "@/lib/auth/user";
import { computeCpw } from "@/lib/cost";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  const [monthWears, inCloset, garments] = await Promise.all([
    prisma.garmentEvent.count({
      where: {
        type: "WORN",
        createdAt: { gte: monthStart },
        garment: { userId: user.id },
      },
    }),
    prisma.garment.count({
      where: { userId: user.id, status: "IN_CLOSET" },
    }),
    prisma.garment.findMany({
      where: { userId: user.id },
      orderBy: { seq: "desc" },
      take: 4,
      select: {
        id: true,
        seq: true,
        name: true,
        status: true,
        priceCents: true,
        events: {
          where: { type: "WORN" },
          select: { id: true },
        },
      },
    }),
  ]);

  const all = await prisma.garment.findMany({
    where: { userId: user.id, priceCents: { not: null } },
    select: {
      priceCents: true,
      events: {
        where: { type: "WORN" },
        select: { id: true },
      },
    },
  });

  const cpws = all
    .map((garment) => computeCpw(garment.priceCents, garment.events.length))
    .filter((value): value is number => value !== null);
  const avgCpw =
    cpws.length === 0
      ? null
      : Math.round((cpws.reduce((sum, value) => sum + value, 0) / cpws.length) * 100) /
        100;

  return jsonOk({
    monthWears,
    inCloset,
    avgCpw,
    recent: garments.map((garment) => ({
      id: garment.id,
      code: `G${String(garment.seq).padStart(3, "0")}`,
      name: garment.name,
      status: garment.status,
      cpw: computeCpw(garment.priceCents, garment.events.length),
    })),
  });
}
