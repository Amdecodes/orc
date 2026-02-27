"use client";

import { useEffect, useState } from "react";
import { Loader2, CreditCard, DollarSign, Calendar, User, Tag, Clock } from "lucide-react";

interface Payment {
  id: string;
  userId: string;
  packageId: string;
  amount: number;
  credits: number;
  method: string;
  status: string;
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

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch("/api/admin/payments");
        const data = await res.json();
        setPayments(data);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-zinc-800 animate-spin" />
      </div>
    );
  }

  const totalRevenue = payments
    .filter((p) => p.status === "APPROVED")
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Ledger <span className="text-zinc-500">Terminal</span>
          </h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
            Financial Monitoring • Strategic Revenue Stream
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">Gross Revenue</div>
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
              {payments.map((p) => (
                <tr key={p.id} className="group hover:bg-white/5 transition-all">
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
                      <div className="text-xs font-black text-zinc-300">{p.user.email}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-xs font-black text-white uppercase">{p.package.name}</div>
                      <div className="text-[9px] text-zinc-500 uppercase tracking-widest">+{p.credits} Credits</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-black text-white italic">
                    {p.amount} ETB
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
        {payments.length === 0 && (
          <div className="p-20 text-center space-y-4 opacity-20">
            <CreditCard className="w-16 h-16 mx-auto text-zinc-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Terminal Data</p>
          </div>
        )}
      </div>
    </div>
  );
}
