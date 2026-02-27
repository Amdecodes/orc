"use client";

import Link from "next/link";
import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [availableFactors, setAvailableFactors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!isLoaded) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!isMfaStep) {
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          router.push("/");
        } else if (result.status === "needs_second_factor") {
          const factors = (result as any).supportedSecondFactors || [];
          setAvailableFactors(factors);
          console.log("MFA Required. Factors:", factors);
          
          // If only email is available, we might need to prepare it
          const emailFactor = factors.find((f: any) => f.strategy === "email_code");
          if (emailFactor && factors.length === 1) {
            await signIn.prepareSecondFactor({ strategy: "email_code" });
          }

          setIsMfaStep(true);
          setIsLoading(false);
        } else {
          console.log("Incomplete Status:", result.status, result);
          setError(`Access Denied: ${result.status}. Please ensure your account has administrative clearance in the Clerk Dashboard.`);
          setIsLoading(false);
        }
      } else {
        // Handle MFA submission
        const factor = availableFactors.find(
          (f: any) => f.strategy === "totp" || f.strategy === "email_code"
        );

        if (!factor) {
          setError("No valid authentication strategy found for your account.");
          setIsLoading(false);
          return;
        }

        const result = await signIn.attemptSecondFactor({
          strategy: factor.strategy,
          code: mfaCode,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          router.push("/");
        } else {
          setError("Invalid or expired 6-digit code.");
          setIsLoading(false);
        }
      }
    } catch (err: unknown) {
      console.error("Clerk Auth Error:", err);
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || "Authentication failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6 relative overflow-hidden text-white font-['Space_Grotesk']">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative group">
        <div className="absolute -inset-1 bg-gradient-to-b from-white/5 to-transparent rounded-[3.5rem] blur-xl opacity-50" />

        <div className="relative space-y-10 p-12 bg-zinc-900/50 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden">
          <div className="text-center space-y-6">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-2xl font-black tracking-tighter text-white hover:scale-105 transition-transform uppercase"
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-black" strokeWidth={2.5} />
              </div>
              ADMIN <span className="opacity-50">GATEWAY</span>
            </Link>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                {isMfaStep ? "MFA Verify" : "System Access"}
              </h1>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                Administrative Terminal v2.2
              </p>
            </div>
          </div>

          <form className="space-y-8" onSubmit={handleLogin}>
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black text-center uppercase tracking-widest leading-relaxed">
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              {!isMfaStep ? (
                <>
                  <div className="space-y-2">
                    <label
                      className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1"
                      htmlFor="admin-email"
                    >
                      Admin Identifier
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      className="w-full h-16 bg-black/60 border border-white/5 rounded-2xl font-bold text-white placeholder:text-zinc-700 px-6 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all text-sm"
                      placeholder="admin@precision.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1"
                      htmlFor="admin-password"
                    >
                      Security Key
                    </label>
                    <input
                      id="admin-password"
                      type="password"
                      className="w-full h-16 bg-black/60 border border-white/5 rounded-2xl font-bold text-white placeholder:text-zinc-700 px-6 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all text-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                      <KeyRound className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider">
                        {availableFactors.some((f: any) => f.strategy === "totp")
                          ? "Authenticator Application"
                          : "Email Protocol Active"}
                      </h3>
                      <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-widest mt-1">
                        {availableFactors.some((f: any) => f.strategy === "totp")
                          ? "Enter the 6-digit code from your linked device"
                          : "Check your email for the administrative access code"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1"
                      htmlFor="mfa-code"
                    >
                      6-Digit Secure Code
                    </label>
                    <input
                      id="mfa-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className="w-full h-20 bg-black/60 border border-white/5 rounded-2xl font-black text-white text-center text-3xl tracking-[0.3em] placeholder:text-zinc-800 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all"
                      placeholder="000000"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 bg-black/40 border-white/10 rounded text-zinc-500 focus:ring-white/20"
                />
                <label
                  htmlFor="remember-me"
                  className="text-[10px] font-black text-zinc-500 uppercase tracking-widest"
                >
                  Confirm Session
                </label>
              </div>
              {!isMfaStep && (
                <a
                  href="#"
                  className="text-[10px] font-black text-zinc-400 hover:text-white transition-colors uppercase tracking-widest underline underline-offset-4"
                >
                  Emergency Reset
                </a>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full h-16 text-sm font-black rounded-2xl bg-white text-black hover:bg-zinc-200 shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.1em] disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  isMfaStep ? "Complete Verification" : "Initiate Gateway"
                )}
              </button>
              
              {isMfaStep && (
                <button
                  type="button"
                  onClick={() => setIsMfaStep(false)}
                  className="w-full mt-4 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors py-2"
                >
                  Back to Identifier
                </button>
              )}
            </div>
          </form>

          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] italic">
              Strict Isolation Protocol: Active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
