"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, Send, Timer } from "lucide-react";

export default function AntiAiEditor() {
  const [text, setText] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pasteAttempts, setPasteAttempts] = useState(0);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [defenseAnswer, setDefenseAnswer] = useState("");
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSubmitted && timeLeft > 0 && !submittedSuccessfully) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft, submittedSuccessfully]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setPasteAttempts((prev) => prev + 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!startTime) setStartTime(Date.now());
    setText(e.target.value);
  };

  const handleSubmit = () => {
    if (wordCount < 10) {
      alert("يرجى كتابة تحليل مكتمل قبل التسليم.");
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
          text,
          pasteAttempts,
          defenseAnswer,
        }),
      });
      setSubmittedSuccessfully(true);
    } catch {
      alert("حدث خطأ أثناء التسليم، يرجى المحاولة مرة أخرى.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200 text-right dir-rtl font-sans">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">محرر صياغة التحليل والنصوص</h2>
        </div>
        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> نظام النزاهة الأكاديمية مفعل
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
            onChange={handleChange}
            onPaste={handlePaste}
            rows={10}
            placeholder="اكتب التحليل الخاص بك هنا بخط يدك... (النسخ واللصق محظور تماماً)"
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-800 text-lg leading-relaxed"
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
            سؤال مباشر على تحليلكم: <strong>&quot;ما السند الأكاديمي أو القاعدة الرئيسية التي اعتمدت عليها في استنتاجك المكتوب؟&quot;</strong>
          </p>

          <input
            type="text"
            value={defenseAnswer}
            onChange={(e) => setDefenseAnswer(e.target.value)}
            placeholder="اكتب إجابة سريعة وموجزة لتأكيد فهمك..."
            className="w-full p-3 border border-amber-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 mb-4 bg-white text-gray-800"
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
          <p className="text-gray-600">تم تسجيل بصمة الكتابة وإثبات النزاهة الأكاديمية بنسبة 100%.</p>
        </div>
      )}
    </div>
  );
}