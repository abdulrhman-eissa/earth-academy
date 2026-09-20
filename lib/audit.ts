import { prisma } from "@/lib/prisma";
import { gatherThreatIntel } from "@/lib/threat-intel";

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
    let intel: { ip: string | null; browser: string | null; os: string | null; device: string | null; country: string | null; city: string | null; region: string | null; isp: string | null; referer: string | null; language: string | null } = {
      ip: null, browser: null, os: null, device: null,
      country: null, city: null, region: null, isp: null,
      referer: null, language: null,
    };

    if (input.request) {
      const gathered = await gatherThreatIntel(input.request);
      intel = {
        ip: gathered.ip,
        browser: gathered.browser,
        os: gathered.os,
        device: gathered.device,
        country: gathered.country,
        city: gathered.city,
        region: gathered.region,
        isp: gathered.isp,
        referer: gathered.referer,
        language: gathered.language,
      };
    }

    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        details: input.details ?? null,
        ip: intel.ip,
        browser: intel.browser,
        os: intel.os,
        device: intel.device,
        country: intel.country,
        city: intel.city,
        region: intel.region,
        isp: intel.isp,
        referer: intel.referer,
        language: intel.language,
        userAgent: input.request?.headers.get("user-agent")?.slice(0, 500) ?? null,
      },
    });
  } catch (e) {
    console.error("[audit] failed:", e);
  }
}
