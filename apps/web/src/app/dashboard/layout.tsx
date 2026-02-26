"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className={`min-h-screen bg-bg-page transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
      <header className="sticky top-0 z-50 bg-bg-surface/80 backdrop-blur-md border-b border-border transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-text transition-transform group-hover:rotate-12">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-text-primary uppercase font-['Space_Grotesk'] leading-none">ID Formatter</span>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Ethiopian National ID Tool</span>
            </div>
          </div>

        <nav className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
          <Link href="#how-it-works" className="hover:text-text-primary transition-colors">How it works</Link>
          <Link href="/dashboard/credits" className="hover:text-text-primary transition-colors">Pricing</Link>
          <button className="hover:text-text-primary transition-colors">Help</button>
        </nav>

        <div className="flex items-center gap-6">
          <div className="flex items-center bg-bg-surface border border-border rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest text-text-secondary focus-within:ring-2 focus-within:ring-accent">
            <button className="text-accent focus:outline-none">EN</button>
            <span className="mx-2 opacity-30">|</span>
            <button className="hover:text-text-primary transition-colors focus:outline-none">አማ</button>
          </div>

          <button 
            onClick={() => setIsDark(!isDark)}
            className="w-10 h-10 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title="Toggle Theme"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            )}
          </button>

           <Link href="/dashboard/credits" className="group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl">
            <div className="relative flex items-center gap-3 bg-accent/5 backdrop-blur-md px-4 py-2 rounded-xl border border-accent/20 shadow-sm transition-transform hover:scale-[1.02]">
               <span className="text-base leading-none">🪙</span>
               <div className="flex items-center gap-2">
                 <span className="text-xs font-black text-text-primary uppercase tracking-widest">● 7 Credits</span>
               </div>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
             </div>
             <button className="text-[10px] font-black text-text-secondary hover:text-text-primary transition-colors uppercase tracking-widest hidden sm:block">Logout</button>
          </div>
        </div>
      </div>
    </header>
      
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
