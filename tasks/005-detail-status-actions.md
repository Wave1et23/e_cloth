# 详情页登录态「修改状态」（v0.2）

- **状态**：已完成（本地）
- **版本**：v0.2
- **类型**：feature
- **对应 task**：本任务
- **改了什么**：详情页新增 `GarmentStatusActions`（「状态记录」卡片 +「修改状态」）；新增 `POST /api/garments/[id]/events`；新增动作顺序/文案单测；同步 DESIGN/PRD/ARCHITECTURE/ITERATION_LOG。
- **为什么**：现有状态变更只放在扫码页 `/g/[token]`（`docs/DESIGN.md` §3.6、§10 第 5 条），电脑端用户和“衣服已送洗才想起来补记”的场景无法操作；用户本批需求明确要求详情页提供等价能力。
- **怎么验证的**：已通过。`npm test` 35 项通过；`npm run build` exit 0；HTTP 实证同动作 30 秒内第二次 `duplicate:true` 且事件数不增；`WASHED` 状态更新；`/api/stats` 数据变化；headless Chrome 验证 6 个按钮顺序/文案与提交后提示、时间线更新；未登录详情页 307 `/login`。
- **影响哪些文档**：`docs/DESIGN.md` §2/§3.6/§4/§5/§10、`docs/PRD.md` F4、`docs/ARCHITECTURE.md` API/数据流、`docs/ITERATION_LOG.md` v0.2。
- **已知限制**：不做撤销/撤回；不新增第 7 个动作或状态；不改扫码页行为/URL/样式；首页数据条在返回首页或刷新时反映新数据，不做跨页实时推送；30 秒幂等为读后写，极端并发下仍与扫码页同级别，不做数据库唯一约束。
