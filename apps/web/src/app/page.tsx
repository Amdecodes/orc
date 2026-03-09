"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/components/LanguageContext";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page text-text-primary selection:bg-accent/30 overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-gradient-to-br from-bg-page via-bg-surface to-bg-page">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full animate-pulse-glow" />
         <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-accent/20 blur-[100px] rounded-full" />
      </div>

      <LandingContent />

      {/* Footer */}
      <footer className="py-24 border-t border-border bg-bg-surface/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
            <div className="text-xl font-black tracking-tighter text-text-primary font-['Space_Grotesk'] uppercase">ID Formatter</div>
          </div>
          <div className="flex space-x-12 text-[10px] font-black uppercase tracking-[0.4em] text-text-muted">
            <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
            <Link href="https://t.me/AdminUsername" className="text-accent hover:text-text-primary transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LandingContent() {
  const { data: session, isPending } = authClient.useSession();
  const { t } = useLanguage();

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-16 sm:py-24 lg:py-40">
      <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        
        <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[6.5rem] font-black tracking-tighter leading-[1.05] text-text-primary font-['Space_Grotesk']">
              {t('hero_title_1')} <br />
              <span className="text-accent opacity-90">{t('hero_title_2')}</span> <br />
              {t('hero_title_3')}
            </h1>
            <p className="text-text-secondary text-base sm:text-lg font-medium max-w-xl leading-relaxed">
              {t('hero_desc')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-2">
            {!isPending && (
              session ? (
                <Link href="/dashboard" className="w-full sm:w-auto bg-accent text-accent-text px-10 sm:px-12 py-4 sm:py-5 rounded-2xl text-lg font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl scale-100 hover:scale-[1.03] active:scale-95">
                  {t('dashboard')}
                </Link>
              ) : (
                <Link href="/register" className="w-full sm:w-auto bg-accent text-accent-text px-10 sm:px-12 py-4 sm:py-5 rounded-2xl text-lg font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl scale-100 hover:scale-[1.03] active:scale-95">
                  {t('start_now')}
                </Link>
              )
            )}
            
            <Link href="https://t.me/EthioIDBot" className="w-full sm:w-auto bg-bg-surface border border-border text-text-primary px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-lg font-black hover:bg-bg-muted transition-all flex items-center justify-center gap-3 backdrop-blur-xl">
               <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.24.36-.49.99-.74 3.86-1.68 6.44-2.78 7.73-3.31 3.67-1.53 4.44-1.8 4.94-1.81.11 0 .36.03.52.16.13.11.17.26.19.37.02.12.02.25.01.38z"/></svg>
              {t('telegram_bot')}
            </Link>
          </div>

          <div className="flex items-center gap-6 sm:gap-8 pt-4">
             <div className="flex -space-x-3">
                {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-bg-page bg-bg-surface" />)}
             </div>
             <div className="text-[9px] sm:text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
               {t('fastest_way')}
             </div>
          </div>
        </div>

        <div className="relative group animate-in fade-in zoom-in-95 duration-1000 delay-200">
           <div className="absolute -inset-10 bg-accent/15 blur-[100px] rounded-full group-hover:bg-accent/25 transition-all duration-700" />
           
           {/* Liquid Glass Showcase Card */}
           <div className="relative bg-bg-surface/80 dark:bg-bg-surface/40 backdrop-blur-3xl border border-border/30 rounded-[2.5rem] sm:rounded-[3rem] p-3 sm:p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden">
               <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 px-6 sm:px-10 py-4 sm:py-6 border-b border-border/20">
                  <div className="w-2.5 h-2.5 sm:w-3 h-3 rounded-full bg-error" />
                  <div className="w-2.5 h-2.5 sm:w-3 h-3 rounded-full bg-warning" />
                  <div className="w-2.5 h-2.5 sm:w-3 h-3 rounded-full bg-success opacity-80" />
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-4 pb-8 sm:pb-10 px-4 sm:px-6 relative">
                 {/* Input Step */}
                 <div className="relative group/input flex flex-col order-1">
                    <div className="flex items-center justify-between mb-3 px-1">
                       <div>
                          <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-[0.3em] text-text-primary">Source Screenshot</h4>
                          <p className="text-[9px] text-text-secondary uppercase tracking-widest mt-0.5">Raw Digital ID Capture</p>
                       </div>
                       <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                    </div>
                    <div className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] bg-bg-muted/20 rounded-2xl border border-border/50 flex items-center justify-center relative overflow-hidden shadow-sm group-hover/input:border-border transition-colors">
                       <Image src="/images/efayda-result.jpg" alt="Digital ID Screenshot" fill className="object-contain opacity-80 group-hover/input:opacity-100 transition-all duration-700 ease-in-out group-hover/input:scale-[1.02]" />
                       <div className="absolute inset-0 bg-gradient-to-t from-bg-surface/90 via-transparent to-transparent opacity-80 pointer-events-none" />
                       
                       {/* Scanner line effect (using simple CSS approach to prevent arbitrary config dependency) */}
                       <div className="absolute top-[-100%] left-0 w-full h-[6px] bg-accent/60 shadow-[0_0_20px_rgba(var(--accent),1)] group-hover/input:top-[120%] transition-all duration-[3000ms] ease-in-out" />
                       
                       <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <div className="px-2 py-1 rounded bg-bg-surface/80 backdrop-blur-md border border-border/30 text-[8px] font-bold text-text-muted tracking-widest">INPUT</div>
                       </div>
                    </div>
                 </div>

                 {/* Center Processing Arrow (Desktop) */}
                 <div className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-bg-surface shadow-[0_10px_30px_-5px_rgba(var(--accent),0.3)] border border-border/60 flex items-center justify-center relative group-hover:scale-110 transition-transform">
                        <div className="absolute inset-0 rounded-full border border-accent/40 animate-ping opacity-60" />
                        <svg className="w-5 h-5 text-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                 </div>

                 {/* Processing Indicator (Mobile) */}
                 <div className="flex md:hidden justify-center -my-2 relative z-20 order-2">
                    <div className="w-10 h-10 rounded-full bg-bg-surface shadow-[0_10px_30px_-5px_rgba(var(--accent),0.3)] border border-border/60 flex items-center justify-center relative">
                       <div className="absolute inset-0 rounded-full border border-accent/40 animate-ping opacity-60" />
                       <svg className="w-4 h-4 text-accent animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                    </div>
                 </div>

                 {/* Output Step */}
                 <div className="relative group/out flex flex-col order-3">
                    <div className="flex items-center justify-between mb-3 px-1">
                       <div>
                          <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-[0.3em] text-accent">Final Product</h4>
                          <p className="text-[9px] text-text-primary uppercase tracking-widest mt-0.5">Ready For Printing</p>
                       </div>
                       <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(var(--success),0.6)]" />
                    </div>
                    <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] bg-accent/5 rounded-2xl border border-accent/30 flex items-center justify-center shadow-inner overflow-hidden group-hover/out:border-accent/50 transition-colors">
                       <Image src="/images/id-hand.png" alt="Printed ID Card" fill className="object-contain group-hover/out:scale-[1.02] transition-transform duration-700 ease-out" />
                       <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg-surface/90 via-transparent to-transparent opacity-80 pointer-events-none" />
                       
                       <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-50 shadow-[0_0_15px_rgba(var(--accent),0.8)]" />
                       
                       <div className="absolute bottom-3 right-3">
                          <div className="px-2.5 py-1 rounded bg-accent/20 backdrop-blur-md border border-accent/40 text-[8px] font-black tracking-widest text-accent flex items-center gap-1.5 shadow-[0_0_15px_rgba(var(--accent),0.15)]">
                             <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                             PRINT READY
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Process Section - Bento Layout */}
      <div id="how-it-works" className="mt-32 sm:mt-48 max-w-7xl w-full space-y-16 sm:space-y-24">
          <div className="text-center space-y-4">
             <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-text-primary font-['Space_Grotesk']">{t('system_architecture')}</h2>
             <div className="space-y-2">
               <p className="text-text-secondary font-medium max-w-md mx-auto opacity-60 uppercase text-[9px] sm:text-[10px] tracking-[0.4em]">{t('proprietary_workflow')}</p>
               <p className="text-accent/70 font-bold max-w-lg mx-auto text-[8px] sm:text-[9px] uppercase tracking-[0.2em] leading-relaxed">
                 {t('disclaimer')}
               </p>
             </div>
          </div>
         
         <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1: Capture */}
            <div className="group relative bg-bg-surface shadow-sm hover:shadow-xl border border-border/80 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 transition-all hover:-translate-y-1 hover:border-accent/40 overflow-hidden flex flex-col min-h-[400px]">
               <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-accent/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="mb-8 relative h-40 w-full rounded-2xl bg-bg-page border border-border/60 flex items-center justify-center overflow-hidden">
                  {/* Capture Animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-32 h-24 sm:w-40 sm:h-28 border-2 border-dashed border-accent/40 rounded-lg relative group-hover:scale-105 transition-transform duration-500 overflow-hidden bg-bg-muted/10">
                        <Image src="/images/efayda-result.jpg" alt="Capture Process" fill className="object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-0 w-full h-[3px] bg-accent/80 shadow-[0_0_15px_rgba(var(--accent),1)] animate-[scan_2s_ease-in-out_infinite]" />
                        <div className="absolute inset-2 rounded flex items-center justify-center pointer-events-none">
                           <svg className="w-8 h-8 text-accent/80 drop-shadow-md group-hover:opacity-0 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="flex-1 space-y-4 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-accent group-hover:text-accent-text transition-colors duration-500">1</div>
                     <h3 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary uppercase">{t('capture')}</h3>
                  </div>
                  <p className="text-text-secondary text-sm font-medium leading-relaxed">{t('capture_desc')}</p>
               </div>
            </div>

            {/* Step 2: Normalize */}
            <div className="group relative bg-bg-surface shadow-sm hover:shadow-xl border border-border/80 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 transition-all hover:-translate-y-1 hover:border-accent/40 overflow-hidden flex flex-col min-h-[400px]">
               <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-accent/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="mb-8 relative h-40 w-full rounded-2xl bg-bg-page border border-border/60 flex items-center justify-center overflow-hidden">
                  {/* Normalize Animation */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 sm:gap-4 perspecitive-1000">
                     <div className="w-20 h-16 sm:w-24 sm:h-20 bg-bg-surface border border-border rounded shadow-lg transform rotate-[-15deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-700 overflow-hidden relative">
                        <Image src="/images/efayda-result.jpg" alt="Skewed Input" fill className="object-contain p-1 opacity-80 bg-bg-muted/10" />
                        <div className="w-full h-full absolute inset-0 bg-accent/20 group-hover:opacity-0 transition-opacity duration-700 pointer-events-none" />
                        <div className="w-full h-[2px] bg-accent/80 absolute top-1/2 -translate-y-1/2 skew-y-6 group-hover:skew-y-0 transition-transform duration-700 shadow-[0_0_8px_rgba(var(--accent),0.8)] pointer-events-none" />
                     </div>
                     <svg className="w-6 h-6 text-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                     <div className="w-20 h-16 sm:w-24 sm:h-20 bg-bg-surface border border-accent/40 rounded shadow-[0_0_15px_rgba(var(--accent),0.2)] flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-700 relative">
                         <Image src="/images/id-hand.png" alt="Aligned Output" fill className="object-contain p-1 group-hover:scale-105 transition-transform bg-bg-muted/10" />
                         <div className="absolute inset-0 border-2 border-accent/50 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                  </div>
               </div>
               <div className="flex-1 space-y-4 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-accent group-hover:text-accent-text transition-colors duration-500">2</div>
                     <h3 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary uppercase">{t('normalize')}</h3>
                  </div>
                  <p className="text-text-secondary text-sm font-medium leading-relaxed">{t('normalize_desc')}</p>
               </div>
            </div>

            {/* Step 3: Deliver */}
            <div className="group relative bg-bg-surface shadow-sm hover:shadow-xl border border-border/80 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 transition-all hover:-translate-y-1 hover:border-accent/40 overflow-hidden flex flex-col min-h-[400px]">
               <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-accent/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="mb-8 relative h-40 w-full rounded-2xl bg-bg-page border border-border/60 flex items-center justify-center overflow-hidden">
                  {/* Deliver Animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="relative group-hover:-translate-y-2 transition-transform duration-500 flex flex-col items-center">
                        <div className="w-32 h-16 bg-bg-surface border-2 border-border rounded-t-xl border-b-0 relative z-10 flex items-center justify-center">
                            <div className="w-16 h-2 bg-accent/40 rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--accent),0.5)]" />
                        </div>
                        <div className="w-36 h-6 bg-border rounded-b shadow-2xl relative z-20 flex justify-center">
                           <div className="w-24 h-1 bg-bg-surface rounded-full mt-1.5" />
                        </div>
                        {/* Paper Output */}
                        <div className="absolute top-[85px] w-28 h-20 bg-bg-surface border border-accent/40 rounded shadow-lg group-hover:translate-y-12 transition-transform duration-[1000ms] flex items-center justify-center overflow-hidden p-1 z-0">
                           <Image src="/images/id-hand.png" alt="Delivered Print" fill className="object-contain p-1" />
                        </div>
                     </div>
                  </div>
               </div>
               <div className="flex-1 space-y-4 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-accent group-hover:text-accent-text transition-colors duration-500">3</div>
                     <h3 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary uppercase">{t('deliver')}</h3>
                  </div>
                  <p className="text-text-secondary text-sm font-medium leading-relaxed">{t('deliver_desc')}</p>
               </div>
            </div>
         </div>
      </div>
    </main>
  );
}
