import fs from "node:fs";
import path from "node:path";
import { detectImageType } from "../../src/lib/images.ts";

const FIELDS = ["washTemp", "bleach", "iron", "dryClean", "tumbleDry"] as const;
type Field = (typeof FIELDS)[number];
type CareResult = Record<Field, string>;

const ALLOWED: Record<Field, readonly string[]> = {
  washTemp: ["20", "30", "40", "60", "cold", "uncertain"],
  bleach: ["yes", "no", "uncertain"],
  iron: ["low", "medium", "high", "uncertain"],
  dryClean: ["yes", "no", "uncertain"],
  tumbleDry: ["yes", "no", "uncertain"],
};

const DEFAULT_INPUT = "水洗标识别测试";
const DEFAULT_PROMPT = "prompts/care-label-v3.md";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const inputArg = args.find((arg) => arg.startsWith("--input="))?.slice("--input=".length);
const outArg = args.find((arg) => arg.startsWith("--out="))?.slice("--out=".length);
const promptArg = args.find((arg) => arg.startsWith("--prompt="))?.slice("--prompt=".length) ?? DEFAULT_PROMPT;
const root = process.cwd();
const inputDir = path.resolve(root, inputArg ?? DEFAULT_INPUT);
const promptPath = path.resolve(root, promptArg);

type ImageFile = { path: string; name: string; number: number };

function walkImages(dir: string): ImageFile[] {
  const result: ImageFile[] = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkImages(fullPath));
      continue;
    }
    if (!entry.isFile() || !/\.(jpe?g|png)$/i.test(entry.name)) continue;
    const match = /^(\d+)/.exec(entry.name);
    result.push({
      path: fullPath,
      name: entry.name,
      number: match ? Number(match[1]) : Number.MAX_SAFE_INTEGER,
    });
  }
  return result;
}

const images = walkImages(inputDir).sort(
  (a, b) => a.number - b.number || a.name.localeCompare(b.name, "zh-Hans-CN"),
);

if (images.length === 0) {
  console.error(`没有找到图片：${inputDir}`);
  console.error("请把 1.jpg / 2.jpg … 放到该目录（支持递归子目录）。");
  process.exit(1);
}

console.log(`输入目录：${inputDir}`);
console.log(`发现图片：${images.length} 张`);
if (dryRun) {
  for (const [index, image] of images.entries()) {
    console.log(`${index + 1}. ${path.relative(root, image.path)}`);
  }
  console.log("dry-run：只检查文件，不调用 Ark。");
  process.exit(0);
}

if (process.env.AI_MOCK === "1") {
  console.error("refusing to run care-label batch in AI_MOCK mode");
  process.exit(2);
}
if (!process.env.ARK_API_KEY) {
  console.error("ARK_API_KEY missing；请用 node --env-file=.env 运行，key 只从 .env 读取");
  process.exit(2);
}

const systemPrompt = fs.readFileSync(promptPath, "utf8");
const schema = {
  type: "object",
  additionalProperties: false,
  properties: Object.fromEntries(
    FIELDS.map((field) => [field, { type: "string", enum: ALLOWED[field] }]),
  ),
  required: FIELDS,
};
const baseUrl = (
  process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3"
).replace(/\/+$/, "");
const model = process.env.ARK_MODEL ?? "doubao-seed-2-1-lite-260915";

function normalizeResult(raw: unknown): CareResult {
  const source =
    raw !== null && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result = {} as CareResult;
  for (const field of FIELDS) {
    const value = source[field];
    if (typeof value !== "string") {
      result[field] = "uncertain";
      continue;
    }
    const normalized = value.trim();
    result[field] =
      normalized === "unknown"
        ? "uncertain"
        : ALLOWED[field].includes(normalized)
          ? normalized
          : "uncertain";
  }
  return result;
}

type Outcome =
  | {
      image: ImageFile;
      index: number;
      ok: true;
      delayMs: number;
      result: CareResult;
      raw: unknown;
      content: string;
    }
  | {
      image: ImageFile;
      index: number;
      ok: false;
      delayMs: number;
      errorType: string;
      error: string;
      content?: string;
    };

const outcomes: Outcome[] = [];
let calls = 0;
const batchStarted = performance.now();

for (const [index, image] of images.entries()) {
  const started = performance.now();
  const display = `${index + 1}/${images.length} ${image.name}`;
  try {
    const buffer = fs.readFileSync(image.path);
    const type = detectImageType(buffer);
    if (!type) throw new Error("unsupported_image: 不是 JPG/PNG");

    calls += 1;
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "请识别这张水洗标，按 schema 输出 JSON。" },
              {
                type: "image_url",
                image_url: {
                  url: `data:${type.mime};base64,${buffer.toString("base64")}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
        thinking: { type: "disabled" },
        response_format: {
          type: "json_schema",
          json_schema: { name: "care_label", strict: true, schema },
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const delayMs = Math.round(performance.now() - started);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new Error("empty_content: 模型没有返回内容");
    }

    let primary: unknown;
    try {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start < 0 || end <= start) throw new Error("no JSON object");
      primary = JSON.parse(content.slice(start, end + 1));
    } catch {
      const error = new Error("invalid_json: 返回内容不是 JSON");
      error.name = "InvalidJsonError";
      throw Object.assign(error, { content });
    }

    const result = normalizeResult(primary);
    outcomes.push({
      image,
      index: index + 1,
      ok: true,
      delayMs,
      result,
      raw: primary,
      content,
    });
    console.log(`[${display}] 成功 ${delayMs}ms`);
  } catch (error) {
    const delayMs = Math.round(performance.now() - started);
    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError" ||
        /timed out|timeout/i.test(error.message));
    const errorType = isTimeout
      ? "timeout"
      : error instanceof Error && error.name === "InvalidJsonError"
        ? "invalid_json"
        : error instanceof Error && error.message.startsWith("HTTP ")
          ? "api_http"
          : "runtime";
    const message =
      errorType === "timeout"
        ? "请求超时（20s）"
        : error instanceof Error
          ? error.message
          : String(error);
    const content =
      errorType === "invalid_json" && typeof error === "object" && error !== null && "content" in error
        ? String((error as { content: unknown }).content).slice(0, 2000)
        : undefined;
    outcomes.push({
      image,
      index: index + 1,
      ok: false,
      delayMs,
      errorType,
      error: message,
      content,
    });
    console.error(`[${display}] 失败 ${delayMs}ms ${errorType}: ${message}`);
  }
}

const totalMs = Math.round(performance.now() - batchStarted);
const success = outcomes.filter((outcome) => outcome.ok).length;
const failed = outcomes.length - success;

function sectionFor(outcome: Outcome): string {
  const lines = [
    "=".repeat(80),
    `图 ${outcome.index} / ${outcome.image.name}`,
    `文件: ${path.relative(root, outcome.image.path)}`,
    `状态: ${outcome.ok ? "成功" : "失败"}`,
    `延迟: ${outcome.delayMs} ms`,
    "-".repeat(80),
  ];
  if (!outcome.ok) {
    lines.push(`错误类型: ${outcome.errorType}`, `错误: ${outcome.error}`);
    if (outcome.content) lines.push("", "返回原文:", outcome.content);
    lines.push("=".repeat(80), "");
    return lines.join("\n");
  }
  for (const field of FIELDS) lines.push(`${field}: ${outcome.result[field]}`);
  lines.push(
    "-".repeat(80),
    "原始 JSON:",
    JSON.stringify(outcome.raw, null, 2),
    "",
    "模型原文:",
    outcome.content,
    "=".repeat(80),
    "",
  );
  return lines.join("\n");
}

const summaryRows = outcomes.map((outcome) => {
  if (!outcome.ok) {
    return `| ${outcome.index} | ${outcome.image.name} | — | — | — | — | — | 失败：${outcome.errorType} |`;
  }
  return `| ${outcome.index} | ${outcome.image.name} | ${FIELDS.map((field) => outcome.result[field]).join(" | ")} | 成功 |`;
});

const distributions = Object.fromEntries(
  FIELDS.map((field) => [
    field,
    Object.fromEntries(
      ALLOWED[field].map((value) => [
        value,
        outcomes.filter((outcome) => outcome.ok && outcome.result[field] === value).length,
      ]),
    ),
  ]),
);

const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
const outFile = path.resolve(
  root,
  outArg ?? path.join("tests", "eval", "results", `care-label-batch-${stamp}.txt`),
);
fs.mkdirSync(path.dirname(outFile), { recursive: true });

const report = [
  "水洗标批量识别报告",
  `时间: ${new Date().toLocaleString("zh-CN", { hour12: false })}`,
  `模型: ${model}`,
  `Prompt: ${path.relative(root, promptPath)}`,
  `输入目录: ${path.relative(root, inputDir)}`,
  `总张数: ${images.length}`,
  `成功: ${success}`,
  `失败: ${failed}`,
  `总耗时: ${totalMs} ms`,
  `调用次数: ${calls}`,
  "",
  ...outcomes.map(sectionFor),
  "=".repeat(80),
  "汇总表",
  "",
  "| 图号 | 文件 | washTemp | bleach | iron | dryClean | tumbleDry | 状态 |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ...summaryRows,
  "",
  "字段分布（仅成功图片）:",
  ...FIELDS.map(
    (field) =>
      `${field}: ${Object.entries(distributions[field])
        .filter(([, count]) => count > 0)
        .map(([value, count]) => `${value}×${count}`)
        .join("，") || "—"}`,
  ),
  "",
  "说明：uncertain = 无法判断，未编造；失败图片不影响后续图片。",
  "",
].join("\n");

fs.writeFileSync(outFile, report, "utf8");

console.log("");
console.log("===== 完成 =====");
console.log(`总张数: ${images.length}`);
console.log(`成功: ${success}`);
console.log(`失败: ${failed}`);
console.log(`总耗时: ${totalMs} ms`);
console.log(`调用次数: ${calls}`);
console.log(`报告: ${outFile}`);
process.exitCode = failed > 0 && success === 0 ? 1 : 0;
