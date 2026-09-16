import { NextResponse } from "next/server";

let submissionsDatabase: any[] = [
  {
    id: 1,
    studentName: "أحمد محمود علي",
    studentId: "20241001",
    gradeYear: "الفرقة الثالثة",
    department: "القانون العام",
    nationality: "مصري",
    course: "القانون الجنائي - الموقف 3",
    submitTime: "10:45 ص",
    pasteAttempts: 0,
    defenseStatus: "مكتمل بنجاح (خلال 22 ثانية)",
    integrityScore: 98,
    statusColor: "green",
    text: "التحليل القانوني للواقعة يعتمد على المادة 12 من قانون العقوبات...",
    defenseAnswer: "استندت إلى نص المادة 12 الخاصة بالقصد الجنائي.",
  },
];

export async function GET() {
  return NextResponse.json(submissionsDatabase);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newSubmission = {
      id: Date.now(),
      studentName: body.studentName || "طالب غير مسمى",
      studentId: body.studentId || "20240000",
      gradeYear: body.gradeYear || "غير محدد",
      department: body.department || "عام",
      nationality: body.nationality || "مصري",
      course: "التكليف الأكاديمي الحالي",
      submitTime: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      pasteAttempts: body.pasteAttempts || 0,
      defenseStatus: body.defenseAnswer ? `مكتمل (${body.defenseAnswer})` : "تم الإرسال",
      integrityScore: body.pasteAttempts > 0 ? Math.max(50, 100 - body.pasteAttempts * 15) : 100,
      statusColor: body.pasteAttempts > 0 ? "amber" : "green",
      text: body.text || "",
      defenseAnswer: body.defenseAnswer || "",
    };

    submissionsDatabase.unshift(newSubmission);
    return NextResponse.json({ success: true, submission: newSubmission });
  } catch (error) {
    return NextResponse.json({ success: false, error: "فشل حفظ التكليف" }, { status: 500 });
  }
}