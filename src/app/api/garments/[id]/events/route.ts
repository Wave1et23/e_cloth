import { getCurrentUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJsonObject } from "@/lib/http";
import { isSameOrigin } from "@/lib/http";
import { isRateLimited, recordFailure } from "@/lib/rate-limit";
import { isDuplicateScan } from "@/lib/scan";
import { isGarmentEventType, nextStatus } from "@/lib/status";

type Params = { params: Promise<{ id: string }> };

/**
 * 登录态补记状态。能力与 /api/g/[token]/action 等价：
 * 同样的 6 个事件、同样的状态映射、30 秒内同事件幂等。
 * 不修改扫码接口本身。
 */
export async function POST(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN", "请求来源不对", 403);
  }
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const body = await readJsonObject(request);
  const type = body?.type;
  if (!isGarmentEventType(type)) {
    return jsonError("VALIDATION", "这个动作不认识，请重试", 400);
  }

  const garment = await prisma.garment.findFirst({
    where: { id, userId: user.id },
    select: { id: true, status: true },
  });
  if (!garment) return jsonError("NOT_FOUND", "这件衣服不在了", 404);

  const key = `garment-event:${user.id}:${garment.id}`;
  if (isRateLimited(key, 20, 60_000)) {
    return jsonError("RATE_LIMITED", "点得有点快，等一分钟再试", 429);
  }
  recordFailure(key, 60_000);

  const last = await prisma.garmentEvent.findFirst({
    where: { garmentId: garment.id },
    orderBy: { createdAt: "desc" },
    select: { type: true, createdAt: true },
  });

  if (isDuplicateScan(last, type)) {
    return jsonOk({ status: garment.status, duplicate: true });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.garmentEvent.create({
        data: { garmentId: garment.id, type },
      });
      return tx.garment.update({
        where: { id: garment.id },
        data: { status: nextStatus(type) },
        select: { status: true },
      });
    });

    return jsonOk({ status: updated.status, duplicate: false });
  } catch {
    return jsonError("INTERNAL", "没记录成功，再试一次", 500);
  }
}
