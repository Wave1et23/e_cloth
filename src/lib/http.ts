import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "AI_UNAVAILABLE"
  | "INTERNAL";

export type ApiOk<T> = { ok: true; data: T };
export type ApiFail = {
  ok: false;
  code: ApiErrorCode;
  msg: string;
  retryAfterSeconds?: number;
};
export type ApiResult<T> = ApiOk<T> | ApiFail;

export function jsonOk<T>(data: T, status = 200): NextResponse<ApiOk<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(
  code: ApiErrorCode,
  msg: string,
  status: number,
  retryAfterSeconds?: number,
): NextResponse<ApiFail> {
  const body: ApiFail =
    retryAfterSeconds === undefined
      ? { ok: false, code, msg }
      : { ok: false, code, msg, retryAfterSeconds };
  return NextResponse.json(body, {
    status,
    headers:
      retryAfterSeconds === undefined
        ? undefined
        : { "Retry-After": String(retryAfterSeconds) },
  });
}

/** 读 JSON body；不是对象时返回 null。 */
export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return null;
    }
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * 反向代理下取真实 IP。
 * Cloudflare 会覆盖 `CF-Connecting-IP`；源站只允许 Cloudflare 回源时可信。
 * 本地/未经过代理的请求退化为 loopback。
 */
export function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf?.trim()) return cf.trim();
  const real = request.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  // 仅作为本地开发/非 Cloudflare 部署的兜底；生产源站需只允许 Cloudflare 回源。
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return "127.0.0.1";
}

/**
 * 写操作的同源检查。SameSite=Lax 已挡住跨站表单，这一层防的是被绕过的浏览器。
 * 没有 Origin 的请求（curl、同源表单）放行。
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const requestUrl = new URL(request.url);
    if (new URL(origin).host === requestUrl.host) return true;
    const configured = process.env.APP_BASE_URL;
    if (configured) {
      return new URL(origin).origin === new URL(configured).origin;
    }
    return false;
  } catch {
    return false;
  }
}
