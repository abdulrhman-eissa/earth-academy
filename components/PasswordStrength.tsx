"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { checkPasswordStrength, getPasswordRequirements } from "@/lib/password-strength";

export function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const strength = checkPasswordStrength(password);

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all"
            style={{ background: i <= strength.score ? strength.color : "#e5e7eb" }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black" style={{ color: strength.color }}>
          {strength.label}
        </span>
        <span className="text-[10px] font-bold text-gray-400">
          {strength.score + 1} من 5
        </span>
      </div>
    </div>
  );
}

export function PasswordRequirements({ password }: { password: string }) {
  const reqs = getPasswordRequirements(password);

  return (
    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
      <p className="text-[10px] font-black text-gray-500 mb-2">متطلبات كلمة المرور:</p>
      {reqs.map((req, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
              req.ok ? "bg-emerald-100" : "bg-gray-200"
            }`}
          >
            {req.ok ? (
              <Check className="w-2.5 h-2.5 text-emerald-700" />
            ) : (
              <X className="w-2.5 h-2.5 text-gray-400" />
            )}
          </div>
          <span className={`font-bold ${req.ok ? "text-emerald-700" : "text-gray-500"}`}>
            {req.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ConfirmPasswordMatch({ password, confirm }: { password: string; confirm: string }) {
  if (!confirm) return null;
  const match = password === confirm;

  return (
    <div className={`mt-2 flex items-center gap-2 text-[11px] font-black ${match ? "text-emerald-700" : "text-red-700"}`}>
      {match ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>كلمتا المرور متطابقتان</span>
        </>
      ) : (
        <>
          <X className="w-3.5 h-3.5" />
          <span>كلمتا المرور غير متطابقتين</span>
        </>
      )}
    </div>
  );
}
