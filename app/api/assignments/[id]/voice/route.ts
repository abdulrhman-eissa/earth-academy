import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET  → جلب التسجيل الصوتي للمادة
 * POST → رفع أو تحديث التسجيل (للأستاذ فقط)
 * DELETE → حذف التسجيل (للأستاذ فقط)
 */

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  // نجرب كل الأدوار المسموح لها
  const session =
    (await currentSession("FACULTY")) ||
    (await currentSession("STUDENT")) ||
    (await currentSession("ADMIN")) ||
    (await currentSession("AFFAIRS"));

  if (!session) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

  const { id: assignmentId } = await context.params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      voiceData: true,
      voiceMimeType: true,
      voiceDuration: true,
      voiceUpdatedAt: true,
      facultyId: true,
      isPublished: true,
    },
  });

  if (!assignment) return NextResponse.json({ error: "المادة غير موجودة" }, { status: 404 });

  const allowed =
    session.role === "ADMIN" ||
    session.role === "AFFAIRS" ||
    (session.role === "FACULTY" && assignment.facultyId === session.userId) ||
    (session.role === "STUDENT" && assignment.isPublished);

  if (!allowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  if (!assignment.voiceData) {
    return NextResponse.json({ voice: null });
  }

  return NextResponse.json({
    voice: {
      data: assignment.voiceData,
      mimeType: assignment.voiceMimeType || "audio/webm",
      duration: assignment.voiceDuration || 0,
      updatedAt: assignment.voiceUpdatedAt,
    },
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await currentSession("FACULTY");
  if (!session) return NextResponse.json({ error: "يجب تسجيل الدخول كعضو هيئة تدريس" }, { status: 401 });
  if (session.role !== "FACULTY") return NextResponse.json({ error: "غير مصرح — للأستاذ فقط" }, { status: 403 });

  const { id: assignmentId } = await context.params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { facultyId: true },
  });

  if (!assignment) return NextResponse.json({ error: "المادة غير موجودة" }, { status: 404 });
  if (assignment.facultyId !== session.userId) {
    return NextResponse.json({ error: "لا يمكنك تعديل هذه المادة" }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const data = typeof input.data === "string" ? input.data : "";
  const mimeType = typeof input.mimeType === "string" ? input.mimeType : "audio/webm";
  const duration = typeof input.duration === "number" ? input.duration : 0;

  if (!data || data.length < 100) {
    return NextResponse.json({ error: "التسجيل فارغ أو قصير جداً" }, { status: 400 });
  }

  if (data.length > 7 * 1024 * 1024) {
    return NextResponse.json({ error: "حجم التسجيل كبير جداً (الحد الأقصى 5 ميجا)" }, { status: 413 });
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      voiceData: data,
      voiceMimeType: mimeType,
      voiceDuration: Math.round(duration),
      voiceUpdatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await currentSession("FACULTY");
  if (!session || session.role !== "FACULTY") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id: assignmentId } = await context.params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { facultyId: true },
  });

  if (!assignment || assignment.facultyId !== session.userId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      voiceData: null,
      voiceMimeType: null,
      voiceDuration: null,
      voiceUpdatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
