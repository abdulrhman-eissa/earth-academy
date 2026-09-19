import { NextResponse } from "next/server";

interface Submission {
  id: number;
  studentName: string;
  studentId: string;
  course: string;
  submitTime: string;
  pasteAttempts: number;
  defenseStatus: string;
  integrityScore: number;
  statusColor: string;
}

const submissionsDatabase: Submission[] = [
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
];

export async function GET() {
  return NextResponse.json(submissionsDatabase);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newSubmission = {
    id: Date.now(),
    studentName: "طالب جديد (تجريبي)",
    studentId: "20249999",
    course: "القانون الجنائي - الموقف 3",
    submitTime: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    pasteAttempts: body.pasteAttempts || 0,
    defenseStatus: `مكتمل (${body.defenseAnswer ? "تم الرد" : "بدون رد"})`,
    integrityScore: body.pasteAttempts > 0 ? 70 : 100,
    statusColor: body.pasteAttempts > 0 ? "amber" : "green",
  };

  submissionsDatabase.unshift(newSubmission);
  return NextResponse.json({ success: true, submission: newSubmission });
}