-- 记录进入 RETIRED 的时间；历史已退出衣物从迁移时刻开始给 3 天保留期。
ALTER TABLE "Garment" ADD COLUMN "retiredAt" DATETIME;
UPDATE "Garment" SET "retiredAt" = CURRENT_TIMESTAMP WHERE "status" = 'RETIRED' AND "retiredAt" IS NULL;
