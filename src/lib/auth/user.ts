import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";

export type CurrentUser = {
  id: string;
  email: string;
};

/** 服务端统一入口：session → User。失效的 uid 直接当未登录。 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  return user;
}
