import { prisma } from "@/lib/db";
import { isGarmentEventType, statusLabel } from "@/lib/status";
import { ScanSuccessClose } from "@/components/scan-success-close";

export const instant = false;

export const metadata = {
  title: "扫码记录 · 衣橱镜像",
  robots: { index: false, follow: false },
};

const RESULT_TTL_MS = 10 * 60 * 1000;

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ event?: string; ts?: string }>;
};

function Neutral() {
  return (
    <main className="scan-wrap">
      <section className="card scan-card" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 24 }}>没有可显示的结果</h1>
        <p className="muted">请重新扫描衣物上的二维码记录状态。</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: 18 }}>
          返回首页
        </a>
      </section>
    </main>
  );
}

export default async function ScanSuccessPage({ params, searchParams }: Props) {
  const { token } = await params;
  const query = await searchParams;
  const event = isGarmentEventType(query.event) ? query.event : null;
  const ts = Number(query.ts);
  const recent = Number.isFinite(ts) && Date.now() - ts <= RESULT_TTL_MS && ts <= Date.now();

  if (!event || !recent) return <Neutral />;

  const label = await prisma.label.findUnique({
    where: { token },
    select: { garment: { select: { name: true, status: true } } },
  });
  if (!label) return <Neutral />;

  return (
    <main className="scan-wrap">
      <section className="card scan-card" style={{ textAlign: "center" }}>
        <p className="muted" style={{ fontSize: 12, letterSpacing: "0.12em" }}>
          衣 橱 镜 像
        </p>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>状态记录成功！</h1>
        <p style={{ fontSize: 18, marginTop: 12 }}>{label.garment.name}</p>
        <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
          当前状态：{statusLabel(label.garment.status)}
        </p>
        <div style={{ marginTop: 24 }}>
          <ScanSuccessClose />
        </div>
      </section>
    </main>
  );
}
