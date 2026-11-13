import { getCurrentUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonObject } from "@/lib/http";
import {
  isOutfitOwner,
  validateOutfitItems,
  validateOutfitName,
  validateOutfitNotes,
} from "@/lib/outfits";
import { OUTFIT_SELECT, toOutfitPayload } from "@/lib/outfits-db";

type Params = { params: Promise<{ id: string }> };

async function ownedOutfit(id: string, userId: string) {
  const outfit = await prisma.outfit.findUnique({
    where: { id },
    select: OUTFIT_SELECT,
  });
  return isOutfitOwner(outfit, userId) ? outfit : null;
}

async function ownsAllGarments(userId: string, ids: string[]): Promise<boolean> {
  const owned = await prisma.garment.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  return owned.length === ids.length;
}

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const outfit = await ownedOutfit(id, user.id);
  if (!outfit) return jsonError("NOT_FOUND", "这套搭配不在了", 404);

  return jsonOk(toOutfitPayload(outfit));
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const existing = await ownedOutfit(id, user.id);
  if (!existing) return jsonError("NOT_FOUND", "这套搭配不在了", 404);

  const body = await readJsonObject(request);
  if (!body) return jsonError("VALIDATION", "请求格式不对", 400);

  const data: { name?: string; notes?: string | null } = {};
  if ("name" in body) {
    const name = validateOutfitName(body.name);
    if (!name.ok) return jsonError("VALIDATION", name.msg, 400);
    data.name = name.value;
  }
  if ("notes" in body) {
    const notes = validateOutfitNotes(body.notes);
    if (!notes.ok) return jsonError("VALIDATION", notes.msg, 400);
    data.notes = notes.value;
  }

  let itemIds: string[] | null = null;
  if ("items" in body) {
    const items = validateOutfitItems(body.items);
    if (!items.ok) return jsonError("VALIDATION", items.msg, 400);
    itemIds = items.value;
    if (!(await ownsAllGarments(user.id, itemIds))) {
      return jsonError("VALIDATION", "有衣物不存在或不属于当前账号", 400);
    }
  }

  if (Object.keys(data).length === 0 && itemIds === null) {
    return jsonError("VALIDATION", "没有要修改的内容", 400);
  }

  await prisma.$transaction(async (tx) => {
    if (itemIds) {
      await tx.outfitItem.deleteMany({ where: { outfitId: id } });
      await tx.outfitItem.createMany({
        data: itemIds.map((garmentId, position) => ({
          outfitId: id,
          garmentId,
          position,
        })),
      });
    }
    await tx.outfit.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  });

  const updated = await prisma.outfit.findUniqueOrThrow({
    where: { id },
    select: OUTFIT_SELECT,
  });
  return jsonOk(toOutfitPayload(updated));
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const existing = await ownedOutfit(id, user.id);
  if (!existing) return jsonError("NOT_FOUND", "这套搭配不在了", 404);

  await prisma.outfit.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
