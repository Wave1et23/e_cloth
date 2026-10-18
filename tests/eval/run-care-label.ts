import fs from "node:fs";
import path from "node:path";
import { detectImageType } from "../../src/lib/images.ts";

type Expected = {
  washTemp: string;
  bleach: string;
  iron: string;
  dryClean: string;
  tumbleDry: string;
};

type Item = { id: string; image: string; expected: Expected };

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const promptArg =
  args.find((arg) => arg.startsWith("--prompt="))?.slice("--prompt=".length) ??
  "prompts/care-label-v1.md";

const root = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, "tests", "eval", "care-label-ground-truth.json"),
    "utf8",
  ),
) as { items: Item[] };

const allowed: Record<keyof Expected, string[]> = {
  washTemp: ["20", "30", "40", "60", "cold", "unknown"],
  bleach: ["yes", "no", "unknown"],
  iron: ["low", "medium", "high", "unknown"],
  dryClean: ["yes", "no", "unknown"],
  tumbleDry: ["yes", "no", "unknown"],
};

for (const item of manifest.items) {
  for (const key of Object.keys(allowed) as Array<keyof Expected>) {
    if (!allowed[key].includes(item.expected[key])) {
      throw new Error(`${item.id}.${key}=${item.expected[key]} is invalid`);
    }
  }
}

console.log(`care-label dataset: ${manifest.items.length} items`);
if (dryRun) {
  console.log("dry-run: manifest valid; provide 8 images and ARK_API_KEY to run");
  process.exit(0);
}
if (process.env.AI_MOCK === "1") {
  console.error("refusing to run care-label Eval in AI_MOCK mode");
  process.exit(2);
}
if (!process.env.ARK_API_KEY) {
  console.error("ARK_API_KEY is required for a real care-label run");
  process.exit(2);
}

const systemPrompt = fs.readFileSync(path.join(root, promptArg), "utf8");
const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    washTemp: { type: "string", enum: allowed.washTemp },
    bleach: { type: "string", enum: allowed.bleach },
    iron: { type: "string", enum: allowed.iron },
    dryClean: { type: "string", enum: allowed.dryClean },
    tumbleDry: { type: "string", enum: allowed.tumbleDry },
  },
  required: ["washTemp", "bleach", "iron", "dryClean", "tumbleDry"],
};

const baseUrl = (
  process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3"
).replace(/\/+$/, "");
const model = process.env.ARK_MODEL ?? "doubao-seed-2-1-lite-260915";

const stats: Record<string, { correct: number; evaluated: number }> = {};
for (const key of Object.keys(allowed)) stats[key] = { correct: 0, evaluated: 0 };
const failures: Array<{ id: string; field: string; expected: string; predicted: string }> = [];
let evaluated = 0;

for (const item of manifest.items) {
  const imagePath = path.join(root, "tests", "eval", "care-images", item.image);
  if (!fs.existsSync(imagePath)) {
    console.warn(`skip ${item.id}: missing ${item.image}`);
    continue;
  }
  const buffer = fs.readFileSync(imagePath);
  const type = detectImageType(buffer);
  if (!type) {
    console.warn(`skip ${item.id}: not JPG/PNG`);
    continue;
  }

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

  if (!response.ok) {
    console.error(`ai failure ${item.id}: HTTP ${response.status}`);
    continue;
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    console.error(`ai failure ${item.id}: empty content`);
    continue;
  }

  let predicted: Record<string, string>;
  try {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    predicted = JSON.parse(content.slice(start, end + 1));
  } catch {
    console.error(`ai failure ${item.id}: invalid JSON`);
    continue;
  }

  evaluated += 1;
  for (const key of Object.keys(allowed) as Array<keyof Expected>) {
    stats[key].evaluated += 1;
    if (predicted[key] === item.expected[key]) {
      stats[key].correct += 1;
    } else {
      failures.push({
        id: item.id,
        field: key,
        expected: item.expected[key],
        predicted: predicted[key] ?? "missing",
      });
    }
  }
}

if (evaluated === 0) {
  console.error("no care labels evaluated; put 8 photos in tests/eval/care-images/");
  process.exit(1);
}

const accuracy = Object.fromEntries(
  Object.keys(allowed).map((key) => [
    key,
    Math.round((stats[key].correct / stats[key].evaluated) * 1000) / 10,
  ]),
);

const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
const outDir = path.join(root, "tests", "eval", "results");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `care-label-${stamp}.json`);
fs.writeFileSync(
  outFile,
  JSON.stringify({ evaluated, accuracy, failures }, null, 2),
);

console.log("accuracy:", accuracy, "failures:", failures.length);
console.log("report:", outFile);
