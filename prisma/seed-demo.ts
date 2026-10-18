import { PrismaClient } from "@prisma/client";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "../src/lib/auth/password.ts";
import { generateToken } from "../src/lib/token.ts";

const prisma = new PrismaClient();
const EMAIL = "demo@example.com";
const PASSWORD = "demo1234";
const PREFIX = "演示·";

type Demo = {
  name: string;
  category: string;
  color: string;
  colorHex: string;
  pattern: string;
  fit: string;
  season: string;
  style: string;
  price: number;
  daysAgo: number;
  worn: number;
  final?: "WASHED" | "STORED" | "SOLD";
};

const DEMOS: Demo[] = [
  { name: "灰色圆领卫衣", category: "上衣", color: "灰", colorHex: "#8D8D8D", pattern: "纯色", fit: "宽松", season: "春秋", style: "休闲", price: 299, daysAgo: 120, worn: 7 },
  { name: "白色棉质衬衫", category: "上衣", color: "白", colorHex: "#F2EFE7", pattern: "纯色", fit: "常规", season: "四季", style: "通勤", price: 399, daysAgo: 300, worn: 14 },
  { name: "黑色直筒西裤", category: "裤装", color: "黑", colorHex: "#262626", pattern: "纯色", fit: "常规", season: "四季", style: "通勤", price: 499, daysAgo: 200, worn: 5, final: "WASHED" },
  { name: "水洗牛仔外套", category: "外套", color: "蓝", colorHex: "#5B7A9D", pattern: "纯色", fit: "宽松", season: "春秋", style: "复古", price: 599, daysAgo: 400, worn: 4 },
  { name: "米色长款风衣", category: "外套", color: "米", colorHex: "#C9B99A", pattern: "纯色", fit: "常规", season: "秋", style: "通勤", price: 899, daysAgo: 500, worn: 6, final: "STORED" },
  { name: "黑白条纹T恤", category: "上衣", color: "多色", colorHex: "#E8E2D6", pattern: "条纹", fit: "修身", season: "夏", style: "休闲", price: 129, daysAgo: 90, worn: 21 },
  { name: "亚麻阔腿长裤", category: "裤装", color: "米", colorHex: "#D6C6A8", pattern: "纯色", fit: "宽松", season: "夏", style: "休闲", price: 259, daysAgo: 60, worn: 3 },
  { name: "酒红色连衣裙", category: "连衣裙", color: "红", colorHex: "#7C2D3A", pattern: "纯色", fit: "修身", season: "秋", style: "复古", price: 699, daysAgo: 700, worn: 9, final: "SOLD" },
];

async function imageFor(index: number) {
  const dir = path.join(process.cwd(), "uploads", "garments");
  await mkdir(dir, { recursive: true });
  const file = `demo-${index + 1}.png`;
  await copyFile(
    path.join(process.cwd(), "prisma", "demo-assets", `garment-${index + 1}.png`),
    path.join(dir, file),
  );
  return `garments/${file}`;
}

async function main() {
  const passwordHash = await hashPassword(PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash },
    create: { email: EMAIL, passwordHash },
    select: { id: true },
  });

  await prisma.garment.deleteMany({
    where: { userId: user.id, name: { startsWith: PREFIX } },
  });

  for (const [index, demo] of DEMOS.entries()) {
    const photoPath = await imageFor(index);
    const createdAt = new Date(Date.now() - demo.daysAgo * 86_400_000);
    const garment = await prisma.garment.create({
      data: {
        userId: user.id,
        seq: index + 1,
        name: `${PREFIX}${demo.name}`,
        category: demo.category,
        primaryColor: demo.color,
        pattern: demo.pattern,
        fit: demo.fit,
        season: demo.season,
        style: demo.style,
        material: "棉",
        brand: "uncertain",
        priceCents: demo.price * 100,
        purchaseDate: new Date(createdAt.getTime() - 30 * 86_400_000),
        notes: "演示数据，用于截图与答辩；不代表真实用户。",
        photoPath,
        status: demo.final === "SOLD" ? "RETIRED" : "IN_CLOSET",
        createdAt,
      },
    });

    await prisma.label.create({
      data: { garmentId: garment.id, token: generateToken() },
    });

    // 穿着记录：均匀铺在过去 90 天，保证“本月穿着次数”有数。
    for (let worn = 0; worn < demo.worn; worn += 1) {
      const at = new Date(
        Date.now() - Math.floor((worn * 80) / Math.max(1, demo.worn)) * 86_400_000,
      );
      await prisma.garmentEvent.create({
        data: { garmentId: garment.id, type: "WORN", createdAt: at },
      });
    }

    if (demo.final === "WASHED") {
      await prisma.garmentEvent.create({
        data: {
          garmentId: garment.id,
          type: "WASHED",
          createdAt: new Date(Date.now() - 2 * 86_400_000),
        },
      });
      await prisma.garment.update({
        where: { id: garment.id },
        data: { status: "TO_WASH" },
      });
    }
    if (demo.final === "STORED") {
      await prisma.garmentEvent.create({
        data: {
          garmentId: garment.id,
          type: "STORED",
          createdAt: new Date(Date.now() - 10 * 86_400_000),
        },
      });
      await prisma.garment.update({
        where: { id: garment.id },
        data: { status: "STORED" },
      });
    }
    if (demo.final === "SOLD") {
      await prisma.garmentEvent.create({
        data: {
          garmentId: garment.id,
          type: "SOLD",
          createdAt: new Date(Date.now() - 30 * 86_400_000),
        },
      });
      await prisma.garment.update({
        where: { id: garment.id },
        data: { status: "RETIRED" },
      });
    }
  }

  console.log(`seed: ${DEMOS.length} demo garments ready for ${EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
