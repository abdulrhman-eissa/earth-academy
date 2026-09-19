import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if ("error" in auth) return auth.error;

  const submissions = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
    select: {
      id: true, text: true, score: true, notes: true, status: true, submittedAt: true,
      student: { select: { email: true, studentProfile: { select: { fullName: true, studentCode: true } } } },
      assignment: {
        select: {
          title: true, course: true,
          faculty: { select: { facultyProfile: { select: { fullName: true } } } },
        },
      },
    },
  });

  return NextResponse.json({ submissions });
}
