# /garments 按穿着次数排序（v0.9）

- **状态**：已完成（本地）
- **版本**：v0.9
- **类型**：feature
- **对应 task**：本任务
- **改了什么**：新增 `src/lib/garment-sort.ts`；`/garments` 在类别筛选后按 WORN 次数降序、次数相同按 seq 降序排序；新增 `tests/unit/garment-sort.test.ts`；同步文档。
- **为什么**：列表默认顺序改为优先展示穿得多的衣物，不再按新建时间；规则固定、不提供排序控件。
- **怎么验证的**：已通过。`npm test` 53 项；`npm run build` exit 0；页面顺序符合 WORN 次数降序、并列 seq 降序、0 次最后；类别筛选后仍正确；`/api/garments` 与 `/labels` 顺序未改。
- **影响哪些文档**：`docs/PRD.md` F4、`docs/DESIGN.md` §3.4、`docs/DECISIONS.md` D22、`docs/ITERATION_LOG.md` v0.9。
- **已知限制**：当前 UI 只有类别筛选，没有季节筛选控件；排序函数在过滤结果上执行，未来增加季节筛选也应保持先筛后排。不改 `/api/garments` 返回顺序，避免影响标签页。
