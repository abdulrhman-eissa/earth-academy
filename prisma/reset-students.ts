import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🗑️  بدء حذف بيانات الطلاب...");

  const delSub = await prisma.submission.deleteMany({});
  console.log(`✅ تم حذف ${delSub.count} تسليم`);

  const delProf = await prisma.studentProfile.deleteMany({});
  console.log(`✅ تم حذف ${delProf.count} ملف طالب`);

  const delUsers = await prisma.user.deleteMany({ where: { role: "STUDENT" } });
  console.log(`✅ تم حذف ${delUsers.count} حساب طالب`);

  const remaining = await prisma.user.count({ where: { role: "STUDENT" } });
  console.log(`\n📊 الحسابات الطلابية المتبقية: ${remaining}`);
  console.log("🎉 تم!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
