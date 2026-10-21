# 首次部署（G2）

- **状态**：已完成（2026-10-21）
- **版本**：v0.6
- **类型**：deploy
- **对应 task**：G2
- **改了什么**：在现有香港服务器部署 `mirrorwardrobe.dpdns.org`；安装 Node 24.18、构建 Next、pm2 守护、Nginx 反代、Let's Encrypt 证书；使用独立目录与独立数据库，未改动原有 Python 项目。
- **为什么**：二维码需要正式 HTTPS 地址；用户已确认方案 A、允许证书/反代/快照备份。
- **怎么验证的**：已通过。`/api/health` 返回 `{db:"up"}`；`/`、`/login`、`/register`、`/legal/*` 均 200；未登录 `/garments` 307 到 `/login`；demo 登录 200、8 件演示衣物；`/api/labels` 返回 `baseUrl=https://mirrorwardrobe.dpdns.org`；服务器端 AI 上传 200 且返回结构化建议；生产 SMTP 发码 200；原有 `joint-poem.site` 仍 200；`pm2-root` 开机自启、`certbot.timer` 已启用。
- **影响哪些文档**：`docs/ARCHITECTURE.md`（部署拓扑/环境）、`docs/ITERATION_LOG.md` v0.6、`docs/DECISIONS.md` D14、`README.md`（如补部署说明）、`AGENTS.md`（禁止自动同步规则）。
- **已知限制**：服务器 2C2G；构建峰值约 1.1 GiB，后续构建需低峰/限内存；SQLite + 本地磁盘存图，不能多实例；现有 Python 项目继续运行，禁止改动。
- **部署信息**：应用目录 `/www/wwwroot/mirrorwardrobe`；数据库 `prisma/prod.db`；Node `/opt/node-v24.18.0-linux-x64`；pm2 进程 `mirrorwardrobe`；应用只监听 `127.0.0.1:3000`；Nginx 配置 `mirrorwardrobe.dpdns.org.conf`；证书 `/etc/letsencrypt/live/mirrorwardrobe.dpdns.org`；Nginx 配置备份 `/root/deploy-backups/nginx-pre-mirrorwardrobe-20261021-070441.tar.gz`。
- **后续规则**：不自动同步后续迭代到云服务器；每次部署/替换代码必须由用户明确授权。
