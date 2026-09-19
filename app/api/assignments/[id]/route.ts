import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("FACULTY");
  if ("error" in auth) return auth.error;
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const existing = await prisma.assignment.findFirst({ where: { id, facultyId: auth.session.userId } });
  if (!existing) return NextResponse.json({ error: "التكليف غير موجود" }, { status: 404 });
  const data: { title?: string; description?: string; course?: string; deadline?: Date | null; isPublished?: boolean; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" } = {};
  for (const key of ["title", "description", "course"] as const) if (input[key] !== undefined) {
    if (typeof input[key] !== "string" || !input[key].trim()) return NextResponse.json({ error: "بيانات التكليف غير صالحة" }, { status: 400 });
    data[key] = input[key].trim();
  }
  if (input.deadline !== undefined) {
    if (input.deadline === null || input.deadline === "") data.deadline = null;
    else { const date = new Date(String(input.deadline)); if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "الموعد النهائي غير صالح" }, { status: 400 }); data.deadline = date; }
  }
  if (input.isPublished !== undefined) { if (typeof input.isPublished !== "boolean") return NextResponse.json({ error: "حالة النشر غير صالحة" }, { status: 400 }); data.isPublished = input.isPublished; data.status = input.isPublished ? "PUBLISHED" : "DRAFT"; }
  const assignment = await prisma.assignment.update({ where: { id }, data });
  return NextResponse.json({ assignment });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("FACULTY");
  if ("error" in auth) return auth.error;
  const { id } = await context.params;
  const result = await prisma.assignment.deleteMany({ where: { id, facultyId: auth.session.userId } });
  if (!result.count) return NextResponse.json({ error: "التكليف غير موجود" }, { status: 404 });
  return NextResponse.json({ success: true });
}
