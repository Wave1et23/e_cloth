# AI 使用日志（过程可审计）

> 用途：比赛提交材料里的「AI 工具使用、关键提示词、开发过程、迭代优化、测试验证、人工核查」附录。
> 原则：只记录真实发生的事；mock、脚本验证和真实 AI 调用分开写，不把前者写成后者。

## 1. 使用的 AI 工具

| 工具 | 用在哪些环节 |
| --- | --- |
| DeepSeek Harness（本 Agent，deepseek-flash） | 需求拆解、设计文档、代码实现、单测、HTTP/浏览器验证、部署脚本草稿 |
| DeepSeek Harness 插件：dsh-code-review | 阶段末独立代码审查（只读 Git 范围） |
| DeepSeek Harness 插件：dsh-composer-plus | 开发期 Git Changes 面板与输入辅助 |
| 豆包 `doubao-seed-2-1-lite-260915`（Ark） | 产品内的衣物识别；已用真实 key 试跑 11 次，见 §3 |

## 2. 关键提示词（产品内）

- `prompts/garment-v1.md`：6 字段 + material/confidence；禁止猜测 brand；低置信度不预填。
- `prompts/garment-v2.md`：候选版本，按类别/颜色/图案顺序判定，置信度四档锚点；**待 V1 失败样本后再定稿**。
- `prompts/care-label-v1.md` / `v2`：水洗标离线实验，不进产品界面。

## 3. 过程记录

### 2026-10-18 · 设计

- AI 产出 8 页路由、跳转图、每页三态与文案、写入点、权限矩阵（`docs/DESIGN.md`）。
- 人工确认：G1 十项逐条确认后才进入编码。
- 人工修正：用户明确「不要重新规划时间表、不讨论已定技术选型」；本地未完成前不索要 key/域名。

### 2026-10-18 · Stage 2–6 实现

- AI 生成：Prisma 四表、签名 cookie session、scrypt 密码、garments/labels/scan/stats API、页面与单测。
- AI 自查发现并修复：
  - `Date.now()` 在 Cache Components 预渲染阶段被判定为不稳定值 → `getCurrentUser` 显式 `connection()`；
  - 受保护页先渲染再客户端跳转 → 增加乐观 `proxy.ts`（无 session 直接 307）；
  - `dsh plugin` 首次中断导致 bundle 未入列 → 手工对账 `package.json`。
- 人工验证：`npm test`（27 项）、`npm run build`、curl 全链路、headless Chrome 生成标签截图。
- **未发生（截至 2026-10-18）**：没有用真实 `ARK_API_KEY` 跑过识别；没有真实打印/微信扫码。相关结论一律标注待验证。
- **2026-10-19 更新**：用户提供真实 key 与照片后，已做 11 次真实视觉调用（7 衣物 + 4 水洗标），见下文。

### 待补（用户提供素材后）

- [x] 真实 Ark 调用次数（11 次：7 衣物 + 4 水洗标，见 §3）
- [ ] 真实 Ark 费用记录（待补充）
- [ ] 20 件衣物 Eval 的 V1/V2 准确率
- [ ] 8 张水洗标实验结果
- [ ] 3 位试用者的录屏与反馈
- [ ] 人工核查后修正的字段清单

### 2026-10-19 · 第一次真实 Ark 调用

- 用户把 `ARK_API_KEY` 写入 `.env`，关闭 `AI_MOCK`。
- 7 张衣物照 + 4 张水洗标逐张调用，**共 11 次视觉调用**，单张 1.4–2.7s，全部返回结构化 JSON。
- 人工抽查 7 张衣物照：类别/颜色基本正确；图案在“星星/字母装饰”上存在 `其他` vs `印花` 分歧；`material` 输出偏长。
- 结论写进 `docs/EVAL-REPORT.md` 第 8 节；**没有计算准确率**，因为还没有 20 件 Ground Truth。

## 4. 人工核查清单

- [ ] Ground Truth 由人逐件确认，不由模型生成
- [ ] 设计文档、权限、事件映射由人确认
- [ ] 所有“通过”的结论都有命令/HTTP/截图证据
- [ ] 模拟数据在文档与演示中明确标注
