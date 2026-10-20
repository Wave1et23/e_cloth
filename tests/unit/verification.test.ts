import assert from "node:assert/strict";
import test from "node:test";
import {
  generateVerificationCode,
  isVerificationCodeAttemptsExceeded,
  isVerificationCodeExpired,
  normalizeVerificationCode,
  VERIFICATION_CODE_MAX_ATTEMPTS,
  VERIFICATION_CODE_TTL_MS,
} from "../../src/lib/verification.ts";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password.ts";

test("验证码固定 6 位数字", () => {
  for (let i = 0; i < 50; i += 1) {
    assert.match(generateVerificationCode(), /^\d{6}$/);
  }
});

test("验证码格式校验：只接受 6 位数字", () => {
  assert.equal(normalizeVerificationCode("123456"), "123456");
  assert.equal(normalizeVerificationCode(" 123456 "), "123456");
  assert.equal(normalizeVerificationCode("12345"), null);
  assert.equal(normalizeVerificationCode("1234567"), null);
  assert.equal(normalizeVerificationCode("12345a"), null);
  assert.equal(normalizeVerificationCode(123456), null);
});

test("有效期 10 分钟，边界时刻视为过期", () => {
  const expiresAt = new Date(VERIFICATION_CODE_TTL_MS);
  assert.equal(isVerificationCodeExpired(expiresAt, VERIFICATION_CODE_TTL_MS - 1), false);
  assert.equal(isVerificationCodeExpired(expiresAt, VERIFICATION_CODE_TTL_MS), true);
});

test("最多尝试 5 次", () => {
  assert.equal(isVerificationCodeAttemptsExceeded(4), false);
  assert.equal(isVerificationCodeAttemptsExceeded(5), true);
  assert.equal(VERIFICATION_CODE_MAX_ATTEMPTS, 5);
});

test("验证码哈希不等于明文且可用原码校验", async () => {
  const code = "042731";
  const hash = await hashPassword(code);
  assert.notEqual(hash, code);
  assert.equal(hash.includes(code), false);
  assert.equal(await verifyPassword(code, hash), true);
  assert.equal(await verifyPassword("111111", hash), false);
});
