"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeftRight,
  Star,
  DollarSign,
  TrendingUp,
  Loader2,
  XCircle,
  RefreshCw,
  BadgeCheck,
  Zap,
  ChevronRight,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Types ───────── */
interface MatchCard {
  id: string;
  brand: string;
  value: number;
  owner: {
    id: string;
    username: string;
    reputation: number;
    verified: boolean;
  };
}

interface Match {
  id: string;
  suggested_card: MatchCard;
  user_card: {
    id: string;
    brand: string;
    value: number;
  };
  match_score: number;
  value_difference: number;
  estimated_fee: number;
}

/* ───────── Match Score Bar ───────── */
function MatchScoreBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 90
      ? "bg-green-500"
      : percentage >= 70
      ? "bg-primary-500"
      : percentage >= 50
      ? "bg-yellow-500"
      : "bg-orange-500";
  const labelColor =
    percentage >= 90
      ? "text-green-600"
      : percentage >= 70
      ? "text-primary-600"
      : percentage >= 50
      ? "text-yellow-600"
      : "text-orange-600";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500 font-medium">Match Score</span>
        <span className={`text-xs font-bold ${labelColor}`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/* ───────── Reputation Stars ───────── */
function ReputationStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          size={12}
          className="text-accent-400 fill-accent-400"
        />
      ))}
      {hasHalf && (
        <div className="relative">
          <Star size={12} className="text-gray-200 fill-gray-200" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star size={12} className="text-accent-400 fill-accent-400" />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          size={12}
          className="text-gray-200 fill-gray-200"
        />
      ))}
      <span className="text-xs text-gray-500 font-semibold ml-1">
        {Number(rating || 0).toFixed(1)}
      </span>
    </div>
  );
}

/* ───────── Match Card Component ───────── */
function MatchCardComponent({ match }: { match: Match }) {
  const { suggested_card, user_card, match_score, value_difference, estimated_fee } =
    match;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
            {suggested_card.brand.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {suggested_card.brand}
            </h3>
            <div className="text-xs text-gray-400">
              ${Number(suggested_card.value || 0).toFixed(2)} value
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 rounded-lg">
          <Sparkles size={12} className="text-purple-500" />
          <span className="text-xs font-bold text-purple-600">
            {Math.round(match_score * 100)}%
          </span>
        </div>
      </div>

      {/* Match Score Bar */}
      <div className="mb-4">
        <MatchScoreBar score={match_score} />
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-100">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Value Difference</div>
          <div
            className={`text-sm font-bold ${
              value_difference === 0
                ? "text-green-600"
                : value_difference > 0
                ? "text-blue-600"
                : "text-amber-600"
            }`}
          >
            {value_difference === 0
              ? "Even Swap"
              : value_difference > 0
              ? `+$${Number(value_difference || 0).toFixed(2)}`
              : `-$${Math.abs(value_difference).toFixed(2)}`}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Est. Fee</div>
          <div className="text-sm font-bold text-gray-900">
            ${Number(estimated_fee || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Swap Preview */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl">
        <div className="flex-1 text-center">
          <div className="text-[10px] text-gray-400 uppercase font-medium">
            Your Card
          </div>
          <div className="text-xs font-semibold text-gray-700 truncate">
            {user_card.brand}
          </div>
          <div className="text-xs text-gray-500">
            ${Number(user_card.value || 0).toFixed(2)}
          </div>
        </div>
        <ArrowLeftRight size={16} className="text-gray-400 shrink-0" />
        <div className="flex-1 text-center">
          <div className="text-[10px] text-gray-400 uppercase font-medium">
            Their Card
          </div>
          <div className="text-xs font-semibold text-gray-700 truncate">
            {suggested_card.brand}
          </div>
          <div className="text-xs text-gray-500">
            ${Number(suggested_card.value || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Owner Info */}
      <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-xl">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
          {suggested_card.owner.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-700 truncate">
              {suggested_card.owner.username}
            </span>
            {suggested_card.owner.verified && (
              <BadgeCheck size={14} className="text-primary-500 shrink-0" />
            )}
          </div>
          <ReputationStars rating={suggested_card.owner.reputation} />
        </div>
      </div>

      {/* Action */}
      <Link
        href={`/dashboard/trades/propose?target=${suggested_card.id}&my_card=${user_card.id}`}
        className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm group-hover:shadow-md"
      >
        <ArrowLeftRight size={16} />
        Propose Swap
      </Link>
    </div>
  );
}

/* ───────── Page Component ───────── */
export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res = await apiCall("matches/");
      if (!res.ok) throw new Error("Failed to fetch matches");
      const data = await res.json();
      const raw = Array.isArray(data) ? data : data.results ?? [];
      // Normalize API response to match frontend Match interface
      const normalized: Match[] = raw.map((m: Record<string, unknown>, idx: number) => {
        const sc = m.suggested_card as Record<string, unknown> || {};
        const uc = m.user_card as Record<string, unknown> || {};
        const rep = m.owner_reputation as Record<string, unknown> || {};
        return {
          id: String(m.id || `match-${idx}`),
          suggested_card: {
            id: String(sc.id || ""),
            brand: String(sc.brand || "Unknown"),
            value: parseFloat(String(sc.value || 0)),
            owner: {
              id: "",
              username: String(sc.owner_username || "Unknown"),
              reputation: parseFloat(String(rep.trust_score || 0)) / 20,
              verified: !!rep.is_verified,
            },
          },
          user_card: {
            id: String(uc.id || ""),
            brand: String(uc.brand || "Unknown"),
            value: parseFloat(String(uc.value || 0)),
          },
          match_score: Number(m.match_score || 0) / 100, // API returns 0-100, component expects 0-1
          value_difference: parseFloat(String(m.value_difference || 0)),
          estimated_fee: parseFloat(String(m.estimated_fee || 0)),
        };
      });
      setMatches(normalized);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const topMatch = matches.length > 0 ? matches[0] : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={24} className="text-purple-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              AI Match Suggestions
            </h1>
          </div>
          <p className="text-gray-500 mt-1">
            Smart swap recommendations based on your card collection and
            preferences
          </p>
        </div>
        <button
          onClick={() => fetchMatches(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh Matches"}
        </button>
      </div>

      {/* Top Match Highlight */}
      {topMatch && !loading && (
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={18} className="text-purple-200" />
              <span className="text-xs font-bold uppercase tracking-wide text-purple-200">
                Top Match
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-1">
                  {topMatch.suggested_card.brand} Gift Card
                </h3>
                <p className="text-purple-100 text-sm">
                  ${Number(topMatch.suggested_card.value || 0).toFixed(2)} value &middot;{" "}
                  {Math.round(topMatch.match_score * 100)}% match score &middot;
                  Swap with your {topMatch.user_card.brand}
                </p>
              </div>
              <Link
                href={`/dashboard/trades/propose?target=${topMatch.suggested_card.id}&my_card=${topMatch.user_card.id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-purple-600 text-sm font-bold rounded-xl hover:bg-purple-50 transition-all shrink-0"
              >
                <ArrowLeftRight size={16} />
                Propose Swap
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {!loading && matches.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Sparkles size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {matches.length}
              </div>
              <div className="text-xs text-gray-500">Matches Found</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(
                  (matches.reduce((acc, m) => acc + m.match_score, 0) /
                    matches.length) *
                    100
                )}
                %
              </div>
              <div className="text-xs text-gray-500">Avg Score</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                $
                {matches
                  .reduce((acc, m) => acc + m.estimated_fee, 0)
                  .toFixed(0)}
              </div>
              <div className="text-xs text-gray-500">Total Est. Fees</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-4">
            <Loader2
              size={36}
              className="text-purple-500 animate-spin"
            />
            <Sparkles
              size={16}
              className="text-purple-400 absolute -top-1 -right-1"
            />
          </div>
          <p className="text-gray-500 text-sm">
            Finding the best matches for you...
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <XCircle size={36} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Failed to Load Matches
          </h3>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchMatches()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      )}

      {/* Matches Grid */}
      {!loading && !error && matches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            All Recommendations
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {matches.map((match) => (
              <MatchCardComponent key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && matches.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Matches Yet
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            We could not find any swap matches right now. Add more cards to your
            collection or check back later for new recommendations.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard/add-gift-card"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all"
            >
              Add Cards
            </Link>
            <Link
              href="/dashboard/marketplace"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
