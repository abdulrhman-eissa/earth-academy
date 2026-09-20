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

async function main() {
  console.log("🔧 إصلاح كلمات المرور...");

  const users = [
    { email: "admin@earth.edu", password: "Admin@1234", role: "ADMIN" as const },
    { email: "affairs@earth.edu", password: "Affairs@1234", role: "AFFAIRS" as const },
    { email: "faculty@earth.edu", password: "Faculty@1234", role: "FACULTY" as const },
    { email: "student@earth.edu", password: "Student@1234", role: "STUDENT" as const },
    { email: "dr.ahmed@faculty.local", password: "Faculty@1234", role: "FACULTY" as const },
    { email: "dr.mona@faculty.local", password: "Faculty@1234", role: "FACULTY" as const },
    { email: "30001011200010@student.local", password: "Student@1234", role: "STUDENT" as const },
    { email: "30001011200011@student.local", password: "Student@1234", role: "STUDENT" as const },
    { email: "30001011200012@student.local", password: "Student@1234", role: "STUDENT" as const },
    { email: "30001011200013@student.local", password: "Student@1234", role: "STUDENT" as const },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: { passwordHash: hashPassword(u.password) },
      });
      console.log(`🔄 تم تحديث: ${u.email}`);
    } else {
      await prisma.user.create({
        data: { email: u.email, passwordHash: hashPassword(u.password), role: u.role },
      });
      console.log(`✅ تم إنشاء: ${u.email}`);
    }
  }

  console.log("\n🎉 تم!");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
