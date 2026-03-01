"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, Suspense } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";

function ResetPasswordContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full relative group">
      <div className="absolute -inset-1 bg-gradient-to-b from-white/5 to-transparent rounded-[3.5rem] blur-xl opacity-50" />
      
      <div className="relative space-y-10 p-12 bg-surface/50 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 shadow-3xl overflow-hidden">
        <div className="border-beam inset-0 opacity-20" />

        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-brand-violet" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tighter text-white font-['Space_Grotesk']">{t('new_password')}</h2>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">{t('complete_your_reset')}</p>
          </div>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-bold text-center uppercase tracking-widest">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-2xl text-center space-y-4">
              <div className="text-green-500 font-black uppercase tracking-widest text-sm">{t('success_exclamation')}</div>
              <p className="text-xs text-text-muted font-bold leading-relaxed">
                {t('password_reset_success')}
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-500" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1" htmlFor="email">{t('email_address')}</label>
                <Input
                  id="email"
                  type="email"
                  className="h-16 bg-black/10 border-white/5 rounded-2xl font-bold text-text-muted/50 px-6 cursor-not-allowed"
                  value={email}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1" htmlFor="code">{t('verification_code')}</label>
                <Input
                  id="code"
                  type="text"
                  className="h-16 bg-black/40 border-white/5 rounded-2xl font-bold text-center text-2xl tracking-[0.5em] text-white placeholder:text-text-muted px-6 focus:ring-1 focus:ring-brand-violet/40 transition-all"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1" htmlFor="password">{t('new_password')}</label>
                <Input
                  id="password"
                  type="password"
                  className="h-16 bg-black/40 border-white/5 rounded-2xl font-bold text-white placeholder:text-text-muted px-6 focus:ring-1 focus:ring-brand-violet/40 transition-all"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-16 text-lg font-black rounded-2xl bg-white text-black hover:bg-white/90 shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    t('reset_password').toUpperCase()
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-violet/5 blur-[120px] rounded-full pointer-events-none" />
      <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-brand-violet" />}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
