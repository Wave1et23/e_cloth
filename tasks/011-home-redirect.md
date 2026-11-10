# 首页定位调整：登录后直达衣柜（v0.7）

- **状态**：已完成（本地）
- **版本**：v0.7
- **类型**：feature
- **对应 task**：本任务
- **改了什么**：登录后 `/garments` 复测确认；`proxy.ts` 对 `/` 做 session cookie 重定向；首页改为游客落地页；删除数据条、最近 4 件、Dashboard/Suspense 与 `/api/stats`；删除 `.stat-*` 死样式。
- **为什么**：会议决策：首页不适合作为登录后落地页，登录后应直接进入衣柜；数据条删除。
- **怎么验证的**：已通过。`npm test` 49 项；`npm run build` exit 0；游客 `/` 200；登录后带 cookie `/` 307 `/garments`；`/api/stats` 404；首页无数据条字符串；登录页 `router.push("/garments")`。
- **影响哪些文档**：`docs/PRD.md` F2/F4、`docs/DESIGN.md` §1/§2/§3.1/§4/§5/§10、`docs/ARCHITECTURE.md` 路由/§5.6、`docs/DECISIONS.md` D21、`docs/ITERATION_LOG.md` v0.7。
- **已知限制**：游客首页新文案未定，保持原样；不改登录/注册字段与鉴权、`/garments`、扫码页；不新增页面；不自动同步云服务器。
- **实现说明**：页面层 `redirect()` 在 Next 16 Cache Components 生产构建下返回 200 错误页，最终改为 `proxy.ts` cookie 重定向；真实 session 仍由 `/garments` 校验。
