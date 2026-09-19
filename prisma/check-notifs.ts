import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, userId: true, type: true, title: true, createdAt: true },
  });

  console.log("📊 إجمالي الإشعارات:", notifs.length);
  notifs.forEach(n => {
    console.log(`- ${n.title} | userId=${n.userId.slice(0, 12)}... | ${n.createdAt.toISOString()}`);
  });

  const drAhmed = await prisma.user.findUnique({
    where: { email: "dr.ahmed@faculty.local" },
    select: { id: true, email: true, facultyProfile: { select: { fullName: true } } },
  });
  console.log("\n👨‍🏫 dr.ahmed:", drAhmed);

  if (drAhmed) {
    const hisNotifs = await prisma.notification.count({ where: { userId: drAhmed.id } });
    console.log(`📬 إشعارات د. أحمد: ${hisNotifs}`);
  }

  const submissions = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
    take: 5,
    select: {
      id: true,
      submittedAt: true,
      student: { select: { email: true } },
      assignment: { select: { course: true, facultyId: true } },
    },
  });
  console.log("\n📝 آخر 5 تسليمات:");
  submissions.forEach(s => {
    console.log(`- ${s.student.email} | ${s.assignment.course} | facultyId=${s.assignment.facultyId.slice(0, 12)}...`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
