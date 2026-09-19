import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/auth";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

  const { id } = await context.params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      text: true,
      score: true,
      notes: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
      student: {
        select: {
          id: true,
          email: true,
          studentProfile: { select: { fullName: true, studentCode: true, academicLevel: true } },
        },
      },
      assignment: {
        select: {
          id: true, title: true, course: true, facultyId: true,
          faculty: { select: { facultyProfile: { select: { fullName: true, academicTitle: true } } } },
        },
      },
    },
  });

  if (!submission) return NextResponse.json({ error: "البحث غير موجود" }, { status: 404 });

  // صلاحيات الوصول
  const allowed =
    session.role === "ADMIN" ||
    session.role === "AFFAIRS" ||
    (session.role === "FACULTY" && submission.assignment.facultyId === session.userId) ||
    (session.role === "STUDENT" && submission.student.id === session.userId);

  if (!allowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  return NextResponse.json({ submission });
}
