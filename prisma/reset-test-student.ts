import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const studentCode = "30001011200077";

  const profile = await prisma.studentProfile.findUnique({
    where: { studentCode },
    select: { id: true, userId: true, fullName: true, chosenAssignmentId: true },
  });

  if (!profile) {
    console.error("❌ الطالب غير موجود");
    process.exit(1);
  }

  const deleted = await prisma.submission.deleteMany({
    where: { studentId: profile.userId },
  });

  console.log(`✅ ${profile.fullName} (${studentCode})`);
  console.log(`🗑️  حذف ${deleted.count} تسليم`);
  console.log(`📚 التكليف المختار: ${profile.chosenAssignmentId ? "موجود" : "لا يوجد"}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
