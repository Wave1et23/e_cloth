/** 邮箱验证码的纯规则：生成、格式、过期、尝试次数。 */

import { randomInt } from "node:crypto";

export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
export const VERIFICATION_CODE_MAX_ATTEMPTS = 5;
export const VERIFICATION_PURPOSE_REGISTER = "REGISTER";

export function generateVerificationCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(
    VERIFICATION_CODE_LENGTH,
    "0",
  );
}

/** 只接受 6 位数字；返回 null 表示格式不对。 */
export function normalizeVerificationCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim();
  return /^\d{6}$/.test(code) ? code : null;
}

export function isVerificationCodeExpired(
  expiresAt: Date,
  now = Date.now(),
): boolean {
  return expiresAt.getTime() <= now;
}

export function isVerificationCodeAttemptsExceeded(attempts: number): boolean {
  return attempts >= VERIFICATION_CODE_MAX_ATTEMPTS;
}
