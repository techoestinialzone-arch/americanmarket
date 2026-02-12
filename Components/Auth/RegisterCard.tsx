"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// ────────────────────────────────────────────────
// Helper: Password Validator
// ────────────────────────────────────────────────
function getPasswordStrength(pw: string) {
  return {
    length: pw.length >= 10,
    number: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
}

export default function RegisterCard() {
  const router = useRouter();
  
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Calculate Real-time Password Strength
  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const isPasswordValid = strength.length && strength.number && strength.symbol;

  // Form Validity Check
  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (!form.email.includes("@")) return false;
    if (!isPasswordValid) return false;
    if (form.password !== form.confirmPassword) return false;
    if (!form.acceptTerms) return false;
    return true;
  }, [form, loading, isPasswordValid]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // 1. Call your actual registration API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }
      
      // 2. Success Feedback
      setSuccess("Account created successfully. Redirecting to login...");
      
      // 3. Redirect to Login Page (FIXED PATH)
      setTimeout(() => {
        router.push("/login"); // 👈 Changed from "/" to "/login"
      }, 1000);

    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0A0A0A] border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <form onSubmit={onSubmit} className="space-y-6">
        
        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 ml-1">Email</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            className="w-full rounded-lg border border-slate-800 bg-[#111] px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 ml-1">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••"
            className="w-full rounded-lg border border-slate-800 bg-[#111] px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 ml-1">Confirm Password</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••"
            className={`w-full rounded-lg border bg-[#111] px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:outline-none focus:ring-1 
              ${form.confirmPassword && form.password !== form.confirmPassword 
                ? "border-red-900 focus:border-red-500 focus:ring-red-500" 
                : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500"
              }`}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </div>

        {/* Password Criteria Checklist */}
        <div className="rounded-lg border border-slate-800/50 bg-slate-900/30 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Security Requirements
          </p>
          <div className="space-y-2">
            <RequirementItem met={strength.length} text="Minimum 10 characters" />
            <RequirementItem met={strength.number} text="Contains at least 1 number" />
            <RequirementItem met={strength.symbol} text="Contains at least 1 symbol" />
          </div>
        </div>

        {/* Terms Checkbox */}
        <label className="flex items-start gap-3 p-1 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 transition-colors group-hover:border-slate-500"
            checked={form.acceptTerms}
            onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
          />
          <span className="text-xs leading-5 text-slate-400 select-none">
            I agree to the{" "}
            <a href="/terms" className="text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-white">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-white">
              Privacy Policy
            </a>
            .
          </span>
        </label>

        {/* Status Messages */}
        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-900/10 p-3 text-xs font-medium text-red-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-900/50 bg-emerald-900/10 p-3 text-xs font-medium text-emerald-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating Account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>
    </div>
  );
}

// ────────────────────────────────────────────────
// Sub-Component: Password Requirement Item
// ────────────────────────────────────────────────
function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${met ? "text-emerald-400" : "text-slate-600"}`}>
      {met ? (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <div className="h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );
}