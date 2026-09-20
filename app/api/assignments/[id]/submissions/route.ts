import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

interface ActivityEntry {
  at: string;
  type: string;
  details?: string;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("STUDENT");
  if ("error" in auth) return auth.error;

  const { id: assignmentId } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const text = typeof input.text === "string" ? input.text.trim() : "";
  const htmlContent = typeof input.htmlContent === "string" ? input.htmlContent : null;
  const defenseAnswer = typeof input.defenseAnswer === "string" ? input.defenseAnswer.trim() : null;
  const pasteAttempts = typeof input.pasteAttempts === "number" ? input.pasteAttempts : 0;
  const action = input.action === "submit" ? "submit" : "draft";
  const activityLog = Array.isArray(input.activityLog) ? (input.activityLog as ActivityEntry[]) : [];

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, isPublished: true, status: true, title: true, course: true, facultyId: true },
  });
  if (!assignment || !assignment.isPublished || assignment.status !== "PUBLISHED") {
    return NextResponse.json({ error: "التكليف غير متاح" }, { status: 404 });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: auth.session.userId },
    select: { id: true, chosenAssignmentId: true, fullName: true, studentCode: true },
  });

  if (!profile?.chosenAssignmentId) {
    return NextResponse.json({ error: "يجب اختيار تكليف أولاً" }, { status: 403 });
  }
  if (profile.chosenAssignmentId !== assignmentId) {
    return NextResponse.json({ error: "لا يمكنك التسليم لتكليف غير الذي اخترته" }, { status: 403 });
  }

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: auth.session.userId } },
    select: { id: true, status: true },
  });
  if (existing && existing.status === "REVIEWED") {
    return NextResponse.json({ error: "تمت مراجعة بحثك بالفعل" }, { status: 409 });
  }

  if (action === "submit") {
    if (text.length < 50) {
      return NextResponse.json({ error: "نص البحث قصير جداً" }, { status: 400 });
    }
    if (!defenseAnswer || defenseAnswer.trim().length < 3) {
      return NextResponse.json({ error: "يجب إدخال عنوان البحث" }, { status: 400 });
    }
  }

  const status = action === "submit" ? "SUBMITTED" : "DRAFT";

  try {
    const submission = await prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: auth.session.userId } },
      update: {
        text,
        htmlContent,
        defenseAnswer,
        pasteAttempts,
        status,
        activityLog: activityLog as never,
        ...(action === "submit" ? { submittedAt: new Date() } : {}),
      },
      create: {
        assignmentId,
        studentId: auth.session.userId,
        studentProfileId: profile.id,
        text,
        htmlContent,
        defenseAnswer,
        pasteAttempts,
        status,
        activityLog: activityLog as never,
      },
      select: { id: true, status: true, submittedAt: true },
    });

    if (action === "submit") {
      await notify({
        userId: assignment.facultyId,
        type: "RESEARCH_SUBMITTED",
        title: "تسليم بحث جديد",
        body: `قام الطالب ${profile.fullName} (${profile.studentCode}) بتسليم بحثه في مادة: ${assignment.course}`,
        relatedId: submission.id,
      });

      await audit({
        actorId: auth.session.userId,
        actorEmail: profile.studentCode,
        actorRole: "STUDENT",
        action: "SUBMIT_RESEARCH",
        targetType: "Submission",
        targetId: submission.id,
        details: `مادة: ${assignment.course} — ${assignment.title}`,
        request,
      });
    }

    return NextResponse.json({ submission, action }, { status: 201 });
  } catch (error) {
    console.error("Submission save failed:", error);
    return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 });
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("STUDENT");
  if ("error" in auth) return auth.error;

  const { id: assignmentId } = await context.params;

  const submission = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: auth.session.userId } },
    select: {
      id: true,
      text: true,
      htmlContent: true,
      defenseAnswer: true,
      status: true,
      submittedAt: true,
      activityLog: true,
      pasteAttempts: true,
    },
  });

  return NextResponse.json({ submission });
}
