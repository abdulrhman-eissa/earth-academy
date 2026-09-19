"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Send, User, Phone, MessageSquare, CheckCircle2, AlertTriangle,
  ArrowRight, Lock, X, Loader2, Mail, Inbox, Eye, GraduationCap,
  MessageCircle, Headphones, ShieldCheck,
} from "lucide-react";

interface ContactMsg {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("طالب");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [showInbox, setShowInbox] = useState(false);
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, role, message }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setError(data.error || "تعذر الإرسال"); setSending(false); return; }
      setSuccess(true);
      setFullName(""); setPhone(""); setMessage(""); setRole("طالب");
      setTimeout(() => setSuccess(false), 5000);
    } catch { setError("تعذر الاتصال بالخادم"); }
    finally { setSending(false); }
  }

  async function unlockInbox(e: React.FormEvent) {
    e.preventDefault();
    setInboxError("");
    setInboxLoading(true);
    try {
      const res = await fetch(`/api/contact?password=${encodeURIComponent(password)}`);
      if (res.status === 401) { setInboxError("كلمة المرور غير صحيحة"); setInboxLoading(false); return; }
      const data = (await res.json()) as { messages: ContactMsg[] };
      setMessages(data.messages ?? []);
      setUnlocked(true);
    } catch { setInboxError("تعذر الاتصال"); }
    finally { setInboxLoading(false); }
  }

  async function markRead(id: string) {
    await fetch(`/api/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
  }

  return (
    <main className="h-screen w-screen overflow-hidden dir-rtl font-sans flex bg-white">
      {/* LEFT: Blue panel with illustration */}
      <div className="hidden md:flex md:w-[45%] bg-[#1e5eb8] relative overflow-hidden items-center justify-center p-8">
        {/* Decorative curves */}
        <div className="absolute top-0 left-0 right-0 h-40">
          <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,60 C150,10 300,140 450,40 C530,0 570,30 600,60 L600,0 L0,0 Z" fill="#2b6fc9" />
          </svg>
        </div>
        <div className="absolute bottom-[-80px] left-[-80px] w-64 h-64 bg-[#2b6fc9] rounded-full" />
        <div className="absolute bottom-[-120px] right-[-60px] w-72 h-72 bg-[#1650a0] rounded-full" />

        {/* Illustration */}
        <div className="relative z-10 w-full max-w-md">
          <div className="relative bg-white rounded-2xl shadow-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
              </div>
              <Mail className="w-4 h-4 text-gray-400" />
            </div>

            {/* Messages preview */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
                  <div className="h-1.5 bg-gray-300 rounded-full w-1/3 mb-1.5" />
                  <div className="h-1.5 bg-gray-200 rounded-full w-full mb-1" />
                  <div className="h-1.5 bg-gray-200 rounded-full w-3/4" />
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
                  <div className="h-1.5 bg-gray-300 rounded-full w-1/2 mb-1.5" />
                  <div className="h-1.5 bg-gray-200 rounded-full w-5/6" />
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
                  <div className="h-1.5 bg-gray-300 rounded-full w-2/5 mb-1.5" />
                  <div className="h-1.5 bg-gray-200 rounded-full w-full" />
                </div>
              </div>
            </div>

            {/* Reply box */}
            <div className="bg-[#1e5eb8] rounded-xl p-3 flex items-center gap-2">
              <div className="flex-1 bg-white/20 rounded-lg h-7" />
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                <Send className="w-3.5 h-3.5 text-[#1e5eb8]" />
              </div>
            </div>
          </div>

          {/* Floating icons */}
          <div className="absolute -top-5 -left-5 w-14 h-14 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-float border-2 border-white">
            <MessageCircle className="w-7 h-7 text-[#1e5eb8]" />
          </div>
          <div className="absolute -bottom-5 -right-5 w-14 h-14 bg-emerald-500 rounded-2xl shadow-2xl flex items-center justify-center animate-float-delayed">
            <Headphones className="w-7 h-7 text-white" />
          </div>
          <div className="absolute top-1/2 -right-6 w-12 h-12 bg-amber-400 rounded-2xl shadow-2xl flex items-center justify-center animate-float-slow">
            <SparklesIcon />
          </div>
          <div className="absolute bottom-1/4 -left-7 w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-float-delayed border-2 border-white">
            <ShieldCheck className="w-6 h-6 text-[#1e5eb8]" />
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-white/90 text-[11px] font-bold">
            منظومة EARTH — قسم التاريخ والحضارة
          </p>
        </div>
      </div>

      {/* RIGHT: White panel with form */}
      <div className="flex-1 flex flex-col relative bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 md:px-10 py-5">
          <Link
            href="/"
            className="group flex items-center gap-2 text-gray-600 hover:text-[#1e5eb8] transition text-xs font-bold"
          >
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
              <p className="text-[9px] text-gray-400 font-black tracking-[0.15em] mt-0.5">SUPPORT</p>
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center px-6 md:px-10 lg:px-16 overflow-y-auto">
          <div className="w-full max-w-md mx-auto py-4">
            <div className="mb-6 animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                التواصل والدعم
              </h1>
              <p className="text-sm text-gray-600 mt-2 font-bold">
                أرسل استفسارك لفريق التطوير
              </p>
              <div className="w-12 h-1 bg-[#1e5eb8] rounded-full mt-3" />
            </div>

            {success && (
              <div className="mb-4 p-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center gap-2.5 animate-fade-in-up">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-xs font-bold text-emerald-800">تم إرسال رسالتك بنجاح!</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-xs font-bold text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">الاسم الكامل *</label>
                <div className="relative">
                  <input
                    type="text" required value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="أدخل اسمك الكامل هنا..."
                    className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-bold focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-700 placeholder:font-bold"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-gray-700 mb-1.5">رقم الهاتف *</label>
                  <div className="relative">
                    <input
                      type="tel" required value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="مثال: 01012345678"
                      className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-mono font-bold focus:border-[#1e5eb8] focus:bg-white transition placeholder:text-gray-700 placeholder:font-bold"
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-700 mb-1.5">الصفة *</label>
                  <select
                    value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 outline-none font-bold focus:border-[#1e5eb8] focus:bg-white transition"
                  >
                    <option value="طالب">طالب</option>
                    <option value="عضو هيئة تدريس">عضو هيئة تدريس</option>
                    <option value="شؤون طلاب">شؤون طلاب</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-700 mb-1.5">الرسالة *</label>
                <div className="relative">
                  <textarea
                    required value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="اكتب رسالتك بالتفصيل هنا..."
                    className="w-full p-3.5 pr-11 border-2 border-gray-300 rounded-xl text-sm bg-gray-50 outline-none font-bold focus:border-[#1e5eb8] focus:bg-white transition resize-none placeholder:text-gray-700 placeholder:font-bold"
                  />
                  <MessageSquare className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">{message.length} / 5000</p>
              </div>

              <button
                type="submit" disabled={sending}
                className="w-full bg-[#1e5eb8] hover:bg-[#1650a0] disabled:opacity-50 text-white font-black py-4 rounded-xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-2"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {sending ? "جاري الإرسال..." : "إرسال الرسالة"}
              </button>
            </form>

            {/* Hidden inbox trigger */}
            <button
              onClick={() => setShowInbox(true)}
              className="mt-4 text-[10px] text-gray-300 hover:text-gray-500 font-bold flex items-center gap-1 mx-auto transition"
              title="صندوق الرسائل"
            >
              <Lock className="w-3 h-3" /> صندوق الرسائل
            </button>
          </div>
        </div>
      </div>

      {/* Inbox Modal */}
      {showInbox && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-gray-200">
            <div className="bg-[#1e5eb8] p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">صندوق الرسائل</h3>
                  <p className="text-[10px] text-blue-100 font-bold">منطقة محمية — للمطوّر المسؤول</p>
                </div>
              </div>
              <button onClick={() => { setShowInbox(false); setUnlocked(false); setPassword(""); setMessages([]); }} className="text-white/70 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!unlocked ? (
              <form onSubmit={unlockInbox} className="p-6 space-y-4 bg-gray-50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-7 h-7 text-[#1e5eb8]" />
                  </div>
                  <h4 className="font-black text-gray-900 text-base mb-1">منطقة محمية</h4>
                  <p className="text-[11px] text-gray-500 font-bold">أدخل كلمة المرور الشخصية للمطوّر</p>
                </div>
                {inboxError && (
                  <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-xs font-bold text-red-700 text-center">
                    {inboxError}
                  </div>
                )}
                <input
                  type="password" autoFocus value={password}
                  onChange={(e) => { setPassword(e.target.value); setInboxError(""); }}
                  placeholder="أدخل كلمة المرور..."
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl text-sm bg-white outline-none font-mono font-bold text-center focus:border-[#1e5eb8] transition placeholder:text-gray-600 placeholder:font-bold"
                />
                <button
                  type="submit" disabled={inboxLoading}
                  className="w-full bg-[#1e5eb8] hover:bg-[#1650a0] disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition flex items-center justify-center gap-2"
                >
                  {inboxLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                  فتح الصندوق
                </button>
              </form>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <Inbox className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-400">لا توجد رسائل</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => { if (!m.isRead) void markRead(m.id); }}
                      className={`bg-white rounded-2xl p-4 border-2 cursor-pointer transition ${
                        m.isRead ? "border-gray-200" : "border-blue-300 shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-black text-gray-900 text-sm">{m.fullName}</p>
                          <p className="text-[11px] text-gray-500 font-mono font-bold">{m.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-1 rounded-lg">
                            {m.role}
                          </span>
                          {!m.isRead && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-bold">{m.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2 font-mono">
                        {new Date(m.createdAt).toLocaleString("ar-EG")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

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

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
      <path d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14z" opacity="0.7" />
      <path d="M5 14l.6 1.9L7.5 16.5l-1.9.6L5 19l-.6-1.9L2.5 16.5l1.9-.6L5 14z" opacity="0.7" />
    </svg>
  );
}
