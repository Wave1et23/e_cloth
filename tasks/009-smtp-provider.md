# 真实 SMTP 邮件 adapter（v0.5.1）

- **状态**：进行中
- **版本**：v0.5.1
- **类型**：feature
- **对应 task**：本任务
- **改了什么**：用户提供 163 邮箱授权码与发件地址后，新增 SMTP adapter（nodemailer）、配置真实发信，并做一次测试发送。
- **为什么**：上一批只实现 console adapter；现在 key/授权码到位，需要让注册验证码真正发到邮箱。
- **怎么验证的**：待实现后验证。计划：`npm test`、`npm run build`；向发件邮箱自身发送验证码，接口 200；确认服务端不打印明文码；确认 `.env` 未进 Git。
- **影响哪些文档**：`docs/ARCHITECTURE.md`、`docs/DECISIONS.md`、`docs/PRD.md`、`docs/DESIGN.md`、`docs/ITERATION_LOG.md`、`.env.example`。
- **已知限制**：163 SMTP 需要邮箱后台开启 SMTP 服务；授权码只写本地 `.env`；若服务商限制发信频率或拦截，需要用户侧确认；不做多 provider 路由。
- **配置**：`MAIL_PROVIDER=smtp`、`MAIL_SMTP_HOST=smtp.163.com`、`MAIL_SMTP_PORT=465`、`MAIL_SMTP_SECURE=1`、`MAIL_SMTP_USER=wave1et@163.com`、`MAIL_SMTP_PASS`（仅 `.env`）、`MAIL_FROM`。
