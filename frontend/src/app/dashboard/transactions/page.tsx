"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Loader2,
  BadgeCheck,
  Star,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Types ───────── */
type TabFilter = "all" | "trade" | "sale";
type StatusFilter = "all" | "pending" | "accepted" | "completed" | "cancelled";

interface Transaction {
  id: number | string;
  type: "trade" | "sale" | "purchase";
  title: string;
  brand: string;
  value: number;
  amount: string;
  counterparty_name: string;
  counterparty_verified: boolean;
  counterparty_rating: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
  card_code?: string;
}

/* ───────── Status Config ───────── */
const statusConfig = {
  pending: { label: "Pending", icon: Clock, cls: "bg-amber-50 text-amber-600" },
  accepted: { label: "Accepted", icon: CheckCircle2, cls: "bg-blue-50 text-blue-600" },
  completed: { label: "Completed", icon: CheckCircle2, cls: "bg-green-50 text-green-600" },
  cancelled: { label: "Cancelled", icon: XCircle, cls: "bg-gray-100 text-gray-500" },
};

/* ───────── Code Reveal ───────── */
function CodeReveal({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-green-600 font-semibold uppercase tracking-wide mb-0.5">
          Card Code
        </div>
        <div className="text-sm font-mono font-bold text-green-800 tracking-wider">
          {revealed ? code : "****-****-****"}
        </div>
      </div>
      <button
        onClick={() => setRevealed(!revealed)}
        className="p-2 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
        title={revealed ? "Hide code" : "Reveal code"}
      >
        {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      {revealed && (
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      )}
    </div>
  );
}

/* ───────── Transaction Card ───────── */
function TransactionCard({ tx }: { tx: Transaction }) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusConfig[tx.status] || statusConfig.pending;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
      {/* Main Row */}
      <div
        className="p-5 sm:p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
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
            <div>
              <div className="text-sm font-semibold text-gray-900">{tx.title}</div>
              <div className="text-xs text-gray-400">
                {tx.brand} · #{typeof tx.id === "number" ? `TXN-${String(tx.id).padStart(3, "0")}` : tx.id}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.cls}`}>
              <sc.icon size={12} />
              {sc.label}
            </span>
            {expanded ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-gray-400">Value</div>
            <div className="text-sm font-bold text-gray-900">${Number(tx.value || 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Amount</div>
            <div
              className={`text-sm font-bold ${
                tx.amount?.startsWith("+")
                  ? "text-green-600"
                  : tx.amount?.startsWith("-")
                  ? "text-gray-900"
                  : "text-blue-600"
              }`}
            >
              {tx.amount || "Swap"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Date</div>
            <div className="text-sm text-gray-700">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Type</div>
            <div className="text-sm text-gray-700 capitalize">{tx.type}</div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-gray-100 pt-4">
          {/* Counterparty */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
                {tx.counterparty_name?.charAt(0) || "U"}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-700">
                    {tx.counterparty_name}
                  </span>
                  {tx.counterparty_verified && (
                    <BadgeCheck size={14} className="text-primary-500" />
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <Star size={10} className="text-accent-400 fill-accent-400" />
                  <span className="text-[10px] text-gray-500">
                    {Number(tx.counterparty_rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {tx.status === "pending" && (
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  Cancel
                </button>
                <button className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                  Confirm
                </button>
              </div>
            )}
            {tx.status === "accepted" && (
              <button className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                Mark Complete
              </button>
            )}
          </div>

          {/* Card Code (only for completed) */}
          {tx.status === "completed" && tx.card_code && (
            <CodeReveal code={tx.card_code} />
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── Page ───────── */
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeTab, setTypeTab] = useState<TabFilter>("all");
  const [statusTab, setStatusTab] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const [tradesRes, salesRes] = await Promise.allSettled([
          apiCall("trades/"),
          apiCall("sales/"),
        ]);

        let allTransactions: Transaction[] = [];

        if (tradesRes.status === "fulfilled" && tradesRes.value.ok) {
          const data = await tradesRes.value.json();
          const trades = Array.isArray(data) ? data : data.results || [];
          allTransactions = [
            ...allTransactions,
            ...trades.map((t: Record<string, unknown>) => {
              const ic = t.initiator_card as Record<string, unknown> || {};
              const rc = t.responder_card as Record<string, unknown> || {};
              const isInitiator = t.is_initiator === true;
              const otherCard = isInitiator ? rc : ic;
              const cp = t.counterparty as Record<string, unknown> | undefined;
              const counterparty = cp ? String(cp.username || "Unknown") : (isInitiator ? String(t.responder || "Unknown") : String(t.initiator || "Unknown"));
              return {
                id: t.trade_id || t.id || "",
                type: "trade" as const,
                title: `Swap: ${ic.brand || ic.brand_name || "Card"} ↔ ${rc.brand || rc.brand_name || "Card"}`,
                brand: String(otherCard.brand || otherCard.brand_name || "Unknown"),
                value: parseFloat(String(ic.value || 0)) + parseFloat(String(rc.value || 0)),
                amount: "Swap",
                counterparty_name: counterparty,
                counterparty_verified: false,
                counterparty_rating: 0,
                status: (t.status || "pending") as Transaction["status"],
                created_at: String(t.created_at || ""),
              };
            }),
          ];
        }

        if (salesRes.status === "fulfilled" && salesRes.value.ok) {
          const data = await salesRes.value.json();
          const sales = Array.isArray(data) ? data : data.results || [];
          allTransactions = [
            ...allTransactions,
            ...sales.map((s: Record<string, unknown>) => {
              const gc = s.gift_card as Record<string, unknown> || {};
              const isBuyer = s.role === "buyer";
              return {
                id: s.sale_id || s.id || "",
                type: (isBuyer ? "purchase" : "sale") as Transaction["type"],
                title: `${isBuyer ? "Bought" : "Sold"}: ${gc.brand || gc.brand_name || "Gift Card"}`,
                brand: String(gc.brand || gc.brand_name || "Unknown"),
                value: parseFloat(String(gc.value || 0)),
                amount: String(parseFloat(String(s.amount || 0)).toFixed(2)),
                counterparty_name: String(isBuyer ? s.seller : s.buyer) || "Unknown",
                counterparty_verified: false,
                counterparty_rating: 0,
                status: (s.status || "pending") as Transaction["status"],
                created_at: String(s.created_at || ""),
              };
            }),
          ];
        }

        // Sort by created_at descending
        allTransactions.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });

        setTransactions(allTransactions);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filtered = transactions.filter((tx) => {
    const matchType = typeTab === "all" || tx.type === typeTab || (typeTab === "sale" && tx.type === "purchase");
    const matchStatus = statusTab === "all" || tx.status === statusTab;
    const matchSearch =
      search === "" ||
      tx.title?.toLowerCase().includes(search.toLowerCase()) ||
      tx.counterparty_name?.toLowerCase().includes(search.toLowerCase()) ||
      String(tx.id).toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  const statusCounts = {
    all: transactions.length,
    pending: transactions.filter((t) => t.status === "pending").length,
    accepted: transactions.filter((t) => t.status === "accepted").length,
    completed: transactions.filter((t) => t.status === "completed").length,
    cancelled: transactions.filter((t) => t.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary-600 animate-spin" />
          <span className="text-sm text-gray-500">Loading transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">Track your trades and sales history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending", count: statusCounts.pending, icon: Clock, cls: "text-amber-600 bg-amber-50" },
          { label: "Accepted", count: statusCounts.accepted, icon: CheckCircle2, cls: "text-blue-600 bg-blue-50" },
          { label: "Completed", count: statusCounts.completed, icon: CheckCircle2, cls: "text-green-600 bg-green-50" },
          { label: "Cancelled", count: statusCounts.cancelled, icon: XCircle, cls: "text-gray-500 bg-gray-100" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.cls}`}>
              <item.icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{item.count}</div>
              <div className="text-xs text-gray-500">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Type Tabs & Status Tabs */}
      <div className="flex flex-col gap-4">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {(["all", "trade", "sale"] as TabFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                typeTab === t
                  ? "bg-primary-50 text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "all" ? "All" : t === "trade" ? "Trades" : "Sales"}
            </button>
          ))}
        </div>

        {/* Status & Search Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto w-full sm:w-auto">
            {(["all", "pending", "accepted", "completed", "cancelled"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusTab(s)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  statusTab === s
                    ? "bg-primary-50 text-primary-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span className={`ml-1 text-xs ${statusTab === s ? "text-primary-500" : "text-gray-400"}`}>
                  {statusCounts[s]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Transaction Cards */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((tx) => (
            <TransactionCard key={`${tx.type}-${tx.id}`} tx={tx} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-500 text-sm">
            {search
              ? "Try adjusting your search"
              : transactions.length === 0
              ? "You haven't made any transactions yet"
              : "No transactions match your current filters"}
          </p>
        </div>
      )}
    </div>
  );
}
