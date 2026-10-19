import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { compressGarmentImage } from "../../src/lib/image-compress.ts";
import { detectImageType } from "../../src/lib/images.ts";

async function synthetic(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 120, b: 120 },
    },
  })
    .jpeg({ quality: 95 })
    .toBuffer();
}

test("竖图压到 1440×1920 以内并转 JPEG", async () => {
  const input = await synthetic(3000, 4000);
  const output = await compressGarmentImage(input);
  assert.equal(output.width, 1440);
  assert.equal(output.height, 1920);
  assert.deepEqual(detectImageType(output.buffer), {
    mime: "image/jpeg",
    ext: "jpg",
  });
});

test("横图压到 1440×1080，不放大", async () => {
  const input = await synthetic(4000, 3000);
  const output = await compressGarmentImage(input);
  assert.equal(output.width, 1440);
  assert.equal(output.height, 1080);

  const small = await compressGarmentImage(await synthetic(800, 800));
  assert.equal(small.width, 800);
  assert.equal(small.height, 800);
});
