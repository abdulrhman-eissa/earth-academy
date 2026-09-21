"use client";

import React, { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

type AlertColor = "blue" | "amber" | "red" | "emerald" | "purple";

export interface AlertItem {
  type: string;
  label: string;
  color: AlertColor;
  priority: number;
  icon?: React.ReactNode;
}

interface FloatingAlertProps {
  items: AlertItem[];
  variant?: "floating" | "bell";
  position?: "top-left" | "top-right";
}

const COLORS: Record<AlertColor, { bg: string; ring: string; glow: string }> = {
  blue: { bg: "bg-[#1e5eb8]", ring: "ring-blue-300", glow: "shadow-[#1e5eb8]/50" },
  amber: { bg: "bg-amber-500", ring: "ring-amber-300", glow: "shadow-amber-500/50" },
  red: { bg: "bg-red-600", ring: "ring-red-300", glow: "shadow-red-500/50" },
  emerald: { bg: "bg-emerald-600", ring: "ring-emerald-300", glow: "shadow-emerald-500/50" },
  purple: { bg: "bg-purple-600", ring: "ring-purple-300", glow: "shadow-purple-500/50" },
};

export default function FloatingAlert({
  items,
  variant = "floating",
  position = "top-left",
}: FloatingAlertProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const count = items.length;

  useEffect(() => {
    if (count > 0) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [count]);

  if (!mounted) return null;

  const main = items[0];
  const c = COLORS[main.color];

  if (variant === "bell") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={`relative p-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white transition ${visible ? "opacity-100" : "opacity-0"}`}
          title="التنبيهات"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 border-2 border-white shadow-lg">
            {count > 99 ? "99+" : count}
          </span>
        </button>

        {open && <AlertModal items={items} onClose={() => setOpen(false)} />}
      </>
    );
  }

  const positionClass = position === "top-left" ? "top-24 left-6" : "top-24 right-6";

  return (
    <>
      <div
        className={`fixed z-40 transition-all duration-300 ease-out ${positionClass} ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
        }`}
      >
        <button
          onClick={() => setOpen(true)}
          className={`group relative w-14 h-14 rounded-full ${c.bg} text-white flex items-center justify-center shadow-2xl ${c.glow} hover:scale-110 active:scale-95 transition-all ring-4 ${c.ring} ring-opacity-40`}
          title="التنبيهات"
        >
          <span className={`absolute inset-0 rounded-full ${c.bg} animate-ping opacity-25 pointer-events-none`} />
          <Bell className="w-6 h-6" strokeWidth={2.5} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-black min-w-[22px] h-[22px] rounded-full flex items-center justify-center px-1.5 border-2 border-white shadow-lg">
            {count > 99 ? "99+" : count}
          </span>
        </button>
      </div>

      {open && <AlertModal items={items} onClose={() => setOpen(false)} />}
    </>
  );
}

function AlertModal({ items, onClose }: { items: AlertItem[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#1e5eb8] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black">التنبيهات</h3>
              <p className="text-[11px] text-blue-100 font-bold">
                {items.length} {items.length === 1 ? "تنبيه" : "تنبيهات"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.map((item, i) => {
            const c = COLORS[item.color];
            return (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border-2 border-gray-100 bg-gray-50">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0 text-white`}>
                  {item.icon || <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 leading-relaxed">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-[#1e5eb8] hover:bg-[#1650a0] text-white font-black py-3 rounded-2xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
