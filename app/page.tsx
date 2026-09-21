"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import {
  GraduationCap, UserCheck, Building2, Settings, ShieldCheck,
  BookOpen, Award, ArrowLeft, FileText, Users, BarChart3,
  CheckCircle2, Laptop, Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="h-screen w-screen overflow-hidden dir-rtl font-sans flex bg-white">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle variant="light" />
      </div>
      {/* LEFT: Blue panel with illustration */}
      <div className="hidden md:flex md:w-[45%] bg-[#1e5eb8] relative overflow-hidden items-center justify-center p-8">
        {/* Decorative curves top */}
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

        {/* Decorative circles bottom */}
        <div className="absolute bottom-[-80px] left-[-80px] w-64 h-64 bg-[#2b6fc9] rounded-full" />
        <div className="absolute bottom-[-120px] right-[-60px] w-72 h-72 bg-[#1650a0] rounded-full" />

        {/* Illustration */}
        <div className="relative z-10 w-full max-w-md">
          {/* Main board */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-5">
            {/* Header dots */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
              </div>
            </div>

            {/* Dashboard content */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100">
                <FileText className="w-4 h-4 text-blue-600 mb-1.5" />
                <div className="h-1.5 bg-blue-200 rounded-full w-full mb-1" />
                <div className="h-1.5 bg-blue-200 rounded-full w-3/4" />
              </div>
              <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
                <Award className="w-4 h-4 text-emerald-600 mb-1.5" />
                <div className="h-1.5 bg-emerald-200 rounded-full w-full mb-1" />
                <div className="h-1.5 bg-emerald-200 rounded-full w-2/3" />
              </div>
              <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100">
                <Users className="w-4 h-4 text-amber-600 mb-1.5" />
                <div className="h-1.5 bg-amber-200 rounded-full w-full mb-1" />
                <div className="h-1.5 bg-amber-200 rounded-full w-4/5" />
              </div>
            </div>

            {/* Chart area */}
            <div className="grid grid-cols-5 gap-2.5">
              <div className="col-span-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-end justify-between h-16 gap-1.5">
                  <div className="w-2 bg-blue-400 rounded-t" style={{ height: "40%" }} />
                  <div className="w-2 bg-blue-500 rounded-t" style={{ height: "70%" }} />
                  <div className="w-2 bg-blue-600 rounded-t" style={{ height: "55%" }} />
                  <div className="w-2 bg-emerald-500 rounded-t" style={{ height: "85%" }} />
                  <div className="w-2 bg-amber-500 rounded-t" style={{ height: "60%" }} />
                  <div className="w-2 bg-pink-500 rounded-t" style={{ height: "75%" }} />
                </div>
              </div>
              <div className="col-span-2 bg-gray-50 rounded-xl p-2.5 border border-gray-100 flex flex-col justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600 mb-1.5" />
                <div className="h-1.5 bg-purple-200 rounded-full w-full mb-1" />
                <div className="h-1.5 bg-purple-200 rounded-full w-2/3" />
              </div>
            </div>
          </div>

          {/* Floating: GraduationCap */}
          <div className="absolute -top-5 -left-5 w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-float border-2 border-white">
            <GraduationCap className="w-8 h-8 text-[#1e5eb8]" />
          </div>

          {/* Floating: CheckCircle */}
          <div className="absolute -bottom-5 -right-5 w-14 h-14 bg-emerald-500 rounded-2xl shadow-2xl flex items-center justify-center animate-float-delayed">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>

          {/* Floating: Laptop */}
          <div className="absolute top-1/2 -right-6 w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-float-slow border-2 border-white">
            <Laptop className="w-6 h-6 text-[#1e5eb8]" />
          </div>

          {/* Floating: Sparkles */}
          <div className="absolute top-1/4 -left-6 w-11 h-11 bg-amber-400 rounded-2xl shadow-2xl flex items-center justify-center animate-float">
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          {/* Floating: BookOpen */}
          <div className="absolute bottom-1/4 -left-7 w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-float-delayed border-2 border-white">
            <BookOpen className="w-6 h-6 text-[#1e5eb8]" />
          </div>

          {/* Floating small circles */}
          <div className="absolute top-1/3 right-[-30px] w-3 h-3 bg-white rounded-full opacity-60" />
          <div className="absolute bottom-1/3 left-[-40px] w-2 h-2 bg-white rounded-full opacity-60" />
        </div>

        {/* Bottom text inside blue panel */}
        <div className="absolute bottom-6 left-0 right-0 text-center px-4">
          <div className="inline-flex flex-col items-center gap-2">
            {/* Line 1: University */}
            <p className="text-white/95 text-[12px] font-black tracking-wide">
              جامعة الأزهر الشريف
            </p>
            {/* Separator */}
            <div className="flex items-center gap-2 w-full">
              <span className="h-px flex-1 bg-white/30" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
              <span className="h-px flex-1 bg-white/30" />
            </div>
            {/* Line 2: Faculty */}
            <p className="text-white/80 text-[11px] font-bold">
              كلية اللغة العربية بالقاهرة
            </p>
            {/* Line 3: Department - highlighted */}
            <div className="mt-1 inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
              <p className="text-amber-100 text-[11px] font-black">
                قسم التاريخ والحضارة
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: White panel with content */}
      <div className="flex-1 flex flex-col relative bg-white">
        {/* Top bar with settings gear */}
        <div className="flex items-center justify-between px-6 md:px-10 py-5">
          <Link
            href="/contact"
            className="group relative flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl bg-white border-2 border-blue-100 hover:border-[#1e5eb8] hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
            title="التواصل مع المطور"
          >
            {/* Gear Icon - دائرة زرقاء واضحة */}
            <div className="relative w-11 h-11 rounded-full bg-[#1e5eb8] flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <Settings className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-700" strokeWidth={2.5} />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
            </div>

            {/* Developer Info */}
            <div className="hidden md:flex flex-col items-start leading-none">
              <span className="text-[10px] font-black text-gray-500 mb-1.5 tracking-wide">تطوير المنظومة</span>
              <span className="text-base font-black text-[#1e5eb8] group-hover:text-[#1650a0] transition-all duration-300 group-hover:tracking-wide whitespace-nowrap">
                عبدالرحمن عوض سعد
              </span>
            </div>

            {/* Mobile only */}
            <span className="md:hidden text-xs font-black text-[#1e5eb8]">المطور</span>
          </Link>

          {/* Logo top */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1e5eb8] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-[#1e5eb8] text-lg leading-none">EARTH</p>
              <p className="text-[9px] text-gray-400 font-black tracking-[0.15em] mt-0.5">ACADEMIC PLATFORM</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center px-6 md:px-10 lg:px-16">
          <div className="w-full max-w-md mx-auto">
            {/* Title */}
            <div className="mb-8 animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                بوابة الدخول <br className="md:hidden" /> الأكاديمية
              </h1>
              <p className="text-sm text-gray-600 mt-3 font-bold leading-relaxed">
                اختر بوابتك للدخول إلى منظومة الأبحاث العلمية
              </p>
              <div className="w-12 h-1 bg-[#1e5eb8] rounded-full mt-4" />
            </div>

            {/* Role cards */}
            <div className="space-y-3.5">
              <RoleCard
                href="/student/login"
                icon={<GraduationCap className="w-6 h-6" />}
                title="بوابة الطالب"
                color="blue"
                delay="0s"
              />
              <RoleCard
                href="/faculty/login"
                icon={<UserCheck className="w-6 h-6" />}
                title="عضو هيئة التدريس"
                color="emerald"
                delay="0.08s"
              />
              <RoleCard
                href="/affairs/login"
                icon={<Building2 className="w-6 h-6" />}
                title="شؤون الطلاب والعمادة"
                color="amber"
                delay="0.16s"
              />
            </div>

            {/* Security note */}
            <div className="mt-8 flex items-center gap-2 text-xs text-gray-500 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#1e5eb8]" />
              <span>منظومة مؤمّنة بالكامل — البيانات مشفّرة</span>
            </div>
          </div>
        </div>

        {/* Footer */}
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
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-float { animation: float 3.5s ease-in-out infinite; }
        .animate-float-delayed { animation: float 3s ease-in-out infinite 0.4s; }
        .animate-float-slow { animation: float 3.5s ease-in-out infinite 0.8s; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-slide-in { animation: slideIn 0.4s ease-out both; }
      `}</style>
    </main>
  );
}

function RoleCard({
  href, icon, title, color, delay,
}: {
  href: string; icon: React.ReactNode; title: string;
  color: "blue" | "emerald" | "amber"; delay: string;
}) {
  const colors = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      hoverBorder: "hover:border-blue-500",
      iconBg: "bg-[#1e5eb8]",
      iconShadow: "shadow-blue-500/30",
      arrow: "text-blue-600",
    },
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      hoverBorder: "hover:border-emerald-500",
      iconBg: "bg-emerald-600",
      iconShadow: "shadow-emerald-500/30",
      arrow: "text-emerald-600",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      hoverBorder: "hover:border-amber-500",
      iconBg: "bg-amber-600",
      iconShadow: "shadow-amber-500/30",
      arrow: "text-amber-600",
    },
  };
  const c = colors[color];

  return (
    <Link
      href={href}
      style={{ animationDelay: delay }}
      className={`group flex items-center gap-4 p-4 rounded-2xl ${c.bg} border-2 ${c.border} ${c.hoverBorder} hover:shadow-lg transition-all duration-300 animate-slide-in`}
    >
      <div className={`w-12 h-12 rounded-2xl ${c.iconBg} flex items-center justify-center text-white shadow-lg ${c.iconShadow} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
        {icon}
      </div>
      <p className="font-black text-gray-900 text-base md:text-lg flex-1">{title}</p>
      <ArrowLeft className={`w-5 h-5 ${c.arrow} group-hover:-translate-x-1 transition-all flex-shrink-0`} />
    </Link>
  );
}
