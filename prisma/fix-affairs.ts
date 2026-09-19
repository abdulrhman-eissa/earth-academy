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
  console.log("🔧 إصلاح حساب شؤون الطلاب...");

  const users = [
    { email: "affairs@earth.edu", role: "AFFAIRS" as const, password: "Affairs@1234" },
    { email: "admin@earth.edu", role: "ADMIN" as const, password: "Admin@1234" },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: { passwordHash: hashPassword(u.password), role: u.role, status: "ACTIVE" },
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
  console.log("   affairs@earth.edu / Affairs@1234");
  console.log("   admin@earth.edu / Admin@1234");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
