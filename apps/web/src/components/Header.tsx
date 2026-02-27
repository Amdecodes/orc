"use client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function Header() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
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

  if (isPending) return null;

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 bg-bg-surface/80 backdrop-blur-md border-b border-border transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group cursor-pointer">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-text-primary flex items-center justify-center text-bg-surface transition-transform group-hover:rotate-12">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-lg font-black tracking-tight text-text-primary uppercase font-['Space_Grotesk'] leading-none">ID Formatter</span>
              <span className="text-[8px] sm:text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Ethiopian National ID Tool</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
            <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
            {user && (
              <>
                <Link href="/dashboard" className="hover:text-text-primary transition-colors">Dashboard</Link>
                <Link href="/dashboard/history" className="hover:text-text-primary transition-colors">History</Link>
                <Link href="/dashboard/credits" className="hover:text-text-primary transition-colors">Credits</Link>
                {user.role === "ADMIN" && (
                  <Link 
                    href={typeof window !== "undefined" ? `http://admin.${window.location.host}` : "#"} 
                    className="text-accent hover:text-accent-hover transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title="Toggle Theme"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard/credits" className="hidden sm:block">
                <div className="flex items-center gap-2 bg-accent/5 px-4 py-2 rounded-xl border border-accent/20 transition-transform hover:scale-[1.02]">
                  <span className="text-sm">🪙</span>
                  <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">{user.credits} Credits</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="text-[10px] font-black text-text-secondary hover:text-text-primary transition-colors uppercase tracking-widest hidden sm:block"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors">
                Login
              </Link>
              <Link href="/register" className="relative group hidden xs:block">
                <div className="absolute -inset-0.5 bg-accent/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="relative bg-text-primary text-bg-surface px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all">
                  Register
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

