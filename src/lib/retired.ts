/** 已退出衣物的保留期：从 retiredAt 起保留 72 小时。 */

export const RETIRED_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

export function retiredCutoff(now = Date.now()): Date {
  return new Date(now - RETIRED_RETENTION_MS);
}

export function isRetiredExpired(
  retiredAt: Date | null | undefined,
  now = Date.now(),
): boolean {
  return Boolean(retiredAt && retiredAt.getTime() <= now - RETIRED_RETENTION_MS);
}
