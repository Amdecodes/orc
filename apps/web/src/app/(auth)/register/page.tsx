"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!agreed) {
      setError(t('agree_to_terms_error'));
      setShowTermsError(true);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwords_dont_match'));
      setIsLoading(false);
      return;
    }

    try {
      const res = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (res.error) {
        throw new Error(res.error.message || "Registration failed");
      }

      router.push("/verify-email?email=" + encodeURIComponent(email));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (!agreed) {
      setError(t('agree_to_terms_error'));
      setShowTermsError(true);
      return;
    }
    setIsGoogleLoading(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-violet/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative group py-12">
        <div className="absolute -inset-1 bg-gradient-to-t from-white/5 to-transparent rounded-[3.5rem] blur-xl opacity-50" />
        
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
                {t('create_account')}
              </h2>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">
                {t('join_us_today')}
              </p>
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
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1" htmlFor="name">{t('your_full_name')}</label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  className="h-16 bg-bg-surface border border-border rounded-2xl font-bold text-text-primary placeholder:text-text-muted px-6 focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  placeholder={t('full_name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1" htmlFor="email">{t('email_address')}</label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="h-16 bg-bg-surface border border-border rounded-2xl font-bold text-text-primary placeholder:text-text-muted px-6 focus:ring-2 focus:ring-accent transition-all shadow-sm"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1" htmlFor="password">{t('password')}</label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="h-16 bg-bg-surface border border-border rounded-2xl font-bold text-text-primary placeholder:text-text-muted px-6 pr-12 focus:ring-2 focus:ring-accent transition-all shadow-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1" htmlFor="confirmPassword">{t('confirm')}</label>
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
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className={`flex items-start gap-4 px-2 rounded-xl p-3 border transition-colors ${showTermsError ? 'bg-error/10 border-error/50 ring-2 ring-error/20' : 'bg-text-muted/5 border-border/30'}`}>
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      if (e.target.checked) setShowTermsError(false);
                    }}
                    className={`w-5 h-5 bg-bg-surface appearance-none rounded focus:ring-brand-violet focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-page transition-colors cursor-pointer relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[6px] after:top-[2px] after:w-[6px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45 ${showTermsError ? 'border-[1.5px] border-error' : 'border-2 border-border checked:bg-brand-violet checked:border-brand-violet'}`}
                  />
                </div>
                <label htmlFor="terms" className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] leading-relaxed cursor-pointer select-none pt-[3px]">
                  {t('i_agree_to')} <Link href="/terms" target="_blank" className="underline underline-offset-4 text-text-primary hover:text-brand-violet transition-colors">{t('terms_of_service')}</Link> {t('and')} <Link href="/privacy" target="_blank" className="underline underline-offset-4 text-text-primary hover:text-brand-violet transition-colors">{t('privacy_policy')}</Link>.
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 text-lg font-black rounded-2xl bg-text-primary text-bg-surface hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3"
                disabled={isLoading || !name || !email || !password || !confirmPassword || !agreed}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  t('register')
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.5em]">
                  <span className="bg-background px-4 text-text-muted">{t('or')}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-16 border border-border/50 bg-bg-surface hover:bg-bg-muted rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-text-primary flex items-center justify-center gap-4 transition-all shadow-sm"
                onClick={handleGoogleRegister}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" className="text-blue-400" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" className="text-green-400" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="currentColor" className="text-yellow-400" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.49 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" className="text-red-400" />
                    </svg>
                    {t('continue_google')}
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="text-center">
             <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
               {t('already_have_account')}{" "}
               <Link href="/login" className="text-text-primary hover:text-brand-violet transition-colors underline underline-offset-4">
                 {t('login')}
               </Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
