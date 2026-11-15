import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 天

type SessionPayload = {
  uid: string;
  exp: number; // 秒级时间戳
  ver: number; // 用户 sessionVersion；重置密码后递增
};

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short");
  }
  return secret;
}

function sign(body: string): string {
  return createHmac("sha256", sessionSecret()).update(body).digest("base64url");
}

/** 生成签名 cookie 值：base64url(payload).HMAC。 */
export function signSession(
  userId: string,
  now = Date.now(),
  version = 0,
): string {
  const payload: SessionPayload = {
    uid: userId,
    exp: Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS,
    ver: version,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

/** 校验并解出 uid + sessionVersion；旧 cookie 无 ver 时按 0 兼容。 */
export function verifySessionPayload(
  raw: string | undefined,
  now = Date.now(),
): { uid: string; ver: number } | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  let expected: string;
  try {
    expected = sign(body);
  } catch {
    return null;
  }
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;
    if (typeof payload.uid !== "string" || payload.uid === "") return null;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 <= now) return null;
    const ver = typeof payload.ver === "number" ? payload.ver : 0;
    return { uid: payload.uid, ver };
  } catch {
    return null;
  }
}

/** 兼容旧调用：只返回 userId。 */
export function verifySession(
  raw: string | undefined,
  now = Date.now(),
): string | null {
  return verifySessionPayload(raw, now)?.uid ?? null;
}
