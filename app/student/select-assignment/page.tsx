"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, BookOpen, UserCheck, AlertTriangle, CheckCircle2,
  Calendar, Lock, Loader2, ArrowLeft, ArrowRight, Sparkles,
} from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  course: string;
  deadline: string | null;
  faculty: { email: string; facultyProfile: { fullName: string; academicTitle: string | null } | null } | null;
}

function formatDeadline(date: string | null) {
  if (!date) return { text: "بدون موعد نهائي", urgent: false };
  const d = new Date(date);
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: "انتهى الموعد", urgent: true };
  if (days === 0) return { text: "ينتهي اليوم", urgent: true };
  if (days === 1) return { text: "ينتهي غداً", urgent: true };
  if (days <= 3) return { text: `متبقي ${days} أيام`, urgent: true };
  return { text: `متبقي ${days} يوماً`, urgent: false };
}

export default function SelectAssignmentPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("");

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
        setStudentName(sessionStorage.getItem("student_name") || localStorage.getItem("earth_student_persistent_name") || "الطالب");
        const res = await fetch("/api/student/assignment").then((r) => r.json()).catch(() => ({ hasChosen: false }));
        if (res.hasChosen) { router.replace("/student"); return; }
        const list = await fetch("/api/assignments").then((r) => r.json()).then((d: { assignments: Assignment[] }) => d.assignments ?? []);
        if (!cancelled) { setAssignments(list); setLoading(false); }
      })
      .catch(() => router.replace("/student/login"));
    return () => { cancelled = true; };
  }, [router]);

  async function handleConfirm() {
    if (!selected) { setError("يرجى اختيار تكليف أولاً"); return; }
    setConfirming(true); setError("");
    const res = await fetch("/api/student/assignment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: selected }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) { setError(data.error || "تعذر اختيار التكليف"); setConfirming(false); return; }
    window.location.href = "/student";
  }

  const selectedAssignment = assignments.find((a) => a.id === selected);

  return (
    <main className="h-screen w-screen overflow-hidden dir-rtl font-sans flex bg-white">
      {/* LEFT: Blue panel */}
      <div className="hidden md:flex md:w-[40%] bg-[#1e5eb8] relative overflow-hidden items-center justify-center p-8">
        <div className="absolute top-0 left-0 right-0 h-40">
          <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,60 C150,10 300,140 450,40 C530,0 570,30 600,60 L600,0 L0,0 Z" fill="#2b6fc9" />
          </svg>
        </div>
        <div className="absolute bottom-[-80px] left-[-80px] w-64 h-64 bg-[#2b6fc9] rounded-full" />
        <div className="absolute bottom-[-120px] right-[-60px] w-72 h-72 bg-[#1650a0] rounded-full" />

        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-5 animate-float">
            <Sparkles className="w-12 h-12 text-[#1e5eb8]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">مرحباً {studentName}</h2>
          <p className="text-blue-100 text-sm font-bold leading-relaxed">
            خطوة واحدة تفصلك عن البدء في بحثك العلمي
          </p>

          <div className="mt-8 bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-amber-300" />
              <p className="text-xs font-black text-amber-200">قرار نهائي</p>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed font-bold">
              بعد الاختيار، سيُربط حسابك بأستاذ المادة المختار ولن تتمكن من تغييره.
            </p>
          </div>

          <div className="absolute -top-3 -right-3 w-12 h-12 bg-emerald-500 rounded-2xl shadow-xl flex items-center justify-center animate-float-delayed">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="flex-1 flex flex-col relative bg-white">
        <div className="flex items-center justify-between px-6 md:px-8 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1e5eb8] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-[#1e5eb8] text-lg leading-none">EARTH</p>
              <p className="text-[9px] text-gray-400 font-black tracking-[0.15em] mt-0.5">SELECT ASSIGNMENT</p>
            </div>
          </div>
          <button
            onClick={() => { fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined); window.location.href = "/student/login"; }}
            className="text-xs font-bold text-gray-500 hover:text-red-600 flex items-center gap-2 transition"
          >
            <ArrowRight className="w-4 h-4" /> خروج
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 lg:px-12 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="mb-5 animate-fade-in-up">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                اختر تكليف البحث
              </h1>
              <p className="text-sm text-gray-600 mt-1.5 font-bold">حدد المادة التي تريد إعداد بحثك فيها</p>
              <div className="w-12 h-1 bg-[#1e5eb8] rounded-full mt-3" />
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-xs font-bold text-red-800">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-[#1e5eb8] animate-spin" />
                <p className="text-sm text-gray-500 font-bold">جاري التحميل...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-16 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <BookOpen className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <p className="text-base font-black text-gray-700">لا توجد تكليفات متاحة</p>
                <p className="text-xs text-gray-500 mt-2 font-bold">يرجى التواصل مع هيئة التدريس</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {assignments.map((a) => {
                    const doc = a.faculty?.facultyProfile;
                    const isSel = selected === a.id;
                    const dl = formatDeadline(a.deadline);
                    return (
                      <button
                        key={a.id}
                        onClick={() => { setSelected(a.id); setError(""); }}
                        className={`w-full text-right p-4 rounded-2xl border-2 transition-all ${
                          isSel
                            ? "bg-[#1e5eb8] border-[#1e5eb8] shadow-lg shadow-blue-500/20"
                            : "bg-gray-50 border-gray-200 hover:border-[#1e5eb8]/40 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                            isSel ? "bg-white/20" : "bg-blue-100"
                          }`}>
                            <BookOpen className={`w-6 h-6 ${isSel ? "text-white" : "text-[#1e5eb8]"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-black text-base mb-0.5 ${isSel ? "text-white" : "text-gray-900"}`}>
                              {a.course}
                            </h3>
                            <p className={`text-xs mb-2 font-bold ${isSel ? "text-blue-100" : "text-gray-600"}`}>
                              {a.title}
                            </p>
                            <div className={`flex items-center justify-between gap-2 flex-wrap`}>
                              <div className={`flex items-center gap-1.5 text-[11px] font-bold ${isSel ? "text-white" : "text-gray-700"}`}>
                                <UserCheck className="w-3.5 h-3.5" />
                                {doc?.academicTitle ? `${doc.academicTitle} ` : ""}{doc?.fullName || "عضو هيئة التدريس"}
                              </div>
                              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                                dl.urgent
                                  ? isSel ? "bg-red-500/30 text-white" : "bg-red-100 text-red-700"
                                  : isSel ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                              }`}>
                                <Calendar className="w-3 h-3" /> {dl.text}
                              </div>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSel ? "bg-white border-white" : "border-gray-300"
                          }`}>
                            {isSel && <CheckCircle2 className="w-4 h-4 text-[#1e5eb8]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={!selected || confirming}
                  className="w-full bg-[#1e5eb8] hover:bg-[#1650a0] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2 mt-5"
                >
                  {confirming ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> جاري الاعتماد...</>
                  ) : (
                    <>اعتماد الاختيار والدخول للكنترول <ArrowLeft className="w-5 h-5" /></>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-float { animation: float 3.5s ease-in-out infinite; }
        .animate-float-delayed { animation: float 3s ease-in-out infinite 0.4s; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>
    </main>
  );
}
