"use client";

export default function GarmentsError({ reset }: { reset: () => void }) {
  return (
    <main className="page" style={{ paddingTop: 80 }}>
      <section className="card empty">
        <h2>衣柜没打开</h2>
        <p className="muted">可能是网络或数据库暂时不可用，重试一下。</p>
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
