"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  ShoppingCart,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  ChevronRight,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Types ───────── */
type SaleStatus = "pending" | "accepted" | "completed" | "cancelled";

interface Sale {
  id: string;
  card: {
    id: string;
    brand: string;
    value: number;
  };
  role: "buyer" | "seller";
  amount: number;
  platform_fee: number;
  status: SaleStatus;
  created_at: string;
}

/* ───────── Status Config ───────── */
const statusConfig: Record<
  SaleStatus,
  { label: string; cls: string; dotCls: string }
> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-600",
    dotCls: "bg-amber-500",
  },
  accepted: {
    label: "Accepted",
    cls: "bg-blue-50 text-blue-600",
    dotCls: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    cls: "bg-green-50 text-green-600",
    dotCls: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-gray-100 text-gray-500",
    dotCls: "bg-gray-400",
  },
};

type FilterStatus = "all" | SaleStatus;

/* ───────── Page Component ───────── */
export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const res = await apiCall("sales/");
        if (!res.ok) throw new Error("Failed to fetch sales");
        const data = await res.json();
        setSales(Array.isArray(data) ? data : data.results ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const filtered = sales.filter((s) => {
    const matchFilter = filter === "all" || s.status === filter;
    const matchSearch =
      search === "" ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.card.brand.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filterTabs: FilterStatus[] = [
    "all",
    "pending",
    "accepted",
    "completed",
    "cancelled",
  ];

  const countForFilter = (f: FilterStatus) =>
    f === "all" ? sales.length : sales.filter((s) => s.status === f).length;

  const totalEarnings = sales
    .filter((s) => s.role === "seller" && s.status === "completed")
    .reduce((acc, s) => acc + s.amount, 0);

  const totalSpent = sales
    .filter((s) => s.role === "buyer" && s.status === "completed")
    .reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Sales & Purchases
        </h1>
        <p className="text-gray-500 mt-1">
          Track your gift card sales and purchases
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Sales",
            count: sales.filter((s) => s.role === "seller").length,
            icon: Tag,
            cls: "text-primary-600 bg-primary-50",
          },
          {
            label: "Total Purchases",
            count: sales.filter((s) => s.role === "buyer").length,
            icon: ShoppingCart,
            cls: "text-blue-600 bg-blue-50",
          },
          {
            label: "Earnings",
            count: `$${totalEarnings.toFixed(2)}`,
            icon: ArrowDownLeft,
            cls: "text-green-600 bg-green-50",
          },
          {
            label: "Spent",
            count: `$${totalSpent.toFixed(2)}`,
            icon: ArrowUpRight,
            cls: "text-amber-600 bg-amber-50",
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
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {item.count}
              </div>
              <div className="text-xs text-gray-500">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto w-full sm:w-auto">
          {filterTabs.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? "bg-primary-50 text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
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

        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sales..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-primary-500 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Loading your sales...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <XCircle size={36} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Failed to Load Sales
          </h3>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      )}

      {/* Sales List */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Table Header (desktop) */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-2">Sale ID</div>
            <div className="col-span-3">Card</div>
            <div className="col-span-1">Role</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1">Fee</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Date</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {filtered.map((sale) => {
              const sc = statusConfig[sale.status];
              return (
                <div
                  key={sale.id}
                  onClick={() => router.push(`/dashboard/sales/${sale.id}`)}
                  className="sm:grid sm:grid-cols-12 gap-4 px-5 sm:px-6 py-4 sm:py-3 hover:bg-gray-50/50 transition-colors cursor-pointer items-center"
                >
                  {/* Sale ID */}
                  <div className="col-span-2 mb-2 sm:mb-0">
                    <span className="text-sm font-mono font-semibold text-gray-900">
                      #{sale.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* Card */}
                  <div className="col-span-3 mb-2 sm:mb-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-xs">
                        {sale.card.brand.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {sale.card.brand}
                        </div>
                        <div className="text-xs text-gray-400">
                          ${sale.card.value.toFixed(2)} value
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-1 mb-2 sm:mb-0">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                        sale.role === "buyer"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {sale.role === "buyer" ? (
                        <ShoppingCart size={10} />
                      ) : (
                        <Tag size={10} />
                      )}
                      {sale.role.charAt(0).toUpperCase() + sale.role.slice(1)}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 mb-2 sm:mb-0">
                    <span
                      className={`text-sm font-bold ${
                        sale.role === "seller"
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      {sale.role === "seller" ? "+" : "-"}$
                      {sale.amount.toFixed(2)}
                    </span>
                  </div>

                  {/* Fee */}
                  <div className="col-span-1 mb-2 sm:mb-0">
                    <span className="text-sm text-gray-600">
                      ${sale.platform_fee?.toFixed(2) ?? "0.00"}
                    </span>
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

                  {/* Date */}
                  <div className="col-span-1 flex items-center justify-between sm:justify-start">
                    <span className="text-xs text-gray-500">
                      {new Date(sale.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 sm:hidden"
                    />
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
            <DollarSign size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {search || filter !== "all"
              ? "No sales match your filters"
              : "No sales or purchases yet"}
          </h3>
          <p className="text-gray-500 text-sm">
            {search || filter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Browse the marketplace to buy gift cards, or list your cards for sale!"}
          </p>
        </div>
      )}
    </div>
  );
}
