import assert from "node:assert/strict";
import test from "node:test";
import {
  RETIRED_RETENTION_MS,
  isRetiredExpired,
  retiredCutoff,
} from "../../src/lib/retired.ts";

const NOW = 1_700_000_000_000;

test("已退出保留 72 小时", () => {
  assert.equal(RETIRED_RETENTION_MS, 72 * 60 * 60 * 1000);
  assert.equal(
    retiredCutoff(NOW).getTime(),
    NOW - RETIRED_RETENTION_MS,
  );
});

test("到期边界：满 72 小时才视为过期", () => {
  assert.equal(isRetiredExpired(null, NOW), false);
  assert.equal(
    isRetiredExpired(new Date(NOW - RETIRED_RETENTION_MS + 1), NOW),
    false,
  );
  assert.equal(
    isRetiredExpired(new Date(NOW - RETIRED_RETENTION_MS), NOW),
    true,
  );
  assert.equal(
    isRetiredExpired(new Date(NOW - RETIRED_RETENTION_MS - 1), NOW),
    true,
  );
});
