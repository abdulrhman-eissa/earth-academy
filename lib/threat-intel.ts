/**
 * تحليل بيانات المخترق
 * - parse user-agent: Browser, OS, Device
 * - جلب بيانات الموقع من IP (ipapi.co - مجاني بدون مفتاح)
 * - التقاط IP الحقيقي من headers
 */

export interface ThreatIntel {
  ip: string;
  browser: string;
  os: string;
  device: string;
  country: string | null;
  city: string | null;
  region: string | null;
  isp: string | null;
  referer: string | null;
  language: string | null;
}

// ===== 1. IP الحقيقي =====
export function getRealIp(request: Request): string {
  const h = request.headers;
  const candidates = [
    h.get("cf-connecting-ip"),       // Cloudflare
    h.get("x-real-ip"),               // Nginx
    h.get("x-forwarded-for")?.split(",")[0]?.trim(), // Proxy chains
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim(), // Vercel
    h.get("forwarded")?.match(/for=([^;]+)/)?.[1]?.replace(/["\[\]]/g, ""),
  ];
  return candidates.find((c) => c && c.length > 0) ?? "unknown";
}

// ===== 2. تحليل User-Agent =====
export function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  const u = ua.toLowerCase();

  // Browser
  let browser = "غير معروف";
  if (u.includes("edg/")) browser = "Microsoft Edge";
  else if (u.includes("opr/") || u.includes("opera")) browser = "Opera";
  else if (u.includes("chrome/") && !u.includes("edg/")) browser = "Google Chrome";
  else if (u.includes("firefox/")) browser = "Mozilla Firefox";
  else if (u.includes("safari/") && !u.includes("chrome")) browser = "Safari";
  else if (u.includes("curl/")) browser = "cURL (أداة اختراق)";
  else if (u.includes("wget/")) browser = "Wget (أداة اختراق)";
  else if (u.includes("python")) browser = "Python Script";
  else if (u.includes("postman")) browser = "Postman";
  else if (u.includes("insomnia")) browser = "Insomnia";
  else if (u.includes("sqlmap")) browser = "SQLMap (أداة اختراق)";
  else if (u.includes("nikto")) browser = "Nikto (أداة اختراق)";
  else if (u.includes("nmap")) browser = "Nmap (أداة اختراق)";
  else if (u.includes("bot") || u.includes("spider") || u.includes("crawler")) browser = "Bot / Crawler";

  // OS
  let os = "غير معروف";
  if (u.includes("windows nt 10")) os = "Windows 10/11";
  else if (u.includes("windows nt 6.3")) os = "Windows 8.1";
  else if (u.includes("windows")) os = "Windows";
  else if (u.includes("mac os x") || u.includes("macintosh")) os = "macOS";
  else if (u.includes("android")) os = "Android";
  else if (u.includes("iphone") || u.includes("ipad")) os = "iOS";
  else if (u.includes("linux")) os = "Linux";
  else if (u.includes("ubuntu")) os = "Ubuntu";

  // Device
  let device = "كمبيوتر";
  if (u.includes("mobile") || u.includes("android") || u.includes("iphone")) device = "موبايل";
  else if (u.includes("tablet") || u.includes("ipad")) device = "تابلت";
  else if (u.includes("bot") || u.includes("curl") || u.includes("python") || u.includes("wget")) device = "سكريبت آلي";

  return { browser, os, device };
}

// ===== 3. جلب بيانات الموقع من IP =====
export async function lookupIp(ip: string): Promise<{
  country: string | null;
  city: string | null;
  region: string | null;
  isp: string | null;
}> {
  // تخطي العناوين المحلية والخاصة
  if (
    !ip ||
    ip === "unknown" ||
    ip.startsWith("127.") ||
    ip.startsWith("::1") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.includes("::ffff:127") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  ) {
    return { country: "محلي (Local)", city: "شبكة داخلية", region: null, isp: "Local Network" };
  }

  try {
    const cleanIp = ip.replace("::ffff:", "");
    const res = await fetch(`https://ipapi.co/${cleanIp}/json/`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error("Lookup failed");
    const data = (await res.json()) as {
      country_name?: string;
      city?: string;
      region?: string;
      org?: string;
      error?: boolean;
    };
    if (data.error) throw new Error("API error");
    return {
      country: data.country_name ?? null,
      city: data.city ?? null,
      region: data.region ?? null,
      isp: data.org ?? null,
    };
  } catch {
    return { country: null, city: null, region: null, isp: null };
  }
}

// ===== 4. جمع كل البيانات =====
export async function gatherThreatIntel(request: Request): Promise<ThreatIntel> {
  const ip = getRealIp(request);
  const ua = request.headers.get("user-agent") ?? "";
  const { browser, os, device } = parseUserAgent(ua);
  const geo = await lookupIp(ip);

  return {
    ip,
    browser,
    os,
    device,
    country: geo.country,
    city: geo.city,
    region: geo.region,
    isp: geo.isp,
    referer: request.headers.get("referer") ?? null,
    language: request.headers.get("accept-language")?.split(",")[0] ?? null,
  };
}

// ===== 5. تنسيق معلومات مفصلة للعرض =====
export function formatThreatDetails(intel: ThreatIntel, extra?: string): string {
  const parts: string[] = [];
  if (extra) parts.push(extra);
  parts.push(`🌍 ${intel.country ?? "—"} / ${intel.city ?? "—"}`);
  parts.push(`🌐 ${intel.browser}`);
  parts.push(`💻 ${intel.os}`);
  parts.push(`📱 ${intel.device}`);
  if (intel.isp) parts.push(`🏢 ${intel.isp}`);
  return parts.join(" • ");
}
