"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, ArrowRight, ShieldAlert, LogIn, Hash, Lock, GraduationCap, CheckCircle2, Briefcase, BookOpen } from "lucide-react";
import Link from "next/link";
import { sanitizeInput, detectMaliciousPattern, checkRateLimit } from "@/lib/security";

export default function FacultyLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    const cleanId = sanitizeInput(employeeId).trim();
    const cleanPassword = password;

    if (detectMaliciousPattern(employeeId) || detectMaliciousPattern(password)) {
      setErrorMessage("حظر أمني: تم رصد محاولة إدخال رموز خبيثة.");
      return;
    }
    const rateCheck = checkRateLimit(`faculty_login_${cleanId}`, 5, 60000);
    if (!rateCheck.allowed) {
      setErrorMessage(`تجاوزت عدد المحاولات. انتظر ${Math.ceil(rateCheck.remainingMs / 1000)} ثانية.`);
      return;
    }
    if (!cleanId || cleanPassword.length < 8) {
      setErrorMessage("يرجى إدخال الرقم الوظيفي وكلمة المرور بشكل صحيح.");
      return;
    }

    setSubmitting(true);
    sessionStorage.setItem("faculty_employee_id", cleanId);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `${cleanId}@faculty.local`, password: cleanPassword, role: "FACULTY" }),
      });
      if (res.status === 401) {
        window.location.href = `/faculty/register?employeeId=${encodeURIComponent(cleanId)}`;
        return;
      }
      if (!res.ok) {
        setErrorMessage("الرقم الوظيفي أو كلمة المرور غير صحيحة.");
        setSubmitting(false);
        return;
      }
      window.location.href = "/faculty";
    } catch {
      setErrorMessage("تعذر الاتصال بالخادم.");
      setSubmitting(false);
    }
  }

  return (
    <main className="h-screen w-screen overflow-hidden dir-rtl font-sans flex bg-white">
      <div className="hidden md:flex md:w-[45%] bg-[#1e5eb8] relative overflow-hidden items-center justify-center p-8">
        <div className="absolute top-0 left-0 right-0 h-40">
          <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,60 C150,10 300,140 450,40 C530,0 570,30 600,60 L600,0 L0,0 Z" fill="#2b6fc9" />
          </svg>
        </div>
        <div className="absolute top-0 left-0 right-0 h-32">
          <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,80 C180,20 320,150 500,50 C560,20 590,50 600,80 L600,0 L0,0 Z" fill="#3d7fd5" opacity="0.7" />
          </svg>
        </div>
        <div className="absolute bottom-[-80px] left-[-80px] w-64 h-64 bg-[#2b6fc9] rounded-full" />
        <div className="absolute bottom-[-120px] right-[-60px] w-72 h-72 bg-[#1650a0] rounded-full" />

        <div className="relative z-10 w-full max-w-md">
          <div className="relative bg-white rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 flex items-center justify-center mb-3">
              <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/40">
                <UserCheck className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-blue-50 rounded-xl p-2.5 flex items-center justify-center"><BookOpen className="w-5 h-5 text-blue-600" /></div>
              <div className="bg-emerald-50 rounded-xl p-2.5 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
              <div className="bg-amber-50 rounded-xl p-2.5 flex items-center justify-center"><Briefcase className="w-5 h-5 text-amber-600" /></div>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-emerald-100 rounded-full w-full" />
              <div className="h-2 bg-emerald-100 rounded-full w-4/5" />
              <div className="h-2 bg-emerald-100 rounded-full w-3/5" />
            </div>
          </div>

          <div className="absolute -top-5 -left-5 w-14 h-14 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-float border-2 border-white">
            <UserCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="absolute -bottom-5 -right-5 w-14 h-14 bg-emerald-500 rounded-2xl shadow-2xl flex items-center justify-center animate-float-delayed">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-white/90 text-[11px] font-bold">
            منظومة EARTH — بوابة أعضاء هيئة التدريس
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative bg-white">
        <div className="flex items-center justify-between px-6 md:px-10 py-5">
          <Link href="/" className="group flex items-center gap-2 text-gray-600 hover:text-[#1e5eb8] transition text-xs font-bold">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 group-hover:bg-blue-50 flex items-center justify-center transition border border-gray-200 group-hover:border-blue-200">
              <ArrowRight className="w-4 h-4" />
            </div>
            <span className="hidden md:inline">العودة للرئيسية</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1e5eb8] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-[#1e5eb8] text-lg leading-none">EARTH</p>
              <p className="text-[9px] text-gray-400 font-black tracking-[0.15em] mt-0.5">FACULTY PORTAL</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center px-6 md:px-10 lg:px-16">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-7 animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                دخول عضو هيئة التدريس
              </h1>
              <p className="text-sm text-gray-600 mt-2 font-bold">ادخل بياناتك الوظيفية للمتابعة</p>
              <div className="w-12 h-1 bg-[#1e5eb8] rounded-full mt-3" />
            </div>

            {errorMessage && (
              <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-xs font-bold text-red-800">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">الرقم الوظيفي *</label>
                <div className="relative">
                  <input
                    type="text" required value={employeeId}
                    onChange={(e) => { setEmployeeId(e.target.value); setErrorMessage(""); }}
                    placeholder="مثال: 2026901"
                    className="w-full p-4 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-mono font-bold focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-700 placeholder:font-bold"
                  />
                  <Hash className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">كلمة المرور *</label>
                <div className="relative">
                  <input
                    type="password" required minLength={8} value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(""); }}
                    placeholder="أدخل كلمة المرور..."
                    className="w-full p-4 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-mono font-bold focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-700 placeholder:font-bold"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              <button
                type="submit" disabled={submitting}
                className="w-full bg-[#1e5eb8] hover:bg-[#1650a0] disabled:opacity-50 text-white font-black py-4 rounded-xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-3"
              >
                <LogIn className="w-5 h-5" />
                {submitting ? "جاري التحقق..." : "تسجيل الدخول"}
              </button>

              <p className="text-[11px] text-gray-500 text-center font-bold pt-2">
                أول دخول؟ سيتم توجيهك لصفحة التسجيل تلقائياً.
              </p>
            </form>
          </div>
        </div>

        <div className="text-center pb-5">
          <p className="text-[10px] text-gray-400 font-bold">
            © {new Date().getFullYear()} منظومة EARTH — جميع الحقوق محفوظة
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 3.5s ease-in-out infinite; }
        .animate-float-delayed { animation: float 3s ease-in-out infinite 0.4s; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>
    </main>
  );
}
