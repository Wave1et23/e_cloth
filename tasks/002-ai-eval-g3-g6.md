# 20 件衣物正式 Eval（G3 / G6）

- **状态**：待开始（阻塞在素材与人工标注）
- **版本**：未定（v0.1 之后）
- **类型**：verification
- **对应 task**：G3、G6
- **改了什么**：尚未执行。Eval 清单与脚本已存在：`tests/eval/ground-truth.json`、`tests/eval/run-ai-eval.ts`、`tests/eval/run-care-label.ts`。
- **为什么**：当前只有 7 件衣物 + 4 张水洗标的试跑观察，没有字段级准确率；门槛见 `docs/DECISIONS.md` D13（类别 ≥85%、颜色 ≥90%、图案 ≥85%）。正式评估所需的 20 件衣物与 8 张水洗标的**人工 Ground Truth 与完整素材待补充**。
- **怎么验证的**：待验证。图片放入 `tests/eval/images/`（20 件，命名与清单一致）与 `tests/eval/care-images/`（8 张）；`.env` 配置 `ARK_API_KEY` 且 `AI_MOCK=0`；跑 `npm run eval`、`npm run eval:care`；把摘要写入 `docs/EVAL-REPORT.md` 第 4–6 节。
- **影响哪些文档**：`docs/EVAL-REPORT.md`、`docs/AI-USAGE-LOG.md`、`docs/ITERATION_LOG.md`、`docs/PRD.md`（验收状态）。
- **已知限制**：现有 7 张衣物与 4 张水洗标只是试跑，不能当正式准确率；`prompts/garment-v2.md` 仍是候选，需根据失败样本定稿。
