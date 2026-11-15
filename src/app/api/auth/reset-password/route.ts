import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import {
  getClientIp,
  isSameOrigin,
  jsonError,
  jsonOk,
  readJsonObject,
} from "@/lib/http";
import { getRateLimit, recordFailure } from "@/lib/rate-limit";
import {
  VERIFICATION_PURPOSE_RESET_PASSWORD,
  normalizeVerificationCode,
} from "@/lib/verification";
import { verifyVerificationCode } from "@/lib/verification-store";
import { isValidPassword, normalizeEmail } from "@/lib/validation";

const HOUR_MS = 60 * 60 * 1000;
const EMAIL_HOURLY_LIMIT = 10;
const IP_HOURLY_LIMIT = 20;

class CodeConsumedError extends Error {}

function rateLimited(seconds: number) {
  return jsonError(
    "RATE_LIMITED",
    `请求太频繁，请 ${seconds} 秒后再试`,
    429,
    seconds,
  );
}

function codeError(msg: string, status = 400) {
  return jsonError("VALIDATION", msg, status);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN", "请求来源不对", 403);
  }

  const body = await readJsonObject(request);
  if (!body) return jsonError("VALIDATION", "请求格式不对，请重试", 400);

  const email = normalizeEmail(body.email);
  if (!email) return jsonError("VALIDATION", "邮箱格式不对", 400);
  if (!isValidPassword(body.password)) {
    return jsonError("VALIDATION", "密码至少 8 位，最多 128 位", 400);
  }
  const code = normalizeVerificationCode(body.code);
  if (!code) return codeError("验证码是 6 位数字");

  const ip = getClientIp(request);
  const emailKey = `reset-submit:hour:email:${email}`;
  const ipKey = `reset-submit:hour:ip:${ip}`;
  const emailLimit = getRateLimit(emailKey, EMAIL_HOURLY_LIMIT, HOUR_MS);
  if (emailLimit.limited) return rateLimited(emailLimit.retryAfterSeconds);
  const ipLimit = getRateLimit(ipKey, IP_HOURLY_LIMIT, HOUR_MS);
  if (ipLimit.limited) return rateLimited(ipLimit.retryAfterSeconds);
  recordFailure(emailKey, HOUR_MS);
  recordFailure(ipKey, HOUR_MS);

  // 不区分“邮箱不存在”和“验证码不对”，避免账号枚举。
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return codeError("验证码不对或已过期，请重新获取");
  }

  const verified = await verifyVerificationCode({
    email,
    code,
    purpose: VERIFICATION_PURPOSE_RESET_PASSWORD,
  });
  if (!verified.ok) {
    if (verified.reason === "not_found") {
      return codeError("验证码不对或已过期，请重新获取");
    }
    if (verified.reason === "expired") {
      return codeError("验证码已过期，请重新发送");
    }
    if (verified.reason === "used") {
      return codeError("验证码已经用过了，请重新发送", 409);
    }
    if (verified.reason === "attempts") {
      return codeError("验证码尝试次数过多，请重新发送");
    }
    const left =
      verified.attemptsLeft === undefined
        ? ""
        : `，还可以试 ${verified.attemptsLeft} 次`;
    return codeError(`验证码不对，请重新输入${left}`);
  }

  const passwordHash = await hashPassword(body.password);
  try {
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.verificationCode.updateMany({
        where: {
          id: verified.id,
          used: false,
          expiresAt: { gt: new Date() },
        },
        data: { used: true },
      });
      if (consumed.count !== 1) throw new CodeConsumedError();
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          sessionVersion: { increment: 1 },
        },
      });
    });
    return jsonOk({ reset: true });
  } catch (error) {
    if (error instanceof CodeConsumedError) {
      return codeError("验证码已经用过了，请重新发送", 409);
    }
    console.error("[reset-password] failed", error);
    return jsonError("INTERNAL", "密码没重置成功，稍后再试", 500);
  }
}
