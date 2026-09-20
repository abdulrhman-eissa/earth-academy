"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Lock, ShieldCheck, ShieldAlert, CheckCircle2,
  Loader2, KeyRound, GraduationCap, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { PasswordStrengthBar, PasswordRequirements, ConfirmPasswordMatch } from "@/components/PasswordStrength";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.authenticated || !data.session) {
          router.replace("/");
          return;
        }
        setRole(data.session.role);

        const name =
          sessionStorage.getItem("student_name") ||
          sessionStorage.getItem("faculty_name") ||
          localStorage.getItem("earth_student_persistent_name") ||
          "المستخدم";
        setUserName(name);
        setLoading(false);
      })
      .catch(() => router.replace("/"));
    return () => { cancelled = true; };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("جميع الحقول مطلوبة");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور الجديدتان غير متطابقتين");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean };

      if (!res.ok) {
        setError(data.error || "تعذر تغيير كلمة المرور");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        // نرجع المستخدم للوحة حسب دوره
        if (role === "STUDENT") router.replace("/student");
        else if (role === "FACULTY") router.replace("/faculty");
        else if (role === "AFFAIRS") router.replace("/affairs");
        else if (role === "ADMIN") router.replace("/contact/admin");
        else router.replace("/");
      }, 3000);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
        <Loader2 className="w-12 h-12 text-[#1e5eb8] animate-spin" />
        <p className="text-sm font-black text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 font-sans flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header Card */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-lg overflow-hidden">

          {/* Top gradient */}
          <div className="bg-gradient-to-br from-[#1e5eb8] to-[#1650a0] p-6 text-center">
            <div className="w-16 h-16 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-black text-xl text-white mb-1">تغيير كلمة المرور</h1>
            <p className="text-xs text-blue-100 font-bold">{userName}</p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-emerald-800">تم تغيير كلمة المرور بنجاح!</p>
                  <p className="text-xs font-bold text-emerald-700 mt-1">سيتم توجيهك للوحة خلال لحظات...</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">كلمة المرور الحالية *</label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                    required
                    disabled={success}
                    placeholder="أدخل كلمة المرور الحالية..."
                    className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-mono font-bold focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-500 disabled:opacity-60"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] font-black text-gray-400 mb-3">كلمة المرور الجديدة</p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">كلمة المرور الجديدة *</label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    required
                    minLength={10}
                    disabled={success}
                    placeholder="مثال: MyEarth@2026"
                    className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-mono font-bold focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-500 disabled:opacity-60"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
                {newPassword && (
                  <>
                    <PasswordStrengthBar password={newPassword} />
                    <PasswordRequirements password={newPassword} />
                  </>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">تأكيد كلمة المرور الجديدة *</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    required
                    minLength={10}
                    disabled={success}
                    placeholder="أعد كتابة كلمة المرور..."
                    className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-mono font-bold focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-500 disabled:opacity-60"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
                <ConfirmPasswordMatch password={newPassword} confirm={confirmPassword} />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || success}
                className="w-full bg-[#1e5eb8] hover:bg-[#1650a0] disabled:opacity-50 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    تغيير كلمة المرور
                  </>
                )}
              </button>
            </form>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                بعد تغيير كلمة المرور، ستُنهى جميع الجلسات الأخرى على الأجهزة الأخرى.
              </p>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-4 text-center">
          <Link
            href={role === "STUDENT" ? "/student" : role === "FACULTY" ? "/faculty" : role === "AFFAIRS" ? "/affairs" : "/contact/admin"}
            className="text-xs font-black text-gray-500 hover:text-[#1e5eb8] inline-flex items-center gap-1.5 transition"
          >
            <ArrowRight className="w-3.5 h-3.5" /> العودة للوحة
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-400 font-bold mt-4">
          منظومة EARTH © {new Date().getFullYear()} — جامعة الأزهر الشريف
        </p>
      </div>
    </div>
  );
}
