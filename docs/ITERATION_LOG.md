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
| M9 文档基线 | `AGENTS.md` 项目规则/文档分工、PRD、ARCHITECTURE、ITERATION_LOG、tasks 模板与待办；进度单一真源 | `6377690` | [`PRD.md`](PRD.md)、[`ARCHITECTURE.md`](ARCHITECTURE.md)、[`tasks/`](../tasks/) |

### 验证证据（v0.1）

- 单元测试：`npm test` → **33 passed / 0 failed**。
- 构建：`npm run build` → **exit 0**（`/` 与 `/g/[token]` 为 PPR，`/labels` 静态，proxy 生效）。
- HTTP 冒烟：注册 `201`、登录 `200`、未登录 `/garments` `307`、未登录 `/api/garments` `401`、`/api/health` `{db:"up"}`。
- 扫码链路：`WORN` → `303` + 状态 `WORN`；30 秒内重复 → 事件不增加；`WASHED` → `TO_WASH`。
- 标签：headless Chrome 实际生成 2480×3508 PNG（data URL 266KB），无 JS 错误，含 100mm 校验尺。
- 真实 AI：7 张衣物 2.2–2.7s、4 张水洗标 1.4–2.3s，全部返回结构化 JSON；**未计算正式准确率**。
- 图片压缩：4000×3000 → 1440×1080（9KB 测试图）；1280×1280 真图 218KB → 166KB。
- 演示数据：8 件「演示·」衣物，图片与备注均标注模拟数据。
- 文档：PRD/ARCHITECTURE/ITERATION_LOG/tasks 建立；相对链接检查 0 broken；`AGENTS.md` 的 Next 块未改动。

### v0.1 不包含（已转 tasks/）

- 正式部署（域名 / Nginx / pm2 / HTTPS）→ `tasks/001-deploy-g2.md`
- 20 件衣物正式 Eval 准确率 → `tasks/002-ai-eval-g3-g6.md`
- 真实打印、裁剪、贴衣架、手机/微信扫码 → `tasks/003-print-scan-g4.md`
- 已进入 Git 历史的 `ARK_API_KEY` / `SESSION_SECRET` 轮换 → `tasks/004-rotate-secrets.md`

---

## v0.2 · 详情页登录态「修改状态」（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.2** |
| 类型 | feature |
| 状态 | 本地完成；未部署 |
| 时间 | 2026-10-20 |
| 范围 | 详情页新增「状态记录」卡片：登录态补记 6 个事件 |

### 完成范围

- `/garments/[id]` 增加「修改状态」按钮，展开 6 个动作，文案/顺序与扫码页共用 `EVENT_VALUES`。
- 新增 `POST /api/garments/[id]/events`：登录 + `userId` 归属校验，30 秒内同事件幂等，事务写 `GarmentEvent` + `Garment.status`。
- 提交后 `router.refresh()` 刷新详情页状态与时间线；返回首页/刷新首页时数据条同步。
- 未改扫码页 `/g/[token]` 的行为、URL、样式；未改 5 状态/6 事件映射。

### 可追溯锚点

- Git：`c75cd62`（feature）
- 任务：`tasks/005-detail-status-actions.md`
- 文档：[`DESIGN.md`](DESIGN.md) §2/§3.6/§4/§5/§10、[`PRD.md`](PRD.md) F4、[`ARCHITECTURE.md`](ARCHITECTURE.md) API/数据流

### 验证

- `npm test` → **35 passed / 0 failed**（新增动作顺序/文案测试）。
- `npm run build` → **exit 0**；新增 `/api/garments/[id]/events` 路由。
- HTTP：同一动作连续两次 → `duplicate:false` 后 `duplicate:true`，事件数仍 1；`WASHED` → `TO_WASH`；`/api/stats` 月穿着/在柜数随之变化。
- 浏览器（headless Chrome）：详情页展开按钮顺序为「今天穿了 / 要洗 / 送干洗 / 放回衣柜 / 收起来 / 卖掉了」；点击后显示「已记录 ✓ 当前状态：穿着中」，时间线出现新事件。
- 未登录访问详情页仍 `307 /login`。

---

## v0.3 · 衣柜列表分类筛选（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.3** |
| 类型 | feature |
| 状态 | 本地完成；未部署 |
| 时间 | 2026-10-20 |
| 范围 | `/garments` 顶部横向分类标签栏：多选筛选，默认全部 |

### 完成范围

- 分类来源为当前衣物已有的 `category`；已知分类按 `CATEGORY_OPTIONS` 顺序，未知分类排后。
- 标签栏横向滚动、不换行；「全部」固定第一项，选中它清空其他项；单选/多选并集/再次点击取消。
- URL 用重复 `category` 参数：`/garments?category=上衣&category=裤装`；全部 = 无参数。
- 服务端读取 `searchParams` 后在已取回的 200 条内过滤；排序、200 条上限、卡片结构不变；`GET /api/garments` 未改。
- 筛选结果为空时显示「这个分类下还没有衣物」+「查看全部」；本来没有衣物时保留「衣柜还是空的」。
- 刷新策略按用户确认的选项 A：无参数进入默认全部；刷新保留当前 URL 筛选。

### 可追溯锚点

- Git：`6ed80eb`（feature）
- 任务：`tasks/006-garment-category-filter.md`
- 文档：[`DESIGN.md`](DESIGN.md) §3.4/§9/§10、[`PRD.md`](PRD.md) F4、[`ARCHITECTURE.md`](ARCHITECTURE.md) 组件/lib/列表数据流

### 验证

- `npm test` → **40 passed / 0 failed**（新增分类参数/派生/并集/空结果测试）。
- `npm run build` → **exit 0**；`/garments` 仍为 PPR。
- HTTP：全部分类计数与列表一致；单选每个类别只返回该类别；`裙装+连衣裙` 并集数量正确；`?category=马甲` 显示空态；未知分类按全部；未登录 `307 /login`。
- 浏览器（headless Chrome，390px）：`pageScrollWidth = 390` 无整页横向溢出；标签栏 `clientWidth 350 / scrollWidth 402`，`overflow-x:auto`；「全部」初始选中；点「上衣」→ URL 单参数、3 件；再加「裤装」→ 并集 5 件；浏览器返回恢复「上衣」3 件；点「全部」清空；刷新筛选 URL 保留筛选。
- 截图：`backup/screens/category-filter-390.png`。

---

## 下一版本

未定。新版本发布前不在此预写计划；进行中的工作只在 `tasks/`。
