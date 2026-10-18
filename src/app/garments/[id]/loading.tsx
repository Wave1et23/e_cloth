export default function GarmentDetailLoading() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">衣橱镜像</span>
        </div>
      </header>
      <main className="page">
        <p className="muted">正在找这件衣服…</p>
        <div className="detail-grid" style={{ marginTop: 14 }}>
          <div className="card skeleton" style={{ aspectRatio: "4 / 5" }} />
          <div style={{ display: "grid", gap: 14 }}>
            <div className="skeleton" style={{ height: 18, width: "30%" }} />
            <div className="skeleton" style={{ height: 34, width: "70%" }} />
            <div className="skeleton" style={{ height: 160 }} />
            <div className="skeleton" style={{ height: 90 }} />
          </div>
        </div>
      </main>
    </>
  );
}
