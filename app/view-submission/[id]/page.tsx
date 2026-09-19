"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight, GraduationCap, FileText, Calendar, User, BookOpen,
  Award, Printer, Loader2, AlertCircle, Clock, CheckCircle2,
  Hash, ShieldCheck, Building2, Type, ChevronRight, ChevronLeft,
  BookMarked, Layers,
} from "lucide-react";

interface SubmissionDetail {
  id: string;
  text: string;
  score: number | null;
  notes: string | null;
  status: string;
  submittedAt: string;
  updatedAt: string;
  student: {
    id: string;
    email: string;
    studentProfile: { fullName: string; studentCode: string; academicLevel: string } | null;
  };
  assignment: {
    id: string;
    title: string;
    course: string;
    facultyId: string;
    faculty: { facultyProfile: { fullName: string; academicTitle: string | null } | null };
  };
}

const LEVEL_LABELS: Record<string, string> = {
  LEVEL_1: "الفرقة الأولى",
  LEVEL_2: "الفرقة الثانية",
  LEVEL_3: "الفرقة الثالثة",
  LEVEL_4: "الفرقة الرابعة",
};

const WORDS_PER_PAGE = 200;

function scoreLabel(score: number | null): { text: string; bg: string; color: string } {
  if (score === null) return { text: "قيد المراجعة", bg: "#fef3c7", color: "#b45309" };
  if (score >= 90) return { text: "ممتاز", bg: "#d1fae5", color: "#065f46" };
  if (score >= 80) return { text: "جيد جداً", bg: "#dbeafe", color: "#1e40af" };
  if (score >= 70) return { text: "جيد", bg: "#e0e7ff", color: "#3730a3" };
  if (score >= 60) return { text: "مقبول", bg: "#f3f4f6", color: "#374151" };
  return { text: "راسب", bg: "#fee2e2", color: "#991b1b" };
}

function splitIntoPages(text: string, wordsPerPage: number): string[] {
  const clean = text.trim();
  if (!clean) return ["لا يوجد محتوى"];

  // تقسيم حسب الفقرات أولاً
  const paragraphs = clean.split(/\n\n+/).filter((p) => p.trim());

  const pages: string[] = [];
  let current = "";
  let currentWords = 0;

  for (const para of paragraphs) {
    const paraWords = para.trim().split(/\s+/).length;

    if (currentWords + paraWords > wordsPerPage && current.trim()) {
      pages.push(current.trim());
      current = para;
      currentWords = paraWords;
    } else {
      current += (current ? "\n\n" : "") + para;
      currentWords += paraWords;
    }
  }

  if (current.trim()) pages.push(current.trim());

  // لو صفحة واحدة طويلة جداً، نقسمها بالكلمات
  const finalPages: string[] = [];
  for (const page of pages) {
    const words = page.split(/\s+/);
    if (words.length <= wordsPerPage * 1.5) {
      finalPages.push(page);
    } else {
      for (let i = 0; i < words.length; i += wordsPerPage) {
        finalPages.push(words.slice(i, i + wordsPerPage).join(" "));
      }
    }
  }

  return finalPages.length > 0 ? finalPages : ["لا يوجد محتوى"];
}

export default function ViewSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(2.2);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/submissions/${id}/view`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { submission: SubmissionDetail }) => {
        if (!cancelled) { setSubmission(data.submission); setLoading(false); }
      })
      .catch((status) => {
        if (cancelled) return;
        setError(status === 403 ? "غير مصرح لك بعرض هذا البحث" : status === 404 ? "البحث غير موجود" : "تعذر تحميل البحث");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const pages = useMemo(() => submission ? splitIntoPages(submission.text, WORDS_PER_PAGE) : [], [submission]);
  const totalPages = pages.length;

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.replace("/");
  }

  function nextPage() { if (currentPage < totalPages) setCurrentPage(currentPage + 1); }
  function prevPage() { if (currentPage > 1) setCurrentPage(currentPage - 1); }

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") nextPage();
      if (e.key === "ArrowRight") prevPage();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
        <Loader2 className="w-12 h-12 text-[#1e5eb8] animate-spin" />
        <p className="text-sm font-black text-gray-600">جاري تحميل البحث...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-5 bg-gray-100 p-6">
        <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <p className="text-lg font-black text-gray-800">{error}</p>
        <button onClick={goBack} className="bg-[#1e5eb8] hover:bg-[#1650a0] text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition">
          <ArrowRight className="w-4 h-4" /> العودة
        </button>
      </div>
    );
  }

  const studentName = submission.student.studentProfile?.fullName ?? submission.student.email;
  const studentCode = submission.student.studentProfile?.studentCode ?? "—";
  const level = LEVEL_LABELS[submission.student.studentProfile?.academicLevel ?? ""] ?? "غير محدد";
  const docName = submission.assignment.faculty.facultyProfile?.fullName ?? "عضو هيئة التدريس";
  const docTitle = submission.assignment.faculty.facultyProfile?.academicTitle ?? "";
  const lbl = scoreLabel(submission.score);
  const wordCount = submission.text.trim() ? submission.text.trim().split(/\s+/).length : 0;

  const currentText = pages[currentPage - 1] ?? "";
  const currentWords = currentText.split(/\s+/).length;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">

      {/* TOP BAR */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-40 print:hidden">
        <div className="px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
              <ArrowRight className="w-5 h-5 text-gray-700" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-[#1e5eb8] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-[#1e5eb8] text-sm leading-none">منظومة EARTH</p>
              <p className="text-[9px] text-gray-500 font-black tracking-[0.15em] mt-0.5">SUBMISSION VIEWER</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Font Size */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
              <Type className="w-3.5 h-3.5 text-gray-500" />
              <button onClick={() => setFontSize(f => Math.max(14, f - 2))} className="w-6 h-6 rounded-md hover:bg-gray-200 text-gray-700 font-black text-xs transition">−</button>
              <span className="text-[10px] font-black text-gray-700 font-mono min-w-[24px] text-center">{fontSize}</span>
              <button onClick={() => setFontSize(f => Math.min(32, f + 2))} className="w-6 h-6 rounded-md hover:bg-gray-200 text-gray-700 font-black text-xs transition">+</button>
            </div>

            {/* Line Height */}
            <div className="hidden md:flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
              <Layers className="w-3.5 h-3.5 text-gray-500" />
              <button onClick={() => setLineHeight(l => Math.max(1.6, +(l - 0.2).toFixed(1)))} className="w-6 h-6 rounded-md hover:bg-gray-200 text-gray-700 font-black text-xs transition">−</button>
              <span className="text-[10px] font-black text-gray-700 font-mono min-w-[24px] text-center">{lineHeight}</span>
              <button onClick={() => setLineHeight(l => Math.min(3, +(l + 0.2).toFixed(1)))} className="w-6 h-6 rounded-md hover:bg-gray-200 text-gray-700 font-black text-xs transition">+</button>
            </div>

            <button
              onClick={() => window.print()}
              className="bg-[#1e5eb8] hover:bg-[#1650a0] text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" /> طباعة
            </button>
          </div>
        </div>
      </header>

      {/* INFO STRIP */}
      <div className="bg-white border-b-2 border-gray-200 print:hidden">
        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <InfoItem icon={<User className="w-4 h-4" />} label="الطالب" value={studentName} sub={studentCode} />
          <InfoItem icon={<GraduationCap className="w-4 h-4" />} label="الفرقة" value={level} sub={submission.student.email.split("@")[0]} />
          <InfoItem icon={<BookOpen className="w-4 h-4" />} label="المادة" value={submission.assignment.course} sub={submission.assignment.title} />
          <InfoItem icon={<User className="w-4 h-4" />} label="أستاذ المادة" value={docName} sub={docTitle || "—"} />
          <InfoItem icon={<Award className="w-4 h-4" />} label="الدرجة" value={submission.score !== null ? `${submission.score} / 100` : "قيد المراجعة"} sub={submission.score !== null ? lbl.text : "لم تُرصد بعد"} valueColor={submission.score !== null ? "#1e5eb8" : "#b45309"} />
          <InfoItem icon={<Calendar className="w-4 h-4" />} label="تاريخ التسليم" value={new Date(submission.submittedAt).toLocaleDateString("ar-EG")} sub={new Date(submission.submittedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })} />
        </div>
      </div>

      {/* NOTES */}
      {submission.notes && (
        <div className="bg-white border-b-2 border-gray-200 print:hidden">
          <div className="px-6 py-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-200">
              <Award className="w-4 h-4 text-amber-700" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-amber-700 mb-1">ملاحظات أستاذ المادة</p>
              <p className="text-sm font-bold text-gray-800 leading-relaxed">{submission.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN - Page Viewer */}
      <main className="flex-1 flex flex-col p-6 print:p-0">

        {/* Page indicator & nav */}
        <div className="max-w-[1400px] w-full mx-auto mb-4 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5">
            <BookMarked className="w-4 h-4 text-[#1e5eb8]" />
            <span className="text-xs font-black text-gray-700">
              صفحة <span className="text-[#1e5eb8]">{currentPage}</span> من <span className="text-[#1e5eb8]">{totalPages}</span>
            </span>
          </div>

          {/* Page dots */}
          <div className="hidden md:flex items-center gap-1.5 flex-wrap justify-center">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className="rounded-full transition-all"
                style={{
                  width: currentPage === i + 1 ? 24 : 8,
                  height: 8,
                  background: currentPage === i + 1 ? "#1e5eb8" : "#d1d5db",
                }}
                title={`صفحة ${i + 1}`}
              />
            ))}
          </div>

          <div className="text-xs font-black text-gray-500">
            {currentWords} كلمة
          </div>
        </div>

        {/* Paper */}
        <div className="flex-1 max-w-[1400px] w-full mx-auto print:max-w-none">

          <div className="bg-white shadow-xl rounded-3xl overflow-hidden print:shadow-none print:rounded-none flex flex-col min-h-[800px] print:min-h-0">

            {/* Paper Header */}
            <div className="px-10 py-5 border-b-2 border-gray-100 flex items-center justify-between print:px-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1e5eb8] flex items-center justify-center print:bg-transparent print:border-2 print:border-black">
                  <Building2 className="w-5 h-5 text-white print:text-black" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">جامعة الأزهر الشريف — كلية اللغة العربية</p>
                  <p className="text-[10px] font-bold text-gray-500 mt-0.5">قسم التاريخ والحضارة</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-[#1e5eb8]">منظومة EARTH</p>
                <p className="text-[9px] font-bold text-gray-500 mt-0.5">بحث علمي محكّم</p>
              </div>
            </div>

            {/* Title - only on page 1 */}
            {currentPage === 1 && (
              <div className="px-10 py-6 border-b-2 border-gray-100 bg-gray-50/60 print:px-0 print:bg-transparent">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-4">
                  {submission.assignment.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <MetaChip icon={<User className="w-3.5 h-3.5" />} label={studentName} />
                  <MetaChip icon={<Hash className="w-3.5 h-3.5" />} label={studentCode} mono />
                  <MetaChip icon={<GraduationCap className="w-3.5 h-3.5" />} label={level} />
                  <MetaChip icon={<BookOpen className="w-3.5 h-3.5" />} label={submission.assignment.course} />
                </div>
              </div>
            )}

            {/* Page Content */}
            <div className="flex-1 px-16 md:px-24 lg:px-32 py-10 print:px-0 print:py-6">
              <div
                className="text-gray-800 whitespace-pre-wrap"
                style={{
                  fontFamily: "'Amiri', 'Traditional Arabic', 'Segoe UI', serif",
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                  textAlign: "justify",
                }}
              >
                {currentText}
              </div>
            </div>

            {/* Page Footer */}
            <div className="px-10 py-4 border-t-2 border-gray-100 flex items-center justify-between print:px-0">
              <div className="text-[11px] font-black text-gray-500">
                صفحة {currentPage} من {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1e5eb8]" />
                <span className="text-[10px] font-bold text-gray-500">منظومة EARTH الأكاديمية</span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex items-center justify-between gap-4 print:hidden">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-gray-200 rounded-2xl px-6 py-4 transition group"
            >
              <ChevronRight className="w-5 h-5 text-[#1e5eb8] group-hover:-translate-x-1 transition-transform" />
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400">السابق</p>
                <p className="text-xs font-black text-gray-700">صفحة {Math.max(1, currentPage - 1)}</p>
              </div>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl">
              <span className="text-xs font-black text-gray-500">انتقل لأي صفحة</span>
              <input
                type="range"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                className="w-32 accent-[#1e5eb8]"
              />
              <span className="text-xs font-black text-[#1e5eb8] min-w-[60px] text-center">{currentPage} / {totalPages}</span>
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-3 bg-[#1e5eb8] hover:bg-[#1650a0] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl px-6 py-4 transition group"
            >
              <div className="text-left">
                <p className="text-[10px] font-black text-blue-200">التالي</p>
                <p className="text-xs font-black">صفحة {Math.min(totalPages, currentPage + 1)}</p>
              </div>
              <ChevronLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Trust note */}
          <div className="mt-5 p-4 bg-white border border-gray-200 rounded-2xl flex items-start gap-3 print:hidden">
            <CheckCircle2 className="w-5 h-5 text-[#1e5eb8] flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-gray-700 leading-relaxed">
              هذا البحث مسلّم إلكترونياً عبر منظومة EARTH الأكاديمية — تم توثيقه بتاريخ {new Date(submission.submittedAt).toLocaleString("ar-EG")}.
              <span className="block mt-1 text-gray-400">💡 يمكنك التنقل بين الصفحات باستخدام أزرار الأسهم ← → على لوحة المفاتيح.</span>
            </p>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 2cm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          header { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function InfoItem({ icon, label, value, sub, valueColor = "#111827" }: { icon: React.ReactNode; label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-gray-400">{label}</p>
        <p className="text-sm font-black truncate" style={{ color: valueColor }}>{value}</p>
        {sub && <p className="text-[10px] font-bold text-gray-400 truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MetaChip({ icon, label, mono }: { icon: React.ReactNode; label: string; mono?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black border ${mono ? "font-mono" : ""}`}
      style={{ background: "#f9fafb", color: "#374151", borderColor: "#e5e7eb" }}
    >
      {icon}
      {label}
    </span>
  );
}
