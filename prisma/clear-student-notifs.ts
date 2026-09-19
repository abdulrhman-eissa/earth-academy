import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true },
  });
  const ids = students.map((s) => s.id);
  const del = await prisma.notification.deleteMany({
    where: { userId: { in: ids } },
  });
  console.log(`🗑️  تم حذف ${del.count} إشعار طالب`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
