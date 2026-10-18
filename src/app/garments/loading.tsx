export default function GarmentsLoading() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">衣橱镜像</span>
        </div>
      </header>
      <main className="page">
        <div className="skeleton" style={{ width: 160, height: 32 }} />
        <p className="muted" style={{ marginTop: 12 }}>
          正在整理衣柜…
        </p>
        <div className="grid-garments" style={{ marginTop: 22 }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="card garment-card">
              <div className="skeleton" style={{ aspectRatio: "4 / 5" }} />
              <div className="garment-body">
                <div className="skeleton" style={{ height: 18, width: "70%" }} />
                <div className="skeleton" style={{ height: 14, width: "40%" }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
