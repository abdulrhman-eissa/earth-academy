"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck, CheckCircle2, ArrowRight, ShieldAlert, GraduationCap,
  Hash, Lock, Briefcase, BookOpen, User, Award, Loader2,
} from "lucide-react";
import Link from "next/link";

interface FacultyRecord {
  employeeId: string | number;
  [key: string]: unknown;
}

export default function FacultyRegisterPage() {
  const router = useRouter();

  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("تاريخ وحضارة (عام)");
  const [primaryCourse, setPrimaryCourse] = useState("");
  const [secondaryCourse, setSecondaryCourse] = useState("");
  const [targetYear, setTargetYear] = useState("الفرقة الأولى");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setEmployeeId(
        new URLSearchParams(window.location.search).get("employeeId") ||
          sessionStorage.getItem("faculty_employee_id") ||
          ""
      );
      setIsAuthorized(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!doctorName || !primaryCourse || !employeeId || password.length < 8) {
      setError("يرجى إدخال اسم الدكتور والمادة الرئيسية وكلمة مرور 8 أحرف على الأقل.");
      return;
    }

    setSubmitting(true);
    const currentEmpId = employeeId;
    const email = `${currentEmpId}@faculty.local`;

    try {
      let response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "FACULTY" }),
      });

      if (response.status === 409) {
        response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role: "FACULTY" }),
        });
        if (!response.ok) {
          setError("هذا الرقم الوظيفي مسجّل من قبل بكلمة مرور مختلفة.");
          setSubmitting(false);
          return;
        }
      } else if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "تعذر إنشاء الحساب.");
        setSubmitting(false);
        return;
      }

      const existingFaculty = JSON.parse(localStorage.getItem("earth_registered_faculty") || "[]");
      const filteredFaculty = existingFaculty.filter(
        (f: FacultyRecord) => String(f.employeeId) !== String(currentEmpId)
      );
      filteredFaculty.push({
        id: String(currentEmpId),
        employeeId: String(currentEmpId),
        name: doctorName,
        specialty,
        primaryCourse,
        secondaryCourse: secondaryCourse || null,
        targetYear,
      });
      localStorage.setItem("earth_registered_faculty", JSON.stringify(filteredFaculty));

      sessionStorage.setItem("faculty_employee_id", currentEmpId);
      sessionStorage.setItem("faculty_name", doctorName);
      sessionStorage.setItem("faculty_course_name", primaryCourse);

      window.location.href = "/faculty";
    } catch {
      setError("تعذر الاتصال بالخادم.");
      setSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dir-rtl font-sans">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1e5eb8] animate-spin mx-auto mb-4" />
          <p className="text-sm font-black text-gray-700">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

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
            <UserCheck className="w-12 h-12 text-[#1e5eb8]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">تسجيل عضو هيئة التدريس</h2>
          <p className="text-blue-100 text-sm font-bold leading-relaxed">
            أكمل بياناتك الأكاديمية لإنشاء موادك الدراسية
          </p>

          <div className="mt-8 bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-amber-300" />
              <p className="text-xs font-black text-amber-200">خطوة أولى مهمة</p>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed font-bold">
              بياناتك الأكاديمية ستُستخدم لربط الطلاب بك وبموادك الدراسية.
            </p>
          </div>

          <div className="absolute -top-3 -right-3 w-12 h-12 bg-emerald-500 rounded-2xl shadow-xl flex items-center justify-center animate-float-delayed">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="flex-1 flex flex-col relative bg-white">
        <div className="flex items-center justify-between px-6 md:px-8 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1e5eb8] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-[#1e5eb8] text-lg leading-none">EARTH</p>
              <p className="text-[9px] text-gray-400 font-black tracking-[0.15em] mt-0.5">FACULTY REGISTRATION</p>
            </div>
          </div>
          <Link href="/faculty/login" className="text-xs font-bold text-gray-500 hover:text-[#1e5eb8] flex items-center gap-2 transition">
            <ArrowRight className="w-4 h-4" /> رجوع
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 lg:px-12 py-3">
          <div className="max-w-xl mx-auto">
            <div className="mb-5 animate-fade-in-up">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                بياناتك الأكاديمية
              </h1>
              <p className="text-sm text-gray-600 mt-1.5 font-bold">أكمل الحقول لإنشاء حسابك</p>
              <div className="w-12 h-1 bg-[#1e5eb8] rounded-full mt-3" />
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-xs font-bold text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">الرقم الوظيفي *</label>
                <div className="relative">
                  <input
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    placeholder="مثال: 2026901"
                    className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-mono font-bold text-gray-900 focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-500 placeholder:font-bold"
                  />
                  <Hash className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">كلمة المرور (8 أحرف على الأقل) *</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="أدخل كلمة مرور قوية..."
                    className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-mono font-bold text-gray-900 focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-500 placeholder:font-bold"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">اسم الدكتور / عضو هيئة التدريس *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="مثال: أ.د/ أحمد محمود السيد"
                    className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-bold text-gray-900 focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-500 placeholder:font-bold"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-gray-700 mb-1.5">التخصص الأكاديمي *</label>
                  <div className="relative">
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-bold text-gray-900 focus:border-[#1e5eb8] focus:bg-white transition"
                    >
                      <option value="تاريخ وحضارة (عام)">تاريخ وحضارة (عام)</option>
                      <option value="تاريخ فقط">تاريخ فقط</option>
                      <option value="حضارة فقط">حضارة فقط</option>
                    </select>
                    <Award className="w-4 h-4 text-gray-400 absolute right-4 top-4 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-700 mb-1.5">الفرقة المستهدفة *</label>
                  <div className="relative">
                    <select
                      value={targetYear}
                      onChange={(e) => setTargetYear(e.target.value)}
                      className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-bold text-gray-900 focus:border-[#1e5eb8] focus:bg-white transition"
                    >
                      <option value="الفرقة الأولى">الفرقة الأولى</option>
                      <option value="الفرقة الثانية">الفرقة الثانية</option>
                      <option value="الفرقة الثالثة">الفرقة الثالثة</option>
                      <option value="الفرقة الرابعة">الفرقة الرابعة</option>
                    </select>
                    <BookOpen className="w-4 h-4 text-gray-400 absolute right-4 top-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-2xl border-2 border-blue-100 space-y-3">
                <div>
                  <label className="block text-[11px] font-black text-[#1e5eb8] mb-1.5">اسم المادة الأولى (الرئيسية) *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={primaryCourse}
                      onChange={(e) => setPrimaryCourse(e.target.value)}
                      placeholder="مثال: تاريخ الإسلام السياسي"
                      className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-white outline-none font-bold text-gray-900 focus:border-[#1e5eb8] transition placeholder:text-gray-500 placeholder:font-bold"
                    />
                    <Briefcase className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[#1e5eb8] mb-1.5">اسم المادة الثانية (اختياري)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={secondaryCourse}
                      onChange={(e) => setSecondaryCourse(e.target.value)}
                      placeholder="مثال: النظم والحضارة الإسلامية"
                      className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-white outline-none font-bold text-gray-900 focus:border-[#1e5eb8] transition placeholder:text-gray-500 placeholder:font-bold"
                    />
                    <Briefcase className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1e5eb8] hover:bg-[#1650a0] disabled:opacity-50 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> حفظ البيانات والدخول</>
                )}
              </button>
            </form>
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
