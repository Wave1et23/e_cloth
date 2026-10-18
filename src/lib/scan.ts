/** 扫码动作的幂等判断与事件校验（纯函数，方便单测）。 */

import { isGarmentEventType, type GarmentEventType } from "./status.ts";

export const SCAN_IDEMPOTENCY_MS = 30_000;

export type LastEvent = {
  type: string;
  createdAt: Date;
} | null;

/** 同一件衣服、同一事件、30 秒内重复点击只算一次。 */
export function isDuplicateScan(
  last: LastEvent,
  type: GarmentEventType,
  now = Date.now(),
): boolean {
  if (!last) return false;
  if (last.type !== type) return false;
  return now - last.createdAt.getTime() < SCAN_IDEMPOTENCY_MS;
}

export function readScanEvent(value: unknown): GarmentEventType | null {
  return isGarmentEventType(value) ? value : null;
}
