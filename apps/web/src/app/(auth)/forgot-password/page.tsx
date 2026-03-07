"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  
  // Step 1 State
  const [email, setEmail] = useState("");
  
  // Step 2 State
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to send reset code");
      
      setSuccess(t('reset_code_sent'));
      setStep("reset");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError(t('passwords_dont_match'));
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to reset password. The code might be expired.");
      
      setSuccess(t('password_reset_success'));
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden text-text-primary">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-violet/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative group">
        <div className="absolute -inset-1 bg-gradient-to-b from-white/5 to-transparent rounded-[3.5rem] blur-xl opacity-50" />
        
        <div className="relative space-y-10 p-12 bg-surface/50 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 shadow-3xl overflow-hidden">
          <div className="border-beam inset-0 opacity-20" />

          <div className="text-center space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 text-2xl font-black tracking-tighter text-text-primary font-['Space_Grotesk'] hover:scale-105 transition-transform">
               <div className="w-10 h-10 bg-text-primary rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-bg-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
               </div>
               FORMATTER
            </Link>
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter text-text-primary font-['Space_Grotesk']">
                {step === "request" ? t('reset_access') : t('create_password')}
              </h2>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">
                {step === "request" ? t('secure_your_account') : t('code_sent_to', { email })}
              </p>
            </div>
          </div>

          <form className="space-y-8" onSubmit={step === "request" ? handleRequestOTP : handleResetPassword}>
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-bold text-center uppercase tracking-widest">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-success text-xs font-bold text-center uppercase tracking-widest">
                {success}
              </div>
            )}

            {step === "request" ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1" htmlFor="email">{t('email_address')}</label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    className="h-16 bg-bg-surface border border-border rounded-2xl font-bold text-text-primary placeholder:text-text-muted px-6 focus:ring-2 focus:ring-accent transition-all shadow-sm"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-lg font-black rounded-2xl bg-text-primary text-bg-surface hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                    disabled={isLoading || !email}
                  >
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      t('send_reset_code')
                    )}
                  </Button>
                </div>
                
                <div className="text-center">
                  <Link href="/login" className="inline-flex items-center justify-center gap-2 text-[10px] font-black text-text-muted hover:text-text-primary transition-colors uppercase tracking-[0.2em]">
                    <ArrowLeft className="w-3 h-3" /> {t('back_to_login')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1" htmlFor="code">{t('verification_code')}</label>
                  <Input
                    id="code"
                    type="text"
                    autoFocus
                    className="h-20 bg-bg-surface border border-border rounded-2xl font-bold text-center text-4xl tracking-[0.5em] text-text-primary placeholder:text-text-muted/40 px-6 focus:ring-2 focus:ring-accent transition-all shadow-sm"
                    placeholder="000000"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1" htmlFor="newPassword">{t('new_password')}</label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="h-16 bg-bg-surface border border-border rounded-2xl font-bold text-text-primary placeholder:text-text-muted px-6 pr-12 focus:ring-2 focus:ring-accent transition-all shadow-sm"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1" htmlFor="confirmPassword">{t('confirm_password')}</label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="h-16 bg-bg-surface border border-border rounded-2xl font-bold text-text-primary placeholder:text-text-muted px-6 pr-12 focus:ring-2 focus:ring-accent transition-all shadow-sm"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-lg font-black rounded-2xl bg-text-primary text-bg-surface hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                    disabled={isLoading || !code || !newPassword || !confirmPassword}
                  >
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      t('reset_password')
                    )}
                  </Button>
                </div>
                
                <div className="flex flex-col gap-4 items-center mt-6">
                  <button 
                    type="button" 
                    onClick={() => {
                      setStep("request");
                      setCode("");
                      setError("");
                      setSuccess("");
                    }}
                    className="text-[10px] font-black text-text-muted hover:text-text-primary uppercase tracking-widest transition-colors"
                  >
                    {t('mistyped_email_change')}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
