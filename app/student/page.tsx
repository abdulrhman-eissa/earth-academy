"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, Send, Timer, ArrowRight, UserCheck } from "lucide-react";
import Link from "next/link";

export default function StudentPage() {
  // 1. بيانات الطالب الإجبارية
  const [studentInfo, setStudentInfo] = useState({
    fullName: "",
    nationalIdOrCard: "",
    gradeYear: "",
    department: "",
    nationality: "مصري",
  });
  const [isFormCompleted, setIsFormCompleted] = useState(false);

  // 2. حالة المحرر والتكليف
  const [text, setText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [pasteAttempts, setPasteAttempts] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [defenseAnswer, setDefenseAnswer] = useState("");
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

  useEffect(() => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(text.trim() === "" ? 0 : words.length);
  }, [text]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSubmitted && timeLeft > 0 && !submittedSuccessfully) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft, submittedSuccessfully]);

  const handleStartAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !studentInfo.fullName.trim() ||
      !studentInfo.nationalIdOrCard.trim() ||
      !studentInfo.gradeYear.trim() ||
      !studentInfo.department.trim()
    ) {
      alert("يرجى ملء جميع البيانات الأكاديمية المطلوبة بشكل صحيح قبل البدء.");
      return;
    }
    setIsFormCompleted(true);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setPasteAttempts((prev) => prev + 1);
  };

  const handleSubmit = () => {
    if (wordCount < 10) {
      alert("يرجى كتابة تحليل مكتمل قبل التسليم (10 كلمات على الأقل).");
      return;
    }
    setIsSubmitted(true);
  };

  const handleFinalSubmit = async () => {
    if (!defenseAnswer.trim()) {
      alert("يرجى الإجابة على سؤال إثبات النزاهة.");
      return;
    }

    try {
      await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentInfo.fullName,
          studentId: studentInfo.nationalIdOrCard,
          gradeYear: studentInfo.gradeYear,
          department: studentInfo.department,
          nationality: studentInfo.nationality,
          text,
          pasteAttempts,
          defenseAnswer,
        }),
      });
      setSubmittedSuccessfully(true);
    } catch (e) {
      alert("حدث خطأ أثناء التسليم.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8 dir-rtl font-sans text-right">
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">بوابة الطالب - تقديم التكليفات</h1>
          <p className="text-xs text-gray-600">منصة مَداوَلَة - بيئة الصياغة الآمنة</p>
        </div>
        <Link href="/" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <ArrowRight className="w-4 h-4" /> الخروج لصفحة الدخول
        </Link>
      </div>

      {!isFormCompleted ? (
        /* 1. نموذج استيفاء بيانات الطالب الرسمية */
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <UserCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">إستيفاء البيانات الأكاديمية للطالب</h2>
          </div>
          <p className="text-xs text-gray-500 mb-6">
            يرجى إدخال بياناتك الرسمية بدقة كما هي مسجلة بالكلية قبل فتح محرر صياغة البحث.
          </p>

          <form onSubmit={handleStartAssignment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                الاسم بالكامل (كما هو مدون في الكارنيه أو البطاقة) *
              </label>
              <input
                type="text"
                required
                value={studentInfo.fullName}
                onChange={(e) => setStudentInfo({ ...studentInfo, fullName: e.target.value })}
                placeholder="أدخل اسمك الرباعي الرسمى..."
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  رقم القيد / الرقم القومي *
                </label>
                <input
                  type="text"
                  required
                  value={studentInfo.nationalIdOrCard}
                  onChange={(e) => setStudentInfo({ ...studentInfo, nationalIdOrCard: e.target.value })}
                  placeholder="مثال: 202410098"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الفرقة الدراسية *</label>
                <select
                  value={studentInfo.gradeYear}
                  onChange={(e) => setStudentInfo({ ...studentInfo, gradeYear: e.target.value })}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-500">اختر الفرقة...</option>
                  <option value="الفرقة الأولى" className="text-gray-900">الفرقة الأولى</option>
                  <option value="الفرقة الثانية" className="text-gray-900">الفرقة الثانية</option>
                  <option value="الفرقة الثالثة" className="text-gray-900">الفرقة الثالثة</option>
                  <option value="الفرقة الرابعة" className="text-gray-900">الفرقة الرابعة</option>
                  <option value="دراسات عليا" className="text-gray-900">دراسات عليا</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">التخصص / الشعبة *</label>
                <input
                  type="text"
                  required
                  value={studentInfo.department}
                  onChange={(e) => setStudentInfo({ ...studentInfo, department: e.target.value })}
                  placeholder="مثال: الشريعة والقانون / القانون العام"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الجنسية *</label>
                <input
                  type="text"
                  required
                  value={studentInfo.nationality}
                  onChange={(e) => setStudentInfo({ ...studentInfo, nationality: e.target.value })}
                  placeholder="مثال: مصري / وافد"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition mt-4"
            >
              تأكيد البيانات والدخول لمحرر البحث
            </button>
          </form>
        </div>
      ) : (
        /* 2. محرر الكتابة التفاعلي */
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-800">محرر صياغة التحليل والنصوص</h2>
              <p className="text-xs text-gray-500 mt-1">
                الطالب: <strong className="text-gray-800">{studentInfo.fullName}</strong> | {studentInfo.gradeYear} ({studentInfo.department})
              </p>
            </div>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> نظام النزاهة مفعل
            </span>
          </div>

          {!isSubmitted ? (
            <>
              {pasteAttempts > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>
                    تنبيه ({pasteAttempts}): تم محظر لصق النصوص الخارجية لضمان النزاهة وكتابة الإجابة بجهدك الذاتي.
                  </span>
                </div>
              )}

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPaste={handlePaste}
                rows={10}
                placeholder="اكتب التحليل الخاص بك هنا بخط يدك... (النسخ واللصق محظور تماماً)"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-900 bg-white placeholder-gray-400 text-lg leading-relaxed"
              />

              <div className="mt-4 flex justify-between items-center text-sm text-gray-600 pt-2 border-t border-gray-50">
                <div>
                  <span>عدد الكلمات: <strong className="text-gray-900 font-bold">{wordCount}</strong></span>
                </div>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <Send className="w-4 h-4" /> تسليم التكليف
                </button>
              </div>
            </>
          ) : !submittedSuccessfully ? (
            <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="text-amber-600" /> مرحلة إثبات الفهم والنزاهة الأكاديمية
                </h3>
                <div className="flex items-center gap-1 text-red-600 font-mono font-bold bg-white px-3 py-1 rounded border border-red-200">
                  <Timer className="w-4 h-4 animate-pulse" /> {timeLeft} ثانية
                </div>
              </div>

              <p className="text-gray-800 mb-3 font-medium">
                سؤال مباشر على تحليلكم: <strong>"ما السند الأكاديمي أو القاعدة الرئيسية التي اعتمدت عليها في استنتاجك المكتوب؟"</strong>
              </p>

              <input
                type="text"
                value={defenseAnswer}
                onChange={(e) => setDefenseAnswer(e.target.value)}
                placeholder="اكتب إجابة سريعة وموجزة لتأكيد فهمك..."
                className="w-full p-3 border border-amber-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 mb-4 bg-white text-gray-900 placeholder-gray-400"
              />

              <button
                onClick={handleFinalSubmit}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg transition"
              >
                تأكيد وإرسال النهائي
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-gray-800 mb-1">تم تسليم التكليف بنجاح!</h3>
              <p className="text-gray-600">تم تسجيل بصمة الكتابة وإرسال التكليف وبياناتك الرسمية إلى لوحة تحكم الدكتور.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}