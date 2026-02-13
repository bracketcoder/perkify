"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Clock,
  Edit3,
  Trash2,
  PlusCircle,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Tag,
  DollarSign,
  ArrowLeftRight,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Types ───────── */
interface GiftCard {
  id: number;
  brand: string;
  value: number;
  selling_price: number | null;
  listing_type: "swap" | "sell" | "both";
  status: "active" | "pending" | "sold" | "traded" | "expired" | "inactive";
  expiry_date: string;
  card_number: string;
  created_at: string;
  image?: string;
}

/* ───────── Status Config ───────── */
const statusConfig: Record<string, { label: string; cls: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  active: { label: "Active", cls: "bg-green-50 text-green-600", icon: CheckCircle2 },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-600", icon: Clock },
  sold: { label: "Sold", cls: "bg-blue-50 text-blue-600", icon: DollarSign },
  traded: { label: "Traded", cls: "bg-purple-50 text-purple-600", icon: ArrowLeftRight },
  expired: { label: "Expired", cls: "bg-red-50 text-red-600", icon: XCircle },
  inactive: { label: "Inactive", cls: "bg-gray-100 text-gray-500", icon: XCircle },
};

const listingTypeConfig: Record<string, { label: string; cls: string }> = {
  swap: { label: "Swap", cls: "bg-blue-50 text-blue-600" },
  sell: { label: "Sell", cls: "bg-primary-50 text-primary-600" },
  both: { label: "Swap & Sell", cls: "bg-purple-50 text-purple-600" },
};

/* ───────── Page ───────── */
export default function MyGiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [listingFilter, setListingFilter] = useState("all");
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const res = await apiCall("gift-cards/");
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : data.results || [];
        // Normalize: API returns brand as object {id, name, ...}, flatten to name string
        const cardList = raw.map((c: Record<string, unknown>) => ({
          ...c,
          brand: typeof c.brand === "object" && c.brand !== null ? (c.brand as { name: string }).name : c.brand,
        }));
        setCards(cardList);
      } else {
        setError("Failed to load your gift cards");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this gift card?")) return;
    try {
      setDeleting(id);
      const res = await apiCall(`gift-cards/${id}/`, { method: "DELETE" });
      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert("Failed to delete gift card");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = cards.filter((card) => {
    const matchSearch =
      search === "" ||
      card.brand?.toLowerCase().includes(search.toLowerCase()) ||
      card.card_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || card.status === statusFilter;
    const matchListing = listingFilter === "all" || card.listing_type === listingFilter;
    return matchSearch && matchStatus && matchListing;
  });

  const statusCounts = {
    all: cards.length,
    active: cards.filter((c) => c.status === "active").length,
    pending: cards.filter((c) => c.status === "pending").length,
    sold: cards.filter((c) => c.status === "sold").length,
    traded: cards.filter((c) => c.status === "traded").length,
    expired: cards.filter((c) => c.status === "expired").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary-600 animate-spin" />
          <span className="text-sm text-gray-500">Loading your gift cards...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Gift Cards</h1>
          <p className="text-gray-500 mt-1">Manage your gift card inventory</p>
        </div>
        <Link
          href="/dashboard/add-gift-card"
          className="btn-primary text-sm w-fit"
        >
          <PlusCircle size={18} className="mr-2" />
          Add Gift Card
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(
          [
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "pending", label: "Pending" },
            { key: "sold", label: "Sold" },
            { key: "traded", label: "Traded" },
            { key: "expired", label: "Expired" },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            className={`bg-white rounded-xl border p-3 text-center transition-all ${
              statusFilter === item.key
                ? "border-primary-300 bg-primary-50/50 shadow-sm"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="text-xl font-bold text-gray-900">{statusCounts[item.key]}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brand or card number..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-400"
          />
        </div>
        <select
          value={listingFilter}
          onChange={(e) => setListingFilter(e.target.value)}
          className="appearance-none px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="swap">Swap Only</option>
          <option value="sell">Sell Only</option>
          <option value="both">Swap & Sell</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchCards} className="ml-auto text-sm font-medium text-red-600 hover:text-red-700">
            Retry
          </button>
        </div>
      )}

      {/* Gift Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((card) => {
            const sc = statusConfig[card.status] || statusConfig.inactive;
            const lt = listingTypeConfig[card.listing_type] || listingTypeConfig.both;
            const daysUntilExpiry = card.expiry_date
              ? Math.ceil((new Date(card.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;

            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:shadow-md transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
                      {card.brand?.charAt(0) || "G"}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{card.brand}</h3>
                      <div className="text-xs text-gray-400">
                        {card.card_number ? `****${card.card_number.slice(-4)}` : "No number"}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.cls}`}>
                    <sc.icon size={12} />
                    {sc.label}
                  </span>
                </div>

                {/* Value & Listing */}
                <div className="flex items-end justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Card Value</div>
                    <div className="text-lg font-bold text-gray-900">${parseFloat(String(card.value || 0)).toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    {card.selling_price ? (
                      <>
                        <div className="text-xs text-gray-400 mb-0.5">Selling Price</div>
                        <div className="text-lg font-bold text-primary-600">${parseFloat(String(card.selling_price || 0)).toFixed(2)}</div>
                      </>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${lt.cls}`}>
                        {lt.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between mb-4 text-xs">
                  <span className={`px-2.5 py-1 rounded-lg font-semibold ${lt.cls}`}>
                    {lt.label}
                  </span>
                  {daysUntilExpiry !== null && (
                    <div
                      className={`flex items-center gap-1 ${
                        isExpiringSoon ? "text-red-500 font-semibold" : "text-gray-500"
                      }`}
                    >
                      <Clock size={12} />
                      {daysUntilExpiry > 0
                        ? `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""} left`
                        : "Expired"}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {(card.status === "active" || card.status === "pending") && (
                  <div className="flex items-center gap-2 mt-auto">
                    <Link
                      href={`/dashboard/add-gift-card?edit=${card.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <Edit3 size={14} />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(card.id)}
                      disabled={deleting === card.id}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deleting === card.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {cards.length === 0 ? "No gift cards yet" : "No matching cards"}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {cards.length === 0
              ? "Add your first gift card to start trading and selling."
              : "Try adjusting your search or filters."}
          </p>
          {cards.length === 0 && (
            <Link href="/dashboard/add-gift-card" className="btn-primary text-sm">
              <PlusCircle size={16} className="mr-2" />
              Add Gift Card
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
