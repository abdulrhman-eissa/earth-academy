"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("earth_theme");
    const initial = saved === "dark";
    setIsDark(initial);
    document.documentElement.classList.toggle("dark", initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("earth_theme", next ? "dark" : "light");
  }

  if (!mounted) return null;

  const baseClass = variant === "dark"
    ? "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
    : "bg-white hover:bg-gray-50 border border-gray-200 text-gray-700";

  return (
    <button
      onClick={toggle}
      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition shadow-sm ${baseClass}`}
      title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
      suppressHydrationWarning
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
