import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireRole("AFFAIRS");
  if ("error" in auth) return auth.error;

  const rows = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      score: true,
      notes: true,
      status: true,
      submittedAt: true,
      student: {
        select: {
          email: true,
          studentProfile: { select: { fullName: true, studentCode: true, academicLevel: true } },
        },
      },
      assignment: { select: { title: true, course: true } },
    },
  });

  return NextResponse.json({ rows });
}
