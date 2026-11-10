/** 季节多选：逻辑上是 4 个值的数组，SQLite 里存逗号分隔字符串。 */

export const SEASON_VALUES = ["春", "夏", "秋", "冬"] as const;
export type SeasonValue = (typeof SEASON_VALUES)[number];
export const SEASON_OTHER = "其他";

const SEASON_SET = new Set<string>(SEASON_VALUES);

/** 所有非空组合，按春→冬顺序；用于 AI JSON schema 的 enum。 */
export const SEASON_AI_OPTIONS: string[] = [];
for (let mask = 1; mask < 1 << SEASON_VALUES.length; mask += 1) {
  SEASON_AI_OPTIONS.push(
    SEASON_VALUES.filter((_, index) => (mask & (1 << index)) !== 0).join(","),
  );
}

function rawTokens(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") return value.split(",");
  return [];
}

/** 兼容旧值 春秋/四季；未知 token 忽略；输出按春、夏、秋、冬排序并去重。 */
export function parseSeasonValue(value: unknown): SeasonValue[] {
  const selected = new Set<string>();
  for (const token of rawTokens(value)) {
    const text = token.trim();
    if (text === "春秋") {
      selected.add("春");
      selected.add("秋");
    } else if (text === "四季") {
      for (const season of SEASON_VALUES) selected.add(season);
    } else if (SEASON_SET.has(text)) {
      selected.add(text);
    }
  }
  return SEASON_VALUES.filter((season) => selected.has(season));
}

/** 空数组 → null；输出固定顺序，便于稳定比较和迁移。 */
export function serializeSeason(value: unknown): string | null {
  const parsed = parseSeasonValue(value);
  return parsed.length > 0 ? parsed.join(",") : null;
}

/** 详情展示：未填写显示「其他」。 */
export function formatSeason(value: unknown): string {
  const parsed = parseSeasonValue(value);
  return parsed.length > 0 ? parsed.join("、") : SEASON_OTHER;
}

/** 判断衣物 season 是否命中选中的季节（多选并集；其他 = 空）。 */
export function seasonMatches(value: unknown, selected: readonly string[]): boolean {
  if (selected.length === 0) return true;
  const parsed = parseSeasonValue(value);
  if (selected.includes(SEASON_OTHER) && parsed.length === 0) return true;
  return parsed.some((season) => selected.includes(season));
}

/** 迁移纯函数：只改旧的两个枚举值，其他值原样保留。 */
export function migrateLegacySeason(
  value: string | null | undefined,
): string | null {
  if (value === "春秋") return "春,秋";
  if (value === "四季") return "春,夏,秋,冬";
  return value ?? null;
}

/** API 校验：空值、合法 token、旧别名、或它们的逗号组合才接受。 */
export function isValidSeasonInput(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  const tokens = rawTokens(value);
  if (tokens.length === 0) return Array.isArray(value);
  return tokens.every((token) => {
    const text = token.trim();
    return (
      text === "" ||
      text === "春秋" ||
      text === "四季" ||
      SEASON_SET.has(text)
    );
  });
}
