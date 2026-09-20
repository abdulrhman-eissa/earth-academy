/**
 * اختبار شامل لسير العمل:
 * - التكاليف (إنشاء/جلب)
 * - التسليم (مسودة + تسليم نهائي)
 * - الإشعارات (تسليم → أستاذ)
 * - الرصد (أستاذ يرصد → الطالب)
 * - Audit Log + الإنذارات
 */

const BASE = "http://localhost:3000";
const results: { test: string; ok: boolean; note: string }[] = [];

function log(test: string, ok: boolean, note = "") {
  results.push({ test, ok, note });
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${test} ${note ? `— ${note}` : ""}`);
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
  console.log("\n🧪 بدء اختبار سير العمل الكامل...\n");

  // ============ 1) تسجيل الدخول لكل الأدوار ============
  console.log("📌 [1] تسجيل الدخول");
  const adminCookie = await login("admin@earth.edu", "Admin@1234", "ADMIN");
  const facultyCookie = await login("dr.ahmed@faculty.local", "Faculty@1234", "FACULTY");
  const studentCookie = await login("30001011200077@student.local", "Student@1234", "STUDENT");

  log("دخول الأدمن", !!adminCookie);
  log("دخول الأستاذ", !!facultyCookie);
  log("دخول الطالب", !!studentCookie);

  if (!adminCookie || !facultyCookie || !studentCookie) {
    console.error("❌ فشل في تسجيل الدخول — إيقاف الاختبار");
    return;
  }

  // ============ 2) الأستاذ: جلب تكليفاته ============
  console.log("\n📌 [2] الأستاذ — تكليفاته");
  let assignmentId = "";
  try {
    const r = await fetch(`${BASE}/api/assignments`, { headers: { Cookie: facultyCookie } });
    const data = await r.json() as { assignments: { id: string; course: string; _count?: { submissions: number } }[] };
    const count = data.assignments?.length ?? 0;
    log("جلب تكليفات الأستاذ", r.ok, `${count} تكليف`);
    if (data.assignments?.length > 0) {
      assignmentId = data.assignments[0].id;
      console.log(`   📚 التكليف الأول: ${data.assignments[0].course}`);
    }
  } catch (e) {
    log("جلب تكليفات الأستاذ", false, String(e));
  }

  // ============ 3) الأستاذ: إنشاء تكليف جديد ============
  console.log("\n📌 [3] الأستاذ — إنشاء تكليف جديد");
  let newAssignmentId = "";
  try {
    const uniqueTitle = `اختبار_${Date.now()}`;
    const r = await fetch(`${BASE}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: facultyCookie },
      body: JSON.stringify({
        title: uniqueTitle,
        description: "تكليف اختباري للتحقق من سير العمل",
        course: "اختبار آلي",
        isPublished: true,
      }),
    });
    const data = await r.json().catch(() => ({})) as { assignment?: { id: string } };
    newAssignmentId = data.assignment?.id ?? "";
    log("إنشاء تكليف جديد", r.ok && !!newAssignmentId, newAssignmentId ? `ID: ${newAssignmentId.slice(0, 8)}...` : `HTTP ${r.status}`);
  } catch (e) {
    log("إنشاء تكليف جديد", false, String(e));
  }

  // ============ 4) الطالب: جلب التكليف المختار ============
  console.log("\n📌 [4] الطالب — التكليف المختار");
  let studentAssignmentId = "";
  try {
    const r = await fetch(`${BASE}/api/student/assignment`, { headers: { Cookie: studentCookie } });
    const data = await r.json() as { hasChosen: boolean; chosen?: { id: string; course: string } };
    studentAssignmentId = data.chosen?.id ?? "";
    log("جلب التكليف المختار للطالب", r.ok && data.hasChosen, data.chosen?.course ?? "لا يوجد");
  } catch (e) {
    log("جلب التكليف المختار", false, String(e));
  }

  // ============ 5) الطالب: حفظ مسودة (بدون شروط) ============
  console.log("\n📌 [5] الطالب — حفظ مسودة");
  if (studentAssignmentId) {
    try {
      const r = await fetch(`${BASE}/api/assignments/${studentAssignmentId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: studentCookie },
        body: JSON.stringify({
          text: "مسودة اختبارية",
          htmlContent: "<p>مسودة اختبارية</p>",
          defenseAnswer: "عنوان اختباري",
          action: "draft",
          activityLog: [{ at: new Date().toISOString(), type: "SAVE_DRAFT", details: "اختبار آلي" }],
        }),
      });
      const data = await r.json().catch(() => ({})) as { submission?: { id: string; status: string } };
      log("حفظ مسودة (بدون شرط 50 حرف)", r.ok, `حالة: ${data.submission?.status ?? "?"}`);
    } catch (e) {
      log("حفظ مسودة", false, String(e));
    }
  }

  // ============ 6) الطالب: تسليم بحث (مع شرط 50 حرف) ============
  console.log("\n📌 [6] الطالب — تسليم بحث نهائي");
  let submissionId = "";
  if (studentAssignmentId) {
    try {
      const longText = "هذا نص تجريبي للتحقق من عمل منظومة الأبحاث الأكاديمية. يتناول البحث موضوعات تاريخية هامة، ويغطي مختلف الجوانب العلمية والأكاديمية.".repeat(3);
      const r = await fetch(`${BASE}/api/assignments/${studentAssignmentId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: studentCookie },
        body: JSON.stringify({
          text: longText,
          htmlContent: `<p>${longText}</p>`,
          defenseAnswer: "بحث تجريبي للمنظومة",
          action: "submit",
          activityLog: [{ at: new Date().toISOString(), type: "SUBMIT_FINAL", details: "اختبار آلي" }],
        }),
      });
      const data = await r.json().catch(() => ({})) as { submission?: { id: string; status: string }; error?: string };
      submissionId = data.submission?.id ?? "";
      log("تسليم بحث نهائي", r.ok, data.error ?? `حالة: ${data.submission?.status ?? "?"}`);
    } catch (e) {
      log("تسليم بحث نهائي", false, String(e));
    }
  }

  // ============ 7) التحقق: رفض التسليم القصير ============
  console.log("\n📌 [7] اختبار حماية — تسليم قصير");
  if (studentAssignmentId) {
    try {
      const r = await fetch(`${BASE}/api/assignments/${studentAssignmentId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: studentCookie },
        body: JSON.stringify({
          text: "قصير",
          htmlContent: "<p>قصير</p>",
          defenseAnswer: "عنوان",
          action: "submit",
        }),
      });
      log("رفض التسليم القصير (< 50 حرف)", r.status === 400, `HTTP ${r.status}`);
    } catch (e) {
      log("رفض التسليم القصير", false, String(e));
    }
  }

  // ============ 8) التحقق: إشعار وصل للأستاذ ============
  console.log("\n📌 [8] إشعار الأستاذ بعد التسليم");
  await new Promise(r => setTimeout(r, 500));
  try {
    const r = await fetch(`${BASE}/api/notifications`, { headers: { Cookie: facultyCookie } });
    const data = await r.json() as { notifications: { type: string; title: string; createdAt: string }[]; unreadCount: number };
    const recent = (data.notifications ?? []).slice(0, 5);
    const hasSubmitNotif = recent.some(n => n.type === "RESEARCH_SUBMITTED");
    log("وصول إشعار تسليم للأستاذ", hasSubmitNotif, `إجمالي: ${data.notifications?.length ?? 0} | غير مقروء: ${data.unreadCount}`);
  } catch (e) {
    log("إشعار الأستاذ", false, String(e));
  }

  // ============ 9) الأستاذ: جلب تسليمات المادة ============
  console.log("\n📌 [9] الأستاذ — عرض التسليمات");
  if (assignmentId) {
    try {
      const r = await fetch(`${BASE}/api/submissions?assignmentId=${assignmentId}`, { headers: { Cookie: facultyCookie } });
      const data = await r.json() as { submissions: { id: string; student: { studentProfile: { fullName: string } | null } }[] };
      log("جلب تسليمات مادة معيّنة", r.ok, `${data.submissions?.length ?? 0} تسليم`);
    } catch (e) {
      log("جلب التسليمات", false, String(e));
    }
  }

  // ============ 10) الأستاذ: رصد درجة ============
  console.log("\n📌 [10] الأستاذ — رصد درجة");
  if (submissionId) {
    try {
      const r = await fetch(`${BASE}/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: facultyCookie },
        body: JSON.stringify({ score: 87, notes: "بحث ممتاز — اختبار آلي" }),
      });
      log("رصد درجة 87", r.ok, `HTTP ${r.status}`);
    } catch (e) {
      log("رصد درجة", false, String(e));
    }
  }

  // ============ 11) التحقق: البحث صار REVIEWED ============
  console.log("\n📌 [11] التحقق — البحث صار مرصود");
  if (submissionId) {
    try {
      const r = await fetch(`${BASE}/api/submissions/${submissionId}/view`, { headers: { Cookie: facultyCookie } });
      const data = await r.json() as { submission?: { status: string; score: number | null } };
      log("البحث صار REVIEWED", data.submission?.status === "REVIEWED", `الحالة: ${data.submission?.status} | الدرجة: ${data.submission?.score}`);
    } catch (e) {
      log("التحقق من حالة البحث", false, String(e));
    }
  }

  // ============ 12) Audit Log — تسجيل كل العمليات ============
  console.log("\n📌 [12] Audit Log");
  try {
    const r = await fetch(`${BASE}/api/admin/audit`, { headers: { Cookie: adminCookie } });
    const data = await r.json() as { logs: { action: string; details: string | null }[] };
    const logs = data.logs ?? [];
    const hasSubmit = logs.some(l => l.action === "SUBMIT_RESEARCH");
    const hasGrade = logs.some(l => l.action === "GRADE_SUBMISSION" || l.action === "UPDATE_SUBMISSION");
    log("سجل Audit فيه SUBMIT_RESEARCH", hasSubmit, `إجمالي: ${logs.length} سجل`);
    log("سجل Audit فيه GRADE_SUBMISSION", hasGrade);
  } catch (e) {
    log("Audit Log", false, String(e));
  }

  // ============ 13) Honeypot — تسجيل التهديد ============
  console.log("\n📌 [13] Honeypot — تسجيل تهديد");
  try {
    await fetch(`${BASE}/api/contact/trap?password=test_threat_${Date.now()}`);
    await new Promise(r => setTimeout(r, 500));
    const r = await fetch(`${BASE}/api/admin/audit?action=SECURITY_THREAT`, { headers: { Cookie: adminCookie } });
    const data = await r.json() as { logs: { details: string | null }[] };
    log("محاولة تسلل مسجّلة", (data.logs?.length ?? 0) > 0, `${data.logs?.length ?? 0} محاولة`);
  } catch (e) {
    log("Honeypot", false, String(e));
  }

  // ============ 14) الشؤون: التحقق من وجود الدرجة ============
  console.log("\n📌 [14] شؤون الطلاب — التحقق من الدرجة");
  const affairsCookie = await login("affairs@earth.edu", "Affairs@1234", "AFFAIRS");
  if (affairsCookie) {
    try {
      const r = await fetch(`${BASE}/api/affairs/grades`, { headers: { Cookie: affairsCookie } });
      const data = await r.json() as { rows: { score: number | null; student: { studentProfile: { fullName: string } | null } }[] };
      const graded = (data.rows ?? []).filter(row => row.score !== null);
      log("الدرجة ظهرت في شؤون الطلاب", graded.length > 0, `${graded.length} درجة مرصودة`);
    } catch (e) {
      log("شؤون الطلاب", false, String(e));
    }
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
  } else {
    console.log("🎉 كل الاختبارات نجحت — سير العمل مثالي!\n");
  }
}

run().catch(console.error);

export {};
