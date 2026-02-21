"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Clock,
  Star,
  ArrowUpDown,
  X,
  SlidersHorizontal,
  BadgeCheck,
  ShoppingCart,
  ArrowRightLeft,
  Store,
  Loader2,
  CreditCard,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Types ───────── */
interface GiftCard {
  id: number;
  brand: string;
  category: string;
  value: number;
  selling_price: number | null;
  discount_percent: number | null;
  expiry_date: string;
  listing_type: "sell" | "swap" | "both";
  seller_name: string;
  seller_rating: number;
  seller_verified: boolean;
  seller_trades: number;
}

/* ───────── Constants ───────── */
const BRANDS = ["All Brands", "Amazon", "Apple", "Best Buy", "Chipotle", "Costco", "McDonald's", "Nike", "Starbucks", "Target", "Walmart"];
const LISTING_TYPES = ["All Types", "Sell", "Swap", "Both"];
const SORT_OPTIONS = ["Newest First", "Price: Low to High", "Price: High to Low", "Expiring Soon", "Most Popular"];

/* ───────── Gift Card Card ───────── */
function GiftCardCard({ card }: { card: GiftCard }) {
  const router = useRouter();
  const daysUntilExpiry = card.expiry_date
    ? Math.ceil((new Date(card.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isUrgent = daysUntilExpiry !== null && daysUntilExpiry <= 5;

  const handleBuy = async () => {
    try {
      const res = await apiCall("sales/", {
        method: "POST",
        body: JSON.stringify({ gift_card_id: card.id }),
      });
      if (res.ok) {
        const data = await res.json();
        // Create Stripe checkout session for payment
        const payRes = await apiCall(`payments/sale/${data.sale_id}/checkout/`, {
          method: "POST",
        });
        if (payRes.ok) {
          const payData = await payRes.json();
          if (payData.checkout_url) {
            window.location.href = payData.checkout_url;
            return;
          }
        }
        // Fallback: redirect to transactions if payment not available
        router.push(`/dashboard/transactions`);
      } else {
        const data = await res.json().catch(() => null);
        const msg = data?.detail || data?.non_field_errors?.[0] || data?.gift_card_id?.[0] || data?.gift_card?.[0] || "Failed to complete purchase.";
        alert(msg);
      }
    } catch {
      alert("Something went wrong.");
    }
  };

  const handleSwap = () => {
    router.push(`/dashboard/trades/propose?target=${card.id}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 flex flex-col h-full hover:shadow-md hover:-translate-y-0.5 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
            {card.brand?.charAt(0) || "G"}
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{card.brand}</div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1">
              ${Number(card.value || 0).toFixed(2)} Gift Card
            </h3>
          </div>
        </div>
        <span
          className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${
            card.listing_type === "sell"
              ? "bg-primary-50 text-primary-600"
              : card.listing_type === "swap"
              ? "bg-blue-50 text-blue-600"
              : "bg-purple-50 text-purple-600"
          }`}
        >
          {card.listing_type === "both" ? "Swap/Sell" : card.listing_type.charAt(0).toUpperCase() + card.listing_type.slice(1)}
        </span>
      </div>

      {/* Value & Price */}
      <div className="flex items-end justify-between mb-4 pb-4 border-b border-gray-100">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Face Value</div>
          <div className="text-lg font-bold text-gray-900">${Number(card.value || 0).toFixed(2)}</div>
        </div>
        <div className="text-right">
          {card.selling_price ? (
            <>
              <div className="text-xs text-gray-400 mb-0.5">Price</div>
              <div className="text-lg font-bold text-primary-600">${Number(card.selling_price || 0).toFixed(2)}</div>
            </>
          ) : (
            <>
              <div className="text-xs text-gray-400 mb-0.5">Offer Type</div>
              <div className="text-lg font-bold text-blue-600">Swap</div>
            </>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
        <div className={`flex items-center gap-1 ${isUrgent ? "text-red-500 font-semibold" : ""}`}>
          <Clock size={14} />
          <span>
            {daysUntilExpiry !== null
              ? daysUntilExpiry > 0
                ? `${daysUntilExpiry} days left`
                : "Expired"
              : "No expiry"}
          </span>
        </div>
        {card.discount_percent && card.discount_percent > 0 && (
          <span className="px-2 py-0.5 bg-green-50 text-green-600 font-semibold rounded-md">
            {card.discount_percent}% off
          </span>
        )}
      </div>

      {/* Seller */}
      <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-xl">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
          {card.seller_name?.charAt(0) || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-700 truncate">{card.seller_name}</span>
            {card.seller_verified && <BadgeCheck size={14} className="text-primary-500 shrink-0" />}
          </div>
          <div className="text-[10px] text-gray-400">{card.seller_trades} trades</div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Star size={12} className="text-accent-400 fill-accent-400" />
          <span className="text-xs font-semibold text-gray-600">{Number(card.seller_rating || 0).toFixed(1)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2">
        {card.listing_type === "sell" ? (
          <button
            onClick={handleBuy}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm group-hover:shadow-md"
          >
            <ShoppingCart size={16} />
            Buy Now
          </button>
        ) : card.listing_type === "swap" ? (
          <button
            onClick={handleSwap}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm group-hover:shadow-md"
          >
            <ArrowRightLeft size={16} />
            Propose Swap
          </button>
        ) : (
          <>
            <button
              onClick={handleBuy}
              className="flex items-center justify-center gap-2 flex-1 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm"
            >
              <ShoppingCart size={16} />
              Buy
            </button>
            <button
              onClick={handleSwap}
              className="flex items-center justify-center gap-2 flex-1 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
            >
              <ArrowRightLeft size={16} />
              Swap
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────── Page ───────── */
export default function DashboardMarketplacePage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All Brands");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedSort, setSelectedSort] = useState("Newest First");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        const res = await apiCall("marketplace/");
        if (res.ok) {
          const data = await res.json();
          const raw = Array.isArray(data) ? data : data.results || [];
          // Normalize: API returns brand as object and owner as string
          const cardList = raw.map((c: Record<string, unknown>) => ({
            ...c,
            brand: typeof c.brand === "object" && c.brand !== null ? (c.brand as { name: string }).name : c.brand,
            category: typeof c.brand === "object" && c.brand !== null ? (c.brand as { category?: string }).category || "" : "",
            seller_name: (c.seller_name || c.owner || "Unknown") as string,
            seller_rating: typeof c.seller_rating === "number" ? c.seller_rating : 0,
            seller_verified: !!c.seller_verified,
            seller_trades: typeof c.seller_trades === "number" ? c.seller_trades : 0,
            value: parseFloat(String(c.value || 0)),
            selling_price: c.selling_price ? parseFloat(String(c.selling_price)) : null,
            discount_percent: c.selling_price && c.value
              ? Math.round((1 - parseFloat(String(c.selling_price)) / parseFloat(String(c.value))) * 100)
              : null,
          }));
          setCards(cardList);
        }
      } catch {
        // silently fail, cards will be empty
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  const filteredCards = cards.filter((c) => {
    const matchBrand = selectedBrand === "All Brands" || c.brand === selectedBrand;
    const matchType =
      selectedType === "All Types" ||
      c.listing_type === selectedType.toLowerCase();
    const matchSearch =
      searchQuery === "" ||
      c.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBrand && matchType && matchSearch;
  });

  const activeFilters = [
    selectedBrand !== "All Brands" ? selectedBrand : null,
    selectedType !== "All Types" ? selectedType : null,
  ].filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary-600 animate-spin" />
          <span className="text-sm text-gray-500">Loading marketplace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Marketplace</h1>
        <p className="text-gray-500 mt-1">Browse and buy gift cards from other users</p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search gift cards by brand..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm transition-all placeholder:text-gray-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

          <div className="hidden sm:flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                {BRANDS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Store size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                {LISTING_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{filteredCards.length}</span> results
        </span>
      </div>

      {/* Mobile Filter Panel */}
      {showFilters && (
        <div className="sm:hidden bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {BRANDS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {LISTING_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Sort By</label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Filters:</span>
          {activeFilters.map((f) => (
            <button
              key={f}
              onClick={() => {
                if (BRANDS.includes(f!)) setSelectedBrand("All Brands");
                else setSelectedType("All Types");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
            >
              {f}
              <X size={12} />
            </button>
          ))}
          <button
            onClick={() => {
              setSelectedBrand("All Brands");
              setSelectedType("All Types");
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredCards.map((card) => (
            <GiftCardCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No gift cards found</h3>
          <p className="text-gray-500 text-sm mb-6">
            {cards.length === 0
              ? "The marketplace is empty right now. Check back soon!"
              : "Try adjusting your filters or search terms."}
          </p>
          {activeFilters.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedBrand("All Brands");
                setSelectedType("All Types");
              }}
              className="btn-secondary text-sm"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
