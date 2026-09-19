import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

interface AuditInput {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: string | null;
  request?: Request;
}

export async function audit(input: AuditInput) {
  try {
    const ip = input.request ? getClientIp(input.request) : null;
    const ua = input.request?.headers.get("user-agent")?.slice(0, 500) ?? null;

    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        details: input.details ?? null,
        ip,
        userAgent: ua,
      },
    });
  } catch (e) {
    console.error("[audit] failed:", e);
  }
}
