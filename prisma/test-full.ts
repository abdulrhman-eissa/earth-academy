/**
 * اختبار شامل قوي لمنظومة EARTH
 * يغطي: Auth / Password / Workflow / Security / Permissions / Notifications
 */

const BASE = "http://localhost:3000";
const results: { test: string; ok: boolean; note: string; category: string }[] = [];
const startTime = Date.now();

function log(category: string, test: string, ok: boolean, note = "") {
  results.push({ category, test, ok, note });
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} [${category}] ${test}${note ? ` — ${note}` : ""}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function login(email: string, password: string, role: string): Promise<string> {
  try {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    if (!r.ok) return "";
    return (r.headers.get("set-cookie") || "").split(";")[0];
  } catch {
    return "";
  }
}

async function getCookie(path: string, options?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, options);
  return { status: r.status, cookie: (r.headers.get("set-cookie") || "").split(";")[0], body: await r.json().catch(() => ({})) };
}

async function run() {
  console.log("\n" + "═".repeat(60));
  console.log("🧪 اختبار شامل قوي لمنظومة EARTH");
  console.log("═".repeat(60) + "\n");

  // ============================================================
  // 1) الصفحات الأساسية
  // ============================================================
  console.log("━━━ 1) الصفحات الأساسية ━━━\n");
  const pages = [
    { path: "/", name: "الرئيسية" },
    { path: "/student/login", name: "دخول الطالب" },
    { path: "/faculty/login", name: "دخول الأستاذ" },
    { path: "/affairs/login", name: "دخول الشؤون" },
    { path: "/contact/admin/login", name: "دخول المبرمج" },
    { path: "/contact", name: "التواصل" },
    { path: "/change-password", name: "تغيير الباسورد" },
  ];
  for (const p of pages) {
    try {
      const r = await fetch(`${BASE}${p.path}`);
      log("Pages", p.name, r.status === 200, `HTTP ${r.status}`);
    } catch (e) {
      log("Pages", p.name, false, String(e));
    }
  }

  // ============================================================
  // 2) الحماية (بدون تسجيل دخول)
  // ============================================================
  console.log("\n━━━ 2) الحماية ━━━\n");
  const protectedPaths = ["/student", "/student/grades", "/student/word-editor", "/faculty", "/affairs", "/affairs/grades", "/contact/admin"];
  for (const p of protectedPaths) {
    try {
      const r = await fetch(`${BASE}${p}`, { redirect: "manual" });
      log("Protection", p, r.status === 307 || r.status === 302, `HTTP ${r.status}`);
    } catch (e) {
      log("Protection", p, false, String(e));
    }
  }

  // ============================================================
  // 3) حماية الـ APIs
  // ============================================================
  console.log("\n━━━ 3) حماية الـ APIs ━━━\n");
  const protectedApis = [
    "/api/notifications",
    "/api/admin/users",
    "/api/admin/stats",
    "/api/admin/audit",
    "/api/admin/messages",
    "/api/admin/submissions",
    "/api/submissions",
    "/api/affairs/grades",
    "/api/affairs/stats",
    "/api/student/assignment",
    "/api/submissions/me",
  ];
  for (const p of protectedApis) {
    try {
      const r = await fetch(`${BASE}${p}`);
      log("API Protection", p, r.status === 401 || r.status === 403, `HTTP ${r.status}`);
    } catch (e) {
      log("API Protection", p, false, String(e));
    }
  }

  // ============================================================
  // 4) تسجيل الدخول لكل الأدوار
  // ============================================================
  console.log("\n━━━ 4) تسجيل الدخول ━━━\n");
  const adminCookie = await login("admin@earth.edu", "Admin@1234", "ADMIN");
  const affairsCookie = await login("affairs@earth.edu", "Affairs@1234", "AFFAIRS");
  const facultyCookie = await login("dr.ahmed@faculty.local", "Faculty@1234", "FACULTY");
  const faculty2Cookie = await login("dr.mona@faculty.local", "Faculty@1234", "FACULTY");
  const studentCookie = await login("30001011200077@student.local", "Student@1234", "STUDENT");

  log("Auth", "دخول المبرمج", !!adminCookie);
  log("Auth", "دخول الشؤون", !!affairsCookie);
  log("Auth", "دخول د. أحمد", !!facultyCookie);
  log("Auth", "دخول د. منى", !!faculty2Cookie);
  log("Auth", "دخول الطالب", !!studentCookie);

  // ============================================================
  // 5) APIs بالجلسة
  // ============================================================
  console.log("\n━━━ 5) APIs بالجلسة ━━━\n");

  // Admin
  if (adminCookie) {
    for (const p of ["/api/admin/users", "/api/admin/stats", "/api/admin/audit", "/api/admin/messages", "/api/admin/submissions"]) {
      const r = await fetch(`${BASE}${p}`, { headers: { Cookie: adminCookie } });
      log("Admin API", p, r.ok, `HTTP ${r.status}`);
    }
  }

  // Affairs
  if (affairsCookie) {
    for (const p of ["/api/affairs/grades", "/api/affairs/stats"]) {
      const r = await fetch(`${BASE}${p}`, { headers: { Cookie: affairsCookie } });
      log("Affairs API", p, r.ok, `HTTP ${r.status}`);
    }
  }

  // Faculty
  if (facultyCookie) {
    for (const p of ["/api/assignments", "/api/submissions"]) {
      const r = await fetch(`${BASE}${p}`, { headers: { Cookie: facultyCookie } });
      log("Faculty API", p, r.ok, `HTTP ${r.status}`);
    }
  }

  // Student
  if (studentCookie) {
    for (const p of ["/api/student/assignment", "/api/submissions/me"]) {
      const r = await fetch(`${BASE}${p}`, { headers: { Cookie: studentCookie } });
      log("Student API", p, r.ok, `HTTP ${r.status}`);
    }
  }

  // ============================================================
  // 6) Honeypot
  // ============================================================
  console.log("\n━━━ 6) Honeypot ━━━\n");
  try {
    const r = await fetch(`${BASE}/api/contact/trap?password=full_test_${Date.now()}`);
    log("Honeypot", "Trap API", r.ok, `HTTP ${r.status}`);

    await sleep(500);
    if (adminCookie) {
      const auditRes = await fetch(`${BASE}/api/admin/audit?action=SECURITY_THREAT`, { headers: { Cookie: adminCookie } });
      const data = await auditRes.json() as { logs: unknown[] };
      log("Honeypot", "التسلل مسجل في Audit", (data.logs?.length ?? 0) > 0, `${data.logs?.length ?? 0} محاولة`);
    }
  } catch (e) {
    log("Honeypot", "Trap API", false, String(e));
  }

  // ============================================================
  // 7) Workflow كامل (طالب يسلّم → أستاذ يرصد)
  // ============================================================
  console.log("\n━━━ 7) Workflow كامل ━━━\n");

  if (studentCookie && facultyCookie) {
    // جلب التكليف
    const assignRes = await fetch(`${BASE}/api/student/assignment`, { headers: { Cookie: studentCookie } });
    const assignData = await assignRes.json() as { hasChosen: boolean; chosen?: { id: string } };
    log("Workflow", "الطالب عنده تكليف", assignData.hasChosen === true);

    if (assignData.chosen?.id) {
      // مسودة
      const draftRes = await fetch(`${BASE}/api/assignments/${assignData.chosen.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: studentCookie },
        body: JSON.stringify({
          text: "مسودة اختبار شامل",
          htmlContent: "<p>مسودة اختبار شامل</p>",
          defenseAnswer: "عنوان اختباري",
          action: "draft",
        }),
      });
      log("Workflow", "حفظ مسودة", draftRes.ok);

      // تسليم قصير (مرفوض)
      const shortRes = await fetch(`${BASE}/api/assignments/${assignData.chosen.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: studentCookie },
        body: JSON.stringify({ text: "قصير", htmlContent: "<p>قصير</p>", defenseAnswer: "ع", action: "submit" }),
      });
      log("Workflow", "رفض التسليم القصير", shortRes.status === 400);

      // تسليم صحيح
      const longText = "هذا نص اختبار شامل يتضمن جميع الكلمات المطلوبة للتحقق من عمل المنظومة في كافة الجوانب المختلفة.".repeat(3);
      const submitRes = await fetch(`${BASE}/api/assignments/${assignData.chosen.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: studentCookie },
        body: JSON.stringify({
          text: longText,
          htmlContent: `<p>${longText}</p>`,
          defenseAnswer: "بحث اختبار شامل",
          action: "submit",
        }),
      });
      const submitData = await submitRes.json() as { submission?: { id: string; status: string } };
      log("Workflow", "تسليم بحث كامل", submitRes.ok, `حالة: ${submitData.submission?.status}`);

      // إشعار للأستاذ
      if (submitRes.ok) {
        await sleep(500);
        const notifRes = await fetch(`${BASE}/api/notifications`, { headers: { Cookie: facultyCookie } });
        const notifData = await notifRes.json() as { notifications: { type: string }[] };
        const hasSubmit = (notifData.notifications ?? []).some(n => n.type === "RESEARCH_SUBMITTED");
        log("Workflow", "إشعار وصل للأستاذ", hasSubmit);
      }

      // رصد درجة
      if (submitData.submission?.id) {
        const gradeRes = await fetch(`${BASE}/api/submissions/${submitData.submission.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Cookie: facultyCookie },
          body: JSON.stringify({ score: 88, notes: "اختبار شامل" }),
        });
        log("Workflow", "رصد درجة", gradeRes.ok);

        // التحقق
        const viewRes = await fetch(`${BASE}/api/submissions/${submitData.submission.id}/view`, { headers: { Cookie: facultyCookie } });
        const viewData = await viewRes.json() as { submission?: { status: string; score: number | null } };
        log("Workflow", "البحث REVIEWED", viewData.submission?.status === "REVIEWED", `درجة: ${viewData.submission?.score}`);
      }
    }
  }

  // ============================================================
  // 8) عزل الأدوار
  // ============================================================
  console.log("\n━━━ 8) عزل الأدوار ━━━\n");

  // طالب يحاول يدخل API أستاذ
  if (studentCookie) {
    const r = await fetch(`${BASE}/api/submissions`, { headers: { Cookie: studentCookie } });
    log("Isolation", "طالب لا يرى تسليمات الأستاذ", r.status === 403 || r.status === 401, `HTTP ${r.status}`);
  }

  // أستاذ يحاول يدخل API أدمن
  if (facultyCookie) {
    const r = await fetch(`${BASE}/api/admin/users`, { headers: { Cookie: facultyCookie } });
    log("Isolation", "أستاذ لا يدخل API أدمن", r.status === 403 || r.status === 401, `HTTP ${r.status}`);
  }

  // أستاذ د. أحمد لا يرى مواضيع د. منى
  if (facultyCookie && faculty2Cookie) {
    const assignments1 = await fetch(`${BASE}/api/assignments`, { headers: { Cookie: facultyCookie } });
    const data1 = await assignments1.json() as { assignments: { facultyId: string }[] };

    const assignments2 = await fetch(`${BASE}/api/assignments`, { headers: { Cookie: faculty2Cookie } });
    const data2 = await assignments2.json() as { assignments: { facultyId: string }[] };

    const hasOverlap = data1.assignments?.some(a1 =>
      data2.assignments?.some(a2 => a1.facultyId === a2.facultyId)
    );
    log("Isolation", "د. أحمد ود. منى معزولان", !hasOverlap, `أحمد: ${data1.assignments?.length ?? 0} | منى: ${data2.assignments?.length ?? 0}`);
  }

  // ============================================================
  // 9) Rate Limiting
  // ============================================================
  console.log("\n━━━ 9) Rate Limiting ━━━\n");
  try {
    let rateLimited = false;
    const fixedEmail = `ratelimit_${Date.now()}@test.local`;
    for (let i = 0; i < 8; i++) {
      const r = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fixedEmail, password: "WrongPass1!", role: "STUDENT" }),
      });
      if (r.status === 429) { rateLimited = true; break; }
    }
    log("Security", "Rate Limiting على login", rateLimited, rateLimited ? "الحظر شغال" : "لم يتم الحظر");
  } catch (e) {
    log("Security", "Rate Limiting", false, String(e));
  }

  // ============================================================
  // 10) قوة كلمة المرور
  // ============================================================
  console.log("\n━━━ 10) قوة كلمة المرور ━━━\n");

  const weakPasswords = [
    { pwd: "12345678", reason: "قصير" },
    { pwd: "MyEarth2026", reason: "بدون رمز" },
    { pwd: "myearth@2026", reason: "بدون كبير" },
    { pwd: "Password@123", reason: "شائع" },
  ];

  for (const wp of weakPasswords) {
    try {
      const testEmail = `pwdtest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.local`;
      const testCode = `3000${Date.now().toString().slice(-10)}`;
      const r = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: wp.pwd,
          confirmPassword: wp.pwd,
          role: "STUDENT",
          fullName: "اختبار شامل للباسوردات",
          academicYear: "الفرقة الأولى",
          studentCode: testCode,
        }),
      });
      log("Password", `رفض (${wp.reason})`, r.status === 400 || r.status === 429, `HTTP ${r.status}`);
      await sleep(2500);
    } catch (e) {
      log("Password", `رفض (${wp.reason})`, false, String(e));
    }
  }

  // ============================================================
  // 11) Audit Log
  // ============================================================
  console.log("\n━━━ 11) Audit Log ━━━\n");
  if (adminCookie) {
    const r = await fetch(`${BASE}/api/admin/audit`, { headers: { Cookie: adminCookie } });
    const data = await r.json() as { logs: { action: string }[]; actions: { action: string; count: number }[] };
    log("Audit", "يوجد سجلات", (data.logs?.length ?? 0) > 0, `${data.logs?.length ?? 0} سجل`);

    const actions = (data.actions ?? []).map(a => a.action);
    log("Audit", "LOGIN مسجل", actions.includes("LOGIN"));
    log("Audit", "SUBMIT_RESEARCH مسجل", actions.includes("SUBMIT_RESEARCH"));
    log("Audit", "SECURITY_THREAT مسجل", actions.includes("SECURITY_THREAT"));
    log("Audit", "GRADE مسجل", actions.includes("GRADE_SUBMISSION") || actions.includes("UPDATE_SUBMISSION"));
  }

  // ============================================================
  // 12) Change Password
  // ============================================================
  console.log("\n━━━ 12) تغيير كلمة المرور ━━━\n");

  if (studentCookie) {
    const r1 = await fetch(`${BASE}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCookie },
      body: JSON.stringify({ currentPassword: "WrongOld1!", newPassword: "NewPass@2026", confirmPassword: "NewPass@2026" }),
    });
    log("Password Change", "رفض القديم الخاطئ", r1.status === 401);

    const r2 = await fetch(`${BASE}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCookie },
      body: JSON.stringify({ currentPassword: "Student@1234", newPassword: "weak", confirmPassword: "weak" }),
    });
    log("Password Change", "رفض الجديد الضعيف", r2.status === 400);

    const r3 = await fetch(`${BASE}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: studentCookie },
      body: JSON.stringify({ currentPassword: "Student@1234", newPassword: "Student@1234", confirmPassword: "Student@1234" }),
    });
    log("Password Change", "رفض نفس الباسورد", r3.status === 400);
  }

  // ============================================================
  // النتيجة النهائية
  // ============================================================
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const total = results.length;
  const rate = ((passed / total) * 100).toFixed(1);

  console.log("\n" + "═".repeat(60));
  console.log("📊 النتيجة النهائية");
  console.log("═".repeat(60));
  console.log(`   ✅ نجح:  ${passed}`);
  console.log(`   ❌ فشل:  ${failed}`);
  console.log(`   📈 النسبة: ${rate}%`);
  console.log(`   ⏱️  الوقت: ${elapsed} ثانية`);
  console.log("═".repeat(60) + "\n");

  if (failed > 0) {
    console.log("❌ الاختبارات الفاشلة:\n");
    const byCategory = new Map<string, typeof results>();
    for (const r of results.filter(x => !x.ok)) {
      if (!byCategory.has(r.category)) byCategory.set(r.category, []);
      byCategory.get(r.category)!.push(r);
    }
    for (const [cat, items] of byCategory) {
      console.log(`   📁 ${cat}:`);
      items.forEach(i => console.log(`      - ${i.test}: ${i.note}`));
    }
    console.log("");
  } else {
    console.log("🎉 كل الاختبارات نجحت! المنظومة جاهزة للنشر.\n");
  }
}

run().catch(console.error);

export {};
