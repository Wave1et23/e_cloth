import assert from "node:assert/strict";
import test from "node:test";
import {
  TOKEN_ALPHABET,
  TOKEN_LENGTH,
  generateToken,
  isValidToken,
} from "../../src/lib/token.ts";

test("token 固定 12 位且只含 base62", () => {
  for (let i = 0; i < 200; i += 1) {
    const token = generateToken();
    assert.equal(token.length, TOKEN_LENGTH);
    for (const char of token) {
      assert.ok(TOKEN_ALPHABET.includes(char), `bad char ${char}`);
    }
  }
});

test("1000 次生成不重复", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 1000; i += 1) seen.add(generateToken());
  assert.equal(seen.size, 1000);
});

test("非法 token 被拒绝", () => {
  assert.equal(isValidToken("abc"), false);
  assert.equal(isValidToken("12345678901!"), false);
  assert.equal(isValidToken("123456789012"), true);
  assert.equal(isValidToken(null), false);
});
