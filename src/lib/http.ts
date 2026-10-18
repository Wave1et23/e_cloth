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
export type ApiFail = { ok: false; code: ApiErrorCode; msg: string };
export type ApiResult<T> = ApiOk<T> | ApiFail;

export function jsonOk<T>(data: T, status = 200): NextResponse<ApiOk<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(
  code: ApiErrorCode,
  msg: string,
  status: number,
): NextResponse<ApiFail> {
  return NextResponse.json({ ok: false, code, msg }, { status });
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

/** 反向代理下取真实 IP；本地开发固定返回 loopback。 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
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
