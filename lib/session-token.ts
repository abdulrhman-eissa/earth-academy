export const AUTH_COOKIE = "modawala_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type AuthRole = "STUDENT" | "FACULTY" | "AFFAIRS" | "ADMIN";
export interface Session { userId: string; role: AuthRole; exp: number }

export const ALL_AUTH_COOKIES = [
  "modawala_student",
  "modawala_faculty",
  "modawala_affairs",
  "modawala_admin",
] as const;

export function cookieNameForRole(role: AuthRole): string {
  return `modawala_${role.toLowerCase()}`;
}

export function roleForPath(path: string): AuthRole | null {
  if (path === "/student" || path.startsWith("/student/")) return "STUDENT";
  if (path === "/faculty" || path.startsWith("/faculty/")) return "FACULTY";
  if (path === "/affairs" || path.startsWith("/affairs/")) return "AFFAIRS";
  if (path.startsWith("/contact/admin")) return "ADMIN";
  return null;
}

function encode(value: Uint8Array) {
  let binary = "";
  for (let i = 0; i < value.length; i++) binary += String.fromCharCode(value[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function createSessionToken(session: Omit<Session, "exp">) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(
    JSON.stringify({ ...session, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })
  );
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), plaintext)
  );
  const tag = encrypted.slice(-16);
  const cipher = encrypted.slice(0, -16);
  return `${encode(iv)}.${encode(tag)}.${encode(cipher)}`;
}

export async function readSessionToken(token?: string | null): Promise<Session | null> {
  try {
    const [ivPart, tagPart, cipherPart] = token?.split(".") ?? [];
    if (!ivPart || !tagPart || !cipherPart) return null;
    const tag = decode(tagPart);
    const cipher = decode(cipherPart);
    const encrypted = new Uint8Array([...cipher, ...tag]);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(ivPart) }, await key(), encrypted);
    const session = JSON.parse(new TextDecoder().decode(plaintext)) as Session;
    return session.userId && session.role && session.exp > Math.floor(Date.now() / 1000) ? session : null;
  } catch {
    return null;
  }
}
