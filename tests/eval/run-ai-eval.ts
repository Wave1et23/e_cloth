import fs from "node:fs";
import path from "node:path";
import { analyzeGarmentImage } from "../../src/lib/ai/vision.ts";
import {
  AI_FIELDS,
  FIELD_OPTIONS,
} from "../../src/lib/garment-fields.ts";
import { detectImageType } from "../../src/lib/images.ts";

type Expected = Record<(typeof AI_FIELDS)[number], string>;
type Item = {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  image: string;
  expected: Expected;
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const strict = args.includes("--strict");
const promptArg =
  args.find((arg) => arg.startsWith("--prompt="))?.slice("--prompt=".length) ??
  "prompts/garment-v1.md";

const root = process.cwd();
const manifestPath = path.join(root, "tests", "eval", "ground-truth.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
  items: Item[];
};

const counts = { easy: 0, medium: 0, hard: 0 };
for (const item of manifest.items) {
  counts[item.difficulty] += 1;
  for (const field of AI_FIELDS) {
    const value = item.expected[field];
    if (!FIELD_OPTIONS[field].includes(value)) {
      throw new Error(
        `ground truth ${item.id}.${field}=${value} is not an allowed value`,
      );
    }
  }
}

if (manifest.items.length !== 20) {
  throw new Error(`expected 20 items, got ${manifest.items.length}`);
}

console.log(
  `dataset: ${manifest.items.length} items (easy ${counts.easy}, medium ${counts.medium}, hard ${counts.hard})`,
);

if (dryRun) {
  console.log("dry-run: manifest is valid; provide images and ARK_API_KEY to run");
  process.exit(0);
}

if (process.env.AI_MOCK === "1") {
  console.error("refusing to run Eval in AI_MOCK mode");
  process.exit(2);
}
if (!process.env.ARK_API_KEY) {
  console.error("ARK_API_KEY is required for a real Eval run");
  process.exit(2);
}

const promptPath = path.isAbsolute(promptArg)
  ? promptArg
  : path.join(root, promptArg);
const systemPrompt = fs.readFileSync(promptPath, "utf8");

const stats: Record<string, { correct: number; evaluated: number }> = {};
for (const field of AI_FIELDS) stats[field] = { correct: 0, evaluated: 0 };

const failures: Array<{
  id: string;
  field: string;
  expected: string;
  predicted: string | null;
  confidence: number;
}> = [];
let evaluated = 0;
let skipped = 0;
let aiFailures = 0;

for (const item of manifest.items) {
  const imagePath = path.join(root, "tests", "eval", "images", item.image);
  if (!fs.existsSync(imagePath)) {
    console.warn(`skip ${item.id}: missing ${item.image}`);
    skipped += 1;
    continue;
  }
  const buffer = fs.readFileSync(imagePath);
  const type = detectImageType(buffer);
  if (!type) {
    console.warn(`skip ${item.id}: not a JPG/PNG`);
    skipped += 1;
    continue;
  }

  const result = await analyzeGarmentImage(
    { buffer, mime: type.mime },
    { systemPrompt },
  );
  if (!result.ok) {
    console.error(`ai failure ${item.id}: ${result.code} ${result.msg}`);
    aiFailures += 1;
    continue;
  }

  evaluated += 1;
  for (const field of AI_FIELDS) {
    const predicted = result.suggestion[field];
    stats[field].evaluated += 1;
    if (predicted === item.expected[field]) {
      stats[field].correct += 1;
    } else {
      failures.push({
        id: item.id,
        field,
        expected: item.expected[field],
        predicted,
        confidence: result.suggestion.confidence[field],
      });
    }
  }
}

if (evaluated === 0) {
  console.error("no images evaluated; put the 20 photos in tests/eval/images/");
  process.exit(1);
}

const accuracy = Object.fromEntries(
  AI_FIELDS.map((field) => [
    field,
    stats[field].evaluated === 0
      ? 0
      : Math.round((stats[field].correct / stats[field].evaluated) * 1000) / 10,
  ]),
);

const thresholds = { category: 85, primaryColor: 90, pattern: 85 };
const pass = (Object.keys(thresholds) as Array<keyof typeof thresholds>).every(
  (field) => accuracy[field] >= thresholds[field],
);

const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
const promptName = path.basename(promptPath, ".md");
const outDir = path.join(root, "tests", "eval", "results");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${promptName}-${stamp}.json`);
fs.writeFileSync(
  outFile,
  JSON.stringify(
    {
      prompt: promptArg,
      evaluated,
      skipped,
      aiFailures,
      accuracy,
      thresholds,
      pass,
      failures,
    },
    null,
    2,
  ),
);

console.log("accuracy:", accuracy, "pass:", pass);
console.log("failures:", failures.length, "report:", outFile);

if (strict && skipped > 0) process.exit(1);
if (!pass) process.exitCode = 1;
