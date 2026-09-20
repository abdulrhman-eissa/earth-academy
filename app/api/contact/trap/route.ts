import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";

/**
 * 🪤 HONEYPOT ENDPOINT
 * أي محاولة وصول هنا تعتبر اختراق → تُسجَّل كـ SECURITY_THREAT
 * نرجّع بيانات وهمية لإيهام المتسلل أن الاختراق نجح
 */

const FAKE_MESSAGES = [
  { id: "msg-001", fullName: "محمد عبد الله السيد", phone: "01001234567", role: "طالب", message: "الرسالة الأولى محفوظة بشكل آمن في قاعدة البيانات.", isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "msg-002", fullName: "د. أحمد محمود", phone: "01002345678", role: "أستاذ", message: "تم استلام البيانات وإرسالها بنجاح.", isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "msg-003", fullName: "شؤون الطلاب", phone: "01003456789", role: "إداري", message: "هذه البيانات مشفّرة ولا يمكن الوصول إليها.", isRead: true, createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: "msg-004", fullName: "زائر", phone: "01004567890", role: "أخرى", message: "شكراً لتواصلك معنا، سنرد عليك قريباً.", isRead: true, createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: "msg-005", fullName: "فاطمة أحمد", phone: "01005678901", role: "طالبة", message: "تم إرسال الرسالة للمسؤول المختص.", isRead: true, createdAt: new Date(Date.now() - 18000000).toISOString() },
];

export async function GET(request: Request) {
  const password = new URL(request.url).searchParams.get("password") ?? "";

  // 🚨 تسجيل المحاولة كتهديد أمني
  await audit({
    action: "SECURITY_THREAT",
    actorRole: "UNKNOWN",
    targetType: "Honeypot",
    targetId: "contact-inbox",
    details: `🚨 محاولة اختراق مكتشفة — كلمة المرور المستخدمة: "${password.slice(0, 30)}${password.length > 30 ? "..." : ""}"`,
    request,
  });

  // تأخير بسيط عشان يبان طبيعي
  await new Promise((r) => setTimeout(r, 800));

  return NextResponse.json({
    messages: FAKE_MESSAGES,
    unread: 2,
  });
}

export async function PATCH(request: Request) {
  await audit({
    action: "SECURITY_THREAT",
    actorRole: "UNKNOWN",
    targetType: "Honeypot",
    targetId: "contact-inbox",
    details: "🚨 محاولة تعديل بيانات في صندوق وهمي",
    request,
  });
  return NextResponse.json({ success: true });
}
