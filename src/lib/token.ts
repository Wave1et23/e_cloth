import { randomBytes } from "node:crypto";

/** 12 位 base62 token：二维码里的能力凭证。 */
export const TOKEN_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const TOKEN_LENGTH = 12;

/**
 * 用拒绝采样避免取模偏差：256 不是 62 的整数倍，直接 % 62 会让前 8 个字符偏多。
 * 62 * 4 = 248，只接受 < 248 的字节。
 */
export function generateToken(length: number = TOKEN_LENGTH): string {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("token length must be a positive integer");
  }
  let token = "";
  while (token.length < length) {
    const bytes = randomBytes(Math.max(16, length * 2));
    for (const byte of bytes) {
      if (byte >= 248) continue;
      token += TOKEN_ALPHABET[byte % 62];
      if (token.length === length) break;
    }
  }
  return token;
}

export function isValidToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === TOKEN_LENGTH &&
    /^[0-9A-Za-z]+$/.test(value)
  );
}
