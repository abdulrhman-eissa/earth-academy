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

const RESEARCH_TEXT = `الدولة الأموية: النشأة والتوسع والإنجازات الحضارية

مقدمة:
تُعد الدولة الأموية من أعظم الدول الإسلامية في التاريخ، وقد قامت على أنقاض الخلافة الراشدة بعد أحداث الفتنة الكبرى وعام الجماعة سنة 41 هجرية الموافق 661 ميلادية. أسسها معاوية بن أبي سفيان رضي الله عنه، واتخذ من مدينة دمشق عاصمة لها بعد أن كانت الكوفة عاصمة للخلافة الراشدة. وقد امتدت هذه الدولة قرابة تسعين عاماً، شهدت خلالها تطورات سياسية وعسكرية وحضارية هائلة جعلتها منارة للعالم الإسلامي في ذلك العصر.

الفصل الأول: نشأة الدولة الأموية
جاءت نشأة الدولة الأموية نتيجة لظروف سياسية معقدة مرّ بها العالم الإسلامي بعد مقتل الخليفة عثمان بن عفان رضي الله عنه، وما تلا ذلك من فتنة كبرى بين المسلمين. وبعد تنازل الحسن بن علي رضي الله عنه عن الخلافة لمعاوية بن أبي سفيان، سُمّي ذلك العام بـ"عام الجماعة" لاجتماع كلمة المسلمين فيه. اتخذ معاوية من دمشق عاصمةً لدولته، وكانت دمشق تتمتع بموقع استراتيجي متميز يربط بين الشام والحجاز والعراق ومصر. وقد حرص معاوية على تنظيم الدولة تنظيماً محكماً، فأنشأ الدواوين، ونظّم الجيش، وأقام نظاماً إدارياً قوياً.

الفصل الثاني: التوسع العسكري والفتوحات
شهدت الدولة الأموية توسعاً عسكرياً غير مسبوق، حيث امتدت فتوحاتها شرقاً حتى بلاد ما وراء النهر والصين، وغرباً حتى بلاد الأندلس والمغرب الأقصى. في عهد معاوية بن أبي سفيان، فُتحت بلاد السند وكابل، ووصلت الجيوش الإسلامية إلى حدود الصين. وفي عهد عبد الملك بن مروان، تم توحيد العملة الإسلامية وضربها بالعربية، مما ساعد على تقوية الاقتصاد الإسلامي. أما في عهد الوليد بن عبد الملك، فقد بلغت الفتوحات ذروتها، حيث فُتحت الأندلس على يد طارق بن زياد وموسى بن نصير سنة 92 هجرية، كما فُتحت بلاد السند بشكل نهائي، ووصلت الجيوش الإسلامية إلى حدود الصين وفرنسا.

الفصل الثالث: التنظيم الإداري والحضاري
تميزت الدولة الأموية بتنظيم إداري محكم ساعد على استقرارها. فقد أنشأ معاوية ديوان الخاتم للتحقق من صحة الرسائل، ونظّم نظام البريد الذي كان يربط أطراف الدولة ببعضها البعض. كما أنشأ نظام الحرس الشخصي للخليفة، وأقام نظاماً قضائياً عادلاً. في المجال الحضاري، شهدت الدولة الأموية نهضة عمرانية هائلة، حيث بُنيت المساجد الكبرى مثل المسجد الأموي الكبير في دمشق، وقبة الصخرة في القدس، ومسجد قرطبة في الأندلس. كما ازدهرت العلوم والترجمة والفنون، وأُنشئت المدارس والمكتبات.

الفصل الرابع: أسباب سقوط الدولة الأموية
على الرغم من الإنجازات العظيمة للدولة الأموية، إلا أنها سقطت سنة 132 هجرية الموافق 750 ميلادية على يد العباسيين. ويعود سقوطها إلى عدة أسباب، منها: اتساع رقعة الدولة مما أدى إلى صعوبة السيطرة على أطرافها، والصراعات الداخلية على الخلافة، والخلافات بين القبائل العربية، وظهور الدعوة العباسية التي استغلت هذه الصراعات. كما كان للثورات المتعددة في العراق وخراسان دور كبير في إضعاف الدولة.

خاتمة:
خلاصة القول، إن الدولة الأموية تمثل صفحة مضيئة في التاريخ الإسلامي، فقد أسهمت في نشر الإسلام في أرجاء المعمورة، وأرست قواعد التنظيم الإداري والحضاري الذي استفادت منه الدول الإسلامية اللاحقة. وعلى الرغم من سقوطها، إلا أن إنجازاتها الحضارية والعسكرية ظلت خالدة، ونموذجاً يحتذى به في الحكم والإدارة والفتوحات.

المصادر والمراجع:
- تاريخ الطبري، للإمام الطبري
- الكامل في التاريخ، لابن الأثير
- تاريخ الدولة الأموية، للدكتور محمود شاكر
- الدولة الأموية وعوامل ازدهارها، للدكتور أحمد شلبي
- قيام وسقوط الدولة الأموية، للدكتور محمد رجب البيومي`;

async function main() {
  console.log("🌱 إنشاء حساب الطالب والبحث...");

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

  const studentCode = "30001011200099";
  const email = `${studentCode}@student.local`;

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: hashPassword("Student@1234"), role: "STUDENT" },
  });

  const profile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: { fullName: "عيسى محمد محمود عيسى" },
    create: {
      userId: user.id,
      studentCode,
      fullName: "عيسى محمد محمود عيسى",
      departmentId: department.id,
      academicLevel: "LEVEL_2",
      enrollmentYear: 2026,
    },
  });

  console.log(`✅ الطالب: ${profile.fullName} (${profile.studentCode})`);

  // البحث عن تكليف "تاريخ الدولة الأموية" للدكتور أحمد
  const drAhmed = await prisma.user.findUnique({
    where: { email: "dr.ahmed@faculty.local" },
    select: { id: true, facultyProfile: { select: { fullName: true } } },
  });

  if (!drAhmed) {
    console.error("❌ الدكتور أحمد غير موجود");
    process.exit(1);
  }

  const assignment = await prisma.assignment.findFirst({
    where: { facultyId: drAhmed.id, course: "تاريخ الدولة الأموية" },
    select: { id: true, title: true, course: true },
  });

  if (!assignment) {
    console.error("❌ لم أجد مادة 'تاريخ الدولة الأموية' للدكتور أحمد");
    process.exit(1);
  }

  console.log(`📚 المادة: ${assignment.course}`);
  console.log(`👨‍🏫 الأستاذ: ${drAhmed.facultyProfile?.fullName}`);

  // ربط الطالب بالتكليف (اختيار نهائي)
  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { chosenAssignmentId: assignment.id },
  });

  // إنشاء التسليم
  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: user.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.submission.update({
      where: { id: existing.id },
      data: {
        text: RESEARCH_TEXT,
        defenseAnswer: "الدولة الأموية: النشأة والتوسع والإنجازات الحضارية",
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
    console.log("🔄 تم تحديث التسليم");
  } else {
    await prisma.submission.create({
      data: {
        assignmentId: assignment.id,
        studentId: user.id,
        studentProfileId: profile.id,
        text: RESEARCH_TEXT,
        defenseAnswer: "الدولة الأموية: النشأة والتوسع والإنجازات الحضارية",
        pasteAttempts: 0,
        status: "SUBMITTED",
      },
    });
    console.log("✅ تم إنشاء التسليم");
  }

  const wordCount = RESEARCH_TEXT.split(/\s+/).length;
  console.log(`\n📊 إحصائيات البحث:`);
  console.log(`   عدد الكلمات: ${wordCount}`);
  console.log(`   عدد الصفحات التقريبي: ${Math.ceil(wordCount / 250)}`);
  console.log(`\n🎉 تم! يمكنك الآن الدخول كد. أحمد ورؤية البحث.\n`);
  console.log(`📋 بيانات الطالب:`);
  console.log(`   الرقم القومي: ${studentCode}`);
  console.log(`   كلمة المرور: Student@1234`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
