import { analyzeGarmentImage } from "@/lib/ai/vision";
import { getCurrentUser } from "@/lib/auth/user";
import {
  MAX_IMAGE_BYTES,
  cleanupStaleTempImages,
  detectImageType,
  saveTempImage,
} from "@/lib/images";
import { jsonError, jsonOk } from "@/lib/http";

export const maxDuration = 30;

/**
 * 上传照片并存到临时区；默认顺带跑一次 AI。
 * AI 失败仍返回 200（带 imageToken），页面继续手动填写。
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);

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

  await cleanupStaleTempImages(user.id);
  const imageToken = await saveTempImage(user.id, buffer);

  if (form.get("skipAi") === "1") {
    return jsonOk({ imageToken, ai: null });
  }

  const result = await analyzeGarmentImage({ buffer, mime: type.mime });
  return jsonOk(
    result.ok
      ? { imageToken, ai: { ok: true, suggestion: result.suggestion } }
      : { imageToken, ai: { ok: false, code: result.code, msg: result.msg } },
  );
}
