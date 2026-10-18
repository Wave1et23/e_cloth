# Eval 数据集与运行方式

> 所有图片都是用户拍摄的真实照片，**不进 Git**；Ground Truth 由人工标注。
> 没有 `ARK_API_KEY` 时只能跑 dry-run；不要在 mock 模式下产出准确率。

## 衣物识别（20 件）

图片放 `tests/eval/images/`，文件名与 `ground-truth.json` 的 `image` 一致（jpg/png）。

```bash
npm run eval:dry                 # 只校验清单，不用 key
npm run eval                     # 真跑 V1，结果写 tests/eval/results/
node tests/eval/run-ai-eval.ts --prompt=prompts/garment-v2.md
```

- 10 易 / 5 中 / 5 难。
- 字段级准确率：category、primaryColor、pattern、fit、season、style。
- 门槛：category ≥ 85%、primaryColor ≥ 90%、pattern ≥ 85%。
- 失败样本会带 `predicted` 与 `confidence` 写进结果 JSON，用于定位 Prompt 问题。

## 水洗标离线实验（8 张）

图片放 `tests/eval/care-images/`，**不进产品界面**。

```bash
npm run eval:care:dry
npm run eval:care
node tests/eval/run-care-label.ts --prompt=prompts/care-label-v2.md
```

- 只评 5 个字段：washTemp / bleach / iron / dryClean / tumbleDry。
- 两张表都只用于 `docs/EVAL-REPORT.md` 与答辩材料，不接产品 UI。

## 结果

`tests/eval/results/*.json`（Git 忽略）。把摘要与失败案例抄进 `docs/EVAL-REPORT.md`。
