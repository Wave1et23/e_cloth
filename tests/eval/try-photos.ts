import fs from "node:fs";
import path from "node:path";
import { analyzeGarmentImage } from "../../src/lib/ai/vision.ts";
import { detectImageType } from "../../src/lib/images.ts";

const dir = path.join(process.cwd(), "tests", "eval", "images");
const files = fs
  .readdirSync(dir)
  .filter((file) => /\.(png|jpe?g)$/i.test(file))
  .sort();

if (files.length === 0) {
  console.error("no photos in tests/eval/images");
  process.exit(1);
}
if (process.env.AI_MOCK === "1") {
  console.error("AI_MOCK=1: turn it off to try real Ark");
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
  const result = await analyzeGarmentImage({ buffer, mime: type.mime });
  const ms = Math.round(performance.now() - started);
  if (!result.ok) {
    console.log(`${file} (${ms}ms): FAIL ${result.code} ${result.msg}`);
    continue;
  }
  const s = result.suggestion;
  console.log(
    `${file} (${ms}ms): ${JSON.stringify({
      category: s.category,
      primaryColor: s.primaryColor,
      pattern: s.pattern,
      fit: s.fit,
      season: s.season,
      style: s.style,
      material: s.material,
      confidence: s.confidence,
    })}`,
  );
}
