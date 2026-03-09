"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import { X } from "lucide-react";

interface LoadingOverlayProps {
  status: "UPLOADING" | "PENDING" | "PROCESSING" | "FINALIZING" | null;
  queueMetrics?: {
    position: number;
    estimatedSeconds: number;
  } | null;
}

export function LoadingOverlay({ status, queueMetrics }: LoadingOverlayProps) {
  const { t } = useLanguage();

  if (!status) return null;

  const steps = [
    { id: "UPLOADING", label: t('uploading'), icon: "📤" },
    { id: "PENDING", label: t('in_queue'), icon: "⏳" },
    { id: "PROCESSING", label: t('processing'), icon: "⚡" },
    { id: "FINALIZING", label: t('finalizing'), icon: "✨" },
  ];

  const currentIndex = steps.findIndex((s) => s.id === status);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-bg-page/40 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-bg-surface/80 dark:bg-bg-surface/40 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden relative">
        {/* Animated Background Glow */}
        <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-accent/20 rounded-full blur-[80px] animate-pulse-glow" />
        
        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-3">
             <div className="w-20 h-20 bg-accent/10 rounded-[2rem] flex items-center justify-center text-3xl mx-auto shadow-inner border border-accent/20 animate-bounce">
                {steps[currentIndex]?.icon || "⏳"}
             </div>
             <h2 className="text-2xl font-black tracking-tight text-text-primary font-['Space_Grotesk'] uppercase">
               {steps[currentIndex]?.label || t('generating')}
             </h2>
             {status === "PENDING" && queueMetrics && (
               <div className="flex flex-col items-center gap-1">
                 <span className="text-xs font-black text-accent uppercase tracking-widest">
                   Position: #{queueMetrics.position}
                 </span>
                 <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {t('wait_time_est', { seconds: queueMetrics.estimatedSeconds })}
                 </span>
               </div>
             )}
          </div>

          {/* Progress Bar Container */}
          <div className="space-y-4">
             <div className="h-3 w-full bg-bg-muted rounded-full overflow-hidden border border-border/50 group">
                <div 
                  className="h-full bg-accent transition-all duration-1000 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                </div>
             </div>
             
             {/* Step Indicators */}
             <div className="grid grid-cols-4 gap-2">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex flex-col items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${idx <= currentIndex ? 'bg-accent scale-110 shadow-[0_0_8px_rgba(var(--accent),0.6)]' : 'bg-border'}`} />
                    <span className={`text-[7px] font-black uppercase tracking-tighter text-center leading-none ${idx === currentIndex ? 'text-accent' : 'text-text-muted opacity-50'}`}>
                      {step.id}
                    </span>
                  </div>
                ))}
             </div>
          </div>

          {/* Tips Section */}
          <div className="p-4 rounded-2xl bg-bg-muted/50 border border-border/50">
             <div className="flex items-start gap-3">
                <span className="text-lg">💡</span>
                <p className="text-[10px] sm:text-xs font-bold text-text-secondary leading-relaxed uppercase tracking-wider">
                  Our AI is analyzing, normalizing, and formatting your ID to international print standards. This usually takes 30-60s.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
