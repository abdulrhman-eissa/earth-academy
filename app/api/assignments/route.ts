import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

const assignmentSelect = {
  id: true, title: true, description: true, course: true, deadline: true,
  isPublished: true, status: true, facultyId: true, createdAt: true, updatedAt: true,
  faculty: {
    select: {
      email: true,
      facultyProfile: { select: { fullName: true, academicTitle: true } },
    },
  },
  _count: { select: { submissions: true } },
} as const;

function text(value: unknown, max = 10000) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max ? value.trim() : null;
}

export async function GET() {
  const studentAuth = await requireRole("STUDENT");
  const session = studentAuth.error
    ? (await requireRole("FACULTY")).session
    : studentAuth.session;

  if (!session) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

  if (session.role === "FACULTY") {
    const assignments = await prisma.assignment.findMany({
      where: { facultyId: session.userId },
      orderBy: { deadline: "asc" },
      select: assignmentSelect,
    });
    return NextResponse.json({ assignments });
  }

  // الطالب: لو اختار تكليف → يرجّع اختياره فقط
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
    select: { chosenAssignmentId: true },
  });

  if (profile?.chosenAssignmentId) {
    const assignments = await prisma.assignment.findMany({
      where: { id: profile.chosenAssignmentId },
      select: assignmentSelect,
    });
    return NextResponse.json({ assignments, locked: true });
  }

  // لم يختر بعد → يرجّع كل المنشور للاختيار
  const where = { isPublished: true, status: "PUBLISHED" as const };

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: { deadline: "asc" },
    select: assignmentSelect,
  });

  return NextResponse.json({ assignments });
}

export async function POST(request: Request) {
  const auth = await requireRole("FACULTY");
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const input = body as Record<string, unknown>;
  const title = text(input.title, 200);
  const description = text(input.description, 10000);
  const course = text(input.course, 200);
  if (!title || !description || !course) {
    return NextResponse.json({ error: "العنوان والوصف والمقرر حقول مطلوبة" }, { status: 400 });
  }

  let deadline: Date | null = null;
  if (input.deadline !== undefined && input.deadline !== null && input.deadline !== "") {
    deadline = new Date(String(input.deadline));
    if (Number.isNaN(deadline.getTime())) {
      return NextResponse.json({ error: "الموعد النهائي غير صالح" }, { status: 400 });
    }
  }

  const isPublished = input.isPublished === true;

  try {
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId: auth.session.userId },
      select: { id: true },
    });

    const assignment = await prisma.assignment.create({
      data: {
        title, description, course, deadline, isPublished,
        status: isPublished ? "PUBLISHED" : "DRAFT",
        facultyId: auth.session.userId,
        facultyProfileId: facultyProfile?.id ?? null,
      },
      select: assignmentSelect,
    });
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("Assignment creation failed:", error);
    return NextResponse.json({ error: "تعذر إنشاء التكليف" }, { status: 500 });
  }
}
