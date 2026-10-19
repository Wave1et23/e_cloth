# 首次部署（G2）

- **状态**：待开始
- **版本**：未定（v0.1 之后）
- **类型**：deploy
- **对应 task**：G2
- **改了什么**：尚未执行。需要域名、SSH 方式、同机其他项目情况后，才配置 Nginx / pm2 / Let's Encrypt 与 `APP_BASE_URL`。
- **为什么**：二维码里必须写正式 HTTPS 地址，手机扫码才能成立；具体域名与服务器约束**待补充**。
- **怎么验证的**：待验证。计划按 `AGENT-WORKFLOW.md` §11 部署后清单：`/api/health`、首页/核心页、401、`/g/{token}`、二维码域名、HTTPS 跳转、服务器时间、pm2 自启。
- **影响哪些文档**：`docs/ARCHITECTURE.md`（部署拓扑/配置）、`docs/ITERATION_LOG.md`（新版本记录）、`docs/PRD.md`（验收环境）、`README.md`（运行方式）。
- **已知限制**：服务器 2C4G；SQLite + 本地磁盘存图，不能直接多实例；上传图已压到 1440×1920 内。
