"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserCheck, LogOut, Download, Search, Eye, X, FileText,
  Plus, BookOpen, Save, TrendingUp, Clock, CheckCircle2, Loader2,
  KeyRound,
} from "lucide-react";
import VoiceRecorder from "@/components/VoiceRecorder";
import FloatingAlert from "@/components/FloatingAlert";

interface Assignment {
  id: string;
  title: string;
  description: string;
  course: string;
  deadline: string | null;
  isPublished: boolean;
  status: string;
  _count?: { submissions: number };
}

interface SubmissionRow {
  id: string;
  text: string;
  score: number | null;
  notes: string | null;
  status: string;
  submittedAt: string;
  student: {
    email: string;
    studentProfile: { fullName: string; studentCode: string; academicLevel: string } | null;
  };
}

const LEVEL_LABELS: Record<string, string> = {
  LEVEL_1: "الفرقة الأولى",
  LEVEL_2: "الفرقة الثانية",
  LEVEL_3: "الفرقة الثالثة",
  LEVEL_4: "الفرقة الرابعة",
};

export default function FacultyDashboard() {
  const router = useRouter();

  const [doctorName, setDoctorName] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("الكل");
  const [selectedStudent, setSelectedStudent] = useState<SubmissionRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMin, setNewMin] = useState(3);
  const [newMax, setNewMax] = useState(10);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "FACULTY" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.authenticated || data.session?.role !== "FACULTY") {
          router.replace("/faculty/login");
          return;
        }
        const name = sessionStorage.getItem("faculty_name") || "عضو هيئة التدريس";
        setDoctorName(name);
        void loadAssignments(true);
      })
      .catch(() => router.replace("/faculty/login"));
    return () => { cancelled = true; };
  }, [router]);

  async function loadAssignments(selectFirst = false) {
    const res = await fetch("/api/assignments");
    if (!res.ok) return;
    const data = (await res.json()) as { assignments: Assignment[] };
    setAssignments(data.assignments);
    if (selectFirst && data.assignments[0]) setSelectedId(data.assignments[0].id);
    else if (data.assignments.length > 0 && !data.assignments.find((a) => a.id === selectedId)) {
      setSelectedId(data.assignments[0].id);
    }
  }

  useEffect(() => {
    if (!selectedId) { setSubmissions([]); return; }
    let cancelled = false;
    setLoadingSubs(true);
    fetch(`/api/submissions?assignmentId=${selectedId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { submissions: SubmissionRow[] }) => {
        if (!cancelled) setSubmissions(data.submissions);
      })
      .catch(() => { if (!cancelled) setSubmissions([]); })
      .finally(() => { if (!cancelled) setLoadingSubs(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const selectedAssignment = assignments.find((a) => a.id === selectedId);
  const pendingCount = submissions.filter((s) => s.score === null).length;
  const gradedCount = submissions.filter((s) => s.score !== null).length;
  const averageScore = gradedCount > 0
    ? Math.round(submissions.filter((s) => s.score !== null).reduce((sum, s) => sum + (s.score ?? 0), 0) / gradedCount)
    : 0;

  const filteredSubmissions = submissions.filter((s) => {
    const name = s.student.studentProfile?.fullName ?? s.student.email;
    const code = s.student.studentProfile?.studentCode ?? "";
    const matchSearch = name.includes(searchTerm) || code.includes(searchTerm);
    const level = s.student.studentProfile?.academicLevel ?? "";
    const matchYear = selectedYear === "الكل" || level === selectedYear;
    return matchSearch && matchYear;
  });

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newCourse.trim()) {
      alert("يرجى إدخال اسم المادة والعنوان.");
      return;
    }
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        course: newCourse.trim(),
        description: newDesc.trim() || `بحث في مادة ${newCourse} بين ${newMin} و ${newMax} صفحات.`,
        isPublished: true,
      }),
    });
    if (!res.ok) { alert("تعذر إنشاء المادة."); return; }
    const data = (await res.json()) as { assignment: Assignment };
    setAssignments((prev) => [...prev, data.assignment]);
    setSelectedId(data.assignment.id);
    setShowCreate(false);
    setNewTitle(""); setNewCourse(""); setNewDesc(""); setNewMin(3); setNewMax(10);
  }

  async function handleScoreChange(submissionId: string, score: number | null, notes: string | null) {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, score, notes } : s))
    );
    await fetch(`/api/submissions/${submissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, notes }),
    }).catch(() => undefined);
  }

  function handleExportCSV() {
    if (!selectedAssignment) return;
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += "جامعة الأزهر الشريف - كلية اللغة العربية - قسم التاريخ والحضارة\n";
    csv += `كشف رصد مادة: ${selectedAssignment.course} — أستاذ المادة: ${doctorName}\n\n`;
    csv += "الرقم القومي,اسم الطالب,الفرقة,عنوان البحث,الدرجة,ملاحظات\n";
    submissions.forEach((s) => {
      const name = s.student.studentProfile?.fullName ?? s.student.email;
      const code = s.student.studentProfile?.studentCode ?? s.student.email;
      const level = LEVEL_LABELS[s.student.studentProfile?.academicLevel ?? ""] ?? "غير محدد";
      csv += `"${code}","${name}","${level}","${selectedAssignment.title}","${s.score ?? ""}","${s.notes ?? ""}"\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `كنترول_${selectedAssignment.course.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/faculty/login");
  }

  return (
    <div className="min-h-screen bg-gray-100 dir-rtl font-sans text-right text-gray-900">
      {/* Header */}
      <header className="bg-[#1e5eb8] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center">
            <UserCheck className="w-7 h-7 text-blue-100" />
          </div>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              كنترول {doctorName}
              <span className="text-[10px] bg-[#1650a0] text-blue-50 px-2 py-0.5 rounded-full font-bold">EARTH</span>
            </h1>
            <p className="text-[11px] text-blue-100">لوحة أعضاء هيئة التدريس — كل أستاذ يرى مواده فقط</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
<Link
            href="/change-password"
            className="bg-white/15 hover:bg-white/25 border border-white/20 text-white p-2.5 rounded-2xl transition flex items-center justify-center"
            title="تغيير كلمة المرور"
          >
            <KeyRound className="w-4 h-4" />
          </Link>
          <FloatingAlert
            variant="bell"
            items={pendingCount > 0 ? [{ type: "pending", label: pendingCount + " " + (pendingCount === 1 ? "تسليم محتاج رصد" : "تسليمات محتاجة رصد"), color: "amber" as const, priority: 1 }] : []}
          />
          <button
            onClick={handleExportCSV}
            suppressHydrationWarning
            disabled={!selectedAssignment === true}
            className="bg-[#1e5eb8] hover:bg-[#1650a0] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-2xl transition"
            title="خروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex" style={{ minHeight: "calc(100vh - 80px)" }}>
        {/* Sidebar */}
        <aside className="w-80 bg-white border-l border-gray-200 p-5 space-y-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1e5eb8]" /> موادي الدراسية
            </h2>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-[#1e5eb8] hover:bg-[#1e5eb8] text-white p-2 rounded-xl transition"
              title="إضافة مادة"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {assignments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 font-bold">لم تضف أي مادة بعد</p>
          ) : (
            assignments.map((a) => {
              const active = a.id === selectedId;
              return (
                <button
                  key={a.id}
                  onClick={() => { setSelectedId(a.id); setSearchTerm(""); setSelectedYear("الكل"); }}
                  className={`w-full text-right p-4 rounded-2xl border transition ${
                    active
                      ? "bg-[#1e5eb8] border-emerald-700 shadow-lg text-white"
                      : "bg-gray-50 hover:bg-blue-50 border-gray-200 text-gray-800"
                  }`}
                >
                  <p className={`font-bold text-sm ${active ? "text-white" : "text-gray-900"}`}>{a.course}</p>
                  <p className={`text-xs mt-1 ${active ? "text-blue-50" : "text-gray-500"}`}>{a.title}</p>
                  <p className={`text-[10px] mt-2 ${active ? "text-blue-50" : "text-gray-400"}`}>
                    {a._count?.submissions ?? 0} تسليم
                  </p>
                </button>
              );
            })
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 space-y-5 overflow-x-hidden">
          {!selectedAssignment ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-300 p-16 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">لا توجد مادة مختارة</h3>
              <p className="text-sm text-gray-500 mb-6">
                {assignments.length === 0 ? "ابدأ بإضافة أول مادة دراسية" : "اختر مادة من القائمة الجانبية"}
              </p>
              {assignments.length === 0 && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="bg-[#1e5eb8] hover:bg-[#1e5eb8] text-white px-6 py-3 rounded-2xl font-bold inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> إضافة مادة جديدة
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-bold">إجمالي التسليمات</p>
                    <FileText className="w-4 h-4 text-[#1e5eb8]" />
                  </div>
                  <p className="text-3xl font-extrabold text-gray-900">{submissions.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-bold">قيد الرصد</p>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-3xl font-extrabold text-amber-600">{pendingCount}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-bold">تم رصدها</p>
                    <CheckCircle2 className="w-4 h-4 text-[#1e5eb8]" />
                  </div>
                  <p className="text-3xl font-extrabold text-[#1e5eb8]">{gradedCount}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-bold">المتوسط</p>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-3xl font-extrabold text-blue-700">{averageScore}</p>
                </div>
              </div>

              {/* Assignment info + filters */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">{selectedAssignment.course}</h2>
                    <p className="text-sm text-gray-500 mt-1">{selectedAssignment.title}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    selectedAssignment.isPublished
                      ? "bg-blue-100 text-[#1e5eb8] border border-blue-200"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {selectedAssignment.isPublished ? "منشور" : "مسودة"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3.5 pl-11 border border-gray-200 rounded-2xl text-sm bg-gray-50 text-gray-900 outline-none font-bold focus:border-[#1e5eb8] focus:bg-white transition"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-4" />
                  </div>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="p-3.5 border border-gray-200 rounded-2xl text-sm font-bold bg-gray-50 text-gray-900 outline-none focus:border-[#1e5eb8]"
                  >
                    <option value="الكل">جميع الفرق</option>
                    <option value="LEVEL_1">الفرقة الأولى</option>
                    <option value="LEVEL_2">الفرقة الثانية</option>
                    <option value="LEVEL_3">الفرقة الثالثة</option>
                    <option value="LEVEL_4">الفرقة الرابعة</option>
                  </select>
                </div>
              </div>

              {/* Voice Recorder */}
              <VoiceRecorder assignmentId={selectedId} />

              {/* Table */}
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-[#1e5eb8] text-white">
                      <tr className="text-xs font-bold">
                        <th className="p-4">الرقم القومي</th>
                        <th className="p-4">اسم الطالب</th>
                        <th className="p-4">الفرقة</th>
                        <th className="p-4 text-center">قراءة البحث</th>
                        <th className="p-4 text-center">الدرجة /20</th>
                        <th className="p-4">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingSubs ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center">
                            <Loader2 className="w-8 h-8 text-[#1e5eb8] animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : filteredSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-gray-400 font-bold">
                            {submissions.length === 0
                              ? "لا توجد أبحاث مسلّمة لهذه المادة بعد"
                              : "لا توجد نتائج مطابقة للبحث"}
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((s) => {
                          const name = s.student.studentProfile?.fullName ?? s.student.email;
                          const code = s.student.studentProfile?.studentCode ?? s.student.email;
                          const level = LEVEL_LABELS[s.student.studentProfile?.academicLevel ?? ""] ?? "غير محدد";
                          const graded = s.score !== null;
                          return (
                            <tr key={s.id} className="hover:bg-gray-50 transition">
                              <td className="p-4 font-mono text-gray-700 font-bold">{code}</td>
                              <td className="p-4 font-bold text-gray-900">{name}</td>
                              <td className="p-4 text-gray-600">{level}</td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => { window.location.href = `/view-submission/${s.id}`; }}
                                  className="bg-blue-50 hover:bg-blue-100 text-[#1e5eb8] px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition border border-blue-200"
                                >
                                  <Eye className="w-3.5 h-3.5" /> قراءة
                                </button>
                              </td>
                              <td className="p-4 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={20}
                                  value={s.score ?? ""}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      s.id,
                                      e.target.value === "" ? null : parseInt(e.target.value) || 0,
                                      s.notes
                                    )
                                  }
                                  className={`w-20 p-2.5 border rounded-xl font-bold font-mono text-center outline-none transition ${
                                    graded
                                      ? "bg-blue-50 border-blue-200 text-[#1e5eb8]"
                                      : "bg-gray-50 border-gray-200 text-gray-900 focus:border-[#1e5eb8]"
                                  }`}
                                />
                              </td>
                              <td className="p-4">
                                <input
                                  type="text"
                                  value={s.notes ?? ""}
                                  onChange={(e) => handleScoreChange(s.id, s.score, e.target.value || null)}
                                  className="w-full min-w-[200px] p-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-900 outline-none focus:border-[#1e5eb8] focus:bg-white"
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal: view submission */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white max-w-4xl w-full rounded-3xl p-8 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#1e5eb8]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">مراجعة البحث العلمي</h3>
                  <p className="text-xs text-gray-500">
                    {selectedStudent.student.studentProfile?.fullName ?? selectedStudent.student.email}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-700 p-2 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-4">
              <div className="bg-gray-50 p-6 rounded-2xl whitespace-pre-wrap leading-loose text-gray-800 text-sm border border-gray-200">
                {selectedStudent.text}
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4 text-left">
              <button
                onClick={() => setSelectedStudent(null)}
                className="bg-[#1650a0] hover:bg-[#1e5eb8] text-white font-bold px-8 py-3 rounded-2xl text-sm transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: create assignment */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-xl flex items-center gap-2 text-gray-900">
                <Plus className="w-5 h-5 text-[#1e5eb8]" /> إضافة مادة جديدة
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">* اسم المقرر</label>
                <input
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  required
                  className="w-full p-3.5 border border-gray-200 rounded-2xl text-sm bg-gray-50 text-gray-900 outline-none focus:border-[#1e5eb8] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">* عنوان التكليف</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full p-3.5 border border-gray-200 rounded-2xl text-sm bg-gray-50 text-gray-900 outline-none focus:border-[#1e5eb8] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full p-3.5 border border-gray-200 rounded-2xl text-sm bg-gray-50 text-gray-900 outline-none focus:border-[#1e5eb8] focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">أقل عدد صفحات</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newMin}
                    onChange={(e) => setNewMin(parseInt(e.target.value) || 1)}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl text-sm bg-gray-50 text-gray-900 font-mono outline-none focus:border-[#1e5eb8] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">أقصى عدد صفحات</label>
                  <input
                    type="number"
                    min={newMin}
                    max={20}
                    value={newMax}
                    onChange={(e) => setNewMax(parseInt(e.target.value) || 10)}
                    className="w-full p-3.5 border border-gray-200 rounded-2xl text-sm bg-gray-50 text-gray-900 font-mono outline-none focus:border-[#1e5eb8] focus:bg-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#1e5eb8] hover:bg-[#1e5eb8] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition"
              >
                <Save className="w-5 h-5" /> حفظ ونشر للطلاب
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
