import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { readSessionToken, ALL_AUTH_COOKIES, type AuthRole } from "@/lib/session-token";

async function getAllSessions() {
  const cookieStore = await cookies();
  const sessions: Array<{ userId: string; role: AuthRole }> = [];
  for (const name of ALL_AUTH_COOKIES) {
    const value = cookieStore.get(name)?.value;
    if (!value) continue;
    const session = await readSessionToken(value);
    if (session) sessions.push({ userId: session.userId, role: session.role });
  }
  return sessions;
}

export async function GET(request: Request) {
  const sessions = await getAllSessions();
  if (sessions.length === 0) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

  // فلترة حسب الدور (اختياري - لو المستدعي بعت role)
  const url = new URL(request.url);
  const requestedRole = url.searchParams.get("role") as AuthRole | null;
  const filtered = requestedRole
    ? sessions.filter((s) => s.role === requestedRole)
    : sessions;

  const activeSessions = filtered.length > 0 ? filtered : sessions;
  const userIds = activeSessions.map((s) => s.userId);

  const notifications = await prisma.notification.findMany({
    where: { userId: { in: userIds } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: { in: userIds }, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const sessions = await getAllSessions();
  if (sessions.length === 0) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const action = body && typeof body === "object" ? (body as Record<string, unknown>).action : null;
  const userIds = sessions.map((s) => s.userId);

  if (action === "markAllRead") {
    await prisma.notification.updateMany({
      where: { userId: { in: userIds }, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "markRead") {
    const id = (body as Record<string, unknown>).id;
    if (typeof id !== "string") return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });
    await prisma.notification.updateMany({
      where: { id, userId: { in: userIds } },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
