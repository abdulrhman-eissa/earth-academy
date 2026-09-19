import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SAMPLE_RESEARCHES = [
  {
    studentCode: "STU-2026-001",
    title: "الدولة الأموية: النشأة والتوسع",
    text: `تُعد الدولة الأموية من أهم الدول الإسلامية في التاريخ، حيث قامت على أنقاض الخلافة الراشدة بعد عام الجماعة سنة 41 هجرية. أسسها معاوية بن أبي سفيان رضي الله عنه، واتخذ من دمشق عاصمة لها. امتدت فتوحاتها شرقاً حتى بلاد ما وراء النهر، وغرباً حتى الأندلس. تميزت بالتنظيم الإداري المحكم، ونظام البريد، والعملة الإسلامية الموحدة، كما ازدهرت فيها العلوم والترجمة. انتهت سنة 132 هجرية على يد العباسيين.`,
  },
  {
    studentCode: "STU-2026-001",
    title: "الحضارة الإسلامية في الأندلس",
    text: `شكلت الحضارة الإسلامية في الأندلس صفحة مضيئة في التاريخ الإنساني. امتدت قرابة ثمانية قرون، وترك خلالها المسلمون إرثاً حضارياً هائلاً في العمارة والعلوم والفلسفة والطب. برز فيها علماء كبار مثل ابن رشد وابن حزم والزهراوي. كما كانت قرطبة وغرناطة وإشبيلية مراكز علمية تستقطب طلاب العلم من أوروبا. أسهمت هذه الحضارة في نقل التراث اليوناني والشرقي إلى أوروبا، فكانت جسراً بين الشرق والغرب.`,
  },
];

async function main() {
  console.log("🌱 بدء إضافة أبحاث تجريبية...");

  const student = await prisma.studentProfile.findUnique({
    where: { studentCode: SAMPLE_RESEARCHES[0].studentCode },
    select: { id: true, userId: true, fullName: true },
  });

  if (!student) {
    console.error("❌ لم أجد الطالب. تأكد من تشغيل seed الأساسي أولاً.");
    process.exit(1);
  }

  console.log(`👤 الطالب: ${student.fullName}`);

  const assignments = await prisma.assignment.findMany({
    where: { isPublished: true, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 2,
    select: { id: true, title: true, course: true },
  });

  if (assignments.length === 0) {
    console.error("❌ لا توجد تكليفات منشورة. اطلب من الأستاذ ينشر مادة أولاً.");
    process.exit(1);
  }

  console.log(`📚 عدد التكليفات المتاحة: ${assignments.length}`);

  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i];
    const sample = SAMPLE_RESEARCHES[i % SAMPLE_RESEARCHES.length];

    const existing = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: assignment.id,
          studentId: student.userId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.submission.update({
        where: { id: existing.id },
        data: {
          text: sample.text,
          defenseAnswer: sample.title,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
      console.log(`🔄 تم تحديث تسليم: ${assignment.course}`);
    } else {
      await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId: student.userId,
          studentProfileId: student.id,
          text: sample.text,
          defenseAnswer: sample.title,
          pasteAttempts: 0,
          status: "SUBMITTED",
        },
      });
      console.log(`✅ تم إضافة تسليم: ${assignment.course}`);
    }
  }

  const total = await prisma.submission.count();
  console.log(`\n📊 إجمالي التسليمات في قاعدة البيانات: ${total}`);
  console.log("🎉 تم!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
