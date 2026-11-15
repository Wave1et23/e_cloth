# 本地安全加固（v0.15）

- **状态**：本地应用完成；服务器管理端口/权限已执行；应用加固未部署
- **版本**：v0.15
- **类型**：security
- **对应 task**：本任务
- **改了什么**：统一安全响应头并关闭 `x-powered-by`；所有登录态写接口补 `isSameOrigin`；`getClientIp` 优先 Cloudflare 真实 IP；AI 接口增加用户分钟/小时限流；限流 Map 加上限；新增 `User.sessionVersion` 迁移，重置密码后旧 session 失效；服务器 UFW 只保留 22/80/443，数据库/备份权限收紧。
- **为什么**：审计发现源站可被绕过、写接口 CSRF 保护不完整、AI 可被反复调用、重置密码不踢旧会话、限流内存在极端 key 下会膨胀；管理面板端口不应公网暴露。
- **怎么验证的**：`npm test` 68 项、`npm run build` 通过；本地响应头检查通过；跨站 Origin 调 `/api/outfits` 返回 403；AI 同一用户第 11 次返回 429；临时用户重置密码后旧 cookie `/api/auth/me` 401、新密码登录 200；UFW 外网 888/13443/5432 均不可达，22/80/443 正常。
- **影响哪些文档**：PRD F1、DESIGN §3.2、ARCHITECTURE 数据模型/会话、DECISIONS D26、ITERATION_LOG v0.15。
- **已知限制**：SSH 不做；Cloudflare Origin Pulls、Nginx 边缘限流、应用安全改动上线尚未执行；旧 session 兼容无 `ver` cookie（按版本 0）；CSP 仍是 Report-Only。
