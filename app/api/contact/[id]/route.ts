import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const body: unknown = await request.json().catch(() => null);
  const password = body && typeof body === "object" ? (body as Record<string, unknown>).password : null;
  const expected = process.env.DEVELOPER_PASSWORD;
  if (!expected) return NextResponse.json({ error: "غير مهيأ" }, { status: 500 });
  if (password !== expected) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await context.params;
  await prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
  return NextResponse.json({ success: true });
}
