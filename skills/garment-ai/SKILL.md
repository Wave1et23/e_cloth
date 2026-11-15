# SKILL · 衣物识别（garment-ai）

> 适用：修改 `src/lib/ai/**`、`prompts/garment-*.md`、`/api/ai/garment`、`/garments/new` 的 AI 预填逻辑时。
> 先读：`src/lib/ai/schema.ts`、`src/lib/ai/vision.ts`、`docs/DECISIONS.md` D12/D13、`docs/EVAL-REPORT.md`。

## 一、改之前必做的三件事

1. 读 `src/lib/ai/schema.ts`，确认字段名与类型；字段名必须与 Prisma `Garment` 一致，中间不做映射层。
2. 读当前 Prompt（`prompts/garment-v1.md` 或 `garment-v2.md`），确认这次要改的是哪一版。
3. 确认这次改动**属于哪类**：只调文案 / 改字段 / 改 Schema / 换模型参数。改 Schema 或换模型参数必须在上线前跑一次 Eval。

## 二、硬规则（违反即视为 Bug）

| 规则 | 具体要求 |
| --- | --- |
| **品牌不猜** | `brand` 恒返回 `"uncertain"`，产品侧写死不接受模型给的值 |
| **材质只给建议** | `material` 可为 `"uncertain"`；入库前截断到 40 字，且 UI 上标"建议值" |
| **不确定就说不确定** | 拿不准的字段输出 `"uncertain"`，禁止编一个看起来合理的值 |
| **低置信不预填** | `confidence` < 0.7 的字段留空 + 标黄，不得预填后让用户"将错就错" |
| **结构化输出** | 必须 `response_format: json_schema`；禁止解析自由文本、禁止正则兜底 |
| **关闭深度思考** | 识别任务不需要长推理；开着会多等数秒到十几秒并多花钱 |
| **AI 失败必须可降级** | 超时/报错返回 `AI_UNAVAILABLE`，前端仍能手动填完并入库 |
| **AI 不直接写库** | `POST /api/ai/garment` 只返回建议；落库只走用户确认后的 `POST /api/garments` |

## 三、改 Prompt 的流程

```
改 txt（prompts/garment-vN+1.md）
  → 同步 src/lib/ai/vision.ts 的 SYSTEM_PROMPT（当前是代码常量，两处必须一致）
  → npm run eval:dry    校验清单与枚举
  → npm run eval        跑准确率，看失败样本
  → 达标线：category ≥ 85%、primaryColor ≥ 90%、pattern ≥ 85%
  → 更新 docs/EVAL-REPORT.md（V1/V2 对比 + 失败案例）
  → 更新 docs/AI-USAGE-LOG.md（这次迭代为什么改）
```

> ⚠️ 已知结构问题：产品实际用的是 `vision.ts` 里的 `SYSTEM_PROMPT` 常量，`prompts/*.md` 目前只有 Eval 脚本读取。**两处必须手工保持一致**，否则"关键 Prompt"材料与产品实际行为不符。

## 四、已知模型边界（别当成 Bug 反复调）

- 图案在「星星/字母装饰」上会在 `其他` 与 `印花` 之间摇摆 → V2 要明确"图案指整片重复纹样，局部刺绣/字母不算"。
- `material` 容易输出长句 → 要求"一个词"，入库再截断 40 字。
- 暖光/白平衡偏色下颜色会偏 → 属已知限制，不强求。

## 五、验证方式

- 单测：`npm test`（含 `ai-schema`、`vision` 用例）。
- 手工：上传一张真实照片，确认预填字段、低置信标黄、AI 失败降级三条路径。
- 真实调用延迟参考：2.2–2.7s（2026-10-19，7 张试跑）。
