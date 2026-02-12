import React from "react";

export default function InlineAlert({
  variant,
  text,
}: {
  variant: "error" | "info" | "success";
  text: string;
}) {
  const styles =
    variant === "error"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
      : variant === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : "border-white/10 bg-white/[0.04] text-slate-200";

  return (
    <div className={`rounded-xl border px-4 py-3 text-xs ${styles}`}>
      {text}
    </div>
  );
}
