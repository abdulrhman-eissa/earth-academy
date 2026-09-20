import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "node:crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

const RESEARCH_TEXT = `الحضارة الإسلامية في الأندلس: إسهاماتها في العلوم والفنون

مقدمة

تُعد الحضارة الإسلامية في الأندلس من أزهى صفحات التاريخ الإسلامي، حيث امتدت قرابة ثمانية قرون، وتركت إرثاً حضارياً هائلاً ما زال يشهد به التاريخ حتى يومنا هذا. بدأت الفتوحات الإسلامية للأندلس سنة اثنتين وتسعين هجرية، واستمرت هذه الحضارة حتى سقوط غرناطة سنة تسع وأربعين وتسعمائة هجرية، تاركة خلفها إرثاً حضارياً وعلمياً لا يزال يؤثر في الحضارة الغربية حتى اليوم.

الفصل الأول: نشأة الحضارة الإسلامية في الأندلس

دخل المسلمون الأندلس على يد طارق بن زياد وموسى بن نصير في عهد الخليفة الأموي الوليد بن عبد الملك، حيث عبر طارق بن زياد المضيق الذي سمي باسمه لاحقاً، والتقى بجيش الملك رودريك في معركة وادي بكة، وانتصر المسلمون انتصاراً حاسماً، ثم تتابعت فتوحات المدن الأندلسية حتى أصبحت الأندلس كلها تحت الحكم الإسلامي.

وقد جعل المسلمون من قرطبة عاصمة لهم، وأصبحت من أعظم مدن العالم في ذلك الوقت، حتى قيل إنها كانت أكبر مدن أوروبا، وبلغ عدد سكانها أكثر من نصف مليون نسمة.

الفصل الثاني: العلوم في الأندلس

شهدت الأندلس نهضة علمية هائلة في مختلف المجالات، فقد ازدهرت علوم الطب والرياضيات والفلك والكيمياء والصيدلة والنبات. ومن أشهر العلماء الأندلسيين:

ابن رشد: الفيلسوف والطبيب الذي شرح فلسفة أرسطو شرحاً دقيقاً، وترجمت كتبه إلى اللاتينية، فأثرت في الفلسفة الأوروبية أثراً بالغاً. ومن أشهر كتبه: تهافت التهافت، وفصل المقال.

ابن حزم: الفقيه والمؤرخ الذي ألف كتابه الشهير طوق الحمامة في الألفة والألاف، وهو من أعظم الكتب في علم النفس.

الزهراوي: الجراح الكبير الذي ألف كتاب التصريف لمن عجز عن التأليف، وهو من أشهر كتب الطب في العصور الوسطى، وقد تُرجم إلى اللاتينية واستخدم في الجامعات الأوروبية قروناً طويلة.

ابن البيطار: عالم النبات والصيدلة الذي ألف الجامع لمفردات الأدوية والأغذية، ووصف فيه أكثر من ألف وأربعمائة نوع من النباتات والعقاقير.

الفصل الثالث: العمارة والفنون في الأندلس

تميزت العمارة الإسلامية في الأندلس بجمالها وإبداعها، حيث ابتكر المعماريون المسلمون أنماطاً معمارية فريدة، مثل الأقواس المتعددة الفصوص، والزخارف الجصية، والفسيفساء الملونة. ومن أعظم معالم العمارة الأندلسية:

مسجد قرطبة الكبير: الذي بني في عهد عبد الرحمن الداخل، ويعد من أكبر مساجد العالم الإسلامي، واشتهر بأقواسه المزدوجة التي زينت أرجاءه.

قصر الحمراء في غرناطة: الذي يعد من أعظم القصور في التاريخ، حيث جمع بين العمارة والفنون المختلفة، واشتهر بزخارفه الجصية وفواراته الجميلة.

مسجد إشبيلية: الذي كان من أكبر مساجد الأندلس، وقد بقي منه مئذنته الشهيرة التي أصبحت برجاً للأجراس في الكنيسة التي بنيت مكانه.

الفصل الرابع: التأثير الأوروبي للحضارة الأندلسية

كان للحضارة الإسلامية في الأندلس أثر بالغ في أوروبا، حيث كانت جسراً لنقل التراث اليوناني والشرقي إلى الغرب. فقد تُرجمت الكتب العربية إلى اللاتينية، وازدهرت حركة الترجمة في طليطلة وقرطبة، ونقلت إلى أوروبا علوم الطب والرياضيات والفلك والفلسفة.

كما كان لجامعات الأندلس أثر كبير في التعليم الأوروبي، وقد أخذ الأوروبيون عن المسلمين نظام الجامعات والمكتبات، وطرق التدريس، والمناهج العلمية.

خاتمة

خلاصة القول، إن الحضارة الإسلامية في الأندلس تمثل صفحة مضيئة في تاريخ الحضارة الإنسانية، فقد أسهمت في إثراء الحضارة الإنسانية في مختلف المجالات، وكانت جسراً للتواصل بين الشرق والغرب، ونموذجاً للتسامح والتعايش بين الأديان والثقافات المختلفة.

المصادر والمراجع

- نفح الطيب في غصن الأندلس الرطيب، للمقري
- تاريخ الأندلس، للدكتور عبد الرحمن علي الحجي
- الحضارة الإسلامية في الأندلس، للدكتور أحمد شلبي
- الأندلس في التاريخ، للدكتور حسين مؤنس`;

async function main() {
  console.log("🌱 إنشاء طالب وبحث 800 كلمة...");

  const college = await prisma.college.upsert({
    where: { code: "AZHAR-AR" },
    update: {},
    create: { name: "كلية اللغة العربية بالقاهرة", code: "AZHAR-AR" },
  });

  const department = await prisma.department.upsert({
    where: { collegeId_code: { collegeId: college.id, code: "HIST" } },
    update: {},
    create: { name: "قسم التاريخ والحضارة", code: "HIST", collegeId: college.id },
  });

  const studentCode = "30001011200077";
  const email = `${studentCode}@student.local`;

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: hashPassword("Student@1234"), role: "STUDENT" },
  });

  const profile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: { fullName: "أحمد سامي عبد الفتاح" },
    create: {
      userId: user.id,
      studentCode,
      fullName: "أحمد سامي عبد الفتاح",
      departmentId: department.id,
      academicLevel: "LEVEL_2",
      enrollmentYear: 2026,
    },
  });

  console.log(`✅ الطالب: ${profile.fullName} (${profile.studentCode})`);

  const drAhmed = await prisma.user.findUnique({
    where: { email: "dr.ahmed@faculty.local" },
    select: { id: true, facultyProfile: { select: { fullName: true } } },
  });

  if (!drAhmed) {
    console.error("❌ د. أحمد غير موجود");
    process.exit(1);
  }

  const assignment = await prisma.assignment.findFirst({
    where: { facultyId: drAhmed.id, course: "تاريخ الدولة الأموية" },
    select: { id: true, title: true, course: true },
  });

  if (!assignment) {
    console.error("❌ لم أجد مادة تاريخ الدولة الأموية");
    process.exit(1);
  }

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { chosenAssignmentId: assignment.id },
  });

  const htmlParagraphs = RESEARCH_TEXT.split("\n\n").filter((p) => p.trim()).map((p) => {
    const trimmed = p.trim();
    if (trimmed.match(/^(مقدمة|الفصل|خاتمة|المصادر)/)) {
      return `<h2>${trimmed}</h2>`;
    }
    return `<p>${trimmed}</p>`;
  }).join("");

  await prisma.submission.deleteMany({ where: { studentId: user.id } });

  await prisma.submission.create({
    data: {
      assignmentId: assignment.id,
      studentId: user.id,
      studentProfileId: profile.id,
      text: RESEARCH_TEXT,
      htmlContent: htmlParagraphs,
      defenseAnswer: "الحضارة الإسلامية في الأندلس: إسهاماتها في العلوم والفنون",
      pasteAttempts: 0,
      status: "SUBMITTED",
      activityLog: [
        { at: new Date(Date.now() - 2400000).toISOString(), type: "OPEN_EDITOR", details: "فتح المحرر" },
        { at: new Date(Date.now() - 1200000).toISOString(), type: "SAVE_DRAFT", details: "حفظ مسودة" },
        { at: new Date().toISOString(), type: "SUBMIT_FINAL", details: "التسليم النهائي" },
      ] as never,
    },
  });

  const wordCount = RESEARCH_TEXT.trim().split(/\s+/).length;
  console.log(`\n📊 عدد الكلمات: ${wordCount}`);
  console.log(`📄 عدد الصفحات التقريبي: ${Math.ceil(wordCount / 250)}`);
  console.log(`\n📋 بيانات الطالب:`);
  console.log(`   الرقم القومي: ${studentCode}`);
  console.log(`   كلمة المرور: Student@1234`);
  console.log(`\n🎉 تم!`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
