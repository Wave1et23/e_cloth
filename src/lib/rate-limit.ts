/** 单进程内存限流：登录失败与扫码动作共用。重启即清空，够 MVP 用。 */

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

function prune(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

/** 返回 true 表示已超限。 */
export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  prune(now);
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) return false;
  return entry.count >= limit;
}

export function recordFailure(
  key: string,
  windowMs: number,
  now = Date.now(),
): void {
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
}

export function resetFailures(key: string): void {
  buckets.delete(key);
}
