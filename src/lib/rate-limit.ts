/** 单进程内存限流：登录失败、注册、发码与扫码动作共用。重启即清空。 */

type Entry = { count: number; resetAt: number };

export type RateLimitStatus = {
  limited: boolean;
  /** 距离窗口重置的秒数；未限流时为 0。 */
  retryAfterSeconds: number;
  /** 当前窗口剩余可用次数。 */
  remaining: number;
};

const buckets = new Map<string, Entry>();

function prune(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export function getRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitStatus {
  prune(now);
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    return { limited: false, retryAfterSeconds: 0, remaining: limit };
  }
  const remaining = Math.max(0, limit - entry.count);
  const limited = entry.count >= limit;
  return {
    limited,
    retryAfterSeconds: limited
      ? Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
      : 0,
    remaining,
  };
}

/** 返回 true 表示已超限。 */
export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  return getRateLimit(key, limit, windowMs, now).limited;
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
