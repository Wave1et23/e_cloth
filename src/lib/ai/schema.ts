import {
  AI_FIELDS,
  FIELD_OPTIONS,
  type AiField,
} from "../garment-fields.ts";

/** AI 只返回建议；brand 恒为 uncertain，material 仅建议。 */
export type GarmentSuggestion = {
  category: string | null;
  primaryColor: string | null;
  pattern: string | null;
  fit: string | null;
  season: string | null;
  style: string | null;
  material: string | null;
  brand: "uncertain";
  confidence: Record<AiField | "material", number>;
};

export const ZERO_CONFIDENCE: GarmentSuggestion["confidence"] = {
  category: 0,
  primaryColor: 0,
  pattern: 0,
  fit: 0,
  season: 0,
  style: 0,
  material: 0,
};

/** Ark `response_format: json_schema` 的 schema；字段名与 DB/前端一致。 */
export const GARMENT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: { type: "string", enum: [...FIELD_OPTIONS.category] },
    primaryColor: { type: "string", enum: [...FIELD_OPTIONS.primaryColor] },
    pattern: { type: "string", enum: [...FIELD_OPTIONS.pattern] },
    fit: { type: "string", enum: [...FIELD_OPTIONS.fit] },
    season: { type: "string", enum: [...FIELD_OPTIONS.season] },
    style: { type: "string", enum: [...FIELD_OPTIONS.style] },
    material: { type: "string" },
    confidence: {
      type: "object",
      additionalProperties: false,
      properties: {
        category: { type: "number", minimum: 0, maximum: 1 },
        primaryColor: { type: "number", minimum: 0, maximum: 1 },
        pattern: { type: "number", minimum: 0, maximum: 1 },
        fit: { type: "number", minimum: 0, maximum: 1 },
        season: { type: "number", minimum: 0, maximum: 1 },
        style: { type: "number", minimum: 0, maximum: 1 },
        material: { type: "number", minimum: 0, maximum: 1 },
      },
      required: [
        "category",
        "primaryColor",
        "pattern",
        "fit",
        "season",
        "style",
        "material",
      ],
    },
  },
  required: [
    "category",
    "primaryColor",
    "pattern",
    "fit",
    "season",
    "style",
    "material",
    "confidence",
  ],
} as const;

function clampConfidence(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
}

function cleanMaterial(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, 40);
  return text === "" ? null : text;
}

/**
 * 把模型返回的任意 JSON 收敛成可安全入库/展示的建议：
 * 字段不在白名单里就置空，置信度缺失按 0 处理，brand 永远 uncertain。
 */
export function normalizeSuggestion(raw: unknown): GarmentSuggestion {
  const source =
    raw !== null && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};
  const confidenceSource =
    source.confidence !== null && typeof source.confidence === "object"
      ? (source.confidence as Record<string, unknown>)
      : {};

  const suggestion: GarmentSuggestion = {
    category: null,
    primaryColor: null,
    pattern: null,
    fit: null,
    season: null,
    style: null,
    material: cleanMaterial(source.material),
    brand: "uncertain",
    confidence: { ...ZERO_CONFIDENCE },
  };

  for (const field of AI_FIELDS) {
    const value = source[field];
    if (
      typeof value === "string" &&
      FIELD_OPTIONS[field].includes(value)
    ) {
      suggestion[field] = value;
      suggestion.confidence[field] = clampConfidence(confidenceSource[field]);
    } else {
      suggestion[field] = null;
      suggestion.confidence[field] = 0;
    }
  }

  suggestion.confidence.material = clampConfidence(
    confidenceSource.material,
  );
  return suggestion;
}

/** 从模型 content 里取 JSON；容忍 ```json 包裹。 */
export function parseModelJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const text = fenced ? fenced[1] : trimmed;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("model returned no JSON object");
  return JSON.parse(text.slice(start, end + 1));
}

export function mockSuggestion(): GarmentSuggestion {
  return {
    category: "上衣",
    primaryColor: "灰",
    pattern: "纯色",
    fit: "常规",
    season: "春,秋",
    style: "休闲",
    material: "棉",
    brand: "uncertain",
    confidence: {
      category: 0.93,
      primaryColor: 0.88,
      pattern: 0.82,
      fit: 0.74,
      season: 0.66,
      style: 0.78,
      material: 0.58,
    },
  };
}
