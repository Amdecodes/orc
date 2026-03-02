"use client";

import { useEffect, useState } from "react";
import { Loader2, CreditCard, DollarSign, Calendar, User, Tag, Clock, Bot, Globe } from "lucide-react";

interface Payment {
  id: string;
  userId: string;
  packageId: string;
  amount: number;
  credits: number;
  method: string;
  status: string;
  source: string;
  createdAt: string;
  approvedAt: string | null;
  user: {
    email: string;
  };
  package: {
    name: string;
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch("/api/admin/payments");
        const data = await res.json();
        if (Array.isArray(data)) {
          setPayments(data);
        } else {
          console.error("API returned non-array data:", data);
          setPayments([]);
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p: any) => {
    // 1. Source Filter
    if (sourceFilter !== "all" && p.source !== sourceFilter) return false;

    // 2. Date Filter
    if (dateFilter === "all") return true;
    
    const now = new Date();
    const createdAt = new Date(p.createdAt);
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (dateFilter === "today") {
      return createdAt.toDateString() === now.toDateString();
    }
    if (dateFilter === "7days") return diffDays <= 7;
    if (dateFilter === "30days") return diffDays <= 30;
    if (dateFilter === "90days") return diffDays <= 90;
    if (dateFilter === "year") return diffDays <= 365;
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-zinc-800 animate-spin" />
      </div>
    );
  }

  const totalRevenue = filteredPayments
    .filter((p: any) => p.status === "APPROVED")
    .reduce((acc, p: any) => acc + (p.amount || p.price || 0), 0);

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              Ledger <span className="text-zinc-500">Terminal</span>
            </h1>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
              Financial Monitoring • Strategic Revenue Stream
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 p-1 bg-zinc-950 rounded-2xl border border-zinc-800">
              {[
                { id: "all", label: "All Time" },
                { id: "today", label: "Today" },
                { id: "7days", label: "7D" },
                { id: "30days", label: "30D" },
                { id: "90days", label: "90D" },
                { id: "year", label: "1Y" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDateFilter(f.id)}
                  className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                    dateFilter === f.id 
                      ? "bg-white text-black shadow-lg" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-zinc-800" />

            <div className="flex items-center gap-2 p-1 bg-zinc-950 rounded-2xl border border-zinc-800">
              {[
                { id: "all", label: "All Sources", icon: Globe },
                { id: "BOT", label: "Bot Only", icon: Bot },
                { id: "WEB", label: "Web Only", icon: Globe },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSourceFilter(f.id)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
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
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">
              {dateFilter === "all" ? "Gross Revenue" : `Revenue (${dateFilter})`}
            </div>
            <div className="text-3xl font-black text-emerald-500 tracking-tighter leading-none mt-1">
              {totalRevenue} ETB
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
          <Clock className="w-4 h-4 text-zinc-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                <th className="px-8 py-4">Source</th>
                <th className="px-8 py-4">Transaction ID</th>
                <th className="px-8 py-4">User Identity</th>
                <th className="px-8 py-4">Package Details</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Method</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Execution Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredPayments.map((p: any) => (
                <tr key={p.id} className="group hover:bg-white/5 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center justify-center gap-1">
                       {p.source === "BOT" ? (
                        <Bot className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Globe className="w-4 h-4 text-zinc-500" />
                      )}
                      <span className="text-[7px] font-black text-zinc-600">{p.source || "WEB"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-mono text-[10px] text-zinc-500 group-hover:text-zinc-300">
                      {p.id.slice(0, 12)}...
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        {p.user.email[0].toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-black text-zinc-300">{p.user.email}</div>
                        <span className={`text-[7px] font-black px-1 rounded border ${
                          p.type === "TOPUP" 
                            ? "bg-zinc-800 border-zinc-700 text-zinc-500" 
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        }`}>
                          {p.type || "PAYMENT"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-xs font-black text-white uppercase">{p.package?.name || "Manual Load"}</div>
                      <div className="text-[9px] text-zinc-500 uppercase tracking-widest">+{p.credits} Credits</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-black text-white italic">
                    {p.amount || p.price} ETB
                  </td>
                  <td className="px-8 py-6">
                    <div className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 w-fit text-[8px] font-black uppercase tracking-widest text-zinc-400">
                      {p.method}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                      p.status === "APPROVED" ? "text-emerald-500" : 
                      p.status === "PENDING" ? "text-amber-500" : "text-red-500"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        p.status === "APPROVED" ? "bg-emerald-500" : 
                        p.status === "PENDING" ? "bg-amber-500" : "bg-red-500"
                      }`} />
                      {p.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] text-zinc-500 font-medium whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString()} • {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPayments.length === 0 && (
          <div className="p-20 text-center space-y-4 opacity-20">
            <CreditCard className="w-16 h-16 mx-auto text-zinc-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Terminal Data</p>
          </div>
        )}
      </div>
    </div>
  );
}
