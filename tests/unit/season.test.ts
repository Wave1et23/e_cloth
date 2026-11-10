import assert from "node:assert/strict";
import test from "node:test";
import {
  formatSeason,
  migrateLegacySeason,
  parseSeasonValue,
  seasonMatches,
  serializeSeason,
} from "../../src/lib/season.ts";

test("解析单个、多个与旧枚举季节", () => {
  assert.deepEqual(parseSeasonValue("春"), ["春"]);
  assert.deepEqual(parseSeasonValue("秋,春,秋"), ["春", "秋"]);
  assert.deepEqual(parseSeasonValue("春秋"), ["春", "秋"]);
  assert.deepEqual(parseSeasonValue("四季"), ["春", "夏", "秋", "冬"]);
  assert.deepEqual(parseSeasonValue(null), []);
  assert.deepEqual(parseSeasonValue("未知"), []);
});

test("序列化固定顺序，空值存 null", () => {
  assert.equal(serializeSeason(["秋", "春", "秋"]), "春,秋");
  assert.equal(serializeSeason(["春", "夏", "秋", "冬"]), "春,夏,秋,冬");
  assert.equal(serializeSeason([]), null);
  assert.equal(serializeSeason(null), null);
});

test("详情展示空季节为「其他」", () => {
  assert.equal(formatSeason("春,秋"), "春、秋");
  assert.equal(formatSeason(null), "其他");
  assert.equal(formatSeason(""), "其他");
});

test("季节筛选：多选并集，其他匹配空值", () => {
  assert.equal(seasonMatches("春,秋", []), true);
  assert.equal(seasonMatches("春,秋", ["春"]), true);
  assert.equal(seasonMatches("春,秋", ["冬"]), false);
  assert.equal(seasonMatches(null, ["其他"]), true);
  assert.equal(seasonMatches("", ["其他"]), true);
  assert.equal(seasonMatches("夏", ["其他"]), false);
  assert.equal(seasonMatches(null, ["春", "其他"]), true);
});

test("旧值迁移规则", () => {
  assert.equal(migrateLegacySeason("春秋"), "春,秋");
  assert.equal(migrateLegacySeason("四季"), "春,夏,秋,冬");
  assert.equal(migrateLegacySeason("春"), "春");
  assert.equal(migrateLegacySeason(""), "");
  assert.equal(migrateLegacySeason(null), null);
});
