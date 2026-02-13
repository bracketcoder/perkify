"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  CreditCard,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  PlusCircle,
  Store,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Types ───────── */
interface Profile {
  first_name: string;
  last_name: string;
  wallet_balance: number;
  active_listings: number;
  pending_trades: number;
  completed_trades: number;
}

interface Transaction {
  id: number | string;
  type: "trade" | "sale" | "purchase";
  title: string;
  counterparty_name: string;
  amount: string;
  created_at: string;
  status: string;
}

interface MatchSuggestion {
  id: number;
  your_card_brand: string;
  their_card_brand: string;
  their_card_value: number;
  match_score: number;
  user_name: string;
}

/* ───────── Stat Card ───────── */
function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
    </div>
  );
}

/* ───────── Page ───────── */
export default function DashboardOverview() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentActivity, setRecentActivity] = useState<Transaction[]>([]);
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [profileRes, matchesRes] = await Promise.allSettled([
          apiCall("auth/profile/"),
          apiCall("matches/"),
        ]);

        // Profile
        if (profileRes.status === "fulfilled" && profileRes.value.ok) {
          const data = await profileRes.value.json();
          setProfile(data);
        } else {
          setError("Failed to load profile data");
        }

        // Matches — normalize API shape
        if (matchesRes.status === "fulfilled" && matchesRes.value.ok) {
          const data = await matchesRes.value.json();
          const matchList = Array.isArray(data) ? data : data.results || [];
          const normalized: MatchSuggestion[] = matchList.slice(0, 3).map((m: Record<string, unknown>, idx: number) => {
            const sc = m.suggested_card as Record<string, unknown> || {};
            const uc = m.user_card as Record<string, unknown> || {};
            return {
              id: idx,
              your_card_brand: String(uc.brand || "Unknown"),
              their_card_brand: String(sc.brand || "Unknown"),
              their_card_value: parseFloat(String(sc.value || 0)),
              match_score: Number(m.match_score || 0) / 100,
              user_name: String(sc.owner_username || "User"),
            };
          });
          setMatches(normalized);
        }

        // Fetch recent trades and normalize
        try {
          const [tradesRes, salesRes] = await Promise.allSettled([
            apiCall("trades/?ordering=-created_at"),
            apiCall("sales/?ordering=-created_at"),
          ]);

          let activity: Transaction[] = [];
          let activeListings = 0;
          let pendingTrades = 0;
          let completedTrades = 0;

          if (tradesRes.status === "fulfilled" && tradesRes.value.ok) {
            const td = await tradesRes.value.json();
            const trades = Array.isArray(td) ? td : td.results || [];
            trades.forEach((t: Record<string, unknown>) => {
              const ic = t.initiator_card as Record<string, unknown> || {};
              const rc = t.responder_card as Record<string, unknown> || {};
              const counterparty = String(t.responder || t.initiator || "User");
              if (t.status === "proposed" || t.status === "accepted") pendingTrades++;
              if (t.status === "completed") completedTrades++;
              activity.push({
                id: String(t.trade_id || `trade-${activity.length}`),
                type: "trade",
                title: `Swap: ${ic.brand_name || "Card"} ↔ ${rc.brand_name || "Card"}`,
                counterparty_name: counterparty,
                amount: "Swap",
                created_at: t.created_at ? new Date(String(t.created_at)).toLocaleDateString() : "",
                status: String(t.status || "pending"),
              });
            });
          }

          if (salesRes.status === "fulfilled" && salesRes.value.ok) {
            const sd = await salesRes.value.json();
            const sales = Array.isArray(sd) ? sd : sd.results || [];
            sales.forEach((s: Record<string, unknown>) => {
              const gc = s.gift_card as Record<string, unknown> || {};
              const isBuyer = s.role === "buyer";
              if (s.status === "pending") pendingTrades++;
              if (s.status === "completed") completedTrades++;
              activity.push({
                id: String(s.sale_id || `sale-${activity.length}`),
                type: isBuyer ? "purchase" : "sale",
                title: `${isBuyer ? "Bought" : "Sold"}: ${gc.brand_name || "Gift Card"}`,
                counterparty_name: String(isBuyer ? s.seller : s.buyer) || "User",
                amount: `$${parseFloat(String(s.amount || 0)).toFixed(2)}`,
                created_at: s.created_at ? new Date(String(s.created_at)).toLocaleDateString() : "",
                status: String(s.status || "pending"),
              });
            });
          }

          // Sort by date descending and take top 5
          activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setRecentActivity(activity.slice(0, 5));

          // Count active listings from user's own cards
          try {
            const cardsRes = await apiCall("gift-cards/");
            if (cardsRes.ok) {
              const cd = await cardsRes.json();
              const cards = Array.isArray(cd) ? cd : cd.results || [];
              activeListings = cards.filter((c: Record<string, unknown>) => c.status === "active").length;
            }
          } catch { /* ignore */ }

          // Update profile with computed stats
          setProfile(prev => prev ? {
            ...prev,
            active_listings: activeListings,
            pending_trades: pendingTrades,
            completed_trades: completedTrades,
          } : prev);
        } catch {
          // use whatever we already have
        }
      } catch {
        setError("Something went wrong loading your dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary-600 animate-spin" />
          <span className="text-sm text-gray-500">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to load dashboard</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const firstName = profile?.first_name || "there";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome back, {firstName}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your gift cards today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Wallet Balance"
          value={`$${Number(profile?.wallet_balance || 0).toFixed(2)}`}
          subtitle="Available funds"
          icon={Wallet}
          iconBg="bg-primary-50"
          iconColor="text-primary-600"
        />
        <StatCard
          label="Active Listings"
          value={profile?.active_listings || 0}
          subtitle="Cards on marketplace"
          icon={CreditCard}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Pending Trades"
          value={profile?.pending_trades || 0}
          subtitle="Awaiting action"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Completed Trades"
          value={profile?.completed_trades || 0}
          subtitle="Successfully traded"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity — 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <Link
              href="/dashboard/transactions"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
            >
              View All
              <ChevronRight size={16} />
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentActivity.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 p-4 sm:px-6 hover:bg-gray-50/50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === "purchase"
                        ? "bg-red-50"
                        : tx.type === "sale"
                        ? "bg-green-50"
                        : "bg-blue-50"
                    }`}
                  >
                    {tx.type === "purchase" ? (
                      <ArrowUpRight size={18} className="text-red-500" />
                    ) : tx.type === "sale" ? (
                      <ArrowDownLeft size={18} className="text-green-500" />
                    ) : (
                      <ArrowLeftRight size={18} className="text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {tx.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      with {tx.counterparty_name} · {tx.created_at}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-semibold ${
                        tx.amount?.startsWith("+")
                          ? "text-green-600"
                          : tx.amount?.startsWith("-")
                          ? "text-gray-900"
                          : "text-blue-600"
                      }`}
                    >
                      {tx.amount || "Swap"}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        tx.status === "completed"
                          ? "text-green-500"
                          : tx.status === "pending"
                          ? "text-amber-500"
                          : "text-gray-400"
                      }`}
                    >
                      {tx.status?.charAt(0).toUpperCase() + tx.status?.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <ArrowLeftRight size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                No recent activity yet. Start by adding a gift card!
              </p>
            </div>
          )}
        </div>

        {/* AI Match Suggestions — 1 column */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                AI Matches
              </h2>
            </div>
          </div>
          {matches.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="p-4 sm:px-6 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                      <ArrowLeftRight size={16} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {match.your_card_brand} &#8644; {match.their_card_brand}
                      </div>
                      <div className="text-xs text-gray-400">
                        with {match.user_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Value: ${Number(match.their_card_value || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${(match.match_score || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-primary-600">
                        {Math.round((match.match_score || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Sparkles size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                No matches yet. Add gift cards to get AI-powered swap suggestions!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/add-gift-card"
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 transition-all"
        >
          <PlusCircle size={24} className="mb-3 text-primary-200" />
          <h3 className="text-lg font-bold mb-1">Add Gift Card</h3>
          <p className="text-primary-100 text-sm">
            Upload your unused gift cards and start trading or selling
          </p>
        </Link>
        <Link
          href="/dashboard/marketplace"
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all"
        >
          <Store size={24} className="mb-3 text-blue-200" />
          <h3 className="text-lg font-bold mb-1">Browse Marketplace</h3>
          <p className="text-blue-100 text-sm">
            Find great deals on gift cards from other users
          </p>
        </Link>
      </div>
    </div>
  );
}
