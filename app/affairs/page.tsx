"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Users, GraduationCap, BookOpen, Award,
  TrendingUp, Clock, LogOut, Printer, Download, ArrowRight,
  Loader2, BarChart3, CheckCircle2,
  KeyRound,
} from "lucide-react";
import FloatingAlert from "@/components/FloatingAlert";
import Link from "next/link";

interface Stats {
  totalStudents: number;
  totalFaculty: number;
  totalAssignments: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
  average: number;
  completionRate: number;
  levelBreakdown: { level: string; count: number }[];
  courseBreakdown: { id: string; course: string; faculty: string; submissions: number }[];
}

const LEVEL_LABELS: Record<string, string> = {
  LEVEL_1: "الفرقة الأولى",
  LEVEL_2: "الفرقة الثانية",
  LEVEL_3: "الفرقة الثالثة",
  LEVEL_4: "الفرقة الرابعة",
};

export default function AffairsDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [affairsName, setAffairsName] = useState("شؤون الطلاب");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "AFFAIRS" }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (cancelled) return;
        if (!data.authenticated || (data.session?.role !== "AFFAIRS" && data.session?.role !== "ADMIN")) {
          router.replace("/affairs/login");
          return;
        }
        setAffairsName(data.session?.role === "ADMIN" ? "العمادة" : "شؤون الطلاب");
        const res = await fetch("/api/affairs/stats").then((r) => (r.ok ? r.json() : Promise.reject())).catch(() => null);
        if (!cancelled) {
          setStats(res);
          setLoading(false);
        }
      })
      .catch(() => router.replace("/affairs/login"));
    return () => { cancelled = true; };
  }, [router]);

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.href = "/affairs/login";
  }

  return (
    <div className="min-h-screen bg-gray-100 dir-rtl font-sans text-right text-gray-900">
      {/* Header */}
      <header className="bg-[#1e5eb8] text-white px-8 py-5 flex items-center justify-between shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-blue-100" />
          </div>
          <div>
            <h1 className="font-bold text-xl flex items-center gap-2">
              لوحة {affairsName}
              <span className="text-[10px] bg-[#1650a0] text-blue-50 px-2 py-0.5 rounded-full font-bold">EARTH</span>
            </h1>
            <p className="text-xs text-blue-100 mt-0.5">نظرة شاملة على المنظومة الأكاديمية</p>
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
          <Link
            href="/affairs/grades"
            className="bg-[#1e5eb8] hover:bg-[#1e5eb8] text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition"
          >
            <Award className="w-4 h-4" /> سجل الدرجات
          </Link>
          <FloatingAlert
            variant="bell"
            items={[
              {
                type: "welcome",
                label: "لوحة شؤون الطلاب والعمادة — متابعة شاملة",
                color: "blue" as const,
                priority: 1,
              },
              ...(stats && stats.pendingSubmissions > 0 ? [{
                type: "pending",
                label: stats.pendingSubmissions + " تسليم قيد المراجعة",
                color: "amber" as const,
                priority: 2,
              }] : []),
              ...(stats && stats.totalStudents > 0 ? [{
                type: "students",
                label: stats.totalStudents + " طالب مسجّل في المنظومة",
                color: "emerald" as const,
                priority: 3,
              }] : []),
            ]}
          />
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-2xl transition"
            title="خروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-8 max-w-[1920px] mx-auto space-y-6">
        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-12 h-12 text-[#1e5eb8] animate-spin" />
          </div>
        ) : !stats ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
            <p className="text-gray-500 font-bold">تعذر تحميل الإحصائيات</p>
          </div>
        ) : (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                label="إجمالي الطلاب"
                value={stats.totalStudents}
                sub={`${stats.totalFaculty} عضو هيئة تدريس`}
                color="emerald"
              />
              <StatCard
                icon={<BookOpen className="w-6 h-6" />}
                label="المواد المنشورة"
                value={stats.totalAssignments}
                sub="منشورة للطلاب"
                color="blue"
              />
              <StatCard
                icon={<CheckCircle2 className="w-6 h-6" />}
                label="أبحاث مسلّمة"
                value={stats.totalSubmissions}
                sub={`${stats.gradedSubmissions} مرصودة`}
                color="indigo"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="المتوسط العام"
                value={stats.average}
                sub="من 100"
                color="amber"
              />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                  <BarChart3 className="w-5 h-5 text-[#1e5eb8]" />
                  <h2 className="font-bold text-gray-900">توزيع الطلاب حسب الفرقة</h2>
                </div>
                <div className="space-y-3">
                  {stats.levelBreakdown.length === 0 ? (
                    <p className="text-sm text-gray-400 font-bold text-center py-6">لا توجد بيانات</p>
                  ) : (
                    stats.levelBreakdown.map((l) => {
                      const pct = stats.totalStudents > 0 ? Math.round((l.count / stats.totalStudents) * 100) : 0;
                      return (
                        <div key={l.level}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-gray-700">{LEVEL_LABELS[l.level] ?? l.level}</span>
                            <span className="text-sm font-bold text-gray-900">{l.count} <span className="text-xs text-gray-400">({pct}%)</span></span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1e5eb8] rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                  <Award className="w-5 h-5 text-[#1e5eb8]" />
                  <h2 className="font-bold text-gray-900">حالة الرصد</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#1e5eb8]" />
                      <span className="font-bold text-[#1e5eb8]">تم الرصد</span>
                    </div>
                    <span className="text-2xl font-extrabold text-[#1e5eb8]">{stats.gradedSubmissions}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-700" />
                      <span className="font-bold text-amber-900">قيد المراجعة</span>
                    </div>
                    <span className="text-2xl font-extrabold text-amber-900">{stats.pendingSubmissions}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-700" />
                      <span className="font-bold text-blue-900">نسبة الإنجاز</span>
                    </div>
                    <span className="text-2xl font-extrabold text-blue-900">{stats.completionRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course breakdown */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-[#1e5eb8]" />
                  <h2 className="font-bold text-gray-900">المواد المنشورة وأساتذتها</h2>
                </div>
                <span className="text-xs text-gray-400 font-bold">{stats.courseBreakdown.length} مادة</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-xs text-gray-500 font-bold">
                      <th className="p-4">#</th>
                      <th className="p-4">اسم المادة</th>
                      <th className="p-4">أستاذ المادة</th>
                      <th className="p-4 text-center">عدد التسليمات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.courseBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-gray-400 font-bold">
                          لا توجد مواد منشورة
                        </td>
                      </tr>
                    ) : (
                      stats.courseBreakdown.map((c, i) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="p-4 text-gray-400 font-mono">{i + 1}</td>
                          <td className="p-4 font-bold text-gray-900">{c.course}</td>
                          <td className="p-4 text-gray-600">{c.faculty}</td>
                          <td className="p-4 text-center font-extrabold text-[#1e5eb8]">{c.submissions}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: number; sub: string; color: "emerald" | "blue" | "indigo" | "amber" }) {
  const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
    emerald: { bg: "bg-white", text: "text-[#1e5eb8]", iconBg: "bg-blue-100 text-[#1e5eb8]" },
    blue: { bg: "bg-white", text: "text-blue-900", iconBg: "bg-blue-100 text-blue-700" },
    indigo: { bg: "bg-white", text: "text-indigo-900", iconBg: "bg-indigo-100 text-indigo-700" },
    amber: { bg: "bg-white", text: "text-amber-900", iconBg: "bg-amber-100 text-amber-700" },
  };
  const c = colors[color];
  return (
    <div className={`${c.bg} rounded-3xl border border-gray-200 p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${c.iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-xs text-gray-500 font-bold mb-1">{label}</p>
      <p className={`text-3xl font-extrabold ${c.text}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
