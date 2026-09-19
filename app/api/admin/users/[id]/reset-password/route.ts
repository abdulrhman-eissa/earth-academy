import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("ADMIN");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const newPassword = body && typeof body === "object" ? (body as Record<string, unknown>).newPassword : null;

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "تعذر تحديث كلمة المرور" }, { status: 500 });
  }
}
