import assert from "node:assert/strict";
import test from "node:test";
import { analyzeGarmentImage } from "../../src/lib/ai/vision.ts";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nC0AAAAASUVORK5CYII=",
  "base64",
);

test("AI_MOCK=1 返回可用建议", async () => {
  process.env.AI_MOCK = "1";
  const result = await analyzeGarmentImage({ buffer: PNG, mime: "image/png" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.suggestion.brand, "uncertain");
    assert.ok(result.suggestion.category);
  }
});

test("没有 key 且未 mock 时明确失败，页面可降级", async () => {
  delete process.env.AI_MOCK;
  process.env.ARK_API_KEY = "";
  const result = await analyzeGarmentImage({ buffer: PNG, mime: "image/png" });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "AI_NOT_CONFIGURED");
    assert.match(result.msg, /手动/);
  }
});
