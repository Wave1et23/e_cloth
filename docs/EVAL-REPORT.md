# AI 准确率报告（Eval）

> 状态：**脚本已就绪，真实准确率待跑**。需要用户提供 20 张衣物照片 + 8 张水洗标照片，并在 `.env` 配置 `ARK_API_KEY`。
> 在拿到真实结果前，本文件不写任何“准确率数字”，避免把 mock 或猜测当成证据。

## 1. 评测对象

| 项 | 值 |
| --- | --- |
| 模型 | `doubao-seed-2-1-lite-260915`（火山方舟 Ark，OpenAI 兼容） |
| 输出模式 | `response_format: json_schema`，关闭深度思考 |
| 衣物字段 | category / primaryColor / pattern / fit / season / style |
| 季节格式 | 多选逗号组合（如 `春,秋`）；Ground Truth 已把 `春秋→春,秋`、`四季→春,夏,秋,冬`；AI schema 不再接受旧值 |
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

### 6.1 2026-11-13 · V3 批量可行性（20 张，无 Ground Truth）

- Prompt：`prompts/care-label-v3.md`；模型 `doubao-seed-2-1-lite-260915`；`response_format: json_schema`；`thinking: disabled`。
- 脚本：`tests/eval/batch-care-label.ts`，命令 `npm run care:batch`。
- 输入：`水洗标识别测试/照片/` 下 20 张（1–20，jpg/png）。
- 结果：**20/20 成功，0 失败，总耗时 32193ms，调用 20 次**。
- 逐图原始结果：`tests/eval/results/care-label-batch-2026-11-13T10-46-13.txt`。

| 字段 | 本次值分布 |
| --- | --- |
| washTemp | 30×9、40×5、cold×5、uncertain×1 |
| bleach | no×19、uncertain×1 |
| iron | low×14、medium×2、high×1、uncertain×3 |
| dryClean | yes×6、no×11、uncertain×3 |
| tumbleDry | yes×2、no×9、uncertain×9 |

观察：

1. 20 张全部返回结构化 JSON，批量脚本无中断；该结果只证明链路可用，**没有人工 Ground Truth，不计算准确率**。
2. `tumbleDry` 有 9 张为 `uncertain`，是本次最不确定的字段；`iron`/`dryClean` 也有少量无法判断。
3. `bleach` 19 张为 `no`，需要后续人工核对是否把“没有三角形”误判为“不可漂白”。
4. 是否进入产品属于后续独立决定；本实验不改变产品界面、数据库或线上功能。

## 7. 人工核查

- [ ] 20 件 Ground Truth 由人工逐件确认，且与图片文件名对应
- [ ] 失败样本至少保留 3 张截图/记录
- [ ] V1 → V2 的改动能对应到具体失败样本，而不是“感觉更好”
- [ ] 报告中明确标注：演示数据为模拟数据，Eval 数据为真实拍摄

## 8. 2026-10-19 真实试跑（7 件衣物 + 4 张水洗标，无正式 Ground Truth）

目的：验证真实 Ark key、`json_schema`、`thinking: disabled` 与图片压缩后的链路。**不计算准确率**，因为还没有 20 件人工标注。

| 照片 | 延迟 | category | color | pattern | 备注 |
| --- | --- | --- | --- | --- | --- |
| zip 连帽卫衣 | 2684ms | 外套 | 灰 | 其他 | 拉链卫衣归“外套”可接受；星星/字母被归“其他” |
| 灰色针织上衣 | 2300ms | 上衣 | 灰 | 纯色 | 正常 |
| 米色半身裙 | 2202ms | 裙装 | 米 | 纯色 | 正常 |
| 印花 T 恤 | 2454ms | 上衣 | 米 | 印花 | 正常 |
| 蓝色牛仔裤 | 2683ms | 裤装 | 蓝 | 纯色 | 正常 |
| 灰色阔腿牛仔 | 2261ms | 裤装 | 灰 | 印花 | 星星/字母被归“印花”；可能更适合“其他” |
| 灰色呢大衣 | 2470ms | 外套 | 灰 | 纯色 | 正常；material 返回长句，入库会截到 40 字 |

观察：

1. 7 次调用均成功，延迟 **2.2–2.7s**，`json_schema` 与关闭深度思考参数没有报错。
2. 主要分歧在“图案”：星星/字母装饰在 `其他` 与 `印花` 之间摇摆，V2 需要明确“图案指整片重复纹样，局部刺绣/字母不算印花”。
3. `material` 容易输出长句；产品只把它当建议并截断 40 字，不影响入库，V2 要求“一个词”。
4. 4 张水洗标（V1）全部成功，单张 1.4–2.3s：手洗标→`cold`、40℃ 棉→`40`、30℃ 牛仔→`30`、白色印花→`30`；`tumbleDry` 有两张返回 `unknown`，与图标可读性有关，需正式 Ground Truth 再评。

**结论**：真实链路可用；正式准确率仍等 20 件标注图。
