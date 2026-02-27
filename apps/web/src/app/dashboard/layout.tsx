"use client";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-page transition-colors duration-300">
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
