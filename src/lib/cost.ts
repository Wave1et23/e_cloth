/** 单件衣物的单次穿着成本（CPW）。 */

/**
 * CPW = 价格 ÷ 穿着次数。
 * 缺少价格或还没穿过时返回 null，界面显示“数据不足”，而不是 0 或 ∞。
 * 返回元，保留到分。
 */
export function computeCpw(
  priceCents: number | null | undefined,
  wornCount: number | null | undefined,
): number | null {
  if (typeof priceCents !== "number" || !Number.isFinite(priceCents)) return null;
  if (typeof wornCount !== "number" || !Number.isFinite(wornCount)) return null;
  if (priceCents <= 0 || wornCount <= 0) return null;
  return Math.round(priceCents / wornCount) / 100;
}

/** 金额展示：整数不带小数，其余保留两位。 */
export function formatCny(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "数据不足";
  return `¥${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}`;
}

/** 价格输入（元，字符串）→ 分；非法或空返回 null。 */
export function parsePriceToCents(input: unknown): number | null {
  if (typeof input !== "string" && typeof input !== "number") return null;
  const text = String(input).trim();
  if (text === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const yuan = Number(text);
  if (!Number.isFinite(yuan) || yuan < 0) return null;
  return Math.round(yuan * 100);
}
