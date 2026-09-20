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
  console.log("=== POST /api/assignments/[id]/submissions START ===");

  try {
    console.log("Step 1: requireRole STUDENT");
    const auth = await requireRole("STUDENT");
    if ("error" in auth) {
      console.log("❌ Not authenticated");
      return auth.error;
    }
    console.log("✅ Auth OK, userId:", auth.session.userId);

    const { id: assignmentId } = await context.params;
    console.log("Step 2: assignmentId =", assignmentId);

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      console.log("❌ Invalid body");
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const text = typeof input.text === "string" ? input.text.trim() : "";
    const htmlContent = typeof input.htmlContent === "string" ? input.htmlContent : null;
    const defenseAnswer = typeof input.defenseAnswer === "string" ? input.defenseAnswer.trim() : null;
    const pasteAttempts = typeof input.pasteAttempts === "number" ? input.pasteAttempts : 0;
    const action = input.action === "submit" ? "submit" : "draft";
    const activityLog = Array.isArray(input.activityLog) ? (input.activityLog as ActivityEntry[]) : [];

    console.log("Step 3: action =", action, "| text.length =", text.length, "| htmlContent?", !!htmlContent);

    console.log("Step 4: Find assignment");
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, isPublished: true, status: true, title: true, course: true, facultyId: true },
    });
    console.log("Assignment:", assignment ? "found" : "NOT FOUND");

    if (!assignment || !assignment.isPublished || assignment.status !== "PUBLISHED") {
      console.log("❌ Assignment not available");
      return NextResponse.json({ error: "التكليف غير متاح" }, { status: 404 });
    }

    console.log("Step 5: Find student profile");
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: auth.session.userId },
      select: { id: true, chosenAssignmentId: true, fullName: true, studentCode: true },
    });
    console.log("Profile:", profile ? `found (${profile.fullName})` : "NOT FOUND");

    if (!profile?.chosenAssignmentId) {
      console.log("❌ No chosen assignment");
      return NextResponse.json({ error: "يجب اختيار تكليف أولاً" }, { status: 403 });
    }
    if (profile.chosenAssignmentId !== assignmentId) {
      console.log("❌ Assignment mismatch");
      return NextResponse.json({ error: "لا يمكنك التسليم لتكليف غير الذي اخترته" }, { status: 403 });
    }

    console.log("Step 6: Check existing submission");
    const existing = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: auth.session.userId } },
      select: { id: true, status: true },
    });
    console.log("Existing:", existing);

    if (existing && existing.status === "REVIEWED") {
      console.log("❌ Submission already reviewed");
      return NextResponse.json({ error: "تمت مراجعة بحثك بالفعل" }, { status: 409 });
    }

    if (action === "submit") {
      if (text.length < 50) {
        console.log("❌ Text too short for submit");
        return NextResponse.json({ error: "نص البحث قصير جداً" }, { status: 400 });
      }
      if (!defenseAnswer || defenseAnswer.trim().length < 3) {
        console.log("❌ Missing title");
        return NextResponse.json({ error: "يجب إدخال عنوان البحث" }, { status: 400 });
      }
    }

    const status = action === "submit" ? "SUBMITTED" : "DRAFT";
    console.log("Step 7: Upserting with status =", status);

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
    console.log("✅ Submission saved:", submission);

    if (action === "submit") {
      console.log("Step 8: Notify faculty");
      await notify({
        userId: assignment.facultyId,
        type: "RESEARCH_SUBMITTED",
        title: "تسليم بحث جديد",
        body: `قام الطالب ${profile.fullName} (${profile.studentCode}) بتسليم بحثه في مادة: ${assignment.course}`,
        relatedId: submission.id,
      });

      console.log("Step 9: Audit log");
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

    console.log("=== POST END — SUCCESS ===");
    return NextResponse.json({ submission, action }, { status: 201 });

  } catch (error: unknown) {
    console.error("=== POST FAILED ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "N/A");
    if (error && typeof error === "object") {
      console.error("Error keys:", Object.keys(error));
      console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
    return NextResponse.json(
      { error: "تعذر الحفظ", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
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
