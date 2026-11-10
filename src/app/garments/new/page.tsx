"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { GarmentSuggestion } from "@/lib/ai/schema";
import { apiFetch } from "@/lib/client-api";
import { SiteHeader } from "@/components/site-header";
import { SeasonPicker } from "@/components/season-picker";
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  FIT_OPTIONS,
  PATTERN_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/garment-fields";
import { parseSeasonValue, serializeSeason } from "@/lib/season";

const MAX_BYTES = 10 * 1024 * 1024;
const LOW_CONFIDENCE = 0.7;

type FormState = {
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

const EMPTY_FORM: FormState = {
  name: "",
  category: "",
  primaryColor: "",
  pattern: "",
  fit: "",
  season: [],
  style: "",
  material: "",
  price: "",
  purchaseDate: "",
  notes: "",
};

type AiResponse = {
  imageToken: string;
  ai:
    | { ok: true; suggestion: GarmentSuggestion }
    | { ok: false; code: string; msg: string }
    | null;
};

type Created = { id: string; code: string };

export default function NewGarmentPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [imageToken, setImageToken] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [lowFields, setLowFields] = useState<Set<string>>(new Set());
  const [aiState, setAiState] = useState<
    "idle" | "loading" | "done" | "error" | "skipped"
  >("idle");
  const [aiMsg, setAiMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Created | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function resetAll() {
    setFile(null);
    setPreview("");
    setImageToken("");
    setForm(EMPTY_FORM);
    setLowFields(new Set());
    setAiState("idle");
    setAiMsg("");
    setError("");
    setCreated(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (!picked) return;
    if (
      !["image/jpeg", "image/png"].includes(picked.type) ||
      picked.size > MAX_BYTES
    ) {
      setError("只支持 JPG/PNG，且不超过 10MB");
      event.target.value = "";
      return;
    }
    setError("");
    setFile(picked);
    setImageToken("");
    setAiState("idle");
    setAiMsg("");
    setLowFields(new Set());
    setCreated(null);
  }

  function applySuggestion(suggestion: GarmentSuggestion) {
    const low = new Set<string>();
    const next: Partial<FormState> = {};

    for (const field of [
      "category",
      "primaryColor",
      "pattern",
      "fit",
      "style",
    ] as const) {
      const value = suggestion[field];
      const confidence = suggestion.confidence[field];
      if (confidence < LOW_CONFIDENCE) low.add(field);
      if (value && confidence >= LOW_CONFIDENCE) next[field] = value;
    }

    if (suggestion.confidence.season < LOW_CONFIDENCE) {
      low.add("season");
    } else if (suggestion.season) {
      next.season = parseSeasonValue(suggestion.season);
    }

    if (suggestion.material) {
      next.material = suggestion.material;
      if (suggestion.confidence.material < LOW_CONFIDENCE) low.add("material");
    }
    if (suggestion.confidence.material < LOW_CONFIDENCE) low.add("material");

    setForm((current) => ({ ...current, ...next }));
    setLowFields(low);
  }

  async function upload(skipAi: boolean) {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    setAiState(skipAi ? "skipped" : "loading");
    setAiMsg("");

    const data = new FormData();
    data.append("image", file);
    if (skipAi) data.append("skipAi", "1");

    const result = await apiFetch<AiResponse>("/api/ai/garment", {
      method: "POST",
      body: data,
    });

    if (!result.ok) {
      setAiState("error");
      setAiMsg(result.msg);
      setUploading(false);
      if (result.code === "UNAUTHORIZED") router.push("/login");
      return;
    }

    setImageToken(result.data.imageToken);
    if (result.data.ai === null) {
      setAiState("skipped");
      setUploading(false);
      return;
    }
    if (result.data.ai.ok) {
      applySuggestion(result.data.ai.suggestion);
      setAiState("done");
    } else {
      setAiState("error");
      setAiMsg(result.data.ai.msg);
    }
    setUploading(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");

    if (!imageToken) {
      setError("照片还没上传成功，先点「让 AI 看看」或「手动填写」");
      return;
    }
    if (!form.name.trim() || !form.category) {
      setError("名称和类别必须填");
      return;
    }

    setBusy(true);
    const result = await apiFetch<Created>("/api/garments", {
      method: "POST",
      json: {
        ...form,
        season: serializeSeason(form.season) ?? "",
        price: form.price,
        purchaseDate: form.purchaseDate,
        imageToken,
      },
    });

    if (result.ok) {
      setCreated(result.data);
      setBusy(false);
      return;
    }
    if (result.code === "UNAUTHORIZED") {
      router.push("/login");
      return;
    }
    setError(result.msg);
    setBusy(false);
  }

  if (created) {
    return (
      <>
        <SiteHeader showLogout />
        <main className="page" style={{ maxWidth: 640 }}>
          <section className="card empty">
            <p className="muted" style={{ letterSpacing: "0.12em", fontSize: 13 }}>
              已 入 柜
            </p>
            <h1 style={{ fontSize: 34, marginTop: 6 }}>{created.code}</h1>
            <p className="muted">这件衣服已经进衣柜，标签也生成好了。</p>
            <div className="cta-row" style={{ justifyContent: "center", marginTop: 20 }}>
              <Link href={`/garments/${created.id}`} className="btn btn-primary">
                看看这件
              </Link>
              <button type="button" className="btn" onClick={resetAll}>
                接着拍
              </button>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader showLogout />
      <main className="page" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28 }}>新增衣物</h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          照片 → AI 建议 → 你确认。AI 只给建议，不会直接写库。
        </p>
        <div className="steps-row" style={{ marginTop: 10 }}>
          <span>① 选照片</span>
          <span>→</span>
          <span>② 让 AI 看看</span>
          <span>→</span>
          <span>③ 确认入柜</span>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 17, marginBottom: 12 }}>照片</h2>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={pickFile}
            style={{ display: "none" }}
            id="photo"
          />
          {preview ? (
            <div style={{ display: "grid", gap: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="衣物预览" className="upload-preview" />
              <div className="cta-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => upload(false)}
                  disabled={uploading}
                >
                  {uploading ? "AI 正在看…" : "让 AI 看看"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => upload(true)}
                  disabled={uploading}
                >
                  手动填写
                </button>
                <label htmlFor="photo" className="link-button">
                  换一张
                </label>
              </div>
            </div>
          ) : (
            <label htmlFor="photo" className="upload-box" style={{ cursor: "pointer" }}>
              <span style={{ fontSize: 28 }}>＋</span>
              <span>点这里选择照片，或直接用手机拍</span>
              <span className="muted" style={{ fontSize: 12 }}>
                JPG / PNG，最大 10MB
              </span>
            </label>
          )}
        </section>

        {error ? (
          <div className="form-error" role="alert">
            {error}
          </div>
        ) : null}

        {aiState === "loading" ? (
          <div className="banner" role="status">
            AI 正在看这张照片…（最长 20 秒）
          </div>
        ) : null}
        {aiState === "done" ? (
          <div className="banner banner-ok" role="status">
            AI 已填好。标黄的字段表示它不太确定，请你确认或自己选。
          </div>
        ) : null}
        {aiState === "error" ? (
          <div className="banner banner-warn" role="alert">
            {aiMsg || "AI 没识别成功，不影响建档，手动填完就行"}
          </div>
        ) : null}
        {aiState === "skipped" ? (
          <div className="banner" role="status">
            已跳过 AI，直接手动填写。
          </div>
        ) : null}

        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>确认信息</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">名称 *</label>
              <input
                id="name"
                required
                maxLength={40}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="例如：灰色圆领卫衣"
              />
            </div>

            <div className={`field ${lowFields.has("category") ? "field-warn" : ""}`}>
              <label htmlFor="category">类别 *</label>
              <select
                id="category"
                required
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                <option value="">请选择</option>
                {CATEGORY_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              {lowFields.has("category") ? (
                <span className="field-hint">AI 不太确定，请自己选</span>
              ) : null}
            </div>

            {(
              [
                ["primaryColor", "颜色", COLOR_OPTIONS],
                ["pattern", "图案", PATTERN_OPTIONS],
                ["fit", "版型", FIT_OPTIONS],
                ["style", "风格", STYLE_OPTIONS],
              ] as const
            ).map(([field, label, options]) => (
              <div
                key={field}
                className={`field ${lowFields.has(field) ? "field-warn" : ""}`}
              >
                <label htmlFor={field}>{label}</label>
                <select
                  id={field}
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
                {lowFields.has(field) ? (
                  <span className="field-hint">AI 不太确定，请自己选</span>
                ) : null}
              </div>
            ))}

            <div className={`field ${lowFields.has("season") ? "field-warn" : ""}`}>
              <label>季节（可多选）</label>
              <SeasonPicker
                value={form.season}
                onChange={(season) => setForm({ ...form, season })}
              />
              {lowFields.has("season") ? (
                <span className="field-hint">AI 不太确定，请自己选</span>
              ) : null}
            </div>

            <div className={`field ${lowFields.has("material") ? "field-warn" : ""}`}>
              <label htmlFor="material">材质（AI 仅建议）</label>
              <input
                id="material"
                maxLength={40}
                value={form.material}
                onChange={(event) =>
                  setForm({ ...form, material: event.target.value })
                }
                placeholder="不知道可以留空"
              />
            </div>

            <div className="field">
              <label htmlFor="brand">品牌</label>
              <input id="brand" value="不确定" disabled />
            </div>

            <div className="field">
              <label htmlFor="price">价格（元）</label>
              <input
                id="price"
                inputMode="decimal"
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: event.target.value })
                }
                placeholder="可以不填"
              />
            </div>

            <div className="field">
              <label htmlFor="purchaseDate">购买日期</label>
              <input
                id="purchaseDate"
                type="date"
                value={form.purchaseDate}
                onChange={(event) =>
                  setForm({ ...form, purchaseDate: event.target.value })
                }
              />
            </div>

            <div className="field span-2">
              <label htmlFor="notes">备注</label>
              <textarea
                id="notes"
                maxLength={300}
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                placeholder="例如：去年双十一买的，配黑色长裤"
              />
            </div>
          </div>
        </section>

        <div className="cta-row">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "正在入柜…" : "确认入柜"}
          </button>
          <Link href="/garments" className="btn btn-ghost">
            取消
          </Link>
        </div>
      </form>
      </main>
    </>
  );
}
