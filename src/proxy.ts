import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * 乐观鉴权：
 * - `/` 有 session cookie 时直接去衣柜，避免登录用户停在落地页；
 * - 受保护页没有 session cookie 时去登录；
 * - 真正的签名/过期/用户校验仍在页面/接口里做。
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    if (!hasSession) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/garments";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/garments/:path*", "/labels/:path*"],
};
