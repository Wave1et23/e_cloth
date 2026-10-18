/** 衣物字段的共享取值：前端下拉、AI schema、后端校验共用。 */

export const CATEGORY_OPTIONS = [
  "上衣",
  "裤装",
  "裙装",
  "连衣裙",
  "外套",
  "马甲",
  "套装",
  "其他",
] as const;

export const COLOR_OPTIONS = [
  "黑",
  "白",
  "灰",
  "米",
  "棕",
  "蓝",
  "绿",
  "红",
  "粉",
  "紫",
  "黄",
  "橙",
  "多色",
] as const;

export const PATTERN_OPTIONS = [
  "纯色",
  "条纹",
  "格纹",
  "印花",
  "波点",
  "几何",
  "其他",
] as const;

export const FIT_OPTIONS = ["修身", "常规", "宽松", "oversize"] as const;

export const SEASON_OPTIONS = ["春", "夏", "秋", "冬", "春秋", "四季"] as const;

export const STYLE_OPTIONS = [
  "通勤",
  "休闲",
  "运动",
  "复古",
  "甜酷",
  "家居",
  "其他",
] as const;

export const AI_FIELDS = [
  "category",
  "primaryColor",
  "pattern",
  "fit",
  "season",
  "style",
] as const;

export type AiField = (typeof AI_FIELDS)[number];
export type GarmentCategory = (typeof CATEGORY_OPTIONS)[number];

export const FIELD_OPTIONS: Record<AiField, readonly string[]> = {
  category: CATEGORY_OPTIONS,
  primaryColor: COLOR_OPTIONS,
  pattern: PATTERN_OPTIONS,
  fit: FIT_OPTIONS,
  season: SEASON_OPTIONS,
  style: STYLE_OPTIONS,
};

export function isAllowedValue(
  field: AiField,
  value: unknown,
): value is string {
  return typeof value === "string" && FIELD_OPTIONS[field].includes(value);
}
