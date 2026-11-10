import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveCategories,
  filterByCategories,
  filterBySeasons,
  parseCategoryParams,
  parseSeasonParams,
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

test("季节参数解析：去重、忽略未知值", () => {
  assert.deepEqual(parseSeasonParams(undefined), []);
  assert.deepEqual(parseSeasonParams([" 春 ", "秋", "春", "未知"]), [
    "春",
    "秋",
  ]);
  assert.deepEqual(parseSeasonParams("其他"), ["其他"]);
});

test("类别与季节先筛选后取交集", () => {
  const garments = [
    { id: "1", category: "上衣", season: "春,秋" },
    { id: "2", category: "上衣", season: "夏" },
    { id: "3", category: "裤装", season: "春" },
    { id: "4", category: "上衣", season: null },
  ];
  const byCategory = filterByCategories(garments, ["上衣"]);
  assert.deepEqual(
    filterBySeasons(byCategory, ["春"]).map((item) => item.id),
    ["1"],
  );
  assert.deepEqual(
    filterBySeasons(byCategory, ["春", "其他"]).map((item) => item.id),
    ["1", "4"],
  );
  assert.deepEqual(
    filterBySeasons(byCategory, ["冬"]).map((item) => item.id),
    [],
  );
});
