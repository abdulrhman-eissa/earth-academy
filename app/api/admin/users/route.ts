import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if ("error" in auth) return auth.error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      studentProfile: { select: { fullName: true, studentCode: true, academicLevel: true, chosenAssignmentId: true } },
      facultyProfile: { select: { fullName: true, employeeCode: true, academicTitle: true } },
    },
  });

  return NextResponse.json({ users });
}

export async function DELETE(request: Request) {
  const auth = await requireRole("ADMIN");
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json().catch(() => null);
  const id = body && typeof body === "object" ? (body as Record<string, unknown>).id : null;
  if (typeof id !== "string") return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  if (id === auth.session.userId) {
    return NextResponse.json({ error: "لا يمكنك حذف حسابك الشخصي" }, { status: 400 });
  }

  try {
    const deleted = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
    await prisma.user.delete({ where: { id } });

    await audit({
      actorId: auth.session.userId,
      actorRole: "ADMIN",
      action: "DELETE_USER",
      targetType: "User",
      targetId: id,
      details: `${deleted?.email ?? "—"} (${deleted?.role ?? "—"})`,
      request,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "تعذر الحذف" }, { status: 500 });
  }
}
