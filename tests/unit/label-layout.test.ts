import assert from "node:assert/strict";
import test from "node:test";
import {
  CAPACITY,
  COLUMNS,
  ROWS,
  computeLabelLayout,
} from "../../src/lib/label/layout.ts";

test("A4 页面是 2480×3508，容量 24 格", () => {
  const layout = computeLabelLayout();
  assert.equal(layout.pageWidth, 2480);
  assert.equal(layout.pageHeight, 3508);
  assert.equal(CAPACITY, 24);
  assert.equal(COLUMNS, 4);
  assert.equal(ROWS, 6);
  assert.equal(layout.cells.length, 24);
});

test("24 格全部落在页边距内，且互不重叠", () => {
  const layout = computeLabelLayout();
  const seen = new Set<string>();
  for (const cell of layout.cells) {
    assert.ok(cell.x >= layout.margin, `cell ${cell.index} x`);
    assert.ok(cell.y >= layout.margin, `cell ${cell.index} y`);
    assert.ok(
      cell.x + cell.width <= layout.pageWidth - layout.margin + 1,
      `cell ${cell.index} right`,
    );
    assert.ok(
      cell.y + cell.height <= layout.pageHeight - layout.margin + 1,
      `cell ${cell.index} bottom`,
    );
    assert.ok(cell.qrSize >= 354 && cell.qrSize <= 355, "QR 30mm @300dpi");
    assert.ok(cell.qrX >= cell.x && cell.qrX + cell.qrSize <= cell.x + cell.width);
    assert.ok(cell.qrY >= cell.y && cell.qrY + cell.qrSize <= cell.y + cell.height);
    seen.add(`${cell.x},${cell.y}`);
  }
  assert.equal(seen.size, 24);
});

test("100mm 校验尺在页内，宽度约 1181px", () => {
  const layout = computeLabelLayout();
  assert.ok(layout.ruler.width >= 1180 && layout.ruler.width <= 1182);
  assert.ok(layout.ruler.x >= 0);
  assert.ok(layout.ruler.x + layout.ruler.width <= layout.pageWidth);
  assert.ok(layout.ruler.y < layout.pageHeight);
});
