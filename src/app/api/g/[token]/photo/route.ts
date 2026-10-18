import { prisma } from "@/lib/db";
import { readGarmentPhoto } from "@/lib/images";

type Params = { params: Promise<{ token: string }> };

/** 扫码页缩略图：只凭 token，不暴露 uploads 目录。 */
export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  const label = await prisma.label.findUnique({
    where: { token },
    select: { garment: { select: { photoPath: true } } },
  });
  if (!label) {
    return Response.json(
      { ok: false, code: "NOT_FOUND", msg: "这个标签失效了" },
      { status: 404 },
    );
  }

  const photo = await readGarmentPhoto(label.garment.photoPath);
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
