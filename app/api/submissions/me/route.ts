import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireRole("STUDENT");
  if ("error" in auth) return auth.error;

  const submissions = await prisma.submission.findMany({
    where: { studentId: auth.session.userId },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      text: true,
      score: true,
      notes: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
      assignment: { select: { id: true, title: true, course: true, deadline: true } },
    },
  });

  return NextResponse.json({ submissions });
}
