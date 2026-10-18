import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password.ts";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@example.com";
  const password = "demo1234";
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
    select: { id: true, email: true },
  });

  console.log(`seed: demo user ready (${user.email})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
