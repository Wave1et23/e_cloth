import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import {
  VERIFICATION_CODE_MAX_ATTEMPTS,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_PURPOSE_REGISTER,
  generateVerificationCode,
  isVerificationCodeAttemptsExceeded,
  isVerificationCodeExpired,
} from "@/lib/verification";

export type VerificationPurpose = typeof VERIFICATION_PURPOSE_REGISTER;

export type IssuedCode = {
  id: string;
  code: string;
  expiresAt: Date;
};

export type VerifyFailureReason =
  | "not_found"
  | "expired"
  | "used"
  | "attempts"
  | "invalid";

export type VerifyCodeResult =
  | { ok: true; id: string }
  | { ok: false; reason: VerifyFailureReason; attemptsLeft?: number };

/**
 * 惰性清理：发码时删掉过期码与 24 小时前已使用的码。
 * 没有定时任务；不清理正在被校验的码，以便区分“过期”和“不存在”。
 */
export async function cleanupVerificationCodes(
  now = Date.now(),
): Promise<void> {
  const nowDate = new Date(now);
  const usedBefore = new Date(now - 24 * 60 * 60 * 1000);
  await prisma.verificationCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: nowDate } },
        { used: true, createdAt: { lt: usedBefore } },
      ],
    },
  });
}

/** 作废旧码 → 生成新码 → 只落哈希；返回明文给邮件 adapter，不返回给接口调用方。 */
export async function issueVerificationCode(input: {
  email: string;
  requestIp: string;
  now?: number;
}): Promise<IssuedCode> {
  const now = input.now ?? Date.now();
  await cleanupVerificationCodes(now);
  await prisma.verificationCode.updateMany({
    where: {
      email: input.email,
      purpose: VERIFICATION_PURPOSE_REGISTER,
      used: false,
    },
    data: { used: true },
  });

  const code = generateVerificationCode();
  const codeHash = await hashPassword(code);
  const expiresAt = new Date(now + VERIFICATION_CODE_TTL_MS);
  const row = await prisma.verificationCode.create({
    data: {
      email: input.email,
      codeHash,
      purpose: VERIFICATION_PURPOSE_REGISTER,
      expiresAt,
      requestIp: input.requestIp,
    },
    select: { id: true },
  });

  return { id: row.id, code, expiresAt };
}

export async function deleteVerificationCode(id: string): Promise<void> {
  await prisma.verificationCode.delete({ where: { id } }).catch(() => {
    // 发送失败后的清理失败不影响主错误返回
  });
}

/**
 * 校验最新一条验证码：
 * - 先按 used / expired / attempts 给出不同原因；
 * - 错误码递增 attempts，达到 5 次后返回 attempts。
 * 不在这里做 cleanup，避免把“过期”误判成“不存在”。
 */
export async function verifyVerificationCode(input: {
  email: string;
  code: string;
  now?: number;
}): Promise<VerifyCodeResult> {
  const now = input.now ?? Date.now();
  const row = await prisma.verificationCode.findFirst({
    where: {
      email: input.email,
      purpose: VERIFICATION_PURPOSE_REGISTER,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      codeHash: true,
      expiresAt: true,
      attempts: true,
      used: true,
    },
  });

  if (!row) return { ok: false, reason: "not_found" };
  if (row.used) return { ok: false, reason: "used" };
  if (isVerificationCodeExpired(row.expiresAt, now)) {
    return { ok: false, reason: "expired" };
  }
  if (isVerificationCodeAttemptsExceeded(row.attempts)) {
    return { ok: false, reason: "attempts" };
  }

  const matched = await verifyPassword(input.code, row.codeHash);
  if (!matched) {
    const updated = await prisma.verificationCode.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    const attemptsLeft = Math.max(
      0,
      VERIFICATION_CODE_MAX_ATTEMPTS - updated.attempts,
    );
    return {
      ok: false,
      reason: isVerificationCodeAttemptsExceeded(updated.attempts)
        ? "attempts"
        : "invalid",
      attemptsLeft,
    };
  }

  return { ok: true, id: row.id };
}
