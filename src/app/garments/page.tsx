import Link from "next/link";
import { redirect } from "next/navigation";
import { GarmentCategoryFilter } from "@/components/garment-category-filter";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/user";
import { computeCpw, formatCny } from "@/lib/cost";
import { prisma } from "@/lib/db";
import { CATEGORY_OPTIONS } from "@/lib/garment-fields";
import {
  filterByCategories,
  parseCategoryParams,
  resolveCategoryFilter,
} from "@/lib/garment-filter";
import { sortGarmentsByWorn } from "@/lib/garment-sort";
import { normalizeStatus, statusLabel } from "@/lib/status";

export const instant = false;

type Props = {
  searchParams: Promise<{ category?: string | string[] }>;
};

function badgeClass(status: string): string {
  const value = normalizeStatus(status);
  if (value === "WORN") return "badge badge-worn";
  if (value === "TO_WASH") return "badge badge-wash";
  if (value === "RETIRED") return "badge badge-retired";
  return "badge";
}

export default async function GarmentsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [garments, params] = await Promise.all([
    prisma.garment.findMany({
      where: { userId: user.id },
      orderBy: { seq: "desc" },
      take: 200,
      select: {
        id: true,
        seq: true,
        name: true,
        category: true,
        status: true,
        priceCents: true,
        events: {
          where: { type: "WORN" },
          select: { id: true },
        },
      },
    }),
    searchParams,
  ]);

  const { categories, selected } = resolveCategoryFilter(
    garments,
    CATEGORY_OPTIONS,
    parseCategoryParams(params.category),
  );
  const filtered = filterByCategories(garments, selected);
  const sorted = sortGarmentsByWorn(filtered);

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
            <h1 style={{ fontSize: 28 }}>我的衣柜</h1>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              共 {filtered.length} 件
            </p>
          </div>
          <Link href="/garments/new" className="btn btn-primary">
            新增
          </Link>
        </div>

        {garments.length > 0 ? (
          <GarmentCategoryFilter categories={categories} selected={selected} />
        ) : null}

        {garments.length === 0 ? (
          <section className="card empty">
            <h2>衣柜还是空的</h2>
            <p className="muted" style={{ fontSize: 15 }}>
              拍下第一件衣服，AI 会帮你填好属性，你只需要确认。
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                marginTop: 20,
              }}
            >
              <Link href="/garments/new" className="btn btn-primary">
                拍照建档
              </Link>
            </div>
          </section>
        ) : filtered.length === 0 ? (
          <section className="card empty">
            <h2>这个分类下还没有衣物</h2>
            <p className="muted" style={{ fontSize: 15 }}>
              {selected.join("、")} 暂时是空的，换个分类看看。
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                marginTop: 20,
              }}
            >
              <Link href="/garments" className="btn btn-primary">
                查看全部
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid-garments">
            {sorted.map((garment) => {
              const wornCount = garment.events.length;
              const cpw = computeCpw(garment.priceCents, wornCount);
              return (
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
                    loading="lazy"
                  />
                  <div className="garment-body">
                    <span className="muted" style={{ fontSize: 12 }}>
                      G{String(garment.seq).padStart(3, "0")} · {garment.category}
                    </span>
                    <strong style={{ fontSize: 15 }}>{garment.name}</strong>
                    <span className={badgeClass(garment.status)}>
                      {statusLabel(garment.status)}
                    </span>
                    <span className="muted" style={{ fontSize: 13 }}>
                      单次 {formatCny(cpw)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
