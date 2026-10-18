import { cookies } from "next/headers";
import {
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
} from "@/lib/auth/session-codec";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export { SESSION_COOKIE };

/** Route Handler 中写 cookie。 */
export async function setSessionCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(userId), {
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
