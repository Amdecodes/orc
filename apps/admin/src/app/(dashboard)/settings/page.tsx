"use client";

import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function AdminSettingsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic">
          Security Settings
        </h1>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
          Access Control • Authentication Factors • Device Management
        </p>
      </div>

      <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/30 backdrop-blur-3xl overflow-hidden shadow-2xl">
        <UserProfile
          path="/settings"
          routing="path"
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#ffffff",
              colorBackground: "transparent",
              colorText: "#ffffff",
              colorTextSecondary: "#a1a1aa",
              borderRadius: "1rem",
              fontFamily: "Space Grotesk, sans-serif",
            },
            elements: {
              card: "bg-transparent shadow-none border-none",
              navbar: "bg-zinc-950/50 border-r border-white/5",
              navbarMobileMenuButton: "text-white",
              headerTitle: "text-white font-black uppercase tracking-tight",
              headerSubtitle: "text-zinc-500 font-bold uppercase text-[10px] tracking-widest",
              profileSectionTitleText: "text-white font-black uppercase tracking-tighter italic",
              breadcrumbsItem: "text-zinc-500 font-bold uppercase text-[9px]",
              breadcrumbsSeparator: "text-zinc-700",
              badge: "bg-white text-black font-black uppercase text-[9px]",
              formButtonPrimary: "bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest transition-all",
              formButtonReset: "text-zinc-400 hover:text-white font-bold uppercase text-[10px] tracking-widest",
              profilePage: "bg-transparent",
              scrollBox: "bg-transparent",
              userPreviewMainIdentifier: "text-white font-black",
              userPreviewSecondaryIdentifier: "text-zinc-500 font-bold",
            },
          }}
        />
      </div>

      <div className="p-8 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest">Protocol Version</p>
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-[0.2em]">Enforcing SHA-256 TOTP Algorithms</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Integrated</span>
        </div>
      </div>
    </div>
  );
}
