# 衣橱镜像 · 架构快照

> 版本：v0.1 ｜ 快照日期：2026-10-19
> 本文只描述**当前代码的真实结构**（栈、目录、模块、数据流、依赖、限制）。
> “为什么选它 / 为什么砍掉某个方案”见 [`DECISIONS.md`](DECISIONS.md)；页面交互见 [`DESIGN.md`](DESIGN.md)；功能验收见 [`PRD.md`](PRD.md)。

---

## 1. 技术栈（当前锁定版本）

| 层 | 技术 / 版本 | 在代码中的位置 |
| --- | --- | --- |
| 运行时 | Node.js 24.18.0、npm 11.16.0 | 本地开发环境 |
| 框架 | Next.js 16.4.2（App Router + Turbopack） | `next.config.ts`、`src/app/` |
| UI | React 19.3、Tailwind CSS 4（`@tailwindcss/turbopack`） | `src/app/**/*.tsx`、`globals.css` |
| 语言 | TypeScript 5 | 全仓 |
| 数据库 | SQLite（`prisma/dev.db`） | `prisma/schema.prisma` |
| ORM | Prisma 6.19.3（`prisma` / `@prisma/client` 同版本） | `src/lib/db.ts` |
| 视觉模型 | 豆包 `doubao-seed-2-1-lite-260915`（火山方舟 Ark，OpenAI 兼容） | `src/lib/ai/vision.ts` |
| 二维码 | `qrcode` 1.5.4 | `src/lib/label/render.ts` |
| 图片处理 | `sharp` 0.35.5 | `src/lib/image-compress.ts` |
| 测试 | Node 24 原生 `node --test` + `.ts` 类型剥离 | `tests/unit/` |

Next 配置开启 `cacheComponents: true` 与 `partialPrefetching: true`；CSS 由 Turbopack 的 Tailwind loader 处理。

---

## 2. 运行时拓扑

```text
浏览器（手机 / 桌面）
  │  HTTPS/HTTP
  ▼
Next.js 16 单体应用（App Router）
  ├─ proxy.ts                 乐观鉴权：/garments*、/labels 无 session cookie → 307 /login
  ├─ React Server Components  页面查询（首页、列表、详情、扫码页）
  ├─ Client Components        表单、标签 canvas、编辑/删除、状态补记、AI 上传
  ├─ Route Handlers (/api/*)  CRUD、鉴权、AI、扫码动作
  ├─ Prisma Client            SQLite 读写
  └─ 本地文件系统             uploads/tmp、uploads/garments
        │
        ├─ 火山方舟 Ark（外部 HTTPS）：/chat/completions
        └─ 手机系统相机：只负责扫二维码，打开 /g/{token}
```

当前没有独立后端、没有消息队列、没有对象存储、没有多实例。
两个法务页为纯静态内容，不读数据库、不要求登录；登录/注册页只增加指向它们的链接。

---

## 3. 目录与模块

```text
src/
├── proxy.ts                      乐观鉴权（只查 cookie 是否存在）
├── app/
│   ├── layout.tsx                metadata / viewport / 全局样式入口
│   ├── globals.css               暖色 tokens + 组件级 CSS
│   ├── page.tsx                  首页：Suspense 内读 session，游客落地页 / 登录用户数据条
│   ├── error.tsx / not-found.tsx 全局中文错误/404
│   ├── login/page.tsx            登录表单（client）
│   ├── register/page.tsx         注册表单（client）
│   ├── garments/
│   │   ├── page.tsx              列表（server，instant=false）
│   │   ├── loading.tsx / error.tsx
│   │   ├── new/page.tsx          新增衣物（client，上传 + AI + 确认）
│   │   └── [id]/
│   │       ├── page.tsx          详情（server，instant=false）
│   │       ├── loading.tsx / error.tsx
│   ├── labels/page.tsx           标签选择 + canvas 生成（client）
│   ├── g/[token]/page.tsx        免登录扫码页（server，instant=false）
│   ├── legal/privacy/page.tsx    隐私协议（静态，免登录）
│   ├── legal/terms/page.tsx      用户协议（静态，免登录）
│   └── api/
│       ├── auth/{register,login,logout,me}/route.ts
│       ├── auth/verification-code/route.ts 发送邮箱验证码
│       ├── garments/route.ts              GET 列表 / POST 创建
│       ├── garments/[id]/route.ts         GET / PATCH / DELETE
│       ├── garments/[id]/events/route.ts  登录态补记状态（30s 幂等）
│       ├── garments/[id]/photo/route.ts   登录态照片
│       ├── ai/garment/route.ts            上传 + 压缩 + AI 建议
│       ├── labels/route.ts                标签 token/baseUrl
│       ├── g/[token]/action/route.ts       扫码动作（303 + 幂等）
│       ├── g/[token]/photo/route.ts        token 照片
│       ├── stats/route.ts                 首页聚合
│       └── health/route.ts                数据库连通
├── components/
│   ├── site-header.tsx、logout-button.tsx
│   ├── garment-category-filter.tsx 列表分类标签栏（横向滚动/多选）
│   ├── garment-actions.tsx       详情页内联编辑/删除
│   └── garment-status-actions.tsx 详情页登录态补记状态（6 动作）
└── lib/
    ├── auth/                     密码 scrypt、session HMAC、getCurrentUser
    ├── mail/                     MailAdapter 接口、console/SMTP 实现、工厂
    ├── verification.ts           验证码生成/格式/有效期/尝试次数（纯函数）
    ├── verification-store.ts     验证码表读写、哈希、惰性清理
    ├── ai/                       Ark adapter、json_schema、归一化
    ├── label/                    排版数学（纯函数）、canvas 渲染（浏览器）
    ├── image-compress.ts         sharp 压缩
    ├── images.ts                 魔数、临时区、正式区、读/删/清理
    ├── garments.ts               衣物字段校验
    ├── garment-fields.ts         枚举白名单（前后端/AI 共用）
    ├── garment-filter.ts         列表分类参数/派生/过滤（纯函数）
    ├── status.ts                 5 状态 / 6 事件映射
    ├── cost.ts                   CPW / 金额格式化 / 价格解析
    ├── token.ts                  12 位 base62
    ├── scan.ts                   扫码幂等判断
    ├── rate-limit.ts             单进程内存限流
    ├── http.ts                   API envelope / JSON 解析 / IP / 同源
    ├── validation.ts             邮箱/密码/文本长度
    ├── client-api.ts             前端统一请求封装
    ├── db.ts                     Prisma 单例
    └── session-cookie.ts         cookie 名常量（proxy 共用）
```

`prisma/`：`schema.prisma`、迁移、`seed.ts`（demo 账号）、`seed-demo.ts`（8 件模拟衣物）、`demo-assets/`（模拟图片）。
`tests/unit/`：单测；`tests/eval/`：Eval 清单与脚本，图片目录不入 Git。
`prompts/`：`garment-v1/v2`、`care-label-v1/v2`。

---

## 4. 数据模型

SQLite，五张表；状态/事件用 String 存，取值由 `src/lib/status.ts` 约束。

```text
User 1 ── n Garment 1 ── n GarmentEvent
                 └──── 1 Label

VerificationCode（独立表，无外键）
```

| 表 | 关键字段 | 约束/索引 |
| --- | --- | --- |
| `User` | `id`(cuid)、`email`、`passwordHash`、`createdAt` | `email` unique |
| `Garment` | `id`、`userId`、`seq`、`name`、`category`、`primaryColor`、`pattern`、`fit`、`season`、`style`、`material`、`brand`、`priceCents`、`purchaseDate`、`notes`、`photoPath`、`status`、`createdAt`、`updatedAt` | `@@index([userId, createdAt])`、`@@unique([userId, seq])` |
| `GarmentEvent` | `id`、`garmentId`、`type`、`createdAt` | `@@index([garmentId, createdAt])` |
| `Label` | `id`、`garmentId`、`token`、`createdAt` | `garmentId` unique、`token` unique |
| `VerificationCode` | `id`、`email`、`codeHash`、`purpose`、`expiresAt`、`attempts`、`used`、`createdAt`、`requestIp` | `@@index([email, purpose, used, createdAt])`、`@@index([expiresAt])`、`@@index([requestIp, createdAt])` |

- `brand` 默认 `uncertain`，业务代码创建时也强制写 `"uncertain"`。
- `priceCents` 用整数分，避免浮点误差；展示时除 100。
- `seq` 按用户递增，展示为 `G001`；唯一约束 `(userId, seq)` 防止并发重复。
- 删除 `Garment` 时级联删除 `GarmentEvent` / `Label`；照片文件由接口额外删除。
- 验证码只存 scrypt 哈希；用途当前固定 `REGISTER`；过期/24 小时前已使用的记录在发送新码时惰性删除。
- 没有 `Session` 表、没有 `Wardrobe` 表。

---

## 5. 关键数据流

### 5.1 注册 / 登录 / 会话

1. `POST /api/auth/verification-code` 校验邮箱与限流 → 生成 6 位码 → 作废旧码、写哈希 → 邮件 adapter 发送（console 打日志 / SMTP 真发）。
2. `POST /api/auth/register` 校验邮箱/密码/限流 → 校验最新验证码（错误/过期/已用/次数）→ scrypt 哈希密码 → 事务：标记验证码已用 + 创建 `User` → 写签名 cookie。
3. `POST /api/auth/login` 按邮箱与 IP 两个维度检查失败锁定 → 查 `User` → `scrypt` 校验 → 成功后清邮箱维度并写 cookie。
4. `getCurrentUser()`：`await connection()` → 读 cookie → HMAC/过期校验 → 查 `User`。
5. `proxy.ts` 只做乐观检查：没有 cookie 就 307；签名/用户有效性仍由页面/接口校验。

### 5.2 AI 拍照建档

```text
选择照片（client）
  → POST /api/ai/garment (multipart)
     → 登录校验
     → 文件 ≤10MB + 魔数 JPG/PNG
     → sharp：旋正 / ≤1440×1920 / JPEG q82 / 白底
     → 写 uploads/tmp/<userId>/<token>，返回 imageToken
     → 可选调用 Ark；失败仍返回 200 + imageToken
  → 用户确认字段（低置信度 <0.7 不预填）
  → POST /api/garments (JSON + imageToken)
     → move 临时图到 uploads/garments/<uuid>.jpg
     → 事务：Garment + Label(token)
     → 返回 { id, seq, code:"G001" }
```

- AI 永远不写库；`POST /api/garments` 是唯一建档写入口。
- 创建失败会删除已移动的照片，避免孤儿文件。

### 5.3 列表 / 详情 / 编辑 / 删除

- 列表：页面 `prisma.garment.findMany({ userId, orderBy: seq desc, take: 200 })`；分类筛选从 `searchParams` 读取重复 `category`，在已取回的 200 条内派生分类并过滤。`GET /api/garments` 保持无参数、返回全量，供标签页等复用。
- 详情：`findFirst({ id, userId })` + `events`（最多 100）+ `label.token`。
- 编辑：`PATCH /api/garments/[id]`，字段校验后 `update`。
- 补记状态：`POST /api/garments/[id]/events`，登录 + `userId` 归属校验；复用 `isDuplicateScan()` 做 30 秒幂等；非重复时事务写 `GarmentEvent` 并更新 `Garment.status`。扫码接口保持不变。
- 删除：`DELETE /api/garments/[id]`，先查归属，再删数据库（级联），最后删照片。
- 所有查询都带 `userId`；越权返回 404。

### 5.4 标签生成

```text
/labels（client）
  → GET /api/garments 取列表，默认选 IN_CLOSET，最多 24
  → GET /api/labels?ids=... 取 token/baseUrl（缺 Label 时补建）
  → 动态 import render.ts
  → qrcode 生成 data URL
  → canvas 2480×3508：4×6 格、QR 30mm、8pt 文字、100mm 尺
  → toDataURL('image/png') → 下载
```

服务端只提供数据和 token；排版/合成全在浏览器，避免服务端中文字体与 canvas 依赖。

### 5.5 免登录扫码

```text
手机相机扫二维码 → /g/{token}（无登录）
  → 查 Label→Garment，只返回 name/status/photo
  → 6 个原生 form POST /api/g/[token]/action
     → 限流 20/min（IP+token）
     → 查 label/garment
     → 最近一次事件若同类型且 <30s → 不写，直接 303 done
     → 事务：GarmentEvent + Garment.status
     → 303 /g/{token}?done=<type>
```

### 5.6 首页数据条

`/` 在 `Suspense` 内读取 session；登录用户通过 Prisma 聚合：
- 本月 `WORN` 事件数；
- `IN_CLOSET` 件数；
- 有价格且有 `WORN` 记录的衣物平均 CPW；
- 最近 4 件（`seq` 倒序）。

---

## 6. AI 链路细节

| 项 | 当前实现 |
| --- | --- |
| 接口 | `POST ${ARK_BASE_URL}/chat/completions` |
| 鉴权 | `Authorization: Bearer ${ARK_API_KEY}` |
| 模型 | `ARK_MODEL`，默认 `doubao-seed-2-1-lite-260915` |
| 输入 | 压缩后的 JPEG，base64 `data:` URL |
| 输出模式 | `response_format: json_schema`，`strict: true` |
| 深度思考 | 请求体显式 `thinking: { type: "disabled" }` |
| 超时 | 20s（`AbortSignal.timeout`） |
| 重试 | 最多 2 次尝试（1 次重试）；401/403/400 不重试 |
| 失败返回 | `AI_NOT_CONFIGURED`（无 key）或 `AI_UNAVAILABLE`；不抛异常 |
| 归一化 | 白名单枚举；非法字段置 null、置信度 0；`brand` 恒 `uncertain`；`material` 截 40 字 |
| 置信度阈值 | 6 个枚举字段 `<0.7` 不预填并标黄；`material` 是建议字段，低置信度仍可能预填但标黄 |
| Mock | `AI_MOCK=1` 返回固定建议，不调 Ark |
| 调用计数 | 模块级内存计数；超过 `AI_CALL_BUDGET` 只打 warning |
| Prompt | 运行时常量在 `vision.ts`；版本化文本在 `prompts/garment-v1.md`、`v2` |

---

## 7. 文件存储

| 区域 | 路径 | 说明 |
| --- | --- | --- |
| 临时图 | `uploads/tmp/<userId>/<32hex>` | 上传后、确认入柜前；24 小时未用会在下次上传时清理 |
| 正式图 | `uploads/garments/<uuid>.jpg` | 入柜后；对外只通过带鉴权/ token 的 Route Handler 读取 |
| 演示图 | `prisma/demo-assets/garment-*.png` | 8 件模拟数据，seed 时复制到 uploads |

- `uploads/` 与 `backup/` 都在 `.gitignore`。
- 读取照片的接口：`/api/garments/[id]/photo`（登录 + 归属）与 `/api/g/[token]/photo`（token）。
- 不直接暴露 `uploads` 静态目录。

---

## 8. 运行环境与配置

| 变量 | 作用 |
| --- | --- |
| `DATABASE_URL` | SQLite，默认 `file:./dev.db` → `prisma/dev.db` |
| `SESSION_SECRET` | session HMAC 密钥，≥32 字符 |
| `ARK_API_KEY` | 火山方舟 key（只写本地） |
| `ARK_BASE_URL` | Ark API 基址 |
| `ARK_MODEL` | 视觉模型名 |
| `APP_BASE_URL` | 二维码 URL 前缀；本地 `http://localhost:3000`，上线换正式域名 |
| `AI_CALL_BUDGET` | 视觉调用预算告警阈值（默认 300） |
| `AI_MOCK` | `1` 时返回固定 mock；有真实 key 时应为 `0` 或删除 |
| `MAIL_PROVIDER` | `console`（本地）或 `smtp`（真实发信）；production 下 console 被拒绝 |
| `MAIL_CONSOLE_LOG_CODE` | console 模式下 `1` 允许日志打印验证码；`0` 只打元数据 |
| `MAIL_SMTP_HOST` / `MAIL_SMTP_PORT` / `MAIL_SMTP_SECURE` | SMTP 地址、端口、是否 SSL；163 用 `smtp.163.com:465` + `1` |
| `MAIL_SMTP_USER` / `MAIL_SMTP_PASS` | SMTP 登录邮箱与授权码（只写本地 `.env`） |
| `MAIL_FROM` | 发件人；163 场景为发件邮箱地址 |
| `REGISTER_SKIP_EMAIL_VERIFICATION` | 仅 development 生效；`1` 跳过注册验证码；production 忽略，上线前必须为 `0` |

开发环境事实：

- npm 官方源在本机会 `ECONNRESET`，实际使用 `https://registry.npmmirror.com`。
- Prisma 引擎下载 `binaries.prisma.sh` 不可达；使用 `PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma`。
- Windows 下 dev server 会锁 `query_engine-windows.dll.node`，跑 `prisma generate/migrate` 前需停 dev server。
- 浏览器验证不引入 Playwright：系统 Chrome/Edge headless + CDP（临时脚本在 `backup/`，不入 Git）。

当前部署状态：**仅本地**。仓库里没有 Nginx / pm2 / HTTPS / 域名配置；正式部署与真机验证仍是待办（见 `tasks/`）。

---

## 9. 依赖清单

### 运行时

| 包 | 版本 | 用途 |
| --- | --- | --- |
| `next` | 16.4.2 | 框架、RSC、Route Handlers、proxy |
| `react` / `react-dom` | 19.3.0 | UI |
| `@prisma/client` | ^6.19.3 | SQLite ORM 客户端 |
| `qrcode` | ^1.5.4 | 二维码 data URL |
| `sharp` | ^0.35.5 | 上传图片压缩 |
| `nodemailer` | ^10.1.7 | SMTP 真实发信（163 授权码） |

### 开发

`prisma`、`typescript`、`tailwindcss`、`@tailwindcss/turbopack`、`eslint`、`eslint-config-next`、`@types/*`。

> 选型理由与替代方案不在此展开，见 [`DECISIONS.md`](DECISIONS.md)。

---

## 10. 已知架构限制

- **单进程内存状态**：登录/注册/发码限流、扫码限流、AI 调用计数都在进程内；重启清零，不能多实例共享。
- **真实 IP 依赖代理头**：`getClientIp()` 读取 `x-forwarded-for`/`x-real-ip`；生产 Nginx 必须覆盖这两个头，否则 IP 维度限流可被伪造。
- **邮件发送依赖 SMTP**：当前用 163 SMTP（`smtp.163.com:465`）与授权码；邮箱后台需开启 SMTP；授权码只存本地 `.env`，不打印、不入库。SMTP 失败时接口返回 503，不会回退到打印验证码。
- **验证码惰性清理**：没有定时任务；过期/已用记录在下一次发码时清理。
- **SQLite 单写者**：适合单人/演示；高并发写入需要换数据库。
- **本地磁盘存图**：部署时必须是持久磁盘；不能直接上无状态多副本。
- **标签单页 24 张**：没有多页排版；超过 24 件需要分次生成。
- **无对象存储/CDN**：照片通过应用路由读取，流量由 Node 进程承担。
- **AI 计数只告警**：超过预算不阻断调用。
- **无正式 Eval 数字**：20 件 Ground Truth 未跑，准确率状态见 [`EVAL-REPORT.md`](EVAL-REPORT.md)。
- **部署未落地**：没有生产构建产物、反代、证书、进程守护配置。
