import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

// GET: هل الطالب اختار تكليف؟ لو أيوه، رجّع تفاصيله
export async function GET() {
  const auth = await requireRole("STUDENT");
  if ("error" in auth) return auth.error;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: auth.session.userId },
    select: {
      chosenAssignmentId: true,
      chosenAssignment: {
        select: {
          id: true,
          title: true,
          description: true,
          course: true,
          deadline: true,
          faculty: {
            select: {
              email: true,
              facultyProfile: { select: { fullName: true, academicTitle: true } },
            },
          },
        },
      },
    },
  });

  if (!profile) return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

  return NextResponse.json({
    chosen: profile.chosenAssignment,
    hasChosen: Boolean(profile.chosenAssignmentId),
  });
}

// POST: اختيار التكليف (مرة واحدة فقط)
export async function POST(request: Request) {
  const auth = await requireRole("STUDENT");
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const assignmentId = (body as Record<string, unknown>).assignmentId;
  if (typeof assignmentId !== "string" || !assignmentId) {
    return NextResponse.json({ error: "معرّف التكليف مطلوب" }, { status: 400 });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: auth.session.userId },
    select: { id: true, chosenAssignmentId: true },
  });
  if (!profile) return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

  if (profile.chosenAssignmentId) {
    return NextResponse.json(
      { error: "لقد اخترت تكليفك مسبقاً، لا يمكن التغيير بعد الاختيار." },
      { status: 409 }
    );
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, isPublished: true, status: true },
  });
  if (!assignment || !assignment.isPublished || assignment.status !== "PUBLISHED") {
    return NextResponse.json({ error: "التكليف غير متاح" }, { status: 404 });
  }

  const updated = await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { chosenAssignmentId: assignmentId },
    select: {
      chosenAssignment: {
        select: {
          id: true, title: true, course: true,
          faculty: { select: { facultyProfile: { select: { fullName: true } } } },
        },
      },
    },
  });

  return NextResponse.json({ success: true, chosen: updated.chosenAssignment });
}
