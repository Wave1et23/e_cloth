import fs from "node:fs";
import path from "node:path";
import { detectImageType } from "../../src/lib/images.ts";

const dir = path.join(process.cwd(), "tests", "eval", "care-images");
const prompt = fs.readFileSync(
  path.join(process.cwd(), "prompts", "care-label-v1.md"),
  "utf8",
);
const files = fs
  .readdirSync(dir)
  .filter((file) => /\.(png|jpe?g)$/i.test(file))
  .sort();

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    washTemp: { type: "string", enum: ["20", "30", "40", "60", "cold", "unknown"] },
    bleach: { type: "string", enum: ["yes", "no", "unknown"] },
    iron: { type: "string", enum: ["low", "medium", "high", "unknown"] },
    dryClean: { type: "string", enum: ["yes", "no", "unknown"] },
    tumbleDry: { type: "string", enum: ["yes", "no", "unknown"] },
  },
  required: ["washTemp", "bleach", "iron", "dryClean", "tumbleDry"],
};

const baseUrl = (
  process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3"
).replace(/\/+$/, "");
const model = process.env.ARK_MODEL ?? "doubao-seed-2-1-lite-260915";

if (!process.env.ARK_API_KEY) {
  console.error("ARK_API_KEY missing");
  process.exit(2);
}

for (const file of files) {
  const buffer = fs.readFileSync(path.join(dir, file));
  const type = detectImageType(buffer);
  if (!type) {
    console.log(`${file}: not JPG/PNG`);
    continue;
  }
  const started = performance.now();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: prompt },
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
  const ms = Math.round(performance.now() - started);
  if (!response.ok) {
    console.log(`${file} (${ms}ms): FAIL HTTP ${response.status}`);
    continue;
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  console.log(`${file} (${ms}ms): ${payload.choices?.[0]?.message?.content}`);
}
