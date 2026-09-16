"use client";

import Link from "next/link";
import { UserCheck, GraduationCap, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6 dir-rtl font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">منصة مَداوَلَة</h1>
        <p className="text-sm text-gray-600 mb-8">نظام إدارة التكليفات الأكاديمية وضمان النزاهة ضد الذكاء الاصطناعي</p>

        <div className="space-y-4">
          <Link
            href="/student"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-md"
          >
            <GraduationCap className="w-5 h-5" /> الدخول كـ (طالـب)
          </Link>

          <Link
            href="/faculty"
            className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3.5 px-4 rounded-xl border border-indigo-200 flex items-center justify-center gap-3 transition"
          >
            <UserCheck className="w-5 h-5" /> الدخول كـ (عضو هيئة تدريس)
          </Link>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400">
          حقوق الملكية والنظام الفني © 2026 منصة مداولة
        </div>
      </div>
    </main>
  );
}