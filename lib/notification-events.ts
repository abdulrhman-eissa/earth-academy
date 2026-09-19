/**
 * In-memory event bus للإشعارات الفورية
 * - Server-Sent Events (SSE)
 * - يشتغل مع Next.js Node runtime
 */

type Subscriber = {
  userId: string;
  send: (data: string) => void;
  close: () => void;
};

class NotificationBus {
  private subscribers: Map<string, Set<Subscriber>> = new Map();

  subscribe(userId: string, subscriber: Subscriber): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(subscriber);

    return () => {
      const set = this.subscribers.get(userId);
      if (set) {
        set.delete(subscriber);
        if (set.size === 0) this.subscribers.delete(userId);
      }
    };
  }

  emit(userId: string, payload: unknown) {
    const set = this.subscribers.get(userId);
    if (!set || set.size === 0) return;
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const sub of set) {
      try { sub.send(data); } catch { /* silent */ }
    }
  }

  getSubscriberCount(userId: string): number {
    return this.subscribers.get(userId)?.size ?? 0;
  }
}

const globalForBus = globalThis as unknown as { __earth_notification_bus?: NotificationBus };
export const notificationBus = globalForBus.__earth_notification_bus ?? new NotificationBus();
if (!globalForBus.__earth_notification_bus) globalForBus.__earth_notification_bus = notificationBus;
