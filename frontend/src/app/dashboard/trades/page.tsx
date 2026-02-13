"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Types ───────── */
type TradeStatus =
  | "proposed"
  | "accepted"
  | "in_escrow"
  | "codes_released"
  | "confirming"
  | "completed"
  | "cancelled"
  | "disputed";

interface Trade {
  id: string;
  counterparty: { username: string; id: string };
  initiator_card: {
    id: string;
    brand: string;
    value: number;
  };
  responder_card: {
    id: string;
    brand: string;
    value: number;
  };
  status: TradeStatus;
  platform_fee: number;
  created_at: string;
  is_initiator: boolean;
}

/* ───────── Status Config ───────── */
const statusConfig: Record<
  TradeStatus,
  { label: string; cls: string; dotCls: string }
> = {
  proposed: {
    label: "Proposed",
    cls: "bg-blue-50 text-blue-600",
    dotCls: "bg-blue-500",
  },
  accepted: {
    label: "Accepted",
    cls: "bg-blue-50 text-blue-600",
    dotCls: "bg-blue-500",
  },
  in_escrow: {
    label: "In Escrow",
    cls: "bg-yellow-50 text-yellow-700",
    dotCls: "bg-yellow-500",
  },
  codes_released: {
    label: "Codes Released",
    cls: "bg-yellow-50 text-yellow-700",
    dotCls: "bg-yellow-500",
  },
  confirming: {
    label: "Confirming",
    cls: "bg-orange-50 text-orange-600",
    dotCls: "bg-orange-500",
  },
  completed: {
    label: "Completed",
    cls: "bg-green-50 text-green-600",
    dotCls: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-red-50 text-red-600",
    dotCls: "bg-red-500",
  },
  disputed: {
    label: "Disputed",
    cls: "bg-red-50 text-red-600",
    dotCls: "bg-red-500",
  },
};

type FilterStatus = "all" | TradeStatus;

/* ───────── Page Component ───────── */
export default function TradesPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const res = await apiCall("trades/");
        if (!res.ok) throw new Error("Failed to fetch trades");
        const data = await res.json();
        setTrades(Array.isArray(data) ? data : data.results ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, []);

  const filtered = trades.filter((t) => {
    const matchFilter = filter === "all" || t.status === filter;
    const matchSearch =
      search === "" ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.counterparty.username.toLowerCase().includes(search.toLowerCase()) ||
      t.initiator_card.brand.toLowerCase().includes(search.toLowerCase()) ||
      t.responder_card.brand.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusFilters: FilterStatus[] = [
    "all",
    "proposed",
    "accepted",
    "in_escrow",
    "codes_released",
    "confirming",
    "completed",
    "cancelled",
    "disputed",
  ];

  const countForFilter = (f: FilterStatus) =>
    f === "all" ? trades.length : trades.filter((t) => t.status === f).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Trades
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your gift card swaps and trade offers
          </p>
        </div>
        <Link
          href="/dashboard/trades/propose"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow-md shrink-0"
        >
          <Plus size={18} />
          Propose New Swap
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Active",
            count: trades.filter((t) =>
              ["proposed", "accepted", "in_escrow", "codes_released", "confirming"].includes(t.status)
            ).length,
            icon: Clock,
            cls: "text-blue-600 bg-blue-50",
          },
          {
            label: "In Escrow",
            count: trades.filter((t) =>
              ["in_escrow", "codes_released"].includes(t.status)
            ).length,
            icon: Shield,
            cls: "text-yellow-600 bg-yellow-50",
          },
          {
            label: "Completed",
            count: trades.filter((t) => t.status === "completed").length,
            icon: CheckCircle2,
            cls: "text-green-600 bg-green-50",
          },
          {
            label: "Disputed",
            count: trades.filter((t) =>
              ["cancelled", "disputed"].includes(t.status)
            ).length,
            icon: AlertTriangle,
            cls: "text-red-600 bg-red-50",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.cls}`}
            >
              <item.icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {item.count}
              </div>
              <div className="text-xs text-gray-500">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? "bg-primary-50 text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "all"
                ? "All"
                : f
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
              <span
                className={`ml-1 text-xs ${
                  filter === f ? "text-primary-500" : "text-gray-400"
                }`}
              >
                {countForFilter(f)}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trades..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-primary-500 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Loading your trades...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <XCircle size={36} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Failed to Load Trades
          </h3>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      )}

      {/* Trades List */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Table Header (desktop) */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-2">Trade ID</div>
            <div className="col-span-2">Counterparty</div>
            <div className="col-span-3">Cards</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Fee</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {filtered.map((trade) => {
              const sc = statusConfig[trade.status];
              const myCard = trade.is_initiator
                ? trade.initiator_card
                : trade.responder_card;
              const theirCard = trade.is_initiator
                ? trade.responder_card
                : trade.initiator_card;

              return (
                <div
                  key={trade.id}
                  onClick={() =>
                    router.push(`/dashboard/trades/${trade.id}`)
                  }
                  className="sm:grid sm:grid-cols-12 gap-4 px-5 sm:px-6 py-4 sm:py-3 hover:bg-gray-50/50 transition-colors cursor-pointer items-center"
                >
                  {/* Trade ID */}
                  <div className="col-span-2 mb-2 sm:mb-0">
                    <span className="text-sm font-mono font-semibold text-gray-900">
                      #{trade.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* Counterparty */}
                  <div className="col-span-2 mb-2 sm:mb-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
                        {trade.counterparty.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700 truncate">
                        {trade.counterparty.username}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="col-span-3 mb-2 sm:mb-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-900 truncate">
                        {myCard.brand} ${myCard.value}
                      </span>
                      <ArrowRight size={14} className="text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-600 truncate">
                        {theirCard.brand} ${theirCard.value}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 mb-2 sm:mb-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.cls}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${sc.dotCls}`}
                      />
                      {sc.label}
                    </span>
                  </div>

                  {/* Fee */}
                  <div className="col-span-1 mb-2 sm:mb-0">
                    <span className="text-sm text-gray-600">
                      ${trade.platform_fee?.toFixed(2) ?? "0.00"}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="col-span-1 mb-2 sm:mb-0">
                    <span className="text-xs text-gray-500">
                      {new Date(trade.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="col-span-1 hidden sm:flex justify-end">
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {search || filter !== "all"
              ? "No trades match your filters"
              : "No trades yet"}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {search || filter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Start by browsing the marketplace and proposing a swap!"}
          </p>
          {!search && filter === "all" && (
            <Link
              href="/dashboard/marketplace"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all"
            >
              Browse Marketplace
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
