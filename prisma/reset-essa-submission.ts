import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const studentCode = "30001151200015";

  const profile = await prisma.studentProfile.findUnique({
    where: { studentCode },
    select: { id: true, userId: true, fullName: true },
  });

  if (!profile) {
    console.error("❌ لم أجد الطالب");
    process.exit(1);
  }

  const deleted = await prisma.submission.deleteMany({
    where: { studentId: profile.userId },
  });

  console.log(`✅ ${profile.fullName} (${studentCode})`);
  console.log(`🗑️  تم حذف ${deleted.count} تسليم`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
