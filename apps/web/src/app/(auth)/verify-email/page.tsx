"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

function VerifyEmailContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const [error, setError] = useState("");

  const handleResend = async () => {
    setIsResending(true);
    setError("");
    setResendSuccess("");
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/dashboard",
      });
      setResendSuccess(t("email_resent"));
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
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
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-2xl font-black tracking-tighter text-text-primary font-['Space_Grotesk'] hover:scale-105 transition-transform"
            >
              <div className="w-10 h-10 bg-text-primary rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-bg-surface"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  ></path>
                </svg>
              </div>
              FORMATTER
            </Link>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-brand-violet/10 border border-brand-violet/20 rounded-3xl flex items-center justify-center">
                  <Mail className="w-10 h-10 text-brand-violet" />
                </div>
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-text-primary font-['Space_Grotesk']">
                {t("check_your_email")}
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                {t("verification_email_sent")}{" "}
                <span className="font-bold text-text-primary">{email}</span>
                {t("verification_email_sent_suffix")}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-bold text-center uppercase tracking-widest">
                {error}
              </div>
            )}
            {resendSuccess && (
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-success text-xs font-bold text-center uppercase tracking-widest">
                {resendSuccess}
              </div>
            )}

            <Button
              type="button"
              className="w-full h-16 text-lg font-black rounded-2xl bg-text-primary text-bg-surface hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
              onClick={handleResend}
              disabled={isResending || !email}
            >
              {isResending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                t("resend_verification")
              )}
            </Button>

            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">
              {t("check_spam_folder")}
            </p>

            <div className="text-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 text-[10px] font-black text-brand-violet hover:text-text-primary transition-colors uppercase tracking-[0.2em] underline underline-offset-4"
              >
                <ArrowLeft className="w-3 h-3" /> {t("wrong_email_go_back")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
