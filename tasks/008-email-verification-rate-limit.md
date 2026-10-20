# 邮箱验证码注册与认证限流（v0.5）

- **状态**：已完成（本地）
- **版本**：v0.5
- **类型**：feature
- **对应 task**：本任务
- **改了什么**：新增 `VerificationCode` 表与迁移；新增 `src/lib/mail/` console adapter、`verification.ts`/`verification-store.ts`；新增 `POST /api/auth/verification-code`；注册加验证码校验；登录/注册/发码接入限流与倒计时；`http.ts`/`client-api.ts` 传递 `retryAfterSeconds`；新增单测与文档。
- **为什么**：防止任意邮箱被冒名注册；防止验证码与登录接口被暴力调用（用户本批需求）。
- **怎么验证的**：已通过。`npm test` 49 项通过；`npm run build` exit 0；控制台日志出现 6 位码、DB 仅 scrypt 哈希；同邮箱 60 秒冷却、邮箱 5/小时、IP 10/小时；错误/过期/已用/5 次尝试不同提示；正确码 201 自动登录；登录第 6 次 429 锁 900 秒；demo 200；development 跳过开关可无码注册；390px 倒计时 UI 正常。
- **影响哪些文档**：`docs/ARCHITECTURE.md`、`docs/DECISIONS.md` D18–D20、`docs/PRD.md` F1、`docs/DESIGN.md` §3.2/§3.3、`docs/ITERATION_LOG.md` v0.5、`.env.example`。
- **已知限制**：单进程内存限流，不能多实例共享；真实 IP 依赖 Nginx 覆盖 XFF；真实邮件服务商未接入，production 发码会失败；验证码惰性清理，无定时任务；不做短信/找回密码/第三方登录/CAPTCHA。
- **已确认**：限流按建议矩阵；允许 `http.ts`/`client-api.ts` 传递剩余秒数；已注册邮箱发码返回 409。
