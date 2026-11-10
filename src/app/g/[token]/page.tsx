import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import {
  EVENT_VALUES,
  eventLabel,
  statusLabel,
} from "@/lib/status";

export const instant = false;

export const metadata: Metadata = {
  title: "衣橱镜像 · 记录这件衣服",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

const ERROR_TEXT: Record<string, string> = {
  rate: "点得有点快，等一分钟再试",
  token: "这个标签失效了",
  event: "这个动作不认识，请重试",
  write: "没记录成功，再试一次",
  form: "请求没发出去，再试一次",
};

export default async function ScanPage({ params, searchParams }: Props) {
  const { token } = await params;
  const query = await searchParams;

  const label = await prisma.label.findUnique({
    where: { token },
    select: {
      garment: {
        select: { id: true, name: true, status: true },
      },
    },
  });

  if (!label) {
    return (
      <main className="scan-wrap">
        <section className="card scan-card" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24 }}>这个标签失效了</h1>
          <p className="muted">可能衣服已经被删除，或者二维码印错了。</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: 18 }}>
            回衣橱镜像首页
          </Link>
        </section>
      </main>
    );
  }

  const garment = label.garment;
  const error = query.error ? ERROR_TEXT[query.error] ?? "没记录成功，再试一次" : "";

  return (
    <main className="scan-wrap">
      <section className="card scan-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="scan-photo"
          src={`/api/g/${token}/photo`}
          alt={garment.name}
        />
        <div style={{ marginTop: 14 }}>
          <p className="muted" style={{ fontSize: 12, letterSpacing: "0.12em" }}>
            衣 橱 镜 像
          </p>
          <h1 style={{ fontSize: 26, marginTop: 4 }}>{garment.name}</h1>
          <span className="badge" style={{ marginTop: 8 }}>
            当前：{statusLabel(garment.status)}
          </span>
        </div>

        {error ? (
          <div className="banner banner-warn" style={{ marginTop: 14 }} role="alert">
            {error}
          </div>
        ) : null}

        <div className="scan-actions">
          {EVENT_VALUES.map((event) => (
            <form
              key={event}
              method="post"
              action={`/api/g/${token}/action`}
            >
              <input type="hidden" name="type" value={event} />
              <button type="submit" className="btn scan-btn">
                {eventLabel(event)}
              </button>
            </form>
          ))}
        </div>

        <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
          点一下就会记下这次动作，不需要登录。
        </p>
      </section>
      <p className="muted" style={{ fontSize: 12, textAlign: "center" }}>
        <Link href="/">衣橱镜像</Link>
      </p>
    </main>
  );
}
