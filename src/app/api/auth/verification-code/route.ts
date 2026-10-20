import { getMailAdapter } from "@/lib/mail";
import { prisma } from "@/lib/db";
import {
  getClientIp,
  isSameOrigin,
  jsonError,
  jsonOk,
  readJsonObject,
} from "@/lib/http";
import { getRateLimit, recordFailure } from "@/lib/rate-limit";
import { deleteVerificationCode, issueVerificationCode } from "@/lib/verification-store";
import {
  VERIFICATION_CODE_TTL_MS,
} from "@/lib/verification";
import { normalizeEmail } from "@/lib/validation";

const COOLDOWN_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const EMAIL_HOURLY_LIMIT = 5;
const IP_HOURLY_LIMIT = 10;

function rateLimited(seconds: number) {
  return jsonError(
    "RATE_LIMITED",
    `请 ${seconds} 秒后再试`,
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
  if (!email) {
    return jsonError("VALIDATION", "邮箱格式不对", 400);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return jsonError("CONFLICT", "这个邮箱已经注册过了，直接登录吧", 409);
  }

  const ip = getClientIp(request);
  const checks = [
    { key: `mail:cooldown:${email}`, limit: 1, windowMs: COOLDOWN_MS },
    {
      key: `mail:hour:email:${email}`,
      limit: EMAIL_HOURLY_LIMIT,
      windowMs: HOUR_MS,
    },
    {
      key: `mail:hour:ip:${ip}`,
      limit: IP_HOURLY_LIMIT,
      windowMs: HOUR_MS,
    },
  ];

  for (const check of checks) {
    const status = getRateLimit(check.key, check.limit, check.windowMs);
    if (status.limited) return rateLimited(status.retryAfterSeconds);
  }

  // 先占住计数，避免并发请求同时通过检查。
  recordFailure(checks[0].key, COOLDOWN_MS);
  recordFailure(checks[1].key, HOUR_MS);
  recordFailure(checks[2].key, HOUR_MS);

  let issued: Awaited<ReturnType<typeof issueVerificationCode>>;
  try {
    issued = await issueVerificationCode({ email, requestIp: ip });
  } catch (error) {
    console.error("[verification-code] issue failed", error);
    return jsonError("INTERNAL", "验证码没生成出来，稍后再试", 500);
  }

  try {
    await getMailAdapter().sendVerificationCode({
      to: email,
      code: issued.code,
      purpose: "REGISTER",
      expiresAt: issued.expiresAt,
    });
  } catch (error) {
    await deleteVerificationCode(issued.id);
    console.error(
      "[verification-code] mail failed",
      error instanceof Error ? error.message : String(error),
    );
    return jsonError(
      "INTERNAL",
      "邮件服务还没配置，暂时发不了验证码",
      503,
    );
  }

  return jsonOk({
    cooldownSeconds: COOLDOWN_MS / 1000,
    expiresInSeconds: VERIFICATION_CODE_TTL_MS / 1000,
  });
}
