"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({
  children,
  title = "AMERICAN MARKET",
  statusLabel = "System Online",
  footerText = "© 2026 American Market. Secure connection established.",
}: {
  children: React.ReactNode;
  title?: string;
  statusLabel?: string;
  footerText?: string;
}) {
  const router = useRouter();
  const [stealthCount, setStealthCount] = useState(0);


  const handleStealthAccess = () => {
    const newCount = stealthCount + 1;
    setStealthCount(newCount);
    
    if (newCount === 5) {
      
      document.body.style.backgroundColor = "#220000"; 
      setTimeout(() => {
        router.push("/admin/login"); // 👈 Redirects to your Admin Login
      }, 300);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-slate-300 font-mono selection:bg-emerald-500/30 selection:text-emerald-400 flex flex-col relative overflow-hidden transition-colors duration-500">
      
      {/* 1. Professional Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        {/* Subtle Radial Glow at Top */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_0%,#0c1a12,transparent)]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-[#050505]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
          
          {/* Logo Area */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-900/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="leading-none">
              <div className="text-white font-bold tracking-tighter text-lg">
                AMERICAN<span className="text-emerald-500">MARKET</span>
              </div>
              <div className="text-[10px] text-emerald-500/60 tracking-widest uppercase mt-1">
                Portal Access
              </div>
            </div>
          </div>

          {/* Status Indicator (STEALTH TRIGGER) */}
          <div className="hidden md:flex items-center gap-3">
            <div 
                onClick={handleStealthAccess} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/10 bg-emerald-500/5 cursor-default select-none active:bg-emerald-500/10 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">{statusLabel}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#050505]/80 backdrop-blur-xl py-6 text-center">
        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
          {footerText}
        </p>
      </footer>
    </main>
  );
}