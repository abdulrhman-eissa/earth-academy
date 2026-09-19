import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticate,
  createSessionToken,
  hashPassword,
  sessionCookie,
  AUTH_COOKIE,
  currentSession,
  cookieNameForRole,
} from "@/lib/auth";
import { checkServerRateLimit, getClientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

const roles = ["STUDENT", "FACULTY", "AFFAIRS", "ADMIN"] as const;
type Role = (typeof roles)[number];
const selfRegistrationRoles = ["STUDENT", "FACULTY"] as const;
type SelfRegistrationRole = (typeof selfRegistrationRoles)[number];

function validRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

function validSelfRegistrationRole(value: unknown): value is SelfRegistrationRole {
  return typeof value === "string" && selfRegistrationRoles.includes(value as SelfRegistrationRole);
}

function mapAcademicLevel(year: string): "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4" {
  if (year.includes("الثانية")) return "LEVEL_2";
  if (year.includes("الثالثة")) return "LEVEL_3";
  if (year.includes("الرابعة")) return "LEVEL_4";
  return "LEVEL_1";
}

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  const body = await request.json().catch(() => ({}));
  const ip = getClientIp(request);

  if (action === "logout") {
    const response = NextResponse.json({ success: true });
    for (const role of roles) {
      response.cookies.set({ name: cookieNameForRole(role), value: "", httpOnly: true, path: "/", maxAge: 0 });
    }
    response.cookies.set({ name: AUTH_COOKIE, value: "", httpOnly: true, path: "/", maxAge: 0 });
    return response;
  }

  if (action === "session") {
    const requestedRole = validRole(body.role) ? body.role : undefined;
    const session = await currentSession(requestedRole);
    return NextResponse.json({ authenticated: Boolean(session), session });
  }

  if (action === "register") {
    // Rate limit: 5 محاولات تسجيل في الدقيقة لكل IP
    const rl = checkServerRateLimit(`register:${ip}`, 5, 60000, 5 * 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `تجاوزت عدد محاولات التسجيل. حاول بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role;
    if (!email || !email.includes("@") || password.length < 8 || !validSelfRegistrationRole(role)) {
      return NextResponse.json({ error: "A valid email, password (8+ characters), and student or faculty role are required" }, { status: 400 });
    }

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const academicYear = typeof body.academicYear === "string" ? body.academicYear : "الفرقة الأولى";
    const studentCode = typeof body.studentCode === "string" ? body.studentCode.trim() : "";

    if (role === "STUDENT" && studentCode) {
      const existingByCode = await prisma.studentProfile.findUnique({
        where: { studentCode },
        select: { id: true },
      });
      if (existingByCode) {
        return NextResponse.json(
          { error: "هذا الرقم القومي مسجّل بالفعل. يرجى تسجيل الدخول." },
          { status: 409 }
        );
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "هذا الحساب مسجّل بالفعل. يرجى تسجيل الدخول." },
        { status: 409 }
      );
    }

    try {
      const user = await prisma.user.create({
        data: { email, passwordHash: await hashPassword(password), role },
        select: { id: true, email: true, role: true },
      });

      if (role === "STUDENT" && fullName && studentCode) {
        const college = await prisma.college.upsert({
          where: { code: "AZHAR-AR" },
          update: {},
          create: { name: "كلية اللغة العربية بالقاهرة", code: "AZHAR-AR" },
        });

        const department = await prisma.department.upsert({
          where: { collegeId_code: { collegeId: college.id, code: "HIST" } },
          update: {},
          create: { name: "قسم التاريخ والحضارة", code: "HIST", collegeId: college.id },
        });

        await prisma.studentProfile.create({
          data: {
            userId: user.id,
            studentCode,
            fullName,
            departmentId: department.id,
            academicLevel: mapAcademicLevel(academicYear),
            enrollmentYear: new Date().getFullYear(),
          },
        });
      }

      const response = NextResponse.json({ success: true, user });
      response.cookies.set(sessionCookie(await createSessionToken({ userId: user.id, role: user.role }), user.role));

      await audit({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: "REGISTER",
        targetType: "User",
        targetId: user.id,
        request,
      });

      return response;
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        return NextResponse.json(
          { error: "هذا الحساب مسجّل بالفعل. يرجى تسجيل الدخول." },
          { status: 409 }
        );
      }
      console.error("Registration failed:", error);
      return NextResponse.json({ error: "تعذر إنشاء الحساب" }, { status: 500 });
    }
  }

  if (action === "login") {
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    // Rate limit: 5 محاولات دخول في الدقيقة لكل (IP + إيميل)
    const rl = checkServerRateLimit(`login:${ip}:${email.toLowerCase()}`, 5, 60000, 5 * 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `تجاوزت عدد محاولات الدخول. حاول بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    if (body.role !== undefined && !validRole(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const user = await authenticate(email, password);
    if (!user || (body.role && body.role !== user.role)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
    response.cookies.set(sessionCookie(await createSessionToken({ userId: user.id, role: user.role }), user.role));

    await audit({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "LOGIN",
      targetType: "User",
      targetId: user.id,
      request,
    });

    return response;
  }

  return NextResponse.json({ error: "Unknown auth action" }, { status: 404 });
}
