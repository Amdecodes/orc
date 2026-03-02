"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Image as ImageIcon, 
  User, 
  Clock, 
  CreditCard, 
  Maximize2,
  X,
  Zap,
  Bot,
  Globe,
  Activity,
  AlertTriangle
} from "lucide-react";


interface TopUpRequest {
  id: string;
  userId: string;
  credits: number;
  price: number;
  screenshotPath: string | null;
  referenceText: string | null;
  status: string;
  source: string;
  type: "TOPUP" | "PAYMENT";
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
  const [sourceFilter, setSourceFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState<{
    requestId: string;
    action: "APPROVE" | "REJECT";
    type: string;
    userEmail: string;
    credits: number;
  } | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/topup/pending");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Failed to fetch top-up requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((r) => {
    if (sourceFilter === "all") return true;
    return r.source === sourceFilter;
  });

  const handleAction = async (requestId: string, action: "APPROVE" | "REJECT", type: string) => {
    setActioningId(requestId);
    setPendingAction(null);
    try {
      const res = await fetch("/api/admin/topup/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, type }),
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-zinc-100 animate-spin" />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Synchronizing Vault</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase">
              Top-up <span className="text-zinc-700">Queue</span>
            </h1>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
              Vault Operations • Pending Approval Requests
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 w-fit">
            {[
              { id: "all", label: "All Items", icon: Activity },
              { id: "BOT", label: "Bot Only", icon: Bot },
              { id: "WEB", label: "Web Only", icon: Globe },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSourceFilter(f.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                  sourceFilter === f.id 
                    ? "bg-white text-black shadow-lg" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <f.icon className="w-3 h-3" />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-3xl">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Queue</div>
          <div className="text-2xl font-black">{filteredRequests.length} Requests</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                <th className="px-8 py-5">Source</th>
                <th className="px-8 py-5">User</th>
                <th className="px-8 py-5">Request</th>
                <th className="px-8 py-5">Proof</th>
                <th className="px-8 py-5">Reference</th>
                <th className="px-8 py-5">Time</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="group hover:bg-white/5 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center justify-center gap-1">
                      {req.source === "BOT" ? (
                        <Bot className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Globe className="w-5 h-5 text-zinc-500" />
                      )}
                      <span className="text-[8px] font-black text-zinc-500">{req.source}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-xs font-black text-zinc-200">{req.user.email}</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                          req.type === "TOPUP" 
                            ? "bg-zinc-800 border-zinc-700 text-zinc-400" 
                            : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                        }`}>
                          {req.type}
                        </span>
                        <div className="text-[9px] text-zinc-500 font-medium tracking-tight">
                          {req.user.telegramId ? `@${req.user.username || req.user.telegramId}` : 'Web Customer'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-sm font-black text-emerald-500">+{req.credits} CR</div>
                      <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{req.price || (req as any).amount} ETB</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {req.screenshotPath ? (
                      <button 
                        onClick={() => setSelectedScreenshot(`/api/admin/screenshot/${req.id}`)}
                        className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden group/thumb relative"
                      >
                         <img 
                          src={`/api/admin/screenshot/${req.id}`} 
                          className="w-full h-full object-cover opacity-50 group-hover/thumb:opacity-100 transition-opacity" 
                          alt="thumb" 
                        />
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 bg-black/40 transition-opacity">
                            <Maximize2 className="w-3 h-3 text-white" />
                         </div>
                      </button>
                    ) : (
                      <div className="text-[9px] font-black text-zinc-700 uppercase italic">No File</div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="max-w-[150px] truncate font-mono text-[10px] text-zinc-500" title={req.referenceText || ""}>
                      {req.referenceText || "–"}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-[10px] text-zinc-500 font-medium">
                      {new Date(req.createdAt).toLocaleDateString()}<br/>
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setPendingAction({ requestId: req.id, action: "REJECT", type: req.type, userEmail: req.user.email, credits: req.credits })}
                        disabled={actioningId === req.id}
                        className="p-2 rounded-lg bg-zinc-800 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all border border-zinc-700"
                        title="Reject"
                      >
                         <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPendingAction({ requestId: req.id, action: "APPROVE", type: req.type, userEmail: req.user.email, credits: req.credits })}
                        disabled={actioningId === req.id}
                        className="px-4 py-2 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-xl"
                      >
                        {actioningId === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto text-black" />
                        ) : (
                          "Approve"
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRequests.length === 0 && (
          <div className="p-20 text-center space-y-4 opacity-20">
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Vault Clear</p>
          </div>
        )}
      </div>

      {/* ─── Confirmation Modal ─── */}
      {pendingAction && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/80 animate-in fade-in duration-200"
          onClick={() => setPendingAction(null)}
        >
          <div 
            className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 animate-in zoom-in-95 duration-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                pendingAction.action === "APPROVE" 
                  ? "bg-emerald-500/20 text-emerald-500" 
                  : "bg-red-500/20 text-red-500"
              }`}>
                {pendingAction.action === "APPROVE" 
                  ? <CheckCircle2 className="w-6 h-6" /> 
                  : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Confirm Action
                </div>
                <div className="text-xl font-black">
                  {pendingAction.action === "APPROVE" ? "Approve Payment" : "Reject Payment"}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-5 space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-zinc-500">User</span>
                <span className="text-zinc-300 truncate max-w-[180px]">{pendingAction.userEmail}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-zinc-500">Credits</span>
                <span className={pendingAction.action === "APPROVE" ? "text-emerald-500" : "text-zinc-300"}>
                  +{pendingAction.credits} CR
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-zinc-500">Action</span>
                <span className={pendingAction.action === "APPROVE" ? "text-emerald-500" : "text-red-500"}>
                  {pendingAction.action}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-600 font-medium tracking-wide">
              {pendingAction.action === "APPROVE" 
                ? "This will credit the user's account immediately. This action cannot be easily undone."
                : "This will reject the payment request. The user will be notified."}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setPendingAction(null)}
                className="flex-1 h-12 rounded-xl border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:border-zinc-700 hover:text-zinc-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(pendingAction.requestId, pendingAction.action, pendingAction.type)}
                className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  pendingAction.action === "APPROVE"
                    ? "bg-emerald-500 text-white hover:bg-emerald-400"
                    : "bg-red-500 text-white hover:bg-red-400"
                }`}
              >
                {pendingAction.action === "APPROVE" ? "Yes, Approve" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Screenshot Modal ─── */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-12 backdrop-blur-3xl bg-black/90 animate-in fade-in duration-300"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="absolute top-10 right-10 flex items-center gap-4">
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
             <img src={selectedScreenshot} className="max-h-[85vh] object-contain" alt="doc" />
          </div>
        </div>
      )}
    </div>
  );
}
