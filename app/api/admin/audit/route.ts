import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await requireRole("ADMIN");
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200"), 500);

  const where = action && action !== "ALL" ? { action } : {};

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const actions = await prisma.auditLog.groupBy({
    by: ["action"],
    _count: { _all: true },
  });

  return NextResponse.json({
    logs,
    actions: actions.map((a) => ({ action: a.action, count: a._count._all })),
  });
}
