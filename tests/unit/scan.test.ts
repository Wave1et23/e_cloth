import assert from "node:assert/strict";
import test from "node:test";
import {
  SCAN_IDEMPOTENCY_MS,
  isDuplicateScan,
  readScanEvent,
} from "../../src/lib/scan.ts";

const now = 1_700_000_000_000;

test("30 秒内同事件算重复", () => {
  const last = { type: "WORN", createdAt: new Date(now - 5_000) };
  assert.equal(isDuplicateScan(last, "WORN", now), true);
});

test("不同事件不算重复", () => {
  const last = { type: "WORN", createdAt: new Date(now - 5_000) };
  assert.equal(isDuplicateScan(last, "WASHED", now), false);
});

test("超过幂等窗口允许再记一次", () => {
  const last = {
    type: "WORN",
    createdAt: new Date(now - SCAN_IDEMPOTENCY_MS - 1),
  };
  assert.equal(isDuplicateScan(last, "WORN", now), false);
});

test("没有历史事件 / 未知事件", () => {
  assert.equal(isDuplicateScan(null, "WORN", now), false);
  assert.equal(readScanEvent("WORN"), "WORN");
  assert.equal(readScanEvent("LOST"), null);
  assert.equal(readScanEvent(1), null);
});
