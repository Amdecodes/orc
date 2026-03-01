"use client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export function Header() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [isDark, setIsDark] = useState(true);
  const [liveCredits, setLiveCredits] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setLiveCredits(data.credits);
      }
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchCredits();
      const interval = setInterval(fetchCredits, 15000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Close menu on navigation
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  if (isPending) return null;

  const handleLogout = async () => {
    setMenuOpen(false);
    await authClient.signOut();
    router.push("/login");
  };

  const user = session?.user;
  const displayCredits = liveCredits !== null ? liveCredits : (user?.credits ?? 0);

  return (
    <>
      <header className="sticky top-0 z-50 bg-bg-surface/80 backdrop-blur-md border-b border-border transition-all duration-300">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 xl:px-12 h-16 flex items-center justify-between gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-text-primary flex items-center justify-center text-bg-surface transition-transform group-hover:rotate-12">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-lg font-black tracking-tight text-text-primary uppercase font-['Space_Grotesk'] leading-none">ID Formatter</span>
              <span className="text-[8px] sm:text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Ethiopian National ID Tool</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
            <Link href="/" className="hover:text-text-primary transition-colors">{t('home')}</Link>
            {user && (
              <>
                <Link href="/dashboard" className="hover:text-text-primary transition-colors">{t('dashboard')}</Link>
                <Link href="/dashboard/history" className="hover:text-text-primary transition-colors">{t('history')}</Link>
                <Link href="/dashboard/credits" className="hover:text-text-primary transition-colors">{t('credits')}</Link>
                {user.role === "ADMIN" && (
                  <Link
                    href={typeof window !== "undefined" ? `http://admin.${window.location.host}` : "#"}
                    className="text-accent hover:text-accent-hover transition-colors"
                  >
                    {t('nav_admin')}
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
              className="px-3 h-9 rounded-lg bg-bg-surface border border-border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all focus-visible:outline-none"
              title="Switch Language"
            >
              <Globe className="w-4 h-4 text-accent" />
              <span className="hidden xs:inline">{language === 'en' ? 'Amharic' : 'English'}</span>
              <span className="xs:hidden">{language === 'en' ? 'AM' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-9 h-9 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              title="Toggle Theme"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            {user ? (
              <>
                {/* Credit Badge — always visible */}
                <Link href="/dashboard/credits">
                  <div className="flex items-center gap-1.5 bg-accent/10 px-3 py-1.5 rounded-xl border border-accent/20 hover:bg-accent/15 transition-all">
                    <span className="text-base leading-none">🪙</span>
                    <span className="text-[10px] font-black text-text-primary uppercase tracking-widest whitespace-nowrap">{displayCredits}</span>
                  </div>
                </Link>

                {/* Desktop Logout */}
                <button
                  onClick={handleLogout}
                  className="text-[10px] font-black text-text-secondary hover:text-text-primary transition-colors uppercase tracking-widest hidden lg:block"
                >
                  {t('logout')}
                </button>

                {/* Hamburger — mobile only */}
                <button
                  onClick={() => setMenuOpen(true)}
                  className="lg:hidden w-9 h-9 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-all"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors">
                  {t('login')}
                </Link>
                <Link href="/register" className="relative group hidden xs:block">
                  <div className="absolute -inset-0.5 bg-accent/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
                  <div className="relative bg-text-primary text-bg-surface px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all">
                    {t('register')}
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Menu Overlay */}
      {user && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          />

          {/* Drawer */}
          <div className={`fixed top-0 right-0 h-full w-72 z-50 bg-bg-surface border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('signed_in_as')}</p>
                <p className="text-sm font-black text-text-primary truncate max-w-[180px]">{user.name || user.email}</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Credit Highlight */}
            <Link href="/dashboard/credits" onClick={() => setMenuOpen(false)} className="mx-6 mt-6">
              <div className="flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-2xl px-5 py-4 hover:bg-accent/15 transition-colors">
                <span className="text-2xl">🪙</span>
                <div>
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{t('available_credits')}</p>
                  <p className="text-2xl font-black text-text-primary">{displayCredits}</p>
                </div>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="flex flex-col gap-1 px-4 mt-6">
              {[
                { href: "/", label: t('home') },
                { href: "/dashboard", label: t('dashboard') },
                { href: "/dashboard/history", label: t('history') },
                { href: "/dashboard/credits", label: t('nav_buy_credits') },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[11px] font-black text-text-secondary hover:text-text-primary hover:bg-bg-muted uppercase tracking-[0.2em] transition-all"
                >
                  {item.label}
                </Link>
              ))}
              {user.role === "ADMIN" && (
                <Link
                  href={typeof window !== "undefined" ? `http://admin.${window.location.host}` : "#"}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[11px] font-black text-accent hover:bg-bg-muted uppercase tracking-[0.2em] transition-all"
                >
                  {t('nav_admin_portal')}
                </Link>
              )}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Logout */}
            <div className="px-6 pb-8 pt-4 border-t border-border">
              <button
                onClick={handleLogout}
                className="w-full h-12 rounded-2xl border-2 border-border text-[11px] font-black text-text-secondary hover:text-destructive hover:border-destructive/50 uppercase tracking-widest transition-all"
              >
                {t('nav_sign_out')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
