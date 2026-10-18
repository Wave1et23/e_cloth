import Link from "next/link";
import { redirect } from "next/navigation";
import { GarmentActions } from "@/components/garment-actions";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/user";
import { computeCpw, formatCny } from "@/lib/cost";
import { prisma } from "@/lib/db";
import { eventLabel, isGarmentEventType, normalizeStatus, statusLabel } from "@/lib/status";

export const instant = false;

type Params = { params: Promise<{ id: string }> };

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return value.toISOString().slice(0, 10);
}

function formatPrice(cents: number | null): string {
  if (cents === null) return "—";
  return `¥${(cents / 100).toFixed(2)}`;
}

export default async function GarmentDetailPage({ params }: Params) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const garment = await prisma.garment.findFirst({
    where: { id, userId: user.id },
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 100 },
      label: { select: { token: true } },
    },
  });

  if (!garment) {
    return (
      <>
        <SiteHeader showLogout />
        <main className="page" style={{ maxWidth: 640 }}>
          <section className="card empty">
            <h2>这件衣服不在了</h2>
            <p className="muted">可能已经被删除，或者链接不对。</p>
            <Link
              href="/garments"
              className="btn btn-primary"
              style={{ marginTop: 18 }}
            >
              回衣柜
            </Link>
          </section>
        </main>
      </>
    );
  }

  const wornCount = garment.events.filter(
    (event) => event.type === "WORN",
  ).length;
  const cpw = computeCpw(garment.priceCents, wornCount);
  const attributes: Array<[string, string]> = [
    ["类别", garment.category],
    ["颜色", garment.primaryColor ?? "—"],
    ["图案", garment.pattern ?? "—"],
    ["版型", garment.fit ?? "—"],
    ["季节", garment.season ?? "—"],
    ["风格", garment.style ?? "—"],
    ["材质", garment.material ?? "—"],
    ["品牌", "不确定"],
    ["价格", formatPrice(garment.priceCents)],
    ["购买日期", formatDate(garment.purchaseDate)],
  ];

  return (
    <>
      <SiteHeader showLogout />
      <main className="page">
        <Link href="/garments" className="muted" style={{ fontSize: 13 }}>
          ← 回衣柜
        </Link>

        <div className="detail-grid">
          <div className="card" style={{ overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/garments/${garment.id}/photo`}
              alt={garment.name}
              style={{
                width: "100%",
                aspectRatio: "4 / 5",
                objectFit: "cover",
                background: "var(--paper-raised)",
                display: "block",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <p className="muted" style={{ fontSize: 12, letterSpacing: "0.1em" }}>
                G{String(garment.seq).padStart(3, "0")} · {garment.category}
              </p>
              <h1 style={{ fontSize: 30, marginTop: 4 }}>{garment.name}</h1>
              <span
                className={
                  normalizeStatus(garment.status) === "WORN"
                    ? "badge badge-worn"
                    : normalizeStatus(garment.status) === "TO_WASH"
                      ? "badge badge-wash"
                      : normalizeStatus(garment.status) === "RETIRED"
                        ? "badge badge-retired"
                        : "badge"
                }
                style={{ marginTop: 8 }}
              >
                {statusLabel(garment.status)}
              </span>
            </div>

            <section className="card" style={{ padding: 18 }}>
              <h2 style={{ fontSize: 16, marginBottom: 12 }}>属性</h2>
              <div className="attr-grid">
                {attributes.map(([key, value]) => (
                  <div key={key}>
                    <div className="attr-key">{key}</div>
                    <div>{value}</div>
                  </div>
                ))}
              </div>
              {garment.notes ? (
                <p className="muted" style={{ fontSize: 14, marginTop: 14 }}>
                  备注：{garment.notes}
                </p>
              ) : null}
            </section>

            <section className="card" style={{ padding: 18 }}>
              <h2 style={{ fontSize: 16 }}>单次穿着成本</h2>
              <p style={{ fontSize: 26, marginTop: 6 }}>{formatCny(cpw)}</p>
              <p className="muted" style={{ fontSize: 13 }}>
                {wornCount > 0
                  ? `已记录 ${wornCount} 次穿着`
                  : "还没有穿着记录，扫一下衣架上的码试试"}
              </p>
            </section>

            <section className="card" style={{ padding: 18 }}>
              <h2 style={{ fontSize: 16, marginBottom: 10 }}>事件时间线</h2>
              {garment.events.length === 0 ? (
                <p className="muted" style={{ fontSize: 14 }}>
                  还没有记录。扫码页点一下「今天穿了」，这里就会出现第一条。
                </p>
              ) : (
                <ul className="timeline">
                  {garment.events.map((event) => (
                    <li key={event.id}>
                      <span>
                        {isGarmentEventType(event.type)
                          ? eventLabel(event.type)
                          : event.type}
                      </span>
                      <span className="muted">
                        {event.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="cta-row">
              <Link
                href={`/labels?ids=${garment.id}`}
                className="btn"
              >
                打印标签
              </Link>
            </div>

            <GarmentActions
              garment={{
                id: garment.id,
                name: garment.name,
                category: garment.category,
                primaryColor: garment.primaryColor ?? "",
                pattern: garment.pattern ?? "",
                fit: garment.fit ?? "",
                season: garment.season ?? "",
                style: garment.style ?? "",
                material: garment.material ?? "",
                price:
                  garment.priceCents === null
                    ? ""
                    : (garment.priceCents / 100).toString(),
                purchaseDate: garment.purchaseDate
                  ? garment.purchaseDate.toISOString().slice(0, 10)
                  : "",
                notes: garment.notes ?? "",
              }}
            />

            <p className="muted" style={{ fontSize: 13 }}>
              标签已生成，token 尾号 {garment.label?.token.slice(-4) ?? "—"}。
              打印时请选「实际大小 / 缩放 100%」。
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
