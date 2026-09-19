import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔧 بدء إنشاء StudentProfiles للطلاب بدون ملف...");

  const department = await prisma.department.findFirst({ select: { id: true } });
  if (!department) {
    console.error("❌ لا يوجد قسم في قاعدة البيانات");
    process.exit(1);
  }

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", studentProfile: null },
    select: { id: true, email: true },
  });

  console.log(`👥 عدد الطلاب بدون ملف: ${students.length}`);

  for (const s of students) {
    const code = s.email.split("@")[0] || `STU-${Date.now()}`;
    try {
      await prisma.studentProfile.create({
        data: {
          userId: s.id,
          studentCode: code,
          fullName: `طالب ${code.slice(-6)}`,
          departmentId: department.id,
          academicLevel: "LEVEL_1",
          enrollmentYear: new Date().getFullYear(),
        },
      });
      console.log(`✅ تم إنشاء ملف للطالب: ${s.email}`);
    } catch (e) {
      console.error(`❌ فشل للطالب ${s.email}:`, e);
    }
  }

  console.log("🎉 تم!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
