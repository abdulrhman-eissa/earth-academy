import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";

/**
 * GET /api/student/alerts
 * يرجع كل التنبيهات المهمة للطالب (بدون الدرجات)
 */
export async function GET() {
  const auth = await requireRole("STUDENT");
  if ("error" in auth) return auth.error;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: auth.session.userId },
    select: { chosenAssignmentId: true },
  });

  if (!profile?.chosenAssignmentId) {
    return NextResponse.json({ alerts: [], total: 0 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: profile.chosenAssignmentId },
    select: {
      id: true,
      title: true,
      deadline: true,
      voiceData: true,
      voiceUpdatedAt: true,
    },
  });

  const submission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId: profile.chosenAssignmentId,
        studentId: auth.session.userId,
      },
    },
    select: { status: true, updatedAt: true },
  });

  const alerts: Array<{
    type: string;
    label: string;
    color: "blue" | "amber" | "red" | "emerald" | "purple";
    priority: number;
  }> = [];

  // 🎤 ملاحظة صوتية جديدة
  if (assignment?.voiceData && assignment.voiceUpdatedAt) {
    alerts.push({
      type: "voice",
      label: "ملاحظة صوتية جديدة من الدكتور",
      color: "purple",
      priority: 3,
    });
  }

  // ⏰ اقتراب موعد التسليم
  if (assignment?.deadline && (!submission || submission.status === "DRAFT")) {
    const days = Math.ceil((new Date(assignment.deadline).getTime() - Date.now()) / 86400000);
    if (days >= 0 && days <= 3) {
      alerts.push({
        type: "deadline",
        label: days === 0 ? "آخر موعد التسليم النهاردة!" : days === 1 ? "متبقي يوم واحد للتسليم" : `متبقي ${days} أيام للتسليم`,
        color: "red",
        priority: 5,
      });
    } else if (days < 0) {
      alerts.push({
        type: "deadline",
        label: "الموعد النهائي انتهى!",
        color: "red",
        priority: 6,
      });
    }
  }

  // 📝 مسودة غير مسلّمة
  if (submission?.status === "DRAFT") {
    alerts.push({
      type: "draft",
      label: "لديك مسودة لم تُسلَّم بعد",
      color: "amber",
      priority: 4,
    });
  }

  // ✓ تم استلام البحث (يختفي بعد 24 ساعة)
  if (submission?.status === "SUBMITTED") {
    const hoursSince = (Date.now() - new Date(submission.updatedAt).getTime()) / 3600000;
    if (hoursSince < 24) {
      alerts.push({
        type: "submitted",
        label: "تم استلام بحثك بنجاح ✓",
        color: "emerald",
        priority: 2,
      });
    }
  }

  // ترتيب حسب الأولوية (الأهم أول)
  alerts.sort((a, b) => b.priority - a.priority);

  return NextResponse.json({ alerts, total: alerts.length });
}
