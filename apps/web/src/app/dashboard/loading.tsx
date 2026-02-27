export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in duration-500">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="space-y-2 text-center">
        <p className="text-[10px] font-black text-accent uppercase tracking-[0.5em] animate-pulse">Initializing Session</p>
        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Preparing your workspace...</p>
      </div>
    </div>
  );
}
