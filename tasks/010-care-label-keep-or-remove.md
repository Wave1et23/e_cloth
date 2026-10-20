# 010 · 水洗标识别：保留 / 做进产品 / 移除（待定）

- **状态**：待定（等组内讨论，暂不动代码）
- **版本**：未定
- **类型**：决策（decision）
- **对应 task**：`tasks/010-care-label-keep-or-remove.md`
- **改了什么**：**当前没有任何改动**。曾经在 v0.6 执行过一次「移除」，因需先与组员讨论，**已回退**——工作区回到移除前状态，`prompts/care-label-v1/v2.md`、`tests/eval/run-care-label.ts`、`try-care.ts`、`care-label-ground-truth.json`、`tests/eval/care-images/`（4 张实拍图）全部复位，`package.json` 三个脚本与 `.gitignore` 规则也已恢复。
- **为什么**：产品只保留 4 个功能 / 8 个页面，而水洗标链路对核心假设（扫码记录成本是否低于手动记录）没有贡献，却占用开发与维护量。是否值得保留需由团队决定，不由实现方单方面决定。
- **怎么验证的**：回退后 `git status` 只剩组员自己的既有改动（赛题 docx 修改 + 未跟踪的 `开发随记.txt`），无其他残留。

## 三个选项与代价

| 选项 | 做法 | 代价 | 收益 |
| --- | --- | --- | --- |
| **A. 保持现状（推荐）** | 只留离线实验：`prompts/care-label-v1/v2.md` + `tests/eval/run-care-label.ts`，不进产品界面 | 零改动；平时不占开发时间 | 答辩可讲「做过第二条链路、知道它的边界，但刻意没放进产品」；不增加产品复杂度 |
| **B. 做进产品（最小入口）** | 新增 `POST /api/ai/care-label` + `Garment.careNote` 文本字段 + 新增衣物页「可选拍水洗标」+ 详情页展示 | 约 0.5–1 天；需改 `DECISIONS`（D12 需重写）、`PRD`、`DESIGN`、`ARCHITECTURE` | 演示时多一个「AI 识别」触点，对「产品内 AI 功能」这类评分略有利 |
| **C. 彻底移除** | 见下方「预置移除清单」 | 约 2 小时（已验证过一次） | 活动树更干净；少一处长期维护点 |

> 建议：**A**。若为了比赛演示想多一个 AI 触点，选 **B 但只做最小入口**，不要做「洗衣时弹护理提醒」（那是当初砍掉的主要成本，且演示几乎不会触发）。

## 若最终决定 C：预置移除清单（已实测可行）

1. 归档到 `archive/care-label/`（**不要物理删除**）：`prompts/care-label-v1/v2.md`、`tests/eval/run-care-label.ts`、`try-care.ts`、`care-label-ground-truth.json`、`tests/eval/care-images/`
2. 移除 `package.json` 的 `eval:care:dry`、`eval:care`、`try:care`
3. 移除 `.gitignore` 的 `/tests/eval/care-images/*` 与 `!/tests/eval/care-images/README.md`
4. **必须同时**在 `tsconfig.json` 的 `exclude` 和 `eslint.config.mjs` 的 `globalIgnores` 加入 `archive`（或用 `archive` 外的路径），否则归档的 `.ts` 会被类型检查——
   实测报错：`archive/care-label/eval/*.ts TS2307: Cannot find module '../../src/lib/images.ts'`，直接导致 `npm run build` 失败
5. 在 `.gitignore` 增加 `/archive/care-label/images/*` 保留实拍图不进 Git
6. 同步文档：`README.md`、`tests/eval/README.md`、`docs/EVAL-REPORT.md`（§6 与 §8 第 4 点）、`docs/AI-USAGE-LOG.md`、`docs/DECISIONS.md`（D12 + 目录树）、`docs/ARCHITECTURE.md`、`AGENT-WORKFLOW.md`（废弃表 / Stage 7 / G3 闸门）、`tasks/002`、并在 `docs/ITERATION_LOG.md` 记一个版本
7. 验收：`npm test`（应 49 passed）、`npm run build` exit 0、`npm run eval:dry` exit 0

## 影响哪些文档

`docs/DECISIONS.md`（D12）、`docs/EVAL-REPORT.md`、`docs/AI-USAGE-LOG.md`、`docs/PRD.md`（F2 AI 建档范围）、`docs/ARCHITECTURE.md`、`README.md`

## 已知限制

- 正式 8 张水洗标 Eval **从未执行**；现有只有 2026-10-19 的 4 张试跑（记录在 `docs/EVAL-REPORT.md` §8），不能当正式准确率
- `prompts/care-label-v2.md` 仍是候选版，未根据失败样本定稿
- 4 张实拍图在本地 `tests/eval/care-images/`，不进 Git；换机器需单独拷贝
