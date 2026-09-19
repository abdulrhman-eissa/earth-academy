import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔔 إضافة إشعارات تجريبية...");

  // 1) أستاذ أحمد
  const ahmed = await prisma.user.findUnique({ where: { email: "dr.ahmed@faculty.local" } });
  if (ahmed) {
    await prisma.notification.deleteMany({ where: { userId: ahmed.id } });
    await prisma.notification.create({
      data: {
        userId: ahmed.id,
        type: "RESEARCH_SUBMITTED",
        title: "تسليم بحث جديد",
        body: "قام الطالب محمد عبد الله أحمد بتسليم بحثه في مادة: التاريخ الإسلامي",
        isRead: false,
      },
    });
    await prisma.notification.create({
      data: {
        userId: ahmed.id,
        type: "RESEARCH_SUBMITTED",
        title: "تسليم بحث جديد",
        body: "قامت الطالبة فاطمة أحمد محمد بتسليم بحثها في مادة: تاريخ الدولة الأموية",
        isRead: false,
      },
    });
    console.log(`✅ أضيف 2 إشعارات للأستاذ أحمد`);
  }

  // 2) أستاذ منى
  const mona = await prisma.user.findUnique({ where: { email: "dr.mona@faculty.local" } });
  if (mona) {
    await prisma.notification.deleteMany({ where: { userId: mona.id } });
    await prisma.notification.create({
      data: {
        userId: mona.id,
        type: "RESEARCH_SUBMITTED",
        title: "تسليم بحث جديد",
        body: "قام الطالب يوسف محمود إبراهيم بتسليم بحثه في مادة: الحضارة الإسلامية",
        isRead: false,
      },
    });
    console.log(`✅ أضيف إشعار للأستاذة منى`);
  }

  // 3) شؤون الطلاب
  const affairs = await prisma.user.findUnique({ where: { email: "affairs@earth.edu" } });
  if (affairs) {
    await prisma.notification.deleteMany({ where: { userId: affairs.id } });
    await prisma.notification.create({
      data: {
        userId: affairs.id,
        type: "INFO",
        title: "تقرير أسبوعي جاهز",
        body: "تم رصد 3 درجات جديدة خلال الأسبوع الحالي — يمكنك مراجعتها من سجل الدرجات.",
        isRead: false,
      },
    });
    console.log(`✅ أضيف إشعار لشؤون الطلاب`);
  }

  const total = await prisma.notification.count();
  console.log(`\n📊 إجمالي الإشعارات في قاعدة البيانات: ${total}`);
  console.log("🎉 تم!");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
