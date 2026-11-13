# 邮箱验证码重置密码（v0.14）

- **状态**：已完成并上线
- **版本**：v0.14
- **类型**：feature
- **对应 task**：本任务
- **改了什么**：登录页新增「忘记密码」内联面板；新增 `POST /api/auth/password-reset-code` 和 `POST /api/auth/reset-password`；复用 `VerificationCode` 的 `RESET_PASSWORD` 用途；邮件 adapter 支持重置密码邮件；未注册邮箱返回相同成功文案。
- **为什么**：用户忘记密码时需要可自助重置，不依赖人工。
- **怎么验证的**：本地用临时用户 + 预置验证码完成重置并验证旧密码失效/新密码登录；生产部署后校验 reset-code 未知邮箱 200、reset-password 无效验证码 400、登录页出现「忘记密码」、健康检查 200。
- **影响哪些文档**：`docs/PRD.md` F1、`docs/DESIGN.md` §3.2、`docs/ARCHITECTURE.md` §3/§5.1、`docs/DECISIONS.md` D25、`docs/ITERATION_LOG.md` v0.14。
- **已知限制**：验证码重置后不会主动使旧 session cookie 失效（会话无版本字段）；验证码仍为 6 位/10 分钟/5 次尝试；不新增页面。
