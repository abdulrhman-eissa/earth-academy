import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if ("error" in auth) return auth.error;

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const unread = await prisma.contactMessage.count({ where: { isRead: false } });

  return NextResponse.json({ messages, unread });
}

export async function PATCH(request: Request) {
  const auth = await requireRole("ADMIN");
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json().catch(() => null);
  const id = body && typeof body === "object" ? (body as Record<string, unknown>).id : null;
  if (typeof id !== "string") return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  await prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
  return NextResponse.json({ success: true });
}
