"use client";

import React from "react";

export default function ModalAlert({
  open,
  title,
  message,
  bullets,
  onClose,
}: {
  open: boolean;
  title: string;
  message?: string;
  bullets?: string[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0B101B] shadow-2xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">
          {message ? <p className="text-sm text-slate-300">{message}</p> : null}

          {bullets?.length ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-300 list-disc pl-5">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : null}

          <button
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold py-2.5 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
