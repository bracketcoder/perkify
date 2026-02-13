"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Lock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  CreditCard,
} from "lucide-react";

const API_BASE = "http://localhost:8000";

/* ───────── Types ───────── */
interface Brand {
  id: number;
  name: string;
  logo: string | null;
  category: string;
  is_popular: boolean;
}

interface GiftCard {
  id: number;
  brand: Brand;
  owner: string;
  value: string;
  selling_price: string | null;
  listing_type: "swap" | "sell";
  status: string;
  expiry_date: string | null;
  image: string | null;
  created_at: string;
}

interface MarketplaceResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GiftCard[];
}

/* ───────── Brand Filter Options ───────── */
const BRANDS = [
  "All Brands",
  "Amazon",
  "Walmart",
  "Target",
  "Starbucks",
  "Apple",
  "Nike",
  "Best Buy",
  "Sephora",
  "Netflix",
  "Visa",
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "swap", label: "Swap" },
  { value: "sell", label: "Sell" },
];

/* ───────── Gift Card Item ───────── */
function GiftCardCard({ card }: { card: GiftCard }) {
  const isSwap = card.listing_type === "swap";
  const value = parseFloat(card.value);
  const price = card.selling_price ? parseFloat(card.selling_price) : 0;
  const discount = !isSwap && price > 0 ? Math.round(((value - price) / value) * 100) : 0;
  const brandName = card.brand?.name || "Unknown";

  return (
    <div className="card-hover p-5 sm:p-6 flex flex-col h-full group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
            {brandName.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1">
              {brandName}
            </h3>
            <div className="text-xs text-gray-400 font-medium">Gift Card</div>
          </div>
        </div>
        <span
          className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${
            isSwap
              ? "bg-purple-50 text-purple-600"
              : "bg-primary-50 text-primary-600"
          }`}
        >
          {card.listing_type.charAt(0).toUpperCase() + card.listing_type.slice(1)}
        </span>
      </div>

      {/* Value & Price */}
      <div className="flex items-end justify-between mb-4 pb-4 border-b border-gray-100">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Card Value</div>
          <div className="text-lg font-bold text-gray-900">
            ${value.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-0.5">
            {isSwap ? "Type" : "Price"}
          </div>
          <div
            className={`text-lg font-bold ${
              isSwap ? "text-purple-600" : "text-primary-600"
            }`}
          >
            {isSwap ? "Swap" : `$${price.toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* Discount */}
      {!isSwap && discount > 0 && (
        <div className="mb-4">
          <span className="px-2 py-0.5 bg-green-50 text-green-600 font-semibold rounded-md text-xs">
            {discount}% off
          </span>
        </div>
      )}

      {/* Seller */}
      <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-xl">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
          {card.owner.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-gray-700 truncate">
            {card.owner}
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="mt-auto">
        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm group-hover:shadow-md"
        >
          <Lock size={14} />
          Login to {isSwap ? "Trade" : "Buy"}
        </Link>
      </div>
    </div>
  );
}

/* ───────── Page ───────── */
export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All Brands");
  const [selectedType, setSelectedType] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const ITEMS_PER_PAGE = 12;

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      // Use search param for brand name filtering (API search_fields = brand__name)
      const searchTerms = [searchQuery, selectedBrand !== "All Brands" ? selectedBrand : ""].filter(Boolean).join(" ");
      if (searchTerms) params.set("search", searchTerms);
      if (selectedType) params.set("listing_type", selectedType);
      if (minValue) params.set("min_value", minValue);
      if (maxValue) params.set("max_value", maxValue);

      const res = await fetch(
        `${API_BASE}/api/marketplace/?${params.toString()}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch marketplace data (${res.status})`);
      }

      const data: MarketplaceResponse = await res.json();
      setCards(data.results);
      setTotalCount(data.count);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedBrand, selectedType, minValue, maxValue]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCards();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("All Brands");
    setSelectedType("");
    setMinValue("");
    setMaxValue("");
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const activeFilters = [
    selectedBrand !== "All Brands" ? selectedBrand : null,
    selectedType ? selectedType : null,
    minValue ? `Min $${minValue}` : null,
    maxValue ? `Max $${maxValue}` : null,
  ].filter(Boolean);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container-main mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:pt-16 sm:pb-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3">
              Gift Card{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-300">
                Marketplace
              </span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto">
              Browse gift cards from top brands. Swap or buy at discounted
              prices with escrow protection.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by brand name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-base bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm transition-all placeholder:text-gray-400"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="container-main mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors sm:hidden"
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilters.length > 0 && (
                <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Brand Filter */}
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <CreditCard
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>

              {/* Min Value */}
              <input
                type="number"
                placeholder="Min $"
                value={minValue}
                onChange={(e) => {
                  setMinValue(e.target.value);
                  setPage(1);
                }}
                className="w-24 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400"
              />

              {/* Max Value */}
              <input
                type="number"
                placeholder="Max $"
                value={maxValue}
                onChange={(e) => {
                  setMaxValue(e.target.value);
                  setPage(1);
                }}
                className="w-24 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{totalCount}</span>{" "}
            gift cards found
          </div>
        </div>

        {/* Mobile Filter Panel */}
        {showFilters && (
          <div className="sm:hidden bg-white border border-gray-200 rounded-2xl p-5 mb-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Min Value
                </label>
                <input
                  type="number"
                  placeholder="$0"
                  value={minValue}
                  onChange={(e) => {
                    setMinValue(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                  Max Value
                </label>
                <input
                  type="number"
                  placeholder="$500"
                  value={maxValue}
                  onChange={(e) => {
                    setMaxValue(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Tags */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">
              Active filters:
            </span>
            {activeFilters.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium"
              >
                {f}
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={12} />
              Clear all
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="text-primary-500 animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading gift cards...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load
            </h3>
            <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
              {error}
            </p>
            <button onClick={fetchCards} className="btn-secondary text-sm">
              Try Again
            </button>
          </div>
        )}

        {/* Card Grid */}
        {!loading && !error && cards.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {cards.map((card) => (
                <GiftCardCard key={card.id} card={card} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrev}
                  className="flex items-center gap-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page{" "}
                  <span className="font-semibold text-gray-900">{page}</span> of{" "}
                  <span className="font-semibold text-gray-900">
                    {totalPages}
                  </span>
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNext}
                  className="flex items-center gap-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && cards.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No gift cards found
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Try adjusting your filters or search terms
            </p>
            <button onClick={clearFilters} className="btn-secondary text-sm">
              Clear All Filters
            </button>
          </div>
        )}

        {/* Login Prompt */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-br from-primary-50 to-accent-50/30 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
          <Lock size={32} className="text-primary-500 mx-auto mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            Want to Swap or Buy Gift Cards?
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create a free account to unlock full marketplace access, make
            offers, and start trading with escrow protection.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="btn-primary w-full sm:w-auto"
            >
              Create Free Account
            </Link>
            <Link
              href="/auth/login"
              className="btn-secondary w-full sm:w-auto"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
