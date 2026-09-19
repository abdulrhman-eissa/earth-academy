import { currentSession } from "@/lib/auth";
import { notificationBus } from "@/lib/notification-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await currentSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.userId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // رسالة ترحيب
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", at: Date.now() })}\n\n`));

      const send = (data: string) => {
        try { controller.enqueue(encoder.encode(data)); } catch { /* closed */ }
      };

      const close = () => {
        try { controller.close(); } catch { /* already closed */ }
      };

      const unsubscribe = notificationBus.subscribe(userId, { userId, send, close });

      // Heartbeat كل 25 ثانية للحفاظ على الاتصال
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: heartbeat\n\n`)); } catch { /* closed */ }
      }, 25000);

      // تنظيف
      return () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
