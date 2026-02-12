"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [text, setText] = useState("");
  const fullText = "ESTABLISHING SECURE CONNECTION...";

  // Professional typing effect
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-slate-300 font-mono flex flex-col items-center justify-center relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-400">
      
      {/* 1. Professional Background Image with Heavy Overlay */}
      <div className="absolute inset-0 z-0">
        {/* High-res abstract tech background */}
        <img 
          src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop" 
          alt="Data Network Background" 
          className="w-full h-full object-cover opacity-30 scale-105 animate-in fade-in duration-2000"
        />
        {/* Gradient overlays to ensure text readability and professional fade into black */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-[#050505]/60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,transparent,#050505)]"></div>
      </div>
      
      {/* 2. Main Container */}
      <div className="relative z-10 w-full max-w-5xl p-6 flex flex-col items-center">
        
        {/* Status Bar */}
        <div className="w-full flex justify-between text-[10px] uppercase tracking-[0.2em] text-emerald-600/60 mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <span>Sys.v.4.0.2</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-16 w-full">
          
          {/* LEFT SIDE: Main Typography */}
          <div className="flex-1 text-center md:text-left space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
            <div className="space-y-4">
              {/* Increased size for more impact now that the image is gone */}
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]">
                AMERICAN<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 drop-shadow-[0_0_35px_rgba(16,185,129,0.4)]">MARKET</span>
              </h1>
              <div className="h-6 flex items-center justify-center md:justify-start gap-3 text-sm text-emerald-500/80 font-medium tracking-wider">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>{text}</span>
              </div>
            </div>
            <p className="text-slate-400 max-w-md mx-auto md:mx-0 text-sm leading-relaxed hidden md:block">
                Secure decentralized exchange terminal. Advanced encryption protocols established for anonymous trading operations.
            </p>
          </div>

          {/* RIGHT SIDE: Access Panel (Card) */}
          <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-right-8 duration-1000 delay-500">
            <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-emerald-500/30 transition-colors duration-500">
              
              {/* Decorative Scanline & Glow */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent rotate-45 blur-3xl group-hover:translate-x-full transition-transform duration-1000"></div>

              <div className="mb-8 space-y-2">
                <h2 className="text-white text-xl font-bold tracking-tight">Portal Access</h2>
                <p className="text-xs text-slate-400">Authorized personnel authentication required to proceed to the terminal.</p>
              </div>

              <div className="space-y-4 relative z-10">
                <Link href="/login" className="block">
                  <button className="w-full group relative overflow-hidden rounded-lg bg-emerald-600 px-4 py-4 text-sm font-bold text-[#050505] transition-all hover:bg-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <span className="relative flex items-center justify-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                      INITIALIZE SESSION
                    </span>
                  </button>
                </Link>

                <Link href="/register" className="block">
                  <button className="w-full px-4 py-4 rounded-lg border border-white/10 bg-black/20 text-slate-300 text-sm font-medium hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:border-white/20">
                    Request Credentials
                  </button>
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c0 2.685-1.333 5.645-3.674 7.748a11.966 11.966 0 01-4.16 2.325 11.966 11.966 0 01-4.16-2.325C3.499 10.645 2.166 7.685 2.166 5zm7.834 2.5a.75.75 0 01.75.75v1.786l1.504 1.504a.75.75 0 01-1.06 1.06L9.5 10.81V8.25a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>
                  End-to-End Encrypted
                </div>
                <span>SHA-256</span>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Warning */}
        <div className="absolute bottom-4 text-center">
          <p className="text-[9px] text-slate-700 uppercase tracking-widest cursor-default">
            Unauthorized access prohibited. Connection monitored.
          </p>
        </div>

      </div>
    </main>
  );
}