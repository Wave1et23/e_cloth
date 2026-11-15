import { cookies } from "next/headers";
import {
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
  verifySessionPayload,
} from "@/lib/auth/session-codec";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export { SESSION_COOKIE };

/** Route Handler 中写 cookie。version 用于密码重置后让旧 cookie 失效。 */
export async function setSessionCookie(
  userId: string,
  version = 0,
): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(userId, Date.now(), version), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** 读取当前 session 的 userId（不查库）。 */
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** 读取 uid + 版本；getCurrentUser 用它校验密码重置后的旧 session。 */
export async function getSessionPayload(): Promise<{
  uid: string;
  ver: number;
} | null> {
  const store = await cookies();
  return verifySessionPayload(store.get(SESSION_COOKIE)?.value);
}
