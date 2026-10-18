import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/user";
import { computeCpw, formatCny } from "@/lib/cost";
import { prisma } from "@/lib/db";
import { statusLabel } from "@/lib/status";

function Landing() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <section style={{ padding: "48px 0 32px", maxWidth: 720 }}>
          <p className="muted" style={{ letterSpacing: "0.18em", fontSize: 13 }}>
            衣 橱 镜 像
          </p>
          <h1
            style={{
              fontSize: "clamp(34px, 6vw, 54px)",
              lineHeight: 1.2,
              marginTop: 12,
            }}
          >
            给现实衣柜，
            <br />
            建一份数字档案
          </h1>
          <p className="muted" style={{ fontSize: 17, marginTop: 18, maxWidth: 560 }}>
            拍一件衣服，AI 自动填好类别、颜色、图案、季节；
            打印一张二维码贴到衣架上，手机相机扫一下，就能记下今天穿了什么。
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <Link href="/register" className="btn btn-primary">
              免费开始
            </Link>
            <Link href="/login" className="btn btn-ghost">
              我已注册
            </Link>
          </div>
        </section>

        <section
          className="card"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 24,
            padding: "28px 24px",
            marginTop: 24,
          }}
        >
          {[
            ["01", "拍照建档", "AI 先给建议，你来确认，3 秒录入一件。"],
            ["02", "打印标签", "A4 一页 24 张，剪下来贴到衣架。"],
            ["03", "扫码记录", "手机相机扫一下，点「今天穿了」。"],
          ].map(([step, title, body]) => (
            <div key={step}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--gold)",
                  fontSize: 13,
                  letterSpacing: "0.12em",
                }}
              >
                {step}
              </div>
              <h2 style={{ fontSize: 18, marginTop: 6 }}>{title}</h2>
              <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                {body}
              </p>
            </div>
          ))}
        </section>

        <p className="muted" style={{ fontSize: 13, marginTop: 20 }}>
          不需要下载 App，手机系统相机直接扫。
        </p>
      </main>
    </>
  );
}

async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) return <Landing />;

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [monthWears, inCloset, garments] = await Promise.all([
    prisma.garmentEvent.count({
      where: {
        type: "WORN",
        createdAt: { gte: monthStart },
        garment: { userId: user.id },
      },
    }),
    prisma.garment.count({ where: { userId: user.id, status: "IN_CLOSET" } }),
    prisma.garment.findMany({
      where: { userId: user.id },
      orderBy: { seq: "desc" },
      take: 4,
      select: {
        id: true,
        seq: true,
        name: true,
        status: true,
        priceCents: true,
        events: { where: { type: "WORN" }, select: { id: true } },
      },
    }),
  ]);

  const all = await prisma.garment.findMany({
    where: { userId: user.id, priceCents: { not: null } },
    select: {
      priceCents: true,
      events: { where: { type: "WORN" }, select: { id: true } },
    },
  });
  const cpws = all
    .map((garment) => computeCpw(garment.priceCents, garment.events.length))
    .filter((value): value is number => value !== null);
  const avgCpw =
    cpws.length === 0
      ? null
      : Math.round(
          (cpws.reduce((sum, value) => sum + value, 0) / cpws.length) * 100,
        ) / 100;

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
            marginBottom: 20,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28 }}>我的衣柜</h1>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              今天想穿哪一件？
            </p>
          </div>
          <Link href="/garments/new" className="btn btn-primary">
            拍照建档
          </Link>
        </div>

        <section className="stat-bar">
          <div className="card stat-card">
            <span className="stat-label">本月穿着次数</span>
            <strong className="stat-value">{monthWears}</strong>
            <span className="muted" style={{ fontSize: 12 }}>
              次
            </span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">在柜件数</span>
            <strong className="stat-value">{inCloset}</strong>
            <span className="muted" style={{ fontSize: 12 }}>
              件
            </span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">平均单次成本</span>
            <strong className="stat-value">{formatCny(avgCpw)}</strong>
            <span className="muted" style={{ fontSize: 12 }}>
              {avgCpw === null ? "有价格和穿着记录后显示" : "每穿一次"}
            </span>
          </div>
        </section>

        <div className="cta-row" style={{ marginTop: 18 }}>
          <Link href="/garments" className="btn">
            看衣柜
          </Link>
          <Link href="/labels" className="btn">
            打标签
          </Link>
        </div>

        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>最近入柜</h2>
          {garments.length === 0 ? (
            <div className="card empty">
              <h2 style={{ fontSize: 20 }}>衣柜还是空的</h2>
              <p className="muted">拍下第一件衣服，AI 会帮你填好属性。</p>
              <Link
                href="/garments/new"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
              >
                拍第一件
              </Link>
            </div>
          ) : (
            <div className="grid-garments">
              {garments.map((garment) => (
                <Link
                  key={garment.id}
                  href={`/garments/${garment.id}`}
                  className="card garment-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="garment-thumb"
                    src={`/api/garments/${garment.id}/photo`}
                    alt={garment.name}
                  />
                  <div className="garment-body">
                    <span className="muted" style={{ fontSize: 12 }}>
                      G{String(garment.seq).padStart(3, "0")}
                    </span>
                    <strong style={{ fontSize: 15 }}>{garment.name}</strong>
                    <span className="badge">{statusLabel(garment.status)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<Landing />}>
      <Dashboard />
    </Suspense>
  );
}
