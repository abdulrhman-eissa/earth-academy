import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";

export async function requireRole(role: "FACULTY" | "STUDENT" | "AFFAIRS" | "ADMIN") {
  const session = await currentSession(role);
  if (!session) return { error: NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 }) } as const;
  if (session.role !== role && !(role === "AFFAIRS" && session.role === "ADMIN")) {
    return { error: NextResponse.json({ error: "غير مصرح بهذا الإجراء" }, { status: 403 }) } as const;
  }
  return { session } as const;
}
