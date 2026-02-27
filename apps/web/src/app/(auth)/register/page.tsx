"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    await authClient.signUp.email({
        email,
        password,
        name,
        telegramId: "",
        callbackURL: "/dashboard"
    }, {
        onError: (ctx) => {
            setError(ctx.error.message || "Registration failed");
            setIsLoading(false);
        },
        onSuccess: () => {
            // Redirect is handled by callbackURL or middleware
        }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-1/2 right-1/2 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative group">
        <div className="absolute -inset-1 bg-gradient-to-t from-white/5 to-transparent rounded-[3.5rem] blur-xl opacity-50" />
        
        <div className="relative space-y-10 p-12 bg-bg-surface backdrop-blur-3xl rounded-[3.5rem] border border-border shadow-xl overflow-hidden">
          <div className="border-beam inset-0 opacity-20" />

          <div className="text-center space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 text-2xl font-black tracking-tighter text-text-primary font-['Space_Grotesk'] hover:scale-105 transition-transform">
              <div className="w-10 h-10 bg-text-primary rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-bg-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              </div>
              FORMATTER
            </Link>
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter text-text-primary font-['Space_Grotesk']">Enrollment</h2>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.4em]">System Registration v2.0</p>
            </div>
          </div>

          <form className="space-y-8" onSubmit={handleRegister}>
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-bold text-center uppercase tracking-widest">
                {error}
              </div>
            )}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1" htmlFor="name">Operator Name</label>
                <Input
                  id="name"
                  type="text"
                  className="h-16 bg-bg-muted border-border rounded-2xl font-bold text-text-primary placeholder:text-text-muted px-6 focus:ring-1 focus:ring-accent/40 transition-all"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1" htmlFor="email">Identity Email</label>
                <Input
                  id="email"
                  type="email"
                  className="h-16 bg-bg-muted border-border rounded-2xl font-bold text-text-primary placeholder:text-text-muted px-6 focus:ring-1 focus:ring-accent/40 transition-all"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1" htmlFor="password">Access Key</label>
                <Input
                  id="password"
                  type="password"
                  className="h-16 bg-bg-muted border-border rounded-2xl font-bold text-text-primary placeholder:text-text-muted px-6 focus:ring-1 focus:ring-accent/40 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="text-[9px] text-text-muted font-black text-center px-4 uppercase tracking-[0.2em] leading-relaxed">
              By enrolling, you authorize use of the <Link href="#" className="underline text-text-primary hover:text-accent">Precision Engine</Link> and agree to <Link href="#" className="underline text-text-primary hover:text-accent">Terms</Link>.
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-16 text-lg font-black rounded-2xl bg-accent text-accent-text hover:bg-accent-hover shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>

          <div className="text-center">
             <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
               Registered operator?{" "}
               <Link href="/login" className="text-text-primary hover:text-accent transition-colors underline underline-offset-4">
                 Access System
               </Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
