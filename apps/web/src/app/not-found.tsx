import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg-page text-text-primary px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-accent/5 border border-accent/10 flex items-center justify-center text-4xl mb-4">
        🔍
      </div>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-['Space_Grotesk'] uppercase">
        404 — Page not found
      </h1>
      <p className="text-text-secondary text-sm sm:text-base font-bold uppercase tracking-widest max-w-md">
        This page doesn’t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 px-10 py-4 rounded-2xl bg-text-primary text-bg-surface font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.03] transition-all active:scale-95"
      >
        Go back home
      </Link>
    </div>
  );
}
