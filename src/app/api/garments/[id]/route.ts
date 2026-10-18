import { getCurrentUser } from "@/lib/auth/user";
import { computeCpw } from "@/lib/cost";
import { prisma } from "@/lib/db";
import { parseGarmentInput } from "@/lib/garments";
import { jsonError, jsonOk, readJsonObject } from "@/lib/http";
import { deleteGarmentPhoto } from "@/lib/images";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const garment = await prisma.garment.findFirst({
    where: { id, userId: user.id },
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 100 },
      label: { select: { token: true } },
    },
  });
  if (!garment) return jsonError("NOT_FOUND", "这件衣服不在了", 404);

  const wornCount = garment.events.filter((event) => event.type === "WORN").length;
  const { userId: _userId, photoPath: _photoPath, ...safe } = garment;
  return jsonOk({
    ...safe,
    code: `G${String(garment.seq).padStart(3, "0")}`,
    wornCount,
    cpw: computeCpw(garment.priceCents, wornCount),
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const body = await readJsonObject(request);
  if (!body) return jsonError("VALIDATION", "请求格式不对", 400);

  const existing = await prisma.garment.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "这件衣服不在了", 404);

  const parsed = parseGarmentInput(body);
  if (!parsed.ok) return jsonError("VALIDATION", parsed.msg, 400);
  if (Object.keys(parsed.data).length === 0) {
    return jsonError("VALIDATION", "没有要修改的内容", 400);
  }

  const updated = await prisma.garment.update({
    where: { id: existing.id },
    data: parsed.data,
    select: { id: true, seq: true },
  });

  return jsonOk({
    id: updated.id,
    code: `G${String(updated.seq).padStart(3, "0")}`,
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const existing = await prisma.garment.findFirst({
    where: { id, userId: user.id },
    select: { id: true, photoPath: true },
  });
  if (!existing) return jsonError("NOT_FOUND", "这件衣服不在了", 404);

  await prisma.garment.delete({ where: { id: existing.id } });
  await deleteGarmentPhoto(existing.photoPath);
  return jsonOk({ deleted: true });
}
