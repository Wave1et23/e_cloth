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
import { getRateLimit, recordFailure, resetFailures } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/validation";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_EMAIL_FAILURES = 5;
const MAX_IP_FAILURES = 20;

function locked(seconds: number) {
  return jsonError(
    "RATE_LIMITED",
    `尝试太多次，请 ${seconds} 秒后再试`,
    429,
    seconds,
  );
}

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

  const ip = getClientIp(request);
  const emailKey = `login:fail:email:${email}`;
  const ipKey = `login:fail:ip:${ip}`;

  const emailLimit = getRateLimit(
    emailKey,
    MAX_EMAIL_FAILURES,
    WINDOW_MS,
  );
  if (emailLimit.limited) return locked(emailLimit.retryAfterSeconds);

  const ipLimit = getRateLimit(ipKey, MAX_IP_FAILURES, WINDOW_MS);
  if (ipLimit.limited) return locked(ipLimit.retryAfterSeconds);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, sessionVersion: true },
  });
  const matched = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || !matched) {
    recordFailure(emailKey, WINDOW_MS);
    recordFailure(ipKey, WINDOW_MS);
    return jsonError("UNAUTHORIZED", "邮箱或密码不对", 401);
  }

  // 成功登录只清邮箱维度；IP 维度的攻击记录继续保留。
  resetFailures(emailKey);
  await setSessionCookie(user.id, user.sessionVersion);
  return jsonOk({ id: user.id, email: user.email });
}
