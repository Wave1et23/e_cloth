import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { generateToken } from "@/lib/token";

const MAX_LABELS = 24;

function baseUrl(request: Request): string {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return new URL(request.url).origin;
}

async function ensureToken(garmentId: string, existing: string | null) {
  if (existing) return existing;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const label = await prisma.label.create({
        data: { garmentId, token: generateToken() },
        select: { token: true },
      });
      return label.token;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const found = await prisma.label.findUnique({
          where: { garmentId },
          select: { token: true },
        });
        if (found) return found.token;
        continue;
      }
      throw error;
    }
  }
  throw new Error("could not allocate label token");
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const rawIds = new URL(request.url).searchParams.get("ids");
  const ids = (rawIds ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (ids.length > MAX_LABELS) {
    return jsonError("VALIDATION", "一页最多 24 张，先取消几件", 400);
  }

  const garments = await prisma.garment.findMany({
    where: {
      userId: user.id,
      ...(ids.length > 0 ? { id: { in: ids } } : { status: "IN_CLOSET" }),
    },
    orderBy: { seq: "asc" },
    take: MAX_LABELS,
    select: {
      id: true,
      seq: true,
      name: true,
      label: { select: { token: true } },
    },
  });

  const byId = new Map(garments.map((garment) => [garment.id, garment]));
  const ordered =
    ids.length > 0
      ? ids.map((id) => byId.get(id)).filter((value) => value !== undefined)
      : garments;

  const items = [];
  for (const garment of ordered) {
    const token = await ensureToken(garment.id, garment.label?.token ?? null);
    items.push({
      id: garment.id,
      name: garment.name,
      code: `G${String(garment.seq).padStart(3, "0")}`,
      token,
    });
  }

  return jsonOk({ baseUrl: baseUrl(request), items });
}
