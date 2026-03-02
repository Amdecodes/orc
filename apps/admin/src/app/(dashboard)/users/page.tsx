"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, Mail, Calendar, CreditCard, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  credits: number;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-zinc-100 animate-spin" />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Synchronizing Registry</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-12 animate-in fade-in duration-700">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase">
            User <span className="text-zinc-700">Registry</span>
          </h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
            Identity Management • System User Database
          </p>
        </div>
        <div className="px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-3xl">
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Population</div>
          <div className="text-2xl font-black">{users.length} Users</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                <th className="px-8 py-5">Identity (Email)</th>
                <th className="px-8 py-5">Role</th>
                <th className="px-8 py-5">Balance</th>
                <th className="px-8 py-5">Joined Date</th>
                <th className="px-8 py-5 text-right">Reference ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {users.map((u) => (
                <tr key={u.id} className="group hover:bg-white/5 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 group-hover:bg-zinc-700 transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-black text-zinc-300">{u.email}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border w-fit ${
                      u.role === "ADMIN" ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                    }`}>
                      {u.role}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-black text-zinc-300">
                      <CreditCard className="w-3.5 h-3.5 text-zinc-600" />
                      {u.credits} <span className="text-[9px] text-zinc-600 uppercase">CR</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] text-zinc-500 font-medium whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="font-mono text-[9px] text-zinc-700 group-hover:text-zinc-500 transition-colors uppercase">
                      {u.id.slice(0, 18)}...
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="p-20 text-center space-y-4 opacity-20">
            <Users className="w-16 h-16 mx-auto text-zinc-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Deserted Registry</p>
          </div>
        )}
      </div>
    </div>
  );
}
