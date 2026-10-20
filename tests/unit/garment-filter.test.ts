import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveCategories,
  filterByCategories,
  parseCategoryParams,
  resolveCategoryFilter,
} from "../../src/lib/garment-filter.ts";

const OPTIONS = ["上衣", "裤装", "裙装", "其他"] as const;
const GARMENTS = [
  { id: "1", category: "裙装" },
  { id: "2", category: "上衣" },
  { id: "3", category: "上衣" },
  { id: "4", category: "未知类别" },
];

test("解析重复 category 参数：去空白、去重、忽略空值", () => {
  assert.deepEqual(parseCategoryParams(undefined), []);
  assert.deepEqual(parseCategoryParams("上衣"), ["上衣"]);
  assert.deepEqual(parseCategoryParams([" 上衣 ", "", "上衣", "裤装"]), [
    "上衣",
    "裤装",
  ]);
});

test("分类只来自衣物已有 category，并按选项顺序排列", () => {
  assert.deepEqual(deriveCategories(GARMENTS, OPTIONS), [
    "上衣",
    "裙装",
    "未知类别",
  ]);
});

test("URL 请求的合法分类即使当前无衣物，也会出现在标签里", () => {
  const result = resolveCategoryFilter(GARMENTS, OPTIONS, ["裤装", "不存在"]);
  assert.deepEqual(result.categories, ["上衣", "裙装", "未知类别", "裤装"]);
  assert.deepEqual(result.selected, ["裤装"]);
});

test("空选择表示全部；单选与多选按并集过滤", () => {
  assert.equal(filterByCategories(GARMENTS, []).length, 4);
  assert.deepEqual(
    filterByCategories(GARMENTS, ["上衣"]).map((item) => item.id),
    ["2", "3"],
  );
  assert.deepEqual(
    filterByCategories(GARMENTS, ["上衣", "裙装"]).map((item) => item.id),
    ["1", "2", "3"],
  );
});

test("合法但无衣物的分类过滤结果为空", () => {
  const { selected } = resolveCategoryFilter(GARMENTS, OPTIONS, ["裤装"]);
  assert.deepEqual(filterByCategories(GARMENTS, selected), []);
});
