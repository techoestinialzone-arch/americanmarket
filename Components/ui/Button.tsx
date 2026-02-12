"use client";

import React from "react";

export default function Button({
  children,
  disabled,
  loading,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-3 text-sm font-semibold text-black
                 shadow-lg shadow-cyan-500/10 transition hover:brightness-110 active:scale-[0.99]
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="inline-flex items-center justify-center gap-2">
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/60 border-t-transparent" />
            Please wait…
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
