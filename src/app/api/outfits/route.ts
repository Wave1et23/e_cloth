import { getCurrentUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonObject } from "@/lib/http";
import { isSameOrigin } from "@/lib/http";
import {
  validateOutfitItems,
  validateOutfitName,
  validateOutfitNotes,
} from "@/lib/outfits";
import { OUTFIT_SELECT, toOutfitPayload } from "@/lib/outfits-db";

async function ownsAllGarments(userId: string, ids: string[]): Promise<boolean> {
  const owned = await prisma.garment.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  return owned.length === ids.length;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const outfits = await prisma.outfit.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: OUTFIT_SELECT,
  });

  return jsonOk({ outfits: outfits.map(toOutfitPayload) });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN", "请求来源不对", 403);
  }
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const body = await readJsonObject(request);
  if (!body) return jsonError("VALIDATION", "请求格式不对", 400);

  const name = validateOutfitName(body.name);
  if (!name.ok) return jsonError("VALIDATION", name.msg, 400);
  const notes = validateOutfitNotes(body.notes);
  if (!notes.ok) return jsonError("VALIDATION", notes.msg, 400);
  const items = validateOutfitItems(body.items);
  if (!items.ok) return jsonError("VALIDATION", items.msg, 400);
  if (!(await ownsAllGarments(user.id, items.value))) {
    return jsonError("VALIDATION", "有衣物不存在或不属于当前账号", 400);
  }

  const outfit = await prisma.outfit.create({
    data: {
      userId: user.id,
      name: name.value,
      notes: notes.value,
      items: {
        create: items.value.map((garmentId, position) => ({
          garmentId,
          position,
        })),
      },
    },
    select: OUTFIT_SELECT,
  });

  return jsonOk(toOutfitPayload(outfit), 201);
}
