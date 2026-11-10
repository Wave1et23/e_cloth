import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/http";
import { isRateLimited, recordFailure } from "@/lib/rate-limit";
import { isDuplicateScan, readScanEvent } from "@/lib/scan";
import { nextStatus } from "@/lib/status";

type Params = { params: Promise<{ token: string }> };

function back(
  request: Request,
  token: string,
  query: Record<string, string>,
): NextResponse {
  const url = new URL(`/g/${encodeURIComponent(token)}`, request.url);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url, 303);
}

function success(
  request: Request,
  token: string,
  event: string,
): NextResponse {
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    new URL(request.url).host;
  const url = new URL(
    `/g/${encodeURIComponent(token)}/done`,
    `${proto}://${host}`,
  );
  url.searchParams.set("event", event);
  url.searchParams.set("ts", String(Date.now()));
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back(request, token, { error: "form" });
  }

  const type = readScanEvent(form.get("type"));
  if (!type) return back(request, token, { error: "event" });

  const ip = getClientIp(request);
  const key = `${ip}:${token}`;
  if (isRateLimited(key, 20, 60_000)) {
    return back(request, token, { error: "rate" });
  }
  recordFailure(key, 60_000);

  const label = await prisma.label.findUnique({
    where: { token },
    select: {
      garment: { select: { id: true } },
    },
  });
  if (!label) return back(request, token, { error: "token" });

  const garmentId = label.garment.id;
  const last = await prisma.garmentEvent.findFirst({
    where: { garmentId },
    orderBy: { createdAt: "desc" },
    select: { type: true, createdAt: true },
  });

  if (isDuplicateScan(last, type)) {
    return success(request, token, type);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.garmentEvent.create({
        data: { garmentId, type },
      });
      await tx.garment.update({
        where: { id: garmentId },
        data: { status: nextStatus(type) },
      });
    });
  } catch {
    return back(request, token, { error: "write" });
  }

  return success(request, token, type);
}
