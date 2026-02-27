"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Image as ImageIcon, 
  MessageSquare, 
  User, 
  Clock, 
  CreditCard, 
  Maximize2,
  X,
  Calendar,
  Zap
} from "lucide-react";

interface TopUpRequest {
  id: string;
  userId: string;
  credits: number;
  price: number;
  screenshotPath: string | null;
  referenceText: string | null;
  status: string;
  createdAt: string;
  user: {
    email: string;
    credits: number;
    username: string | null;
    name: string | null;
    telegramId: string | null;
  };
}

export default function TopUpsPage() {
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/topup/pending");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch top-up requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setActioningId(requestId);
    try {
      const res = await fetch("/api/admin/topup/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
    } catch (error) {
      console.error("Action error:", error);
      alert("Network error");
    } finally {
      setActioningId(null);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      full: date.toLocaleString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
           <div className="absolute inset-0 rounded-full bg-zinc-800 animate-ping opacity-20"></div>
           <Loader2 className="w-12 h-12 text-zinc-100 animate-spin relative z-10" />
        </div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Synchronizing Data</p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-400 flex items-center justify-center shadow-2xl shadow-zinc-100/10">
              <Zap className="w-6 h-6 text-black fill-black" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
              Top-up <span className="text-zinc-700">Vault</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Live Operations</p>
             </div>
             <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Manual Liquidity Verification</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-xl group hover:border-zinc-700 transition-all">
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Queue Status</div>
              <div className="text-2xl font-black tabular-nums tracking-tighter">
                {requests.length < 10 ? `0${requests.length}` : requests.length} <span className="text-xs text-zinc-600 uppercase">Pending</span>
              </div>
           </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="h-[50vh] bg-zinc-950 border border-zinc-900 rounded-[3rem] flex flex-col items-center justify-center space-y-6 text-zinc-600 transition-all hover:border-zinc-800 group">
          <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
             <CheckCircle2 className="w-8 h-8 opacity-40 text-emerald-500" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400">Terminal Synchronized</p>
            <p className="text-[10px] font-medium uppercase tracking-widest opacity-50">No pending actions requiring intervention</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {requests.map((req) => {
            const timeInfo = formatTime(req.createdAt);
            return (
              <div
                key={req.id}
                className="group relative bg-[#0a0a0a] border border-zinc-900 rounded-[2.5rem] overflow-hidden hover:border-zinc-700 transition-all duration-500 shadow-2xl hover:shadow-zinc-100/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-100/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                
                <div className="p-8 flex flex-col md:flex-row items-stretch gap-10">
                  {/* Proof Side */}
                  <div className="relative w-full md:w-56 h-72 md:h-auto overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shrink-0 group-hover:border-zinc-600 transition-all duration-500">
                    {req.screenshotPath ? (
                      <>
                        <img
                          src={`/api/admin/screenshot/${req.id}`}
                          alt="Payment Proof"
                          className="w-full h-full object-cover opacity-40 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700 blur-[2px] group-hover:blur-0"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <button
                          onClick={() => setSelectedScreenshot(`/api/admin/screenshot/${req.id}`)}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 md:bg-black/0 md:opacity-0 group-hover:opacity-100 transition-all duration-500"
                        >
                          <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                            <Maximize2 className="w-5 h-5" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-white drop-shadow-lg">Inspect Document</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                        <MessageSquare className="w-12 h-12" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Text Based Proof</span>
                      </div>
                    )}
                  </div>

                  {/* Information Side */}
                  <div className="flex-1 flex flex-col justify-between py-2 space-y-10">
                    <div className="space-y-8">
                      {/* User Section */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 group-hover:border-zinc-700 transition-colors">
                             <User className="w-6 h-6 text-zinc-500" />
                          </div>
                          <div className="space-y-1">
                             <h3 className="text-xl font-black tracking-tight text-white group-hover:text-zinc-100 flex items-center gap-3">
                                {req.user.name || 'Anonymous User'}
                                <span className="text-[9px] px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 font-black uppercase tracking-tight">VIP</span>
                             </h3>
                             <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-xs font-medium text-zinc-400">{req.user.email}</span>
                                <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                                {req.user.username && (
                                  <span className="text-xs font-black text-blue-500 tracking-tight italic">@{req.user.username}</span>
                                )}
                                <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                                <span className="text-[10px] font-mono text-zinc-600 select-all tracking-tighter uppercase">{req.user.telegramId || 'No TG ID'}</span>
                             </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 lg:text-right">
                           <div className="space-y-1">
                              <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Current Credits</div>
                              <div className="text-lg font-black tracking-tighter text-zinc-300">{req.user.credits} <span className="text-[10px] text-zinc-600">CR</span></div>
                           </div>
                           <div className="w-px h-10 bg-zinc-900 hidden lg:block"></div>
                           <div className="space-y-1">
                              <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 lg:justify-end">
                                <Clock className="w-2.5 h-2.5" /> Received
                              </div>
                              <div className="text-xs font-black tracking-tight text-zinc-100 uppercase italic">
                                {timeInfo.relative}
                                <span className="mx-2 text-zinc-800">/</span>
                                <span className="text-[9px] font-medium text-zinc-500 italic lowercase">{timeInfo.date} • {timeInfo.time}</span>
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Payment Section */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                         <div className="p-6 bg-[#040404] rounded-3xl border border-zinc-900 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center shrink-0">
                               <CreditCard className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="space-y-4 flex-1">
                               <div className="flex items-center justify-between">
                                  <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Transaction Intent</div>
                                  <div className="text-[10px] font-mono text-zinc-700 uppercase">SYS-MGR-#{req.id.slice(0, 4)}</div>
                               </div>
                               <div className="flex items-end justify-between">
                                  <div className="space-y-1">
                                     <div className="text-3xl font-black tracking-tighter text-emerald-500 group-hover:scale-105 transition-transform origin-left">
                                        +{req.credits} <span className="text-xs uppercase text-emerald-600/50">Units</span>
                                     </div>
                                     <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Pricing Model: {req.price} ETB</div>
                                  </div>
                                  <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-black text-zinc-400 uppercase tracking-tighter">
                                     Manual Wire
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="p-6 bg-[#040404] rounded-3xl border border-zinc-900 space-y-4">
                            <div className="flex items-center justify-between">
                               <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Evidence Data</div>
                               <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-500 uppercase tracking-widest">Verified Schema</div>
                            </div>
                            <div 
                              className={`p-3 rounded-2xl font-mono text-xs break-all border transition-all ${
                                req.referenceText 
                                  ? 'bg-zinc-950 border-zinc-800 text-zinc-300' 
                                  : 'bg-zinc-950/50 border-zinc-900 text-zinc-700 italic'
                              }`}
                            >
                               {req.referenceText ? (
                                 <div className="flex flex-col gap-1">
                                    <span className="text-[8px] uppercase text-zinc-600 font-sans tracking-widest mb-1">Payment Account / Reference:</span>
                                    {req.referenceText}
                                 </div>
                               ) : "No textual reference provided"}
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-6 pt-6 pt-10 border-t border-zinc-900">
                      <div className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.2em] hidden sm:block">
                        Digital Asset Distribution Terminal • ETHIOPIA OPS
                      </div>
                      <div className="flex items-center gap-4 flex-1 sm:flex-none">
                        <button
                          onClick={() => handleAction(req.id, "REJECT")}
                          disabled={actioningId === req.id}
                          className="px-6 h-12 rounded-2xl bg-zinc-950 text-zinc-500 hover:bg-zinc-900 hover:text-red-500 border border-zinc-900 hover:border-red-500/30 font-black uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-3 flex-1 sm:flex-none"
                        >
                          {actioningId === req.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Revoke
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "APPROVE")}
                          disabled={actioningId === req.id}
                          className="px-10 h-12 rounded-2xl bg-white text-black hover:bg-emerald-500 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl hover:shadow-emerald-500/20 flex-1 sm:flex-none group/btn"
                        >
                          {actioningId === req.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                              Authorize Receipt
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Modal/Lightbox */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-8 lg:p-12 animate-in fade-in duration-300 backdrop-blur-3xl bg-black/90"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="absolute top-10 right-10 flex items-center gap-4">
             <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Inspecting Digital Receipt • Safe View Mode</div>
             <button 
                onClick={() => setSelectedScreenshot(null)}
                className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors border border-zinc-800"
              >
                <X className="w-6 h-6" />
              </button>
          </div>
          <div 
            className="relative max-w-full max-h-full rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
             <img 
               src={selectedScreenshot} 
               alt="Document Inspector" 
               className="max-h-[85vh] object-contain select-none"
             />
             <div className="absolute bottom-6 left-6 right-6 p-4 bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <ImageIcon className="w-4 h-4 text-zinc-500" />
                    <span className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">Captured Digital Reference</span>
                 </div>
                 <a 
                   href={selectedScreenshot} 
                   target="_blank" 
                   className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 hover:text-emerald-400 transition-colors"
                 >
                   Open Original <ExternalLink className="w-3 h-3" />
                 </a>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
