import assert from "node:assert/strict";
import test from "node:test";
import {
  EVENT_TO_STATUS,
  STATUSES,
  isGarmentEventType,
  nextStatus,
  normalizeStatus,
  statusLabel,
} from "../../src/lib/status.ts";

test("6 个事件映射到 5 个状态", () => {
  assert.equal(nextStatus("WORN"), "WORN");
  assert.equal(nextStatus("WASHED"), "TO_WASH");
  assert.equal(nextStatus("DRY_CLEANED"), "TO_WASH");
  assert.equal(nextStatus("RETURNED"), "IN_CLOSET");
  assert.equal(nextStatus("STORED"), "STORED");
  assert.equal(nextStatus("SOLD"), "RETIRED");
  assert.equal(Object.keys(EVENT_TO_STATUS).length, 6);
});

test("所有目标状态都在 5 状态表内", () => {
  for (const status of Object.values(EVENT_TO_STATUS)) {
    assert.ok(status in STATUSES);
  }
});

test("未知状态兜底为在柜", () => {
  assert.equal(normalizeStatus("WHATEVER"), "IN_CLOSET");
  assert.equal(normalizeStatus(null), "IN_CLOSET");
  assert.equal(statusLabel("WORN"), "穿着中");
  assert.equal(statusLabel("nope"), "在柜");
});

test("事件类型校验只接受 6 个已知值", () => {
  assert.equal(isGarmentEventType("WORN"), true);
  assert.equal(isGarmentEventType("WASHED"), true);
  assert.equal(isGarmentEventType("SOLD"), true);
  assert.equal(isGarmentEventType("LOST"), false);
  assert.equal(isGarmentEventType(1), false);
});
