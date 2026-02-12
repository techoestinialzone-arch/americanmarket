"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "../actions"; 

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Toggle State
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const res = await adminLogin(formData);

    if (res.success) {
      router.push("/admin"); 
    } else {
      setError(res.error || "Access Denied");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4 font-mono selection:bg-red-900/50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border border-red-900/30 bg-[#0a0000] p-8 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.1)]">
        <h1 className="text-red-600 font-bold text-xl mb-6 text-center tracking-[0.2em]">ROOT ACCESS</h1>
        
        <div className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="text-red-500/50 text-[10px] font-bold block mb-1.5 tracking-wider">IDENTIFIER</label>
            <input 
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#110505] border border-red-900/30 text-white px-4 py-3 text-sm outline-none focus:border-red-600 focus:bg-red-950/10 transition-colors rounded"
              placeholder="admin@system.local"
            />
          </div>

          {/* Password Field with Toggle */}
          <div>
            <label className="text-red-500/50 text-[10px] font-bold block mb-1.5 tracking-wider">SECURITY KEY</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#110505] border border-red-900/30 text-white pl-4 pr-12 py-3 text-sm outline-none focus:border-red-600 focus:bg-red-950/10 transition-colors rounded"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500/40 hover:text-red-500 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 text-[10px] text-red-500 bg-red-500/10 p-3 border border-red-500/20 rounded">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <button 
          disabled={loading}
          className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3.5 rounded mt-8 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs tracking-widest shadow-lg shadow-red-900/20"
        >
          {loading ? "VERIFYING..." : "AUTHENTICATE"}
        </button>
      </form>
    </main>
  );
}