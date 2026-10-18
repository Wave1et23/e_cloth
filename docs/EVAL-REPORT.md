# AI 准确率报告（Eval）

> 状态：**脚本已就绪，真实准确率待跑**。需要用户提供 20 张衣物照片 + 8 张水洗标照片，并在 `.env` 配置 `ARK_API_KEY`。
> 在拿到真实结果前，本文件不写任何“准确率数字”，避免把 mock 或猜测当成证据。

## 1. 评测对象

| 项 | 值 |
| --- | --- |
| 模型 | `doubao-seed-2-1-lite-260915`（火山方舟 Ark，OpenAI 兼容） |
| 输出模式 | `response_format: json_schema`，关闭深度思考 |
| 衣物字段 | category / primaryColor / pattern / fit / season / style |
| 门槛（DECISIONS D13） | 类别 ≥ 85%、颜色 ≥ 90%、图案 ≥ 85% |
| 调用预算 | 开发 + 评测合计 ≤ 300 次视觉调用；adapter 内计数并告警 |

## 2. 数据集

- 20 件衣物：10 易 / 5 中 / 5 难；人工先标 Ground Truth（`tests/eval/ground-truth.json`）。
- 8 张水洗标：离线实验，不进产品界面（`tests/eval/care-label-ground-truth.json`）。
- 图片与人工标注分离：图片只放本地 `tests/eval/images/`、`tests/eval/care-images/`，不进 Git。

## 3. 方法

1. `npm run eval:dry` 校验清单与枚举值。
2. `npm run eval` 跑 Prompt V1，输出逐字段准确率与失败样本（含 confidence）。
3. 按失败模式改 `prompts/garment-v2.md`，再跑一次。
4. 两个版本的结果都保留在 `tests/eval/results/`；本报告只抄摘要与代表性案例。

## 4. V1 结果

| 字段 | 准确率 | 是否达标 |
| --- | --- | --- |
| category | 待跑 | — |
| primaryColor | 待跑 | — |
| pattern | 待跑 | — |
| fit | 待跑 | — |
| season | 待跑 | — |
| style | 待跑 | — |

**失败模式（待填）**：颜色在暖光/白平衡偏色下的误判；图案在细条纹与纯色之间的边界；宽松/oversize 的边界。

## 5. V2 结果与对比

| 字段 | V1 | V2 | 变化 |
| --- | --- | --- | --- |
| category | 待跑 | 待跑 | — |
| primaryColor | 待跑 | 待跑 | — |
| pattern | 待跑 | 待跑 | — |

**V2 改动（候选）**：类别判定顺序化、颜色按面积取主色、图案按“规则线条/重复图形/插画”分流、置信度四档锚点。见 `prompts/garment-v2.md`。

## 6. 水洗标离线实验

| 字段 | V1 | V2 |
| --- | --- | --- |
| washTemp | 待跑 | 待跑 |
| bleach | 待跑 | 待跑 |
| iron | 待跑 | 待跑 |
| dryClean | 待跑 | 待跑 |
| tumbleDry | 待跑 | 待跑 |

结论（待跑后填）：水洗标只作为答辩材料中的“第二条链路实验”，**不进入产品界面**。

## 7. 人工核查

- [ ] 20 件 Ground Truth 由人工逐件确认，且与图片文件名对应
- [ ] 失败样本至少保留 3 张截图/记录
- [ ] V1 → V2 的改动能对应到具体失败样本，而不是“感觉更好”
- [ ] 报告中明确标注：演示数据为模拟数据，Eval 数据为真实拍摄
