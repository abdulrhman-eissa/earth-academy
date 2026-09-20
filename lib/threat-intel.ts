/**
 * تحليل بيانات المخترق
 * - Vercel geolocation headers (الأولوية)
 * - fallback: ipapi.co للبيئات المحلية
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
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim(),
    h.get("x-real-ip"),
    h.get("x-forwarded-for")?.split(",")[0]?.trim(),
    h.get("cf-connecting-ip"),
  ];
  return candidates.find((c) => c && c.length > 0) ?? "unknown";
}

// ===== 2. تحليل User-Agent =====
export function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
  const u = ua.toLowerCase();

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

  let os = "غير معروف";
  if (u.includes("windows nt 10")) os = "Windows 10/11";
  else if (u.includes("windows nt 6.3")) os = "Windows 8.1";
  else if (u.includes("windows")) os = "Windows";
  else if (u.includes("mac os x") || u.includes("macintosh")) os = "macOS";
  else if (u.includes("android")) os = "Android";
  else if (u.includes("iphone") || u.includes("ipad")) os = "iOS";
  else if (u.includes("linux")) os = "Linux";
  else if (u.includes("ubuntu")) os = "Ubuntu";

  let device = "كمبيوتر";
  if (u.includes("mobile") || u.includes("android") || u.includes("iphone")) device = "موبايل";
  else if (u.includes("tablet") || u.includes("ipad")) device = "تابلت";
  else if (u.includes("bot") || u.includes("curl") || u.includes("python") || u.includes("wget")) device = "سكريبت آلي";

  return { browser, os, device };
}

// ===== 3. خريطة أكواد الدول =====
const COUNTRY_NAMES: Record<string, string> = {
  EG: "مصر", SA: "السعودية", AE: "الإمارات", KW: "الكويت", QA: "قطر",
  BH: "البحرين", OM: "عمان", JO: "الأردن", LB: "لبنان", SY: "سوريا",
  IQ: "العراق", PS: "فلسطين", LY: "ليبيا", TN: "تونس", DZ: "الجزائر",
  MA: "المغرب", SD: "السودان", YE: "اليمن", US: "الولايات المتحدة",
  GB: "المملكة المتحدة", DE: "ألمانيا", FR: "فرنسا", TR: "تركيا",
  RU: "روسيا", CN: "الصين", IN: "الهند", PK: "باكستان", NL: "هولندا",
  CA: "كندا", AU: "أستراليا", BR: "البرازيل", IT: "إيطاليا", ES: "إسبانيا",
  SE: "السويد", NO: "النرويج", PL: "بولندا", UA: "أوكرانيا", IR: "إيران",
  IL: "إسرائيل", SG: "سنغافورة", JP: "اليابان", KR: "كوريا الجنوبية",
  MY: "ماليزيا", ID: "إندونيسيا", TH: "تايلاند", VN: "فيتنام",
};

// ===== 4. جمع كل البيانات =====
export async function gatherThreatIntel(request: Request): Promise<ThreatIntel> {
  const ip = getRealIp(request);
  const ua = request.headers.get("user-agent") ?? "";
  const { browser, os, device } = parseUserAgent(ua);

  // ✅ الأولوية: Vercel headers (دقيقة جداً ومجانية)
  const vCountry = request.headers.get("x-vercel-ip-country");
  const vCity = request.headers.get("x-vercel-ip-city") ?? "";
  const vRegion = request.headers.get("x-vercel-ip-country-region");

  let country: string | null = null;
  let city: string | null = null;
  let region: string | null = null;
  let isp: string | null = null;

  if (vCountry) {
    // عندنا بيانات من Vercel
    country = COUNTRY_NAMES[vCountry] ?? vCountry;
    city = vCity ? decodeURIComponent(vCity) : null;
    region = vRegion ?? null;

    // محاولة جلب ISP (Vercel مش بيوفره)
    const ispResult = await lookupIspOnly(ip);
    isp = ispResult;
  } else {
    // fallback: ipapi.co للبيئات المحلية أو لو Vercel مش متاح
    const geo = await lookupIpFallback(ip);
    country = geo.country;
    city = geo.city;
    region = geo.region;
    isp = geo.isp;
  }

  return {
    ip,
    browser,
    os,
    device,
    country,
    city,
    region,
    isp,
    referer: request.headers.get("referer") ?? null,
    language: request.headers.get("accept-language")?.split(",")[0] ?? null,
  };
}

// ===== 5. جلب ISP فقط (ip-api.com) =====
async function lookupIspOnly(ip: string): Promise<string | null> {
  if (isLocalIp(ip)) return "شبكة داخلية";
  try {
    const cleanIp = ip.replace("::ffff:", "");
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=isp`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { isp?: string };
    return data.isp ?? null;
  } catch {
    return null;
  }
}

// ===== 6. fallback: ipapi.co =====
async function lookupIpFallback(ip: string): Promise<{
  country: string | null;
  city: string | null;
  region: string | null;
  isp: string | null;
}> {
  if (isLocalIp(ip)) {
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

// ===== 7. فحص IP محلي =====
function isLocalIp(ip: string): boolean {
  return (
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
  );
}

// ===== 8. تنسيق المعلومات =====
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
