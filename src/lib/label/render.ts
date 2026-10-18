import QRCode from "qrcode";
import {
  computeLabelLayout,
  type LabelLayout,
} from "@/lib/label/layout";

export type LabelItem = {
  id: string;
  name: string;
  code: string;
  token: string;
};

const TEXT_COLOR = "#2C2620";
const CUT_COLOR = "#D9CBB5";
const FONT_PX = Math.round((8 * 300) / 72); // 8pt @300dpi

function ellipsize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}…`;
}

function drawCutGuides(
  ctx: CanvasRenderingContext2D,
  layout: LabelLayout,
): void {
  ctx.save();
  ctx.strokeStyle = CUT_COLOR;
  ctx.lineWidth = 1;
  for (const cell of layout.cells) {
    ctx.strokeRect(cell.x + 0.5, cell.y + 0.5, cell.width - 1, cell.height - 1);
  }
  ctx.restore();
}

function drawRuler(ctx: CanvasRenderingContext2D, layout: LabelLayout): void {
  const { ruler } = layout;
  ctx.save();
  ctx.strokeStyle = TEXT_COLOR;
  ctx.fillStyle = TEXT_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ruler.x, ruler.y);
  ctx.lineTo(ruler.x + ruler.width, ruler.y);
  for (let i = 0; i <= 10; i += 1) {
    const x = ruler.x + (ruler.width * i) / 10;
    const height = i % 5 === 0 ? 18 : 10;
    ctx.moveTo(x, ruler.y);
    ctx.lineTo(x, ruler.y - height);
  }
  ctx.stroke();
  ctx.font = `${FONT_PX * 0.72}px "Songti SC","STSong","SimSun",serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("100 mm 校验尺", ruler.x, ruler.y - 22);
  ctx.restore();
}

/** 浏览器端：生成整页 A4 PNG（data URL）。 */
export async function renderLabelsToDataUrl(
  items: LabelItem[],
  baseUrl: string,
): Promise<string> {
  const layout = computeLabelLayout();
  const canvas = document.createElement("canvas");
  canvas.width = layout.pageWidth;
  canvas.height = layout.pageHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas is not supported");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCutGuides(ctx, layout);

  const usable = items.slice(0, layout.cells.length);
  const codes = await Promise.all(
    usable.map((item) =>
      QRCode.toDataURL(`${baseUrl}/g/${item.token}`, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: layout.qrSize * 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      }),
    ),
  );

  const images = await Promise.all(
    codes.map(
      (code) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error("qr image failed"));
          image.src = code;
        }),
    ),
  );

  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${FONT_PX}px "Songti SC","STSong","SimSun",serif`;

  usable.forEach((item, index) => {
    const cell = layout.cells[index];
    ctx.drawImage(
      images[index],
      cell.qrX,
      cell.qrY,
      cell.qrSize,
      cell.qrSize,
    );
    const text = ellipsize(
      ctx,
      `${item.name} ${item.code}`,
      cell.maxTextWidth,
    );
    ctx.fillText(text, cell.x + cell.width / 2, cell.textY);
  });

  drawRuler(ctx, layout);
  return canvas.toDataURL("image/png");
}

/** 触发浏览器下载；文件名按当天日期。 */
export function downloadDataUrl(dataUrl: string): void {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `衣橱标签-${date}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
