import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const traps = await prisma.auditLog.findMany({
    where: { action: "SECURITY_THREAT" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log(`🚨 عدد محاولات الاختراق: ${traps.length}`);
  traps.forEach(t => {
    console.log(`- ${t.createdAt.toISOString()} | IP: ${t.ip} | ${t.details}`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });

export {};
