import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireRole("FACULTY");
  if ("error" in auth) return auth.error;

  const assignmentId = new URL(request.url).searchParams.get("assignmentId");

  const submissions = await prisma.submission.findMany({
    where: {
      assignment: { facultyId: auth.session.userId },
      ...(assignmentId ? { assignmentId } : {}),
    },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      text: true,
      score: true,
      notes: true,
      status: true,
      submittedAt: true,
      assignment: { select: { id: true, title: true, course: true } },
      student: {
        select: {
          email: true,
          studentProfile: { select: { fullName: true, studentCode: true, academicLevel: true } },
        },
      },
    },
  });

  return NextResponse.json({ submissions });
}
