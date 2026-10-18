import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const TMP_ROOT = path.join(UPLOAD_ROOT, "tmp");
const GARMENT_ROOT = path.join(UPLOAD_ROOT, "garments");
const TOKEN_RE = /^[0-9a-f]{32}$/;

export type ImageType = {
  mime: "image/jpeg" | "image/png";
  ext: "jpg" | "png";
};

/** 魔数判断，不信任扩展名或 Content-Type。 */
export function detectImageType(buffer: Buffer): ImageType | null {
  if (buffer.length < 12) return null;
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }
  return null;
}

function userTmpDir(userId: string): string {
  return path.join(TMP_ROOT, path.basename(userId));
}

/** 保存到当前用户的临时区，返回 32 位 hex token。 */
export async function saveTempImage(
  userId: string,
  buffer: Buffer,
): Promise<string> {
  const dir = userTmpDir(userId);
  await mkdir(dir, { recursive: true });
  const token = randomUUID().replaceAll("-", "");
  await writeFile(path.join(dir, token), buffer, { flag: "wx" });
  return token;
}

export async function readTempImage(
  userId: string,
  token: unknown,
): Promise<Buffer | null> {
  if (typeof token !== "string" || !TOKEN_RE.test(token)) return null;
  try {
    return await readFile(path.join(userTmpDir(userId), token));
  } catch {
    return null;
  }
}

/**
 * 把临时图移到正式目录，返回相对 uploads/ 的路径（如 garments/xxx.jpg）。
 * 失败会抛异常，调用方负责回滚。
 */
export async function moveTempToGarment(
  userId: string,
  token: string,
): Promise<string> {
  const buffer = await readTempImage(userId, token);
  if (!buffer) throw new Error("upload-not-found");
  const type = detectImageType(buffer);
  if (!type) throw new Error("unsupported-image");

  await mkdir(GARMENT_ROOT, { recursive: true });
  const filename = `${randomUUID()}.${type.ext}`;
  const source = path.join(userTmpDir(userId), token);
  const target = path.join(GARMENT_ROOT, filename);
  try {
    await rename(source, target);
  } catch {
    await writeFile(target, buffer, { flag: "wx" });
    await rm(source, { force: true });
  }
  return path.posix.join("garments", filename);
}

/** 相对路径 → 绝对路径；越界返回 null。 */
export function photoFilePath(relative: string): string | null {
  const absolute = path.resolve(UPLOAD_ROOT, relative);
  const root = path.resolve(GARMENT_ROOT) + path.sep;
  return absolute.startsWith(root) ? absolute : null;
}

export async function readGarmentPhoto(
  relative: string,
): Promise<{ buffer: Buffer; mime: ImageType["mime"] } | null> {
  const absolute = photoFilePath(relative);
  if (!absolute) return null;
  try {
    const buffer = await readFile(absolute);
    const type = detectImageType(buffer);
    if (!type) return null;
    return { buffer, mime: type.mime };
  } catch {
    return null;
  }
}

export async function deleteGarmentPhoto(relative: string): Promise<void> {
  const absolute = photoFilePath(relative);
  if (!absolute) return;
  await rm(absolute, { force: true });
}

/** 顺手清掉 24 小时前的临时图，避免失败上传越积越多。 */
export async function cleanupStaleTempImages(
  userId: string,
  now = Date.now(),
): Promise<void> {
  const dir = userTmpDir(userId);
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return;
  }
  await Promise.all(
    names.map(async (name) => {
      const file = path.join(dir, name);
      try {
        const info = await stat(file);
        if (now - info.mtimeMs > 24 * 60 * 60 * 1000) {
          await rm(file, { force: true });
        }
      } catch {
        // 单个文件清理失败不影响上传
      }
    }),
  );
}
