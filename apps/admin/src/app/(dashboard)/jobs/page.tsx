"use client";

import { useEffect, useState } from "react";
import { Loader2, Activity, User, Clock, Zap, CheckCircle2, XCircle, Globe, Bot } from "lucide-react";

interface Job {
  id: string;
  userId: string;
  status: string;
  cost: number;
  source: string;
  createdAt: string;
  user: {
    email: string;
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("/api/admin/jobs");
        const data = await res.json();
        if (Array.isArray(data)) {
          setJobs(data);
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job: any) => {
    // 1. Source Filter
    if (sourceFilter !== "all" && job.source !== sourceFilter) return false;

    // 2. Date Filter
    if (dateFilter === "all") return true;
    
    const now = new Date();
    const createdAt = new Date(job.createdAt);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-zinc-100 animate-spin" />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Analyzing Streams</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase">
              OCR <span className="text-zinc-700">Payloads</span>
            </h1>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
              Job Monitor • Real-time Extraction Analytics
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
        
        <div className="px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-3xl">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
            {dateFilter === "all" ? "Total Jobs" : `Jobs (${dateFilter})`}
          </div>
          <div className="text-2xl font-black">{filteredJobs.length} Processed</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                <th className="px-8 py-5 text-center">Source</th>
                <th className="px-8 py-5">Job ID</th>
                <th className="px-8 py-5">User</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Cost</th>
                <th className="px-8 py-5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="group hover:bg-white/5 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center justify-center gap-1">
                       {(job as any).source === "BOT" ? (
                        <Bot className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Globe className="w-4 h-4 text-zinc-500" />
                      )}
                      <span className="text-[7px] font-black text-zinc-600">{(job as any).source || "WEB"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-mono text-[10px] text-zinc-500 group-hover:text-zinc-300">
                      #{job.id.slice(0, 12)}...
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-black text-zinc-300">{job.user.email}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                      job.status === "SUCCESS" ? "text-emerald-500" : 
                      job.status === "PROCESSING" ? "text-amber-500" : "text-red-500"
                    }`}>
                      {job.status === "SUCCESS" ? <CheckCircle2 className="w-3 h-3" /> : 
                       job.status === "PROCESSING" ? <Activity className="w-3 h-3 animate-pulse" /> : <XCircle className="w-3 h-3" />}
                      {job.status}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-black text-zinc-300">
                      {job.cost} <span className="text-[9px] text-zinc-600">CREDITS</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] text-zinc-500 font-medium whitespace-nowrap">
                    {new Date(job.createdAt).toLocaleDateString()} • {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredJobs.length === 0 && (
          <div className="p-20 text-center space-y-4 opacity-20">
            <Zap className="w-16 h-16 mx-auto text-zinc-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">System Idle</p>
          </div>
        )}
      </div>
    </div>
  );
}
