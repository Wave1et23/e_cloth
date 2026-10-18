import { getCurrentUser } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("UNAUTHORIZED", "请先登录", 401);
  return jsonOk(user);
}
