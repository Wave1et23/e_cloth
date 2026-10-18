import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

/** 密码哈希格式：scrypt$N$r$p$salt$hash（salt/hash 为 base64url）。 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: 64 * 1024 * 1024,
  });
  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    const [scheme, n, r, p, saltText, hashText] = stored.split("$");
    if (scheme !== "scrypt" || !saltText || !hashText) return false;
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    if (expected.length === 0) return false;
    const actual = await scrypt(password, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
