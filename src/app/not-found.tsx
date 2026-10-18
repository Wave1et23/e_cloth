import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page" style={{ maxWidth: 560, paddingTop: 80 }}>
      <section className="card empty">
        <p className="muted" style={{ letterSpacing: "0.14em", fontSize: 12 }}>
          4 0 4
        </p>
        <h1 style={{ fontSize: 24, marginTop: 6 }}>这个页面不在了</h1>
        <p className="muted">链接可能过期，或者地址写错了。</p>
        <Link
          href="/"
          className="btn btn-primary"
          style={{ marginTop: 18 }}
        >
          回首页
        </Link>
      </section>
    </main>
  );
}
