import assert from "node:assert/strict";
import test from "node:test";
import {
  computeCpw,
  formatCny,
  parsePriceToCents,
} from "../../src/lib/cost.ts";

test("CPW = 价格 ÷ 穿着次数", () => {
  assert.equal(computeCpw(89900, 4), 224.75);
  assert.equal(computeCpw(29900, 76), 3.93);
});

test("缺价格或没穿过返回 null，而不是 0 或无穷", () => {
  assert.equal(computeCpw(null, 10), null);
  assert.equal(computeCpw(undefined, 10), null);
  assert.equal(computeCpw(0, 10), null);
  assert.equal(computeCpw(10000, 0), null);
  assert.equal(computeCpw(10000, -1), null);
  assert.equal(computeCpw(Number.NaN, 2), null);
});

test("金额展示与价格解析", () => {
  assert.equal(formatCny(224.75), "¥224.75");
  assert.equal(formatCny(3), "¥3");
  assert.equal(formatCny(null), "数据不足");
  assert.equal(parsePriceToCents("899"), 89900);
  assert.equal(parsePriceToCents("89.9"), 8990);
  assert.equal(parsePriceToCents("89.99"), 8999);
  assert.equal(parsePriceToCents(""), null);
  assert.equal(parsePriceToCents("abc"), null);
  assert.equal(parsePriceToCents("8.999"), null);
});
