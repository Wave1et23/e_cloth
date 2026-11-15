import { analyzeGarmentImage } from "@/lib/ai/vision";
import { getCurrentUser } from "@/lib/auth/user";
import { compressGarmentImage } from "@/lib/image-compress";
import {
  MAX_IMAGE_BYTES,
  cleanupStaleTempImages,
  detectImageType,
  saveTempImage,
} from "@/lib/images";
import { jsonError, jsonOk } from "@/lib/http";
import { isSameOrigin } from "@/lib/http";
import { getRateLimit, recordFailure } from "@/lib/rate-limit";

export const maxDuration = 30;

/**
 * 上传照片并存到临时区；默认顺带跑一次 AI。
 * AI 失败仍返回 200（带 imageToken），页面继续手动填写。
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN", "请求来源不对", 403);
  }
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

  const minute = getRateLimit(`ai:minute:${user.id}`, 10, 60_000);
  if (minute.limited) {
    return jsonError(
      "RATE_LIMITED",
      `AI 调用太频繁，请 ${minute.retryAfterSeconds} 秒后再试`,
      429,
      minute.retryAfterSeconds,
    );
  }
  const hour = getRateLimit(`ai:hour:${user.id}`, 100, 60 * 60 * 1000);
  if (hour.limited) {
    return jsonError(
      "RATE_LIMITED",
      "AI 今日调用次数太多，晚点再试",
      429,
      hour.retryAfterSeconds,
    );
  }
  recordFailure(`ai:minute:${user.id}`, 60_000);
  recordFailure(`ai:hour:${user.id}`, 60 * 60 * 1000);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("VALIDATION", "上传格式不对", 400);
  }

  const file = form.get("image");
  if (!(file instanceof Blob)) {
    return jsonError("VALIDATION", "请选择一张照片", 400);
  }
  if (file.size === 0) {
    return jsonError("VALIDATION", "照片是空的，换一张试试", 400);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return jsonError("VALIDATION", "只支持 JPG/PNG，且不超过 10MB", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(buffer);
  if (!type) {
    return jsonError("VALIDATION", "只支持 JPG/PNG，且不超过 10MB", 400);
  }

  let compressed;
  try {
    compressed = await compressGarmentImage(buffer);
  } catch {
    return jsonError("VALIDATION", "这张图片读不出来，换一张试试", 400);
  }
  console.info(
    `[image] ${file.size}B -> ${compressed.bytes}B, ${compressed.width}x${compressed.height}`,
  );

  await cleanupStaleTempImages(user.id);
  const imageToken = await saveTempImage(user.id, compressed.buffer);

  if (form.get("skipAi") === "1") {
    return jsonOk({ imageToken, ai: null });
  }

  // 压缩后统一是 JPEG；AI 只看压缩图，省流量也省视觉 token。
  const result = await analyzeGarmentImage({
    buffer: compressed.buffer,
    mime: "image/jpeg",
  });
  return jsonOk(
    result.ok
      ? { imageToken, ai: { ok: true, suggestion: result.suggestion } }
      : { imageToken, ai: { ok: false, code: result.code, msg: result.msg } },
  );
}
