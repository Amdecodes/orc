"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const packages = [
  { id: "p1", name: "Starter", credits: 1, price: 50 },
  { id: "p2", name: "Standard", credits: 12, price: 500, popular: true },
  { id: "p3", name: "Pro", credits: 40, price: 1400 },
];

export default function CreditsPage() {
  const [selectedPackage, setSelectedPackage] = useState(packages[1]);
  const [proof, setProof] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          amount: selectedPackage.price,
          credits: selectedPackage.credits,
          method: "MANUAL",
          referenceText: reference,
          proofUrl: "https://example.com/mock-proof.png", 
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Payment submitted for review.");
        setProof(null);
        setReference("");
      } else {
        alert("Error: " + (data.error || "Submission failed"));
      }
    } catch (error) {
      console.error("Payment submission failed:", error);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-16 max-w-6xl mx-auto space-y-24">
      <header className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white font-['Space_Grotesk']">Select Entry Plan</h1>
        <p className="text-text-secondary text-lg font-medium opacity-60 uppercase tracking-widest text-[10px]">Secure & Verified Priority Processing</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <div 
            key={pkg.id} 
            onClick={() => setSelectedPackage(pkg)}
            className={`group relative overflow-hidden p-10 rounded-[3rem] border transition-all duration-700 cursor-pointer ${
              selectedPackage.id === pkg.id 
              ? "bg-bg-surface-raised border-accent/50 shadow-md scale-[1.02]" 
              : "bg-bg-surface border-border hover:border-accent/30 hover:bg-bg-surface-raised shadow-sm"
            }`}
          >
            {/* Border Beam for selected package */}
            {selectedPackage.id === pkg.id && (
              <div className="border-beam inset-0 opacity-40 z-0" />
            )}

            {pkg.popular && (
              <div className="absolute top-6 right-8 bg-accent text-accent-text text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg z-10">
                Most Efficient
              </div>
            )}
            
            <div className="space-y-1 relative z-10">
              <div className={`text-6xl font-black transition-colors ${selectedPackage.id === pkg.id ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                {pkg.credits}
              </div>
              <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] pb-8">
                Entry Credits
              </div>
            </div>

            <div className="pt-4 border-t border-border relative z-10">
               <div className="text-3xl font-black text-text-primary leading-none font-['Space_Grotesk']">{pkg.price} <span className="text-sm text-text-muted ml-1">ETB</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-bg-surface/50 backdrop-blur-3xl border border-border rounded-[4rem] p-10 md:p-20 grid lg:grid-cols-2 gap-20 shadow-xl relative overflow-hidden mt-16">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] -z-10" />
        
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <span className="w-10 h-10 rounded-xl bg-bg-muted border border-border flex items-center justify-center font-black text-text-primary italic">1</span>
               <h3 className="text-2xl font-black tracking-tight text-text-primary">Transfer Funds</h3>
            </div>
            <div className="p-10 bg-bg-muted rounded-[2.5rem] border border-border space-y-6 text-sm relative group overflow-hidden shadow-inner">
                <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-text-muted font-black text-[10px] uppercase tracking-widest">Network</span>
                    <span className="font-black text-text-primary px-3 py-1 rounded-lg bg-bg-surface">Telebirr • CBE</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-text-muted font-black text-[10px] uppercase tracking-widest">Account ID</span>
                    <span className="font-mono font-black text-accent text-lg select-all tracking-wider">1000XXXXXXXXXX</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-text-muted font-black text-[10px] uppercase tracking-widest">Holder</span>
                    <span className="font-black text-text-primary">National ID Services</span>
                </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <span className="w-10 h-10 rounded-xl bg-bg-muted border border-border flex items-center justify-center font-black text-text-primary italic">2</span>
               <h3 className="text-2xl font-black tracking-tight text-text-primary">Verify Transaction</h3>
            </div>
            <Input 
              placeholder="Ref: FT23..." 
              className="h-20 bg-bg-muted border-border rounded-[1.5rem] font-bold text-text-primary placeholder:text-text-muted px-8 focus:ring-1 focus:ring-accent/40 transition-all text-xl"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <span className="w-10 h-10 rounded-xl bg-bg-muted border border-border flex items-center justify-center font-black text-text-primary italic">3</span>
               <h3 className="text-2xl font-black tracking-tight text-text-primary">Upload Proof</h3>
            </div>
            <div className="group relative aspect-[16/6] bg-bg-muted rounded-[2rem] border-2 border-dashed border-border flex flex-col items-center justify-center p-8 hover:border-accent/30 transition-all overflow-hidden shadow-inner bg-shimmer bg-[length:200%_100%]">
                {proof ? (
                    <div className="text-xs font-black text-text-primary bg-accent/10 px-6 py-3 rounded-xl border border-accent/20 flex items-center gap-2">
                       <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                       {proof.name}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 text-text-muted group-hover:text-text-primary transition-all transform group-hover:scale-105">
                        <svg className="w-10 h-10 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Snapshot of receipt</span>
                    </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => setProof(e.target.files?.[0] || null)} />
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent-hover rounded-[2.2rem] blur opacity-25 group-hover:opacity-50 transition duration-500" />
            <Button 
              className="relative w-full h-24 text-2xl font-[900] rounded-[2rem] bg-accent text-accent-text hover:bg-accent-hover shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale" 
              disabled={!proof || !reference || loading}
              onClick={handleSubmit}
            >
              {loading ? "PROCESSING..." : `ACTIVATE ${selectedPackage.credits} ENTRIES`}
            </Button>
          </div>
          
          <p className="text-center text-[10px] font-black text-text-muted uppercase tracking-[0.5em] opacity-40">24/7 Verified Gateway</p>
        </div>
      </div>
    </div>
  );
}
