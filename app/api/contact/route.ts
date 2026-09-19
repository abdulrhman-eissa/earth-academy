import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkServerRateLimit, getClientIp } from "@/lib/rate-limit";

// POST: إرسال رسالة (لا يحتاج تسجيل دخول)
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkServerRateLimit(`contact:${ip}`, 3, 60000, 10 * 60000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `تجاوزت عدد المحاولات. حاول بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const input = body as Record<string, unknown>;
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const role = typeof input.role === "string" ? input.role.trim() : "غير محدد";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (fullName.length < 3) return NextResponse.json({ error: "الاسم قصير" }, { status: 400 });
  if (phone.length < 6) return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });
  if (message.length < 10) return NextResponse.json({ error: "الرسالة قصيرة" }, { status: 400 });
  if (message.length > 5000) return NextResponse.json({ error: "الرسالة طويلة جداً" }, { status: 400 });

  const created = await prisma.contactMessage.create({
    data: { fullName, phone, role, message },
    select: { id: true },
  });

  return NextResponse.json({ success: true, id: created.id }, { status: 201 });
}

// GET: قائمة الرسائل (يحتاج باسورد)
export async function GET(request: Request) {
  const password = new URL(request.url).searchParams.get("password");
  const expected = process.env.DEVELOPER_PASSWORD;
  if (!expected) return NextResponse.json({ error: "غير مهيأ" }, { status: 500 });
  if (password !== expected) return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const unread = await prisma.contactMessage.count({ where: { isRead: false } });

  return NextResponse.json({ messages, unread });
}
