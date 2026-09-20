import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 تصفير البيانات للاختبار...\n");

  // 1) نحذف تسليمات الطالب الاختباري
  const testStudentCode = "30001011200077";
  const profile = await prisma.studentProfile.findUnique({
    where: { studentCode: testStudentCode },
    select: { userId: true, fullName: true },
  });

  if (profile) {
    const del = await prisma.submission.deleteMany({ where: { studentId: profile.userId } });
    console.log(`✅ حذف ${del.count} تسليم للطالب ${profile.fullName}`);
  }

  // 2) نحذف الحسابات الاختبارية
  const testAccounts = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: "pwdtest_" } },
        { email: { startsWith: "ratelimit_" } },
        { email: { startsWith: "test_" } },
      ],
    },
  });
  console.log(`✅ حذف ${testAccounts.count} حساب اختباري`);

  console.log("\n🎉 جاهز للاختبار!");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
