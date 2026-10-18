import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { jsonError, jsonOk, readJsonObject } from "@/lib/http";
import { isSameOrigin } from "@/lib/http";
import { isValidPassword, normalizeEmail } from "@/lib/validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN", "请求来源不对", 403);
  }

  const body = await readJsonObject(request);
  if (!body) {
    return jsonError("VALIDATION", "请求格式不对，请重试", 400);
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return jsonError("VALIDATION", "邮箱格式不对", 400);
  }
  const password = body.password;
  if (!isValidPassword(password)) {
    return jsonError("VALIDATION", "密码至少 8 位", 400);
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
    await setSessionCookie(user.id);
    return jsonOk(user, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(
        "CONFLICT",
        "这个邮箱已经注册过了，直接登录吧",
        409,
      );
    }
    console.error("[register] failed", error);
    return jsonError("INTERNAL", "注册没成功，稍后再试", 500);
  }
}
