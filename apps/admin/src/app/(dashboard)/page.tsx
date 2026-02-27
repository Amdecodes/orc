import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { 
  Users, 
  TrendingUp, 
  Zap, 
  Activity, 
  CheckCircle2, 
  Clock,
  ArrowUpRight
} from "lucide-react";

export default async function AdminDashboardPage() {
  const clerkUser = await currentUser();

  // Fetch real-time metrics
  const [
    totalUsers,
    totalJobs,
    pendingApprovals,
    totalRevenueData,
    recentActivity
  ] = await Promise.all([
    prisma.user.count(),
    prisma.job.count({ where: { status: "SUCCESS" } }),
    prisma.topUpRequest.count({ where: { status: "PENDING" } }),
    prisma.payment.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true }
    }),
    prisma.creditTransaction.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } }
    })
  ]);

  const totalRevenue = totalRevenueData._sum.amount || 0;

  const stats = [
    { 
      label: "Total Revenue", 
      value: `${totalRevenue} ETB`, 
      sub: "Lifetime approved payments",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    { 
      label: "Active Users", 
      value: totalUsers.toString(), 
      sub: "Registered identifiers",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    { 
      label: "Processed Jobs", 
      value: totalJobs.toString(), 
      sub: "Successful extractions",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
  ];

  return (
    <div className="p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter">
            Command <span className="text-zinc-500">Center</span>
          </h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">
            Operator: {clerkUser?.emailAddresses[0].emailAddress}
          </p>
        </div>
        {pendingApprovals > 0 && (
          <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-2 animate-pulse">
            <Activity className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
              {pendingApprovals} Urgent Approvals
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 space-y-6 hover:border-zinc-700 transition-all group overflow-hidden relative"
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} blur-3xl rounded-full opacity-50`} />
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <ArrowUpRight className="w-5 h-5 text-zinc-800 group-hover:text-zinc-600 transition-colors" />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400">
                {stat.label}
              </div>
              <div className={`text-4xl font-black tracking-tighter ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-[9px] font-medium text-zinc-600 uppercase tracking-widest">
                {stat.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Stream */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10">
          <Clock className="w-32 h-32 text-zinc-950 -mr-16 -mt-16 opacity-50" strokeWidth={1} />
        </div>

        <div className="flex items-center justify-between border-b border-zinc-800 pb-6 relative z-10">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-zinc-500" />
            <h2 className="text-xl font-black tracking-tight uppercase">
              System <span className="text-zinc-500">Events</span>
            </h2>
          </div>
          <div className="px-3 py-1 rounded-full bg-zinc-800 text-[8px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-700">
            Real-time Monitoring
          </div>
        </div>

        <div className="space-y-8 relative z-10">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-black uppercase group-hover:border-zinc-600 transition-all ${
                    activity.amount > 0 ? "text-emerald-500" : "text-amber-500"
                  }`}>
                    {activity.reason.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-white">
                      {activity.reason === "TOPUP" ? "Credit Influx" : "System Deduction"}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-medium uppercase tracking-widest mt-0.5">
                      {activity.user.email} • {new Date(activity.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-black italic tracking-tighter ${
                  activity.amount > 0 ? "text-emerald-500" : "text-amber-500"
                }`}>
                  {activity.amount > 0 ? "+" : ""}{activity.amount} CREDITS
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center opacity-20 space-y-4">
              <CheckCircle2 className="w-12 h-12 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Recent Activity Logs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
