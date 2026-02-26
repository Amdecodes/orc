import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-brand-violet/30 overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-violet/10 blur-[120px] rounded-full animate-pulse-glow" />
         <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-brand-blue/10 blur-[100px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-10 max-w-7xl mx-auto w-full z-50">
        <div className="text-2xl font-black tracking-tighter text-text-primary flex items-center gap-3 font-['Space_Grotesk']">
          <div className="w-10 h-10 bg-text-primary rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-bg-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
          </div>
          ID <span className="text-text-secondary">FORMATTER</span>
        </div>
        <div className="hidden md:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">
          <Link href="#features" className="hover:text-text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-text-primary transition-colors">Process</Link>
          <Link href="/login" className="hover:text-text-primary transition-colors">Enterprise</Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary hover:text-text-primary transition-colors hidden sm:block">Login</Link>
          <Link href="/register" className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-accent-hover rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500" />
            <div className="relative bg-text-primary text-bg-surface px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transform hover:scale-[1.05] transition-all">
               Get Started
            </div>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center px-6 py-24 lg:py-40">
        <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-24 items-center">
          
          <div className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                2026 PRECISION ENGINE v2.0
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] text-text-primary font-['Space_Grotesk']">
                Precision <br />
                Identity <br />
                <span className="text-accent opacity-90">Processing.</span>
              </h1>
              <p className="text-text-secondary text-xl font-medium max-w-xl leading-relaxed">
                Transform mobile screenshots into high-fidelity, print-ready Ethiopian ID files with automated alignment.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
              <Link href="/dashboard" className="w-full sm:w-auto bg-text-primary text-bg-surface px-12 py-5 rounded-2xl text-lg font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl scale-100 hover:scale-[1.03] active:scale-95">
                START PROCESSING
              </Link>
              <Link href="https://t.me/EthioIDBot" className="w-full sm:w-auto bg-bg-surface border border-border text-text-primary px-10 py-5 rounded-2xl text-lg font-black hover:bg-bg-muted transition-all flex items-center justify-center gap-3 backdrop-blur-xl">
                 <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.24.36-.49.99-.74 3.86-1.68 6.44-2.78 7.73-3.31 3.67-1.53 4.44-1.8 4.94-1.81.11 0 .36.03.52.16.13.11.17.26.19.37.02.12.02.25.01.38z"/></svg>
                TELEGRAM BOT
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-4">
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-surface" />)}
               </div>
               <div className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
                 Trusted by <span className="text-text-primary">500+ professionals</span> in Ethiopia
               </div>
            </div>
          </div>

          <div className="relative group animate-in fade-in zoom-in-95 duration-1000 delay-200">
             <div className="absolute -inset-10 bg-brand-violet/20 blur-[100px] rounded-full group-hover:bg-brand-violet/30 transition-all duration-700" />
             
             {/* Liquid Glass Showcase Card */}
             <div className="relative bg-surface/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-4 shadow-3xl overflow-hidden">
                <div className="border-beam inset-0 opacity-40" />
                
                <div className="flex items-center justify-between mb-6 px-10 py-6 border-b border-white/5">
                   <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-error" />
                      <div className="w-3 h-3 rounded-full bg-warning" />
                      <div className="w-3 h-3 rounded-full bg-success opacity-80" />
                   </div>
                   <div className="text-[9px] uppercase tracking-[0.4em] text-text-secondary font-black opacity-40">Identity Processing Engine</div>
                </div>

                <div className="space-y-6 pt-2 pb-8 px-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="aspect-[1.58/1] bg-bg-muted/30 rounded-3xl border border-border flex items-center justify-center relative overflow-hidden group/item shadow-sm">
                         <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Front ID</span>
                      </div>
                      <div className="aspect-[1.58/1] bg-bg-muted/30 rounded-3xl border border-border flex items-center justify-center relative overflow-hidden group/item shadow-sm">
                         <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Back ID</span>
                      </div>
                   </div>

                   <div className="relative aspect-[16/6] bg-brand-violet/5 rounded-3xl border border-brand-violet/20 flex flex-col items-center justify-center gap-2 shadow-inner group/out">
                      <div className="flex items-center gap-4 text-brand-violet">
                        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                        <span className="text-xs font-black uppercase tracking-[0.5em] group-hover/out:tracking-[0.6em] transition-all">Synchronized Output</span>
                      </div>
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-violet to-transparent opacity-40 shadow-glow-violet" />
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Process Section - Bento Layout */}
        <div id="how-it-works" className="mt-48 max-w-7xl w-full space-y-24">
           <div className="text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white font-['Space_Grotesk']">System Architecture</h2>
              <p className="text-text-secondary font-medium max-w-md mx-auto opacity-60 uppercase text-[10px] tracking-[0.4em]">Proprietary formatting workflow</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
              <div className="group relative bg-surface/30 border border-white/5 rounded-[2.5rem] p-12 space-y-8 transition-all hover:bg-surface/50 hover:border-white/10 overflow-hidden">
                 <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-brand-violet/5 rounded-full blur-3xl" />
                 <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center font-['Space_Grotesk'] font-black text-white text-3xl group-hover:scale-110 transition-transform">1</div>
                 <div className="space-y-4">
                    <h3 className="text-2xl font-black tracking-tight text-white">Capture</h3>
                    <p className="text-text-secondary font-medium leading-relaxed">Upload raw screenshots. Our engine handles skew, blur, and lighting variance automatically.</p>
                 </div>
              </div>

              <div className="group relative bg-surface/30 border border-white/5 rounded-[2.5rem] p-12 space-y-8 transition-all hover:bg-surface/50 hover:border-white/10 overflow-hidden">
                 <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-brand-blue/5 rounded-full blur-3xl" />
                 <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center font-['Space_Grotesk'] font-black text-white text-3xl group-hover:scale-110 transition-transform">2</div>
                 <div className="space-y-4">
                    <h3 className="text-2xl font-black tracking-tight text-white">Normalize</h3>
                    <p className="text-text-secondary font-medium leading-relaxed">Identity features are extracted and mapped to standardized print dimensions using computer vision.</p>
                 </div>
              </div>

              <div className="group relative bg-surface/30 border border-white/5 rounded-[2.5rem] p-12 space-y-8 transition-all hover:bg-surface/50 hover:border-white/10 overflow-hidden">
                 <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                 <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center font-['Space_Grotesk'] font-black text-white text-3xl group-hover:scale-110 transition-transform">3</div>
                 <div className="space-y-4">
                    <h3 className="text-2xl font-black tracking-tight text-white">Deliver</h3>
                    <p className="text-text-secondary font-medium leading-relaxed">Download a high-precision PNG/JPG file, optimized for commercial-grade photo printers.</p>
                 </div>
              </div>
           </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-24 border-t border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
            <div className="text-xl font-black tracking-tighter text-white font-['Space_Grotesk'] uppercase">ID Formatter</div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">© 2026 PRECISION IDENTITY SYSTEMS GLOBAL</div>
          </div>
          <div className="flex space-x-12 text-[10px] font-black uppercase tracking-[0.4em] text-text-muted">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="https://t.me/AdminUsername" className="text-brand-violet hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
