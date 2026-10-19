<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 项目规则

1. **不要修改上面 Next.js 块的内容**（`<!-- BEGIN:nextjs-agent-rules -->` 到 `<!-- END:nextjs-agent-rules -->`）。它由 `next dev` 生成/重写，改了也会被还原。
2. **进度只有一个真源**：进行中/待开始任务只写 `tasks/`；已完成版本只写 `docs/ITERATION_LOG.md`。`AGENT-WORKFLOW.md` 只保留流程与闸门，不再维护进度表。
3. **不编造原因**：无法从代码、文档或用户输入确定的动机/约束，写「待补充」，不要补一个看起来合理的理由。
4. **文档任务不改业务逻辑**：只做文档时，不改 `src/`、`prisma/`、`package.json` 的功能行为；需要改代码时先建 `tasks/` 任务并说明。
5. **密钥规则**：真实 key / session secret 只写 `.env` 或 `.env.local`（Git 忽略）；`.env.example` 只能放占位符；任何进入 Git 的密钥视为已泄露，需轮换。
6. **写 Next.js 代码前**先读 `node_modules/next/dist/docs/` 对应章节；不要按旧版本 API 猜。
7. **验证用行为**：HTTP、页面、单测、构建；不只比 diff/hash。
8. **不越过闸门**：部署、真实 key、真机打印/扫码等需要用户确认或实物的事项，先建/更新 `tasks/` 并向用户确认。

## 文档分工

| 文档 | 职责（只写这些） | 主要读者 |
| --- | --- | --- |
| `README.md` | 本地运行、命令、环境变量、目录入口 | 新开发者、使用者 |
| `AGENT-WORKFLOW.md` | 阶段流程、闸门、汇报格式、命令备忘；不写进度 | AI Agent、项目执行者 |
| `docs/PRODUCT.md` | 产品定义入口（目标用户/定位/竞品指向产品方案） | 产品、评审 |
| `docs/PRD.md` | 当前已实现功能规格 + 验收标准 | 产品、QA、开发 |
| `docs/ARCHITECTURE.md` | 当前技术快照：栈、目录、模块、数据流、AI 链路、依赖、限制 | 开发、运维 |
| `docs/DECISIONS.md` | 技术选型与“为什么”，硬参数与密钥规则 | 开发、评审 |
| `docs/DESIGN.md` | 页面路由、跳转、交互、三态、权限、标签规格 | 设计、开发 |
| `docs/ITERATION_LOG.md` | 已完成版本演进与可追溯锚点 | 所有人 |
| `tasks/` | 进行中/待开始/阻塞任务（字段见 `_template.md`） | AI Agent、项目执行者 |
| `docs/AI-USAGE-LOG.md` | AI 工具、关键提示词、过程、人工核查 | 比赛材料、评审 |
| `docs/EVAL-REPORT.md` | AI 准确率、数据集、失败模式、V1/V2 对比 | 技术评审、比赛材料 |
| `WEB_DEV_SKILL.md` | 工程规范：Git、设计先行、安全、部署、验证 | 开发 |
| `衣橱镜像-产品方案.md` | 产品定义、目标用户、比赛策略的原始来源 | 产品、组长 |

