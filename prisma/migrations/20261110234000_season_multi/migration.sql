-- 季节从单值枚举改为逗号分隔多选：只迁移两个旧枚举值，其余保持原样。
UPDATE "Garment" SET "season" = '春,秋' WHERE "season" = '春秋';
UPDATE "Garment" SET "season" = '春,夏,秋,冬' WHERE "season" = '四季';
