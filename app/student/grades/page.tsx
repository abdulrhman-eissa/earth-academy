"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, ArrowRight, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface GradeRow {
  id: string;
  text: string;
  score: number | null;
  notes: string | null;
  status: string;
  submittedAt: string;
  assignment: { title: string; course: string; deadline: string | null };
}

function scoreToGrade(score: number): { letter: string; label: string; color: string } {
  if (score >= 90) return { letter: "A", label: "ممتاز", color: "bg-green-100 text-green-800" };
  if (score >= 80) return { letter: "B", label: "جيد جداً", color: "bg-blue-100 text-blue-800" };
  if (score >= 70) return { letter: "C", label: "جيد", color: "bg-indigo-100 text-indigo-800" };
  if (score >= 60) return { letter: "D", label: "مقبول", color: "bg-amber-100 text-amber-800" };
  return { letter: "F", label: "راسب", color: "bg-red-100 text-red-800" };
}

export default function StudentGradesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "STUDENT" }) })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.authenticated || data.session?.role !== "STUDENT") {
          router.replace("/student/login");
          return;
        }
        return fetch("/api/submissions/me")
          .then((r) => r.json())
          .then((res: { submissions?: GradeRow[] }) => setRows(res.submissions ?? []))
          .finally(() => setLoading(false));
      })
      .catch(() => router.replace("/student/login"));
    return () => { cancelled = true; };
  }, [router]);

  const totalScore = rows.filter((r) => r.score !== null).reduce((sum, r) => sum + (r.score || 0), 0);
  const gradedCount = rows.filter((r) => r.score !== null).length;
  const average = gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0;

  return (
    <div className="min-h-screen bg-gray-100 dir-rtl font-sans text-right text-gray-900">
      <header className="bg-emerald-900 text-white px-8 py-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-800 rounded-2xl flex items-center justify-center">
            <Award className="w-7 h-7 text-emerald-200" />
          </div>
          <div>
            <h1 className="font-bold text-2xl">سجل الدرجات الأكاديمية</h1>
            <p className="text-xs text-emerald-200">منظومة EARTH — قسم التاريخ والحضارة</p>
          </div>
        </div>
        <Link href="/student" className="bg-emerald-700 hover:bg-emerald-600 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
          <ArrowRight className="w-4 h-4" /> العودة للمحرر
        </Link>
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">عدد الأبحاث المسلّمة</p>
            <p className="text-3xl font-extrabold text-emerald-900">{rows.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">عدد الأبحاث المرصودة</p>
            <p className="text-3xl font-extrabold text-emerald-900">{gradedCount}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">المتوسط العام</p>
            <p className="text-3xl font-extrabold text-emerald-900">{average} / 100</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500 font-bold">جاري التحميل...</div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
            <AlertCircle className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-600">لا يوجد أبحاث مسلّمة بعد</p>
            <Link href="/student" className="inline-block mt-5 bg-emerald-900 text-white px-6 py-3 rounded-2xl font-bold text-sm">
              ابدأ بإعداد بحثك
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {rows.map((row) => {
              const graded = row.score !== null;
              const g = graded ? scoreToGrade(row.score!) : null;
              return (
                <div key={row.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b pb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-11 h-11 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-extrabold text-lg text-gray-900">{row.assignment.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          المقرر: {row.assignment.course} — تم التسليم: {new Date(row.submittedAt).toLocaleString("ar-EG")}
                        </p>
                      </div>
                    </div>
                    {graded ? (
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-2xl text-xs font-extrabold ${g!.color}`}>
                          {g!.letter} — {g!.label}
                        </span>
                        <span className="text-3xl font-extrabold text-emerald-900">{row.score}</span>
                        <span className="text-xs text-gray-500 font-bold">/100</span>
                      </div>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> قيد المراجعة
                      </span>
                    )}
                  </div>

                  {row.notes && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                      <p className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> ملاحظات أستاذ المادة:
                      </p>
                      <p className="text-sm text-gray-800 leading-relaxed">{row.notes}</p>
                    </div>
                  )}

                  <details className="bg-gray-50 rounded-2xl border border-gray-200">
                    <summary className="cursor-pointer p-4 text-xs font-bold text-gray-700">
                      عرض نص البحث المسلّم
                    </summary>
                    <div className="px-4 pb-4 whitespace-pre-wrap text-sm leading-loose text-gray-800">
                      {row.text}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
