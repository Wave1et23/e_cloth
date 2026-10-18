import { parsePriceToCents } from "@/lib/cost";
import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  FIT_OPTIONS,
  PATTERN_OPTIONS,
  SEASON_OPTIONS,
  STYLE_OPTIONS,
  type AiField,
} from "@/lib/garment-fields";
import { readText } from "@/lib/validation";

export type GarmentWritable = {
  name?: string;
  category?: string;
  primaryColor?: string | null;
  pattern?: string | null;
  fit?: string | null;
  season?: string | null;
  style?: string | null;
  material?: string | null;
  priceCents?: number | null;
  purchaseDate?: Date | null;
  notes?: string | null;
};

const OPTIONS: Record<AiField, readonly string[]> = {
  category: CATEGORY_OPTIONS,
  primaryColor: COLOR_OPTIONS,
  pattern: PATTERN_OPTIONS,
  fit: FIT_OPTIONS,
  season: SEASON_OPTIONS,
  style: STYLE_OPTIONS,
};

type ParseResult =
  | { ok: true; data: GarmentWritable }
  | { ok: false; msg: string };

function optionalEnum(
  body: Record<string, unknown>,
  field: AiField,
  data: GarmentWritable,
): string | null {
  if (!(field in body)) return null;
  const value = body[field];
  if (value === null || value === "") {
    (data as Record<string, string | null | undefined>)[field] = null;
    return null;
  }
  if (typeof value !== "string" || !OPTIONS[field].includes(value)) {
    throw new Error(`${field}-invalid`);
  }
  (data as Record<string, string | null | undefined>)[field] = value;
  return value;
}

/** 校验创建/编辑共用的字段；只处理 body 里出现的键。 */
export function parseGarmentInput(
  body: Record<string, unknown>,
): ParseResult {
  const data: GarmentWritable = {};

  try {
    if ("name" in body) {
      const name = readText(body.name, 40);
      if (!name) return { ok: false, msg: "衣物名称不能为空，最多 40 字" };
      data.name = name;
    }

    for (const field of [
      "category",
      "primaryColor",
      "pattern",
      "fit",
      "season",
      "style",
    ] as const) {
      optionalEnum(body, field, data);
    }

    if ("material" in body) {
      data.material =
        body.material === null || body.material === ""
          ? null
          : readText(body.material, 40)?.trim() || null;
    }

    if ("notes" in body) {
      data.notes =
        body.notes === null || body.notes === ""
          ? null
          : readText(body.notes, 300)?.trim() || null;
    }

    if ("price" in body) {
      if (body.price === null || body.price === "") {
        data.priceCents = null;
      } else {
        const cents = parsePriceToCents(body.price);
        if (cents === null) {
          return { ok: false, msg: "价格格式不对，最多两位小数" };
        }
        data.priceCents = cents;
      }
    }

    if ("purchaseDate" in body) {
      if (body.purchaseDate === null || body.purchaseDate === "") {
        data.purchaseDate = null;
      } else {
        const text = String(body.purchaseDate);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
          return { ok: false, msg: "购买日期格式不对" };
        }
        const date = new Date(`${text}T00:00:00.000Z`);
        if (Number.isNaN(date.getTime())) {
          return { ok: false, msg: "购买日期格式不对" };
        }
        data.purchaseDate = date;
      }
    }
  } catch {
    return { ok: false, msg: "有字段取值不对，请检查后重试" };
  }

  return { ok: true, data };
}
