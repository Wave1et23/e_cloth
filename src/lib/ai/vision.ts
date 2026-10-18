import {
  GARMENT_JSON_SCHEMA,
  mockSuggestion,
  normalizeSuggestion,
  parseModelJson,
  type GarmentSuggestion,
} from "./schema.ts";

const TIMEOUT_MS = 20_000;

const SYSTEM_PROMPT = `你是衣物档案助手。用户给你一张真实衣物照片，你只输出一个 JSON 对象，字段：
- category：上衣/裤装/裙装/连衣裙/外套/马甲/套装/其他
- primaryColor：黑/白/灰/米/棕/蓝/绿/红/粉/紫/黄/橙/多色
- pattern：纯色/条纹/格纹/印花/波点/几何/其他
- fit：修身/常规/宽松/oversize
- season：春/夏/秋/冬/春秋/四季
- style：通勤/休闲/运动/复古/甜酷/家居/其他
- material：很短的面料建议，拿不准就空字符串
- confidence：上述 7 个字段各一个 0-1 的数

规则：只看照片，看不到的不猜；material 只是建议；不输出 brand；多件衣物只描述主体；拿不准给低置信度而不是编造。`;

export type VisionSuccess = {
  ok: true;
  suggestion: GarmentSuggestion;
  mock?: boolean;
};

export type VisionFailure = {
  ok: false;
  code: "AI_NOT_CONFIGURED" | "AI_UNAVAILABLE";
  msg: string;
};

export type VisionResult = VisionSuccess | VisionFailure;

let analyzeCount = 0;

export function getAiCallCount(): number {
  return analyzeCount;
}

function budget(): number {
  const parsed = Number(process.env.AI_CALL_BUDGET ?? "300");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
}

function countCall(): void {
  analyzeCount += 1;
  if (analyzeCount > budget()) {
    console.warn(
      `[ai] call budget exceeded: ${analyzeCount}/${budget()} (warning only)`,
    );
  }
}

type AnalyzeInput = {
  buffer: Buffer;
  mime: "image/jpeg" | "image/png";
};

type AnalyzeOptions = {
  /** Eval 用：允许传入 V1/V2 等不同版本的 system prompt。 */
  systemPrompt?: string;
};

/**
 * 调 Ark 的 OpenAI 兼容接口做衣物识别。
 * 失败只返回 AI_UNAVAILABLE，由页面降级为手动填写，不抛异常。
 */
export async function analyzeGarmentImage(
  input: AnalyzeInput,
  options: AnalyzeOptions = {},
): Promise<VisionResult> {
  if (process.env.AI_MOCK === "1") {
    return { ok: true, suggestion: mockSuggestion(), mock: true };
  }

  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      code: "AI_NOT_CONFIGURED",
      msg: "AI 还没配置，先手动填写也可以",
    };
  }

  const baseUrl = (
    process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3"
  ).replace(/\/+$/, "");
  const model = process.env.ARK_MODEL ?? "doubao-seed-2-1-lite-260915";
  const dataUrl = `data:${input.mime};base64,${input.buffer.toString("base64")}`;

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: options.systemPrompt ?? SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "请识别这张衣物照片，按 schema 输出 JSON。" },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 600,
    thinking: { type: "disabled" },
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "garment",
        strict: true,
        schema: GARMENT_JSON_SCHEMA,
      },
    },
  };

  countCall();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300);
        console.error(
          `[ai] ark http ${response.status} attempt ${attempt + 1}: ${detail}`,
        );
        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 400
        ) {
          return {
            ok: false,
            code: "AI_UNAVAILABLE",
            msg: "AI 识别失败，可以手动填写",
          };
        }
        continue;
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content === "") {
        console.error("[ai] ark returned empty content");
        continue;
      }

      const suggestion = normalizeSuggestion(parseModelJson(content));
      return { ok: true, suggestion };
    } catch (error) {
      console.error(
        `[ai] ark attempt ${attempt + 1} failed:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return {
    ok: false,
    code: "AI_UNAVAILABLE",
    msg: "AI 没识别成功，不影响建档，手动填完就行",
  };
}
