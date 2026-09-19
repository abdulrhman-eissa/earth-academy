import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scryptSync } from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function hash(pw: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

async function main() {
  console.log("🌱 إضافة بيانات تجريبية...");

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

  // دكتورين
  const facultyData = [
    { email: "dr.ahmed@faculty.local", code: "FAC-1001", name: "د. أحمد محمود السيد", title: "أستاذ مساعد", courses: ["التاريخ الإسلامي", "تاريخ الدولة الأموية"] },
    { email: "dr.mona@faculty.local", code: "FAC-1002", name: "د. منى عبد الرحمن", title: "مدرس", courses: ["الحضارة الإسلامية", "النظم الإسلامية"] },
  ];

  for (const f of facultyData) {
    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: {},
      create: { email: f.email, passwordHash: hash("Faculty@1234"), role: "FACULTY" },
    });

    await prisma.facultyProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, employeeCode: f.code, fullName: f.name, academicTitle: f.title, departmentId: department.id },
    });

    for (const course of f.courses) {
      const exists = await prisma.assignment.findFirst({ where: { facultyId: user.id, course } });
      if (!exists) {
        await prisma.assignment.create({
          data: {
            title: `بحث مادة ${course}`,
            description: `يرجى إعداد بحث علمي محكم في موضوعات المادة، بين 3 و 10 صفحات.`,
            course,
            isPublished: true,
            status: "PUBLISHED",
            facultyId: user.id,
          },
        });
        console.log(`✅ أضيف مقرر: ${course} — ${f.name}`);
      }
    }
  }

  // طلاب
  const studentsData = [
    { code: "30001011200010", name: "محمد عبد الله أحمد", year: "LEVEL_1" },
    { code: "30001011200011", name: "عبد الرحمن عوض سعد", year: "LEVEL_2" },
    { code: "30001011200012", name: "فاطمة أحمد محمد", year: "LEVEL_3" },
    { code: "30001011200013", name: "يوسف محمود إبراهيم", year: "LEVEL_1" },
  ];

  for (const s of studentsData) {
    const email = `${s.code}@student.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: hash("Student@1234"), role: "STUDENT" },
    });

    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        studentCode: s.code,
        fullName: s.name,
        departmentId: department.id,
        academicLevel: s.year as never,
        enrollmentYear: 2026,
      },
    });
    console.log(`✅ طالب: ${s.name} (${s.code})`);
  }

  console.log("\n🎉 تم!");
  console.log("\n📋 حسابات الدكاترة:");
  console.log("   dr.ahmed@faculty.local / Faculty@1234");
  console.log("   dr.mona@faculty.local / Faculty@1234");
  console.log("\n📋 حسابات الطلاب (كلهم Student@1234):");
  studentsData.forEach((s) => console.log(`   ${s.code} / Student@1234`));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
