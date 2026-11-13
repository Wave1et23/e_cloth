import assert from "node:assert/strict";
import test from "node:test";
import {
  isOutfitOwner,
  removeGarmentFromOutfitItems,
  summarizeOutfitRemoval,
  validateOutfitItems,
  validateOutfitName,
  validateOutfitNotes,
} from "../../src/lib/outfits.ts";

test("搭配名称必填且限制 40 字", () => {
  assert.equal(validateOutfitName("").ok, false);
  assert.equal(validateOutfitName("   ").ok, false);
  assert.deepEqual(validateOutfitName("  通勤黑白  "), {
    ok: true,
    value: "通勤黑白",
  });
  assert.equal(validateOutfitName("搭".repeat(41)).ok, false);
});

test("备注可空，最多 200 字", () => {
  assert.deepEqual(validateOutfitNotes(undefined), { ok: true, value: null });
  assert.deepEqual(validateOutfitNotes(""), { ok: true, value: null });
  assert.deepEqual(validateOutfitNotes("  见客户  "), {
    ok: true,
    value: "见客户",
  });
  assert.equal(validateOutfitNotes("备".repeat(201)).ok, false);
});

test("搭配件数 1–4，重复件拒绝", () => {
  assert.equal(validateOutfitItems([]).ok, false);
  assert.deepEqual(validateOutfitItems(["a"]), { ok: true, value: ["a"] });
  assert.deepEqual(validateOutfitItems(["a", "b", "c", "d"]), {
    ok: true,
    value: ["a", "b", "c", "d"],
  });
  assert.equal(validateOutfitItems(["a", "b", "c", "d", "e"]).ok, false);
  assert.equal(validateOutfitItems(["a", "a"]).ok, false);
  assert.equal(validateOutfitItems("a").ok, false);
});

test("空搭配只改名时允许空 items", () => {
  assert.deepEqual(validateOutfitItems([], { allowEmpty: true }), {
    ok: true,
    value: [],
  });
});

test("删除衣物时移除关联项并保留空搭配信息", () => {
  const items = [
    { garmentId: "a" },
    { garmentId: "b" },
  ];
  const first = removeGarmentFromOutfitItems(items, "a");
  assert.deepEqual(first.items, [{ garmentId: "b" }]);
  assert.equal(first.becameEmpty, false);
  assert.equal(first.removed, true);

  const last = removeGarmentFromOutfitItems(first.items, "b");
  assert.deepEqual(last.items, []);
  assert.equal(last.becameEmpty, true);

  const missing = removeGarmentFromOutfitItems(items, "x");
  assert.equal(missing.removed, false);
  assert.equal(missing.becameEmpty, false);
  assert.deepEqual(items, [{ garmentId: "a" }, { garmentId: "b" }]);
});

test("删除衣物前统计受影响和变空的搭配", () => {
  const summary = summarizeOutfitRemoval([
    { items: [{ garmentId: "a" }] },
    { items: [{ garmentId: "a" }, { garmentId: "b" }] },
  ]);
  assert.deepEqual(summary, { affected: 2, emptied: 1 });
});

test("搭配归属校验", () => {
  assert.equal(isOutfitOwner({ userId: "u1" }, "u1"), true);
  assert.equal(isOutfitOwner({ userId: "u1" }, "u2"), false);
  assert.equal(isOutfitOwner(null, "u1"), false);
});
