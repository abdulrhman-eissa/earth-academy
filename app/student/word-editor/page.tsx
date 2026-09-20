"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Save, Send, Loader2, FileText, CheckCircle2,
  AlertTriangle, BookOpen, User, Clock, Activity,
  ShieldAlert, Eye,
} from "lucide-react";
import { EditorContent } from "@tiptap/react";
import {
  useWordEditor, EditorToolbar, EditorStatsBar,
  type EditorStats, type BlockReason,
} from "@/components/WordEditor";

interface Assignment {
  id: string;
  title: string;
  description: string;
  course: string;
  faculty: { facultyProfile: { fullName: string; academicTitle: string | null } | null } | null;
}

interface ActivityEntry {
  at: string;
  type: string;
  details?: string;
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
  const [stats, setStats] = useState<EditorStats>({ words: 0, chars: 0, pages: 1 });
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [lastSaveText, setLastSaveText] = useState("");
  const [showRunPanel, setShowRunPanel] = useState(false);

  const addActivity = useCallback((type: string, details?: string) => {
    setActivityLog((prev) => [
      { at: new Date().toISOString(), type, details },
      ...prev,
    ].slice(0, 100));
  }, []);

  const blockedCount = activityLog.filter((e) =>
    e.type === "BLOCK_PASTE" || e.type === "BLOCK_CUT" || e.type === "BLOCK_DROP"
  ).length;

  const handleBlockAttempt = useCallback((reason: BlockReason) => {
    const labels: Record<BlockReason, string> = {
      paste: "محاولة لصق (Ctrl+V)",
      cut: "محاولة قص (Ctrl+X)",
      drop: "محاولة سحب وإفلات",
    };
    addActivity(
      reason === "paste" ? "BLOCK_PASTE" : reason === "cut" ? "BLOCK_CUT" : "BLOCK_DROP",
      `⚠️ ${labels[reason]} — تم الحظر`
    );
  }, [addActivity]);

  const editor = useWordEditor({
    content: "",
    onChange: setHtmlContent,
    editable: !isSubmitted,
    placeholder: "ابدأ كتابة بحثك هنا...",
    onBlockAttempt: handleBlockAttempt,
    onStats: setStats,
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

        const subRes = await fetch(`/api/assignments/${chosen.id}/submissions`)
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null);

        if (subRes?.submission) {
          setTitle(subRes.submission.defenseAnswer || chosen.title);
          const content = subRes.submission.htmlContent || `<p>${subRes.submission.text || ""}</p>`;
          setHtmlContent(content);
          if (subRes.submission.activityLog && Array.isArray(subRes.submission.activityLog)) {
            setActivityLog(subRes.submission.activityLog as ActivityEntry[]);
          }
          if (subRes.submission.status === "SUBMITTED" || subRes.submission.status === "REVIEWED") {
            setIsSubmitted(true);
          }
          if (editor) {
            setTimeout(() => editor.commands.setContent(content), 100);
          }
        } else {
          setTitle(chosen.title);
          addActivity("OPEN_EDITOR", "فتح المحرر لأول مرة");
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
    const plainText = htmlContent.replace(/<[^>]+>/g, "").trim();

    const newActivity: ActivityEntry[] = [
      { at: new Date().toISOString(), type: "SAVE_DRAFT", details: `حفظ مسودة (${stats.words} كلمة)` },
      ...activityLog,
    ].slice(0, 100);

    try {
      const res = await fetch(`/api/assignments/${assignment.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: plainText,
          htmlContent,
          defenseAnswer: title,
          pasteAttempts: blockedCount,
          action: "draft",
          activityLog: newActivity,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error || "تعذر الحفظ");
      } else {
        setActivityLog(newActivity);
        setLastSaveText(`آخر حفظ: ${new Date().toLocaleTimeString("ar-EG")}`);
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
    if (!confirm("هل أنت متأكد من تسليم البحث نهائياً؟ لن تتمكن من التعديل بعد الاعتماد.")) return;

    setSubmitting(true);
    setError("");

    const newActivity: ActivityEntry[] = [
      { at: new Date().toISOString(), type: "SUBMIT_FINAL", details: `التسليم النهائي (${stats.words} كلمة، ${stats.pages} صفحة)` },
      ...activityLog,
    ].slice(0, 100);

    try {
      const res = await fetch(`/api/assignments/${assignment.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: plainText,
          htmlContent,
          defenseAnswer: title,
          pasteAttempts: blockedCount,
          action: "submit",
          activityLog: newActivity,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error || "تعذر التسليم");
        setSubmitting(false);
        return;
      }
      setActivityLog(newActivity);
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
      {/* ============ Top Bar ============ */}
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
              <p className="font-black text-gray-900 text-sm">المحرر الأكاديمي</p>
              <p className="text-[10px] text-gray-500 font-bold">{studentName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRunPanel((v) => !v)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition border-2 ${
              showRunPanel ? "bg-[#1e5eb8] text-white border-[#1e5eb8]" : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
            }`}
            title="سجل النشاط"
          >
            <Activity className="w-4 h-4" />
            سجل النشاط
            {blockedCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{blockedCount}</span>
            )}
          </button>

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
                تسليم نهائي
              </button>
            </>
          )}
        </div>
      </header>

      {/* ============ Main ============ */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-5 space-y-4">

        {/* Info Bar */}
        {assignment && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCell icon={<BookOpen className="w-4 h-4" />} label="المادة" value={assignment.course} />
            <InfoCell icon={<FileText className="w-4 h-4" />} label="التكليف" value={assignment.title} />
            <InfoCell icon={<User className="w-4 h-4" />} label="أستاذ المادة" value={assignment.faculty?.facultyProfile?.fullName ?? "—"} />
            <InfoCell icon={<Clock className="w-4 h-4" />} label="الحالة" value={isSubmitted ? "تم التسليم" : "قيد التحرير"} valueColor={isSubmitted ? "#059669" : "#d97706"} />
          </div>
        )}

        {/* Alerts */}
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
              <p className="text-xs font-bold text-emerald-700 mt-0.5">سيتم توجيهك للوحة الطالب...</p>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
          <label className="block text-xs font-black text-gray-700 mb-2">عنوان البحث</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitted}
            className="w-full p-3.5 border-2 border-gray-300 rounded-xl text-base font-bold bg-gray-50 outline-none focus:border-[#1e5eb8] focus:bg-white transition disabled:opacity-60"
          />
        </div>

        {/* Editor + Run Panel */}
        <div className="flex gap-4">
          {/* Editor */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl overflow-hidden border-2 border-gray-300 flex flex-col">
              {!isSubmitted && <EditorToolbar editor={editor} />}
              <div
                className="overflow-auto"
                style={{
                  maxHeight: "calc(100vh - 260px)",
                  background: "#525659",
                  padding: "20px 0",
                }}
              >
                <div
                  className="bg-white mx-auto"
                  style={{
                    width: "100%",
                    minHeight: "29.7cm",
                    padding: "1.5cm 1cm",
                    boxSizing: "border-box",
                    fontFamily: "'Amiri', 'Traditional Arabic', serif",
                    fontSize: "18px",
                    lineHeight: 2,
                    color: "#111827",
                    backgroundImage: "repeating-linear-gradient(to bottom, #ffffff 0, #ffffff calc(29.7cm - 4px), #cbd5e1 calc(29.7cm - 4px), #cbd5e1 calc(29.7cm - 2px), #ffffff calc(29.7cm - 2px), #ffffff 29.7cm)",
                    backgroundAttachment: "local",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  }}
                >
                  <EditorContent editor={editor} />
                </div>
              </div>
              <EditorStatsBar stats={stats} lastSaveText={lastSaveText} blockedCount={blockedCount} />
            </div>
          </div>

          {/* Run Panel */}
          {showRunPanel && (
            <aside className="w-80 flex-shrink-0">
              <div className="bg-gray-900 text-white rounded-2xl border-2 border-gray-800 overflow-hidden sticky top-24">
                <div className="p-4 border-b-2 border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="font-black text-sm">سجل النشاط</h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-gray-800 text-gray-300">
                    {activityLog.length} حدث
                  </span>
                </div>

                <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                  {activityLog.length === 0 ? (
                    <p className="text-xs font-bold text-gray-500 text-center py-6">
                      لا يوجد نشاط بعد
                    </p>
                  ) : (
                    activityLog.map((log, i) => (
                      <ActivityItem key={i} log={log} />
                    ))
                  )}
                </div>

                <div className="p-3 border-t-2 border-gray-800 bg-gray-950">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-500">محاولات محظورة:</span>
                    <span className={blockedCount > 0 ? "text-red-400 font-black" : "text-emerald-400 font-black"}>
                      {blockedCount}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Info note */}
        {!isSubmitted && (
          <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#1e5eb8] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-[#1e5eb8]">تنبيهات النزاهة الأكاديمية</p>
              <ul className="text-xs font-bold text-[#1e5eb8] mt-2 space-y-1 list-disc list-inside">
                <li>النسخ واللصق محظور تماماً — يُسجَّل في سجل النشاط</li>
                <li>يجب كتابة البحث يدوياً داخل المنظومة</li>
                <li>احفظ مسودتك بانتظام (بدون شروط)</li>
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

function ActivityItem({ log }: { log: ActivityEntry }) {
  const time = new Date(log.at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const isBlock = log.type.startsWith("BLOCK_");
  const isSubmit = log.type === "SUBMIT_FINAL";
  const isSave = log.type === "SAVE_DRAFT";

  const color = isBlock ? "#fca5a5" : isSubmit ? "#86efac" : isSave ? "#93c5fd" : "#a1a1aa";
  const icon = isBlock ? "🚨" : isSubmit ? "✅" : isSave ? "💾" : "•";

  return (
    <div className="bg-gray-950/50 rounded-xl p-2.5 border border-gray-800">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-mono" style={{ color }}>
          {icon} {log.type}
        </span>
        <span className="text-[9px] font-mono text-gray-600">{time}</span>
      </div>
      {log.details && (
        <p className="text-[10px] font-bold leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
          {log.details}
        </p>
      )}
    </div>
  );
}
