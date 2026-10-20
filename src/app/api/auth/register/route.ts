import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import {
  getClientIp,
  isSameOrigin,
  jsonError,
  jsonOk,
  readJsonObject,
} from "@/lib/http";
import { getRateLimit, recordFailure } from "@/lib/rate-limit";
import {
  normalizeVerificationCode,
} from "@/lib/verification";
import { verifyVerificationCode } from "@/lib/verification-store";
import { isValidPassword, normalizeEmail } from "@/lib/validation";

const HOUR_MS = 60 * 60 * 1000;
const EMAIL_HOURLY_LIMIT = 5;
const IP_HOURLY_LIMIT = 10;

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
  if (!body) {
    return jsonError("VALIDATION", "请求格式不对，请重试", 400);
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return jsonError("VALIDATION", "邮箱格式不对", 400);
  }
  const password = body.password;
  if (!isValidPassword(password)) {
    return jsonError("VALIDATION", "密码至少 8 位", 400);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return jsonError("CONFLICT", "这个邮箱已经注册过了，直接登录吧", 409);
  }

  const ip = getClientIp(request);
  const emailKey = `register:hour:email:${email}`;
  const ipKey = `register:hour:ip:${ip}`;
  const emailLimit = getRateLimit(emailKey, EMAIL_HOURLY_LIMIT, HOUR_MS);
  if (emailLimit.limited) return rateLimited(emailLimit.retryAfterSeconds);
  const ipLimit = getRateLimit(ipKey, IP_HOURLY_LIMIT, HOUR_MS);
  if (ipLimit.limited) return rateLimited(ipLimit.retryAfterSeconds);

  // 注册尝试也占计数，避免用不同验证码反复撞接口。
  recordFailure(emailKey, HOUR_MS);
  recordFailure(ipKey, HOUR_MS);

  const skipVerification =
    process.env.NODE_ENV !== "production" &&
    process.env.REGISTER_SKIP_EMAIL_VERIFICATION === "1";

  let codeId: string | null = null;
  if (!skipVerification) {
    if (body.code === undefined || body.code === null || body.code === "") {
      return codeError("请先获取验证码");
    }
    const code = normalizeVerificationCode(body.code);
    if (!code) {
      return codeError("验证码是 6 位数字");
    }

    const verified = await verifyVerificationCode({ email, code });
    if (!verified.ok) {
      if (verified.reason === "not_found") {
        return codeError("请先获取验证码");
      }
      if (verified.reason === "expired") {
        return codeError("验证码已过期，请重新发送");
      }
      if (verified.reason === "used") {
        return codeError("验证码已经用过了，请重新发送", 409);
      }
      if (verified.reason === "attempts") {
        return codeError(
          "验证码尝试次数过多，请重新发送",
        );
      }
      const left =
        verified.attemptsLeft === undefined
          ? ""
          : `，还可以试 ${verified.attemptsLeft} 次`;
      return codeError(
        `验证码不对，请重新输入${left}`,
      );
    }
    codeId = verified.id;
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.$transaction(async (tx) => {
      if (codeId) {
        const consumed = await tx.verificationCode.updateMany({
          where: {
            id: codeId,
            used: false,
            expiresAt: { gt: new Date() },
          },
          data: { used: true },
        });
        if (consumed.count !== 1) throw new CodeConsumedError();
      }
      return tx.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true },
      });
    });

    await setSessionCookie(user.id);
    return jsonOk(user, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(
        "CONFLICT",
        "这个邮箱已经注册过了，直接登录吧",
        409,
      );
    }
    if (error instanceof CodeConsumedError) {
      return codeError("验证码已经用过了，请重新发送", 409);
    }
    console.error("[register] failed", error);
    return jsonError("INTERNAL", "注册没成功，稍后再试", 500);
  }
}
