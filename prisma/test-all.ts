/**
 * اختبار شامل لكل APIs المنظومة
 */

const BASE = "http://localhost:3000";
const results: { test: string; ok: boolean; note: string }[] = [];

function log(test: string, ok: boolean, note = "") {
  results.push({ test, ok, note });
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${test} ${note ? `— ${note}` : ""}`);
}

async function run() {
  console.log("\n🧪 بدء الاختبار الشامل...\n");

  // ============ 1) الصفحة الرئيسية ============
  try {
    const r = await fetch(BASE);
    log("الصفحة الرئيسية", r.ok, `HTTP ${r.status}`);
  } catch (e) {
    log("الصفحة الرئيسية", false, String(e));
  }

  // ============ 2) صفحات الدخول ============
  const loginPages = [
    "/student/login",
    "/faculty/login",
    "/affairs/login",
    "/contact/admin/login",
  ];
  for (const p of loginPages) {
    try {
      const r = await fetch(`${BASE}${p}`);
      log(`صفحة الدخول ${p}`, r.ok, `HTTP ${r.status}`);
    } catch (e) {
      log(`صفحة الدخول ${p}`, false, String(e));
    }
  }

  // ============ 3) الحماية بدون تسجيل دخول ============
  const protectedPaths = ["/student", "/student/grades", "/faculty", "/affairs", "/contact/admin"];
  for (const p of protectedPaths) {
    try {
      const r = await fetch(`${BASE}${p}`, { redirect: "manual" });
      const protectedOk = r.status === 307 || r.status === 302 || r.status === 301;
      log(`حماية ${p}`, protectedOk, `HTTP ${r.status}`);
    } catch (e) {
      log(`حماية ${p}`, false, String(e));
    }
  }

  // ============ 4) API الإشعارات بدون جلسة ============
  try {
    const r = await fetch(`${BASE}/api/notifications`);
    log("حماية /api/notifications", r.status === 401, `HTTP ${r.status}`);
  } catch (e) {
    log("حماية /api/notifications", false, String(e));
  }

  // ============ 5) API الأدمن بدون جلسة ============
  const adminApis = ["/api/admin/users", "/api/admin/stats", "/api/admin/audit", "/api/admin/messages"];
  for (const p of adminApis) {
    try {
      const r = await fetch(`${BASE}${p}`);
      log(`حماية ${p}`, r.status === 401 || r.status === 403, `HTTP ${r.status}`);
    } catch (e) {
      log(`حماية ${p}`, false, String(e));
    }
  }

  // ============ 6) تسجيل دخول المبرمج ============
  let adminCookie = "";
  try {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@earth.edu", password: "Admin@1234", role: "ADMIN" }),
    });
    const ok = r.ok;
    const setCookie = r.headers.get("set-cookie") || "";
    adminCookie = setCookie.split(";")[0];
    log("تسجيل دخول المبرمج", ok, `HTTP ${r.status}`);
  } catch (e) {
    log("تسجيل دخول المبرمج", false, String(e));
  }

  // ============ 7) APIs الأدمن مع الجلسة ============
  if (adminCookie) {
    for (const p of adminApis) {
      try {
        const r = await fetch(`${BASE}${p}`, { headers: { Cookie: adminCookie } });
        log(`دخول ${p} بالجلسة`, r.ok, `HTTP ${r.status}`);
      } catch (e) {
        log(`دخول ${p} بالجلسة`, false, String(e));
      }
    }
  }

  // ============ 8) تسجيل دخول الأستاذ ============
  let facultyCookie = "";
  try {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dr.ahmed@faculty.local", password: "Faculty@1234", role: "FACULTY" }),
    });
    facultyCookie = (r.headers.get("set-cookie") || "").split(";")[0];
    log("تسجيل دخول الأستاذ", r.ok, `HTTP ${r.status}`);
  } catch (e) {
    log("تسجيل دخول الأستاذ", false, String(e));
  }

  // ============ 9) تسجيل دخول الشؤون ============
  let affairsCookie = "";
  try {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "affairs@earth.edu", password: "Affairs@1234", role: "AFFAIRS" }),
    });
    affairsCookie = (r.headers.get("set-cookie") || "").split(";")[0];
    log("تسجيل دخول شؤون الطلاب", r.ok, `HTTP ${r.status}`);
  } catch (e) {
    log("تسجيل دخول شؤون الطلاب", false, String(e));
  }

  // ============ 10) APIs الأستاذ والشؤون ============
  if (facultyCookie) {
    const r = await fetch(`${BASE}/api/submissions`, { headers: { Cookie: facultyCookie } });
    log("دخول /api/submissions كأستاذ", r.ok, `HTTP ${r.status}`);
    const r2 = await fetch(`${BASE}/api/assignments`, { headers: { Cookie: facultyCookie } });
    log("دخول /api/assignments كأستاذ", r2.ok, `HTTP ${r2.status}`);
  }

  if (affairsCookie) {
    const r = await fetch(`${BASE}/api/affairs/grades`, { headers: { Cookie: affairsCookie } });
    log("دخول /api/affairs/grades", r.ok, `HTTP ${r.status}`);
    const r2 = await fetch(`${BASE}/api/affairs/stats`, { headers: { Cookie: affairsCookie } });
    log("دخول /api/affairs/stats", r2.ok, `HTTP ${r2.status}`);
  }

  // ============ 11) تسجيل دخول الطالب ============
  let studentCookie = "";
  try {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "30001011200077@student.local", password: "Student@1234", role: "STUDENT" }),
    });
    studentCookie = (r.headers.get("set-cookie") || "").split(";")[0];
    log("تسجيل دخول الطالب", r.ok, `HTTP ${r.status}`);
  } catch (e) {
    log("تسجيل دخول الطالب", false, String(e));
  }

  if (studentCookie) {
    const r = await fetch(`${BASE}/api/student/assignment`, { headers: { Cookie: studentCookie } });
    log("دخول /api/student/assignment", r.ok, `HTTP ${r.status}`);
    const r2 = await fetch(`${BASE}/api/submissions/me`, { headers: { Cookie: studentCookie } });
    log("دخول /api/submissions/me", r2.ok, `HTTP ${r2.status}`);
  }

  // ============ 12) Honeypot ============
  try {
    const r = await fetch(`${BASE}/api/contact/trap?password=test123`);
    log("Honeypot /api/contact/trap", r.ok, `HTTP ${r.status}`);
  } catch (e) {
    log("Honeypot /api/contact/trap", false, String(e));
  }

  // ============ 13) Rate Limiting ============
  try {
    let rateLimited = false;
    for (let i = 0; i < 8; i++) {
      const r = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@rate.limit", password: "wrong", role: "STUDENT" }),
      });
      if (r.status === 429) { rateLimited = true; break; }
    }
    log("Rate Limiting على login", rateLimited, rateLimited ? "تم الحظر بعد 5 محاولات" : "لم يتم الحظر");
  } catch (e) {
    log("Rate Limiting", false, String(e));
  }

  // ============ النتيجة النهائية ============
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log("\n════════════════════════════════════");
  console.log(`📊 النتيجة: ${passed} نجح ✅  |  ${failed} فشل ❌`);
  console.log("════════════════════════════════════\n");

  if (failed > 0) {
    console.log("❌ اختبارات فاشلة:");
    results.filter(r => !r.ok).forEach(r => console.log(`   - ${r.test}: ${r.note}`));
  }
}

run().catch(console.error);

export {};
