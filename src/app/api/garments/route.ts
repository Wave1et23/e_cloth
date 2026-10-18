import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/user";
import { computeCpw } from "@/lib/cost";
import { jsonError, jsonOk } from "@/lib/http";

/** 列表：只查自己的衣物；每件带 WORN 次数算 CPW。 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const garments = await prisma.garment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      category: true,
      status: true,
      priceCents: true,
      createdAt: true,
      events: {
        where: { type: "WORN" },
        select: { id: true },
      },
    },
  });

  return jsonOk({
    garments: garments.map(({ events, ...garment }) => ({
      ...garment,
      wornCount: events.length,
      cpw: computeCpw(garment.priceCents, events.length),
    })),
  });
}
