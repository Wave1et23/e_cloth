import type { Prisma } from "@prisma/client";

/** API 统一返回的搭配形状：列表、详情、创建、更新共用。 */
export const OUTFIT_SELECT = {
  id: true,
  userId: true,
  name: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: { position: "asc" },
    select: {
      garmentId: true,
      position: true,
      garment: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.OutfitSelect;

type OutfitRow = Prisma.OutfitGetPayload<{ select: typeof OUTFIT_SELECT }>;

export function toOutfitPayload(outfit: OutfitRow) {
  return {
    id: outfit.id,
    name: outfit.name,
    notes: outfit.notes,
    items: outfit.items.map((item) => ({
      garmentId: item.garmentId,
      name: item.garment.name,
      position: item.position,
    })),
    itemCount: outfit.items.length,
    createdAt: outfit.createdAt,
    updatedAt: outfit.updatedAt,
  };
}
