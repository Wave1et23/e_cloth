# 衣柜列表分类筛选（v0.3）

- **状态**：已完成（本地）
- **版本**：v0.3
- **类型**：feature
- **对应 task**：本任务
- **改了什么**：`/garments` 顶部新增横向分类标签栏；`src/lib/garment-filter.ts` 负责参数解析/分类派生/并集过滤；服务端按 `searchParams` 过滤；新增单测；同步 DESIGN/PRD/ARCHITECTURE/ITERATION_LOG。
- **为什么**：衣物数量增多后需要按类别快速缩小范围；移动端横向滑动比下拉顺手（用户本批需求）。
- **怎么验证的**：已通过。`npm test` 40 项通过；`npm run build` exit 0；HTTP 验证全部分类计数、单选、多选并集、空态、未知参数、未登录 307；headless Chrome 390px 验证标签栏横向滚动且整页不溢出、URL 参数、浏览器返回、刷新保留、全部清空。
- **影响哪些文档**：`docs/DESIGN.md` §3.4/§9/§10 第 4 条、`docs/PRD.md` F4、`docs/ARCHITECTURE.md` 组件/lib/列表数据流、`docs/ITERATION_LOG.md` v0.3。
- **已知限制**：不做关键词搜索/分页/颜色/季节/状态筛选；不持久化到 localStorage；不改 schema；不改排序与 200 条上限；筛选只在已取回的 200 条内进行。
- **已确认的验收调整**：原第 5 条「刷新后回到全部」与第 6 条 URL 冲突；用户 2026-10-20 选择选项 A：URL 为准、刷新保留筛选，从 `/garments` 无参数进入默认全部。
