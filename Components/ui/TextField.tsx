"use client";

import React from "react";

export default function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  rightAdornment,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  rightAdornment?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={type}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition
                     focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-500/10"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {rightAdornment ? (
          <div className="absolute inset-y-0 right-2 flex items-center">{rightAdornment}</div>
        ) : null}
      </div>
    </div>
  );
}
