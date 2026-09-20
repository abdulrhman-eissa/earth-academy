/**
 * اختبار آلي للواجهات الجديدة
 */

const BASE = "http://localhost:3000";
const results: { test: string; ok: boolean; note: string }[] = [];

function log(test: string, ok: boolean, note = "") {
  results.push({ test, ok, note });
  console.log(`${ok ? "✅" : "❌"} ${test}${note ? ` — ${note}` : ""}`);
}

async function fetchPage(path: string) {
  try {
    const r = await fetch(`${BASE}${path}`);
    const html = await r.text();
    return { status: r.status, html };
  } catch (e) {
    return { status: 0, html: "", error: String(e) };
  }
}

async function run() {
  console.log("\n🧪 اختبار شامل للواجهات\n");

  // ============ 1) صفحات الدخول موجودة ============
  console.log("📌 [1] صفحات الدخول");
  const loginPages = [
    { path: "/student/login", name: "الطالب" },
    { path: "/faculty/login", name: "الأستاذ" },
    { path: "/affairs/login", name: "شؤون الطلاب" },
    { path: "/contact/admin/login", name: "المبرمج" },
  ];

  for (const p of loginPages) {
    const { status } = await fetchPage(p.path);
    log(`صفحة دخول ${p.name}`, status === 200, `HTTP ${status}`);
  }

  // ============ 2) تأكيد وجود عناصر Password Strength ============
  console.log("\n📌 [2] عناصر قوة الباسورد");
  const { html: studentHtml } = await fetchPage("/student/login");
  log("صفحة الطالب — عنوان كلمة المرور", studentHtml.includes("كلمة المرور"), "");
  log("صفحة الطالب — تأكيد كلمة المرور", studentHtml.includes("تأكيد كلمة المرور") || studentHtml.includes("تأكيد"), "");

  const { html: facultyHtml } = await fetchPage("/faculty/register");
  log("صفحة تسجيل الأستاذ تحوي متطلبات", facultyHtml.includes("متطلبات كلمة المرور") || facultyHtml.includes("10 أحرف"), "");

  // ============ 3) صفحة تغيير كلمة المرور ============
  console.log("\n📌 [3] صفحة تغيير كلمة المرور");
  const { status: cpStatus, html: cpHtml } = await fetchPage("/change-password");
  log("صفحة /change-password", cpStatus === 200, `HTTP ${cpStatus}`);
  log("عنوان الصفحة", cpHtml.includes("تغيير كلمة المرور"));

  // ============ 4) Honeypot ============
  console.log("\n📌 [4] Honeypot");
  const { status: trapStatus } = await fetchPage("/api/contact/trap?password=ui_test");
  log("Honeypot API", trapStatus === 200, `HTTP ${trapStatus}`);

  // ============ 5) الصفحة الرئيسية ============
  console.log("\n📌 [5] الصفحات الأساسية");
  const { status: homeStatus } = await fetchPage("/");
  log("الصفحة الرئيسية", homeStatus === 200, `HTTP ${homeStatus}`);

  // ============ 6) الحماية (بدون تسجيل دخول) ============
  console.log("\n📌 [6] الحماية");
  for (const p of ["/student", "/faculty", "/affairs", "/contact/admin"]) {
    try {
      const r = await fetch(`${BASE}${p}`, { redirect: "manual" });
      log(`حماية ${p}`, r.status === 307 || r.status === 302, `HTTP ${r.status}`);
    } catch (e) {
      log(`حماية ${p}`, false, String(e));
    }
  }

  // ============ 7) API change-password محمي ============
  console.log("\n📌 [7] API change-password");
  try {
    const r = await fetch(`${BASE}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "x", newPassword: "y", confirmPassword: "y" }),
    });
    log("يرفض بدون جلسة", r.status === 401, `HTTP ${r.status}`);
  } catch (e) {
    log("API change-password", false, String(e));
  }

  // ============ النتيجة ============
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log("\n════════════════════════════════════════");
  console.log(`📊 النتيجة: ${passed} نجح ✅  |  ${failed} فشل ❌`);
  console.log("════════════════════════════════════════\n");

  if (failed > 0) {
    console.log("❌ اختبارات فاشلة:");
    results.filter(r => !r.ok).forEach(r => console.log(`   - ${r.test}: ${r.note}`));
  }
}

run().catch(console.error);

export {};
