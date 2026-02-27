"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-8 animate-in fade-in duration-700">
      <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center text-4xl border border-accent/20">
        ⚠️
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl font-black text-text-primary uppercase tracking-tight font-['Space_Grotesk']">
          Unexpected Error
        </h2>
        <p className="text-text-secondary font-medium max-w-sm mx-auto uppercase tracking-widest text-[10px]">
          Something went wrong while processing your request. Please try again.
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="px-10 h-16 bg-accent text-accent-text font-black rounded-2xl uppercase tracking-widest hover:bg-accent-hover transition-all shadow-xl active:scale-95"
      >
        Retry Action
      </button>
    </div>
  );
}
