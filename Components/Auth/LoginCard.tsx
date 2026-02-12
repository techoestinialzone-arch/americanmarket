"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CardShell from "../ui/CardShell";
import TextField from "../ui/TextField";
import Button from "../ui/Button";
import InlineAlert from "../ui/InlineAlert";

type LoginState = {
  email: string;
  password: string;
};

export default function LoginCard() {
  const router = useRouter();
  const [form, setForm] = useState<LoginState>({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const canSubmit = useMemo(() => {
    // Keep basic client-side checks for UX, but let server handle strict validation
    return form.email.trim().length > 0 && form.password.trim().length > 0 && !loading;
  }, [form, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Call your secure API
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific errors from the API (e.g., "Invalid credentials")
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      // 2. Success Sequence
      // Refresh the router to ensure Server Components (like Navbar) update their auth state
      router.refresh(); 
      router.push("/dashboard");

    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <CardShell
      title="Sign in"
      subtitle="Use your account credentials to continue."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(v) => setForm((s) => ({ ...s, email: v }))}
          placeholder="you@company.com"
        />

        <TextField
          label="Password"
          type={showPw ? "text" : "password"}
          autoComplete="current-password"
          value={form.password}
          onChange={(v) => setForm((s) => ({ ...s, password: v }))}
          placeholder="••••••••"
          rightAdornment={
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="rounded-lg px-3 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          }
        />

        {error ? <InlineAlert variant="error" text={error} /> : null}

        <Button type="submit" disabled={!canSubmit} loading={loading}>
          Continue
        </Button>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <a href="/register" className="hover:text-white underline-offset-4 hover:underline">
            Create account
          </a>
          <a href="/forgot-password" className="hover:text-white underline-offset-4 hover:underline">
            Forgot password?
          </a>
        </div>

        <div className="pt-3 text-[11px] text-slate-500 leading-relaxed">
          Tip: enable MFA for stronger protection. Authentication security must be enforced server-side.
        </div>
      </form>
    </CardShell>
  );
}