"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  Copy, 
  Upload, 
  ShieldCheck, 
  Zap, 
  CreditCard,
  User,
  Briefcase,
  Rocket,
  ChevronRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export const dynamic = "force-dynamic";

const packages = [
  { 
    id: "p1", 
    name: "Starter", 
    credits: 1, 
    price: 29, 
    icon: User,
    tagline: "Great for one-off needs",
    features: ["Standard OCR Quality", "24h Email Support", "Basic Formatting"]
  },
  { 
    id: "p2", 
    name: "Regular", 
    credits: 10, 
    price: 249, 
    icon: Briefcase,
    savings: "14% OFF",
    tagline: "Perfect for core family",
    features: ["Standard OCR Quality", "Priority Email Support", "Basic Formatting"]
  },
  { 
    id: "p3", 
    name: "Business", 
    credits: 40, 
    price: 799, 
    popular: true, 
    icon: Rocket,
    savings: "31% OFF",
    tagline: "The Choice of Pros",
    features: ["High-Res Processing", "Priority Support", "Advanced Formatting", ]
  },
  { 
    id: "p4", 
    name: "Pro", 
    credits: 180, 
    price: 2999, 
    icon: Zap,
    savings: "42% OFF",
    tagline: "For Heavy Workflow",
    features: ["Ultra-Res Processing", "Express Support", "Premium Formatting", ]
  },
  { 
    id: "p5", 
    name: "Scale", 
    credits: 800, 
    price: 11999, 
    icon: ShieldCheck,
    savings: "48% OFF",
    tagline: "For Large Teams",
    features: ["Everything in Pro",  "Priority Support"]
  },
];

const TELEBIRR_ACCOUNT = "0910805188";
const ACCOUNT_NAME = "KELEMWORIK";

type Step = "select" | "payment" | "pending";

// Telebirr Logo Component
const TelebirrLogo = ({ className }: { className?: string }) => (
  <svg
    version="1.1"
    width="100%"
    height="100%"
    viewBox="0 0 682.66669 682.66669"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g transform="translate(-87.76998,13.021183)">
      <path
        style={{ fill: "currentColor" }}
        d="M 510.68053,657.13291 C 436.87683,646.38535 382.78357,592.1972 371.82639,518.03519 c -2.30869,-15.62604 -1.9857,-42.11486 0.69198,-56.74937 0.73797,-4.03333 4.67238,-26.23333 8.74314,-49.33334 4.07075,-23.1 11.29744,-64.07622 16.05931,-91.05827 4.76188,-26.98205 9.55917,-50.80104 10.66067,-52.93108 1.10148,-2.13004 4.20662,-5.55382 6.90032,-7.6084 l 4.89761,-3.73558 h 144.5465 144.54649 l 3.8906,4.35437 c 7.2608,8.1262 4.293,20.5582 -6.6716,27.94723 -4.4885,3.02485 -4.617,3.03174 -56.63491,3.03549 -56.63061,0.004 -68.12187,0.85757 -91.15402,6.77031 -54.66603,14.03369 -106.66723,56.88477 -132.29341,109.01508 -31.6047,64.2922 -23.69566,132.94801 20.30484,176.25975 42.18647,41.5261 108.48569,50.30819 165.14694,21.8756 51.71943,-25.9528 86.52896,-85.10679 78.00226,-132.55405 -6.7955,-37.81356 -38.98003,-63.91613 -78.9295,-64.01397 -39.09906,-0.0957 -78.00832,31.40607 -86.62424,70.13297 -7.09687,31.89905 10.07956,57.14443 41.20452,60.56108 7.87592,0.86456 9.9785,1.63281 12.50388,4.56875 3.5194,4.09154 3.80596,7.35734 1.10404,12.58228 -3.56356,6.89116 -7.86204,8.56609 -19.95388,7.77513 -24.84245,-1.625 -44.42901,-14.54824 -55.31077,-36.49412 -14.7084,-29.6633 -4.23566,-73.55671 25.04837,-104.98291 14.44428,-15.5009 40.51319,-31.09095 60.8148,-36.3692 12.63115,-3.284 40.3846,-3.23266 52.66352,0.0975 40.70046,11.03812 67.38946,40.88302 73.41566,82.09711 4.1719,28.5317 -5.9843,69.30943 -24.7686,99.44773 -27.92089,44.79717 -76.26368,78.13121 -127.36974,87.82587 -11.82831,2.24378 -39.09596,2.54552 -52.58064,0.58184 z M 307.73994,474.00094 c -2.33587,-1.01593 -5.26072,-3.80739 -6.49966,-6.20323 -1.97104,-3.81157 -2.06494,-5.69909 -0.75125,-15.10064 9.84201,-70.43512 -25.96585,-131.72496 -89.19973,-152.67702 -12.57341,-4.16609 -24.20638,-6.36968 -39.30231,-7.44485 -7.33333,-0.52229 -14.85455,-1.72489 -16.71382,-2.67243 -4.93778,-2.51644 -7.09795,-7.44912 -6.31279,-14.41506 0.86269,-7.65375 5.32944,-13.86168 12.22803,-16.99466 5.16486,-2.34558 10.70505,-2.48334 100.79858,-2.5063 92.16861,-0.0235 95.47478,0.062 99.59404,2.57361 8.77544,5.35073 9.02592,2.52348 -9.48465,107.05534 -9.1872,51.88142 -17.5632,95.98143 -18.61335,98 -2.61441,5.02541 -7.287,9.00741 -12.695,10.81876 -5.73979,1.92245 -7.7876,1.85443 -13.04809,-0.43352 z M 425.05706,217.02309 c -2.96236,-1.43125 -7.07007,-8.47499 -7.07007,-12.12348 0,-5.86768 33.75488,-191.228094 35.40423,-194.417581 3.14046,-6.0729547 10.85099,-10.52956472 18.21759,-10.52956472 5.12281,0 7.16993,0.74685 10.69048,3.90019802 4.31123,3.861555 4.34805,3.996963 3.71613,13.6666667 -0.35104,5.371559 -0.62342,19.36647 -0.60533,31.099804 0.0276,17.905639 0.51995,23.154297 3.06409,32.666665 6.83111,25.540992 16.8978,43.502772 34.09992,60.843742 18.71851,18.8696 37.96423,29.83718 64.14423,36.55395 10.59112,2.71727 16.2151,3.14887 49.93534,3.83223 41.72204,0.84552 42.19474,0.9394 46.09264,9.15356 2.5125,5.2948 1.6356,10.92718 -2.7622,17.74148 -6.2925,9.74998 1.4089,9.21878 -132.19862,9.11814 -81.59868,-0.0615 -120.73275,-0.54162 -122.72843,-1.50581 z"
      />
    </g>
  </svg>
);

export default function CreditsPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("select");
  const [selectedPackage, setSelectedPackage] = useState(packages[1]);
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAccount = () => {
    navigator.clipboard.writeText(TELEBIRR_ACCOUNT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVerificationReady = reference.trim().length >= 8 || proof !== null;

  const handleSubmit = async () => {
    if (!isVerificationReady) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("packageId", selectedPackage.id);
      formData.append("amount", selectedPackage.price.toString());
      formData.append("credits", selectedPackage.credits.toString());
      formData.append("referenceText", reference.trim());
      if (proof) formData.append("proof", proof);

      const response = await fetch("/api/payments", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setStep("pending");
      } else {
        alert("Error: " + (data.error || "Submission failed. Please try again."));
      }
    } catch {
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Stepper = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-3 mb-10">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
            s === currentStep 
              ? "bg-text-primary text-bg-page border-text-primary" 
              : s < currentStep 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-bg-muted text-text-muted border-border"
          }`}>
            {s < currentStep ? <Check className="w-4 h-4" /> : s}
          </div>
          {s < 3 && <div className={`w-12 h-px ${s < currentStep ? "bg-success/30" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );

  /* ─── STEP 1: Package Selection ─── */
  if (step === "select") {
    return (
      <div className="min-h-screen bg-bg-page px-6 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center space-y-6">
            <Stepper currentStep={1} />
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-text-primary uppercase font-['Space_Grotesk'] leading-none">
                {t('choose_plan')}
              </h1>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] opacity-40">
                {t('choose_plan_desc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => { setSelectedPackage(pkg); setStep("payment"); }}
                className={`group relative text-left flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 bg-bg-surface ${
                  pkg.popular 
                    ? "border-accent shadow-[0_30px_60px_-15px_rgba(var(--accent-rgb),0.15)] ring-1 ring-accent/20 scale-105 z-10" 
                    : "border-border hover:border-accent/40 hover:shadow-2xl"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-text text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-bl-3xl shadow-sm z-20">
                    {t('recommended')}
                  </div>
                )}

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">
                      {pkg.name}
                    </span>
                    {pkg.savings && (
                      <span className="text-[10px] font-black text-[#000] uppercase tracking-tighter bg-[#FFD700] px-3 py-1 rounded-full shadow-[0_4px_12px_rgba(255,215,0,0.3)] animate-pulse">
                        {pkg.savings}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[14px] font-black text-text-muted/60 uppercase tracking-widest leading-none">ETB</span>
                      <span className="text-5xl font-black text-text-primary tracking-tighter leading-none">{pkg.price}</span>
                    </div>
                    <p className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">{pkg.tagline}</p>
                  </div>
                </div>

                <div className="py-6 border-y border-border/50 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <pkg.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-text-primary leading-none">{pkg.credits}</div>
                      <div className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest mt-1">Conversions</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {pkg.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-[10px] font-bold text-text-primary/70">
                      <div className="w-1 h-1 rounded-full bg-accent" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className={`w-full h-12 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                  pkg.popular
                    ? "bg-accent text-accent-text hover:bg-accent-hover shadow-lg shadow-accent/20"
                    : "bg-text-primary text-bg-page hover:bg-text-primary/90"
                }`}>
                  {t('select_plan')}
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 pt-12 border-t border-border/50">
            <div className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
              <div className="w-2 h-2 rounded-full bg-success"></div> {t('verifying')}
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
              <div className="w-2 h-2 rounded-full bg-accent"></div> 24h Review Window
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
              <div className="w-2 h-2 rounded-full bg-accent"></div> Priority Support
            </div>
          </div>
        </div>
      </div>
    );
  }
  /* ─── STEP 2: Payment Details ─── */
  if (step === "payment") {
    return (
      <div className="min-h-screen bg-bg-page px-4 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
          
          <button 
            onClick={() => setStep("select")} 
            className="group flex items-center gap-2.5 text-[10px] font-black text-text-muted hover:text-text-primary uppercase tracking-widest transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> {t('change_plan')}
          </button>

          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary uppercase font-['Space_Grotesk']">
              {t('confirm_payment')}
            </h2>

            {/* Important Alert */}
            <div className="flex gap-4 px-6 py-5 rounded-xl border-l-4 border-accent bg-accent/5 text-text-primary items-start">
              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] text-accent-text font-black text-white italic">!</span>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest leading-none">{t('process_notice')}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide leading-relaxed opacity-70">
                  {t('fraud_notice')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 items-start">
            
            {/* Left: Payment Method & Details */}
            <div className="lg:col-span-7 space-y-8">
              <div className="p-8 sm:p-10 bg-bg-surface border border-border rounded-[2rem] shadow-sm space-y-10">
                <div className="space-y-6">
                  <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border pb-4">
                    {t('payment_method')}
                  </h3>
                  
                  <div className="flex items-center gap-4 p-5 rounded-xl border border-accent/20 bg-accent/5">
                    <div className="w-12 h-12 p-2 rounded-xl bg-[#0172bb] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <TelebirrLogo />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-primary">Telebirr Mobile Money</p>
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{t('standard_transfer_method')}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-accent bg-accent flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-10 pt-6">
                  <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border pb-4">
                    {t('account_details')}
                  </h3>
                  
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{t('wallet_number')}</p>
                      <div className="flex items-center gap-4">
                        <p className="text-3xl font-black text-text-primary font-mono tracking-tighter">{TELEBIRR_ACCOUNT}</p>
                        <button
                          onClick={copyAccount}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            copied 
                              ? "bg-success text-white" 
                              : "bg-bg-muted text-text-muted hover:text-text-primary border border-border"
                          }`}
                        >
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{t('account_holder')}</p>
                        <p className="text-sm font-bold text-text-primary uppercase tracking-wider">{ACCOUNT_NAME}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{t('amount_due')}</p>
                        <p className="text-xl font-black text-text-primary tracking-tight">{selectedPackage.price}.00 ETB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Plan Details & Reference */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-8 sm:p-10 bg-bg-surface border border-border rounded-[2rem] shadow-sm space-y-10">
                <div className="space-y-5">
                  <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border pb-4">
                    {t('order_summary')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('choose_plan')}</span>
                      <span className="text-xs font-black text-text-primary uppercase">{selectedPackage.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('credits')}</span>
                      <span className="text-xs font-black text-text-primary">{selectedPackage.credits}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-primary uppercase tracking-widest block">
                        {t('transaction_reference')}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CKM8CY12QY"
                        value={reference}
                        onChange={(e) => setReference(e.target.value.toUpperCase())}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-bg-muted text-text-primary font-mono font-bold placeholder:text-text-muted/30 focus:outline-none focus:border-accent/40 transition-all text-sm"
                      />
                    </div>

                    <div className="relative text-center py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
                      <span className="relative bg-bg-surface px-4 text-[8px] font-black text-text-muted uppercase tracking-[0.4em]">{t('or')}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-primary uppercase tracking-widest block">
                        {t('upload_receipt')}
                      </label>
                      <div className="relative h-12 rounded-xl border border-dashed border-border bg-bg-muted flex items-center justify-center hover:border-accent/30 transition-all cursor-pointer overflow-hidden px-4">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                          {proof ? `Selected: ${proof.name}` : t('attach_image_proof')}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          onChange={(e) => setProof(e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                  </div>

                    <button
                    onClick={handleSubmit}
                    disabled={!isVerificationReady || loading}
                    className={`w-full h-14 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                      isVerificationReady 
                        ? "bg-text-primary text-bg-page hover:bg-text-primary/90 shadow-lg active:scale-98" 
                        : "bg-bg-muted text-text-muted cursor-not-allowed opacity-50"
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      t('confirm_payment')
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── STEP 3: Pending Review ─── */
  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-12 animate-in fade-in duration-700">

        <Stepper currentStep={3} />

        <div className="space-y-6">
          <div className="relative mx-auto w-20 h-20 bg-success/5 rounded-full flex items-center justify-center border border-success/10">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black text-text-primary uppercase font-['Space_Grotesk'] tracking-tight">
              {t('submission_received')}
            </h2>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
              {t('activation_time')}
            </p>
          </div>
        </div>

        <div className="p-1 border border-border rounded-2xl bg-bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
            {[
              { label: "Submitted", status: "Done", icon: CheckCircle2 },
              { label: "Verifying", status: "Active", icon: Clock },
              { label: "Activation", status: "Waiting", icon: Zap },
            ].map((item, i) => (
              <div 
                key={i} 
                className={`p-6 rounded-xl flex flex-col items-center gap-3 transition-all duration-500 ${
                  item.status === "Done" ? "bg-bg-surface text-success" :
                  item.status === "Active" ? "bg-bg-surface text-accent shadow-sm" :
                  "bg-transparent text-text-muted opacity-40"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <p className="text-[10px] font-black uppercase tracking-widest">{t(item.label.toLowerCase())}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-bg-surface border border-border rounded-2xl flex items-center gap-5 text-left shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-bg-muted flex items-center justify-center text-text-muted shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-text-muted leading-relaxed uppercase tracking-widest">
              {t('once_verified_notice')}
            </p>
          </div>
          
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-full h-14 rounded-xl border border-border bg-bg-surface text-text-primary font-black text-[11px] uppercase tracking-widest transition-all hover:bg-bg-muted"
          >
            {t('return_dashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
