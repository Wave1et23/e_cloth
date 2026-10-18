"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="page" style={{ maxWidth: 560, paddingTop: 80 }}>
      <section className="card empty">
        <h1 style={{ fontSize: 24 }}>页面出了点问题</h1>
        <p className="muted">不是你的操作问题，重试一下通常就好。</p>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 18 }}
          onClick={reset}
        >
          重试
        </button>
      </section>
    </main>
  );
}
