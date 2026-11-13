"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { OUTFIT_MAX_ITEMS, OUTFIT_NAME_MAX, OUTFIT_NOTES_MAX } from "@/lib/outfits";

export type OutfitGarmentOption = {
  id: string;
  name: string;
  seq: number;
  category: string;
};

export type OutfitEditorInitial = {
  id: string;
  name: string;
  notes: string | null;
  items: Array<{ garmentId: string; name: string }>;
};

type Props = {
  mode: "create" | "edit";
  garments: OutfitGarmentOption[];
  initial?: OutfitEditorInitial;
  onSaved?: () => void;
  onCancel?: () => void;
};

type OutfitResponse = {
  id: string;
  name: string;
  notes: string | null;
  items: Array<{ garmentId: string; name: string }>;
};

function code(seq: number): string {
  return `G${String(seq).padStart(3, "0")}`;
}

export function OutfitEditor({ mode, garments, initial, onSaved, onCancel }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [selected, setSelected] = useState<string[]>(
    initial?.items.map((item) => item.garmentId) ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const initialEmpty = (initial?.items.length ?? 0) === 0;
  const canRenameEmpty = mode === "edit" && initialEmpty && selected.length === 0;
  const canSave = name.trim() !== "" && (selected.length >= 1 || canRenameEmpty);

  function toggleGarment(garmentId: string) {
    if (selected.includes(garmentId)) {
      setSelected(selected.filter((id) => id !== garmentId));
      setError("");
      return;
    }
    if (selected.length >= OUTFIT_MAX_ITEMS) {
      setError(`一套搭配最多 ${OUTFIT_MAX_ITEMS} 件衣物`);
      return;
    }
    setSelected([...selected, garmentId]);
    setError("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");

    if (name.trim() === "") {
      setError("请给这套搭配起个名字");
      return;
    }
    if (selected.length < 1 && !canRenameEmpty) {
      setError("至少选择 1 件衣物");
      return;
    }

    const body: Record<string, unknown> = {
      name,
      notes,
    };
    // 空搭配只改名/备注时省略 items；其余情况必须带 1–4 件。
    if (!canRenameEmpty) body.items = selected;

    setBusy(true);
    const result = await apiFetch<OutfitResponse>(
      mode === "create" ? "/api/outfits" : `/api/outfits/${initial?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        json: body,
      },
    );
    if (!result.ok) {
      setError(result.msg);
      setBusy(false);
      return;
    }

    setBusy(false);
    if (mode === "create") {
      router.push(`/outfits/${result.data.id}`);
      router.refresh();
      return;
    }
    onSaved?.();
  }

  return (
    <form className="card" style={{ padding: 20 }} onSubmit={submit}>
      <h2 style={{ fontSize: 17, marginBottom: 14 }}>
        {mode === "create" ? "新建搭配" : "编辑搭配"}
      </h2>
      {error ? (
        <div className="form-error" style={{ marginBottom: 12 }} role="alert">
          {error}
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="outfit-name">名称 *</label>
        <input
          id="outfit-name"
          required
          maxLength={OUTFIT_NAME_MAX}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="例如：通勤黑白"
        />
      </div>

      <div className="field">
        <label htmlFor="outfit-notes">备注</label>
        <textarea
          id="outfit-notes"
          maxLength={OUTFIT_NOTES_MAX}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="例如：见客户穿，配黑色乐福鞋"
        />
        <span className="muted" style={{ fontSize: 12 }}>
          {[...notes].length}/{OUTFIT_NOTES_MAX}
        </span>
      </div>

      <div style={{ marginTop: 6, marginBottom: 8 }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          选择衣物（{selected.length}/{OUTFIT_MAX_ITEMS}）
        </label>
        {garments.length === 0 ? (
          <p className="muted" style={{ fontSize: 14 }}>
            衣柜还是空的，先去新增衣物。
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 10,
              maxHeight: 420,
              overflow: "auto",
            }}
          >
            {garments.map((garment) => {
              const checked = selected.includes(garment.id);
              return (
                <label
                  key={garment.id}
                  className="card"
                  style={{
                    padding: 8,
                    cursor: "pointer",
                    outline: checked ? "2px solid var(--accent)" : "1px solid var(--line)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleGarment(garment.id)}
                    style={{ width: 18, height: 18 }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/garments/${garment.id}/photo`}
                    alt={garment.name}
                    loading="lazy"
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 5",
                      objectFit: "cover",
                      borderRadius: 6,
                    }}
                  />
                  <span style={{ fontSize: 12 }}>{code(garment.seq)}</span>
                  <strong style={{ fontSize: 13 }}>{garment.name}</strong>
                  <span className="muted" style={{ fontSize: 11 }}>
                    {garment.category}
                  </span>
                </label>
              );
            })}
          </div>
        )}
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          一套搭配 1–4 件；第 5 件会被阻止。
        </p>
      </div>

      <div className="cta-row">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || !canSave}
        >
          {busy ? "保存中…" : mode === "create" ? "保存搭配" : "保存修改"}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={busy}
          >
            取消
          </button>
        ) : null}
      </div>
    </form>
  );
}
