/**
 * اختبار شامل لنظام كلمات المرور الجديد
 */

const BASE = "http://localhost:3000";
const results: { test: string; ok: boolean; note: string }[] = [];

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function log(test: string, ok: boolean, note = "") {
  results.push({ test, ok, note });
  console.log(`${ok ? "✅" : "❌"} ${test}${note ? ` — ${note}` : ""}`);
}

async function login(email: string, password: string, role: string): Promise<string> {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  if (!r.ok) return "";
  return (r.headers.get("set-cookie") || "").split(";")[0];
}

async function run() {
  console.log("\n🧪 اختبار نظام كلمات المرور\n");

  const testCode = `3000${Date.now().toString().slice(-10)}`;
  const testEmail = `${testCode}@student.local`;
  const weakPassword = "12345678";
  const strongPassword = "MyEarth@2026";
  const newerPassword = "NewPass@2027";

  // ============ [1] رفض باسورد ضعيف (قصير) ============
  console.log("📌 [1] رفض الباسورد الضعيف");
  await sleep(2000);
  try {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: weakPassword,
        confirmPassword: weakPassword,
        role: "STUDENT",
        fullName: "اختبار محمد أحمد",
        academicYear: "الفرقة الأولى",
        studentCode: testCode,
      }),
    });
    const data = await r.json() as { error?: string };
    log("رفض باسورد 8 أحرف", r.status === 400, data.error ?? `HTTP ${r.status}`);
  } catch (e) { log("رفض باسورد 8 أحرف", false, String(e)); }

  // ============ [2] رفض باسورد بدون رمز خاص ============
  try {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "MyEarth2026Pass",
        confirmPassword: "MyEarth2026Pass",
        role: "STUDENT",
        fullName: "اختبار محمد أحمد",
        academicYear: "الفرقة الأولى",
        studentCode: testCode,
      }),
    });
    const data = await r.json() as { error?: string };
    log("رفض باسورد بدون رمز خاص", r.status === 400, data.error ?? `HTTP ${r.status}`);
  } catch (e) { log("رفض باسورد بدون رمز", false, String(e)); }

  // ============ [3] رفض باسورد بدون حرف كبير ============
  try {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "myearth@2026x",
        confirmPassword: "myearth@2026x",
        role: "STUDENT",
        fullName: "اختبار محمد أحمد",
        academicYear: "الفرقة الأولى",
        studentCode: testCode,
      }),
    });
    const data = await r.json() as { error?: string };
    log("رفض باسورد بدون حرف كبير", r.status === 400, data.error ?? `HTTP ${r.status}`);
  } catch (e) { log("رفض باسورد بدون حرف كبير", false, String(e)); }

  // ============ [4] رفض باسورد شائع ============
  try {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "Password@123",
        confirmPassword: "Password@123",
        role: "STUDENT",
        fullName: "اختبار محمد أحمد",
        academicYear: "الفرقة الأولى",
        studentCode: testCode,
      }),
    });
    const data = await r.json() as { error?: string };
    log("رفض باسورد شائع", r.status === 400, data.error ?? `HTTP ${r.status}`);
  } catch (e) { log("رفض باسورد شائع", false, String(e)); }

  // ============ [5] رفض عدم تطابق التأكيد ============
  try {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: strongPassword,
        confirmPassword: "Different@Pass99",
        role: "STUDENT",
        fullName: "اختبار محمد أحمد",
        academicYear: "الفرقة الأولى",
        studentCode: testCode,
      }),
    });
    const data = await r.json() as { error?: string };
    log("رفض عدم تطابق التأكيد", r.status === 400, data.error ?? `HTTP ${r.status}`);
  } catch (e) { log("رفض عدم التطابق", false, String(e)); }

  // ننتظر حتى انتهاء Rate Limit
  console.log("⏳ انتظار 60 ثانية لانتهاء Rate Limit...");
  await sleep(60000);

  // ============ [6] قبول باسورد قوي ============
  try {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: strongPassword,
        confirmPassword: strongPassword,
        role: "STUDENT",
        fullName: "اختبار محمد أحمد",
        academicYear: "الفرقة الأولى",
        studentCode: testCode,
      }),
    });
    log("قبول الباسورد القوي", r.ok, `HTTP ${r.status}`);
  } catch (e) { log("قبول الباسورد القوي", false, String(e)); }

  // ============ [7] تسجيل دخول بالباسورد ============
  const cookie = await login(testEmail, strongPassword, "STUDENT");
  log("تسجيل دخول بالباسورد الجديد", !!cookie);

  // ============ [8] رفض تغيير الباسورد بكلمة خاطئة ============
  if (cookie) {
    try {
      const r = await fetch(`${BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          currentPassword: "WrongPass@123",
          newPassword: newerPassword,
          confirmPassword: newerPassword,
        }),
      });
      log("رفض التغيير بكلمة حالية خاطئة", r.status === 401, `HTTP ${r.status}`);
    } catch (e) { log("رفض التغيير بكلمة خاطئة", false, String(e)); }
  }

  // ============ [9] رفض الباسورد الجديد الضعيف ============
  if (cookie) {
    try {
      const r = await fetch(`${BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          currentPassword: strongPassword,
          newPassword: "12345678",
          confirmPassword: "12345678",
        }),
      });
      log("رفض الباسورد الجديد الضعيف", r.status === 400, `HTTP ${r.status}`);
    } catch (e) { log("رفض الباسورد الضعيف", false, String(e)); }
  }

  // ============ [10] رفض نفس الباسورد القديم ============
  if (cookie) {
    try {
      const r = await fetch(`${BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          currentPassword: strongPassword,
          newPassword: strongPassword,
          confirmPassword: strongPassword,
        }),
      });
      log("رفض الباسورد القديم نفسه", r.status === 400, `HTTP ${r.status}`);
    } catch (e) { log("رفض الباسورد نفسه", false, String(e)); }
  }

  // ============ [11] تغيير الباسورد بنجاح ============
  if (cookie) {
    try {
      const r = await fetch(`${BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          currentPassword: strongPassword,
          newPassword: newerPassword,
          confirmPassword: newerPassword,
        }),
      });
      log("تغيير الباسورد بنجاح", r.ok, `HTTP ${r.status}`);
    } catch (e) { log("تغيير الباسورد", false, String(e)); }
  }

  // ============ [12] دخول بالباسورد الجديد ============
  const newCookie = await login(testEmail, newerPassword, "STUDENT");
  log("دخول بالباسورد الجديد", !!newCookie);

  // ============ [13] رفض الباسورد القديم ============
  const oldCookie = await login(testEmail, strongPassword, "STUDENT");
  log("رفض الباسورد القديم", !oldCookie);

  // ============ [14] Audit Log فيه تغيير الباسورد ============
  const adminCookie = await login("admin@earth.edu", "Admin@1234", "ADMIN");
  if (adminCookie) {
    try {
      const r = await fetch(`${BASE}/api/admin/audit`, { headers: { Cookie: adminCookie } });
      const data = await r.json() as { logs: { action: string }[] };
      const hasChange = (data.logs ?? []).some(l => l.action === "CHANGE_PASSWORD");
      log("سجل Audit فيه CHANGE_PASSWORD", hasChange);
    } catch (e) { log("Audit Check", false, String(e)); }
  }

  // ============ النتيجة النهائية ============
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
