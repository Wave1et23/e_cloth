import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import {
  getClientIp,
  isSameOrigin,
  jsonError,
  jsonOk,
  readJsonObject,
} from "@/lib/http";
import { isRateLimited, recordFailure, resetFailures } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/validation";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN", "请求来源不对", 403);
  }

  const body = await readJsonObject(request);
  if (!body) {
    return jsonError("VALIDATION", "请求格式不对，请重试", 400);
  }

  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || password === "") {
    return jsonError("VALIDATION", "请填写邮箱和密码", 400);
  }

  const key = `${getClientIp(request)}:${email}`;
  if (isRateLimited(key, MAX_FAILURES, WINDOW_MS)) {
    return jsonError("RATE_LIMITED", "尝试太多次，请 15 分钟后再试", 429);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });
  const matched = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || !matched) {
    recordFailure(key, WINDOW_MS);
    return jsonError("UNAUTHORIZED", "邮箱或密码不对", 401);
  }

  resetFailures(key);
  await setSessionCookie(user.id);
  return jsonOk({ id: user.id, email: user.email });
}
