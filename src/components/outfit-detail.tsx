"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/client-api";
import {
  OutfitEditor,
  type OutfitEditorInitial,
  type OutfitGarmentOption,
} from "@/components/outfit-editor";

type Props = {
  outfit: OutfitEditorInitial;
  garments: OutfitGarmentOption[];
};

export function OutfitDetail({ outfit, garments }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (busy) return;
    if (!window.confirm("删除后，这套搭配会消失，确定吗？")) return;
    setBusy(true);
    setError("");
    const result = await apiFetch<{ deleted: boolean }>(
      `/api/outfits/${outfit.id}`,
      { method: "DELETE" },
    );
    if (!result.ok) {
      setError(result.msg);
      setBusy(false);
      return;
    }
    router.push("/outfits");
    router.refresh();
  }

  if (editing) {
    return (
      <OutfitEditor
        mode="edit"
        garments={garments}
        initial={outfit}
        onSaved={() => {
          setEditing(false);
          router.refresh();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <section className="card" style={{ padding: 20 }}>
      {error ? (
        <div className="form-error" style={{ marginBottom: 12 }} role="alert">
          {error}
        </div>
      ) : null}
      <h1 style={{ fontSize: 26 }}>{outfit.name}</h1>
      {outfit.notes ? (
        <p className="muted" style={{ fontSize: 14, marginTop: 8, whiteSpace: "pre-wrap" }}>
          {outfit.notes}
        </p>
      ) : null}

      <div style={{ marginTop: 18 }}>
        {outfit.items.length === 0 ? (
          <div className="banner banner-warn" role="status">
            这套搭配已空，请添加衣物或删除这套搭配。
          </div>
        ) : (
          <div className="grid-garments">
            {outfit.items.map((item) => (
              <div key={item.garmentId} className="card garment-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="garment-thumb"
                  src={`/api/garments/${item.garmentId}/photo`}
                  alt={item.name}
                  loading="lazy"
                />
                <div className="garment-body">
                  <strong style={{ fontSize: 14 }}>{item.name}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cta-row" style={{ marginTop: 18 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setEditing(true)}
          disabled={busy}
        >
          {outfit.items.length === 0 ? "补充衣物" : "编辑"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ color: "var(--danger)" }}
          onClick={remove}
          disabled={busy}
        >
          {busy ? "删除中…" : "删除"}
        </button>
      </div>
    </section>
  );
}
