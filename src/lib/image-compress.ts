import sharp from "sharp";

/** 手机原图通常 3000–4000px；服务器只有 2C4G，入库前统一压到这个上限。 */
export const MAX_IMAGE_WIDTH = 1440;
export const MAX_IMAGE_HEIGHT = 1920;
export const JPEG_QUALITY = 82;

export type CompressedImage = {
  buffer: Buffer;
  width: number;
  height: number;
  bytes: number;
};

/**
 * 统一转成 JPEG：
 * - 按 EXIF 方向旋正；
 * - 等比缩到 1440×1920 以内，不放大；
 * - 透明背景铺白；
 * - 质量 82，通常 200–400KB。
 */
export async function compressGarmentImage(
  input: Buffer,
): Promise<CompressedImage> {
  const { data, info } = await sharp(input, {
    limitInputPixels: 80_000_000,
    failOn: "error",
  })
    .rotate()
    .resize({
      width: MAX_IMAGE_WIDTH,
      height: MAX_IMAGE_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: JPEG_QUALITY, progressive: true, chromaSubsampling: "4:2:0" })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    bytes: data.byteLength,
  };
}
