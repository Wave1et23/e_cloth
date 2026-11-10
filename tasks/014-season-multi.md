# 季节改为多选并新增季节筛选（v0.10）

- **状态**：已完成（本地）
- **版本**：v0.10
- **类型**：feature
- **对应 task**：本任务
- **改了什么**：新增 `src/lib/season.ts` 与单测；`Garment.season` 改为逗号分隔多选；迁移旧值；AI schema/prompt/Ground Truth 同步；新增页与详情编辑改多选；列表新增季节栏并与类别取交集。
- **为什么**：一件衣物可跨季；旧枚举「春秋/四季」无法准确表达；列表需要按季节筛选。
- **怎么验证的**：已通过。`npm test` 60 项；`npm run build` exit 0；迁移后 DB 无「春秋/四季」，旧值展开正确；类别+季节交集数量正确；`其他` 匹配空 season；新页季节 chips 可多选；详情显示 `春、秋`。
- **影响哪些文档**：`docs/PRD.md` F3/F4、`docs/DESIGN.md` §3.4/§3.5/§3.6/§10、`docs/DECISIONS.md` D23、`docs/ARCHITECTURE.md` 数据模型/迁移、`docs/EVAL-REPORT.md`、`prompts/garment-v1.md`、`prompts/garment-v2.md`、`docs/ITERATION_LOG.md`。
- **已知限制**：季节仍用 String 逗号存储，未做数组列；AI 输出逗号组合；不做「当季优先」排序；不部署到云服务器。
