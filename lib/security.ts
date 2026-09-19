/**
 * منظومة EARTH — وحدة الأمان الفائق وتطهير المدخلات
 * حماية متكاملة ضد XSS, Script Injections, Brute Force & Rate Limiting
 */

// 1. دالة تطهير النصوص ومنع ثغرات XSS والإغراق البرمجي
export function sanitizeInput(input: string): string {
  if (!input) return "";

  return input
    // إزالة وسوم السكربتات المباشرة والأكواد الخبيثة
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // تحويل الرموز الحساسة إلى كيانات HTML آمنة لمنع التشغيل برمجياً
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    // حظر استدعاء أحداث JavaScript الخبيثة
    .replace(/javascript:/gi, "")
    .replace(/onerror=/gi, "")
    .replace(/onload=/gi, "")
    .trim();
}

// 2. دالة كشف السكربتات ومنع محاولات الاختراق (Anomalous Pattern Detector)
export function detectMaliciousPattern(input: string): boolean {
  if (!input) return false;

  const attackPatterns = [
    /<script/i,
    /javascript:/i,
    /document\.cookie/i,
    /window\.location/i,
    /eval\(/i,
    /execCommand/i,
    /SELECT\s+.*\s+FROM/i, // SQL Injection Patterns
    /UNION\s+SELECT/i,
    /DROP\s+TABLE/i,
    /\{\s*\$where/i,       // NoSQL Injection Patterns
  ];

  return attackPatterns.some((pattern) => pattern.test(input));
}

// 3. نظام حماية هجمات التخمين والإغراق (Rate Limiter & Anti-Brute Force)
export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): { allowed: boolean; remainingMs: number } {
  if (typeof window === "undefined") return { allowed: true, remainingMs: 0 };

  const storageKey = `earth_rate_limit_${key}`;
  const now = Date.now();
  const record = JSON.parse(localStorage.getItem(storageKey) || '{"attempts": 0, "firstAttempt": 0}');

  if (now - record.firstAttempt > windowMs) {
    // إعادة تعيين النافذة الزمنية
    localStorage.setItem(storageKey, JSON.stringify({ attempts: 1, firstAttempt: now }));
    return { allowed: true, remainingMs: 0 };
  }

  if (record.attempts >= maxAttempts) {
    const remainingMs = windowMs - (now - record.firstAttempt);
    return { allowed: false, remainingMs };
  }

  record.attempts += 1;
  localStorage.setItem(storageKey, JSON.stringify(record));
  return { allowed: true, remainingMs: 0 };
}