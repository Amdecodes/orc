"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Job = {
  id: string;
  status: string;
  createdAt: string;
};

export default function HistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadHistory() {
    try {
      const res = await fetch("/api/jobs/history");
      if (res.ok) {
        setJobs(await res.json());
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  if (loading) return (
    <div className="p-8 text-center">
      <p className="text-gray-500 animate-pulse">Loading your history...</p>
    </div>
  );

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Your History</h1>
          <p className="text-gray-500 mt-2 font-light">
            View your past generated IDs. Files are available for 48 hours.
          </p>
        </div>
        <Button variant="outline" onClick={loadHistory}>Refresh</Button>
      </header>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center shadow-xl shadow-gray-200/40 border border-gray-100">
          <p className="text-gray-400 font-light italic text-lg">
            No jobs found. Start by formatting an ID!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-6 text-sm font-bold text-gray-400 uppercase tracking-widest">Job ID</th>
                  <th className="px-8 py-6 text-sm font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-sm font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-6 text-sm font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-8">
                      <div className="font-mono text-xs font-bold text-gray-900 uppercase">{job.id}</div>
                    </td>
                    <td className="px-8 py-8">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        job.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                        job.status === "FAILED" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-sm text-gray-500 font-light">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-8 py-8 text-right">
                      {job.status === "SUCCESS" && (
                        <a 
                          href={`/api/jobs/download/${job.id}`} 
                          download 
                          className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-gray-200 transition-all hover:scale-110 active:scale-95"
                        >
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
