import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if ("error" in auth) return auth.error;

  const [
    totalStudents, totalFaculty, totalAffairs, totalAdmins,
    totalAssignments, totalSubmissions, gradedSubmissions, pendingSubmissions,
    totalMessages, unreadMessages,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "FACULTY" } }),
    prisma.user.count({ where: { role: "AFFAIRS" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.assignment.count(),
    prisma.submission.count(),
    prisma.submission.count({ where: { score: { not: null } } }),
    prisma.submission.count({ where: { score: null } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  const scores = await prisma.submission.findMany({
    where: { score: { not: null } },
    select: { score: true },
  });
  const average = scores.length > 0 ? Math.round(scores.reduce((s, r) => s + (r.score ?? 0), 0) / scores.length) : 0;

  const recentSubmissions = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
    take: 5,
    select: {
      id: true, submittedAt: true, score: true,
      student: { select: { email: true, studentProfile: { select: { fullName: true } } } },
      assignment: { select: { course: true } },
    },
  });

  return NextResponse.json({
    totalStudents, totalFaculty, totalAffairs, totalAdmins,
    totalAssignments, totalSubmissions, gradedSubmissions, pendingSubmissions,
    totalMessages, unreadMessages, average, recentSubmissions,
  });
}
