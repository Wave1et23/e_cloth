import { clearSessionCookie } from "@/lib/auth/session";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN", "请求来源不对", 403);
  }
  await clearSessionCookie();
  return jsonOk({ loggedOut: true });
}
