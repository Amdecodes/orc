"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { CreditWall } from "@/components/ui/credit-wall";

function UploadCard({ id, label, step, desc, isDone, onFileChange, preview }: { 
  id: string, 
  label: string, 
  step: string, 
  desc: string,
  isDone?: boolean,
  onFileChange: (file: File | null) => void,
  preview: string | null
}) {
  return (
    <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${isDone ? 'bg-bg-muted/50 border-border opacity-60' : 'bg-bg-surface border-border shadow-md'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isDone ? 'bg-success text-white' : 'bg-accent/10 text-accent'}`}>
          {isDone ? '✓' : step}
        </div>
        <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">{label}</span>
      </div>

      <div className="relative aspect-[1.58/1] rounded-2xl bg-bg-muted border-[1.5px] border-dashed border-text-muted/60 flex flex-col items-center justify-center p-4 transition-all hover:bg-bg-muted/80 group overflow-hidden">
        {preview ? (
          <div className="relative w-full h-full">
            <img src={preview} className="w-full h-full object-cover" alt={label} />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
               <span className="text-[8px] font-black text-white uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">Replace Image</span>
            </div>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-bg-surface border border-border flex items-center justify-center text-text-muted mb-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            </div>
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Choose file</span>
          </>
        )}
        <input 
          type="file" 
          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
          onChange={(e) => onFileChange(e.target.files?.[0] || null)} 
        />
      </div>

      <div className="mt-4 px-2">
        <p className="text-[10px] font-bold text-text-muted uppercase leading-relaxed tracking-wider">
          {desc}
        </p>
      </div>
    </div>
  );
}

export default function ActionPage() {
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [profile, setProfile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showCreditWall, setShowCreditWall] = useState(false);
  const [credits, setCredits] = useState(7);

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

  const handleGenerate = async () => {
    if (!front || !back || !profile) return;
    if (credits < 1) {
      setShowCreditWall(true);
      return;
    }

    setLoading(true);
    setResult(null);
    
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
        setResult(data.imageUrl);
        setCredits(prev => prev - 1);
      } else {
        alert("Error: " + (data.error || "Generation failed"));
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-6 space-y-24 pb-32">
      <CreditWall isOpen={showCreditWall} onClose={() => setShowCreditWall(false)} />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight text-text-primary font-['Space_Grotesk'] leading-[1.05]">
          Convert Ethiopian ID <br />
          Screenshots into <span className="text-accent">Print-Ready ID</span>
        </h1>
        <p className="text-lg md:text-xl text-text-secondary font-bold max-w-2xl mx-auto uppercase tracking-wide">
          Upload 3 screenshots from your Digital ID. <br />
          We prepare a clean file ready for printing.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Upload Zone */}
        <div className="lg:col-span-8 p-10 bg-bg-surface border-2 border-border rounded-[3rem] shadow-2xl space-y-12">
          <div className="grid sm:grid-cols-3 gap-6">
            <UploadCard 
              id="front" 
              label="Front Side" 
              step="1" 
              desc="Upload screenshot of the front side of your ID. (DO NOT CROP)"
              isDone={!!front}
              onFileChange={(f) => handleFileChange('front', f)}
              preview={previews.front}
            />
            <UploadCard 
              id="back" 
              label="Back Side" 
              step="2" 
              desc="Upload screenshot of the back side (QR Code). (QR VISIBLE)"
              isDone={!!back}
              onFileChange={(f) => handleFileChange('back', f)}
              preview={previews.back}
            />
            <UploadCard 
              id="profile" 
              label="Your Photo" 
              step="3" 
              desc="Upload a screenshot of the profile screen. (SHOW PHOTO CLEARLY)"
              isDone={!!profile}
              onFileChange={(f) => handleFileChange('profile', f)}
              preview={previews.profile}
            />
          </div>

          <div className="space-y-6">
            <button 
              className="w-full h-20 bg-accent hover:bg-accent-hover text-accent-text rounded-2xl font-black text-xl uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              disabled={!front || !back || !profile || loading}
              onClick={handleGenerate}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </div>
              ) : "Generate Print-Ready ID"}
            </button>
            
            <div className="text-center">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">
                Costs 1 credit — your balance will be updated automatically
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 py-6 border-t border-border">
              <span className="text-accent text-xl">🛡️</span>
              <p className="text-[10px] font-black text-text-primary uppercase tracking-[0.4em]">
                Secure processing — images are deleted automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Example Guide Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-bg-surface border-2 border-border rounded-[2rem] shadow-sm space-y-8">
            <div className="space-y-2 text-center pb-4 border-b border-border">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] font-['Space_Grotesk']">Example Guide</h4>
              <p className="text-[10px] font-black text-accent uppercase tracking-widest">Follow these for best results</p>
            </div>

            <div className="space-y-8">
              {[
                { label: "FRONT SCREEN", desc: "1. Front Side (Full Image)" },
                { label: "BACK (QR)", desc: "2. Back Side (QR Visible)" },
                { label: "PROFILE", desc: "3. Profile Screen" }
              ].map((item, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[1.58/1] rounded-xl bg-bg-muted border-[1.5px] border-dashed border-text-muted/60 relative overflow-hidden flex items-center justify-center">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">{item.label}</span>
                  </div>
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest text-center">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section id="how-it-works" className="space-y-16 pt-16 border-t border-border">
        <div className="text-center space-y-4">
          <h3 className="text-3xl font-black text-text-primary font-['Space_Grotesk'] uppercase tracking-widest">How it works</h3>
          <p className="text-xs font-black text-accent uppercase tracking-[0.4em]">Easy 3-Step Process</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Upload Screenshots", icon: "📸", desc: "Open your National ID app and take 3 screenshots as shown in our guide." },
            { step: "02", title: "Smart Formatting", icon: "⚡", desc: "Our system automatically prepares a high-fidelity print file for you." },
            { step: "03", title: "Download & Print", icon: "🖨️", desc: "Get a high-quality PDF ready for any ID card printer instantly." }
          ].map((item, idx) => (
            <div key={idx} className="p-10 bg-bg-surface border-2 border-border rounded-[2.5rem] text-center space-y-6 hover:border-accent/40 transition-colors shadow-sm">
              <div className="w-20 h-20 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center text-3xl mx-auto mb-4">
                {item.icon}
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-accent uppercase tracking-widest">{item.step}</span>
                <h4 className="text-lg font-black text-text-primary uppercase font-['Space_Grotesk']">{item.title}</h4>
                <p className="text-[11px] font-bold text-text-secondary uppercase leading-relaxed tracking-widest">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Result Section */}
      {result && (
        <div className="animate-in fade-in zoom-in-95 duration-700">
           <div className="relative p-[1px] rounded-[3rem] bg-gradient-to-br from-success/50 to-transparent overflow-hidden shadow-2xl">
             <div className="relative bg-bg-surface p-12 md:p-20 space-y-12 rounded-[3rem]">
                <div className="flex flex-col items-center text-center space-y-4">
                   <div className="w-20 h-20 rounded-[2rem] bg-success/10 flex items-center justify-center mb-4 border border-success/20 animate-bounce">
                      <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                   <h2 className="text-4xl font-black tracking-tight text-text-primary font-['Space_Grotesk']">Identity Formatted!</h2>
                   <p className="text-lg text-text-secondary font-bold uppercase tracking-widest">Your print-ready ID file is ready.</p>
                </div>

                <div className="relative group mx-auto max-w-2xl bg-bg-muted rounded-[2rem] p-4 border border-border shadow-2xl">
                   <img src={result} className="w-full h-auto rounded-[1.5rem]" alt="Formatted result" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
                   <button onClick={() => window.open(result)} className="h-20 bg-accent text-accent-text font-black rounded-2xl uppercase tracking-widest hover:bg-accent-hover transition-all shadow-lg">Download PNG</button>
                   <button onClick={() => window.open(result)} className="h-20 bg-bg-muted text-text-primary font-black rounded-2xl border border-border uppercase tracking-widest hover:bg-bg-surface transition-all">Download JPG</button>
                </div>
                
                <button 
                  onClick={() => { setFront(null); setBack(null); setProfile(null); setPreviews({front:null, back:null, profile:null}); setResult(null); }} 
                  className="block mx-auto text-[10px] font-black text-text-muted hover:text-text-primary transition-colors uppercase tracking-[0.5em] mt-8"
                >
                  ← Create Another ID
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
