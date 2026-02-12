import React from "react";

export default function CardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
