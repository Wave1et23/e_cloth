import { getCurrentUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db";
import { readGarmentPhoto } from "@/lib/images";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { ok: false, code: "UNAUTHORIZED", msg: "请先登录" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const garment = await prisma.garment.findFirst({
    where: { id, userId: user.id },
    select: { photoPath: true },
  });
  if (!garment) {
    return Response.json(
      { ok: false, code: "NOT_FOUND", msg: "照片不在了" },
      { status: 404 },
    );
  }

  const photo = await readGarmentPhoto(garment.photoPath);
  if (!photo) {
    return Response.json(
      { ok: false, code: "NOT_FOUND", msg: "照片不在了" },
      { status: 404 },
    );
  }

  return new Response(new Uint8Array(photo.buffer), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "private, max-age=60",
    },
  });
}
