import assert from "node:assert/strict";
import test from "node:test";
import {
  EVENT_VALUES,
  EVENTS,
  eventLabel,
} from "../../src/lib/status.ts";

test("详情页 6 个状态动作的顺序与扫码页一致", () => {
  assert.deepEqual(EVENT_VALUES, [
    "WORN",
    "WASHED",
    "DRY_CLEANED",
    "RETURNED",
    "STORED",
    "SOLD",
  ]);
});

test("详情页 6 个动作文案与扫码页共用同一份表", () => {
  assert.deepEqual(
    EVENT_VALUES.map((event) => eventLabel(event)),
    ["今天穿了", "要洗", "送干洗", "放回衣柜", "收起来", "卖掉了"],
  );
  assert.deepEqual(Object.keys(EVENTS), [...EVENT_VALUES]);
});
