"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Check,
  ChevronDown,
  Loader2,
  Search,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Types ───────── */
interface GiftCard {
  id: string;
  brand: string;
  value: number;
  listing_type: string;
  status: string;
  owner?: { id: string; username: string };
}

/* ───────── Step Indicator ───────── */
const steps = [
  { num: 1, label: "Select Your Card" },
  { num: 2, label: "Select Target Card" },
  { num: 3, label: "Review" },
  { num: 4, label: "Confirm" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 sm:gap-2 mb-8">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                current > step.num
                  ? "bg-primary-500 border-primary-500 text-white"
                  : current === step.num
                  ? "bg-white border-primary-500 text-primary-600 shadow-md shadow-primary-500/20"
                  : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              {current > step.num ? <Check size={16} /> : step.num}
            </div>
            <span
              className={`text-[10px] sm:text-xs font-medium mt-1.5 text-center max-w-[70px] leading-tight ${
                current >= step.num ? "text-primary-600" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 mt-[-18px] ${
                current > step.num ? "bg-primary-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ───────── Card Select Component ───────── */
function CardSelector({
  cards,
  selected,
  onSelect,
  loading,
  emptyMessage,
  searchPlaceholder,
}: {
  cards: GiftCard[];
  selected: GiftCard | null;
  onSelect: (card: GiftCard) => void;
  loading: boolean;
  emptyMessage: string;
  searchPlaceholder: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = cards.filter(
    (c) =>
      search === "" ||
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={28} className="text-primary-500 animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading cards...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <CreditCard size={28} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
          {filtered.map((card) => {
            const isSelected = selected?.id === card.id;
            return (
              <button
                key={card.id}
                onClick={() => onSelect(card)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 shadow-sm"
                    : "border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? "bg-primary-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {card.brand.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {card.brand}
                      </div>
                      {card.owner && (
                        <div className="text-xs text-gray-400">
                          {card.owner.username}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">Value</span>
                  <span className="text-base font-bold text-gray-900">
                    ${Number(card.value || 0).toFixed(2)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────── Inner Page (needs useSearchParams) ───────── */
function ProposeSwapInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetParam = searchParams.get("target");
  const myCardParam = searchParams.get("my_card");

  const [step, setStep] = useState(1);
  const [myCards, setMyCards] = useState<GiftCard[]>([]);
  const [targetCards, setTargetCards] = useState<GiftCard[]>([]);
  const [selectedMyCard, setSelectedMyCard] = useState<GiftCard | null>(null);
  const [selectedTargetCard, setSelectedTargetCard] =
    useState<GiftCard | null>(null);
  const [loadingMy, setLoadingMy] = useState(true);
  const [loadingTarget, setLoadingTarget] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Normalize a raw API card into the GiftCard shape expected by the UI
  const normalizeCard = (c: Record<string, unknown>): GiftCard => ({
    id: String(c.id || ""),
    brand:
      typeof c.brand === "object" && c.brand !== null
        ? (c.brand as { name: string }).name
        : String(c.brand || "Unknown"),
    value: parseFloat(String(c.value || 0)),
    listing_type: String(c.listing_type || "swap"),
    status: String(c.status || "active"),
    owner:
      typeof c.owner === "object" && c.owner !== null
        ? (c.owner as { id: string; username: string })
        : c.owner
        ? { id: "", username: String(c.owner) }
        : undefined,
  });

  // Fetch user's swap-eligible cards
  useEffect(() => {
    const fetchMyCards = async () => {
      try {
        setLoadingMy(true);
        const res = await apiCall(
          "gift-cards/?listing_type=swap&status=active"
        );
        if (!res.ok) throw new Error("Failed to fetch your cards");
        const data = await res.json();
        const raw = Array.isArray(data) ? data : data.results ?? [];
        const cards = raw.map(normalizeCard);
        setMyCards(cards);
        if (myCardParam) {
          const preselected = cards.find(
            (c: GiftCard) => c.id === String(myCardParam)
          );
          if (preselected) setSelectedMyCard(preselected);
        }
      } catch {
        // silently handle
      } finally {
        setLoadingMy(false);
      }
    };
    fetchMyCards();
  }, [myCardParam]);

  // Fetch target cards from marketplace (not gift-cards, which is owner-only)
  const fetchTargetCards = useCallback(async () => {
    try {
      setLoadingTarget(true);
      const res = await apiCall("marketplace/?listing_type=swap");
      if (!res.ok) throw new Error("Failed to fetch marketplace cards");
      const data = await res.json();
      const raw = Array.isArray(data) ? data : data.results ?? [];
      const cards = raw.map(normalizeCard);
      setTargetCards(cards);
      if (targetParam) {
        const preselected = cards.find(
          (c: GiftCard) => c.id === String(targetParam)
        );
        if (preselected) setSelectedTargetCard(preselected);
      }
    } catch {
      // silently handle
    } finally {
      setLoadingTarget(false);
    }
  }, [targetParam]);

  useEffect(() => {
    fetchTargetCards();
  }, [fetchTargetCards]);

  const handleSubmit = async () => {
    if (!selectedMyCard || !selectedTargetCard) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const res = await apiCall("trades/", {
        method: "POST",
        body: JSON.stringify({
          initiator_card: selectedMyCard.id,
          responder_card: selectedTargetCard.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg =
          errData.detail ||
          errData.non_field_errors?.[0] ||
          errData.initiator_card?.[0] ||
          errData.responder_card?.[0] ||
          "Failed to propose trade";
        throw new Error(msg);
      }

      const data = await res.json();
      setSubmitSuccess(true);

      setTimeout(() => {
        router.push(`/dashboard/trades/${data.trade_id || data.id}`);
      }, 2000);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const feeRate = 0.05;
  const myFee = selectedMyCard ? selectedMyCard.value * feeRate : 0;
  const theirFee = selectedTargetCard ? selectedTargetCard.value * feeRate : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/trades"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
        >
          <ArrowLeft size={16} />
          Back to Trades
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Propose a Swap
        </h1>
        <p className="text-gray-500 mt-1">
          Select cards to swap and review the trade details
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator current={step} />

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        {/* Step 1: Select Your Card */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Select Your Card to Offer
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Choose one of your active swap-eligible cards
            </p>
            <CardSelector
              cards={myCards}
              selected={selectedMyCard}
              onSelect={setSelectedMyCard}
              loading={loadingMy}
              emptyMessage="You don't have any swap-eligible cards. Add a card first!"
              searchPlaceholder="Search your cards..."
            />
          </div>
        )}

        {/* Step 2: Select Target Card */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Select the Card You Want
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {targetParam
                ? "This card was pre-selected for you"
                : "Browse available cards from the marketplace"}
            </p>
            <CardSelector
              cards={targetCards.filter(
                (c) => c.id !== selectedMyCard?.id
              )}
              selected={selectedTargetCard}
              onSelect={setSelectedTargetCard}
              loading={loadingTarget}
              emptyMessage="No swap-eligible cards available in the marketplace"
              searchPlaceholder="Search marketplace cards..."
            />
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && selectedMyCard && selectedTargetCard && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              Review Your Swap
            </h2>

            <div className="grid md:grid-cols-2 gap-5 mb-6">
              {/* Your Card */}
              <div className="p-5 rounded-xl border-2 border-primary-200 bg-primary-50/30">
                <div className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-3">
                  You Offer
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {selectedMyCard.brand.charAt(0)}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900">
                      {selectedMyCard.brand}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {selectedMyCard.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm text-gray-500">Card Value</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${Number(selectedMyCard.value || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 mt-2 bg-white rounded-lg">
                  <span className="text-sm text-gray-500">
                    Your Fee (5%)
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    ${myFee.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Target Card */}
              <div className="p-5 rounded-xl border-2 border-accent-200 bg-accent-50/30">
                <div className="text-xs font-bold text-accent-600 uppercase tracking-wide mb-3">
                  You Receive
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-accent-100 flex items-center justify-center text-accent-700 font-bold text-sm">
                    {selectedTargetCard.brand.charAt(0)}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900">
                      {selectedTargetCard.brand}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedTargetCard.owner
                        ? `Owner: ${selectedTargetCard.owner.username}`
                        : `ID: ${selectedTargetCard.id.slice(0, 8)}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm text-gray-500">Card Value</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${Number(selectedTargetCard.value || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 mt-2 bg-white rounded-lg">
                  <span className="text-sm text-gray-500">
                    Their Fee (5%)
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    ${theirFee.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Value Difference */}
            {selectedMyCard.value !== selectedTargetCard.value && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                <AlertCircle size={18} className="text-blue-500 shrink-0" />
                <div className="text-sm text-blue-700">
                  <strong>Value Difference:</strong> $
                  {Math.abs(
                    selectedMyCard.value - selectedTargetCard.value
                  ).toFixed(2)}{" "}
                  (
                  {selectedMyCard.value > selectedTargetCard.value
                    ? "your card is worth more"
                    : "their card is worth more"}
                  )
                </div>
              </div>
            )}

            {/* Total Fee */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-sm font-medium text-gray-600">
                Total Platform Fee
              </span>
              <span className="text-lg font-bold text-gray-900">
                ${(myFee + theirFee).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="text-center py-6">
            {submitSuccess ? (
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Trade Proposed!
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Your swap offer has been sent. You will be notified when the
                  other party responds.
                </p>
                <p className="text-xs text-gray-400">
                  Redirecting to trade details...
                </p>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowLeftRight size={32} className="text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Ready to Propose?
                </h2>
                <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                  You are about to propose swapping your{" "}
                  <strong>{selectedMyCard?.brand}</strong> ($
                  {Number(selectedMyCard?.value || 0).toFixed(2)}) for their{" "}
                  <strong>{selectedTargetCard?.brand}</strong> ($
                  {Number(selectedTargetCard?.value || 0).toFixed(2)}).
                </p>

                {submitError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                    {submitError}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowLeftRight size={16} />
                  )}
                  {submitting ? "Proposing..." : "Confirm & Propose Swap"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {!submitSuccess && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {step < 4 && (
            <button
              onClick={() => setStep(Math.min(4, step + 1))}
              disabled={
                (step === 1 && !selectedMyCard) ||
                (step === 2 && !selectedTargetCard)
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 3 ? "Proceed to Confirm" : "Next"}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── Page Wrapper (Suspense for useSearchParams) ───────── */
export default function ProposeSwapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-primary-500 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      }
    >
      <ProposeSwapInner />
    </Suspense>
  );
}
