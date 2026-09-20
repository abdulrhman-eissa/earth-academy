import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession, hashPassword, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { validatePassword } from "@/lib/password-strength";
import { checkServerRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

  const ip = getClientIp(request);
  const rl = checkServerRateLimit(`change_pw:${ip}:${session.userId}`, 5, 60000, 5 * 60000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `تجاوزت عدد المحاولات. حاول بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة.` },
      { status: 429 }
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const currentPassword = typeof input.currentPassword === "string" ? input.currentPassword : "";
  const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";
  const confirmPassword = typeof input.confirmPassword === "string" ? input.confirmPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "كلمتا المرور الجديدتان غير متطابقتين" }, { status: 400 });
  }

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) {
    return NextResponse.json({ error: pwCheck.error }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تختلف عن الحالية" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, passwordHash: true },
  });

  if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    await audit({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "FAILED_PASSWORD_CHANGE",
      targetType: "User",
      targetId: user.id,
      details: "محاولة تغيير باسورد بكلمة مرور خاطئة",
      request,
    });
    return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  await audit({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: "CHANGE_PASSWORD",
    targetType: "User",
    targetId: user.id,
    details: "تم تغيير كلمة المرور بنجاح",
    request,
  });

  return NextResponse.json({ success: true });
}
