# 轮换已进入 Git 历史的密钥

- **状态**：进行中（等待用户轮换）
- **版本**：v0.1 安全修复
- **类型**：security
- **对应 task**：无（安全事件，非原计划闸门）
- **改了什么**：本次文档基线已把 `.env.example` 里的真实 `ARK_API_KEY` / `SESSION_SECRET` 替换为空占位符；**未重写 Git 历史**。此前提交 `751d46f` 及其历史中仍能读到旧值。
- **为什么**：任何进入 Git 的密钥都视为已泄露（`AGENTS.md` 规则 5）。该文件曾被提交，不能只靠“再提交一次空值”消除历史暴露；原因来自 `git show HEAD:.env.example` 的实际内容。
- **怎么验证的**：待验证。计划：在火山方舟控制台吊销旧 key 并新建；重新生成 `SESSION_SECRET`；只写入 `.env`/`.env.local`；确认 `git grep` 当前树无密钥；评估是否需要 `git filter-repo` 清理历史（需用户授权，且当前仓库未配置 remote）。
- **影响哪些文档**：`README.md`（环境变量）、`AGENTS.md`（密钥规则）、`docs/ARCHITECTURE.md`（配置）、`docs/ITERATION_LOG.md`（完成后记录）。
- **已知限制**：历史重写会改变所有提交哈希；当前 `master` 没有配置 remote，未 push。是否重写历史必须由用户决定。
