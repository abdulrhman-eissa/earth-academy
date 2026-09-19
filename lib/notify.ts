import { prisma } from "@/lib/prisma";
import { notificationBus } from "@/lib/notification-events";

type NotificationType = "RESEARCH_SUBMITTED" | "GRADE_ADDED" | "GRADE_UPDATED" | "INFO";

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedId?: string;
}

export async function notify(input: NotifyInput) {
  try {
    const created = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        relatedId: input.relatedId ?? null,
      },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        isRead: true,
        createdAt: true,
      },
    });

    // بث فوري للمستخدم المتصل
    notificationBus.emit(input.userId, {
      type: "new_notification",
      notification: created,
    });
  } catch (e) {
    console.error("[notify] failed:", e);
  }
}
