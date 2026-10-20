# 真实 SMTP 邮件 adapter（v0.5.1）

- **状态**：已完成（本地）
- **版本**：v0.5.1
- **类型**：feature
- **对应 task**：本任务
- **改了什么**：新增 `src/lib/mail/smtp.ts`（nodemailer + 163 SMTP）；更新邮件工厂、`.env.example`、注册页提示；本地 `.env` 写入 SMTP 配置（授权码不入库/不入 Git）。
- **为什么**：上一批只实现 console adapter；现在授权码到位，需要让注册验证码真正发到邮箱。
- **怎么验证的**：已通过。`npm test` 49 项、`npm run build` exit 0；向发件邮箱自身发送验证码返回 200，SMTP 已接受；服务端日志无明文码；当前树扫描无授权码；测试验证码已清理。
- **影响哪些文档**：`docs/ARCHITECTURE.md`、`docs/DECISIONS.md` D20、`docs/PRD.md` F1、`docs/DESIGN.md` §3.3、`docs/ITERATION_LOG.md` v0.5.1、`.env.example`。
- **已知限制**：依赖 163 SMTP 服务开启；授权码只写本地 `.env`；若 163 拦截/限频，需要用户侧确认；只实现 SMTP，不做多 provider 路由。
- **配置**：`MAIL_PROVIDER=smtp`、`MAIL_SMTP_HOST=smtp.163.com`、`MAIL_SMTP_PORT=465`、`MAIL_SMTP_SECURE=1`、`MAIL_SMTP_USER=wave1et@163.com`、`MAIL_SMTP_PASS`（仅 `.env`）、`MAIL_FROM=wave1et@163.com`。
