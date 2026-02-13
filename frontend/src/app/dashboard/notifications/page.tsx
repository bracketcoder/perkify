"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Tag,
  AlertCircle,
  CheckCircle2,
  Shield,
  Trash2,
  Check,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Types ───────── */
type NotifType = "all" | "offer" | "expiry" | "trade" | "system";

interface Notification {
  id: number;
  type: "offer" | "expiry" | "trade" | "system";
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  action_url?: string;
  action_label?: string;
}

/* ───────── Type Config ───────── */
const typeConfig = {
  offer: { label: "Offers", icon: Tag, bg: "bg-primary-50", text: "text-primary-600" },
  expiry: { label: "Expiry", icon: AlertCircle, bg: "bg-amber-50", text: "text-amber-600" },
  trade: { label: "Trades", icon: CheckCircle2, bg: "bg-green-50", text: "text-green-600" },
  system: { label: "System", icon: Shield, bg: "bg-blue-50", text: "text-blue-600" },
};

/* ───────── Page ───────── */
export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotifType>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiCall("notifications/");
      if (res.ok) {
        const data = await res.json();
        const notifList = Array.isArray(data) ? data : data.results || [];
        setNotifications(notifList);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const filtered = notifications.filter((n) => filter === "all" || n.type === filter);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      const res = await apiCall("notifications/mark-all-read/", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch {
      // fallback: update locally
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const markRead = async (id: number) => {
    try {
      const res = await apiCall(`notifications/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch {
      // fallback: update locally
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const res = await apiCall(`notifications/${id}/`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch {
      // fallback: remove locally
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const typeCounts = {
    all: notifications.length,
    offer: notifications.filter((n) => n.type === "offer").length,
    expiry: notifications.filter((n) => n.type === "expiry").length,
    trade: notifications.filter((n) => n.type === "trade").length,
    system: notifications.filter((n) => n.type === "system").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary-600 animate-spin" />
          <span className="text-sm text-gray-500">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="min-w-[24px] h-6 flex items-center justify-center px-2 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">Stay updated on your offers, trades, and alerts</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Check size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto">
        {(["all", "offer", "expiry", "trade", "system"] as NotifType[]).map((t) => {
          const config = t !== "all" ? typeConfig[t] : null;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === t
                  ? "bg-primary-50 text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {config && <config.icon size={14} />}
              {t === "all" ? "All" : config?.label}
              <span className={`text-xs ${filter === t ? "text-primary-500" : "text-gray-400"}`}>
                {typeCounts[t]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((n) => {
            const config = typeConfig[n.type] || typeConfig.system;
            return (
              <div
                key={n.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md ${
                  !n.read ? "border-primary-200 bg-primary-50/20" : "border-gray-100"
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                      <config.icon size={20} className={config.text} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-semibold ${!n.read ? "text-gray-900" : "text-gray-700"}`}>
                            {n.title}
                          </h3>
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{n.created_at}</span>
                      </div>
                      <p className={`text-sm leading-relaxed ${!n.read ? "text-gray-700" : "text-gray-500"}`}>
                        {n.message}
                      </p>

                      {/* Action Row */}
                      <div className="flex items-center gap-2 mt-3">
                        {n.action_label && n.action_url && (
                          <Link
                            href={n.action_url}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                          >
                            {n.action_label}
                            <ChevronRight size={12} />
                          </Link>
                        )}
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <Check size={12} />
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500 text-sm">
            You&apos;re all caught up! New notifications will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
