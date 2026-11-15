import assert from "node:assert/strict";
import test from "node:test";
import {
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
  verifySessionPayload,
} from "../../src/lib/auth/session-codec.ts";

process.env.SESSION_SECRET = "test-secret-".repeat(6);

test("签名 cookie 可以解出同一个 userId", () => {
  const now = 1_700_000_000_000;
  const raw = signSession("user_123", now);
  assert.equal(verifySession(raw, now), "user_123");
});

test("session 携带版本号，供密码重置后失效旧 cookie", () => {
  const now = 1_700_000_000_000;
  const raw = signSession("user_123", now, 7);
  assert.deepEqual(verifySessionPayload(raw, now), {
    uid: "user_123",
    ver: 7,
  });
});

test("篡改 payload 或签名会被拒绝", () => {
  const now = 1_700_000_000_000;
  const raw = signSession("user_123", now);
  const [body, signature] = raw.split(".");
  const forged = Buffer.from(
    JSON.stringify({ uid: "attacker", exp: Math.floor(now / 1000) + 60 }),
  ).toString("base64url");
  assert.equal(verifySession(`${forged}.${signature}`, now), null);
  assert.equal(verifySession(`${body}.${signature}x`, now), null);
});

test("过期、空值、畸形值都返回 null", () => {
  const now = 1_700_000_000_000;
  const raw = signSession("user_123", now);
  assert.equal(verifySession(raw, now + (SESSION_MAX_AGE_SECONDS + 1) * 1000), null);
  assert.equal(verifySession(undefined, now), null);
  assert.equal(verifySession("", now), null);
  assert.equal(verifySession("not-a-cookie", now), null);
});
