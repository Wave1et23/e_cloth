import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <section style={{ padding: "48px 0 32px", maxWidth: 720 }}>
          <p
            className="muted"
            style={{ letterSpacing: "0.18em", fontSize: 13 }}
          >
            衣 橱 镜 像
          </p>
          <h1
            style={{
              fontSize: "clamp(34px, 6vw, 54px)",
              lineHeight: 1.2,
              marginTop: 12,
            }}
          >
            给现实衣柜，
            <br />
            建一份数字档案
          </h1>
          <p
            className="muted"
            style={{ fontSize: 17, marginTop: 18, maxWidth: 560 }}
          >
            拍一件衣服，AI 自动填好类别、颜色、图案、季节；
            打印一张二维码贴到衣架上，手机相机扫一下，就能记下今天穿了什么。
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <Link href="/register" className="btn btn-primary">
              免费开始
            </Link>
            <Link href="/login" className="btn btn-ghost">
              我已注册
            </Link>
          </div>
        </section>

        <section
          className="card"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 24,
            padding: "28px 24px",
            marginTop: 24,
          }}
        >
          {[
            ["01", "拍照建档", "AI 先给建议，你来确认，3 秒录入一件。"],
            ["02", "打印标签", "A4 一页 24 张，剪下来贴到衣架。"],
            ["03", "扫码记录", "手机相机扫一下，点「今天穿了」。"],
          ].map(([step, title, body]) => (
            <div key={step}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--gold)",
                  fontSize: 13,
                  letterSpacing: "0.12em",
                }}
              >
                {step}
              </div>
              <h2 style={{ fontSize: 18, marginTop: 6 }}>{title}</h2>
              <p
                className="muted"
                style={{ fontSize: 14, marginTop: 4 }}
              >
                {body}
              </p>
            </div>
          ))}
        </section>

        <p className="muted" style={{ fontSize: 13, marginTop: 20 }}>
          不需要下载 App，手机系统相机直接扫。
        </p>
      </main>
    </>
  );
}
