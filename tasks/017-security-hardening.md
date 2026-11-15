# 本地安全加固（v0.15）

- **状态**：已上线（2026-11-15，v0.16）；服务器管理端口/权限已执行；Cloudflare 限制按用户要求不做
- **版本**：v0.15 / 随 v0.16 部署
- **类型**：security
- **对应 task**：本任务
- **改了什么**：统一安全响应头并关闭 `x-powered-by`；所有登录态写接口补 `isSameOrigin`；`getClientIp` 优先 Cloudflare 真实 IP；AI 接口增加用户分钟/小时限流；限流 Map 加上限；新增 `User.sessionVersion` 迁移，重置密码后旧 session 失效；服务器 UFW 只保留 22/80/443，数据库/备份权限收紧。
- **为什么**：审计发现源站可被绕过、写接口 CSRF 保护不完整、AI 可被反复调用、重置密码不踢旧会话、限流内存在极端 key 下会膨胀；管理面板端口不应公网暴露。
- **怎么验证的**：`npm test` 70 项、`npm run build` 通过；上线后公网安全头生效；跨站 Origin 调 `/api/outfits` 403；本地 AI 第 11 次 429；临时用户重置密码旧 cookie 401；UFW 外网 888/13443/5432 不可达。
- **影响哪些文档**：PRD F1、DESIGN §3.2、ARCHITECTURE 数据模型/会话、DECISIONS D26、ITERATION_LOG v0.15/v0.16。
- **已知限制**：SSH 按用户要求不改；Cloudflare Origin Pulls/边缘限流不做；CSP 仍是 Report-Only。
