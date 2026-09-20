import { NextRequest, NextResponse } from "next/server";
import {
  readSessionToken,
  roleForPath,
  cookieNameForRole,
} from "@/lib/session-token";

export const config = {
  matcher: ["/student/:path*", "/faculty/:path*", "/affairs/:path*", "/contact/admin/:path*"],
};

const allowedRoles: Record<string, string[]> = {
  STUDENT: ["STUDENT"],
  FACULTY: ["FACULTY"],
  AFFAIRS: ["AFFAIRS", "ADMIN"],
  ADMIN: ["ADMIN"],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.endsWith("/login") || path.endsWith("/register")) {
    return NextResponse.next();
  }

  // صفحة درجاتي محظورة على الطالب
  if (path === "/student/grades" || path.startsWith("/student/grades/")) {
    const facultyValue = request.cookies.get("modawala_faculty")?.value;
    const affairsValue = request.cookies.get("modawala_affairs")?.value;
    const adminValue = request.cookies.get("modawala_admin")?.value;
    if (facultyValue || affairsValue || adminValue) {
      return NextResponse.redirect(new URL("/affairs/grades", request.url));
    }
    return NextResponse.redirect(new URL("/student", request.url));
  }

  const expectedRole = roleForPath(path);
  if (!expectedRole) return NextResponse.next();

  const cookieName = cookieNameForRole(expectedRole);
  const cookieValue = request.cookies.get(cookieName)?.value;
  const session = await readSessionToken(cookieValue);

  const allowed = allowedRoles[expectedRole] ?? [expectedRole];
  if (!session || !allowed.includes(session.role)) {
    const loginPath = expectedRole === "ADMIN"
      ? "/contact/admin/login"
      : `/${expectedRole.toLowerCase()}/login`;
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  return NextResponse.next();
}
