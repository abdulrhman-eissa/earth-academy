"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowRight, ShieldCheck, ShieldAlert, UserPlus, LogIn, CheckCircle2, User, Lock, Hash, BookOpen } from "lucide-react";
import Link from "next/link";
import { sanitizeInput, detectMaliciousPattern, checkRateLimit } from "@/lib/security";

type Mode = "signup" | "login";

export default function StudentLoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signup");
  const [justRegistered, setJustRegistered] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [ready, setReady] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [nationality, setNationality] = useState("مصري");
  const [targetYear, setTargetYear] = useState("الفرقة الأولى");
  const [specialty, setSpecialty] = useState("تاريخ وحضارة (عام)");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mode");
    setMode(m === "login" ? "login" : "signup");
    setJustRegistered(params.get("registered") === "1");
    const existingId = params.get("existingId");
    if (existingId) {
      setNationalId(existingId);
      setAlreadyExists(true);
    }
    setReady(true);
  }, []);

  const validateEgyptianNationalId = (id: string): boolean => {
    if (id.length !== 14 || !/^\d{14}$/.test(id)) return false;
    const century = id[0];
    if (century !== "2" && century !== "3") return false;
    const month = parseInt(id.substring(3, 5), 10);
    const day = parseInt(id.substring(5, 7), 10);
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const governorateCode = parseInt(id.substring(7, 9), 10);
    const validCodes = [1, 2, 3, 4, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35, 88];
    return validCodes.includes(governorateCode);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const cleanId = sanitizeInput(nationalId);
    const cleanPassword = password;
    const cleanName = sanitizeInput(studentName);

    if (detectMaliciousPattern(nationalId) || detectMaliciousPattern(password) || detectMaliciousPattern(studentName)) {
      setErrorMessage("حظر أمني: تم رصد محاولة إدخال رموز خبيثة.");
      return;
    }

    const rateCheck = checkRateLimit(`student_auth_${cleanId}`, 8, 60000);
    if (!rateCheck.allowed) {
      setErrorMessage(`تجاوزت عدد المحاولات. انتظر ${Math.ceil(rateCheck.remainingMs / 1000)} ثانية.`);
      return;
    }

    if (cleanId.length < 6) {
      setErrorMessage("يرجى إدخال الرقم القومي أو رقم الجواز بشكل صحيح.");
      return;
    }
    if (cleanPassword.length < 8) {
      setErrorMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }

    if (mode === "signup") {
      const nameWords = cleanName.trim().split(/\s+/).filter((w) => w.length > 0);
      if (nameWords.length < 3) {
        setErrorMessage("يرجى كتابة الاسم الثلاثي أو الرباعي رسمياً.");
        return;
      }
      if (nationality === "مصري" && !validateEgyptianNationalId(cleanId)) {
        setErrorMessage("الرقم القومي غير صحيح. يجب أن يتكون من 14 رقماً.");
        return;
      }
    }

    setSubmitting(true);
    const email = `${cleanId}@student.local`;

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email, password: cleanPassword, role: "STUDENT",
            fullName: cleanName, academicYear: targetYear, studentCode: cleanId,
          }),
        });
        if (res.status === 409) {
          setErrorMessage("هذا الحساب مسجّل بالفعل. جارٍ تحويلك لتسجيل الدخول...");
          setSubmitting(false);
          setTimeout(() => {
            window.location.href = `/student/login?mode=login&existingId=${encodeURIComponent(cleanId)}`;
          }, 1500);
          return;
        }
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          setErrorMessage(err.error || "تعذر إنشاء الحساب.");
          setSubmitting(false);
          return;
        }
        localStorage.setItem("earth_student_persistent_id", cleanId);
        localStorage.setItem("earth_student_persistent_name", cleanName);
        localStorage.setItem("earth_student_persistent_year", targetYear);
        localStorage.setItem("earth_student_persistent_spec", specialty);
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        window.location.href = "/student/login?mode=login&registered=1";
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: cleanPassword, role: "STUDENT" }),
      });
      if (!res.ok) {
        setErrorMessage("الرقم القومي أو كلمة المرور غير صحيحة.");
        setSubmitting(false);
        return;
      }
      sessionStorage.setItem("student_national_id", cleanId);
      const savedName = localStorage.getItem("earth_student_persistent_name") || "طالب أزهرية";
      const savedYear = localStorage.getItem("earth_student_persistent_year") || "الفرقة الأولى";
      const savedSpec = localStorage.getItem("earth_student_persistent_spec") || "تاريخ وحضارة";
      sessionStorage.setItem("student_name", savedName);
      sessionStorage.setItem("student_year", savedYear);
      sessionStorage.setItem("student_specialty", savedSpec);
      const check = await fetch("/api/student/assignment").then((r) => r.json()).catch(() => ({ hasChosen: false }));
      if (!check.hasChosen) router.replace("/student/select-assignment");
      else router.replace("/student");
    } catch {
      setErrorMessage("تعذر الاتصال بالخادم.");
      setSubmitting(false);
    }
  }

  if (!ready) return null;
  const isSignup = mode === "signup";

  return (
    <main className="h-screen w-screen overflow-hidden dir-rtl font-sans flex bg-white">
      {/* LEFT: Blue panel with illustration */}
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
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 flex items-center justify-center mb-3">
              <div className="w-20 h-20 bg-[#1e5eb8] rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/40">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-blue-50 rounded-xl p-2.5 flex items-center justify-center"><BookOpen className="w-5 h-5 text-blue-600" /></div>
              <div className="bg-emerald-50 rounded-xl p-2.5 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-emerald-600" /></div>
              <div className="bg-amber-50 rounded-xl p-2.5 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-amber-600" /></div>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-blue-100 rounded-full w-full" />
              <div className="h-2 bg-blue-100 rounded-full w-4/5" />
              <div className="h-2 bg-blue-100 rounded-full w-3/5" />
            </div>
          </div>

          <div className="absolute -top-5 -left-5 w-14 h-14 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-float border-2 border-white">
            <GraduationCap className="w-7 h-7 text-[#1e5eb8]" />
          </div>
          <div className="absolute -bottom-5 -right-5 w-14 h-14 bg-emerald-500 rounded-2xl shadow-2xl flex items-center justify-center animate-float-delayed">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-white/90 text-[11px] font-bold">
            منظومة EARTH — كلية اللغة العربية بالقاهرة
          </p>
        </div>
      </div>

      {/* RIGHT: Form */}
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
              <p className="text-[9px] text-gray-400 font-black tracking-[0.15em] mt-0.5">STUDENT PORTAL</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center px-6 md:px-10 lg:px-16 overflow-y-auto">
          <div className="w-full max-w-md mx-auto py-4">
            <div className="mb-5 animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                {isSignup ? "تسجيل حساب طالب" : "تسجيل الدخول"}
              </h1>
              <p className="text-sm text-gray-600 mt-2 font-bold">
                {isSignup ? "أنشئ حسابك الأكاديمي للبدء" : "ادخل بياناتك للمتابعة"}
              </p>
              <div className="w-12 h-1 bg-[#1e5eb8] rounded-full mt-3" />
            </div>

            {justRegistered && !isSignup && (
              <div className="mb-4 p-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center gap-2.5 animate-fade-in-up">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-xs font-bold text-emerald-800">تم إنشاء حسابك بنجاح! سجّل الدخول الآن.</p>
              </div>
            )}

            {alreadyExists && !isSignup && (
              <div className="mb-4 p-3.5 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center gap-2.5 animate-fade-in-up">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs font-bold text-amber-800">
                  هذا الرقم القومي مسجّل بالفعل. أدخل كلمة المرور للمتابعة.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-xs font-bold text-red-800">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignup && (
                <div>
                  <label className="block text-[11px] font-black text-gray-700 mb-1.5">الاسم الثلاثي *</label>
                  <div className="relative">
                    <input
                      type="text" required value={studentName}
                      onChange={(e) => { setStudentName(e.target.value); setErrorMessage(""); }}
                      placeholder="أدخل اسمك الثلاثي كما في الكارنيه..."
                      className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-bold focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-700 placeholder:font-bold"
                    />
                    <User className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">
                  {nationality === "مصري" ? "الرقم القومي (14 رقماً) *" : "رقم جواز السفر *"}
                </label>
                <div className="relative">
                  <input
                    type="text" required value={nationalId}
                    onChange={(e) => { setNationalId(e.target.value); setErrorMessage(""); setAlreadyExists(false); }}
                    placeholder={nationality === "مصري" ? "مثال: 30001011200010" : "أدخل رقم جواز السفر..."}
                    className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-mono font-bold focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-700 placeholder:font-bold"
                  />
                  <Hash className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">كلمة المرور (8 أحرف على الأقل) *</label>
                <div className="relative">
                  <input
                    type="password" required minLength={8} value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(""); }}
                    placeholder="أدخل كلمة مرور قوية..."
                    className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-mono font-bold focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-700 placeholder:font-bold"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              {isSignup && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-gray-700 mb-1.5">الجنسية *</label>
                      <select
                        value={nationality} onChange={(e) => setNationality(e.target.value)}
                        className="w-full p-3.5 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-bold focus:border-[#1e5eb8] focus:bg-white transition"
                      >
                        <option value="مصري">مصري</option>
                        <option value="وافد">وافد</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-700 mb-1.5">الفرقة *</label>
                      <select
                        value={targetYear} onChange={(e) => setTargetYear(e.target.value)}
                        className="w-full p-3.5 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-bold focus:border-[#1e5eb8] focus:bg-white transition"
                      >
                        <option>الفرقة الأولى</option>
                        <option>الفرقة الثانية</option>
                        <option>الفرقة الثالثة</option>
                        <option>الفرقة الرابعة</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-700 mb-1.5">الشعبة والتخصص *</label>
                    <select
                      value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full p-3.5 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-bold focus:border-[#1e5eb8] focus:bg-white transition"
                    >
                      <option>تاريخ وحضارة (عام)</option>
                      <option>تاريخ فقط</option>
                      <option>حضارة فقط</option>
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit" disabled={submitting}
                className="w-full bg-[#1e5eb8] hover:bg-[#1650a0] disabled:opacity-50 text-white font-black py-4 rounded-xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-3"
              >
                {isSignup ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                {submitting ? "جاري المعالجة..." : isSignup ? "إنشاء الحساب" : "تسجيل الدخول"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => {
                  setErrorMessage(""); setJustRegistered(false); setAlreadyExists(false);
                  const next = isSignup ? "login" : "signup";
                  setMode(next);
                  window.location.href = `/student/login?mode=${next}`;
                }}
                className="text-xs font-bold text-[#1e5eb8] hover:text-[#1650a0]"
              >
                {isSignup ? "لديك حساب؟ سجّل الدخول" : "ليس لديك حساب؟ أنشئ واحداً"}
              </button>
            </div>
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
        .animate-float-slow { animation: float 3.5s ease-in-out infinite 0.8s; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>
    </main>
  );
}
