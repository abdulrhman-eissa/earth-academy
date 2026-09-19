import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

const VALID_ROLES = ["STUDENT", "FACULTY", "AFFAIRS", "ADMIN"] as const;
const VALID_STATUS = ["ACTIVE", "SUSPENDED", "INACTIVE"] as const;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("ADMIN");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, role: true, status: true, createdAt: true, updatedAt: true,
      studentProfile: { select: { fullName: true, studentCode: true, academicLevel: true, enrollmentYear: true, chosenAssignmentId: true } },
      facultyProfile: { select: { fullName: true, employeeCode: true, academicTitle: true } },
      _count: { select: { submissions: true, assignments: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("ADMIN");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const input = body as Record<string, unknown>;
  const data: { status?: typeof VALID_STATUS[number]; role?: typeof VALID_ROLES[number] } = {};

  if (typeof input.status === "string" && VALID_STATUS.includes(input.status as never)) {
    data.status = input.status as typeof VALID_STATUS[number];
  }
  if (typeof input.role === "string" && VALID_ROLES.includes(input.role as never)) {
    if (id === auth.session.userId) {
      return NextResponse.json({ error: "لا يمكنك تغيير دورك الشخصي" }, { status: 400 });
    }
    data.role = input.role as typeof VALID_ROLES[number];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "لا يوجد تعديل صالح" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, status: true },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "تعذر التعديل" }, { status: 500 });
  }
}
