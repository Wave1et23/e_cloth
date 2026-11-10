"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { SeasonPicker } from "@/components/season-picker";
import { serializeSeason } from "@/lib/season";
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  FIT_OPTIONS,
  PATTERN_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/garment-fields";

export type EditableGarment = {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
  pattern: string;
  fit: string;
  season: string[];
  style: string;
  material: string;
  price: string;
  purchaseDate: string;
  notes: string;
};

const SELECT_FIELDS = [
  ["category", "类别", CATEGORY_OPTIONS, true],
  ["primaryColor", "颜色", COLOR_OPTIONS, false],
  ["pattern", "图案", PATTERN_OPTIONS, false],
  ["fit", "版型", FIT_OPTIONS, false],
  ["style", "风格", STYLE_OPTIONS, false],
] as const;

export function GarmentActions({ garment }: { garment: EditableGarment }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(garment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const result = await apiFetch<{ id: string }>(
      `/api/garments/${garment.id}`,
      {
        method: "PATCH",
        json: {
          name: form.name,
          category: form.category,
          primaryColor: form.primaryColor,
          pattern: form.pattern,
          fit: form.fit,
          season: serializeSeason(form.season) ?? "",
          style: form.style,
          material: form.material,
          price: form.price,
          purchaseDate: form.purchaseDate,
          notes: form.notes,
        },
      },
    );
    if (!result.ok) {
      setError(result.msg);
      setBusy(false);
      return;
    }
    setEditing(false);
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (busy) return;
    if (
      !window.confirm(
        "删除后，这件衣服的记录和标签都会消失，确定吗？",
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    const result = await apiFetch<{ deleted: boolean }>(
      `/api/garments/${garment.id}`,
      { method: "DELETE" },
    );
    if (!result.ok) {
      setError(result.msg);
      setBusy(false);
      return;
    }
    router.push("/garments");
    router.refresh();
  }

  if (!editing) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {error ? (
          <div className="form-error" role="alert">
            {error}
          </div>
        ) : null}
        <div className="cta-row">
          <button
            type="button"
            className="btn"
            onClick={() => setEditing(true)}
            disabled={busy}
          >
            编辑
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
      </div>
    );
  }

  return (
    <form className="card" style={{ padding: 20 }} onSubmit={save}>
      <h2 style={{ fontSize: 17, marginBottom: 14 }}>编辑衣物</h2>
      {error ? <div className="form-error" style={{ marginBottom: 12 }}>{error}</div> : null}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="edit-name">名称 *</label>
          <input
            id="edit-name"
            required
            maxLength={40}
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
          />
        </div>
        {SELECT_FIELDS.map(([field, label, options, required]) => (
          <div className="field" key={field}>
            <label htmlFor={`edit-${field}`}>{label}{required ? " *" : ""}</label>
            <select
              id={`edit-${field}`}
              required={required}
              value={form[field]}
              onChange={(event) =>
                setForm({ ...form, [field]: event.target.value })
              }
            >
              <option value="">未选择</option>
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="field">
          <label>季节（可多选）</label>
          <SeasonPicker
            value={form.season}
            onChange={(season) => setForm({ ...form, season })}
          />
        </div>
        <div className="field">
          <label htmlFor="edit-material">材质</label>
          <input
            id="edit-material"
            maxLength={40}
            value={form.material}
            onChange={(event) =>
              setForm({ ...form, material: event.target.value })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="edit-price">价格（元）</label>
          <input
            id="edit-price"
            inputMode="decimal"
            value={form.price}
            onChange={(event) =>
              setForm({ ...form, price: event.target.value })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="edit-date">购买日期</label>
          <input
            id="edit-date"
            type="date"
            value={form.purchaseDate}
            onChange={(event) =>
              setForm({ ...form, purchaseDate: event.target.value })
            }
          />
        </div>
        <div className="field span-2">
          <label htmlFor="edit-notes">备注</label>
          <textarea
            id="edit-notes"
            maxLength={300}
            value={form.notes}
            onChange={(event) =>
              setForm({ ...form, notes: event.target.value })
            }
          />
        </div>
      </div>
      <div className="cta-row" style={{ marginTop: 16 }}>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setForm(garment);
            setEditing(false);
            setError("");
          }}
          disabled={busy}
        >
          取消
        </button>
      </div>
    </form>
  );
}
