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
| M1 仓库与脚手架 | Next.js 16 脚手架、Git 初始化、项目文档归档 | `a175885` | `README.md`、`AGENT-WORKFLOW.md` |
| M2 设计确认 | 8 页路由、跳转图、三态、权限矩阵；G1 确认 | `0bdde28` | [`DESIGN.md`](DESIGN.md) |
| M3 数据层与鉴权 | Prisma 四表、迁移、demo seed、注册/登录/退出、`/api/garments`、`/api/health`；15 项单测 | `d504665` | [`PRD.md`](PRD.md) F1/F4；`npm test` |
| M4 AI 建档 | Ark adapter、`json_schema`、失败降级、图片临时区、创建事务、详情/编辑/删除；20 项单测 | `ae45776` | [`AI-USAGE-LOG.md`](AI-USAGE-LOG.md) |
| M5 标签与扫码 | A4 24 格排版、canvas PNG、`/labels`、`/g/[token]`、6 事件、幂等、首页数据条；27 项单测 | `1ec6643` | [`DESIGN.md`](DESIGN.md) §7；CDP 手跑 canvas |
| M6 视觉与演示数据 | 全站三态、中文 404/error、详情双栏、扫码页窄屏、8 件模拟衣物；G5 确认 | `95c67f4` | `prisma/seed-demo.ts`、`prisma/demo-assets/`、`backup/screens/` |
| M7 测试与 Eval 脚手架 | 31 项单测、AI 失败用例、20 件衣物清单、8 张水洗标清单、Eval 报告与 AI 日志 | `3c0b02d` | [`EVAL-REPORT.md`](EVAL-REPORT.md)；`npm run eval:dry` |
| M8 真实 Ark + 压缩 | 关闭 `AI_MOCK`，7 张衣物 + 4 张水洗标共 11 次真实调用；上传压缩到 1440×1920；33 项单测 | `ee1bcfa` | [`EVAL-REPORT.md`](EVAL-REPORT.md) §8；`image-compress.ts` |
| M9 文档基线 | `AGENTS.md` 项目规则/文档分工、PRD、ARCHITECTURE、ITERATION_LOG、tasks 模板与待办；进度单一真源 | `4db2c75` | [`PRD.md`](PRD.md)、[`ARCHITECTURE.md`](ARCHITECTURE.md)、[`tasks/`](../tasks/) |

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

- Git：`de7288d`（feature）
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

- Git：`fbd2ee3`（feature）
- 任务：`tasks/006-garment-category-filter.md`
- 文档：[`DESIGN.md`](DESIGN.md) §3.4/§9/§10、[`PRD.md`](PRD.md) F4、[`ARCHITECTURE.md`](ARCHITECTURE.md) 组件/lib/列表数据流

### 验证

- `npm test` → **40 passed / 0 failed**（新增分类参数/派生/并集/空结果测试）。
- `npm run build` → **exit 0**；`/garments` 仍为 PPR。
- HTTP：全部分类计数与列表一致；单选每个类别只返回该类别；`裙装+连衣裙` 并集数量正确；`?category=马甲` 显示空态；未知分类按全部；未登录 `307 /login`。
- 浏览器（headless Chrome，390px）：`pageScrollWidth = 390` 无整页横向溢出；标签栏 `clientWidth 350 / scrollWidth 402`，`overflow-x:auto`；「全部」初始选中；点「上衣」→ URL 单参数、3 件；再加「裤装」→ 并集 5 件；浏览器返回恢复「上衣」3 件；点「全部」清空；刷新筛选 URL 保留筛选。
- 截图：`backup/screens/category-filter-390.png`。

---

## v0.4 · 隐私协议与用户协议静态页（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.4** |
| 类型 | feature |
| 状态 | 本地完成；未部署 |
| 时间 | 2026-10-20 |
| 范围 | 新增 `/legal/privacy`、`/legal/terms`；登录/注册页增加同意文案与链接 |

### 完成范围

- 两个法务静态页免登录访问，不读数据库、不依赖 session。
- 隐私协议覆盖：数据收集、用途、AI/第三方、保存期限、查询/更正/删除/导出路径、联系方式、备案说明。
- 用户协议覆盖：服务说明、账号、用户内容、使用规则、AI 限制、服务变更、责任框架、适用法律（待补充）。
- 两页均明确写：服务器位于香港、用户数据存储于香港、属于数据跨境传输。
- 主体全称、联系邮箱、生效日期、备案信息等未定内容以高亮「待补充」呈现，不编造主体或法律条款编号。
- 登录/注册页提交按钮下方增加：`注册或登录即表示你已阅读并同意《隐私协议》和《用户协议》`，两个书名号内分别链接对应页面。
- 页面按用户确认使用无条件的香港表述；当前实际仍未部署，部署状态另见 v0.1。

### 可追溯锚点

- Git：`d91e9b7`（feature）
- 任务：`tasks/007-legal-pages.md`
- 文档：[`PRD.md`](PRD.md) F7、[`DESIGN.md`](DESIGN.md) §1/§2/§3.9/§3.10/§5/§10、[`DECISIONS.md`](DECISIONS.md) D17、[`ARCHITECTURE.md`](ARCHITECTURE.md) 静态路由

### 验证

- `npm run build` → **exit 0**；`/legal/privacy`、`/legal/terms` 构建为静态页。
- `npm test` → **40 passed / 0 failed**（法务页未新增单测）。
- HTTP：未登录访问两页均 `200`，无 `Set-Cookie`；两页均含「服务器位于香港」「用户数据存储于香港」「数据跨境」；「待补充」分别出现 64 / 54 处；登录/注册页 HTML 含同意文案与两个链接。
- 浏览器（headless Chrome，390px）：`documentElement.scrollWidth = 390`，无整页横向溢出；从登录页点《隐私协议》进入后可「返回登录」；从注册页点《用户协议》进入后可「返回注册」。
- 截图：`backup/screens/legal-privacy-390.png`。

---

## v0.5 · 邮箱验证码注册与认证限流（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.5** |
| 类型 | feature |
| 状态 | 本地完成；未部署 |
| 时间 | 2026-10-20 |
| 范围 | 邮箱验证码注册、邮件 adapter（控制台模式）、发送/注册/登录限流与倒计时 |

### 完成范围

- 新增 `VerificationCode` 表与迁移 `20261020135803_add_verification_codes`：邮箱、scrypt 哈希、用途、过期时间、尝试次数、是否已用、创建时间、请求 IP，含邮箱/过期/IP 索引。
- 新增 `POST /api/auth/verification-code`：6 位码、10 分钟有效、同邮箱 60 秒冷却、邮箱 5 次/小时、IP 10 次/小时；只返回冷却/有效期，不返回验证码。
- 注册改为 `{ email, password, code }`：错误/过期/已用/尝试过多分别提示；正确后事务标记验证码已用 + 创建 `User` + 自动登录。
- 新增邮件 adapter：`src/lib/mail/`，当前只有 console 实现；production 拒绝 console，不打印明文码；真实服务商只留 `MAIL_*` 配置位。
- 登录改为邮箱与 IP 两个维度失败限流：邮箱 5 次/15 分钟、IP 20 次/15 分钟，429 带 `retryAfterSeconds`。
- 登录/注册页增加倒计时：发送按钮 60 秒、登录锁定按钮显示剩余秒数；注册限流也显示倒计时。
- 开发跳过开关 `REGISTER_SKIP_EMAIL_VERIFICATION=1`（仅 development；production 忽略；默认 0）。
- demo 账号未改 seed，正确密码仍可登录。

### 可追溯锚点

- Git：`6f26bfc`（feature）
- 任务：`tasks/008-email-verification-rate-limit.md`
- 文档：[`ARCHITECTURE.md`](ARCHITECTURE.md) 邮件/验证码/限流、[`DECISIONS.md`](DECISIONS.md) D18–D20、[`PRD.md`](PRD.md) F1、[`DESIGN.md`](DESIGN.md) §3.2/§3.3、`.env.example`

### 验证

- `npm test` → **49 passed / 0 failed**（新增限流与验证码规则测试）。
- `npm run build` → **exit 0**；`/api/auth/verification-code` 路由存在。
- 控制台模式：服务端日志出现 `[mail:console] ... code=xxxxxx`；数据库 `codeHash` 以 `scrypt$` 开头且不含明文。
- HTTP：第二次发送同邮箱 60 秒内 `429` 并返回剩余秒数（实测 46 秒）；错误码、过期码、已用码、尝试 5 次分别返回不同中文提示；正确码 `201` 并自动登录；demo 登录 `200`；登录第 6 次失败 `429` + 900 秒；同 IP 发码第 11 次 `429` + 剩余秒数。
- 跳过开关：development 下 `REGISTER_SKIP_EMAIL_VERIFICATION=1` 无验证码注册 `201`。
- 浏览器（390px）：注册页发送按钮显示 `重新发送（59s）`，提交后跳 `/garments`；登录锁定页按钮显示 `稍后重试（882s）`，无横向溢出。
- 截图：`backup/screens/register-code-390.png`、`backup/screens/login-lockout-390.png`。
- 测试用户与验证码已清理，未污染 demo 数据。

---

## v0.5.1 · 真实 163 SMTP 发信（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.5.1** |
| 类型 | feature |
| 状态 | 本地完成；未部署 |
| 时间 | 2026-10-20 |
| 范围 | 邮件 adapter 增加 SMTP 实现，接入 163 授权码 |

### 完成范围

- 新增 `src/lib/mail/smtp.ts`：基于 `nodemailer` 的 SMTP adapter；163 使用 `smtp.163.com:465` + SSL。
- 工厂支持 `MAIL_PROVIDER=console|smtp`；SMTP 缺配置返回 unavailable，接口 503；production 继续拒绝 console。
- `.env` 写入 SMTP 邮箱/授权码/发件人；授权码只存在本地 `.env`（Git 忽略），未进入代码、文档或日志。
- `.env.example` 增加 `MAIL_SMTP_HOST/PORT/SECURE/USER/PASS` 占位符。
- 注册页发送成功提示改为「验证码已发送，请查看邮箱」。

### 可追溯锚点

- Git：`9b2c1eb`（feature）
- 任务：`tasks/009-smtp-provider.md`
- 文档：[`ARCHITECTURE.md`](ARCHITECTURE.md) 邮件/env/依赖、[`DECISIONS.md`](DECISIONS.md) D20、[`PRD.md`](PRD.md) F1、[`DESIGN.md`](DESIGN.md) §3.3

### 验证

- `npm test` → **49 passed / 0 failed**；`npm run build` → **exit 0**。
- 真实 SMTP：向发件邮箱自身发送注册验证码，`POST /api/auth/verification-code` 返回 `200`，SMTP 已接受；服务端日志未打印验证码；测试验证码已从数据库删除。
- 安全：`git grep` 当前树未发现授权码；`.env` 被 `.gitignore` 忽略；`.env.example` 只有空占位符。

---

## v0.6 · 香港服务器上线（已完成）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.6** |
| 类型 | deploy |
| 状态 | **已上线** |
| 时间 | 2026-10-21 |
| 范围 | `mirrorwardrobe.dpdns.org` 部署：Node 24、Next 构建、pm2、Nginx 反代、Let's Encrypt |

### 完成范围

- 服务器安装 Node 24.18（`/opt/node-v24.18.0-linux-x64`）；应用目录 `/www/wwwroot/mirrorwardrobe`；生产库 `prisma/prod.db`。
- `npm ci`、`prisma migrate deploy`、demo seed 完成；Next 生产构建成功。
- pm2 进程 `mirrorwardrobe` 只监听 `127.0.0.1:3000`；`pm2-root` 已设开机自启。
- Nginx 新增独立 server block，HTTP 301 到 HTTPS，反代到 3000；证书由 Let's Encrypt 签发，`certbot.timer` 自动续期。
- 原有 Python 项目（Gunicorn/Postgres/Redis/Celery）与原有站点继续运行，未改配置/未重启。
- 部署前已备份 Nginx 配置到 `/root/deploy-backups/nginx-pre-mirrorwardrobe-20261021-070441.tar.gz`。

### 可追溯锚点

- 代码版本：`9b2c1eb`（SMTP adapter）
- 部署文档提交：`edfac7b`
- 任务：`tasks/001-deploy-g2.md`
- 文档：[`ARCHITECTURE.md`](ARCHITECTURE.md) 部署状态/环境、[`DECISIONS.md`](DECISIONS.md) D14、[`README.md`](../README.md) 线上地址

### 验证

- 外部 `web_fetch`：`https://mirrorwardrobe.dpdns.org/api/health` → `{"ok":true,"data":{"db":"up"}}`。
- 页面：`/`、`/login`、`/register`、`/legal/privacy`、`/legal/terms` 均 `200`；未登录 `/garments` → `307 /login`。
- demo 登录 `200`；8 件演示衣物；标签接口 `baseUrl=https://mirrorwardrobe.dpdns.org`。
- 生产 AI 上传：`200`，返回结构化建议；生产 SMTP 发码：`200`。
- 原有 `https://joint-poem.site/` 仍 `200`；Postgres/Redis/Gunicorn 进程未变。
- 资源：Next 常驻约 75 MB，内存可用约 1.1 GiB；pm2/证书续期已启用。
- **不自动同步**：本地提交/构建不会自动上线；后续部署需用户明确授权。

---

## v0.7 · 首页定位调整（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.7** |
| 类型 | feature |
| 状态 | 本地完成；未部署 |
| 时间 | 2026-11-10 |
| 范围 | 登录后直达 `/garments`；删除首页数据条/最近 4 件与 `/api/stats` |

### 完成范围

- 登录成功跳转 `/garments`（原代码已是此地址，本批复测未改）。
- 已登录访问 `/`：`proxy.ts` 按 session cookie 返回 `307 /garments`；游客无 cookie 继续看落地页。
- 首页改为纯游客落地页；删除数据条、最近 4 件、`Suspense`/Dashboard 与服务端聚合查询。
- 删除 `src/app/api/stats/route.ts`；`/api/stats` 变 `404`。
- 删除 `globals.css` 中已无引用的 `.stat-*` 样式。
- 游客首页新文案保持原样，等待用户提供；未自行改写。

### 可追溯锚点

- Git：`1107047`（feature）
- 任务：`tasks/011-home-redirect.md`
- 文档：[`PRD.md`](PRD.md) F2/F4、[`DESIGN.md`](DESIGN.md) §1/§2/§3.1/§4/§5/§10、[`ARCHITECTURE.md`](ARCHITECTURE.md) 路由/§5.6、[`DECISIONS.md`](DECISIONS.md) D21

### 验证

- `npm test` → **49 passed / 0 failed**；`npm run build` → **exit 0**；`/` 为静态页，`/api/stats` 已从构建清单消失。
- 游客无 cookie 访问 `/` → `200`，落地页正常，无数据条字符串。
- demo 登录 `200`；带有效 session cookie 访问 `/` → `307`，`Location: /garments`；`/garments` → `200`。
- `/api/stats` → `404`。
- 登录页源码仍为 `router.push("/garments")`。
- **未部署**；按规则不自动同步到云服务器。

---

## v0.8 · 扫码动作独立成功结果页（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.8** |
| 类型 | feature |
| 状态 | 本地完成；未部署 |
| 时间 | 2026-11-10 |
| 范围 | `/g/[token]/done` 成功页；动作接口 303 目标改为成功页 |

### 完成范围

- `/api/g/[token]/action` 成功/幂等时 303 到 `/g/[token]/done?event=<事件>&ts=<毫秒>`；失败仍回原扫码页错误提示。
- 新增免登录成功页：`状态记录成功！` + 衣物名称 + 当前状态；唯一按钮「点此关闭网页」。
- 直接访问、缺少/过期 `event/ts`、失效 token：中性「没有可显示的结果」，不显示成功文案与衣物名称。
- 关闭按钮先 `window.close()`；约 300ms 后仍在页面时，同按钮变「返回首页」并显示兜底文案。
- 扫码页删除原 `?done=` 同页成功提示；6 个按钮布局、事件类型、状态映射、30 秒幂等、免登录设计未变。
- 成功页作为扫码功能子页，不单独计入 10 页清单。

### 可追溯锚点

- Git：`35483da`（feature）
- 任务：`tasks/012-scan-success-page.md`
- 文档：[`PRD.md`](PRD.md) F6、[`DESIGN.md`](DESIGN.md) §2/§3.8、[`ARCHITECTURE.md`](ARCHITECTURE.md) 路由/§5.5

### 验证

- `npm test` → **49 passed / 0 failed**；`npm run build` → **exit 0**；构建包含 `/g/[token]/done`。
- HTTP：无登录 POST `STORED` → `303 /g/mMKHUlp7eAwR/done?event=STORED&ts=...`；成功页 `200`，包含成功文案、衣物名称、当前状态和关闭按钮。
- 直接 `/g/{token}/done`、仅带 `event` 不带 `ts`：中性页，不显示成功文案；刷新成功页不新增事件。
- 30 秒内重复提交：仍 303 成功页，事件总数不增加。
- 浏览器：成功页初始只有「点此关闭网页」；点击后（直接打开的标签页）无法关闭，按钮变为「返回首页」，兜底文案出现。
- 未部署；按规则不自动同步云服务器。

---

## v0.9 · 衣柜列表按穿着次数排序（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.9** |
| 类型 | feature |
| 状态 | 本地完成；未部署 |
| 时间 | 2026-11-10 |
| 范围 | `/garments` 列表固定排序：WORN 次数降序，次数相同按 `seq` 降序 |

### 完成范围

- 新增 `src/lib/garment-sort.ts`：纯函数按 WORN 事件数降序，次数相同按 `seq` 降序；0 次自然最后。
- `/garments` 在类别筛选之后排序（先过滤再排序）；无排序控件、无 URL 参数。
- `GET /api/garments` 保持 `seq` 倒序，`/labels` 选择列表不受影响。
- 新增单测覆盖次数降序、并列 seq 降序、0 次最后、不修改入参。

### 可追溯锚点

- Git：`ec98ac9`（feature）
- 任务：`tasks/013-garments-worn-sort.md`
- 文档：[`PRD.md`](PRD.md) F4、[`DESIGN.md`](DESIGN.md) §3.4、[`DECISIONS.md`](DECISIONS.md) D22

### 验证

- `npm test` → **53 passed / 0 failed**；`npm run build` → **exit 0**。
- 页面顺序与数据库 WORN 计数一致；同次数按 `seq` 降序；0 次最后。
- 类别筛选后仍按同一规则排序；页面无排序控件。
- `/labels` 使用的 `/api/garments` 返回顺序未改。
- 未部署；按规则不自动同步云服务器。

---

## v0.10 · 季节多选与季节筛选（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.10** |
| 类型 | feature |
| 状态 | 本地完成；未部署 |
| 时间 | 2026-11-10 |
| 范围 | 季节改多选春/夏/秋/冬 + 其他；`/garments` 增加季节筛选并与类别取交集 |

### 完成范围

- 新增 `src/lib/season.ts`：parse/serialize/format、旧值迁移、`seasonMatches`；SQLite 继续用逗号字符串。
- 迁移 `20261110234000_season_multi`：`春秋→春,秋`、`四季→春,夏,秋,冬`；其他值保持。
- AI schema 的 season 改为非空逗号组合 enum；prompts v1/v2、mock、Ground Truth 同步；旧值不再进入 AI 输出。
- 新增页季节改为多选 chips（春/夏/秋/冬/其他）；编辑表单同步；详情显示 `春、秋`，空值「其他」。
- `/garments` 类别栏下新增季节栏：多选并集、与类别交集、URL 重复 `season` 参数、保留另一组筛选；两栏样式一致。
- 增加 parse/serialize、交集、「其他」、旧值迁移单测。

### 可追溯锚点

- Git：`41be271`（feature）；组件清理提交随后
- 任务：`tasks/014-season-multi.md`
- 文档：[`PRD.md`](PRD.md) F3/F4、[`DESIGN.md`](DESIGN.md) §3.4/§3.5/§3.6/§10、[`DECISIONS.md`](DECISIONS.md) D23、[`ARCHITECTURE.md`](ARCHITECTURE.md) 数据模型/迁移、[`EVAL-REPORT.md`](EVAL-REPORT.md)、`prompts/`

### 验证

- `npm test` → **60 passed / 0 failed**；`npm run eval:dry` → 20 项清单有效；`npm run build` → **exit 0**。
- 迁移后 DB 序列为 `春,秋` / `春,夏,秋,冬` / `夏` / `秋`，无「春秋」「四季」。
- `/garments` 出现两排筛选栏；`?category=上衣&season=春` 返回 G002、G001（交集）。
- 临时把 G009 season 置空，`?season=其他` 只返回 G009；随后恢复为 `春,秋`。
- 新页有季节多选控件；详情 G001 显示 `春、秋`。
- 未部署；按规则不自动同步云服务器。

---

## v0.11 · 固定搭配（Outfits）（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.11** |
| 类型 | feature |
| 状态 | 本地完成；未部署 |
| 时间 | 2026-11-13 |
| 范围 | 新增 Outfit + OutfitItem 两张表；`/outfits`、`/outfits/[id]` 两个页面；搭配 CRUD API |

### 完成范围

- 新增 `Outfit`、`OutfitItem`；`position` 保存顺序，`(outfitId, garmentId)` / `(outfitId, position)` 唯一。
- 新增 `/outfits`（列表 + 页内新建）与 `/outfits/[id]`（详情/编辑/删除）；站点头部加入「搭配」。
- 新增 `GET/POST /api/outfits` 与 `GET/PATCH/DELETE /api/outfits/[id]`；全部按 userId 归属校验，越权 404。
- 名称 1–40 字；备注 0–200 字；衣物 1–4 件；第 5 件客户端阻止，服务端也拒绝。
- 列表/详情直接渲染最多 4 张衣物原图，不做拼图/分享/AI 推荐/批量记事件。
- 删除衣物时外键级联删除 `OutfitItem`，保留空搭配；衣物删除 API 返回受影响/变空数量，页面弹窗提示；空搭配页面显示补充提示。
- 空搭配可只改名/备注，也可补充衣物或删除。
- 新增 `tests/unit/outfits.test.ts`：件数上下限、重复、备注长度、删除影响、归属校验。

### 可追溯锚点

- Git：`e10148f`（feature）
- 任务：`tasks/015-outfits.md`
- 文档：[`PRD.md`](PRD.md) F8、[`DESIGN.md`](DESIGN.md) §1/§2/§3.11/§3.12、[`ARCHITECTURE.md`](ARCHITECTURE.md) §3/§4/§5.7、[`DECISIONS.md`](DECISIONS.md) D24

### 验证

- `npm test` → **67 passed / 0 failed**；`npm run build` → **exit 0**；构建包含 `/outfits`、`/outfits/[id]` 及两个 API。
- 本地 HTTP：创建 2 件搭配 201；列表/详情正确；0 件、5 件分别返回 400 中文提示。
- 更新名称/备注/换 1 件成功；另一账号访问详情返回 404。
- 临时衣物被搭配引用后删除：`outfitsAffected=1`、`outfitsEmptied=1`；搭配保留且 `itemCount=0`。
- 页面 HTML 包含「新建搭配」、名称、备注、原图 URL；导航包含 `/outfits`。
- 未部署；按规则不自动同步云服务器。

---

## v0.12 · 域名迁移到 mirrorwardrobe.xyz（部署基础设施，已完成）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.12（域名迁移）** |
| 类型 | infra |
| 状态 | 已上线；应用仍是 v0.6，未同步本地新功能 |
| 时间 | 2026-11-13 |
| 范围 | `mirrorwardrobe.dpdns.org` → `mirrorwardrobe.xyz`；旧域名关闭 |

### 完成范围

- Cloudflare NS 已接管 `mirrorwardrobe.xyz`，A 记录代理到源站 `103.133.178.145`。
- 上传 Cloudflare Origin Certificate 到 `/www/server/panel/vhost/cert/mirrorwardrobe.xyz/`，私钥 `600`。
- 新增 Nginx `mirrorwardrobe.xyz.conf`，反向代理到 `127.0.0.1:3000`。
- 更新服务器 `.env`：`APP_BASE_URL=https://mirrorwardrobe.xyz`；pm2 重启并加载。
- 旧域名 HTTP/HTTPS 均返回 `410 Gone`，不再代理到应用。
- 同步 README / ARCHITECTURE 当前部署信息；应用代码未重新部署。

### 可追溯锚点

- Git：`8c539a5`（域名迁移文档）
- 文档：[`README.md`](README.md)、[`ARCHITECTURE.md`](ARCHITECTURE.md) §8

### 验证

- `https://mirrorwardrobe.xyz/api/health` → `200 {"ok":true,"data":{"db":"up"}}`。
- `https://mirrorwardrobe.xyz/` 标题为「衣橱镜像 · 给现实衣柜建一份数字档案」。
- 新域名登录 `200`；标签接口 `baseUrl=https://mirrorwardrobe.xyz`。
- 旧域名 `https://mirrorwardrobe.dpdns.org/` 与 HTTP 均返回 `410`。
- 服务器 pm2 `mirrorwardrobe` online；Nginx 配置 `nginx -t` 通过。

---

## v0.13 · 上线 v0.7–v0.11 到云服务器（已完成）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.13（部署）** |
| 类型 | deploy |
| 状态 | **已上线** |
| 时间 | 2026-11-13 |
| 范围 | 把本地 v0.7–v0.11 功能上线；水洗标识别脚本不进产品 |

### 完成范围

- 部署代码版本 `3f83302`：首页定位、扫码成功页、穿着次数排序、季节多选、固定搭配、旧域名关闭。
- 停机备份：`/root/deploy-backups/mirrorwardrobe-pre-v0.11-20261113112641/`，含 `.env`、`prod.db`、部署前源码 tar。
- `prisma generate` + `prisma migrate deploy`：5 个迁移全部应用；`season_multi` 展开旧季节值，新建 `Outfit`/`OutfitItem`。
- 服务器重新 `npm run build`，pm2 启动 latest `.next`。
- Nginx 继续代理 `mirrorwardrobe.xyz` 到 `127.0.0.1:3000`；旧域名 410 保持。
- 水洗标脚本/报告仍在本地 `tests/eval/`，未进入产品运行时代码。

### 可追溯锚点

- Git：`fc71f53`（部署文档）
- 备份：`/root/deploy-backups/mirrorwardrobe-pre-v0.11-20261113112641/`
- 文档：[`README.md`](README.md)、[`ARCHITECTURE.md`](ARCHITECTURE.md) §8

### 验证

- `https://mirrorwardrobe.xyz/api/health` → `200 {"ok":true,"data":{"db":"up"}}`。
- 新域名 `/garments`、`/outfits`、`/g/[token]` 均 `200`；登录 `200`；已登录 `/` → `307 /garments`。
- 生产 DB：39 件衣物；季节已全部为逗号组合或空，无「春秋」「四季」；`Outfit` 当前 0 条。
- 生产环境创建 2 件搭配成功（201），删除成功；`/outfits` API 200。
- `/g/[token]` 200；直接访问成功页显示中性「没有可显示的结果」。
- 旧域名 HTTP/HTTPS 均 `410`。
- 服务器 pm2 online，内存可用约 1.0 GiB；本地 `npm test` 67 项、`npm run build` 通过。

---

## v0.14 · 邮箱验证码重置密码（已上线）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.14** |
| 类型 | feature |
| 状态 | 已上线 |
| 时间 | 2026-11-13 |
| 范围 | 登录页「忘记密码」内联面板；密码重置验证码与重置接口 |

### 完成范围

- 登录页新增「忘记密码？」内联面板，不新增页面；步骤：邮箱 → 验证码 → 新密码。
- 新增 `POST /api/auth/password-reset-code`：未注册邮箱也返回相同成功文案，不真正发信，避免邮箱枚举。
- 新增 `POST /api/auth/reset-password`：验证码校验 + 新密码 scrypt 哈希 + 事务标记验证码已用；成功后不自动登录。
- 复用 `VerificationCode` 表，purpose=`RESET_PASSWORD`；6 位码、10 分钟、最多 5 次尝试；邮件 adapter 支持重置密码邮件。
- 发送/提交均有独立限流；重置接口不泄露“邮箱不存在”和“验证码错误”的区别。
- 无数据库 schema 变更、无新页面。

### 可追溯锚点

- Git：`f1af94a`（feature）
- 备份：`/root/deploy-backups/mirrorwardrobe-pre-password-reset-20261113114911/`
- 文档：[`PRD.md`](PRD.md) F1、[`DESIGN.md`](DESIGN.md) §3.2、[`DECISIONS.md`](DECISIONS.md) D25、[`ARCHITECTURE.md`](ARCHITECTURE.md) §3/§5.1

### 验证

- 本地临时用户 + 预置 `RESET_PASSWORD` 验证码：重置 `200`；旧密码失效、新密码登录 `200`。
- 本地未注册邮箱请求验证码：`200` 统一文案；无邮件发送。
- 生产部署后：
  - `POST /api/auth/password-reset-code` 未知邮箱 → `200`
  - `POST /api/auth/reset-password` 无效验证码 → `400`
  - 登录页包含「忘记密码？」
  - `/api/health` → `200`
- 本地 `npm test` 67 项、`npm run build` 通过；服务器构建成功，pm2 online。
- 未做旧 session 主动失效（会话无版本字段），见 D25。

---

## v0.15 · 本地安全加固（已完成，仅本地）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.15** |
| 类型 | security |
| 状态 | 本地代码完成；服务器管理端口/权限已执行；应用加固未部署 |
| 时间 | 2026-11-15 |
| 范围 | 应用层安全头、CSRF、真实 IP、AI 限流、session 失效 |

### 完成范围

- `next.config.ts`：关闭 `x-powered-by`；增加 HSTS、nosniff、X-Frame-Options、Referrer-Policy、Permissions-Policy、CSP Report-Only。
- 所有登录态写接口补 `isSameOrigin`：garments/events/outfits/AI/logout。
- `getClientIp` 优先 `CF-Connecting-IP`，其次 `X-Real-IP`，最后才退化到 XFF。
- AI 接口按用户限流：10 次/分钟、100 次/小时。
- 内存限流 Map 设 10000 上限并清理过期项，避免唯一 key 膨胀。
- 新增 `User.sessionVersion` + 迁移；session cookie 带版本；重置密码递增版本，旧 cookie 立即失效。
- 新 session cookie 兼容旧 cookie（无 ver 按 0）。
- 服务器 UFW 收紧：只保留 22/80/443；删除 20/21/888/8888/13443/39000-40000/5432 的公网放行；`prisma/prod.db` 改 600，备份目录改 700。
- **应用安全改动尚未部署**；SSH 按用户要求不做。

### 可追溯锚点

- Git：`03f98b0`（安全加固）
- 任务：`tasks/017-security-hardening.md`
- 文档：[`DECISIONS.md`](DECISIONS.md) D26、[`PRD.md`](PRD.md) F1、[`DESIGN.md`](DESIGN.md) §3.2、[`ARCHITECTURE.md`](ARCHITECTURE.md) 数据模型/§5.1

### 验证

- `npm test` → **68 passed / 0 failed**；`npm run build` → **exit 0**。
- 本地响应头：HSTS、X-Content-Type-Options、X-Frame-Options、Referrer-Policy、Permissions-Policy、CSP Report-Only 均存在；无 `x-powered-by`。
- `Origin: https://evil.example` 调 `POST /api/outfits` → `403`。
- 登录用户调用 AI 接口：前 10 次进入校验，第 11 次 `429`。
- 临时用户重置密码后：旧 cookie `/api/auth/me` → `401`，新密码登录 → `200`。
- 服务器 UFW：外部 888/13443/5432 均不可达；22/80/443 正常；公网健康检查 200。
- **未执行**：SSH 调整、Cloudflare Origin Pulls、Nginx 边缘限流、应用安全改动上线；这些属于后续服务器/Cloudflare 阶段。

---

## v0.16 · 安全加固与已退出置底上线（已完成）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.16** |
| 类型 | security + feature |
| 状态 | **已上线** |
| 时间 | 2026-11-15 |
| 范围 | v0.15 安全加固 + 已退出衣物置底 |

### 完成范围

- 部署 v0.15 应用安全改动：安全响应头、CSRF 同源检查、Cloudflare 真实 IP、AI 用户限流、sessionVersion。
- `/garments` 排序改为：**已退出（RETIRED）置底；其余按 WORN 次数降序、次数相同按 seq 降序**。
- 数据库第 6 个迁移 `session_version` 已应用；旧 cookie 无 ver 按 0 兼容。
- UFW 仍只放行 22/80/443；DB 600、备份目录 700。
- Cloudflare Origin Pulls/边缘限流按用户要求不做；SSH 不改。

### 可追溯锚点

- Git：`b2c1731`（部署来源）
- 备份：`/root/deploy-backups/mirrorwardrobe-pre-v0.16-20261115061905/`
- 文档：[`README.md`](README.md)、[`ARCHITECTURE.md`](ARCHITECTURE.md) §8、[`PRD.md`](PRD.md) F4、[`DESIGN.md`](DESIGN.md) §3.4

### 验证

- `https://mirrorwardrobe.xyz/api/health` → `200`；登录 `200`；旧域名 `410`。
- 安全响应头已生效（HSTS/nosniff/X-Frame/Referrer/Permissions/CSP Report-Only）；无 `x-powered-by`。
- `Origin: https://evil.example` 调 `POST /api/outfits` → `403`。
- 生产 `/garments` 顺序以 `G008` 已退出结尾（最后一张），非退出衣物在前。
- 6 个迁移全部应用；pm2 online；构建成功。
- 本地 `npm test` 70 项、`npm run build` 通过。

---

## v0.17 · 已退出衣物 3 天后删除（本地完成，待部署）

| 项 | 值 |
| --- | --- |
| 版本 | **v0.17** |
| 类型 | feature |
| 状态 | 本地完成；待部署 |
| 时间 | 2026-11-15 |
| 范围 | 已退出保留 72 小时 + 每小时清理 |

### 完成范围

- `Garment.retiredAt` 字段与迁移；历史 RETIRED 从迁移时刻开始给 3 天保留期。
- SOLD/进入 RETIRED 时写入 `retiredAt`，其他状态动作清空。
- `scripts/purge-retired.mjs`：删除 `status=RETIRED` 且 `retiredAt<=now-72h` 的衣物；级联删除事件/标签/搭配项，并删除照片文件。
- `npm run cleanup:retired` 手动命令；支持 `--dry-run`。
- 已退出衣物仍在列表底部，满 72 小时后由每小时定时任务清理。

### 可追溯锚点

- Git：本次提交
- 任务：`tasks/019-retired-retention.md`
- 文档：[`PRD.md`](PRD.md) F4/F6、[`DESIGN.md`](DESIGN.md) §3.4、[`ARCHITECTURE.md`](ARCHITECTURE.md) 数据模型/清理、[`DECISIONS.md`](DECISIONS.md) D27

### 验证

- `npm test` → **72 passed / 0 failed**；`npm run build` → **exit 0**。
- 本地创建一条 `retiredAt` 为 4 天前的测试衣物，执行 `npm run cleanup:retired`：删除 1 条、照片文件删除、无失败。
- 定时任务部署后每小时运行一次；不依赖用户访问触发。

---

## 附：Git 历史重写记录（2026-10-20）

**原因**：提交 `751d46f`（重写后为 `ee1bcfa`）的 `.env.example` 含真实 `ARK_API_KEY` / `SESSION_SECRET`；同时赛题 docx 自首个提交起就在仓库里。仓库从未 push、无 remote，因此在首次推送前做了唯一一次干净重写。

**手段**：`git filter-branch --tree-filter`，对每个提交执行：
1. `/usr/bin/sed -i -E 's/^(ARK_API_KEY|SESSION_SECRET|MAIL_SMTP_PASS)=.*/\1=/' .env.example`
2. `rm -f *.docx`（赛题 docx 移入被忽略的 `private/`）

**结果**：全部提交哈希改变（旧哈希在任何工具里都已失效）；新 `master` 共 22 个提交，HEAD `fa6c7d2`。验证：新历史中非空密钥 **0 命中**、`.docx` **0 次出现**。

**锚点映射（旧 → 新）**，本文件其余位置的锚点已全部替换为新值：

| 旧 | 新 | 提交 |
| --- | --- | --- |
| `f95fdb6` | `a175885` | chore: initialize repository… |
| `072a31c` | `0bdde28` | docs: add Stage 1 design |
| `d7c8717` | `d504665` | feat(stage2)… |
| `43e1aea` | `ae45776` | feat(stage4)… |
| `e5abef6` | `1ec6643` | feat(stage5)… |
| `46253cf` | `95c67f4` | feat(stage6)… |
| `8df1531` | `3c0b02d` | test(stage7)… |
| `751d46f` | `ee1bcfa` | feat: compress uploads…（原泄露提交） |
| `6377690` | `4db2c75` | docs: establish PRD… |
| `8e3b1c7` | `2a89c26` | docs: record documentation baseline |
| `d03b303` | `f9dd417` | docs: tighten PRD scope |
| `c75cd62` | `de7288d` | feat: detail status actions |
| `042b249` | `e1fdfce` | docs: record v0.2 |
| `6ed80eb` | `fbd2ee3` | feat: category filter |
| `3930d51` | `f343d2a` | docs: record v0.3 |
| `1ae0e1d` | `d91e9b7` | feat: legal pages |
| `9bc452f` | `aa4b652` | docs: record v0.4 |
| `12dddf4` | `6f26bfc` | feat: email verification |
| `9abe416` | `faf8db0` | docs: record v0.5 |
| `f1fa421` | `9b2c1eb` | feat: SMTP adapter |
| `5086a80` | `7a06c68` | docs: record v0.5.1 |
| `344f421` | `fa6c7d2` | chore: move notice & work log to `private/` |

> 若在别处（截图、外部笔记、旧聊天记录）引用过旧哈希，需按上表对照。**注意：重写只是删掉仓库里的副本，不等于吊销密钥——旧 key 必须在火山方舟控制台确认删除。**

---

## 下一版本

未定。新版本发布前不在此预写计划；进行中的工作只在 `tasks/`。
