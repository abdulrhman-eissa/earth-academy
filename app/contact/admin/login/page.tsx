"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, ArrowRight, LogIn, Mail, Lock, GraduationCap, Crown } from "lucide-react";
import Link from "next/link";
import { sanitizeInput, detectMaliciousPattern } from "@/lib/security";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    const cleanEmail = sanitizeInput(email).trim().toLowerCase();

    if (detectMaliciousPattern(email) || detectMaliciousPattern(password)) {
      setErrorMessage("حظر أمني: تم رصد محاولة إدخال رموز خبيثة.");
      return;
    }
    
    if (!cleanEmail.includes("@") || password.length < 8) {
      setErrorMessage("يرجى إدخال البريد وكلمة المرور بشكل صحيح.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password, role: "ADMIN" }),
      });
      if (!res.ok) {
        setErrorMessage("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        setSubmitting(false);
        return;
      }
      window.location.href = "/contact/admin";
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
        <div className="absolute bottom-[-80px] left-[-80px] w-64 h-64 bg-[#2b6fc9] rounded-full" />
        <div className="absolute bottom-[-120px] right-[-60px] w-72 h-72 bg-[#1650a0] rounded-full" />

        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-5 animate-float">
            <Crown className="w-12 h-12 text-[#1e5eb8]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">لوحة المبرمج</h2>
          <p className="text-blue-100 text-sm font-bold leading-relaxed">
            دخول محمي لكامل صلاحيات المنظومة
          </p>

          <div className="mt-8 bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <p className="text-xs font-black text-emerald-200">منطقة حساسة</p>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed font-bold">
              جميع العمليات تُسجّل تلقائياً.
            </p>
          </div>
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
              <p className="text-[9px] text-gray-400 font-black tracking-[0.15em] mt-0.5">ADMIN PORTAL</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center px-6 md:px-10 lg:px-16">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-7 animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                لوحة المبرمج
              </h1>
              <p className="text-sm text-gray-600 mt-2 font-bold">صلاحيات كاملة على المنظومة</p>
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
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">البريد الإلكتروني *</label>
                <div className="relative">
                  <input
                    type="email" required value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMessage(""); }}
                    placeholder="مثال: admin@earth.edu"
                    className="w-full p-4 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-bold text-gray-900 focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-700"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">كلمة المرور *</label>
                <div className="relative">
                  <input
                    type="password" required minLength={8} value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(""); }}
                    placeholder="أدخل كلمة المرور..."
                    className="w-full p-4 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-mono font-bold text-gray-900 focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-700"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              <button
                type="submit" disabled={submitting}
                className="w-full bg-[#1e5eb8] hover:bg-[#1650a0] disabled:opacity-50 text-white font-black py-4 rounded-xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-3"
              >
                <LogIn className="w-5 h-5" />
                {submitting ? "جاري التحقق..." : "الدخول للوحة"}
              </button>
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
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-float { animation: float 3.5s ease-in-out infinite; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>
    </main>
  );
}
