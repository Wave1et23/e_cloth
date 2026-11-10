import assert from "node:assert/strict";
import test from "node:test";
import {
  mockSuggestion,
  normalizeSuggestion,
  parseModelJson,
} from "../../src/lib/ai/schema.ts";
import {
  AI_FIELDS,
  FIELD_OPTIONS,
} from "../../src/lib/garment-fields.ts";

test("合法字段被保留，置信度被夹到 0-1", () => {
  const suggestion = normalizeSuggestion({
    category: "上衣",
    primaryColor: "灰",
    pattern: "纯色",
    fit: "常规",
    season: "春,秋",
    style: "休闲",
    material: "  棉  ",
    brand: "Acme",
    confidence: {
      category: 1.4,
      primaryColor: 0.88,
      pattern: -0.2,
      fit: 0.74,
      season: 0.66,
      style: 0.78,
      material: 0.58,
    },
  });

  assert.equal(suggestion.category, "上衣");
  assert.equal(suggestion.primaryColor, "灰");
  assert.equal(suggestion.material, "棉");
  assert.equal(suggestion.brand, "uncertain");
  assert.equal(suggestion.confidence.category, 1);
  assert.equal(suggestion.confidence.pattern, 0);
});

test("白名单外的字段置空、置信度归零", () => {
  const suggestion = normalizeSuggestion({
    category: "宇宙飞船",
    primaryColor: "彩虹",
    pattern: "纯色",
    fit: "常规",
    season: "四季",
    style: "休闲",
    material: "",
    confidence: { pattern: 0.9, fit: 0.8, season: 0.8, style: 0.8 },
  });

  assert.equal(suggestion.category, null);
  assert.equal(suggestion.primaryColor, null);
  assert.equal(suggestion.season, null);
  assert.equal(suggestion.confidence.category, 0);
  assert.equal(suggestion.confidence.primaryColor, 0);
  assert.equal(suggestion.confidence.pattern, 0.9);
  assert.equal(suggestion.material, null);
});

test("非对象输入不会抛异常", () => {
  const suggestion = normalizeSuggestion(null);
  for (const field of AI_FIELDS) {
    assert.equal(suggestion[field], null);
    assert.equal(suggestion.confidence[field], 0);
  }
  assert.equal(suggestion.brand, "uncertain");
});

test("mock 建议的每个值都在白名单内", () => {
  const suggestion = mockSuggestion();
  for (const field of AI_FIELDS) {
    const value = suggestion[field];
    if (value !== null) {
      assert.ok(FIELD_OPTIONS[field].includes(value), `${field}=${value}`);
    }
  }
});

test("parseModelJson 容忍 ```json 包裹", () => {
  assert.deepEqual(parseModelJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseModelJson('说明 {"a":2} 结束'), { a: 2 });
  assert.throws(() => parseModelJson("没有 JSON"));
});
