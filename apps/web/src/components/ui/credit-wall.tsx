"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CreditWallProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditWall({ isOpen, onClose }: CreditWallProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-bg-page/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative group w-full max-w-md overflow-hidden rounded-[2.5rem] bg-bg-surface border border-border p-10 space-y-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-500">
        
        <div className="text-center space-y-6 relative">
          <div className="w-20 h-20 bg-accent/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent/10">
             <span className="text-4xl filter drop-shadow-lg">🪙</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-text-primary font-['Space_Grotesk']">
              Low Balance
            </h2>
            <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">
              Standard Account
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2 relative">
          <Link href="/dashboard/credits" className="block relative group/btn">
            <Button className="relative w-full h-14 text-sm font-black uppercase tracking-widest rounded-xl bg-accent text-accent-text hover:bg-accent-hover transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg">
              ADD CREDITS
            </Button>
          </Link>
          <a href="https://t.me/AdminUsername" target="_blank" rel="noreferrer" className="block text-center text-[10px] font-black text-text-muted hover:text-text-primary transition-colors uppercase tracking-[0.4em] py-2">
            Speak with Support
          </a>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-text-muted hover:text-text-primary transition-all duration-300 z-20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
}
