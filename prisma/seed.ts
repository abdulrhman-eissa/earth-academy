import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash, randomBytes, scryptSync } from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Seeding...");

  // College
  const college = await prisma.college.upsert({
    where: { code: "AZHAR-AR" },
    update: {},
    create: {
      name: "كلية اللغة العربية بالقاهرة",
      code: "AZHAR-AR",
    },
  });

  // Department
  const department = await prisma.department.upsert({
    where: { collegeId_code: { collegeId: college.id, code: "HIST" } },
    update: {},
    create: {
      name: "قسم التاريخ والحضارة",
      code: "HIST",
      collegeId: college.id,
    },
  });

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@earth.edu" },
    update: {},
    create: {
      email: "admin@earth.edu",
      passwordHash: hashPassword("Admin@1234"),
      role: "ADMIN",
    },
  });

  // Affairs
  const affairs = await prisma.user.upsert({
    where: { email: "affairs@earth.edu" },
    update: {},
    create: {
      email: "affairs@earth.edu",
      passwordHash: hashPassword("Affairs@1234"),
      role: "AFFAIRS",
    },
  });

  // Faculty
  const facultyUser = await prisma.user.upsert({
    where: { email: "faculty@earth.edu" },
    update: {},
    create: {
      email: "faculty@earth.edu",
      passwordHash: hashPassword("Faculty@1234"),
      role: "FACULTY",
    },
  });

  await prisma.facultyProfile.upsert({
    where: { userId: facultyUser.id },
    update: {},
    create: {
      userId: facultyUser.id,
      employeeCode: "FAC-001",
      fullName: "د. أحمد محمود",
      academicTitle: "أستاذ مساعد",
      departmentId: department.id,
    },
  });

  // Student
  const studentUser = await prisma.user.upsert({
    where: { email: "student@earth.edu" },
    update: {},
    create: {
      email: "student@earth.edu",
      passwordHash: hashPassword("Student@1234"),
      role: "STUDENT",
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentCode: "STU-2026-001",
      fullName: "محمد عبد الله",
      departmentId: department.id,
      academicLevel: "LEVEL_1",
      enrollmentYear: 2026,
    },
  });

  console.log("✅ Seed done.");
  console.log("👤 admin@earth.edu   / Admin@1234");
  console.log("👤 affairs@earth.edu / Affairs@1234");
  console.log("👤 faculty@earth.edu / Faculty@1234");
  console.log("👤 student@earth.edu / Student@1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
