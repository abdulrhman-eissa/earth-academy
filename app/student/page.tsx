"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, LogOut, Save, Send, CheckCircle2,
  Bell, MessageSquare, X, ShieldCheck,
  Bold, Italic, Underline, AlignRight, AlignCenter, AlignLeft,
  FileText, Activity, BookOpen, UserCheck, AlertCircle, Plus, Minus,
  Award,
  FileEdit,
} from "lucide-react";

interface ReplyNotification {
  id: string;
  originalMsg: string;
  reply: string;
  repliedAt: string;
  isRead: boolean;
}

interface AvailableAssignment {
  id: string;
  title: string;
  description: string;
  course: string;
  deadline: string | null;
  faculty: {
    email: string;
    facultyProfile: { fullName: string; academicTitle: string | null } | null;
  } | null;
}

export default function StudentDashboard() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [specialty, setSpecialty] = useState("");

  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState<string | null>(null);
  const [minPages, setMinPages] = useState<number>(3);
  const [maxPages, setMaxPages] = useState<number>(10);

  const [researchTitle, setResearchTitle] = useState("");
  const [researchContent, setResearchContent] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assignments, setAssignments] = useState<AvailableAssignment[]>([]);
  const [assignmentId, setAssignmentId] = useState("");

  const [fontSize, setFontSize] = useState<number>(16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<"right" | "center" | "left">("right");

  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [autoSaveStatus] = useState("الحفظ النهائي عبر قاعدة البيانات");

  const [notifications, setNotifications] = useState<ReplyNotification[]>([]);
  const [showNotifModal, setShowNotifModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "STUDENT" }) })
      .then((r) => r.json())
      .then(async (data) => {
        if (cancelled) return;
        if (!data.authenticated || !data.session || data.session.role !== "STUDENT") {
          router.replace("/student/login");
          return;
        }
        const savedName = sessionStorage.getItem("student_name") || localStorage.getItem("earth_student_persistent_name") || "طالب أزهرية";
        const savedYear = sessionStorage.getItem("student_year") || localStorage.getItem("earth_student_persistent_year") || "الفرقة الأولى";
        const savedSpec = sessionStorage.getItem("student_specialty") || localStorage.getItem("earth_student_persistent_spec") || "تاريخ وحضارة";
        const savedNId = sessionStorage.getItem("student_national_id") || localStorage.getItem("earth_student_persistent_id") || "";

        setNationalId(savedNId);
        setStudentName(savedName);
        setTargetYear(savedYear);
        setSpecialty(savedSpec);

        const assignCheck = await fetch("/api/student/assignment").then((r) => r.json()).catch(() => ({ hasChosen: false }));
        if (!assignCheck.hasChosen) {
          router.replace("/student/select-assignment");
          return;
        }
        loadFacultyConfig();
        void fetch("/api/assignments")
          .then((response) => response.ok ? response.json() : Promise.reject())
          .then((data) => {
            setAssignments(data.assignments);
            if (data.assignments[0]) {
              const a = data.assignments[0];
              setAssignmentId(a.id);
              setSubjectName(a.course);
              // اسم الدكتور من التكليف نفسه
              const doc = a.faculty?.facultyProfile;
              if (doc) {
                const title = doc.academicTitle ? doc.academicTitle + " " : "";
                setDoctorName(title + (doc.fullName || "عضو هيئة التدريس"));
              }
            }
          })
          .catch(() => addRunLog("تعذر تحميل التكليفات المتاحة."));

        addRunLog("تم فتح المحرر الأكاديمي الرقمي.");
        loadNotifications(savedNId);
      })
      .catch(() => router.replace("/student/login"));
    return () => { cancelled = true; };
  }, [router]);

  function loadFacultyConfig() {
    const facultyConfig = JSON.parse(localStorage.getItem("earth_faculty_config") || "{}");
    if (facultyConfig.doctorName && facultyConfig.subjectName) {
      setDoctorName(facultyConfig.doctorName);
      setSubjectName(facultyConfig.subjectName);
      if (facultyConfig.minPages) setMinPages(facultyConfig.minPages);
      if (facultyConfig.maxPages) setMaxPages(facultyConfig.maxPages);
    }
  }

  function addRunLog(message: string) {
    const time = new Date().toLocaleTimeString("ar-EG");
    setRunLogs((prev) => [`[${time}] ${message}`, ...prev.slice(0, 15)]);
  }

  function loadNotifications(nId: string) {
    try {
      const savedReplies = JSON.parse(
        localStorage.getItem(`earth_user_replies_${nId}`) || "[]"
      );
      if (Array.isArray(savedReplies)) {
        setNotifications(savedReplies.reverse());
      }
    } catch {
      setNotifications([]);
    }
  }

  const handlePreventCopyPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    addRunLog("⚠️ تنبيه أمني: محاولة لصق/قص (تم الحظر لمنع الغش).");
    alert("تنبيه أمني: حظر اللصق والقص مُفعل لضمان النزاهة الأكاديمية وصياغة البحث شخصياً.");
  };

  const handleOpenNotifications = () => {
    setShowNotifModal(true);
    if (!nationalId) return;

    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem(`earth_user_replies_${nationalId}`, JSON.stringify(updated.reverse()));
  };

  const handleSaveDraft = () => {
    setIsSaving(false);
    alert("يتم حفظ التسليم النهائي فقط في قاعدة البيانات عند الاعتماد.");
  };

  const handleSubmitResearch = async () => {
    if (!researchTitle.trim() || researchContent.trim().length < 50) {
      alert("تنبيه أمني: يرجى كتابة عنوان البحث واستكمال محتوى لا يقل عن 50 حرفاً قبل الاعتماد النهائي.");
      return;
    }

    if (!confirm("هل أنت متأكد من تسليم البحث نهائياً؟ لن تتمكن من التعديل بعد الاعتماد.")) return;

    if (!assignmentId) {
      alert("لا يوجد تكليف منشور حالياً.");
      return;
    }
    const response = await fetch(`/api/assignments/${assignmentId}/submissions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: researchContent, defenseAnswer: researchTitle, pasteAttempts: 0 }),
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      alert(result.error || "تعذر تسليم البحث.");
      return;
    }
    setIsSubmitted(true);
    addRunLog("✅ تم اعتماد وتسليم البحث نهائياً.");
    alert("تم اعتماد وتسليم بحثك الإلكتروني بنجاح في منظومة EARTH!");
  };

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    sessionStorage.clear();
    router.replace("/student/login");
  };

  const charCount = researchContent.length;
  const wordCount = researchContent.trim() ? researchContent.trim().split(/\s+/).length : 0;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 250));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col dir-rtl font-sans text-right text-gray-900">

      <header className="bg-[#1e5eb8] text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-lg flex items-center gap-2">
              {studentName}
              <span className="text-[10px] bg-white/15 border border-white/20 text-blue-100 px-2.5 py-0.5 rounded-full font-bold">
                {targetYear} — {specialty}
              </span>
            </h1>
            <p className="text-[11px] text-blue-100 mt-0.5 font-mono">الرقم القومي / الجواز: {nationalId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenNotifications}
            className="relative bg-white/15 hover:bg-white/25 border border-white/20 text-white p-2.5 rounded-2xl transition"
            title="تنبيهات الدعم الفني"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          <Link
            href="/student/word-editor"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shadow-sm"
          >
            <FileEdit className="w-4 h-4" /> المحرر الأكاديمي المتقدم
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 grid grid-cols-12 gap-4 max-w-[1920px] w-full mx-auto">
        <section className="col-span-12 bg-white p-4 rounded-3xl shadow-sm border border-gray-200 animate-fade-in-up">
          <label className="block text-xs font-black text-[#1e5eb8] mb-2">التكليف المختار</label>
          <select
            value={assignmentId}
            onChange={(event) => {
              const selected = assignments.find((assignment) => assignment.id === event.target.value);
              setAssignmentId(event.target.value);
              if (selected) setSubjectName(selected.course);
            }}
            className="w-full p-3 rounded-xl border-2 border-gray-300 bg-gray-50 text-sm font-bold focus:border-[#1e5eb8] outline-none"
            disabled={true}
          >
            {!assignments.length && <option value="">لا توجد تكليفات منشورة حالياً</option>}
            {assignments.map((assignment) => {
              const docName = assignment.faculty?.facultyProfile?.fullName || "عضو هيئة التدريس";
              const docTitle = assignment.faculty?.facultyProfile?.academicTitle || "";
              return (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.course} — {docTitle} {docName}{assignment.deadline ? ` (آخر موعد: ${new Date(assignment.deadline).toLocaleString("ar-EG")})` : ""}
                </option>
              );
            })}
          </select>
          {assignments.find((assignment) => assignment.id === assignmentId)?.description && (
            <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap font-bold">
              {assignments.find((assignment) => assignment.id === assignmentId)?.description}
            </p>
          )}
        </section>

        {/* 1. الإحصائيات الحية وأزرار المسودة والتسليم */}
        <section className="col-span-3 space-y-4 overflow-y-auto animate-fade-in-up-delayed">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="font-black text-sm text-gray-900 border-b-2 border-gray-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1e5eb8]" /> إحصائيات البحث الحية
            </h2>

            <div className="space-y-2.5">
              <div className="bg-blue-50 p-3.5 rounded-2xl border-2 border-blue-100 flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#1e5eb8]">الصفحات التقديرية</span>
                <span className="text-xl font-black font-mono text-[#1e5eb8]">{estimatedPages} <span className="text-[10px] font-normal">صفحة</span></span>
              </div>

              <div className="bg-emerald-50 p-3.5 rounded-2xl border-2 border-emerald-100 flex justify-between items-center">
                <span className="text-[11px] font-bold text-emerald-800">إجمالي الكلمات</span>
                <span className="text-lg font-bold font-mono text-emerald-800">{wordCount}</span>
              </div>

              <div className="bg-purple-50 p-3.5 rounded-2xl border-2 border-purple-100 flex justify-between items-center">
                <span className="text-[11px] font-bold text-purple-800">إجمالي الحروف</span>
                <span className="text-lg font-bold font-mono text-purple-800">{charCount}</span>
              </div>
            </div>

            {!isSubmitted ? (
              <div className="space-y-2.5 pt-3 border-t-2 border-gray-100">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 border-2 border-gray-200"
                >
                  <Save className="w-4 h-4 text-gray-600" />
                  {isSaving ? "جاري الحفظ..." : "حفظ مسودة"}
                </button>

                <button
                  onClick={handleSubmitResearch}
                  className="w-full bg-[#1e5eb8] hover:bg-[#1650a0] text-white font-black py-3.5 rounded-2xl text-sm transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> اعتماد وتسليم البحث
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-900 p-4 rounded-2xl text-center text-xs font-black space-y-1.5">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                <span>تم التسليم بنجاح</span>
              </div>
            )}
          </div>
        </section>

        {/* 2. المحرر */}
        <section className="col-span-6 space-y-4 overflow-hidden flex flex-col animate-fade-in-up-delayed">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 space-y-4 flex-1 flex flex-col overflow-hidden">

            <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-2xl border-2 border-gray-100 flex-wrap gap-2">
              <span className="text-[11px] font-black text-gray-600">أدوات التنسيق:</span>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-gray-200">
                  <button
                    type="button"
                    onClick={() => setFontSize((prev) => Math.min(prev + 2, 32))}
                    className="p-1.5 hover:bg-blue-50 text-gray-700 hover:text-[#1e5eb8] font-bold rounded-lg text-xs flex items-center gap-0.5 transition"
                    title="تكبير الخط"
                  >
                    <Plus className="w-3.5 h-3.5" /> A
                  </button>
                  <span className="text-[11px] font-bold font-mono px-2 text-[#1e5eb8] border-x-2 border-gray-100">{fontSize}px</span>
                  <button
                    type="button"
                    onClick={() => setFontSize((prev) => Math.max(prev - 2, 12))}
                    className="p-1.5 hover:bg-blue-50 text-gray-700 hover:text-[#1e5eb8] font-bold rounded-lg text-xs flex items-center gap-0.5 transition"
                    title="تصغير الخط"
                  >
                    <Minus className="w-3.5 h-3.5" /> A
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsBold(!isBold)}
                    className={`p-2 rounded-lg transition ${isBold ? "bg-blue-100 text-[#1e5eb8]" : "hover:bg-gray-100 text-gray-700"}`}
                    title="عريض"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsItalic(!isItalic)}
                    className={`p-2 rounded-lg transition ${isItalic ? "bg-blue-100 text-[#1e5eb8]" : "hover:bg-gray-100 text-gray-700"}`}
                    title="مائل"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUnderline(!isUnderline)}
                    className={`p-2 rounded-lg transition ${isUnderline ? "bg-blue-100 text-[#1e5eb8]" : "hover:bg-gray-100 text-gray-700"}`}
                    title="تحته خط"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-px bg-gray-300 mx-1" />

                  <button
                    type="button"
                    onClick={() => setTextAlign("right")}
                    className={`p-2 rounded-lg transition ${textAlign === "right" ? "bg-blue-100 text-[#1e5eb8]" : "hover:bg-gray-100 text-gray-700"}`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextAlign("center")}
                    className={`p-2 rounded-lg transition ${textAlign === "center" ? "bg-blue-100 text-[#1e5eb8]" : "hover:bg-gray-100 text-gray-700"}`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextAlign("left")}
                    className={`p-2 rounded-lg transition ${textAlign === "left" ? "bg-blue-100 text-[#1e5eb8]" : "hover:bg-gray-100 text-gray-700"}`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-800 mb-1.5">* عنوان البحث المكلف به</label>
              <input
                type="text"
                disabled={isSubmitted}
                value={researchTitle}
                onChange={(e) => {
                  setResearchTitle(e.target.value);
                  addRunLog("تحديث عنوان البحث.");
                }}
                placeholder="اكتب عنوان البحث الأكاديمي كاملاً هنا..."
                className="w-full p-3.5 border-2 border-gray-300 rounded-2xl text-sm bg-gray-50 focus:bg-white focus:border-[#1e5eb8] outline-none font-bold text-gray-900 disabled:opacity-60 transition placeholder:text-gray-500 placeholder:font-bold"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-[11px] font-black text-gray-800 mb-1.5">* محتوى ونص البحث العلمي</label>
              <textarea
                disabled={isSubmitted}
                value={researchContent}
                onChange={(e) => setResearchContent(e.target.value)}
                onPaste={handlePreventCopyPaste}
                onCut={handlePreventCopyPaste}
                placeholder="اكتب نص بحثك وتكليفك الأكاديمي بالتفصيل هنا..."
                style={{
                  fontSize: `${fontSize}px`,
                  fontWeight: isBold ? "bold" : "normal",
                  fontStyle: isItalic ? "italic" : "normal",
                  textDecoration: isUnderline ? "underline" : "none",
                  textAlign: textAlign,
                }}
                className="w-full flex-1 p-5 border-2 border-gray-300 rounded-2xl bg-gray-50 focus:bg-white focus:border-[#1e5eb8] outline-none leading-relaxed resize-none disabled:opacity-60 font-sans text-gray-900 transition placeholder:text-gray-500 placeholder:font-bold"
              />
            </div>
          </div>
        </section>

        {/* 3. البيانات الأكاديمية + الإرشادات + RUN */}
        <section className="col-span-3 space-y-4 overflow-y-auto animate-fade-in-up-delayed">

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 space-y-3">
            <h3 className="font-black text-xs text-gray-500 flex items-center gap-2 border-b-2 border-gray-100 pb-2">
              <UserCheck className="w-4 h-4 text-[#1e5eb8]" /> البيانات الأكاديمية
            </h3>

            {doctorName && subjectName ? (
              <div className="space-y-2.5 bg-blue-50/80 p-3.5 rounded-2xl border-2 border-blue-100">
                <div>
                  <span className="text-[10px] text-[#1e5eb8] font-black block">المادة المقررة:</span>
                  <p className="text-sm font-extrabold text-gray-900">{subjectName}</p>
                </div>

                <div>
                  <span className="text-[10px] text-[#1e5eb8] font-black block">أستاذ المادة:</span>
                  <p className="text-sm font-extrabold text-gray-900">{doctorName}</p>
                </div>

                <div className="border-t-2 border-blue-200 pt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-[#1e5eb8]">الحد المطلوب:</span>
                  <span className="bg-[#1e5eb8] text-white px-2.5 py-0.5 rounded-md font-mono text-[11px]">
                    {minPages} - {maxPages} صفحة
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border-2 border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>ليس هناك مواد مسجلة بعد</span>
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 space-y-3">
            <h3 className="font-black text-xs text-gray-700 flex items-center gap-2 border-b-2 border-gray-100 pb-2">
              <BookOpen className="w-4 h-4 text-[#1e5eb8]" /> إرشادات مهمة
            </h3>
            <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc list-inside leading-relaxed font-bold">
              <li>التأكد من كتابة عنوان واضح ودقيق.</li>
              <li>تقسيم البحث إلى مقدمة، مباحث، وخاتمة.</li>
              <li>الالتزام بالصفحات ({minPages} إلى {maxPages}).</li>
              <li>الالتزام بالأمانة العلمية.</li>
              <li>إدراج قائمة المصادر والمراجع.</li>
            </ul>
          </div>

          <div className="bg-gray-900 text-white p-5 rounded-3xl shadow-md border-2 border-gray-800 space-y-3">
            <div className="flex justify-between items-center border-b-2 border-gray-800 pb-2">
              <span className="text-[11px] font-black flex items-center gap-2 text-emerald-400 font-mono">
                <Activity className="w-4 h-4 animate-pulse" /> RUN
              </span>
              <span className="text-[9px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono">
                {autoSaveStatus}
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[10px] text-gray-300 max-h-40 overflow-y-auto leading-relaxed pr-1">
              {runLogs.map((log, i) => (
                <div key={i} className="border-b border-gray-800/50 pb-1">{log}</div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {showNotifModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white max-w-lg w-full rounded-3xl p-7 shadow-2xl border-2 border-gray-200 space-y-5 relative">
            <div className="flex justify-between items-center border-b-2 border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-[#1e5eb8] rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900">تنبيهات الدعم الفني</h3>
                  <p className="text-[11px] text-gray-500 font-bold">الردود الموجهة من المبرمج</p>
                </div>
              </div>

              <button
                onClick={() => setShowNotifModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className="bg-blue-50/60 p-4 rounded-2xl border-2 border-blue-200 space-y-2.5">
                    <div>
                      <span className="text-[10px] font-black text-[#1e5eb8] bg-blue-100 px-2.5 py-0.5 rounded-md">
                        استفسارك السابق:
                      </span>
                      <p className="text-xs text-gray-700 mt-1 italic font-bold">&quot;{notif.originalMsg}&quot;</p>
                    </div>

                    <div className="border-t-2 border-blue-200/80 pt-2">
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1 w-fit mb-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> رد المبرمج ({notif.repliedAt}):
                      </span>
                      <p className="text-sm font-bold text-gray-900 leading-relaxed">{notif.reply}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 space-y-2">
                  <Bell className="w-12 h-12 mx-auto opacity-30" />
                  <p className="text-sm font-bold">لا توجد رسائل واردة حالياً.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowNotifModal(false)}
              className="w-full bg-[#1e5eb8] text-white font-black py-3.5 rounded-2xl text-sm hover:bg-[#1650a0] transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        .animate-fade-in-up-delayed { animation: fadeInUp 0.5s ease-out 0.1s both; }
      `}</style>
    </div>
  );
}
