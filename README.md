# 衣橱镜像

给现实衣柜做一份数字档案：拍照建档 → 打印二维码贴到衣架 → 手机相机扫一下记录穿着。

- 技术栈：Next.js 16（App Router）+ TypeScript + Prisma 6 + SQLite
- 视觉模型：火山方舟 Ark `doubao-seed-2-1-lite-260915`（OpenAI 兼容 + `json_schema`）
- 页面：首页、登录、注册、衣柜列表、新增衣物、衣物详情、标签打印、免登录扫码页

## 本地运行

```powershell
cd C:\myproject\e_cloth
npm install
npx prisma migrate dev     # 首次或 schema 变更后
npm run db:seed            # 只建 demo 账号
npm run db:seed:demo       # 可选：8 件演示衣物（图片/备注都标注“模拟数据”）
npm run dev
```

打开 <http://localhost:3000>。

- 测试账号：`demo@example.com` / `demo1234`
- 开发端口：3000
- 生产预览：`npm run build && npm start`

> Windows 下如果 `prisma generate/migrate` 报 `query_engine-windows.dll.node` 被占用，先停掉 `npm run dev` 再执行。

## 环境变量（`.env` / `.env.local`）

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | 默认 `file:./dev.db`（实际在 `prisma/dev.db`） |
| `SESSION_SECRET` | 会话签名密钥，至少 32 字符；`openssl rand -base64 32` 或随机 hex |
| `ARK_API_KEY` | 火山方舟 key，只写本地，不进 Git |
| `ARK_BASE_URL` | 默认 `https://ark.cn-beijing.volces.com/api/v3` |
| `ARK_MODEL` | 默认 `doubao-seed-2-1-lite-260915` |
| `APP_BASE_URL` | 二维码里写入的站点地址；本地 `http://localhost:3000`，上线换成正式域名 |
| `AI_CALL_BUDGET` | 视觉调用预算告警阈值，默认 300 |
| `AI_MOCK` | 本地无 key 时设 `1` 返回固定 mock；**有真实 key 时必须设 `0` 或删掉** |

## 图片规格

上传时服务端用 `sharp` 统一处理（`src/lib/image-compress.ts`）：

- EXIF 方向旋正
- 等比缩到 **1440×1920** 以内（横图约 1440×1080），不放大
- 统一转 JPEG，质量 82，透明背景铺白
- 典型结果 150–400KB，适合 2C4G 服务器与手机流量

原图不落盘，只存压缩后的 `uploads/garments/<uuid>.jpg`。

## 常用命令

```powershell
npm run dev            # 本地开发
npm run build          # 生产构建
npm start              # 生产启动
npm test               # 单元测试（Node 原生跑 TS）
npm run eval:dry       # 校验 20 件衣物 Eval 清单（不需要 key）
npm run eval           # 真跑衣物 Eval（需要 key + tests/eval/images）
npm run eval:care      # 水洗标离线实验（8 张）
npm run try:photos     # 对 tests/eval/images 里的照片逐张试 AI
npm run try:care       # 对 tests/eval/care-images 里的水洗标逐张试 AI
npm run db:seed:demo   # 重建 8 件演示数据
```

## 目录

```
prisma/            schema、迁移、seed、演示图片
prompts/           garment-v1/v2、care-label-v1/v2
src/app/           页面与 Route Handlers
src/lib/ai/        Ark adapter 与结构化输出
src/lib/label/     A4 24 格排版与 canvas 渲染
tests/unit/        单测
tests/eval/        Eval 清单、脚本、图片目录（图片不入 Git）
docs/              DESIGN / DECISIONS / EVAL-REPORT / AI-USAGE-LOG
```

## 文档入口

| 想了解 | 看 |
| --- | --- |
| 当前已实现功能与验收标准 | [`docs/PRD.md`](docs/PRD.md) |
| 当前技术结构、数据流、AI 链路 | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| 为什么这么选、砍掉了什么 | [`docs/DECISIONS.md`](docs/DECISIONS.md) |
| 页面与交互设计 | [`docs/DESIGN.md`](docs/DESIGN.md) |
| 已完成版本与提交锚点 | [`docs/ITERATION_LOG.md`](docs/ITERATION_LOG.md) |
| 进行中 / 待开始任务 | [`tasks/`](tasks/) |
| AI 使用过程、提示词、人工核查 | [`docs/AI-USAGE-LOG.md`](docs/AI-USAGE-LOG.md) |
| AI 准确率状态 | [`docs/EVAL-REPORT.md`](docs/EVAL-REPORT.md) |

完整文档职责表见 [`AGENTS.md`](AGENTS.md)。
