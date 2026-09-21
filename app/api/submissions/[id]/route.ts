import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("FACULTY");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const score = typeof input.score === "number" ? input.score : null;
  const notes = typeof input.notes === "string" ? input.notes : null;

  if (score !== null && (score < 0 || score > 20)) {
    return NextResponse.json({ error: "الدرجة يجب أن تكون بين 0 و 100" }, { status: 400 });
  }

  const existing = await prisma.submission.findUnique({
    where: { id },
    select: { assignment: { select: { facultyId: true } } },
  });

  if (!existing) return NextResponse.json({ error: "التسليم غير موجود" }, { status: 404 });
  if (existing.assignment.facultyId !== auth.session.userId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const updated = await prisma.submission.update({
    where: { id },
    data: {
      score: score ?? undefined,
      notes: notes ?? undefined,
      status: score !== null ? "REVIEWED" : undefined,
    },
    select: {
      id: true,
      score: true,
      notes: true,
      status: true,
      updatedAt: true,
    },
  });

  if (score !== null) {
    const info = await prisma.submission.findUnique({
      where: { id },
      select: {
        studentId: true,
        assignment: { select: { course: true, title: true } },
      },
    });
    if (info) {
      await notify({
        userId: info.studentId,
        type: "GRADE_ADDED",
        title: "تم رصد درجتك",
        body: `تم رصد درجة بحثك في مادة: ${info.assignment.course} — الدرجة: ${score}/20`,
        relatedId: id,
      });
    }
  }

  await audit({
    actorId: auth.session.userId,
    actorRole: "FACULTY",
    action: score !== null ? "GRADE_SUBMISSION" : "UPDATE_SUBMISSION",
    targetType: "Submission",
    targetId: id,
    details: score !== null ? `الدرجة: ${score}/20` : `ملاحظات: ${notes?.slice(0, 50) ?? "—"}`,
    request,
  });

  return NextResponse.json({ submission: updated });
}
