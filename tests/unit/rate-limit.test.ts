import assert from "node:assert/strict";
import test from "node:test";
import {
  getRateLimit,
  recordFailure,
  resetFailures,
} from "../../src/lib/rate-limit.ts";

test("发送验证码 60 秒冷却返回剩余秒数", () => {
  const key = "test:mail:cooldown";
  recordFailure(key, 60_000, 0);
  const limited = getRateLimit(key, 1, 60_000, 1_000);
  assert.equal(limited.limited, true);
  assert.equal(limited.retryAfterSeconds, 59);
  assert.equal(getRateLimit(key, 1, 60_000, 60_000).limited, false);
});

test("邮箱每小时 5 次上限与窗口重置", () => {
  const key = "test:mail:hour:email";
  for (let i = 0; i < 5; i += 1) recordFailure(key, 3_600_000, 0);
  const limited = getRateLimit(key, 5, 3_600_000, 0);
  assert.equal(limited.limited, true);
  assert.equal(limited.retryAfterSeconds, 3_600);
  assert.equal(getRateLimit(key, 5, 3_600_000, 3_600_000).limited, false);
});

test("登录 5 次失败锁定 15 分钟，成功重置邮箱维度", () => {
  const key = "test:login:email";
  for (let i = 0; i < 5; i += 1) recordFailure(key, 900_000, 0);
  assert.equal(getRateLimit(key, 5, 900_000, 0).limited, true);
  assert.equal(getRateLimit(key, 5, 900_000, 0).retryAfterSeconds, 900);
  resetFailures(key);
  assert.equal(getRateLimit(key, 5, 900_000, 0).limited, false);
});

test("不同 key 互不影响", () => {
  recordFailure("test:limit:a", 60_000, 0);
  assert.equal(getRateLimit("test:limit:b", 1, 60_000, 0).limited, false);
});
