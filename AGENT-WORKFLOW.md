# 衣橱镜像 · Agent 运行时工作流

> 版本 1.0 ｜ 2026-10-18
> **本文是新对话窗口的唯一入口文档。** 不含时间表，按阶段与闸门推进。
> 配套权威文件：`docs/DECISIONS.md`（技术选型与硬参数）、`WEB_DEV_SKILL.md`（工程规范）、`衣橱镜像-产品方案.md`（产品定义与比赛策略）

---

## 0. 给新窗口的启动指令（直接复制这段发给 AI）

```
读 C:\myproject\e_cloth\AGENT-WORKFLOW.md、docs/DECISIONS.md、WEB_DEV_SKILL.md。
不要重新规划时间表，不要重新讨论已定技术选型。
从「§10 当前进度」往下继续，遇到 🔴 G 闸门必须停下来问我，不要自己往下走。
每完成一件事，按 §8 的格式汇报。
```

---

## 1. 项目是什么（30 秒版）

**衣橱镜像**：给现实中的衣柜做一份数字档案，让每件衣服有唯一二维码身份。

```
拍一件衣服 → AI 自动填好类别/颜色/图案/版型/季节 → 用户确认 → 入柜
     → 生成二维码（内含 https://<域名>/g/{token}）→ 打印贴到衣架上
     → 手机系统相机扫一下 → 点「穿了」→ 状态与穿着次数更新
```

**只做 4 个功能、最多 8 个页面。** 清单外的任何功能一律不做。

| # | 功能 | 页面 |
| --- | --- | --- |
| 1 | AI 拍照建档 | 新增衣物页 |
| 2 | 衣柜列表与详情 | 列表页、详情页 |
| 3 | 标签生成与 A4 打印 | 标签拼版页 |
| 4 | 扫码记录状态 | 免登录扫码页 `/g/{token}` |

另需：登录、注册、首页（含数据条）。**合计 8 页，上限不可突破**——新增一页必须删掉一页。

---

## 2. 技术基线（已定，不再讨论）

完整参数见 `docs/DECISIONS.md`。以下是不能动的地基：

| 项 | 决定 |
| --- | --- |
| 框架 | Next.js（App Router）+ TypeScript |
| 数据库 | SQLite + Prisma |
| 视觉模型 | 豆包 `doubao-seed-2-1-lite-260915`（火山方舟 Ark，OpenAI 兼容接口，`json_schema` 结构化输出，**默认关闭深度思考**） |
| 鉴权 | 邮箱 + 密码 session（无邮箱验证 / 无找回密码） |
| 扫码页 | `/g/{token}` **免登录**，token 12 位 base62 |
| 生命周期 | **5 状态** + **6 事件**（映射表见 DECISIONS §3） |
| 标签 | A4 一页 **24 张**，4 列 × 6 行，单元格 46×44mm，二维码 30mm，**浏览器 canvas 合成 2480×3508 PNG @300dpi** |
| 视觉 | 古典暖色调，色值见 DECISIONS §4；**不引入中文字体 webfont** |
| 部署 | 香港 VPS（已有）+ 已有域名 + Nginx + pm2 + Let's Encrypt，**无备案** |
| 仓库 | `https://github.com/Wave1et23/e_cloth` |
| 测试 | 只写单元测试（状态映射、CPW、token、排版容量），不写 Playwright |

**核心业务原则（比技术选型更重要）**

1. **AI 永远不直接写库**：AI 只返回建议，用户确认后由普通 CRUD 接口落库。
2. **AI 猜不出来的必须说"不确定"**：`material` 仅建议、`brand` 恒为 `uncertain`，禁止编造。
3. **AI 失败必须可降级**：接口超时/报错时，用户仍能手动填完建档。
4. **确定性任务不用 AI**：二维码编码用库、解码交给手机系统相机。

---

## 3. 文档地图与权威性

| 文件 | 用途 | 权威性 |
| --- | --- | --- |
| `AGENT-WORKFLOW.md`（本文） | 运行时流程、闸门、进度 | **权威** |
| `docs/DECISIONS.md` | 技术选型、标签尺寸数学、色值、目录约定、密钥规则 | **权威** |
| `WEB_DEV_SKILL.md` | 工程规范：Git 先行、设计确认、安全基线、分阶段部署、用行为验证 | **权威（规范层）** |
| `衣橱镜像-产品方案.md` | 产品定义、目标用户、比赛评分策略、需组长拍板事项 | 参考（产品与材料层） |
| `关于举办…AIGC应用创新大赛的通知.docx` | 赛题原文、提交材料要求、评分表 | 参考（规则原文） |
| `archive/*` | 早期讨论记录与已废弃方案 | **作废，不要再读** |

**冲突时的优先级：本文 + DECISIONS > WEB_DEV_SKILL > 产品方案 > archive**

---

## 4. 已废弃内容（明确不要再用）

| 废弃的东西 | 原因 / 替代 |
| --- | --- |
| **第 6–11 周的时间排期**（原 `02`、`03` 两份文档） | 已抛弃。改为按阶段推进，不设周次，不承诺日期 |
| 原 `01` 产品文档的完整版结构 | 已被 `衣橱镜像-产品方案.md` + `DECISIONS.md` 取代 |
| 10 种生命周期状态 + 白名单迁移校验 | 压到 5 状态 + 纯映射表 |
| `WearRecord` / `CareRecord` 两张表 | 合并为单张 `GarmentEvent` |
| A4 三种规格 + PDF 生成库 + CSS 打印 | 改为单规格 24 张/页 + canvas 出 PNG |
| 自研扫码器（ZXing） | 手机系统相机自带，识别代码量为 0 |
| 水洗标识别做进产品界面 | 降级为离线实验，只进 Eval 报告 |
| 对象存储 / Docker / Playwright / Zod 全量校验 / 四维筛选 / 独立统计页 / Wardrobe 表 | 全部砍掉 |
| AI 搭配、天气、社区、二手对接、NFC、多成员衣柜 | 永不实现 |

---

## 5. 决策来龙去脉（让新窗口知道"为什么是现在这样"）

| 曾经想做的 | 最终决定 | 原因 |
| --- | --- | --- |
| 完整数字衣柜（含统计页、多维筛选、搭配） | 只留 4 功能 8 页面 | 4 周内"5 个功能全通"远胜"15 个功能各通一半" |
| 三个 AI 功能并行 | 1 个产品级（建档）+ 1 个离线实验（水洗标） | 一个做透 + 过程可审计，得分更稳 |
| 自研扫码、PDF 排版 | 系统相机 + 浏览器 canvas | 确定性任务不需要 AI，也不需要自研 |
| 扫码页要登录 | 免登录能力型 URL | 系统相机扫开会新开标签页、无 Cookie，要登录则每次撞墙，演示必死 |
| 5–10 人正式用户测试 | 3 人无指导试用 + 录屏 | 成本降 70%，结论不变 |
| 用免费隧道做手机测试 | 直接部署到香港 VPS | 域名与服务器现成，真实 HTTPS 环境能消掉一整类"本地能跑线上不行"的问题 |

---

## 6. 工作流程（Stage 0 → 9）

规则：
- **阶段之间串行**，阶段内可并行。
- **每个闸门（🔴 G）未获确认，我停在那里，不自行推进。**
- 每个阶段结束必须能给出"可演示的东西"或"可验证的证据"。

---

### Stage 0 · 仓库与环境就绪

**目标**：能跑起一个空项目，Git 干净，目录结构就位。

我要做：
1. 确认脚手架位置（**当前工作区未发现 `package.json`，见 §10**）
2. 补 `.gitignore`：`node_modules/`、`.env*`（保留 `.env.example`）、`*.db`、`prisma/*.db*`、`uploads/`、`*.log`、`.next/`
3. 建目录：`prisma/`、`src/lib/ai/`、`src/lib/label/`、`prompts/`、`skills/`、`tests/unit/`、`tests/eval/`、`docs/`
4. 写 `.env.example`（只放占位符）：
   ```
   DATABASE_URL="file:./dev.db"
   SESSION_SECRET=
   ARK_API_KEY=
   ARK_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
   ARK_MODEL="doubao-seed-2-1-lite-260915"
   APP_BASE_URL="https://<域名>"
   AI_CALL_BUDGET=300
   ```
5. 首次提交（**不 push，除非明确授权**）

验收：`npm run dev` 能打开页面；`git status` 干净。

🔴 **G0 · 仓库与脚手架位置确认** — 见 §7

---

### Stage 1 · 设计确认（最高返工风险点，必须先过）

依据 `WEB_DEV_SKILL.md` §2.1：写主体代码前，先出设计与用户逐条确认。

我要产出 `docs/DESIGN.md`，必须含 5 部分：

1. **路由表**：8 个页面的路径 / 用途 / 入口
2. **跳转图**：从进入到完成核心操作的完整路径
3. **每页交互说明**：关键按钮、表单、加载中 / 空数据 / 加载失败三态、反馈文案
4. **数据写入点**：哪些操作写库、哪些只读
5. **权限**：游客 / 登录用户 / 持 token 者分别能做什么

🔴 **G1 · 设计确认** — 逐条确认后才进入 Stage 2

---

### Stage 2 · 数据层与骨架

我要做：
1. `prisma/schema.prisma`：User / Garment / GarmentEvent / Label 四表（字段见 DECISIONS §3）
2. 迁移 + seed（1 个演示账号）
3. 鉴权：注册 / 登录 / 退出 / session / **每个查询强制过滤 userId**
4. `src/lib/status.ts`：6 事件 → 5 状态的映射表（纯函数，配单测）
5. `src/lib/cost.ts`：单件 CPW（`price ÷ WORN 次数`，缺数据显示"数据不足"）
6. `globals.css`：写入 DECISIONS §4 的色彩与字体 tokens
7. 统一请求封装：永不向页面抛异常，返回 `{ ok, data, msg }`

验收：单测通过；能注册登录、看到空列表。

---

### Stage 3 · 首次部署（最小可跑）

**为什么这么早部署**：Stage 5 要真机扫码，需要一个真实可访问的 HTTPS 地址。早部署能提前暴露证书、反代、时区、路径等环境差异。

我要做（**分步执行，每步验证后再下一步**）：
1. 构建产物可跑（`npm run build`）
2. Nginx 反代配置（`server_name` 用你的真实域名）
3. pm2 守护 + 开机自启
4. Let's Encrypt 证书 + HTTP 自动跳 HTTPS
5. 健康检查接口 `/api/health`
6. 数据库每日备份脚本

🔴 **G2 · 首次部署确认**（涉及生产环境操作，见 §7）

---

### Stage 4 · 核心闭环 A：AI 建档

我要做：
1. `src/lib/ai/vision.ts`：Ark adapter
   - OpenAI 兼容 `chat/completions`
   - `response_format: json_schema`，字段名与 DB 一致
   - **关闭/降低深度思考**
   - 超时 20s、失败重试 1 次、再失败返回 `AI_UNAVAILABLE`
   - 置信度 < 0.7 的字段标记为"低置信"，前端标黄不预填
   - 调用计数，累计超 `AI_CALL_BUDGET` 打警告日志
2. `prompts/garment-v1.md`（含输出 Schema、禁止猜测规则）
3. 新增衣物页：上传 → 预填 → 确认 → `POST /api/garments`
   - 图片校验 JPG/PNG、≤10MB，**前后端双校验**
   - **AI 失败仍可手填完成**
   - 「接着拍」连续录入
4. 列表页 + 详情页（属性 / 状态 / 事件时间线）

🔴 **G3 · AI 凭据与首批照片** — 见 §7

验收：拍一张真实照片 → 表单预填 → 确认入柜 → 列表出现 → 详情可看。

---

### Stage 5 · 核心闭环 B：标签与扫码

我要做：
1. `src/lib/label/`：A4 拼版
   - 4 列 × 6 行网格（等分可用区，非绝对 mm，避免取整误差）
   - 每格：二维码 24–28mm + 下方一行 8pt（衣物名 + 编号 `G018`）
   - 右下角 **100mm 校验尺**
   - 输出 2480×3508 PNG，`toDataURL` 下载
   - 页面提示：「打印时请选 **实际大小 / 缩放 100%**」
2. 二维码容错级别 **M**；内容为 `https://<域名>/g/{token}`（完整 URL）
3. `/g/{token}` 免登录页：名称 + 缩略图 + 当前状态 + 6 按钮
   - 点击 → `POST /api/g/{token}/action` → 写事件 + 改状态 → 「已记录 ✓」
   - **幂等**：连点不重复写
   - 非法/失效 token → 友好页，不暴露技术信息
   - **极简静态化**：少 JS、按钮用原生 `<a>` / `<form>`，为微信内置浏览器兼容
4. 首页数据条：本月穿着次数 / 在柜件数 / 平均 CPW

🔴 **G4 · 实物打印与真机扫码** — 见 §7（**这一步我做不了，只能你做**）

验收：真打印 → 剪 → 贴衣架 → 真手机扫 → 状态变 → 数据条 +1。

---

### Stage 6 · 视觉与体验打磨

我要做：
1. 全站套用 DECISIONS §4 的暖色 tokens；标题用宋体系栈，正文系统无衬线
2. 每个数据页面补齐 **加载中 / 空数据 / 加载失败** 三态
3. 移动端优先：扫码页必须在窄屏不溢出
4. 破坏性操作二次确认；错误提示全部是中文人话
5. 不加阴影，用细边框 + 留白分层

🔴 **G5 · 视觉走查确认** — 见 §7

---

### Stage 7 · 测试与 Eval

我要做：
1. 单测补全：状态映射、CPW、token 唯一性、排版容量（24 格/页）
2. **「AI 失败」用例**：mock 视觉接口报错，确认用户仍能手动建档
3. Eval 脚本：20 件衣物（10 易 / 5 中 / 5 难，人工先标 Ground Truth）
   - 跑 Prompt V1 → 统计字段级准确率 → 找失败模式 → 改 V2 → 重跑对比
   - 两个版本都留在 `prompts/`
4. 水洗标离线实验：8 张，V1 → V2，独立脚本，**不进产品界面**
5. 产出 `docs/EVAL-REPORT.md`（含失败案例截图、准确率对比、拆分两条链路的决策记录）

🔴 **G6 · AI 准确率取舍** — 见 §7

---

### Stage 8 · 正式上线与稳定性

我要做：
1. 生产构建 + 迁移（已有数据库先备份再迁移）
2. 种子数据（约 20 件衣物 + 历史事件）
3. 备份脚本验证（能恢复到临时库）
4. 限流与超时兜底；日志不含用户敏感内容
5. 部署后验证清单（见 §11）

🔴 **G7 · 上线确认**

---

### Stage 9 · 材料产出

我要做：
1. 项目文档骨架（Word 大纲）：背景 / 解决方案 / 技术路径 / 分工 / 创新点 / 总结 + **末尾 AI 使用附录**
2. AI 使用附录素材：从 `prompts/` 与 `docs/AI-USAGE-LOG.md` 导出（关键提示词、迭代、测试验证、人工核查）
3. PPT 大纲（20 页以内）
4. 演示视频分镜（4 镜头：真实衣柜 → 相机扫码 → 点击 → 数字 +1）
5. 明确标注演示数据为**模拟数据**并说明构造方式

🔴 **G8 · 提交前终检**

---

## 7. 人工确认闸门总表

> **规则：闸门未确认时，我停在那里，不自行推进、不"顺手先做一点"。**
> 标注「可继续」的，我继续做不依赖它的部分，并在汇报里列出待确认项。

| 编号 | 阶段 | 我要问的话 | 你需要给的东西 | 未确认时 |
| --- | --- | --- | --- | --- |
| **G0** | Stage 0 | 脚手架建在哪个目录？要我在这里建吗？仓库是否已推送？ | 目录路径 + 是否授权我 `git push` | 停（无法开工） |
| **G1** | Stage 1 | 这是 8 个页面的路由、跳转、每页交互和权限，请逐条确认或指出要改的 | 「确认」或具体修改意见 | 停（返工成本最高的一步） |
| **G2** | Stage 3 | 我要开始动服务器了：装 Nginx 配置 / 申请证书 / pm2 守护。现有服务会受影响吗？ | 域名、SSH 方式（建议 SSH key）、**同机是否有其他项目** | 停（生产操作） |
| **G3** | Stage 4 | 请把 `ARK_API_KEY` 填进 `.env.local`（不要发到聊天里），并给我 5 张真实衣物照片 + 1 张水洗标 | key 已配好的确认 + 照片 | 停（AI 链路无法验证） |
| **G4** | Stage 5 | 请打印这张 A4、剪下来、贴到衣架，用真手机（含微信）扫一次，告诉我结果和问题 | 打印件照片 + 扫码结果（成功/失败/报错） | 可继续做 Stage 6 的样式部分 |
| **G5** | Stage 6 | 这是全站截图，视觉按古典暖色调做的，可以吗？ | 「可以」或具体调整点 | 可继续 Stage 7 的测试脚本 |
| **G6** | Stage 7 | 20 件测试的准确率是__，达到我们定的门槛（类别≥85%/颜色≥90%/图案≥85%）了吗？要继续调 Prompt 还是接受 | 取舍决定（继续调 / 接受 / 降级字段） | 可继续 Stage 8 的部署准备 |
| **G7** | Stage 8 | 准备上线：会备份数据库后迁移 + 重启 pm2。确认执行吗？ | 「执行」 | 停（生产操作） |
| **G8** | Stage 9 | 材料齐了，提交前请你过一遍：赛题要求 vs 我们的交付物逐条对照 | 终检确认 | 停（提交前） |

**我无需请示、可自主决定的事**：文件/组件命名、目录细分、错误文案措辞、单测写法、日志格式、已批准依赖内的实现方式、代码注释与 commit message。

---

## 8. 每轮对话的固定动作

我每完成一件事，按这个格式汇报（不要长篇大论）：

```
【做了什么】一句话
【我验证了什么】跑了什么命令 / 单测结果 / 打开哪个页面
【需要真机确认的】最多 3 条，你能在 1 分钟内做完的
【下一步】等哪个闸门 / 我打算做什么
```

同时遵守：
- **一次只做一件可验证的事**，做完即验证、验证即汇报
- **改动后跑测试**，避免回归
- **不确定就停下来问**，不基于猜测连续操作
- **需求变更时同步所有相关文档与配置**（尤其域名变更要同步：二维码 URL、`APP_BASE_URL`、Nginx `server_name`）
- **验证用实际行为**（HTTP 请求 / 页面访问 / 接口返回），不用文件 diff 或 hash 对比

---

## 9. 红线（我不会做的事）

1. **不索取、不使用、不保存任何密钥。** 凭据只由你写入 `.env.local`。任何已出现在聊天/文档里的密钥视为泄露，须立即吊销。
2. **不经授权不 `git push`，永不 `push --force`。**
3. **不在未备份的情况下改数据库或覆盖生产文件。**
4. **不越过 🔴 闸门。**
5. **不引入清单外功能**，也不为"顺手"加页面。
6. **不额外安装依赖**，确需新增必须在汇报里说明用途与替代方案。
7. **不做时间承诺**（不承诺"几天做完"）。
8. **不删用户数据、不重装环境、不动同机其他项目的进程与容器。**

---

## 10. 当前进度与未决事项

### 已完成

- [x] 产品定位与 MVP 边界定稿
- [x] 技术选型全部拍板（D1–D15）
- [x] 标签排版规格定稿（24 张/页、4×6、46×44mm、QR 30mm）
- [x] 视觉 tokens 定稿（古典暖色调）
- [x] 运行环境确认：香港 VPS + 已有域名 + 免备案
- [x] 视觉模型确认：`doubao-seed-2-1-lite-260915` 支持图片输入与 `json_schema` 结构化输出
- [x] 仓库确定：`https://github.com/Wave1et23/e_cloth`
- [x] 早期讨论文档与废弃方案已归档至 `archive/`
- [x] **Stage 0 完成**：Next.js 脚手架已生成在仓库根目录，依赖已装，`npm run build` 通过（exit 0，4 个静态页）
- [x] **Stage 1 完成**：`docs/DESIGN.md`（8 页路由、跳转图、三态与文案、写入点、权限矩阵）；G1 十项已确认
- [x] **Stage 2 完成**：Prisma 四表迁移 + demo seed；注册/登录/退出/`/api/garments`/`/api/health`；状态映射、CPW、token、session、密码单测 15 项通过；`npm run build` exit 0；游客访问 `/garments` 307 到 `/login`，登录后空列表可见
- [x] **Stage 4 本地部分完成**：Ark adapter（`json_schema`、关闭深度思考、20s 超时、1 次重试、`AI_UNAVAILABLE` 降级、300 次预算告警）；图片魔数校验/临时区/正式区；`POST /api/ai/garment`（失败仍返回 imageToken）；`POST /api/garments`（Garment+Label、seq 编号、事务、token 冲突重试）；列表/详情/编辑/删除/照片读取；`/garments/new` 与 `/garments/[id]`；AI 归一化单测 5 项（总 20 项通过）；本地 mock 全链路 smoke 通过（上传→AI→G001→详情→改→删）
- [x] **Stage 5 本地部分完成**：A4 24 格排版数学（`src/lib/label/layout.ts`，4×6、QR 354px、100mm 尺）；canvas 合成 2480×3508 PNG（`render.ts`，QR 容错 M，下载）；`/labels` 选择/上限 24/预览；`/api/labels`（token 补建）；`/g/[token]` 免登录页 + 6 表单；`/api/g/[token]/action`（303 回跳、30 秒幂等、5 状态映射、限流）；`/api/g/[token]/photo`；首页数据条（本月穿着/在柜/平均 CPW/最近 4 件）；单测总 27 项通过；build exit 0；headless Chrome 实跑 canvas 生成预览成功（无 error，含 100mm 校验尺）
- [x] **Stage 6 本地部分完成**：全站三态（列表 loading/error、详情 loading/error/不存在、标签空/错误、AI 失败、扫码非法/错误/成功）；全局中文 404/error；详情桌面双栏、移动端扫码页 2 列；按钮焦点态、hover、`role=alert/status`；修复受保护页 `Date.now()` 预渲染问题（`getCurrentUser` 显式 `connection()`）；新增 8 件模拟演示数据（`prisma/seed-demo.ts` + `prisma/demo-assets/`，图片与备注都标注模拟）；headless Chrome 全站截图完成，G5 待确认

### 环境事实（新窗口不要重复踩）

| 项 | 值 / 结论 |
| --- | --- |
| Node / npm | `v24.18.0` / `11.16.0` |
| Next.js | **16.4.2**（Turbopack），React 19.3，Tailwind 4 |
| npm 源 | **官方源 `registry.npmjs.org` 会 ECONNRESET**，必须用 `https://registry.npmmirror.com` |
| create-next-app | **v16 拒绝在非空目录生成**。若需重建：先生成到临时子目录再移回根目录，且子目录名**不能以下划线开头** |
| 框架文档 | Next 16 自带版本匹配文档在 `node_modules/next/dist/docs/`；**写代码前必须先读对应章节**（见根目录 `AGENTS.md`） |
| 默认能力 | `Cache Components` 与 `Partial Prefetching` 默认开启 → 页面里读 cookie / 数据库需按新规则处理（写页面前先读 docs 的 caching / data-fetching 章节） |
| Prisma | **6.19.3**（`prisma` + `@prisma/client` 同版本）；SQLite 文件在 `prisma/dev.db`（Git 忽略） |
| Prisma 引擎下载 | `binaries.prisma.sh` 本机不可达；用 `PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma` 后再跑 postinstall / migrate |
| 单测 | Node 24 原生跑 TS：`npm test` → `node --test tests/unit/*.test.ts`，不引入 Vitest |
| 会话 | 签名 cookie（HMAC-SHA256，`SESSION_SECRET`），不建 Session 表；密码用 Node 内置 scrypt |
| 本地环境 | `.env` 已生成（Git 忽略）；demo 账号 `demo@example.com` / `demo1234`，仅本地 seed |
| AI 本地验收 | `AI_MOCK=1` 时 adapter 返回固定建议，不调 Ark；真实 key 由 G3 填写，上线前必须删掉 `AI_MOCK` |
| Prisma 生成 | Windows 下 dev server 会锁 `query_engine-windows.dll.node`；跑 `prisma generate/migrate` 前先停 dev server |
| 图片 | 临时区 `uploads/tmp/<userId>/<token>`；正式区 `uploads/garments/<uuid>.<jpg|png>`；均被 Git 忽略 |
| 标签 | `qrcode@1.5.4`；排版数学与 canvas 渲染分离；QR 内容 = `APP_BASE_URL + /g/{token}`；本地 `APP_BASE_URL=http://localhost:3000` |
| 浏览器验证 | 不装 Playwright；用系统 Chrome/Edge `--headless --remote-debugging-port` + Node 内置 WebSocket 走 CDP 截图验证（临时脚本放 `backup/`，不进 Git） |
| 演示数据 | `npm run db:seed:demo`：8 件「演示·」衣物 + 历史 WORN/WASHED/STORED/SOLD；图片在 `prisma/demo-assets/`；全部标注模拟数据，答辩时需说明 |
| 截图 | `backup/screens/*.png`（Git 忽略）：home、garments、detail、new、labels、scan-mobile、login、register |

### 未决

| # | 事项 | 需要你回答 |
| --- | --- | --- |
| ~~U1~~ | ~~脚手架在哪~~ | ✅ 已解决：已在仓库根目录建好并验证构建 |
| U2 | **域名** | 具体域名是什么？要写进二维码与 `APP_BASE_URL`（当前为占位符 `https://example.com`） |
| U3 | **服务器访问方式** | host / 用户 / 端口（**建议用 SSH key，不要把密码写进文件或聊天**） |
| U4 | **仓库推送授权** | 允许我 `git commit` 但不 `push`（你自己推）？还是另有安排？ |
| U5 | **同机共存** | 香港服务器上是否已有其他项目在跑？部署时我必须只动本项目 |
| G5 | **视觉走查** | 全站截图已产出（`backup/screens/`）；请确认「可以」或指出要改的页面 |

### 待你执行（我做不了）

- 填写 `ARK_API_KEY` 到 `.env.local`
- 拍摄真实衣物与水洗标照片
- 打印 A4 标签、裁剪、贴衣架、真机扫码（含微信内置浏览器）
- 微信群/决赛现场演示

---

## 11. 命令备忘

```bash
# 开发
npm run dev

# 数据库
npx prisma migrate dev --name <name>
npx prisma studio

# 测试
npm test

# 构建
npm run build && npm start

# 部署（服务器）
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart closet --update-env
nginx -t && systemctl reload nginx

# 备份（SQLite）
cp prisma/dev.db backup/dev-$(date +%F).db
```

**部署后验证清单**（`WEB_DEV_SKILL.md` §7.3）

- [ ] 健康检查 `/api/health` 正常（数据库连通）
- [ ] 首页 + 核心页面可访问
- [ ] 关键 API 返回正确数据
- [ ] 未登录访问 `/api/garments` 返回 401
- [ ] `/g/{token}` 免登录可访问且能写事件
- [ ] 二维码内容里的域名是**正式域名**（不是 localhost）
- [ ] HTTPS 生效、HTTP 自动跳转
- [ ] 服务器时间正确（影响事件时间戳）
- [ ] pm2 进程在线、开机自启

---

## 12. 排障约定

- **非代码问题（环境 / 网络 / 权限 / 部署）多轮未定位时**：建议开新窗口做一次零假设排查，不要在长对话里带着错误前提继续猜。
- **先区分"本机环境问题"与"业务代码问题"**，再动手改代码。
- **服务器上先探查再部署**：容器/进程/目录/配置的实际形态，不按假设操作。
