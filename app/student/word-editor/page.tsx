"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, ArrowRight, Save, Send, Loader2,
  FileText, CheckCircle2, AlertTriangle, BookOpen, User,
  Clock, FileDown,
} from "lucide-react";
import dynamic from "next/dynamic";
import { EditorToolbar, useWordEditor } from "@/components/WordEditor";
import { EditorContent } from "@tiptap/react";

const WordEditorShell = dynamic(() => import("@/components/WordEditor"), { ssr: false });

interface Assignment {
  id: string;
  title: string;
  description: string;
  course: string;
  faculty: { facultyProfile: { fullName: string; academicTitle: string | null } | null } | null;
}

export default function WordEditorPage() {
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);

  const editor = useWordEditor({
    content: "",
    onChange: setHtmlContent,
    editable: !isSubmitted,
    placeholder: "ابدأ كتابة بحثك هنا...",
  });

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
        setStudentName(sessionStorage.getItem("student_name") || "الطالب");

        // جلب التكليف المختار
        const assignRes = await fetch("/api/student/assignment").then((r) => r.json()).catch(() => null);
        if (!assignRes?.hasChosen || !assignRes.chosen) {
          router.replace("/student/select-assignment");
          return;
        }

        const chosen: Assignment = {
          id: assignRes.chosen.id,
          title: assignRes.chosen.title,
          description: assignRes.chosen.description,
          course: assignRes.chosen.course,
          faculty: assignRes.chosen.faculty,
        };
        setAssignment(chosen);

        // جلب التسليم الحالي إن وُجد
        const subRes = await fetch(`/api/assignments/${chosen.id}/submissions`).then((r) => r.ok ? r.json() : null).catch(() => null);
        if (subRes?.submission) {
          setExistingId(subRes.submission.id);
          setTitle(subRes.submission.defenseAnswer || chosen.title);
          const content = subRes.submission.htmlContent || `<p>${subRes.submission.text || ""}</p>`;
          setHtmlContent(content);
          if (subRes.submission.status === "SUBMITTED" || subRes.submission.status === "REVIEWED") {
            setIsSubmitted(true);
          }
          // نحمل المحتوى في المحرر
          if (editor) {
            setTimeout(() => editor.commands.setContent(content), 100);
          }
        } else {
          setTitle(chosen.title);
        }

        setLoading(false);
      })
      .catch(() => router.replace("/student/login"));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleSaveDraft() {
    if (!assignment) return;
    setSaving(true);
    setError("");
    try {
      const plainText = htmlContent.replace(/<[^>]+>/g, "").trim();
      const res = await fetch(`/api/assignments/${assignment.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: plainText,
          htmlContent,
          defenseAnswer: title,
          pasteAttempts: 0,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error || "تعذر الحفظ");
      }
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!assignment) return;
    const plainText = htmlContent.replace(/<[^>]+>/g, "").trim();
    if (!title.trim() || plainText.length < 50) {
      setError("يرجى كتابة عنوان البحث ومحتوى لا يقل عن 50 حرفاً");
      return;
    }
    if (!confirm("هل أنت متأكد من تسليم البحث نهائياً؟ سيتم توليد PDF ولن تتمكن من التعديل.")) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/assignments/${assignment.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: plainText,
          htmlContent,
          defenseAnswer: title,
          pasteAttempts: 0,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error || "تعذر التسليم");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setIsSubmitted(true);
      setTimeout(() => router.replace("/student"), 2500);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
        <Loader2 className="w-12 h-12 text-[#1e5eb8] animate-spin" />
        <p className="text-sm font-black text-gray-600">جاري تحميل المحرر...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-30 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1e5eb8] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">محرر Word الأكاديمي</p>
              <p className="text-[10px] text-gray-500 font-bold">{studentName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSubmitted && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ مسودة
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#1e5eb8] hover:bg-[#1650a0] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                تسليم البحث (PDF)
              </button>
            </>
          )}
          {isSubmitted && existingId && (
            <a
              href={`/api/submissions/${existingId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition"
            >
              <FileDown className="w-4 h-4" /> عرض / تحميل PDF
            </a>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 space-y-5">
        {/* Info Bar */}
        {assignment && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCell icon={<BookOpen className="w-4 h-4" />} label="المادة" value={assignment.course} />
            <InfoCell icon={<FileText className="w-4 h-4" />} label="التكليف" value={assignment.title} />
            <InfoCell
              icon={<User className="w-4 h-4" />}
              label="أستاذ المادة"
              value={assignment.faculty?.facultyProfile?.fullName ?? "—"}
            />
            <InfoCell
              icon={<Clock className="w-4 h-4" />}
              label="الحالة"
              value={isSubmitted ? "تم التسليم" : "قيد التحرير"}
              valueColor={isSubmitted ? "#059669" : "#d97706"}
            />
          </div>
        )}

        {/* Errors / Success */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-bold text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-black text-emerald-800">تم تسليم البحث بنجاح!</p>
              <p className="text-xs font-bold text-emerald-700 mt-0.5">سيتم توجيهك للوحة الطالب خلال لحظات...</p>
            </div>
          </div>
        )}

        {/* Title input */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
          <label className="block text-xs font-black text-gray-700 mb-2">عنوان البحث</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitted}
            placeholder="اكتب عنوان البحث هنا..."
            className="w-full p-4 border-2 border-gray-300 rounded-xl text-base font-bold bg-gray-50 outline-none focus:border-[#1e5eb8] focus:bg-white transition disabled:opacity-60"
          />
        </div>

        {/* Editor */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
          {!isSubmitted && <EditorToolbar editor={editor} />}
          <div
            className="p-12 min-h-[800px] bg-white"
            style={{
              fontFamily: "'Amiri', 'Traditional Arabic', serif",
              fontSize: "18px",
              lineHeight: 2,
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Info note */}
        {!isSubmitted && (
          <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-[#1e5eb8] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-[#1e5eb8]">نصائح للكتابة الأكاديمية</p>
              <ul className="text-xs font-bold text-[#1e5eb8] mt-2 space-y-1 list-disc list-inside">
                <li>استخدم عناوين (H1, H2) لتنظيم البحث</li>
                <li>النسخ واللصق خارج المنظومة قد يُسجَّل ضدك</li>
                <li>احفظ مسودة قبل التسليم النهائي</li>
                <li>سيتم توليد PDF تلقائياً عند التسليم</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoCell({ icon, label, value, valueColor = "#111827" }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-400">{label}</p>
        <p className="text-sm font-black truncate" style={{ color: valueColor }} title={value}>{value}</p>
      </div>
    </div>
  );
}
