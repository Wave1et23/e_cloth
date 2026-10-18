import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * 乐观鉴权：只挡“根本没有会话 cookie”的请求，避免 PPR 先渲染再客户端跳转。
 * 真正的用户校验仍在页面/接口里做（签名、过期、用户是否存在）。
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/garments/:path*", "/labels/:path*"],
};
