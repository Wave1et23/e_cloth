import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionPayload } from "@/lib/auth/session";

export type CurrentUser = {
  id: string;
  email: string;
};

/** 服务端统一入口：session → User。失效的 uid 直接当未登录。 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // 会话校验依赖当前时间（过期判断），显式声明为请求期数据，
  // 避免 Cache Components 在预渲染阶段把 Date.now() 当成不稳定值。
  await connection();
  const session = await getSessionPayload();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, email: true, sessionVersion: true },
  });
  if (!user || user.sessionVersion !== session.ver) return null;
  return { id: user.id, email: user.email };
}
