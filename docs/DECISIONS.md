# 技术决策记录（Decisions）

> 本文件是**技术选型与“为什么”**的唯一依据；当前实现快照见 `docs/ARCHITECTURE.md`，功能验收见 `docs/PRD.md`。任何实现与本文冲突时，以本文为准；要改先改这里。
> 最后更新：2026-10-20

---

## 1. 已拍板的技术选型

| # | 项目 | 决定 | 说明 |
| --- | --- | --- | --- |
| D1 | 前端 + 后端 | **Next.js（App Router）+ TypeScript** | 单体应用，前后端一套；Route Handlers 当 API |
| D2 | 数据库 | **SQLite** | 单人演示项目，无需起服务、备份就是拷一个文件；Prisma 原生支持 |
| D3 | ORM | **Prisma** | `schema.prisma` 即数据库文档 |
| D4 | 视觉模型 | **豆包 `doubao-seed-2-1-lite-260915`**（火山方舟 Ark） | 全模态，任务类型含 VisualQuestionAnswering，支持图片输入 |
| D5 | 模型调用方式 | Ark 的 **OpenAI 兼容接口** | `POST https://ark.cn-beijing.volces.com/api/v3/chat/completions`，`Authorization: Bearer $ARK_API_KEY` |
| D6 | 结构化输出 | **`response_format: json_schema`**（Ark 推荐模式） | 不解析自由文本；字段名与数据库字段一致 |
| D7 | 鉴权 | 邮箱 + 密码 session，最简 | 不做邮箱验证 / 找回密码 / 第三方登录 |
| D8 | 扫码页 | **免登录（能力型 URL）** `/g/{token}` | token 为 12 位 base62；只授予单件衣物的有限动作 |
| D9 | 标签产出 | **一张 A4 图片（PNG，300dpi）**，用户自行剪裁 | 生成在浏览器端 canvas；不用服务端 PDF/canvas 库 |
| D10 | 视觉风格 | **古典暖色调**（见第 4 节 tokens） | 标题宋体系，正文系统无衬线 |
| D11 | 测试 | 只写单元测试（状态映射、CPW、token、排版容量、AI 归一化、图片压缩、密码/session） | 不写 Playwright；E2E 每周手工跑一次 |
| D12 | 水洗标识别 | 保留，但**只做离线实验脚本**，不进产品界面 | 用于 Eval 报告与答辩材料 |
| D13 | AI 准确率阈值 | 类别 ≥ 85%、颜色 ≥ 90%、图案 ≥ 85% | 低于此值优先调 Prompt，不调产品 |
| D14 | 部署 | 香港 VPS（已有）+ 已有域名 + Nginx + pm2 + Let's Encrypt | 无备案问题 |
| D15 | 费用上限 | 开发 + 评测合计 ≤ 300 次视觉调用 | adapter 里加调用计数，超阈值打日志 |
| D16 | 图片入库压缩 | 服务端 `sharp`：EXIF 旋正、等比缩到 **1440×1920** 内、JPEG q82、透明铺白 | 服务器 2C4G、手机流量；原图不落盘，只存压缩图 |
| D17 | 页面范围 | 原约定上限 8 页；v0.4 因隐私协议/用户协议合规需要，新增 2 个静态法务页 `/legal/privacy`、`/legal/terms`，当前共 10 页 | 例外仅限法务静态页；不新增功能页；后续新增功能页仍应先确认或删除一个页面 |
| D18 | 验证码存储 | 独立 `VerificationCode` 表：邮箱、哈希、用途、过期时间、尝试次数、是否已用、创建时间、请求 IP；只存 scrypt 哈希；有效期 10 分钟、最多 5 次；发送新码时作废旧码；过期/24 小时前已用记录惰性清理 | 不新增密钥/依赖；没有定时任务；不保留明文 |
| D19 | 限流矩阵 | 发码：1 次/60 秒/邮箱、5 次/小时/邮箱、10 次/小时/IP；注册：5 次/小时/邮箱、10 次/小时/IP；登录失败：5 次/15 分钟/邮箱、20 次/15 分钟/IP；429 返回 `retryAfterSeconds` | 单进程内存，pm2 单实例；重启清零；Nginx 必须覆盖真实 IP 头 |
| D20 | 邮件 adapter | `MailAdapter` 接口 + console/SMTP 实现；真实发信用 163 `smtp.163.com:465` + 授权码，配置 `MAIL_SMTP_HOST/PORT/SECURE/USER/PASS/MAIL_FROM`；production 禁止 console；`REGISTER_SKIP_EMAIL_VERIFICATION` 仅 development 生效、默认 0、上线前必须关闭 | 新增 `nodemailer` 依赖；控制台模式才允许打印明文码；SMTP 错误不得带出授权码；不接第三方统计 |

---

## 2. 标签排版规格（D9 定稿）

### 2.1 版面数学

A4 = 210 × 297 mm，四边留白 8 mm → 可用 **194 × 281 mm**。

**24 张/页 = 4 列 × 6 行**（不是 3 列 × 8 行）：

| 项 | 值 |
| --- | --- |
| 单元格 | **46.25 × 44.33 mm**（取整 46 × 44） |
| 间距 | 3 mm |
| 二维码 | **30 × 30 mm** |
| 文字区 | 二维码下方一行，8pt，可用宽 40 mm（约 14 个汉字） |
| 单元格内构成 | 上留白 3 + 二维码 30 + 间隙 2 + 文字 6 + 下留白 3 = 44 mm |

**为什么不用 3 列 × 8 行（50×30mm）**：50×30 的格子里，二维码只能给到 22–24mm，剩下一行文字挤在 6mm 内会糊；而 46×44 能给出 30mm 的码，扫得远、扫得稳。**为了省纸牺牲"能不能扫"是方向性错误。**

### 2.2 单元格内容

```
┌──────────────────┐
│   ┌──────────┐   │
│   │  QR 30mm │   │
│   └──────────┘   │
│  灰色圆领卫衣 G018 │  ← 8pt，超出省略
└──────────────────┘
```

- 二维码内容：`https://<域名>/g/{token}`（必须是完整 URL）
- 容错级别：**M**（30mm 足够，M 兼顾密度与鲁棒）
- 文字行 = 衣物名 + 空格 + 编号 `G018`；**编号是人类可读兜底**（码磨花时可手输）

### 2.3 生成方式

- **浏览器端 canvas 合成**：`qrcode` 生成 data URL → 画到 2480 × 3508 px 的 canvas（A4 @300dpi）→ `toDataURL('image/png')` → 下载。
- 选浏览器端而不是服务端的理由：**中文排版直接用系统字体**，服务端 canvas 要额外解决中文字体加载，是纯粹的坑。
- **页面右下角印一条 100mm 校验尺**：用户拿尺子量，确认打印没有被缩放。
- 打印时必须提醒：**缩放 100% / 实际大小**，关闭"适应页面"。

---

## 3. 状态与事件（沿用 v2.0）

**5 状态**：`IN_CLOSET` 在柜 / `WORN` 穿着中 / `TO_WASH` 待洗 / `STORED` 收纳 / `RETIRED` 已退出

**6 事件 → 状态映射**：

| 事件 | → 状态 |
| --- | --- |
| `WORN` | `WORN` |
| `WASHED` | `TO_WASH` |
| `DRY_CLEANED` | `TO_WASH` |
| `RETURNED` | `IN_CLOSET` |
| `STORED` | `STORED` |
| `SOLD` | `RETIRED` |

~~白名单迁移校验~~：不做。只做映射表 + 留痕。

**AI 输出字段 6 个**（D13 的评测对象）：
`category` / `primaryColor` / `pattern` / `fit` / `season` / `style`
+ `material` 仅建议、`brand` 恒为 `uncertain`。

---

## 4. 视觉 tokens（古典暖色调）

```css
:root {
  /* 纸与墨 */
  --paper:        #F7F1E3;  /* 页面底色，宣纸米 */
  --paper-raised: #FFFBF2;  /* 卡片 */
  --ink:          #2C2620;  /* 主文字，墨色 */
  --ink-muted:    #6B5F52;  /* 次要文字 */

  /* 暖色强调 */
  --accent:       #8C4A32;  /* 朱赭：用于文字强调，对 paper ≈ 5.9:1 */
  --accent-fill:  #A6543A;  /* 用于大色块 / 大标题 / 按钮底 */
  --gold:         #C29B5C;  /* 茶金：分隔线、徽标点缀 */
  --line:         #D9CBB5;  /* 边框 */

  /* 语义色（暖调内取值） */
  --ok:           #6B7A4F;  /* 橄榄，表示"已记录" */
  --warn:         #B07B2F;  /* 提示 AI 不确定 */
  --danger:       #8C3A2E;  /* 删除 / 非法 token */

  /* 字体 */
  --font-display: "Songti SC", "STSong", "SimSun", "Noto Serif SC", serif;
  --font-body:    system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
}
```

**使用规则**
- 标题、编号（如 `G018`）、页面大标题用 `--font-display`；正文用 `--font-body`。
- **不引入 webfont**：宋体走系统栈，缺少时优雅降级到 `serif`，避免几 MB 字体拖慢手机首屏。
- 不加阴影，靠 `--line` 细边框和留白分层，接近纸面质感。
- AI 置信度 < 0.7 的字段用 `--warn` 背景标出，而不是弹出警告框。

---

## 5. 目录约定

```
closet/
├── prisma/schema.prisma
├── src/lib/ai/            # Ark adapter、json_schema、置信度处理
├── src/lib/label/         # canvas 排版与二维码合成
├── src/app/g/[token]/     # 免登录扫码页
├── prompts/               # garment-v1/v2、care-label-v1/v2
├── skills/                # garment-ai / code-review / testing
├── tests/unit/            # 状态映射、CPW、token、排版容量
├── tests/eval/            # 20 件衣物 + 8 张水洗标的评测脚本
└── docs/                  # 各报告
```

---

## 6. 秘密与凭据规则

- `ARK_API_KEY` 只存在 `.env.local`，**永不进 Git**；仓库提供 `.env.example`。
- Git 访问**不使用密码或长期 PAT**：本机用 SSH key 或 `gh auth login` 的 credential helper。
- 任何出现在聊天/文档里的密钥一律视为**已泄露**，立即吊销并重建。
