import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const studentCode = "30001011200077";
  const profile = await prisma.studentProfile.findUnique({
    where: { studentCode },
    select: { id: true, userId: true, fullName: true, chosenAssignmentId: true },
  });
  console.log("👤", profile);

  const subs = await prisma.submission.findMany({
    where: { studentId: profile?.userId },
    select: { id: true, status: true, assignmentId: true, submittedAt: true },
  });
  console.log("📝 التسليمات:", subs);

  const assignment = await prisma.assignment.findFirst({
    where: { course: "تاريخ الدولة الأموية" },
    select: { id: true, title: true, isPublished: true, status: true },
  });
  console.log("📚 التكليف:", assignment);
}

main().catch(console.error).finally(() => prisma.$disconnect());
