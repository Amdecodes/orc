"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X, ChevronDown } from "lucide-react";
import { CreditWall } from "@/components/ui/credit-wall";
import { useLanguage } from "@/components/LanguageContext";
function UploadCard({ id, label, step, desc, isDone, onFileChange, onClear, preview, t }: { 
  id: string, 
  label: string, 
  step: string, 
  desc: string,
  isDone?: boolean,
  onFileChange: (file: File | null) => void,
  onClear: () => void,
  preview: string | null,
  t: (key: string) => string
}) {
  return (
    <div className={`p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all duration-300 ${isDone ? 'bg-bg-muted/50 border-border opacity-60' : 'bg-bg-surface border-border shadow-md'}`}>
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-[10px] sm:text-xs ${isDone ? 'bg-success text-white' : 'bg-accent/10 text-accent'}`}>
          {isDone ? '✓' : step}
        </div>
        <span className="text-[9px] sm:text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">{label}</span>
      </div>

      <div className={`relative aspect-[3/4] sm:aspect-[9/16] rounded-xl sm:rounded-2xl bg-bg-muted border-2 border-dashed flex flex-col items-center justify-center p-2 sm:p-4 transition-all duration-300 group overflow-hidden ${preview ? 'border-transparent' : 'border-text-muted/40 hover:border-accent/50 hover:bg-bg-muted/80'}`}>
        {preview ? (
          <div className="relative w-full h-full">
            <img src={preview} className="w-full h-full object-cover" alt={label} />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-center p-2">
                 <span className="text-[7px] sm:text-[8px] font-black text-white uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">Change</span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 bg-black/60 hover:bg-destructive/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors z-20"
              aria-label={`Clear ${label}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-bg-surface border border-border flex items-center justify-center text-text-muted mb-2 group-hover:scale-110 group-hover:text-accent group-hover:border-accent/30 transition-all duration-300 shadow-sm">
               <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            </div>
            <span className="text-[8px] sm:text-[10px] font-black text-text-secondary uppercase tracking-widest group-hover:text-accent transition-colors">Select</span>
          </>

        )}
        <input 
          type="file" 
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
          onChange={(e) => onFileChange(e.target.files?.[0] || null)} 
        />
      </div>

      <div className="mt-4 px-1">
        <p className="text-[8px] sm:text-[9px] font-bold text-text-muted uppercase leading-relaxed tracking-wider">
          {desc}
        </p>
      </div>
    </div>
  );
}

import { useJobStatus } from "@/hooks/useJobStatus";
import { authClient } from "@/lib/auth-client";
import { NotificationBell } from "@/components/NotificationBell";

export default function ActionPage() {
  const { data: session } = authClient.useSession();
  const { t } = useLanguage();
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [profile, setProfile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreditWall, setShowCreditWall] = useState(false);
  const [liveCredits, setLiveCredits] = useState<number | null>(null);
  
  const { status, output, error: jobError } = useJobStatus(jobId);

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setLiveCredits(data.credits);
      }
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchCredits();
      const interval = setInterval(fetchCredits, 15000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  const displayCredits = liveCredits !== null ? liveCredits : (session?.user?.credits ?? 0);

  const [previews, setPreviews] = useState<{
    front: string | null;
    back: string | null;
    profile: string | null;
  }>({ front: null, back: null, profile: null });

  const handleFileChange = (step: 'front' | 'back' | 'profile', file: File | null) => {
    if (!file) return;
    if (step === 'front') setFront(file);
    if (step === 'back') setBack(file);
    if (step === 'profile') setProfile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({ ...prev, [step]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearAll = () => {
    setFront(null);
    setBack(null);
    setProfile(null);
    setPreviews({ front: null, back: null, profile: null });
    setJobId(null);
  };

  const handleGenerate = async () => {
    if (!front || !back || !profile) return;
    
    // Reset previous job state
    setJobId(null);
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("front", front);
      formData.append("back", back);
      formData.append("third", profile);

      const response = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setJobId(data.jobId);
      } else {
        if (response.status === 402) {
          setShowCreditWall(true);
        } else {
          alert("Error: " + (data.error || "Generation failed"));
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || status === "PROCESSING" || status === "PENDING";
  const result = output;
  const error = jobError;

  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [result]);

  return (
    <div className="max-w-screen-2xl mx-auto py-10 sm:py-16 px-6 sm:px-12 xl:px-20 space-y-16 sm:space-y-24 pb-32">
      {/* Top Navigation / Header */}
      <div className="flex items-center justify-between gap-6 border-b border-border/50 pb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-text-primary font-['Space_Grotesk'] uppercase tracking-tighter">
            {t('dashboard') || 'Dashboard'}
          </h1>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mt-1">
            {session?.user?.name || t('welcome_back')}
          </p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Credit Display (Clickable to open wall) */}
          <button 
            onClick={() => setShowCreditWall(true)}
            className="flex items-center gap-3 px-4 sm:px-6 h-12 bg-bg-surface border-2 border-border hover:border-accent rounded-xl sm:rounded-2xl transition-all group shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-text transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="text-left">
              <p className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">{t('credits')}</p>
              <p className="text-sm font-black text-text-primary tabular-nums leading-none">
                {displayCredits}
              </p>
            </div>
          </button>

          {/* User Notifications */}
          <NotificationBell />
        </div>
      </div>

      <CreditWall isOpen={showCreditWall} onClose={() => setShowCreditWall(false)} />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center space-y-2">
        <p className="text-sm sm:text-base text-text-secondary font-bold max-w-lg mx-auto uppercase tracking-wide leading-relaxed">
          {t('upload_3_screenshots')}
        </p>
      </div>

      {/* Mobile-Only Example Guide Banner */}
      <div className="lg:hidden p-4 bg-bg-surface border border-border rounded-[1.5rem] space-y-3">
        <div className="text-center">
          <h4 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">{t('example_guide')}</h4>
          <p className="text-[9px] font-black text-accent uppercase tracking-widest mt-0.5">{t('follow_these_steps')}</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {[
            { step: "1", label: t('front_id'), desc: t('front_desc'), img: "/guide_front.jpg" },
            { step: "2", label: t('back_id'), desc: t('back_desc'), img: "/guide_back.jpg" },
            { step: "3", label: t('profile_photo'), desc: t('profile_desc'), img: "/guide_profile.jpg" }
          ].map((item, i) => (
            <div key={i} className="flex-shrink-0 w-28 flex flex-col items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent text-accent-text flex items-center justify-center font-black text-xs shadow-md">
                {item.step}
              </div>
              <p className="text-[8px] font-black text-text-primary uppercase tracking-wider text-center">{item.label}</p>
              <div className="w-full bg-bg-muted border border-border rounded-xl overflow-hidden p-1">
                <img src={item.img} alt={`Step ${item.step}`} className="w-full h-auto object-contain rounded-lg" />
              </div>
              <p className="text-[7px] font-black text-text-muted uppercase tracking-wider text-center">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 sm:gap-10 items-start">
        {/* Upload Zone & Result View */}
        <div className="lg:col-span-7 p-4 sm:p-10 bg-bg-surface border-2 border-border rounded-[2rem] sm:rounded-[3rem] shadow-2xl transition-all duration-500 min-h-[500px] flex flex-col justify-center">
          {result ? (
            <div className="flex flex-col items-center w-full animate-in zoom-in-95 duration-500 space-y-10 py-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-success/10 flex items-center justify-center border border-success/20 animate-bounce shadow-inner">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-text-primary font-['Space_Grotesk'] uppercase">{t('success_formatted')}</h2>
                <p className="text-sm text-text-secondary font-bold uppercase tracking-[0.2em]">{t('success_desc')}</p>
              </div>

              <div className="w-full relative group max-w-6xl mx-auto bg-bg-muted rounded-[1.5rem] p-3 border border-border shadow-xl">
                <img src={`${result}?inline=true`} className="w-full h-auto rounded-[1.2rem]" alt="Formatted ID Result" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-6xl mx-auto mt-8">
                <button 
                  onClick={() => window.location.href = result} 
                  className="w-full h-16 bg-accent text-accent-text font-black rounded-xl sm:rounded-2xl uppercase tracking-[0.15em] hover:bg-accent-hover transition-all active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-3 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  {t('download_png') || 'Download Image'}
                </button>
                <button 
                  onClick={() => { setFront(null); setBack(null); setProfile(null); setPreviews({front:null, back:null, profile:null}); setJobId(null); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
                  className="w-full h-16 bg-bg-surface text-text-primary font-black rounded-xl sm:rounded-2xl border-2 border-border uppercase tracking-[0.15em] hover:bg-bg-muted transition-all active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-3 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  {t('create_another') || 'Generate Another'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-12 w-full animate-in fade-in duration-500">
              <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <UploadCard 
              id="front" 
              label={t('front_id')} 
              step="1" 
              desc={t('front_desc')}
              isDone={!!front}
              onFileChange={(f) => handleFileChange('front', f)}
              onClear={() => {
                setFront(null);
                setPreviews(p => ({ ...p, front: null }));
              }}
              preview={previews.front}
              t={t}
            />
            <UploadCard 
              id="back" 
              label={t('back_id')} 
              step="2" 
              desc={t('back_desc')}
              isDone={!!back}
              onFileChange={(f) => handleFileChange('back', f)}
              onClear={() => {
                setBack(null);
                setPreviews(p => ({ ...p, back: null }));
              }}
              preview={previews.back}
              t={t}
            />
            <UploadCard 
              id="profile" 
              label={t('profile_photo')} 
              step="3" 
              desc={t('profile_desc')}
              isDone={!!profile}
              onFileChange={(f) => handleFileChange('profile', f)}
              onClear={() => {
                setProfile(null);
                setPreviews(p => ({ ...p, profile: null }));
              }}
              preview={previews.profile}
              t={t}
            />
          </div>

          <div className="space-y-6">
            <button 
              className="w-full h-16 sm:h-20 bg-accent hover:bg-accent-hover text-accent-text rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed disabled:hover:bg-accent"
              disabled={!front || !back || !profile || isLoading}
              onClick={handleGenerate}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span className="text-base">
                    {status === "PENDING" ? t('in_queue') : t('generating')}
                  </span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t('generate_btn')}
                </span>
              )}
            </button>
            
            {/* Global Reset Button */}
            <div className="flex items-center justify-between px-2">
              <p className="text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">
                {t('costs_1_credit')}
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/credits"
                  className="text-[9px] sm:text-[10px] font-black text-accent hover:text-accent-hover uppercase tracking-widest transition-colors"
                >
                  + {t('buy_credits') || 'Buy Credits'}
                </Link>
                {(previews.front || previews.back || previews.profile) && (
                  <button
                    onClick={handleClearAll}
                    className="text-[9px] sm:text-[10px] font-black text-destructive/80 hover:text-destructive uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> {t('reset_all')}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 py-4 sm:py-6 border-t border-border">
              <span className="text-accent text-lg">🛡️</span>
              <p className="text-[8px] sm:text-[10px] font-black text-text-primary uppercase tracking-[0.3em] sm:tracking-[0.4em] text-center">
                {t('secure_notice')}
              </p>
            </div>
          </div>
            </div>
          )}
        </div>

        {/* Example Guide — pushed to the right */}
        <div className="lg:col-span-5 hidden lg:block space-y-6">
          <div className="p-8 sm:p-10 bg-bg-surface border-2 border-border rounded-[2rem] shadow-sm space-y-8 h-fit">
            <div className="text-center pb-5 border-b border-border">
              <h4 className="text-base font-black text-text-primary uppercase tracking-[0.2em] font-['Space_Grotesk']">{t('example_guide')}</h4>
              <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-2">{t('follow_these_steps')}</p>
            </div>

            {/* 3 images side-by-side */}
            <div className="grid grid-cols-3 gap-5">
              {[
                { step: "1", label: t('front_id'), desc: t('front_desc'), img: "/guide_front.jpg" },
                { step: "2", label: t('back_id'), desc: t('back_desc'), img: "/guide_back.jpg" },
                { step: "3", label: t('profile_photo'), desc: t('profile_desc'), img: "/guide_profile.jpg" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  {/* Step badge */}
                  <div className="w-9 h-9 rounded-xl bg-accent text-accent-text flex items-center justify-center font-black text-sm shadow-lg shadow-accent/20">
                    {item.step}
                  </div>
                  <p className="text-[9px] font-black text-text-primary uppercase tracking-wider text-center leading-snug">{item.label}</p>
                  <div className="w-full bg-bg-muted border-2 border-border rounded-2xl overflow-hidden p-2 hover:border-accent/50 transition-colors shadow-md">
                    <img
                      src={item.img}
                      alt={`Step ${item.step} Example`}
                      className="w-full h-auto object-contain rounded-xl"
                    />
                  </div>
                  <p className="text-[8px] font-black text-text-muted uppercase tracking-widest text-center">{item.desc}</p>
                </div>
              ))}
            </div>

          </div>

          {/* Top-up Button — Prominent CTA */}
          <Link
            href="/dashboard/credits"
            className="group relative flex items-center justify-between p-6 bg-bg-surface border-2 border-border hover:border-transparent rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 active:scale-[0.98] overflow-hidden"
          >
            {/* Animated Gradient Border/Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/10 to-accent/0 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-700 pointer-events-none"></div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent/50 rounded-[2rem] transition-colors duration-500 pointer-events-none"></div>

            <div className="relative flex items-center gap-4 z-10">
              <div className="w-12 h-12 rounded-[1rem] bg-bg-muted flex items-center justify-center text-text-secondary group-hover:bg-accent group-hover:text-accent-text group-hover:-translate-y-1 transition-all duration-500 shadow-inner group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="text-left transition-transform duration-500 group-hover:translate-x-1">
                <h4 className="text-sm font-black text-text-primary uppercase tracking-[0.15em] font-['Space_Grotesk'] group-hover:text-accent transition-colors">{t('buy_credits') || 'Top-up Credits'}</h4>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1 group-hover:text-text-secondary transition-colors">Fuel your generations</p>
              </div>
            </div>
            
            <div className="relative w-10 h-10 rounded-full bg-bg-muted flex items-center justify-center text-text-secondary group-hover:bg-accent/10 group-hover:text-accent group-hover:scale-110 transition-all duration-500 z-10">
              <svg className="w-5 h-5 relative left-[1px] group-hover:translate-x-1 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></polyline></svg>
            </div>
          </Link>
        </div>
      </div>



      {/* Simplified Process Section - Localization using keys */}
      <section id="how-it-works" className="space-y-12 sm:space-y-16 pt-12 sm:pt-16 border-t border-border">
        <div className="text-center space-y-3 sm:space-y-4">
          <h3 className="text-2xl sm:text-3xl font-black text-text-primary font-['Space_Grotesk'] uppercase tracking-widest">{t('follow_these_steps')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            { step: "01", title: t('capture'), icon: "📸", desc: t('capture_desc') },
            { step: "02", title: t('normalize'), icon: "⚡", desc: t('normalize_desc') },
            { step: "03", title: t('deliver'), icon: "🖨️", desc: t('deliver_desc') }
          ].map((item, idx) => (
            <div key={idx} className="p-8 sm:p-10 bg-bg-surface border-2 border-border rounded-[2rem] sm:rounded-[2.5rem] text-center space-y-4 sm:space-y-6 hover:border-accent/40 hover:bg-bg-muted/30 transition-all shadow-sm group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center text-2xl sm:text-3xl mx-auto group-hover:scale-110 group-hover:bg-accent/10 group-hover:border-accent/30 transition-all duration-300">
                {item.icon}
              </div>
              <div className="space-y-2">
                <span className="text-[9px] sm:text-[10px] font-black text-accent uppercase tracking-widest">{item.step}</span>
                <h4 className="text-base sm:text-lg font-black text-text-primary uppercase font-['Space_Grotesk']">{item.title}</h4>
                <p className="text-[10px] sm:text-[11px] font-bold text-text-secondary uppercase leading-relaxed tracking-wider sm:tracking-widest">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

