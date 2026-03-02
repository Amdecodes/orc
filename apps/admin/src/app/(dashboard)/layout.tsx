"use client";

import { UserButton, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-['Space_Grotesk']">
      {/* Admin Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-black tracking-tighter uppercase flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            ADMIN <span className="text-zinc-500 opacity-50">PORTAL</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] ml-8">
            <Link href="/" className="hover:text-white transition-colors">
              Overview
            </Link>
            <Link
              href="/payments"
              className="hover:text-white transition-colors"
            >
              Payments
            </Link>
            <Link href="/topups" className="hover:text-white transition-colors">
              Top-ups
            </Link>
            <Link href="/jobs" className="hover:text-white transition-colors">
              Jobs
            </Link>
            <Link href="/users" className="hover:text-white transition-colors">
              Users
            </Link>
            <Link
              href="/settings"
              className="hover:text-white transition-colors"
            >
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              Security: Enforced
            </span>
            <span className="text-[8px] font-medium text-emerald-500 uppercase tracking-[0.2em]">
              Active Session
            </span>
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <SignedIn>{children}</SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </main>

      <footer className="py-8 border-t border-zinc-900 text-center">
        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">
          © 2026 PRECISION IDENTITY SYSTEMS • ADMIN GATEWAY
        </p>
      </footer>
    </div>
  );
}
