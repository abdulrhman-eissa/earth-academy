import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { readSessionToken, ALL_AUTH_COOKIES, type AuthRole } from "@/lib/session-token";

interface SessionInfo {
  userId: string;
  role: AuthRole;
}

async function getAllSessions(): Promise<SessionInfo[]> {
  const cookieStore = await cookies();
  const sessions: SessionInfo[] = [];
  for (const name of ALL_AUTH_COOKIES) {
    const value = cookieStore.get(name)?.value;
    if (!value) continue;
    const session = await readSessionToken(value);
    if (session) sessions.push({ userId: session.userId, role: session.role });
  }
  return sessions;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const sessions = await getAllSessions();
  if (sessions.length === 0) {
    return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  }

  const { id } = await context.params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      text: true,
      htmlContent: true,
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

  // ✅ نفحص كل الجلسات المتاحة
  const allowed = sessions.some((s) =>
    s.role === "ADMIN" ||
    s.role === "AFFAIRS" ||
    (s.role === "FACULTY" && submission.assignment.facultyId === s.userId) ||
    (s.role === "STUDENT" && submission.student.id === s.userId)
  );

  if (!allowed) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  return NextResponse.json({ submission });
}
