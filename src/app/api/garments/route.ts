import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/user";
import { computeCpw } from "@/lib/cost";
import { prisma } from "@/lib/db";
import { parseGarmentInput } from "@/lib/garments";
import { jsonError, jsonOk, readJsonObject } from "@/lib/http";
import { deleteGarmentPhoto, moveTempToGarment } from "@/lib/images";
import { generateToken } from "@/lib/token";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const garments = await prisma.garment.findMany({
    where: { userId: user.id },
    orderBy: { seq: "desc" },
    take: 200,
    select: {
      id: true,
      seq: true,
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
      code: `G${String(garment.seq).padStart(3, "0")}`,
      wornCount: events.length,
      cpw: computeCpw(garment.priceCents, events.length),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const body = await readJsonObject(request);
  if (!body) return jsonError("VALIDATION", "请求格式不对", 400);

  const parsed = parseGarmentInput(body);
  if (!parsed.ok) return jsonError("VALIDATION", parsed.msg, 400);
  const { name, category } = parsed.data;
  if (!name || !category) {
    return jsonError("VALIDATION", "名称和类别必须填", 400);
  }

  const imageToken =
    typeof body.imageToken === "string" ? body.imageToken : null;
  if (!imageToken) {
    return jsonError("VALIDATION", "照片没上传成功，重新选一张", 400);
  }

  let photoPath: string;
  try {
    photoPath = await moveTempToGarment(user.id, imageToken);
  } catch {
    return jsonError("VALIDATION", "照片过期了，请重新上传", 400);
  }

  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const last = await prisma.garment.findFirst({
        where: { userId: user.id },
        orderBy: { seq: "desc" },
        select: { seq: true },
      });
      const seq = (last?.seq ?? 0) + 1;
      const token = generateToken();

      try {
        const garment = await prisma.$transaction(async (tx) => {
          const created = await tx.garment.create({
            data: {
              userId: user.id,
              seq,
              name,
              category,
              primaryColor: parsed.data.primaryColor ?? null,
              pattern: parsed.data.pattern ?? null,
              fit: parsed.data.fit ?? null,
              season: parsed.data.season ?? null,
              style: parsed.data.style ?? null,
              material: parsed.data.material ?? null,
              brand: "uncertain",
              priceCents: parsed.data.priceCents ?? null,
              purchaseDate: parsed.data.purchaseDate ?? null,
              notes: parsed.data.notes ?? null,
              photoPath,
              status: "IN_CLOSET",
            },
          });
          await tx.label.create({
            data: { garmentId: created.id, token },
          });
          return created;
        });

        return jsonOk(
          {
            id: garment.id,
            seq: garment.seq,
            code: `G${String(garment.seq).padStart(3, "0")}`,
          },
          201,
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }
        throw error;
      }
    }
    throw new Error("could not allocate sequence/token");
  } catch (error) {
    console.error("[garments] create failed", error);
    await deleteGarmentPhoto(photoPath);
    return jsonError("INTERNAL", "没保存成功，再试一次", 500);
  }
}
