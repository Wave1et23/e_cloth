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
  ├─ Client Components        表单、标签 canvas、编辑/删除、AI 上传
  ├─ Route Handlers (/api/*)  CRUD、鉴权、AI、扫码动作
  ├─ Prisma Client            SQLite 读写
  └─ 本地文件系统             uploads/tmp、uploads/garments
        │
        ├─ 火山方舟 Ark（外部 HTTPS）：/chat/completions
        └─ 手机系统相机：只负责扫二维码，打开 /g/{token}
```

当前没有独立后端、没有消息队列、没有对象存储、没有多实例。

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
│   └── api/
│       ├── auth/{register,login,logout,me}/route.ts
│       ├── garments/route.ts              GET 列表 / POST 创建
│       ├── garments/[id]/route.ts         GET / PATCH / DELETE
│       ├── garments/[id]/photo/route.ts   登录态照片
│       ├── ai/garment/route.ts            上传 + 压缩 + AI 建议
│       ├── labels/route.ts                标签 token/baseUrl
│       ├── g/[token]/action/route.ts       扫码动作（303 + 幂等）
│       ├── g/[token]/photo/route.ts        token 照片
│       ├── stats/route.ts                 首页聚合
│       └── health/route.ts                数据库连通
├── components/
│   ├── site-header.tsx、logout-button.tsx
│   └── garment-actions.tsx       详情页内联编辑/删除
└── lib/
    ├── auth/                     密码 scrypt、session HMAC、getCurrentUser
    ├── ai/                       Ark adapter、json_schema、归一化
    ├── label/                    排版数学（纯函数）、canvas 渲染（浏览器）
    ├── image-compress.ts         sharp 压缩
    ├── images.ts                 魔数、临时区、正式区、读/删/清理
    ├── garments.ts               衣物字段校验
    ├── garment-fields.ts         枚举白名单（前后端/AI 共用）
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

SQLite，四张表；状态/事件用 String 存，取值由 `src/lib/status.ts` 约束。

```text
User 1 ── n Garment 1 ── n GarmentEvent
                 └──── 1 Label
```

| 表 | 关键字段 | 约束/索引 |
| --- | --- | --- |
| `User` | `id`(cuid)、`email`、`passwordHash`、`createdAt` | `email` unique |
| `Garment` | `id`、`userId`、`seq`、`name`、`category`、`primaryColor`、`pattern`、`fit`、`season`、`style`、`material`、`brand`、`priceCents`、`purchaseDate`、`notes`、`photoPath`、`status`、`createdAt`、`updatedAt` | `@@index([userId, createdAt])`、`@@unique([userId, seq])` |
| `GarmentEvent` | `id`、`garmentId`、`type`、`createdAt` | `@@index([garmentId, createdAt])` |
| `Label` | `id`、`garmentId`、`token`、`createdAt` | `garmentId` unique、`token` unique |

- `brand` 默认 `uncertain`，业务代码创建时也强制写 `"uncertain"`。
- `priceCents` 用整数分，避免浮点误差；展示时除 100。
- `seq` 按用户递增，展示为 `G001`；唯一约束 `(userId, seq)` 防止并发重复。
- 删除 `Garment` 时级联删除 `GarmentEvent` / `Label`；照片文件由接口额外删除。
- 没有 `Session` 表、没有 `Wardrobe` 表。

---

## 5. 关键数据流

### 5.1 注册 / 登录 / 会话

1. `POST /api/auth/register` 校验邮箱/密码 → `scrypt` 哈希 → 创建 `User` → 写签名 cookie。
2. `POST /api/auth/login` 按 `IP+email` 限流 → 查 `User` → `scrypt` 校验 → 写 cookie。
3. `getCurrentUser()`：`await connection()` → 读 cookie → HMAC/过期校验 → 查 `User`。
4. `proxy.ts` 只做乐观检查：没有 cookie 就 307；签名/用户有效性仍由页面/接口校验。

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

- 列表：`GET /api/garments` / 页面 `prisma.garment.findMany({ userId, orderBy: seq desc, take: 200 })`。
- 详情：`findFirst({ id, userId })` + `events`（最多 100）+ `label.token`。
- 编辑：`PATCH /api/garments/[id]`，字段校验后 `update`。
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

### 开发

`prisma`、`typescript`、`tailwindcss`、`@tailwindcss/turbopack`、`eslint`、`eslint-config-next`、`@types/*`。

> 选型理由与替代方案不在此展开，见 [`DECISIONS.md`](DECISIONS.md)。

---

## 10. 已知架构限制

- **单进程内存状态**：登录限流、扫码限流、AI 调用计数都在进程内；重启清零，不能多实例共享。
- **SQLite 单写者**：适合单人/演示；高并发写入需要换数据库。
- **本地磁盘存图**：部署时必须是持久磁盘；不能直接上无状态多副本。
- **标签单页 24 张**：没有多页排版；超过 24 件需要分次生成。
- **无对象存储/CDN**：照片通过应用路由读取，流量由 Node 进程承担。
- **AI 计数只告警**：超过预算不阻断调用。
- **无正式 Eval 数字**：20 件 Ground Truth 未跑，准确率状态见 [`EVAL-REPORT.md`](EVAL-REPORT.md)。
- **部署未落地**：没有生产构建产物、反代、证书、进程守护配置。
