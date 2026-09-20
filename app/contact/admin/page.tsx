"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Crown, Users, UserCheck, Building2, BookOpen, FileText, ShieldAlert,
  Award, TrendingUp, Clock, LogOut, Trash2,
  Loader2, Search, CheckCircle2, Eye, X, AlertCircle,
  BarChart3, Inbox, Hash, RefreshCw, ChevronLeft, ChevronRight,
  Activity, Ban, KeyRound, UserCog, Download, Filter,
  ShieldCheck, LayoutDashboard, Sparkles, Zap, Target,
  GraduationCap, Briefcase, PieChart, Layers, ArrowUpRight,
  CircleDot, MoreHorizontal, Percent, ScrollText,
  Globe,
  MapPin,
  Compass,
  Monitor,
  Smartphone,
  Languages,
} from "lucide-react";

interface Stats {
  totalStudents: number; totalFaculty: number; totalAffairs: number; totalAdmins: number;
  totalAssignments: number; totalSubmissions: number; gradedSubmissions: number; pendingSubmissions: number;
  totalMessages: number; unreadMessages: number; average: number;
  recentSubmissions: Array<{
    id: string; submittedAt: string; score: number | null;
    student: { email: string; studentProfile: { fullName: string } | null };
    assignment: { course: string };
  }>;
}

interface UserRow {
  id: string; email: string; role: string; status: string; createdAt: string;
  studentProfile: { fullName: string; studentCode: string; academicLevel: string; chosenAssignmentId: string | null } | null;
  facultyProfile: { fullName: string; employeeCode: string; academicTitle: string | null } | null;
}

interface SubmissionRow {
  id: string; text: string; score: number | null; notes: string | null; status: string; submittedAt: string;
  student: { email: string; studentProfile: { fullName: string; studentCode: string } | null };
  assignment: { title: string; course: string; faculty: { facultyProfile: { fullName: string } | null } };
}

interface ContactMsg {
  id: string; fullName: string; phone: string; role: string; message: string; isRead: boolean; createdAt: string;
}

interface AuditRow {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ip: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  isp: string | null;
  referer: string | null;
  language: string | null;
  createdAt: string;
}

type Tab = "overview" | "users" | "submissions" | "messages" | "threats" | "audit";

const ROLE_LABELS: Record<string, string> = { STUDENT: "طالب", FACULTY: "أستاذ", AFFAIRS: "شؤون", ADMIN: "مبرمج" };
const STATUS_LABELS: Record<string, string> = { ACTIVE: "نشط", SUSPENDED: "موقوف", INACTIVE: "غير نشط" };
const LEVEL_LABELS: Record<string, string> = { LEVEL_1: "الفرقة الأولى", LEVEL_2: "الفرقة الثانية", LEVEL_3: "الفرقة الثالثة", LEVEL_4: "الفرقة الرابعة" };

const NAV_ITEMS: Array<{ id: Tab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "users", label: "المستخدمون", icon: Users },
  { id: "submissions", label: "التسليمات", icon: FileText },
  { id: "messages", label: "الرسائل", icon: Inbox },
  { id: "threats", label: "محاولات التسلل", icon: ShieldAlert },
  { id: "audit", label: "سجل العمليات", icon: ScrollText },
];

const PAGE_SIZE = 10;

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [viewingSubmission, setViewingSubmission] = useState<SubmissionRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [auditActions, setAuditActions] = useState<Array<{ action: string; count: number }>>([]);
  const [auditFilter, setAuditFilter] = useState("ALL");
  const [auditLoading, setAuditLoading] = useState(false);
  const [threats, setThreats] = useState<AuditRow[]>([]);
  const [threatsLoading, setThreatsLoading] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [s, u, sub, m] = await Promise.all([
      fetch("/api/admin/stats").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/admin/users").then((r) => r.ok ? r.json() : { users: [] }).catch(() => ({ users: [] })),
      fetch("/api/admin/submissions").then((r) => r.ok ? r.json() : { submissions: [] }).catch(() => ({ submissions: [] })),
      fetch("/api/admin/messages").then((r) => r.ok ? r.json() : { messages: [] }).catch(() => ({ messages: [] })),
    ]);
    setStats(s); setUsers(u.users ?? []); setSubmissions(sub.submissions ?? []); setMessages(m.messages ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "ADMIN" }) })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.authenticated || data.session?.role !== "ADMIN") {
          router.replace("/contact/admin/login");
          return;
        }
        void loadAll();
      })
      .catch(() => router.replace("/contact/admin/login"));
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter, tab]);

  async function loadAuditLogs(filter = auditFilter) {
    setAuditLoading(true);
    const url = filter && filter !== "ALL" ? `/api/admin/audit?action=${encodeURIComponent(filter)}` : "/api/admin/audit";
    const res = await fetch(url).then((r) => r.ok ? r.json() : { logs: [], actions: [] }).catch(() => ({ logs: [], actions: [] }));
    setAuditLogs(res.logs ?? []);
    setAuditActions(res.actions ?? []);
    setAuditLoading(false);
  }

  useEffect(() => {
    if (tab === "audit") void loadAuditLogs();
  }, [tab, auditFilter]);

  async function loadThreats() {
    setThreatsLoading(true);
    const res = await fetch("/api/admin/audit?action=SECURITY_THREAT").then((r) => r.ok ? r.json() : { logs: [] }).catch(() => ({ logs: [] }));
    setThreats(res.logs ?? []);
    setThreatsLoading(false);
  }

  useEffect(() => {
    if (tab === "threats") void loadThreats();
  }, [tab]);

  async function handleDelete(id: string) {
    setActionLoading(true);
    const res = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setActionLoading(false);
    if (!res.ok) { alert("تعذر الحذف"); return; }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setConfirmDelete(null);
  }

  async function handleToggleStatus(user: UserRow) {
    const next = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setActionLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setActionLoading(false);
    if (!res.ok) { alert("تعذر التعديل"); return; }
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: next } : u));
  }

  async function handleChangeRole(user: UserRow, role: string) {
    setActionLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setActionLoading(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "تعذر التعديل"); return; }
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role } : u));
    setEditingUser(null);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUser || newPassword.length < 8) return;
    setActionLoading(true);
    const res = await fetch(`/api/admin/users/${resetUser.id}/reset-password`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    setActionLoading(false);
    if (!res.ok) { alert("تعذر تحديث كلمة المرور"); return; }
    alert(`تم تحديث كلمة مرور ${resetUser.studentProfile?.fullName ?? resetUser.facultyProfile?.fullName ?? resetUser.email} بنجاح.`);
    setResetUser(null); setNewPassword("");
  }

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.href = "/contact/admin/login";
  }

  const filteredUsers = useMemo(() => users.filter((u) => {
    const name = u.studentProfile?.fullName ?? u.facultyProfile?.fullName ?? u.email;
    const matchSearch = name.includes(search) || u.email.includes(search);
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  }), [users, search, roleFilter, statusFilter]);

  const filteredSubmissions = useMemo(() => submissions.filter((s) => {
    const name = s.student.studentProfile?.fullName ?? s.student.email;
    return name.includes(search) || s.assignment.course.includes(search);
  }), [submissions, search]);

  const filteredMessages = useMemo(() => messages.filter((m) =>
    m.fullName.includes(search) || m.phone.includes(search)
  ), [messages, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportUsersCSV() {
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += "الاسم,البريد,الدور,الحالة,الكود,تاريخ التسجيل\n";
    filteredUsers.forEach((u) => {
      const name = u.studentProfile?.fullName ?? u.facultyProfile?.fullName ?? "-";
      const code = u.studentProfile?.studentCode ?? u.facultyProfile?.employeeCode ?? "-";
      csv += `"${name}","${u.email}","${ROLE_LABELS[u.role]}","${STATUS_LABELS[u.status]}","${code}","${new Date(u.createdAt).toLocaleString("ar-EG")}"\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }

  return (
    <div className="h-screen w-screen overflow-hidden dir-rtl font-sans flex" style={{ background: "#15102a" }}>

      {/* SIDEBAR */}
      <aside className="w-[260px] flex flex-col flex-shrink-0 relative" style={{ background: "#221540" }}>
        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-base leading-none">EARTH</p>
            <p className="text-[10px] font-black tracking-[0.2em] mt-1" style={{ color: "#a78bfa" }}>ADMIN PANEL</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-black tracking-wider px-3 mb-3" style={{ color: "rgba(196,181,253,0.9)" }}>الرئيسية</p>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            const badge = item.id === "messages" && stats && stats.unreadMessages > 0 ? stats.unreadMessages : 0;
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setSearch(""); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200 text-sm font-bold relative"
                style={{
                  background: active ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "transparent",
                  color: active ? "#ffffff" : "rgba(255,255,255,0.85)",
                  boxShadow: active ? "0 8px 24px rgba(124,58,237,0.35)" : "none",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(124,58,237,0.35)"; e.currentTarget.style.color = "rgba(255,255,255,0.95)"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; } }}
              >
                <Icon style={{ width: 18, height: 18 }} className="flex-shrink-0" />
                <span className="flex-1 text-right">{item.label}</span>
                {badge > 0 && (
                  <span className="text-white text-[10px] font-black min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center" style={{ background: "#ef4444" }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System status */}
        <div className="px-4 pb-2">
          <div className="rounded-2xl p-4" style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10b981" }} />
              <p className="text-[11px] font-black" style={{ color: "#86efac" }}>جميع الأنظمة تعمل</p>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex-1 rounded-full" style={{ height: 3, background: i < 6 ? "#10b981" : "#a855f7", opacity: i < 6 ? 0.9 : 0.4 }} />
              ))}
            </div>
            <p className="text-[9px] font-bold mt-2" style={{ color: "rgba(196,181,253,0.9)" }}>Uptime: 99.9%</p>
          </div>
        </div>

        {/* User + Logout */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">المبرمج</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(196,181,253,0.95)" }}>admin@earth.edu</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition"
            style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}
          >
            <LogOut className="w-4 h-4" />
            <span className="flex-1 text-right">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="px-8 py-5 flex items-center justify-between flex-shrink-0 border-b border-white/5" style={{ background: "#221540" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <span className="text-white">لوحة المبرمج</span>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span style={{ color: "#a855f7" }}>{NAV_ITEMS.find((n) => n.id === tab)?.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAll}
              suppressHydrationWarning
              disabled={loading === true}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </button>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "#15102a" }}>

          {loading && !stats ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full animate-spin" style={{ border: "4px solid rgba(124,58,237,0.2)", borderTopColor: "#a855f7" }} />
                <Crown className="w-7 h-7 absolute inset-0 m-auto" style={{ color: "#a855f7" }} />
              </div>
              <p className="text-sm font-black" style={{ color: "rgba(196,181,253,0.95)" }}>جاري تحميل البيانات...</p>
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === "overview" && stats && (
                <div className="p-8 space-y-6 max-w-[1500px] mx-auto animate-fadeIn">

                  {/* HERO */}
                  <div className="relative rounded-[28px] p-8 overflow-hidden" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)" }}>
                    <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
                    <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />

                    <div className="relative flex items-center justify-between gap-6 flex-wrap">
                      <div className="flex-1 min-w-[300px]">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                          <span className="text-[11px] font-black text-yellow-200 tracking-[0.2em]">SYSTEM CONTROL</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
                          مرحباً بك في لوحة التحكم
                        </h1>
                        <p className="text-sm text-white/90 font-bold max-w-lg leading-relaxed">
                          نظرة شاملة على المنظومة الأكاديمية — الطلاب، الأساتذة، الأبحاث، والدرجات في مكان واحد.
                        </p>
                        <div className="flex items-center gap-3 mt-5 flex-wrap">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 border border-white/25">
                            <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                            <span className="text-[11px] font-black text-white">{stats.totalStudents} طالب نشط</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 border border-white/25">
                            <Zap className="w-3.5 h-3.5 text-yellow-300" />
                            <span className="text-[11px] font-black text-white">{stats.totalSubmissions} تسليم</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 border border-white/25">
                            <Target className="w-3.5 h-3.5 text-white" />
                            <span className="text-[11px] font-black text-white">{stats.average}/100 متوسط</span>
                          </div>
                        </div>
                      </div>

                      {/* Illustration */}
                      <div className="relative hidden lg:block">
                        <svg width="220" height="180" viewBox="0 0 220 180">
                          <circle cx="110" cy="90" r="80" fill="white" opacity="0.12" />
                          <circle cx="110" cy="90" r="60" fill="white" opacity="0.1" />
                          <rect x="60" y="40" width="100" height="80" rx="12" fill="white" opacity="0.9" />
                          <rect x="70" y="55" width="40" height="4" rx="2" fill="#7c3aed" opacity="0.5" />
                          <rect x="70" y="65" width="60" height="4" rx="2" fill="#7c3aed" opacity="0.3" />
                          <rect x="70" y="75" width="50" height="4" rx="2" fill="#7c3aed" opacity="0.3" />
                          <circle cx="85" cy="100" r="10" fill="#7c3aed" />
                          <path d="M85 95 L85 105 M80 100 L90 100" stroke="white" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="130" cy="100" r="10" fill="#ec4899" />
                          <rect x="150" y="20" width="40" height="40" rx="10" fill="#10b981" opacity="0.9" />
                          <path d="M160 40 L170 50 L182 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* PRIMARY STATS */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatCard icon={<Users />} label="الطلاب" value={stats.totalStudents} hint="حساب مسجّل" gradient="linear-gradient(135deg, #3b82f6, #1d4ed8)" />
                    <StatCard icon={<UserCheck />} label="أعضاء التدريس" value={stats.totalFaculty} hint="عضو هيئة تدريس" gradient="linear-gradient(135deg, #10b981, #047857)" />
                    <StatCard icon={<Building2 />} label="شؤون الطلاب" value={stats.totalAffairs} hint="حساب إداري" gradient="linear-gradient(135deg, #f59e0b, #b45309)" />
                    <StatCard icon={<Crown />} label="المبرمجون" value={stats.totalAdmins} hint="إدارة عليا" gradient="linear-gradient(135deg, #ec4899, #be185d)" />
                  </div>

                  {/* CHARTS ROW */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Distribution Chart */}
                    <div className="lg:col-span-2 rounded-[24px] p-6" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="font-black text-base text-white">توزيع المستخدمين</h3>
                          <p className="text-[11px] font-bold mt-0.5" style={{ color: "rgba(196,181,253,0.9)" }}>النسبة حسب الدور</p>
                        </div>
                        <PieChart className="w-5 h-5" style={{ color: "#a855f7" }} />
                      </div>

                      <div className="space-y-4">
                        <BarRow label="الطلاب" value={stats.totalStudents} total={stats.totalStudents + stats.totalFaculty + stats.totalAffairs + stats.totalAdmins} color="#3b82f6" />
                        <BarRow label="أعضاء التدريس" value={stats.totalFaculty} total={stats.totalStudents + stats.totalFaculty + stats.totalAffairs + stats.totalAdmins} color="#10b981" />
                        <BarRow label="شؤون الطلاب" value={stats.totalAffairs} total={stats.totalStudents + stats.totalFaculty + stats.totalAffairs + stats.totalAdmins} color="#f59e0b" />
                        <BarRow label="المبرمجون" value={stats.totalAdmins} total={stats.totalStudents + stats.totalFaculty + stats.totalAffairs + stats.totalAdmins} color="#ec4899" />
                      </div>
                    </div>

                    {/* Progress Rings */}
                    <div className="rounded-[24px] p-6" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="font-black text-base text-white">معدلات الأداء</h3>
                          <p className="text-[11px] font-bold mt-0.5" style={{ color: "rgba(196,181,253,0.9)" }}>KPIs المنظومة</p>
                        </div>
                        <Activity className="w-5 h-5" style={{ color: "#a855f7" }} />
                      </div>

                      <div className="flex items-center justify-center mb-4">
                        <ProgressRing percent={stats.average} size={140} stroke={12} color="url(#grad1)" label={`${stats.average}`} sublabel="المتوسط" />
                        <svg width="0" height="0">
                          <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#a855f7" />
                              <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.1)" }}>
                          <p className="text-[10px] font-black" style={{ color: "#86efac" }}>مرصودة</p>
                          <p className="text-lg font-black text-white">{stats.gradedSubmissions}</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.1)" }}>
                          <p className="text-[10px] font-black" style={{ color: "#fcd34d" }}>قيد المراجعة</p>
                          <p className="text-lg font-black text-white">{stats.pendingSubmissions}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECONDARY STATS */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <MiniCard icon={<BookOpen />} label="المواد المنشورة" value={stats.totalAssignments} color="#3b82f6" />
                    <MiniCard icon={<FileText />} label="إجمالي التسليمات" value={stats.totalSubmissions} color="#10b981" />
                    <MiniCard icon={<CheckCircle2 />} label="درجات مرصودة" value={stats.gradedSubmissions} color="#a855f7" />
                    <MiniCard icon={<Clock />} label="قيد المراجعة" value={stats.pendingSubmissions} color="#f59e0b" />
                  </div>

                  {/* RECENT SUBMISSIONS */}
                  <div className="rounded-[24px] overflow-hidden" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
                    <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
                          <Activity className="w-5 h-5" style={{ color: "#a855f7" }} />
                        </div>
                        <div>
                          <h2 className="font-black text-base text-white">آخر 5 تسليمات</h2>
                          <p className="text-[11px] font-bold mt-0.5" style={{ color: "rgba(196,181,253,0.9)" }}>أحدث الأبحاث المستلمة</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setTab("submissions")}
                        className="text-xs font-black flex items-center gap-1 transition hover:gap-2"
                        style={{ color: "#a855f7" }}
                      >
                        عرض الكل <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="text-[11px] font-black" style={{ color: "rgba(196,181,253,0.85)", background: "rgba(124,58,237,0.05)" }}>
                          <th className="px-6 py-4 text-right">الطالب</th>
                          <th className="px-6 py-4 text-right">المادة</th>
                          <th className="px-6 py-4 text-right">التاريخ</th>
                          <th className="px-6 py-4 text-center">الدرجة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentSubmissions.length === 0 ? (
                          <tr><td colSpan={4} className="p-16 text-center">
                            <FileText className="w-12 h-12 mx-auto mb-2" style={{ color: "rgba(196,181,253,0.5)" }} />
                            <p className="text-sm font-bold" style={{ color: "rgba(196,181,253,0.75)" }}>لا توجد تسليمات</p>
                          </td></tr>
                        ) : stats.recentSubmissions.map((s) => (
                          <tr key={s.id} className="transition" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                                  {(s.student.studentProfile?.fullName ?? s.student.email).charAt(0)}
                                </div>
                                <span className="font-black text-white">{s.student.studentProfile?.fullName ?? s.student.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold" style={{ color: "rgba(167,139,250,0.8)" }}>{s.assignment.course}</td>
                            <td className="px-6 py-4 text-xs font-mono" style={{ color: "rgba(196,181,253,0.75)" }}>{new Date(s.submittedAt).toLocaleString("ar-EG")}</td>
                            <td className="px-6 py-4 text-center">
                              {s.score !== null
                                ? <span className="text-xs font-black px-3 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.15)", color: "#86efac" }}>{s.score}</span>
                                : <span className="text-[10px] font-black px-3 py-1 rounded-lg" style={{ background: "rgba(245,158,11,0.15)", color: "#fcd34d" }}>قيد المراجعة</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* USERS */}
              {tab === "users" && (
                <div className="p-8 space-y-5 max-w-[1500px] mx-auto animate-fadeIn">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h1 className="text-3xl font-black text-white">المستخدمون</h1>
                      <p className="text-sm font-bold mt-1" style={{ color: "rgba(196,181,253,0.95)" }}>إدارة كاملة لجميع الحسابات</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition"
                        style={{
                          background: showFilters ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(255,255,255,0.05)",
                          color: "white",
                          border: "1px solid rgba(124,58,237,0.2)",
                        }}
                      >
                        <Filter className="w-4 h-4" /> فلترة
                      </button>
                      <button
                        onClick={exportUsersCSV}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#86efac", border: "1px solid rgba(16,185,129,0.3)" }}
                      >
                        <Download className="w-4 h-4" /> CSV
                      </button>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
                    <div className="relative">
                      <input
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث باسم المستخدم أو البريد الإلكتروني..."
                        className="w-full p-3.5 pl-11 pr-4 rounded-xl text-sm font-bold outline-none transition placeholder:text-purple-300/50"
                        style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(124,58,237,0.2)" }}
                      />
                      <Search className="w-4 h-4 absolute left-4 top-4" style={{ color: "rgba(196,181,253,0.9)" }} />
                    </div>

                    {showFilters && (
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                        <div>
                          <label className="block text-[10px] font-black mb-1.5" style={{ color: "rgba(196,181,253,0.95)" }}>الدور</label>
                          <select
                            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full p-3 rounded-xl text-xs font-bold outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(124,58,237,0.2)" }}
                          >
                            <option value="ALL" style={{ background: "#221540" }}>جميع الأدوار</option>
                            <option value="STUDENT" style={{ background: "#221540" }}>طلاب</option>
                            <option value="FACULTY" style={{ background: "#221540" }}>أساتذة</option>
                            <option value="AFFAIRS" style={{ background: "#221540" }}>شؤون</option>
                            <option value="ADMIN" style={{ background: "#221540" }}>مبرمجون</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black mb-1.5" style={{ color: "rgba(196,181,253,0.95)" }}>الحالة</label>
                          <select
                            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-3 rounded-xl text-xs font-bold outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(124,58,237,0.2)" }}
                          >
                            <option value="ALL" style={{ background: "#221540" }}>جميع الحالات</option>
                            <option value="ACTIVE" style={{ background: "#221540" }}>نشط</option>
                            <option value="SUSPENDED" style={{ background: "#221540" }}>موقوف</option>
                            <option value="INACTIVE" style={{ background: "#221540" }}>غير نشط</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-black" style={{ color: "rgba(196,181,253,0.95)" }}>
                    <span>{filteredUsers.length} من {users.length} مستخدم</span>
                  </div>

                  {/* Table */}
                  <div className="rounded-[24px] overflow-hidden" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="text-[11px] font-black" style={{ color: "rgba(196,181,253,0.85)", background: "rgba(124,58,237,0.08)" }}>
                          <th className="px-6 py-4 text-right">الاسم</th>
                          <th className="px-6 py-4 text-right">البريد</th>
                          <th className="px-6 py-4 text-right">الدور</th>
                          <th className="px-6 py-4 text-right">الكود</th>
                          <th className="px-6 py-4 text-right">الحالة</th>
                          <th className="px-6 py-4 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedUsers.length === 0 ? (
                          <tr><td colSpan={6} className="p-16 text-center">
                            <Users className="w-14 h-14 mx-auto mb-3" style={{ color: "rgba(196,181,253,0.5)" }} />
                            <p className="text-sm font-bold" style={{ color: "rgba(196,181,253,0.75)" }}>لا يوجد مستخدمون مطابقون</p>
                          </td></tr>
                        ) : pagedUsers.map((u) => {
                          const name = u.studentProfile?.fullName ?? u.facultyProfile?.fullName ?? "—";
                          const code = u.studentProfile?.studentCode ?? u.facultyProfile?.employeeCode ?? "—";
                          const roleStyles: Record<string, { bg: string; color: string }> = {
                            STUDENT: { bg: "rgba(59,130,246,0.15)", color: "#93c5fd" },
                            FACULTY: { bg: "rgba(16,185,129,0.15)", color: "#86efac" },
                            AFFAIRS: { bg: "rgba(245,158,11,0.15)", color: "#fcd34d" },
                            ADMIN: { bg: "rgba(168,85,247,0.15)", color: "#d8b4fe" },
                          };
                          const rs = roleStyles[u.role] ?? { bg: "rgba(255,255,255,0.05)", color: "#d1d5db" };
                          return (
                            <tr key={u.id} className="transition" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                                    {name.charAt(0)}
                                  </div>
                                  <span className="font-black text-white">{name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-xs" style={{ color: "rgba(196,181,253,0.95)" }}>{u.email}</td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-black" style={{ background: rs.bg, color: rs.color }}>
                                  {ROLE_LABELS[u.role] ?? u.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-mono text-xs" style={{ color: "rgba(196,181,253,0.95)" }}>{code}</td>
                              <td className="px-6 py-4">
                                {u.status === "ACTIVE" ? (
                                  <span className="text-xs font-black inline-flex items-center gap-1.5" style={{ color: "#86efac" }}>
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} /> نشط
                                  </span>
                                ) : u.status === "SUSPENDED" ? (
                                  <span className="text-xs font-black inline-flex items-center gap-1.5" style={{ color: "#fca5a5" }}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ef4444" }} /> موقوف
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold" style={{ color: "rgba(196,181,253,0.75)" }}>{STATUS_LABELS[u.status] ?? u.status}</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button onClick={() => setEditingUser(u)} className="p-2 rounded-lg transition" style={{ background: "rgba(59,130,246,0.15)", color: "#93c5fd" }} title="تعديل الدور">
                                    <UserCog className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleToggleStatus(u)} disabled={actionLoading} className="p-2 rounded-lg transition" style={u.status === "ACTIVE" ? { background: "rgba(245,158,11,0.15)", color: "#fcd34d" } : { background: "rgba(16,185,129,0.15)", color: "#86efac" }} title={u.status === "ACTIVE" ? "إيقاف" : "تفعيل"}>
                                    {u.status === "ACTIVE" ? <Ban className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                  </button>
                                  <button onClick={() => { setResetUser(u); setNewPassword(""); }} className="p-2 rounded-lg transition" style={{ background: "rgba(255,255,255,0.05)", color: "#d1d5db" }} title="كلمة المرور">
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setConfirmDelete(u)} className="p-2 rounded-lg transition" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }} title="حذف">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(124,58,237,0.05)" }}>
                        <p className="text-xs font-black" style={{ color: "rgba(196,181,253,0.95)" }}>صفحة {page} من {totalPages}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg transition disabled:opacity-30" style={{ background: "rgba(255,255,255,0.05)", color: "white" }}>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg transition disabled:opacity-30" style={{ background: "rgba(255,255,255,0.05)", color: "white" }}>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBMISSIONS */}
              {tab === "submissions" && (
                <div className="p-8 space-y-5 max-w-[1500px] mx-auto animate-fadeIn">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h1 className="text-3xl font-black text-white">التسليمات</h1>
                      <p className="text-sm font-bold mt-1" style={{ color: "rgba(196,181,253,0.95)" }}>جميع الأبحاث المسلّمة من الطلاب</p>
                    </div>
                    <span className="rounded-xl px-4 py-2.5 text-xs font-black" style={{ background: "rgba(124,58,237,0.35)", color: "#d8b4fe", border: "1px solid rgba(124,58,237,0.3)" }}>
                      {filteredSubmissions.length} من {submissions.length}
                    </span>
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
                    <div className="relative">
                      <input
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث باسم الطالب أو المادة..."
                        className="w-full p-3.5 pl-11 pr-4 rounded-xl text-sm font-bold outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(124,58,237,0.2)" }}
                      />
                      <Search className="w-4 h-4 absolute left-4 top-4" style={{ color: "rgba(196,181,253,0.9)" }} />
                    </div>
                  </div>

                  <div className="rounded-[24px] overflow-hidden" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="text-[11px] font-black" style={{ color: "rgba(196,181,253,0.85)", background: "rgba(124,58,237,0.08)" }}>
                          <th className="px-6 py-4 text-right">الطالب</th>
                          <th className="px-6 py-4 text-right">المادة</th>
                          <th className="px-6 py-4 text-right">أستاذ المادة</th>
                          <th className="px-6 py-4 text-right">التاريخ</th>
                          <th className="px-6 py-4 text-center">الدرجة</th>
                          <th className="px-6 py-4 text-center">عرض</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubmissions.length === 0 ? (
                          <tr><td colSpan={6} className="p-16 text-center">
                            <FileText className="w-14 h-14 mx-auto mb-3" style={{ color: "rgba(196,181,253,0.5)" }} />
                            <p className="text-sm font-bold" style={{ color: "rgba(196,181,253,0.75)" }}>لا توجد تسليمات</p>
                          </td></tr>
                        ) : filteredSubmissions.map((s) => (
                          <tr key={s.id} className="transition" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                                  {(s.student.studentProfile?.fullName ?? s.student.email).charAt(0)}
                                </div>
                                <span className="font-black text-white">{s.student.studentProfile?.fullName ?? s.student.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold" style={{ color: "rgba(167,139,250,0.85)" }}>{s.assignment.course}</td>
                            <td className="px-6 py-4 text-xs" style={{ color: "rgba(196,181,253,0.9)" }}>{s.assignment.faculty.facultyProfile?.fullName ?? "—"}</td>
                            <td className="px-6 py-4 text-xs font-mono" style={{ color: "rgba(196,181,253,0.75)" }}>{new Date(s.submittedAt).toLocaleString("ar-EG")}</td>
                            <td className="px-6 py-4 text-center">
                              {s.score !== null
                                ? <span className="text-xs font-black px-3 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.15)", color: "#86efac" }}>{s.score}</span>
                                : <span className="text-[10px] font-black px-3 py-1 rounded-lg" style={{ background: "rgba(245,158,11,0.15)", color: "#fcd34d" }}>قيد المراجعة</span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button onClick={() => { window.location.href = `/view-submission/${s.id}`; }} className="px-3 py-1.5 rounded-lg text-xs font-black inline-flex items-center gap-1 transition" style={{ background: "rgba(168,85,247,0.15)", color: "#d8b4fe" }}>
                                <Eye className="w-3.5 h-3.5" /> قراءة
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MESSAGES */}
              {tab === "messages" && (
                <div className="p-8 space-y-5 max-w-[900px] mx-auto animate-fadeIn">
                  <div>
                    <h1 className="text-3xl font-black text-white">الرسائل</h1>
                    <p className="text-sm font-bold mt-1" style={{ color: "rgba(196,181,253,0.95)" }}>رسائل التواصل الواردة</p>
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
                    <div className="relative">
                      <input
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث باسم المرسل أو الهاتف..."
                        className="w-full p-3.5 pl-11 pr-4 rounded-xl text-sm font-bold outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(124,58,237,0.2)" }}
                      />
                      <Search className="w-4 h-4 absolute left-4 top-4" style={{ color: "rgba(196,181,253,0.9)" }} />
                    </div>
                  </div>

                  {filteredMessages.length === 0 ? (
                    <div className="rounded-2xl p-16 text-center" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
                      <Inbox className="w-14 h-14 mx-auto mb-3" style={{ color: "rgba(196,181,253,0.5)" }} />
                      <p className="text-sm font-bold" style={{ color: "rgba(196,181,253,0.75)" }}>لا توجد رسائل</p>
                    </div>
                  ) : filteredMessages.map((m) => (
                    <div key={m.id} className="rounded-2xl p-5 transition" style={{
                      background: "#221540",
                      border: m.isRead ? "1px solid rgba(124,58,237,0.35)" : "2px solid rgba(168,85,247,0.5)",
                      boxShadow: !m.isRead ? "0 0 30px rgba(124,58,237,0.35)" : "none",
                    }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white" style={{ background: m.isRead ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                            {m.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-white">{m.fullName}</p>
                            <p className="text-xs font-mono font-bold" style={{ color: "rgba(196,181,253,0.9)" }}>{m.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-md" style={{ background: "rgba(168,85,247,0.15)", color: "#d8b4fe" }}>{m.role}</span>
                          {!m.isRead && <span className="text-white text-[9px] font-black px-2 py-1 rounded-md" style={{ background: "#ef4444" }}>جديد</span>}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-bold rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.85)" }}>{m.message}</p>
                      <p className="text-[10px] mt-3 font-mono flex items-center gap-1.5" style={{ color: "rgba(196,181,253,0.75)" }}>
                        <Clock className="w-3 h-3" /> {new Date(m.createdAt).toLocaleString("ar-EG")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* THREATS */}
              {/* THREATS */}
              {tab === "threats" && (
                <div className="p-8 space-y-5 max-w-[1500px] mx-auto animate-fadeIn">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-red-400" />
                        محاولات التسلل
                      </h1>
                      <p className="text-sm font-bold mt-1" style={{ color: "rgba(196,181,253,0.95)" }}>
                        تتبع مفصّل لكل محاولة وصول غير مصرّح بها — IP، الموقع الجغرافي، الجهاز، والمتصفح
                      </p>
                    </div>
                    <button
                      onClick={() => loadThreats()}
                      disabled={threatsLoading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition disabled:opacity-50"
                      style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(124,58,237,0.3)" }}
                    >
                      <RefreshCw className={"w-4 h-4 " + (threatsLoading ? "animate-spin" : "")} />
                      تحديث
                    </button>
                  </div>

                  <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <ShieldAlert className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-red-300 text-sm">نظام الحماية يعمل</p>
                      <p className="text-xs font-bold mt-1" style={{ color: "rgba(254,202,202,0.9)" }}>
                        صندوق الرسائل الوهمي (Honeypot) يسجّل كل محاولة مع تفاصيل كاملة عن المتسلل: IP، الموقع الجغرافي، المتصفح، نظام التشغيل، الجهاز، ومزود الإنترنت.
                      </p>
                    </div>
                  </div>

                  {threatsLoading ? (
                    <div className="py-16 text-center">
                      <Loader2 className="w-10 h-10 mx-auto animate-spin" style={{ color: "#a855f7" }} />
                    </div>
                  ) : threats.length === 0 ? (
                    <div className="rounded-2xl p-16 text-center" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
                      <ShieldCheck className="w-16 h-16 mx-auto mb-3" style={{ color: "rgba(16,185,129,0.5)" }} />
                      <p className="text-base font-black" style={{ color: "rgba(196,181,253,0.85)" }}>لا توجد محاولات تسلل</p>
                      <p className="text-xs font-bold mt-2" style={{ color: "rgba(196,181,253,0.6)" }}>النظام يعمل بأمان</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {threats.map((t) => (
                        <div key={t.id} className="rounded-[24px] p-6 space-y-4" style={{ background: "#221540", border: "1px solid rgba(239,68,68,0.35)" }}>
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.2)" }}>
                                <ShieldAlert className="w-5 h-5 text-red-400" />
                              </div>
                              <div>
                                <p className="font-black text-red-300 text-sm">محاولة اختراق</p>
                                <p className="text-[10px] font-mono font-bold mt-0.5" style={{ color: "rgba(196,181,253,0.7)" }}>
                                  #{t.id.slice(-8).toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(196,181,253,0.9)" }}>
                              {new Date(t.createdAt).toLocaleString("ar-EG")}
                            </span>
                          </div>

                          {/* Details */}
                          {t.details && (
                            <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.08)" }}>
                              <p className="text-[10px] font-black mb-1" style={{ color: "#fca5a5" }}>التفاصيل</p>
                              <p className="text-xs font-bold" style={{ color: "rgba(254,202,202,0.95)" }}>{t.details}</p>
                            </div>
                          )}

                          {/* Grid info */}
                          <div className="grid grid-cols-2 gap-3">
                            <ThreatInfoCell icon={<Hash className="w-3.5 h-3.5" />} label="IP" value={t.ip ?? "—"} mono />
                            <ThreatInfoCell icon={<Globe className="w-3.5 h-3.5" />} label="الدولة" value={t.country ?? "—"} />
                            <ThreatInfoCell icon={<MapPin className="w-3.5 h-3.5" />} label="المدينة" value={t.city ?? "—"} />
                            <ThreatInfoCell icon={<Building2 className="w-3.5 h-3.5" />} label="مزود الخدمة" value={t.isp ?? "—"} />
                            <ThreatInfoCell icon={<Compass className="w-3.5 h-3.5" />} label="المتصفح" value={t.browser ?? "—"} />
                            <ThreatInfoCell icon={<Monitor className="w-3.5 h-3.5" />} label="نظام التشغيل" value={t.os ?? "—"} />
                            <ThreatInfoCell icon={<Smartphone className="w-3.5 h-3.5" />} label="الجهاز" value={t.device ?? "—"} />
                            <ThreatInfoCell icon={<Languages className="w-3.5 h-3.5" />} label="اللغة" value={t.language ?? "—"} />
                          </div>

                          {/* User Agent */}
                          {t.userAgent && (
                            <details className="rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                              <summary className="cursor-pointer p-3 text-[10px] font-black" style={{ color: "rgba(196,181,253,0.85)" }}>
                                عرض User-Agent الكامل
                              </summary>
                              <p className="px-3 pb-3 text-[10px] font-mono break-all" style={{ color: "rgba(196,181,253,0.7)" }}>
                                {t.userAgent}
                              </p>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "audit" && (
                <div className="p-8 space-y-5 max-w-[1500px] mx-auto animate-fadeIn">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <ScrollText className="w-8 h-8" style={{ color: "#a855f7" }} />
                        سجل العمليات
                      </h1>
                      <p className="text-sm font-bold mt-1" style={{ color: "rgba(196,181,253,0.95)" }}>
                        توثيق كامل لجميع العمليات الحساسة
                      </p>
                    </div>
                    <button
                      onClick={() => loadAuditLogs()}
                      disabled={auditLoading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition disabled:opacity-50"
                      style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(124,58,237,0.3)" }}
                    >
                      <RefreshCw className={"w-4 h-4 " + (auditLoading ? "animate-spin" : "")} />
                      تحديث
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setAuditFilter("ALL")}
                      className="px-4 py-2 rounded-xl text-xs font-black transition"
                      style={{
                        background: auditFilter === "ALL" ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(255,255,255,0.05)",
                        color: "white",
                        border: "1px solid rgba(124,58,237,0.3)",
                      }}
                    >
                      الكل ({auditLogs.length})
                    </button>
                    {auditActions.map((a) => (
                      <button
                        key={a.action}
                        onClick={() => setAuditFilter(a.action)}
                        className="px-4 py-2 rounded-xl text-xs font-black transition"
                        style={{
                          background: auditFilter === a.action ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(255,255,255,0.05)",
                          color: "white",
                          border: "1px solid rgba(124,58,237,0.3)",
                        }}
                      >
                        {a.action} ({a.count})
                      </button>
                    ))}
                  </div>

                  <div className="rounded-[24px] overflow-hidden" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="text-[11px] font-black" style={{ color: "rgba(196,181,253,0.85)", background: "rgba(124,58,237,0.08)" }}>
                          <th className="px-6 py-4 text-right">العملية</th>
                          <th className="px-6 py-4 text-right">المستخدم</th>
                          <th className="px-6 py-4 text-right">التفاصيل</th>
                          <th className="px-6 py-4 text-right">IP</th>
                          <th className="px-6 py-4 text-right">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLoading ? (
                          <tr><td colSpan={5} className="p-16 text-center">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin" style={{ color: "#a855f7" }} />
                          </td></tr>
                        ) : auditLogs.length === 0 ? (
                          <tr><td colSpan={5} className="p-16 text-center">
                            <ScrollText className="w-14 h-14 mx-auto mb-3" style={{ color: "rgba(196,181,253,0.4)" }} />
                            <p className="text-sm font-bold" style={{ color: "rgba(196,181,253,0.75)" }}>لا توجد عمليات مسجّلة</p>
                          </td></tr>
                        ) : auditLogs.map((log) => (
                          <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-black px-2.5 py-1 rounded-md" style={{ background: "rgba(124,58,237,0.2)", color: "#d8b4fe" }}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-black text-white">{log.actorEmail ?? "—"}</p>
                              <p className="text-[10px] font-bold mt-0.5" style={{ color: "rgba(196,181,253,0.75)" }}>{log.actorRole ?? "—"}</p>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold" style={{ color: "rgba(196,181,253,0.95)" }}>
                              {log.details ?? "—"}
                            </td>
                            <td className="px-6 py-4 font-mono text-[10px] font-bold" style={{ color: "rgba(196,181,253,0.7)" }}>
                              {log.ip ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-[11px] font-mono font-bold" style={{ color: "rgba(196,181,253,0.85)" }}>
                              {new Date(log.createdAt).toLocaleString("ar-EG")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal: view submission */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.3)" }}>
            <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white">مراجعة البحث العلمي</h3>
                  <p className="text-[11px] font-bold" style={{ color: "rgba(196,181,253,0.95)" }}>{viewingSubmission.student.studentProfile?.fullName} — {viewingSubmission.assignment.course}</p>
                </div>
              </div>
              <button onClick={() => setViewingSubmission(null)} className="p-2 rounded-lg transition" style={{ color: "rgba(196,181,253,0.95)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="p-6 rounded-xl whitespace-pre-wrap leading-loose text-sm font-bold" style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.85)" }}>
                {viewingSubmission.text}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: edit user role */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="rounded-[24px] shadow-2xl w-full max-w-md p-7" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.3)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
                  <UserCog className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-lg text-white">تعديل دور المستخدم</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 rounded-lg transition" style={{ color: "rgba(196,181,253,0.95)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs font-bold" style={{ color: "rgba(196,181,253,0.9)" }}>المستخدم</p>
              <p className="font-black text-white mt-0.5">{editingUser.studentProfile?.fullName ?? editingUser.facultyProfile?.fullName ?? editingUser.email}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: "rgba(196,181,253,0.75)" }}>{editingUser.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black mb-2" style={{ color: "rgba(196,181,253,0.95)" }}>اختر الدور الجديد:</p>
              {(["STUDENT", "FACULTY", "AFFAIRS", "ADMIN"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => handleChangeRole(editingUser, r)}
                  disabled={actionLoading || editingUser.role === r}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition font-black text-sm disabled:opacity-50"
                  style={{
                    borderColor: editingUser.role === r ? "#a855f7" : "rgba(255,255,255,0.1)",
                    background: editingUser.role === r ? "rgba(168,85,247,0.15)" : "transparent",
                    color: editingUser.role === r ? "#d8b4fe" : "white",
                  }}
                >
                  <span>{ROLE_LABELS[r]}</span>
                  {editingUser.role === r && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: reset password */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.85)" }}>
          <form onSubmit={handleResetPassword} className="rounded-[24px] shadow-2xl w-full max-w-md p-7" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.3)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #b45309)" }}>
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-lg text-white">إعادة تعيين كلمة المرور</h3>
              </div>
              <button type="button" onClick={() => setResetUser(null)} className="p-2 rounded-lg transition" style={{ color: "rgba(196,181,253,0.95)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-xs font-bold" style={{ color: "rgba(196,181,253,0.9)" }}>المستخدم</p>
              <p className="font-black text-white mt-0.5">{resetUser.studentProfile?.fullName ?? resetUser.facultyProfile?.fullName ?? resetUser.email}</p>
            </div>
            <label className="block text-xs font-black mb-2" style={{ color: "rgba(196,181,253,0.95)" }}>كلمة المرور الجديدة (8 أحرف على الأقل)</label>
            <input
              type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoFocus minLength={8} required
              placeholder="أدخل كلمة مرور جديدة..."
              className="w-full p-3.5 rounded-xl text-sm font-mono font-bold outline-none transition mb-5 placeholder:text-purple-300/40"
              style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "2px solid rgba(124,58,237,0.3)" }}
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setResetUser(null)} className="flex-1 font-black py-3 rounded-xl transition" style={{ background: "rgba(255,255,255,0.05)", color: "white" }}>إلغاء</button>
              <button type="submit" disabled={actionLoading || newPassword.length < 8} className="flex-1 disabled:opacity-50 text-white font-black py-3 rounded-xl transition" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                {actionLoading ? "جاري..." : "تعيين"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="rounded-[24px] shadow-2xl w-full max-w-md p-8 text-center" style={{ background: "#221540", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(239,68,68,0.15)" }}>
              <AlertCircle className="w-8 h-8" style={{ color: "#fca5a5" }} />
            </div>
            <h3 className="font-black text-lg text-white mb-2">تأكيد الحذف النهائي</h3>
            <p className="text-sm font-bold mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
              سيتم حذف المستخدم<br/>
              <span className="font-black" style={{ color: "#d8b4fe" }}>«{confirmDelete.studentProfile?.fullName ?? confirmDelete.facultyProfile?.fullName ?? confirmDelete.email}»</span>
              <br/>وكل بياناته المرتبطة نهائياً.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 font-black py-3 rounded-xl transition" style={{ background: "rgba(255,255,255,0.05)", color: "white" }}>إلغاء</button>
              <button onClick={() => handleDelete(confirmDelete.id)} disabled={actionLoading} className="flex-1 disabled:opacity-50 text-white font-black py-3 rounded-xl transition" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                {actionLoading ? "جاري..." : "حذف نهائي"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
}

function StatCard({ icon, label, value, hint, gradient }: { icon: React.ReactNode; label: string; value: number; hint: string; gradient: string }) {
  return (
    <div className="rounded-[24px] p-6 transition-all duration-300 relative overflow-hidden group" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)"; }}
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: gradient }} />
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4" style={{ background: gradient }}>
          {icon}
        </div>
        <p className="text-[11px] font-black mb-1" style={{ color: "rgba(196,181,253,0.9)" }}>{label}</p>
        <p className="text-4xl font-black text-white leading-none mb-2">{value}</p>
        <p className="text-[10px] font-bold" style={{ color: "rgba(196,181,253,0.65)" }}>{hint}</p>
      </div>
    </div>
  );
}

function MiniCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3 transition" style={{ background: "#221540", border: "1px solid rgba(124,58,237,0.35)" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}22`, color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black" style={{ color: "rgba(196,181,253,0.9)" }}>{label}</p>
        <p className="text-2xl font-black text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-black text-white">{label}</span>
        <span className="text-xs font-black" style={{ color }}>{value} <span className="text-[10px] font-bold" style={{ color: "rgba(196,181,253,0.75)" }}>({percent}%)</span></span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, background: color, boxShadow: `0 0 12px ${color}` }} />
      </div>
    </div>
  );
}

function ProgressRing({ percent, size, stroke, color, label, sublabel }: { percent: number; size: number; stroke: number; color: string; label: string; sublabel: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-black text-white leading-none">{label}</p>
        <p className="text-[10px] font-black mt-1" style={{ color: "rgba(196,181,253,0.9)" }}>{sublabel}</p>
      </div>
    </div>
  );
}


function ThreatInfoCell({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex items-center gap-1.5 mb-1" style={{ color: "rgba(196,181,253,0.75)" }}>
        {icon}
        <span className="text-[9px] font-black">{label}</span>
      </div>
      <p className={`text-xs font-bold truncate ${mono ? "font-mono" : ""}`} style={{ color: "#fafafa" }} title={value}>
        {value}
      </p>
    </div>
  );
}
