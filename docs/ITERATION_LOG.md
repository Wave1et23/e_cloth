# 衣橱镜像 · 迭代日志

> **单一真源规则**：已完成进度只写在本文件；进行中/待开始任务只写在 `tasks/`。
> AI 调用过程与提示词迭代见 [`AI-USAGE-LOG.md`](AI-USAGE-LOG.md)；准确率结论见 [`EVAL-REPORT.md`](EVAL-REPORT.md)；功能验收见 [`PRD.md`](PRD.md)。

---

## v0.1 · 当前 MVP（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.1** |
| 类型 | MVP |
| 状态 | 本地完成；未部署 |
| 时间 | 2026-10-18 ～ 2026-10-19 |
| 范围 | 8 个页面、4 个核心功能、登录/注册/首页数据条 |
| 技术栈 | Next.js 16.4.2 + TypeScript + Prisma 6.19.3 + SQLite（详见 `ARCHITECTURE.md`） |

### 完成范围

- AI 拍照建档：上传 → 压缩 → Ark 建议 → 用户确认 → `Garment` + `Label`。
- 衣柜列表与详情：属性、状态、CPW、事件时间线、内联编辑、删除。
- 标签：A4 24 格、二维码 30mm/M、2480×3508 PNG、100mm 校验尺、浏览器下载。
- 免登录扫码页：6 事件、30 秒幂等、303 回跳、失效 token 友好页。
- 账号：邮箱 + 密码、签名 cookie session、scrypt、登录限流、退出。
- 首页：游客落地页；登录用户数据条 + 最近 4 件。
- 视觉/三态：暖色 tokens、加载/空/失败/不存在、移动端扫码页。

> 页面与接口的逐条验收标准见 [`PRD.md`](PRD.md)，不在本文件重复。

### 里程碑与可追溯锚点

| 里程碑 | 内容 | Git 锚点 | 其他锚点 |
| --- | --- | --- | --- |
| M1 仓库与脚手架 | Next.js 16 脚手架、Git 初始化、项目文档归档 | `f95fdb6` | `README.md`、`AGENT-WORKFLOW.md` |
| M2 设计确认 | 8 页路由、跳转图、三态、权限矩阵；G1 确认 | `072a31c` | [`DESIGN.md`](DESIGN.md) |
| M3 数据层与鉴权 | Prisma 四表、迁移、demo seed、注册/登录/退出、`/api/garments`、`/api/health`；15 项单测 | `d7c8717` | [`PRD.md`](PRD.md) F1/F4；`npm test` |
| M4 AI 建档 | Ark adapter、`json_schema`、失败降级、图片临时区、创建事务、详情/编辑/删除；20 项单测 | `43e1aea` | [`AI-USAGE-LOG.md`](AI-USAGE-LOG.md) |
| M5 标签与扫码 | A4 24 格排版、canvas PNG、`/labels`、`/g/[token]`、6 事件、幂等、首页数据条；27 项单测 | `e5abef6` | [`DESIGN.md`](DESIGN.md) §7；CDP 手跑 canvas |
| M6 视觉与演示数据 | 全站三态、中文 404/error、详情双栏、扫码页窄屏、8 件模拟衣物；G5 确认 | `46253cf` | `prisma/seed-demo.ts`、`prisma/demo-assets/`、`backup/screens/` |
| M7 测试与 Eval 脚手架 | 31 项单测、AI 失败用例、20 件衣物清单、8 张水洗标清单、Eval 报告与 AI 日志 | `8df1531` | [`EVAL-REPORT.md`](EVAL-REPORT.md)；`npm run eval:dry` |
| M8 真实 Ark + 压缩 | 关闭 `AI_MOCK`，7 张衣物 + 4 张水洗标共 11 次真实调用；上传压缩到 1440×1920；33 项单测 | `751d46f` | [`EVAL-REPORT.md`](EVAL-REPORT.md) §8；`image-compress.ts` |

### 验证证据（v0.1）

- 单元测试：`npm test` → **33 passed / 0 failed**。
- 构建：`npm run build` → **exit 0**（`/` 与 `/g/[token]` 为 PPR，`/labels` 静态，proxy 生效）。
- HTTP 冒烟：注册 `201`、登录 `200`、未登录 `/garments` `307`、未登录 `/api/garments` `401`、`/api/health` `{db:"up"}`。
- 扫码链路：`WORN` → `303` + 状态 `WORN`；30 秒内重复 → 事件不增加；`WASHED` → `TO_WASH`。
- 标签：headless Chrome 实际生成 2480×3508 PNG（data URL 266KB），无 JS 错误，含 100mm 校验尺。
- 真实 AI：7 张衣物 2.2–2.7s、4 张水洗标 1.4–2.3s，全部返回结构化 JSON；**未计算正式准确率**。
- 图片压缩：4000×3000 → 1440×1080（9KB 测试图）；1280×1280 真图 218KB → 166KB。
- 演示数据：8 件「演示·」衣物，图片与备注均标注模拟数据。

### v0.1 不包含（已转 tasks/）

- 正式部署（域名 / Nginx / pm2 / HTTPS）→ `tasks/001-deploy-g2.md`
- 20 件衣物正式 Eval 准确率 → `tasks/002-ai-eval-g3-g6.md`
- 真实打印、裁剪、贴衣架、手机/微信扫码 → `tasks/003-print-scan-g4.md`

---

## 下一版本

未定。新版本发布前不在此预写计划；进行中的工作只在 `tasks/`。
