import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 天

type SessionPayload = {
  uid: string;
  exp: number; // 秒级时间戳
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
export function signSession(userId: string, now = Date.now()): string {
  const payload: SessionPayload = {
    uid: userId,
    exp: Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

/** 校验并解出 userId；签名不对、格式不对、过期都返回 null。 */
export function verifySession(
  raw: string | undefined,
  now = Date.now(),
): string | null {
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
    ) as SessionPayload;
    if (typeof payload.uid !== "string" || payload.uid === "") return null;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 <= now) return null;
    return payload.uid;
  } catch {
    return null;
  }
}
