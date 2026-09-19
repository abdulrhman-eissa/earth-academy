import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireRole("AFFAIRS");
  if ("error" in auth) return auth.error;

  const [
    totalStudents,
    totalFaculty,
    totalAssignments,
    totalSubmissions,
    gradedSubmissions,
    pendingSubmissions,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.facultyProfile.count(),
    prisma.assignment.count({ where: { isPublished: true } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { score: { not: null } } }),
    prisma.submission.count({ where: { score: null } }),
  ]);

  const levelBreakdown = await prisma.studentProfile.groupBy({
    by: ["academicLevel"],
    _count: { _all: true },
  });

  const courseBreakdown = await prisma.assignment.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      course: true,
      faculty: { select: { facultyProfile: { select: { fullName: true } } } },
      _count: { select: { submissions: true } },
    },
    orderBy: { course: "asc" },
  });

  const submissionsWithScore = await prisma.submission.findMany({
    where: { score: { not: null } },
    select: { score: true },
  });

  const average = submissionsWithScore.length > 0
    ? Math.round(submissionsWithScore.reduce((s, r) => s + (r.score ?? 0), 0) / submissionsWithScore.length)
    : 0;

  return NextResponse.json({
    totalStudents,
    totalFaculty,
    totalAssignments,
    totalSubmissions,
    gradedSubmissions,
    pendingSubmissions,
    average,
    completionRate: totalStudents > 0 ? Math.round((gradedSubmissions / totalStudents) * 100) : 0,
    levelBreakdown: levelBreakdown.map((l) => ({ level: l.academicLevel, count: l._count._all })),
    courseBreakdown: courseBreakdown.map((c) => ({
      id: c.id,
      course: c.course,
      faculty: c.faculty?.facultyProfile?.fullName ?? "غير محدد",
      submissions: c._count.submissions,
    })),
  });
}
