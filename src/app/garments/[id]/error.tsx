"use client";

import Link from "next/link";

export default function GarmentDetailError({ reset }: { reset: () => void }) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            衣橱镜像
          </Link>
          <Link href="/garments" className="muted" style={{ fontSize: 14 }}>
            回衣柜
          </Link>
        </div>
      </header>
      <main className="page" style={{ maxWidth: 560 }}>
        <section className="card empty">
          <h2>这件衣服没加载出来</h2>
          <p className="muted">可能是网络或数据库暂时不可用，重试一下。</p>
          <div className="cta-row" style={{ justifyContent: "center", marginTop: 18 }}>
            <button type="button" className="btn btn-primary" onClick={reset}>
              重试
            </button>
            <Link href="/garments" className="btn btn-ghost">
              回衣柜
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
