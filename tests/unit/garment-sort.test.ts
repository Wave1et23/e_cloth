import assert from "node:assert/strict";
import test from "node:test";
import {
  compareGarmentsByWorn,
  sortGarmentsByWorn,
} from "../../src/lib/garment-sort.ts";

function garment(seq: number, worn: number, status = "IN_CLOSET") {
  return {
    id: `G${seq}`,
    seq,
    status,
    events: Array.from({ length: worn }, (_, index) => ({ id: String(index) })),
  };
}

test("穿着次数降序", () => {
  const sorted = sortGarmentsByWorn([
    garment(1, 2),
    garment(2, 5),
    garment(3, 1),
  ]);
  assert.deepEqual(
    sorted.map((item) => item.seq),
    [2, 1, 3],
  );
});

test("次数相同按 seq 降序", () => {
  const sorted = sortGarmentsByWorn([
    garment(1, 3),
    garment(3, 3),
    garment(2, 3),
  ]);
  assert.deepEqual(
    sorted.map((item) => item.seq),
    [3, 2, 1],
  );
});

test("0 次穿着的衣物排在最后，即使 seq 更大", () => {
  const sorted = sortGarmentsByWorn([
    garment(9, 0),
    garment(1, 1),
    garment(8, 0),
    garment(2, 2),
  ]);
  assert.deepEqual(
    sorted.map((item) => item.seq),
    [2, 1, 9, 8],
  );
  assert.equal(sorted.at(-1)?.events.length, 0);
});

test("已退出的衣物置底，即使穿着次数更多", () => {
  const sorted = sortGarmentsByWorn([
    garment(1, 0),
    garment(2, 20, "RETIRED"),
    garment(3, 3),
    garment(4, 10, "RETIRED"),
  ]);
  assert.deepEqual(
    sorted.map((item) => item.seq),
    [3, 1, 2, 4],
  );
  assert.equal(sorted.at(-1)?.status, "RETIRED");
});

test("已退出衣物内部仍按次数和 seq 排序", () => {
  const sorted = sortGarmentsByWorn([
    garment(1, 2, "RETIRED"),
    garment(3, 0, "RETIRED"),
    garment(2, 2, "RETIRED"),
  ]);
  assert.deepEqual(
    sorted.map((item) => item.seq),
    [2, 1, 3],
  );
});

test("不修改入参数组，比较函数可单独使用", () => {
  const input = [garment(1, 1), garment(2, 3)];
  const snapshot = [...input];
  const sorted = sortGarmentsByWorn(input);
  assert.notEqual(sorted, input);
  assert.deepEqual(input, snapshot);
  assert.equal(compareGarmentsByWorn(input[0], input[1]), 2);
});
