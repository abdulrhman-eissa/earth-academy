"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, LogOut, FileText, BookOpen, User, Clock,
  CheckCircle2, AlertCircle, Loader2, Award, ArrowRight,
  FileEdit, Eye, ShieldCheck, Calendar, TrendingUp,
  KeyRound,
} from "lucide-react";
import VoicePlayer from "@/components/VoicePlayer";
import FloatingAlert from "@/components/FloatingAlert";
import { Mic, AlertCircle as AlertIcon } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  course: string;
  deadline: string | null;
  faculty: { facultyProfile: { fullName: string; academicTitle: string | null } | null } | null;
}

interface SubmissionInfo {
  id: string;
  status: string;
  score: number | null;
  notes: string | null;
  submittedAt: string | null;
  wordCount: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<SubmissionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Array<{ type: string; label: string; color: "blue" | "amber" | "red" | "emerald" | "purple"; priority: number }>>([]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "STUDENT" }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (cancelled) return;
        if (!data.authenticated || data.session?.role !== "STUDENT") {
          router.replace("/student/login");
          return;
        }

        setStudentName(
          sessionStorage.getItem("student_name") ||
            localStorage.getItem("earth_student_persistent_name") ||
            "الطالب"
        );
        setTargetYear(
          sessionStorage.getItem("student_year") ||
            localStorage.getItem("earth_student_persistent_year") ||
            "الفرقة الأولى"
        );
        setSpecialty(
          sessionStorage.getItem("student_specialty") ||
            localStorage.getItem("earth_student_persistent_spec") ||
            "تاريخ وحضارة"
        );
        setNationalId(
          sessionStorage.getItem("student_national_id") ||
            localStorage.getItem("earth_student_persistent_id") ||
            ""
        );

        // جلب التكليف
        const assignCheck = await fetch("/api/student/assignment")
          .then((r) => r.json())
          .catch(() => null);

        if (!assignCheck?.hasChosen || !assignCheck.chosen) {
          router.replace("/student/select-assignment");
          return;
        }

        const a: Assignment = {
          id: assignCheck.chosen.id,
          title: assignCheck.chosen.title,
          description: assignCheck.chosen.description,
          course: assignCheck.chosen.course,
          deadline: assignCheck.chosen.deadline,
          faculty: assignCheck.chosen.faculty,
        };
        setAssignment(a);

        // جلب التسليم
        const subRes = await fetch(`/api/assignments/${a.id}/submissions`)
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null);

        if (subRes?.submission) {
          const text = subRes.submission.text || "";
          const words = text.trim() ? text.trim().split(/\s+/).length : 0;
          setSubmission({
            id: subRes.submission.id,
            status: subRes.submission.status,
            score: subRes.submission.score ?? null,
            notes: subRes.submission.notes ?? null,
            submittedAt: subRes.submission.submittedAt ?? null,
            wordCount: words,
          });
        }

        // جلب التنبيهات
        const alertsRes = await fetch("/api/student/alerts").then((r) => r.ok ? r.json() : { alerts: [] }).catch(() => ({ alerts: [] }));
        setAlerts(alertsRes.alerts || []);

        setLoading(false);
      })
      .catch(() => router.replace("/student/login"));

    return () => { cancelled = true; };
  }, [router]);

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    sessionStorage.clear();
    router.replace("/student/login");
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
        <Loader2 className="w-12 h-12 text-[#1e5eb8] animate-spin" />
        <p className="text-sm font-black text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  const isGraded = submission?.score !== null && submission?.score !== undefined;
  const isSubmitted = submission?.status === "SUBMITTED" || submission?.status === "REVIEWED";
  const isDraft = submission?.status === "DRAFT";

  const statusInfo = !submission
    ? { text: "لم يبدأ بعد", color: "#6b7280", bg: "#f3f4f6", icon: <AlertCircle className="w-5 h-5" /> }
    : isGraded
    ? { text: "تم الرصد", color: "#059669", bg: "#ecfdf5", icon: <Award className="w-5 h-5" /> }
    : isSubmitted
    ? { text: "تم التسليم", color: "#1e5eb8", bg: "#eff6ff", icon: <CheckCircle2 className="w-5 h-5" /> }
    : isDraft
    ? { text: "قيد التحرير", color: "#d97706", bg: "#fffbeb", icon: <Clock className="w-5 h-5" /> }
    : { text: "قيد التحرير", color: "#d97706", bg: "#fffbeb", icon: <Clock className="w-5 h-5" /> };

  return (
    <div className="min-h-screen bg-gray-100 dir-rtl font-sans text-gray-900 flex flex-col">

      {/* HEADER */}
      <header className="bg-[#1e5eb8] text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg flex items-center gap-2 flex-wrap">
              {studentName}
              <span className="text-[10px] bg-white/15 border border-white/20 text-blue-100 px-2.5 py-0.5 rounded-full font-bold">
                {targetYear} — {specialty}
              </span>
            </h1>
            <p className="text-[11px] text-blue-100 mt-0.5 font-mono">الرقم القومي: {nationalId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
<Link
            href="/change-password"
            className="bg-white/15 hover:bg-white/25 border border-white/20 text-white p-2.5 rounded-2xl transition flex items-center justify-center"
            title="تغيير كلمة المرور"
          >
            <KeyRound className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">

        {/* ============ Welcome + Status ============ */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 shadow-sm">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <p className="text-xs font-black text-gray-400 mb-1">مرحباً بك</p>
              <h2 className="text-2xl font-black text-gray-900 mb-2">{studentName}</h2>
              <p className="text-sm font-bold text-gray-500 leading-relaxed">
                هذه لوحتك الأكاديمية. من هنا تتابع بحثك وتفتح المحرر الأكاديمي.
              </p>
            </div>

            <div
              className="flex items-center gap-3 px-5 py-4 rounded-2xl border-2 min-w-[180px]"
              style={{ background: statusInfo.bg, borderColor: statusInfo.color + "40" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                style={{ background: statusInfo.color }}
              >
                {statusInfo.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500">حالة البحث</p>
                <p className="text-base font-black" style={{ color: statusInfo.color }}>{statusInfo.text}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ Assignment Card ============ */}
        {assignment && (
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 mb-5 border-b-2 border-gray-100">
              <BookOpen className="w-5 h-5 text-[#1e5eb8]" />
              <h3 className="font-black text-base text-gray-900">المادة المختارة</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <InfoRow
                  icon={<BookOpen className="w-4 h-4" />}
                  label="المقرر"
                  value={assignment.course}
                />
                <InfoRow
                  icon={<FileText className="w-4 h-4" />}
                  label="عنوان التكليف"
                  value={assignment.title}
                />
                <InfoRow
                  icon={<User className="w-4 h-4" />}
                  label="أستاذ المادة"
                  value={`${assignment.faculty?.facultyProfile?.academicTitle || ""} ${assignment.faculty?.facultyProfile?.fullName || "عضو هيئة التدريس"}`.trim()}
                />
              </div>

              <div className="space-y-4">
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="آخر موعد للتسليم"
                  value={assignment.deadline ? new Date(assignment.deadline).toLocaleString("ar-EG") : "غير محدد"}
                />
                <InfoRow
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="عدد الكلمات"
                  value={submission ? `${submission.wordCount.toLocaleString("ar-EG")} كلمة` : "—"}
                />
                {submission?.submittedAt && (
                  <InfoRow
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label="تاريخ التسليم"
                    value={new Date(submission.submittedAt).toLocaleString("ar-EG")}
                  />
                )}
              </div>
            </div>

            {assignment.description && (
              <div className="mt-5 p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl">
                <p className="text-[10px] font-black text-[#1e5eb8] mb-1">وصف التكليف</p>
                <p className="text-sm font-bold text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {assignment.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============ Voice from Faculty ============ */}
        {assignment && (
          <VoicePlayer assignmentId={assignment.id} />
        )}

        {/* ============ Grade & Notes (if graded) ============ */}
        {isGraded && submission && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 text-white shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5" />
                <span className="text-xs font-black">الدرجة المرصودة</span>
              </div>
              <p className="text-6xl font-black">{submission.score}</p>
              <p className="text-xs font-bold opacity-90 mt-1">من 20</p>
            </div>

            {submission.notes && (
              <div className="bg-white rounded-3xl border-2 border-amber-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-amber-700" />
                  <span className="text-xs font-black text-amber-700">ملاحظات أستاذ المادة</span>
                </div>
                <p className="text-sm font-bold text-gray-800 leading-relaxed">{submission.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* ============ Main Action Button ============ */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-[#1e5eb8] rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
              <FileEdit className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-black text-xl text-gray-900 mb-2">المحرر الأكاديمي</h3>
            <p className="text-sm font-bold text-gray-500 max-w-lg mx-auto leading-relaxed">
              {isSubmitted
                ? "تم تسليم بحثك — يمكنك عرضه بصيغة نهائية"
                : isDraft
                ? "استأنف كتابة بحثك من حيث توقفت"
                : "ابدأ كتابة بحثك العلمي في بيئة أكاديمية متكاملة"}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/student/word-editor"
              className="bg-[#1e5eb8] hover:bg-[#1650a0] text-white px-8 py-4 rounded-2xl text-base font-black flex items-center gap-3 transition shadow-lg shadow-blue-500/30"
            >
              {isSubmitted ? <Eye className="w-5 h-5" /> : <FileEdit className="w-5 h-5" />}
              {isSubmitted ? "عرض البحث" : isDraft ? "استكمال البحث" : "افتح المحرر الأكاديمي"}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {isSubmitted && submission && (
            <div className="mt-6 pt-6 border-t-2 border-gray-100 flex items-center justify-center gap-3 text-xs font-black text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
              <span>تم توثيق بحثك في منظومة EARTH بتاريخ {new Date(submission.submittedAt || "").toLocaleDateString("ar-EG")}</span>
            </div>
          )}
        </div>

        {/* ============ Info Note ============ */}
        {!isSubmitted && (
          <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#1e5eb8] flex-shrink-0 mt-0.5" />
            <div className="text-xs font-bold text-[#1e5eb8] leading-relaxed">
              <p className="font-black text-sm mb-1">ملاحظات مهمة</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>النسخ واللصق محظور تماماً — يُسجَّل في سجل النشاط</li>
                <li>احفظ مسودتك بانتظام (بدون شروط)</li>
                <li>التسليم النهائي نهائي — لا يمكن التعديل بعده</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Floating Alert */}
      {alerts.length > 0 && (
        <FloatingAlert
          items={alerts.map((a) => ({ ...a, icon: a.type === "voice" ? <Mic className="w-5 h-5" /> : <AlertIcon className="w-5 h-5" /> }))}
          variant="floating"
          position="top-left"
        />
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-gray-400">{label}</p>
        <p className="text-sm font-black text-gray-900 truncate" title={value}>{value}</p>
      </div>
    </div>
  );
}
