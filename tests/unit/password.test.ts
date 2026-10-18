import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password.ts";

test("密码哈希可验证，且同一密码两次哈希不同", async () => {
  const first = await hashPassword("demo1234");
  const second = await hashPassword("demo1234");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("demo1234", first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
});

test("损坏的哈希不会抛异常", async () => {
  assert.equal(await verifyPassword("x", ""), false);
  assert.equal(await verifyPassword("x", "scrypt$bad"), false);
});
