"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { apiFetch } from "@/lib/client-api";
import { statusLabel } from "@/lib/status";

type GarmentRow = {
  id: string;
  seq: number;
  code: string;
  name: string;
  status: string;
};

type LabelItem = {
  id: string;
  name: string;
  code: string;
  token: string;
};

type LabelsResponse = {
  baseUrl: string;
  items: LabelItem[];
};

const MAX = 24;

export default function LabelsPage() {
  const router = useRouter();
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ garments: GarmentRow[] }>("/api/garments").then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        if (result.code === "UNAUTHORIZED") router.push("/login");
        setError(result.msg);
        setLoading(false);
        return;
      }
      const rows = result.data.garments;
      setGarments(rows);

      const requested = new URLSearchParams(window.location.search)
        .get("ids")
        ?.split(",")
        .filter(Boolean);
      const inCloset = rows.filter((row) => row.status === "IN_CLOSET");
      const pool =
        requested && requested.length > 0
          ? rows.filter((row) => requested.includes(row.id))
          : inCloset;
      setSelected(new Set(pool.slice(0, MAX).map((row) => row.id)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  function toggle(id: string) {
    setError("");
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX) {
          setError("一页最多 24 张，先取消几件");
          return current;
        }
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setError("");
    const inCloset = garments
      .filter((row) => row.status === "IN_CLOSET")
      .slice(0, MAX)
      .map((row) => row.id);
    setSelected(new Set(inCloset));
  }

  async function generate() {
    if (busy) return;
    if (selected.size === 0) {
      setError("先选至少一件衣服");
      return;
    }
    setBusy(true);
    setError("");
    setPreview("");

    const ids = [...selected].slice(0, MAX);
    const result = await apiFetch<LabelsResponse>(
      `/api/labels?ids=${ids.join(",")}`,
    );
    if (!result.ok) {
      if (result.code === "UNAUTHORIZED") router.push("/login");
      setError(result.msg);
      setBusy(false);
      return;
    }

    try {
      const { renderLabelsToDataUrl, downloadDataUrl } = await import(
        "@/lib/label/render"
      );
      const dataUrl = await renderLabelsToDataUrl(
        result.data.items,
        result.data.baseUrl,
      );
      setPreview(dataUrl);
      setBaseUrl(result.data.baseUrl);
      downloadDataUrl(dataUrl);
    } catch {
      setError("标签没生成出来，重试一下");
    }
    setBusy(false);
  }

  return (
    <>
      <SiteHeader showLogout />
      <main className="page" style={{ maxWidth: 820 }}>
        <h1 style={{ fontSize: 28 }}>打印标签</h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          A4 一页 24 张，选好后生成 2480×3508 PNG。打印时请选「实际大小 /
          缩放 100%」，不要选「适应页面」。
        </p>

        <div
          className="card"
          style={{ padding: 16, marginTop: 18, display: "grid", gap: 12 }}
        >
          <div className="cta-row" style={{ justifyContent: "space-between" }}>
            <div className="muted" style={{ fontSize: 13 }}>
              已选 <strong>{selected.size}</strong> / {MAX} 件
            </div>
            <div className="cta-row">
              <button type="button" className="link-button" onClick={selectAll}>
                全选在柜
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => setSelected(new Set())}
              >
                清空
              </button>
            </div>
          </div>

          {error ? (
            <div className="form-error" role="alert">
              {error}
            </div>
          ) : null}

          {loading ? (
            <p className="muted">正在准备标签…</p>
          ) : garments.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 20 }}>还没有可以打标签的衣服</h2>
              <p className="muted">先去拍一件衣服吧。</p>
              <Link
                href="/garments/new"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
              >
                去拍照建档
              </Link>
            </div>
          ) : (
            <div className="label-list">
              {garments.map((garment) => (
                <label key={garment.id} className="label-row">
                  <input
                    type="checkbox"
                    checked={selected.has(garment.id)}
                    onChange={() => toggle(garment.id)}
                  />
                  <span style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14 }}>{garment.name}</strong>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {" "}
                      {garment.code} · {statusLabel(garment.status)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="cta-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={generate}
              disabled={busy || loading || selected.size === 0}
            >
              {busy ? "正在生成…" : "生成并下载 PNG"}
            </button>
            {baseUrl ? (
              <span className="muted" style={{ fontSize: 12 }}>
                二维码域名：{baseUrl}
              </span>
            ) : null}
          </div>
        </div>

        {preview ? (
          <section className="card" style={{ padding: 16, marginTop: 18 }}>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>预览（A4 整页）</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="label-preview" src={preview} alt="A4 标签预览" />
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              右下角有 100mm 校验尺，打印后量一下，确认没有被缩放。
            </p>
          </section>
        ) : null}
      </main>
    </>
  );
}
