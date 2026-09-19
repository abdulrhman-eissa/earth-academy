"use client";

import React from "react";
import { User, AlertTriangle, Clock, ShieldCheck, FileText } from "lucide-react";

export default function FacultyDashboard() {
  // بيانات تجريبية للتكليفات المستلمة من الطلاب
  const submissions = [
    {
      id: 1,
      studentName: "أحمد محمود علي",
      studentId: "20241001",
      course: "القانون الجنائي - الموقف 3",
      submitTime: "10:45 ص",
      pasteAttempts: 0,
      defenseStatus: "مكتمل بنجاح (خلال 22 ثانية)",
      integrityScore: 98,
      statusColor: "green",
    },
    {
      id: 2,
      studentName: "سارة محمد إبراهيم",
      studentId: "20241085",
      course: "القانون الجنائي - الموقف 3",
      submitTime: "11:10 ص",
      pasteAttempts: 4,
      defenseStatus: "مكتمل (بطيء - 58 ثانية)",
      integrityScore: 72,
      statusColor: "amber",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border border-gray-200 text-right dir-rtl font-sans">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" /> لوحة تقييم النزاهة والتكليفات (عضو التدريس)
          </h2>
          <p className="text-xs text-gray-500 mt-1">عرض بصمات الكتابة الحية ومؤشرات النزاهة الأكاديمية</p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-200">
          د. كليّات الشريعة والقانون
        </span>
      </div>

      <div className="space-y-4">
        {submissions.map((sub) => (
          <div key={sub.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white transition shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{sub.studentName}</h3>
                  <span className="text-xs text-gray-500">رقم قيد: {sub.studentId} | {sub.course}</span>
                </div>
              </div>
              <div className="text-left">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  sub.statusColor === "green" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                }`}>
                  مؤشر النزاهة: {sub.integrityScore}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs bg-white p-3 rounded border border-gray-100 text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>وقت التسليم: <strong>{sub.submitTime}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className={`w-3.5 h-3.5 ${sub.pasteAttempts > 0 ? "text-amber-500" : "text-green-500"}`} />
                <span>محاولات اللصق: <strong className={sub.pasteAttempts > 0 ? "text-amber-600 font-bold" : "text-gray-800"}>{sub.pasteAttempts}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>اختبار الدفاع: <strong>{sub.defenseStatus}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}