"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import {
  EVENT_VALUES,
  eventLabel,
  statusLabel,
  type GarmentEventType,
} from "@/lib/status";

type Props = {
  garmentId: string;
  initialStatus: string;
};

type EventResult = {
  status: string;
  duplicate: boolean;
};

export function GarmentStatusActions({ garmentId, initialStatus }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  async function submit(type: GarmentEventType) {
    if (busy) return;
    setBusy(true);
    setError("");
    setFeedback("");

    const result = await apiFetch<EventResult>(
      `/api/garments/${garmentId}/events`,
      { method: "POST", json: { type } },
    );

    if (!result.ok) {
      setError(result.msg);
      setBusy(false);
      return;
    }

    setStatus(result.data.status);
    setFeedback(
      result.data.duplicate
        ? "已记录 ✓（刚刚记过）"
        : `已记录 ✓ 当前状态：${statusLabel(result.data.status)}`,
    );
    setBusy(false);
    router.refresh();
  }

  const panelId = `status-actions-${garmentId}`;

  return (
    <section className="card" style={{ padding: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ fontSize: 16 }}>状态记录</h2>
        <span className="badge">当前：{statusLabel(status)}</span>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
        电脑端补记：衣服已经送去洗了、忘记扫码，都可以在这里记一下。
      </p>

      <button
        type="button"
        className="btn"
        style={{ marginTop: 10 }}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        {open ? "收起" : "修改状态"}
      </button>

      {open ? (
        <div
          id={panelId}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
            marginTop: 12,
          }}
        >
          {EVENT_VALUES.map((event) => (
            <button
              key={event}
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => submit(event)}
            >
              {eventLabel(event)}
            </button>
          ))}
        </div>
      ) : null}

      {feedback ? (
        <div className="banner banner-ok" style={{ marginTop: 12 }} role="status">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="form-error" style={{ marginTop: 12 }} role="alert">
          {error}
        </div>
      ) : null}
    </section>
  );
}
