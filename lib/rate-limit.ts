/**
 * Server-side rate limiter (in-memory)
 * - يعمل على مستوى السيرفر
 * - لا يمكن تجاوزه من المتصفح
 * - يتم تنظيفه تلقائياً كل 5 دقائق
 */

interface Attempt {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const store = new Map<string, Attempt>();
const WINDOW_MS = 60 * 1000; // دقيقة
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// تنظيف دوري
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, attempt] of store.entries()) {
      if (now - attempt.firstAttempt > WINDOW_MS * 2 && (!attempt.blockedUntil || now > attempt.blockedUntil)) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkServerRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = WINDOW_MS,
  blockDurationMs: number = WINDOW_MS * 5
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  // لو محظور حالياً
  if (existing?.blockedUntil && existing.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.blockedUntil - now) / 1000),
    };
  }

  // نافذة جديدة
  if (!existing || now - existing.firstAttempt > windowMs) {
    store.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 };
  }

  // تجاوز الحد
  if (existing.count >= maxAttempts) {
    existing.blockedUntil = now + blockDurationMs;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(blockDurationMs / 1000),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxAttempts - existing.count, retryAfterSeconds: 0 };
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
