"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award, Search, Download, ArrowRight, TrendingUp, Printer,
  X, Loader2, Filter, FileDown,
} from "lucide-react";
import Link from "next/link";
import { exportElementToPdf, createPrintContainer, removePrintContainer } from "@/lib/pdf-export";

interface GradeRow {
  id: string;
  score: number | null;
  notes: string | null;
  status: string;
  submittedAt: string;
  student: {
    email: string;
    studentProfile: { fullName: string; studentCode: string; academicLevel: string } | null;
  };
  assignment: { title: string; course: string };
}

const LEVEL_LABELS: Record<string, string> = {
  LEVEL_1: "الفرقة الأولى",
  LEVEL_2: "الفرقة الثانية",
  LEVEL_3: "الفرقة الثالثة",
  LEVEL_4: "الفرقة الرابعة",
};


export default function AffairsGradesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

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
        const res = await fetch("/api/affairs/grades").then((r) => (r.ok ? r.json() : Promise.reject())).catch(() => ({ rows: [] }));
        if (!cancelled) {
          setRows(res.rows ?? []);
          setLoading(false);
        }
      })
      .catch(() => router.replace("/affairs/login"));
    return () => { cancelled = true; };
  }, [router]);

  const filtered = rows.filter((r) => {
    const name = r.student.studentProfile?.fullName ?? r.student.email;
    const code = r.student.studentProfile?.studentCode ?? "";
    const matchSearch = name.includes(search) || code.includes(search) || r.assignment.course.includes(search);
    const level = r.student.studentProfile?.academicLevel ?? "";
    const matchYear = yearFilter === "الكل" || level === yearFilter;
    const matchStatus =
      statusFilter === "الكل" ||
      (statusFilter === "مرصود" && r.score !== null) ||
      (statusFilter === "قيد المراجعة" && r.score === null);
    return matchSearch && matchYear && matchStatus;
  });

  const totalGraded = rows.filter((r) => r.score !== null).length;
  const average = totalGraded > 0
    ? Math.round(rows.filter((r) => r.score !== null).reduce((s, r) => s + (r.score ?? 0), 0) / totalGraded)
    : 0;

  async function handleExportPdf() {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const rowsHtml = filtered.map((r, i) => {
        const name = r.student.studentProfile?.fullName ?? r.student.email;
        const code = r.student.studentProfile?.studentCode ?? r.student.email;
        const level = LEVEL_LABELS[r.student.studentProfile?.academicLevel ?? ""] ?? "غير محدد";
                return `<tr>
          <td style="border:1px solid #333;padding:6px;text-align:center;">${i + 1}</td>
          <td style="border:1px solid #333;padding:6px;font-family:monospace;">${code}</td>
          <td style="border:1px solid #333;padding:6px;">${name}</td>
          <td style="border:1px solid #333;padding:6px;">${level}</td>
          <td style="border:1px solid #333;padding:6px;">${r.assignment.course}</td>
          <td style="border:1px solid #333;padding:6px;text-align:center;font-weight:bold;">${r.score ?? "—"}</td>
          <td style="border:1px solid #333;padding:6px;">${r.notes ?? "—"}</td>
        </tr>`;
      }).join("");

      const totalGraded = filtered.filter((r) => r.score !== null).length;
      const avg = totalGraded > 0
        ? Math.round(filtered.filter((r) => r.score !== null).reduce((s, r) => s + (r.score ?? 0), 0) / totalGraded)
        : 0;

      const html = `
        <div style="text-align:center;border-bottom:3px double #000;padding-bottom:12px;margin-bottom:20px;">
          <h2 style="margin:0;font-size:20px;">جامعة الأزهر الشريف</h2>
          <h3 style="margin:6px 0 0;font-size:16px;font-weight:normal;">كلية اللغة العربية بالقاهرة — قسم التاريخ والحضارة</h3>
          <h1 style="margin:14px 0 6px;font-size:22px;">كشف رصd درجات الأبحاث العلمية</h1>
          <p style="margin:0;font-size:12px;color:#555;">
            التاريخ: ${new Date().toLocaleDateString("ar-EG")} — عدد الصفوف: ${filtered.length} — المتوسط: ${avg}/20
          </p>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="border:1px solid #333;padding:8px;">م</th>
              <th style="border:1px solid #333;padding:8px;">الرقم القومي</th>
              <th style="border:1px solid #333;padding:8px;">اسم الطالب</th>
              <th style="border:1px solid #333;padding:8px;">الفرقة</th>
              <th style="border:1px solid #333;padding:8px;">المادة</th>
              <th style="border:1px solid #333;padding:8px;">الدرجة</th>
              <th style="border:1px solid #333;padding:8px;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="8" style="border:1px solid #333;padding:20px;text-align:center;">لا توجد بيانات</td></tr>`}
          </tbody>
        </table>

        <div style="margin-top:40px;display:flex;justify-content:space-around;text-align:center;font-size:12px;">
          <div style="flex:1;">
            <p style="font-weight:bold;margin-bottom:40px;">رئيس القسم</p>
            <p style="border-top:1px solid #999;padding-top:4px;margin:0 30px;">....................................</p>
          </div>
          <div style="flex:1;">
            <p style="font-weight:bold;margin-bottom:40px;">شؤون الطلاب</p>
            <p style="border-top:1px solid #999;padding-top:4px;margin:0 30px;">....................................</p>
          </div>
          <div style="flex:1;">
            <p style="font-weight:bold;margin-bottom:40px;">عميد الكلية</p>
            <p style="border-top:1px solid #999;padding-top:4px;margin:0 30px;">....................................</p>
          </div>
        </div>
      `;

      const container = createPrintContainer(html);
      try {
        // انتظار بسيط لضمان الرندر الكامل
        await new Promise((r) => setTimeout(r, 500));
        await exportElementToPdf(container, {
          filename: `كشف_الدرجات_${new Date().toISOString().slice(0, 10)}`,
          orientation: "landscape",
        });
      } finally {
        removePrintContainer(container);
      }
    } catch (e) {
      console.error(e);
      alert("تعذر تصدير PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  function exportCSV() {
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += "جامعة الأزهر الشريف - كلية اللغة العربية - قسم التاريخ والحضارة\n";
    csv += "كشف الدرجات المعتمد — شؤون الطلاب\n\n";
    csv += "الرقم القومي,اسم الطالب,الفرقة,المادة,عنوان البحث,الدرجة,ملاحظات\n";
    filtered.forEach((r) => {
      const name = r.student.studentProfile?.fullName ?? r.student.email;
      const code = r.student.studentProfile?.studentCode ?? r.student.email;
      const level = LEVEL_LABELS[r.student.studentProfile?.academicLevel ?? ""] ?? "غير محدد";
            csv += `"${code}","${name}","${level}","${r.assignment.course}","${r.assignment.title}","${r.score ?? "-"}","${r.notes ?? "-"}"\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `كشف_الدرجات_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 dir-rtl font-sans text-right text-gray-900 print:hidden">
        <header className="bg-[#1e5eb8] text-white px-8 py-5 flex items-center justify-between shadow-lg sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center">
              <Award className="w-7 h-7 text-blue-100" />
            </div>
            <div>
              <h1 className="font-bold text-xl flex items-center gap-2">
                سجل الدرجات
                <span className="text-[10px] bg-[#1650a0] text-blue-50 px-2 py-0.5 rounded-full font-bold">EARTH</span>
              </h1>
              <p className="text-xs text-blue-100 mt-0.5">مراجعة جميع الدرجات المرصودة — شؤون الطلاب</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPrint(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition border border-white/20"
            >
              <Printer className="w-4 h-4" /> طباعة / حفظ كـ PDF
            </button>
<button
              onClick={exportCSV}
              className="bg-[#1e5eb8] hover:bg-[#1650a0] text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" /> تصدير CSV
            </button>
            <Link
              href="/affairs"
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition border border-white/20"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </header>

        <main className="p-8 max-w-[1920px] mx-auto space-y-6">
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-500 font-bold mb-1">إجمالي الأبحاث المسلّمة</p>
              <p className="text-3xl font-extrabold text-[#1e5eb8]">{rows.length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-500 font-bold mb-1">المرصودة</p>
              <p className="text-3xl font-extrabold text-[#1e5eb8]">{totalGraded}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> المتوسط العام
              </p>
              <p className="text-3xl font-extrabold text-[#1e5eb8]">{average} <span className="text-base text-gray-400">/20</span></p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[280px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-3.5 pl-11 border border-gray-200 rounded-2xl text-sm bg-gray-50 outline-none font-bold focus:border-emerald-600 focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-4" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="p-3.5 border border-gray-200 rounded-2xl text-sm font-bold bg-gray-50 outline-none focus:border-emerald-600"
              >
                <option value="الكل">جميع الفرق</option>
                <option value="LEVEL_1">الفرقة الأولى</option>
                <option value="LEVEL_2">الفرقة الثانية</option>
                <option value="LEVEL_3">الفرقة الثالثة</option>
                <option value="LEVEL_4">الفرقة الرابعة</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-3.5 border border-gray-200 rounded-2xl text-sm font-bold bg-gray-50 outline-none focus:border-emerald-600"
              >
                <option value="الكل">الحالة: الكل</option>
                <option value="مرصود">مرصود</option>
                <option value="قيد المراجعة">قيد المراجعة</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#1e5eb8] text-white">
                  <tr className="text-xs font-bold">
                    <th className="p-4">الرقم القومي</th>
                    <th className="p-4">اسم الطالب</th>
                    <th className="p-4">الفرقة</th>
                    <th className="p-4">المادة</th>
                    <th className="p-4">عنوان البحث</th>
                    <th className="p-4 text-center">الدرجة</th>
                    <th className="p-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={8} className="p-12 text-center"><Loader2 className="w-8 h-8 text-[#1e5eb8] animate-spin mx-auto" /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-gray-400 font-bold">لا توجد نتائج</td></tr>
                  ) : (
                    filtered.map((r) => {
                      const name = r.student.studentProfile?.fullName ?? r.student.email;
                      const code = r.student.studentProfile?.studentCode ?? r.student.email;
                      const level = LEVEL_LABELS[r.student.studentProfile?.academicLevel ?? ""] ?? "غير محدد";
                      const graded = r.score !== null;
                      return (
                        <tr key={r.id} className="hover:bg-blue-50/40 transition">
                          <td className="p-4 font-mono text-gray-700 font-bold">{code}</td>
                          <td className="p-4 font-bold text-gray-900">{name}</td>
                          <td className="p-4 text-gray-600">{level}</td>
                          <td className="p-4 font-bold text-[#1e5eb8]">{r.assignment.course}</td>
                          <td className="p-4 text-gray-700 max-w-xs truncate">{r.assignment.title}</td>
                          <td className="p-4 text-center">
                            {graded ? (
                              <span className="inline-flex items-center justify-center min-w-[48px] px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold">
                                {r.score}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs font-bold">لم تُرصد</span>
                            )}
                          </td>
                          <td className="p-4 text-xs text-gray-600 max-w-xs truncate" title={r.notes ?? ""}>{r.notes ?? "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Print View */}
      {showPrint && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto print:relative print:inset-auto">
          <div className="print:hidden sticky top-0 bg-gray-900 text-white p-4 flex items-center justify-between z-10">
            <p className="font-bold">معاينة الطباعة</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="bg-[#1e5eb8] hover:bg-[#1650a0] px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> طباعة
              </button>
              <button
                onClick={() => setShowPrint(false)}
                className="bg-red-600 hover:bg-red-700 p-2.5 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-8 max-w-[1200px] mx-auto text-right text-gray-900" style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif" }}>
            <div className="text-center mb-6 border-b-2 border-gray-900 pb-4">
              <p className="text-lg font-bold">جامعة الأزهر الشريف</p>
              <p className="text-base">كلية اللغة العربية بالقاهرة — قسم التاريخ والحضارة</p>
              <h1 className="text-2xl font-extrabold mt-3">كشف رصد درجات الأبحاث العلمية</h1>
              <p className="text-xs mt-2">التاريخ: {new Date().toLocaleDateString("ar-EG")} — عدد الصفوف: {filtered.length}</p>
            </div>

            <table className="w-full border-collapse text-xs" style={{ border: "1px solid #000" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #000", padding: "6px" }}>م</th>
                  <th style={{ border: "1px solid #000", padding: "6px" }}>الرقم القومي</th>
                  <th style={{ border: "1px solid #000", padding: "6px" }}>اسم الطالب</th>
                  <th style={{ border: "1px solid #000", padding: "6px" }}>الفرقة</th>
                  <th style={{ border: "1px solid #000", padding: "6px" }}>المادة</th>
                  <th style={{ border: "1px solid #000", padding: "6px" }}>الدرجة</th>
                  <th style={{ border: "1px solid #000", padding: "6px" }}>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const name = r.student.studentProfile?.fullName ?? r.student.email;
                  const code = r.student.studentProfile?.studentCode ?? r.student.email;
                  const level = LEVEL_LABELS[r.student.studentProfile?.academicLevel ?? ""] ?? "غير محدد";
                  return (
                    <tr key={r.id}>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{i + 1}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", fontFamily: "monospace" }}>{code}</td>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>{name}</td>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>{level}</td>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>{r.assignment.course}</td>
                      <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center", fontWeight: "bold" }}>{r.score ?? "—"}</td>
                      <td style={{ border: "1px solid #000", padding: "6px" }}>{r.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-12 grid grid-cols-3 gap-8 text-center text-sm">
              <div>
                <p className="font-bold mb-16">رئيس القسم</p>
                <p className="border-t border-gray-400 pt-2">....................................</p>
              </div>
              <div>
                <p className="font-bold mb-16">شؤون الطلاب</p>
                <p className="border-t border-gray-400 pt-2">....................................</p>
              </div>
              <div>
                <p className="font-bold mb-16">عميد الكلية</p>
                <p className="border-t border-gray-400 pt-2">....................................</p>
              </div>
            </div>
          </div>

          <style jsx global>{`
            @media print {
              @page { size: A4 landscape; margin: 1cm; }
              body { background: white !important; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
