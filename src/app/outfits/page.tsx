import Link from "next/link";
import { redirect } from "next/navigation";
import { OutfitEditor } from "@/components/outfit-editor";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db";

export const instant = false;

export const metadata = {
  title: "我的搭配 · 衣橱镜像",
  robots: { index: false, follow: false },
};

export default async function OutfitsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [outfits, garments] = await Promise.all([
    prisma.outfit.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
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
      select: {
        id: true,
        name: true,
        seq: true,
        category: true,
      },
    }),
  ]);

  return (
    <>
      <SiteHeader showLogout />
      <main className="page">
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 14,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28 }}>我的搭配</h1>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              共 {outfits.length} 套
            </p>
          </div>
        </div>

        <details
          className="card"
          style={{ padding: 16, marginBottom: 18 }}
        >
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            + 新建搭配
          </summary>
          <div style={{ marginTop: 14 }}>
            <OutfitEditor mode="create" garments={garments} />
          </div>
        </details>

        {outfits.length === 0 ? (
          <section className="card empty">
            <h2>还没有固定搭配</h2>
            <p className="muted" style={{ fontSize: 15 }}>
              选 1–4 件衣物，保存一套常穿的组合。
            </p>
          </section>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {outfits.map((outfit) => (
              <Link
                key={outfit.id}
                href={`/outfits/${outfit.id}`}
                className="card"
                style={{ padding: 16, color: "inherit" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 12,
                  }}
                >
                  <h2 style={{ fontSize: 19 }}>{outfit.name}</h2>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {outfit.items.length} 件
                  </span>
                </div>
                {outfit.notes ? (
                  <p
                    className="muted"
                    style={{
                      fontSize: 13,
                      marginTop: 6,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {outfit.notes}
                  </p>
                ) : null}

                {outfit.items.length === 0 ? (
                  <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                    这套搭配已空，点开补充衣物。
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      gap: 8,
                      marginTop: 12,
                      maxWidth: 360,
                    }}
                  >
                    {outfit.items.map((item) => (
                      <div key={item.garmentId}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/garments/${item.garmentId}/photo`}
                          alt={item.garment.name}
                          loading="lazy"
                          style={{
                            width: "100%",
                            aspectRatio: "4 / 5",
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid var(--line)",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
