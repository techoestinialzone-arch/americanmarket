"use client";

export function StatusPill({ status }: { status: "unpaid" | "confirming" | "paid" | "expired" }) {
  const cls =
    status === "paid"
      ? "bg-green-900/40 text-green-200"
      : status === "confirming"
      ? "bg-yellow-900/40 text-yellow-200"
      : status === "expired"
      ? "bg-red-900/40 text-red-200"
      : "bg-neutral-800 text-neutral-200";

  const label =
    status === "paid" ? "Paid" : status === "confirming" ? "Confirming" : status === "expired" ? "Expired" : "Waiting for payment";

  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${cls}`}>{label}</span>;
}
