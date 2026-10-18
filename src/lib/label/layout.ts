/** A4 24 格标签的纯数学：不碰 DOM、不碰二维码，方便单测。 */

export const DPI = 300;
export const PX_PER_MM = DPI / 25.4;

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const MARGIN_MM = 8;
export const GAP_MM = 3;
export const COLUMNS = 4;
export const ROWS = 6;
export const CAPACITY = COLUMNS * ROWS;
export const QR_MM = 30;
export const RULER_MM = 100;

const USABLE_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2; // 194
const USABLE_HEIGHT_MM = A4_HEIGHT_MM - MARGIN_MM * 2; // 281
const CELL_WIDTH_MM = (USABLE_WIDTH_MM - GAP_MM * (COLUMNS - 1)) / COLUMNS;
const CELL_HEIGHT_MM = (USABLE_HEIGHT_MM - GAP_MM * (ROWS - 1)) / ROWS;

export type LabelCell = {
  index: number;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  qrSize: number;
  qrX: number;
  qrY: number;
  textX: number;
  textY: number;
  maxTextWidth: number;
};

export type LabelLayout = {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  gap: number;
  cellWidth: number;
  cellHeight: number;
  qrSize: number;
  cells: LabelCell[];
  ruler: { x: number; y: number; width: number; tick: number };
};

function mm(value: number): number {
  return value * PX_PER_MM;
}

/**
 * 4 列 × 6 行，等分可用区（不是写死 mm 后取整），
 * 避免 46.25/44.33mm 在 300dpi 下累计误差。
 */
export function computeLabelLayout(): LabelLayout {
  const pageWidth = Math.round(mm(A4_WIDTH_MM));
  const pageHeight = Math.round(mm(A4_HEIGHT_MM));
  const margin = Math.round(mm(MARGIN_MM));
  const gap = Math.round(mm(GAP_MM));
  const cellWidth = Math.round(mm(CELL_WIDTH_MM));
  const cellHeight = Math.round(mm(CELL_HEIGHT_MM));
  const qrSize = Math.round(mm(QR_MM));

  const cells: LabelCell[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLUMNS; col += 1) {
      const index = row * COLUMNS + col;
      const x = margin + col * (cellWidth + gap);
      const y = margin + row * (cellHeight + gap);
      const qrX = x + Math.round((cellWidth - qrSize) / 2);
      const qrY = y + Math.round(mm(3));
      cells.push({
        index,
        row,
        col,
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        qrSize,
        qrX,
        qrY,
        textX: x + Math.round(mm(3)),
        // 二维码 30 + 上留白 3 + 间隙 2 + 文字区中线 ≈ 5mm
        textY: qrY + qrSize + Math.round(mm(5)),
        maxTextWidth: cellWidth - Math.round(mm(6)),
      });
    }
  }

  return {
    pageWidth,
    pageHeight,
    margin,
    gap,
    cellWidth,
    cellHeight,
    qrSize,
    cells,
    ruler: {
      x: pageWidth - margin - Math.round(mm(RULER_MM)),
      y: pageHeight - Math.round(margin / 2),
      width: Math.round(mm(RULER_MM)),
      tick: Math.round(mm(10)),
    },
  };
}
