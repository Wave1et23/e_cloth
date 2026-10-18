import assert from "node:assert/strict";
import test from "node:test";
import { detectImageType } from "../../src/lib/images.ts";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nC0AAAAASUVORK5CYII=",
  "base64",
);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

test("PNG/JPEG 魔数被识别", () => {
  assert.deepEqual(detectImageType(PNG), { mime: "image/png", ext: "png" });
  assert.deepEqual(detectImageType(JPEG), { mime: "image/jpeg", ext: "jpg" });
});

test("伪装扩展名的文本被拒绝", () => {
  assert.equal(detectImageType(Buffer.from("not an image at all")), null);
  assert.equal(detectImageType(Buffer.alloc(2)), null);
});
