"use client";

import React, { useState, useEffect } from "react";
import { User, Clock, AlertTriangle, FileText, ShieldCheck, ArrowRight, Eye, X } from "lucide-react";
import Link from "next/link";

export default function FacultyPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      setSubmissions(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8 dir-rtl font-sans text-right text-gray-900">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">بوابة عضو الهيئة التدريسية</h1>
          <p className="text-xs text-gray-600">منصة مَداوَلَة - نظام مراقبة النزاهة والتكليفات الأكاديمية</p>
        </div>
        <Link href="/" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <ArrowRight className="w-4 h-4" /> الخروج لصفحة الدخول
        </Link>
      </div>

      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" /> لوحة تقييم النزاهة والتكليفات
            </h2>
            <p className="text-xs text-gray-500 mt-1">عرض حي ومباشر لبصمات الكتابة والبيانات الرسمية للطلاب</p>
          </div>
          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-200">
            د. كليّات الشريعة والقانون
          </span>
        </div>

        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-10 h-10 mx-auto text-gray-300 mb-2 animate-spin" />
              <p className="text-sm">في انتظار أول تسليم من بوابة الطلاب...</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white transition shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-indigo-100 rounded-full text-indigo-600 mt-1">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{sub.studentName}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-1">
                        <span>رقم القيد/القومي: <strong className="text-gray-800">{sub.studentId}</strong></span>
                        <span>•</span>
                        <span>{sub.gradeYear || "الفرقة غير محددة"} ({sub.department || "عام"})</span>
                        {sub.nationality && (
                          <>
                            <span>•</span>
                            <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-[11px] font-medium">{sub.nationality}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left flex flex-col items-end gap-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      sub.statusColor === "green" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      مؤشر النزاهة: {sub.integrityScore}%
                    </span>
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> معاينة البحث والتكليف
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-white p-3 rounded border border-gray-100 text-gray-600 mt-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>وقت التسليم: <strong className="text-gray-800">{sub.submitTime}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className={`w-3.5 h-3.5 ${sub.pasteAttempts > 0 ? "text-amber-500" : "text-green-500"}`} />
                    <span>محاولات اللصق: <strong className={sub.pasteAttempts > 0 ? "text-amber-600 font-bold" : "text-gray-800"}>{sub.pasteAttempts}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>اختبار الدفاع: <strong className="text-gray-800">{sub.defenseStatus}</strong></span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* نافذة المعاينة */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 text-right dir-rtl">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">تفاصيل التكليف واختبار النزاهة</h3>
                <p className="text-xs text-gray-500">الطالب: {selectedSubmission.studentName} ({selectedSubmission.studentId})</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-800">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-700 text-xs mb-2">النص المكتوب بخط يد الطالب:</h4>
                <p className="whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-gray-100 text-gray-900">
                  {selectedSubmission.text || "لم يتم تسجيل كود النص أو إرساله."}
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="font-bold text-amber-900 text-xs mb-1">إجابة سؤال إثبات الفهم (الدفاع السريع):</h4>
                <p className="font-medium text-amber-950 bg-white p-2.5 rounded border border-amber-100">
                  {selectedSubmission.defenseAnswer || selectedSubmission.defenseStatus}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-lg text-xs transition"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}