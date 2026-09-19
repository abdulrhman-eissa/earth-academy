"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Bell, CheckCheck, FileText, Award, Info, Loader2, X } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

function iconFor(type: string) {
  switch (type) {
    case "RESEARCH_SUBMITTED": return <FileText className="w-4 h-4 text-blue-600" />;
    case "GRADE_ADDED":
    case "GRADE_UPDATED": return <Award className="w-4 h-4 text-emerald-600" />;
    default: return <Info className="w-4 h-4 text-gray-500" />;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30) return `منذ ${d} يوم`;
  return new Date(iso).toLocaleDateString("ar-EG");
}

const POLL_INTERVAL_MS = 3000;

export default function NotificationBell({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);
  const firstLoadRef = useRef(true);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: Notification[]; unreadCount: number };
      const newUnread = data.unreadCount ?? 0;

      // كشف إشعار جديد
      if (!firstLoadRef.current && newUnread > prevUnreadRef.current) {
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
      }
      prevUnreadRef.current = newUnread;
      firstLoadRef.current = false;

      setNotifications(data.notifications ?? []);
      setUnread(newUnread);
    } catch { /* silent */ } finally { if (showLoading) setLoading(false); }
  }, []);

  // Initial load
  useEffect(() => { void load(true); }, [load]);

  // Polling every 5s
  useEffect(() => {
    const interval = setInterval(() => { void load(); }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Refresh لما الصفحة ترجع للـ focus
  useEffect(() => {
    function onFocus() { void load(); }
    function onVisibility() { if (!document.hidden) void load(); }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    prevUnreadRef.current = 0;
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => {
      const next = Math.max(0, u - 1);
      prevUnreadRef.current = next;
      return next;
    });
  }

  const isDark = variant === "dark";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) void load(); }}
        className={`relative p-3 rounded-2xl transition ${
          isDark
            ? "bg-white/15 hover:bg-white/25 border border-white/20 text-white"
            : "bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700"
        }`}
        title="الإشعارات"
      >
        <Bell className={`w-5 h-5 ${pulse ? "animate-bounce" : ""}`} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1.5 shadow-lg">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-gray-200 z-[100] overflow-hidden" dir="rtl">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-700" />
              <h3 className="font-extrabold text-gray-900 text-sm">الإشعارات</h3>
              {unread > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unread} جديد
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => void load(true)}
                disabled={loading}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
                title="تحديث"
              >
                <Loader2 className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> تحديث
              </button>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50 transition"
                  title="تعليم الكل كمقروء"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> الكل
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center">
                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-bold">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.isRead) void markRead(n.id); }}
                  className={`w-full text-right p-4 border-b border-gray-50 hover:bg-gray-50 transition flex gap-3 ${
                    n.isRead ? "opacity-70" : "bg-emerald-50/40"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    n.isRead ? "bg-gray-100" : "bg-white shadow-sm"
                  }`}>
                    {iconFor(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${n.isRead ? "font-bold text-gray-700" : "font-extrabold text-gray-900"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-mono">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
