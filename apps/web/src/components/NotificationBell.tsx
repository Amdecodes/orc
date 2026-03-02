"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  read: boolean;
  createdAt: string;
}

const typeStyles: Record<string, string> = {
  SUCCESS: "border-l-4 border-green-500 bg-green-500/5",
  ERROR: "border-l-4 border-red-500 bg-red-500/5",
  WARNING: "border-l-4 border-yellow-500 bg-yellow-500/5",
  INFO: "border-l-4 border-blue-500 bg-blue-500/5",
};

const typeIcons: Record<string, string> = {
  SUCCESS: "✅",
  ERROR: "❌",
  WARNING: "⚠️",
  INFO: "ℹ️",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds in case admin processes a request while user is on screen
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      markAllRead();
    }
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-bg-muted border border-border hover:border-accent hover:bg-accent/5 transition-all duration-200 group"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-text text-[9px] font-black flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-bg-surface border-2 border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em]">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[9px] font-black text-accent hover:text-accent-hover uppercase tracking-widest transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted">
                <Bell className="w-8 h-8 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-5 py-4 border-b border-border/50 transition-colors ${typeStyles[n.type]} ${!n.read ? "opacity-100" : "opacity-60"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base mt-0.5 flex-shrink-0">{typeIcons[n.type]}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-text-primary leading-snug">{n.title}</p>
                      <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-[9px] text-text-muted/60 mt-1.5 uppercase tracking-widest font-bold">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
