import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OutfitDetail } from "@/components/outfit-detail";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function OutfitDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [outfit, garments] = await Promise.all([
    prisma.outfit.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        name: true,
        notes: true,
        items: {
          orderBy: { position: "asc" },
          select: {
            garmentId: true,
            garment: { select: { name: true } },
          },
        },
      },
    }),
    prisma.garment.findMany({
      where: { userId: user.id },
      orderBy: { seq: "desc" },
      select: { id: true, name: true, seq: true, category: true },
    }),
  ]);

  if (!outfit) notFound();

  return (
    <>
      <SiteHeader showLogout />
      <main className="page" style={{ maxWidth: 820 }}>
        <Link href="/outfits" className="muted" style={{ fontSize: 13 }}>
          ← 返回搭配
        </Link>
        <div style={{ marginTop: 14 }}>
          <OutfitDetail
            outfit={{
              id: outfit.id,
              name: outfit.name,
              notes: outfit.notes,
              items: outfit.items.map((item) => ({
                garmentId: item.garmentId,
                name: item.garment.name,
              })),
            }}
            garments={garments}
          />
        </div>
      </main>
    </>
  );
}
