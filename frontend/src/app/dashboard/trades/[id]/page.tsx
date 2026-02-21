"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  PartyPopper,
  Send,
  ThumbsUp,
  ThumbsDown,
  Flag,
  CreditCard,
  DollarSign,
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

interface CardDetail {
  id: string;
  brand: string;
  value: number;
  status: string;
  card_number?: string;
  pin?: string;
}

interface TradeDetail {
  id: string;
  status: TradeStatus;
  initiator: { id: string; username: string };
  responder: { id: string; username: string };
  initiator_card: CardDetail;
  responder_card: CardDetail;
  initiator_fee: number;
  responder_fee: number;
  platform_fee: number;
  is_initiator: boolean;
  is_responder: boolean;
  my_fee_paid: boolean;
  initiator_paid: boolean;
  responder_paid: boolean;
  confirmation_deadline?: string;
  created_at: string;
  updated_at: string;
}

/* ───────── Escrow Steps ───────── */
const escrowSteps = [
  { key: "proposed", label: "Offer Sent", icon: Send },
  { key: "accepted", label: "Accepted", icon: ThumbsUp },
  { key: "in_escrow", label: "Cards Locked", icon: Lock },
  { key: "codes_released", label: "Codes Released", icon: Unlock },
  { key: "confirming", label: "Confirmation", icon: Clock },
  { key: "completed", label: "Finalized", icon: CheckCircle2 },
];

const stepOrder = [
  "proposed",
  "accepted",
  "in_escrow",
  "codes_released",
  "confirming",
  "completed",
];

function getStepIndex(status: TradeStatus): number {
  const idx = stepOrder.indexOf(status);
  return idx >= 0 ? idx : -1;
}

/* ───────── Countdown Timer ───────── */
function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        setIsExpired(true);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border ${
        isExpired
          ? "bg-red-50 border-red-100"
          : "bg-orange-50 border-orange-100"
      }`}
    >
      <Clock
        size={20}
        className={isExpired ? "text-red-500" : "text-orange-500"}
      />
      <div>
        <div
          className={`text-xs font-semibold uppercase tracking-wide ${
            isExpired ? "text-red-600" : "text-orange-600"
          }`}
        >
          {isExpired ? "Confirmation Window Expired" : "Confirmation Window"}
        </div>
        <div
          className={`text-2xl font-bold font-mono ${
            isExpired ? "text-red-700" : "text-orange-700"
          }`}
        >
          {timeLeft}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {isExpired
            ? "The confirmation period has ended"
            : "Time remaining to confirm or dispute"}
        </div>
      </div>
    </div>
  );
}

/* ───────── Code Reveal ───────── */
function CardCodeReveal({
  cardNumber,
  pin,
}: {
  cardNumber?: string;
  pin?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!cardNumber && !pin) return null;

  return (
    <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
          Card Details
        </span>
        <button
          onClick={() => setRevealed(!revealed)}
          className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          {revealed ? "Hide" : "Reveal"}
        </button>
      </div>
      {cardNumber && (
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[10px] text-green-600 font-medium uppercase">
              Card Number
            </div>
            <div className="text-sm font-mono font-bold text-green-800 tracking-wider">
              {revealed ? cardNumber : "---- ---- ---- ----"}
            </div>
          </div>
          {revealed && (
            <button
              onClick={() => handleCopy(cardNumber, "number")}
              className="p-2 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
            >
              {copied === "number" ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}
        </div>
      )}
      {pin && (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-green-600 font-medium uppercase">
              PIN
            </div>
            <div className="text-sm font-mono font-bold text-green-800 tracking-wider">
              {revealed ? pin : "----"}
            </div>
          </div>
          {revealed && (
            <button
              onClick={() => handleCopy(pin, "pin")}
              className="p-2 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
            >
              {copied === "pin" ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── Confetti Animation ───────── */
function ConfettiSuccess() {
  return (
    <div className="text-center py-6">
      <div className="relative inline-block">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <PartyPopper size={36} className="text-green-600" />
        </div>
        {/* Confetti-style dots */}
        <div className="absolute -top-2 -left-4 w-3 h-3 bg-primary-400 rounded-full animate-ping" />
        <div className="absolute -top-1 right-0 w-2 h-2 bg-accent-400 rounded-full animate-ping animation-delay-200" />
        <div className="absolute top-4 -right-6 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping animation-delay-400" />
        <div className="absolute bottom-2 -left-6 w-2 h-2 bg-purple-400 rounded-full animate-ping animation-delay-300" />
        <div className="absolute -bottom-1 right-2 w-3 h-3 bg-red-400 rounded-full animate-ping animation-delay-100" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-1">
        Trade Complete!
      </h3>
      <p className="text-gray-500 text-sm">
        Both parties have confirmed. Enjoy your new gift card!
      </p>
    </div>
  );
}

/* ───────── Page Component ───────── */
export default function TradeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tradeId = params.id as string;

  const [trade, setTrade] = useState<TradeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTrade = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiCall(`trades/${tradeId}/`);
      if (!res.ok) throw new Error("Failed to fetch trade details");
      const data = await res.json();
      setTrade(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [tradeId]);

  useEffect(() => {
    fetchTrade();
  }, [fetchTrade]);

  const handleAction = async (
    action: string,
    method: string,
    url: string,
    body?: object
  ) => {
    try {
      setActionLoading(action);
      const res = await apiCall(url, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to ${action}`);
      }
      await fetchTrade();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={36} className="text-primary-500 animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Loading trade details...</p>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/trades"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Trades
        </Link>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <XCircle size={36} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Trade Not Found
          </h3>
          <p className="text-gray-500 text-sm">
            {error || "This trade could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  const myCard = trade.is_initiator
    ? trade.initiator_card
    : trade.responder_card;
  const theirCard = trade.is_initiator
    ? trade.responder_card
    : trade.initiator_card;
  const myFee = trade.is_initiator
    ? trade.initiator_fee
    : trade.responder_fee;
  const theirFee = trade.is_initiator
    ? trade.responder_fee
    : trade.initiator_fee;
  const currentStepIdx = getStepIndex(trade.status);
  const isCancelledOrDisputed =
    trade.status === "cancelled" || trade.status === "disputed";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back Button & Trade ID */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href="/dashboard/trades"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <ArrowLeft size={16} />
            Back to Trades
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Trade #{tradeId.slice(0, 8)}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Created on{" "}
            {new Date(trade.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div>
          {(() => {
            const sc = {
              proposed: "bg-blue-50 text-blue-600 border-blue-100",
              accepted: "bg-blue-50 text-blue-600 border-blue-100",
              in_escrow: "bg-yellow-50 text-yellow-700 border-yellow-100",
              codes_released: "bg-yellow-50 text-yellow-700 border-yellow-100",
              confirming: "bg-orange-50 text-orange-600 border-orange-100",
              completed: "bg-green-50 text-green-600 border-green-100",
              cancelled: "bg-red-50 text-red-600 border-red-100",
              disputed: "bg-red-50 text-red-600 border-red-100",
            }[trade.status];
            return (
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${sc}`}
              >
                <Shield size={16} />
                {trade.status
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Escrow Progress Bar */}
      {!isCancelledOrDisputed && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5 uppercase tracking-wide">
            Trade Progress
          </h2>
          <div className="flex items-center justify-between relative">
            {/* Progress line (background) */}
            <div className="absolute top-5 left-6 right-6 h-0.5 bg-gray-200" />
            {/* Progress line (filled) */}
            <div
              className="absolute top-5 left-6 h-0.5 bg-primary-500 transition-all duration-500"
              style={{
                width:
                  currentStepIdx >= 0
                    ? `${(currentStepIdx / (escrowSteps.length - 1)) * 100}%`
                    : "0%",
                maxWidth: "calc(100% - 48px)",
              }}
            />
            {escrowSteps.map((step, idx) => {
              const isComplete = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
              const isFuture = currentStepIdx < idx;
              return (
                <div
                  key={step.key}
                  className="relative flex flex-col items-center z-10"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isComplete
                        ? "bg-primary-500 border-primary-500 text-white"
                        : isCurrent
                        ? "bg-white border-primary-500 text-primary-600 shadow-md shadow-primary-500/20"
                        : "bg-white border-gray-200 text-gray-400"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <step.icon size={16} />
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-medium mt-2 text-center max-w-[60px] sm:max-w-[80px] leading-tight ${
                      isComplete
                        ? "text-primary-600"
                        : isCurrent
                        ? "text-primary-700 font-semibold"
                        : isFuture
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Celebration */}
      {trade.status === "completed" && (
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          <ConfettiSuccess />
        </div>
      )}

      {/* Disputed / Cancelled Banner */}
      {trade.status === "disputed" && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
          <AlertTriangle size={24} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-red-800">
              Dispute Filed &mdash; Under Review
            </h3>
            <p className="text-sm text-red-600 mt-1">
              A dispute has been filed for this trade. Our team is reviewing the
              case. You will be notified once a resolution is reached.
            </p>
          </div>
        </div>
      )}

      {trade.status === "cancelled" && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
          <XCircle size={24} className="text-gray-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-gray-700">
              Trade Cancelled
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              This trade has been cancelled. No cards were exchanged.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Countdown */}
      {trade.status === "confirming" && trade.confirmation_deadline && (
        <CountdownTimer deadline={trade.confirmation_deadline} />
      )}

      {/* Card Comparison — Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Your Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-600">Y</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Your Card
            </h3>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Brand</span>
              <span className="text-sm font-semibold text-gray-900">
                {myCard.brand}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Value</span>
              <span className="text-sm font-bold text-gray-900">
                ${myCard.value.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Status</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-600">
                {myCard.status}
              </span>
            </div>
          </div>

          <div className="p-3 bg-primary-50/50 rounded-xl text-center">
            <span className="text-xs text-gray-500">Your Fee (5%)</span>
            <div className="text-lg font-bold text-gray-900">
              ${myFee?.toFixed(2) ?? "0.00"}
            </div>
          </div>
        </div>

        {/* Their Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <span className="text-sm font-bold text-accent-600">T</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Their Card
            </h3>
            <span className="text-xs text-gray-400 ml-auto">
              {trade.is_initiator
                ? trade.responder.username
                : trade.initiator.username}
            </span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Brand</span>
              <span className="text-sm font-semibold text-gray-900">
                {theirCard.brand}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Value</span>
              <span className="text-sm font-bold text-gray-900">
                ${theirCard.value.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Status</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-accent-50 text-accent-600">
                {theirCard.status}
              </span>
            </div>
          </div>

          <div className="p-3 bg-accent-50/50 rounded-xl text-center">
            <span className="text-xs text-gray-500">Their Fee (5%)</span>
            <div className="text-lg font-bold text-gray-900">
              ${theirFee?.toFixed(2) ?? "0.00"}
            </div>
          </div>

          {/* Show codes when released */}
          {(trade.status === "codes_released" ||
            trade.status === "confirming" ||
            trade.status === "completed") && (
            <CardCodeReveal
              cardNumber={theirCard.card_number}
              pin={theirCard.pin}
            />
          )}
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Fee Breakdown
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <div className="text-xs text-gray-500 mb-1">Your Fee (5%)</div>
            <div className="text-xl font-bold text-gray-900">
              ${myFee?.toFixed(2) ?? "0.00"}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <div className="text-xs text-gray-500 mb-1">Their Fee (5%)</div>
            <div className="text-xl font-bold text-gray-900">
              ${theirFee?.toFixed(2) ?? "0.00"}
            </div>
          </div>
          <div className="p-4 bg-primary-50 rounded-xl text-center">
            <div className="text-xs text-primary-600 mb-1">Total Platform Fee</div>
            <div className="text-xl font-bold text-primary-700">
              ${trade.platform_fee?.toFixed(2) ?? "0.00"}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (contextual) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Actions
        </h3>

        {/* Proposed — Pay Fee & Actions */}
        {trade.status === "proposed" && (
          <div className="space-y-4">
            {/* Fee Payment Status */}
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={18} className="text-primary-600" />
                <span className="text-sm font-semibold text-gray-900">Platform Fee Payment</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${trade.initiator_paid ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                  {trade.initiator_paid ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  {trade.initiator.username}: {trade.initiator_paid ? "Paid" : "Pending"}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${trade.responder_paid ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                  {trade.responder_paid ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  {trade.responder.username}: {trade.responder_paid ? "Paid" : "Pending"}
                </div>
              </div>
            </div>

            {/* Pay Fee Button (if not paid yet) */}
            {!trade.my_fee_paid && (
              <button
                onClick={async () => {
                  try {
                    setActionLoading("pay");
                    const res = await apiCall(`payments/trade/${tradeId}/checkout/`, { method: "POST" });
                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      throw new Error(errData.detail || "Failed to create payment session");
                    }
                    const data = await res.json();
                    if (data.checkout_url) {
                      window.location.href = data.checkout_url;
                    }
                  } catch (err: unknown) {
                    alert(err instanceof Error ? err.message : "Payment failed");
                  } finally {
                    setActionLoading(null);
                  }
                }}
                disabled={actionLoading !== null}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "pay" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CreditCard size={16} />
                )}
                Pay Fee (${myFee?.toFixed(2) ?? "0.00"})
              </button>
            )}

            {/* Fee Already Paid Confirmation */}
            {trade.my_fee_paid && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                <CheckCircle2 size={18} className="text-green-500" />
                <span className="text-sm font-semibold text-green-700">Your fee has been paid</span>
              </div>
            )}

            {/* Responder Accept/Decline (only after paying fee) */}
            {trade.is_responder && trade.my_fee_paid && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() =>
                    handleAction(
                      "accept",
                      "PATCH",
                      `trades/${tradeId}/respond/`,
                      { action: "accept" }
                    )
                  }
                  disabled={actionLoading !== null}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === "accept" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ThumbsUp size={16} />
                  )}
                  Accept Trade
                </button>
                <button
                  onClick={() =>
                    handleAction(
                      "decline",
                      "PATCH",
                      `trades/${tradeId}/respond/`,
                      { action: "decline" }
                    )
                  }
                  disabled={actionLoading !== null}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 border border-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === "decline" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ThumbsDown size={16} />
                  )}
                  Decline Trade
                </button>
              </div>
            )}

            {/* Initiator waiting */}
            {trade.is_initiator && trade.my_fee_paid && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <Clock size={20} className="text-blue-500" />
                <div>
                  <div className="text-sm font-semibold text-blue-800">
                    Waiting for Response
                  </div>
                  <div className="text-xs text-blue-600">
                    Your trade offer has been sent. Waiting for{" "}
                    {trade.responder.username} to pay and accept.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accepted */}
        {trade.status === "accepted" && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <CheckCircle2 size={20} className="text-blue-500" />
            <div>
              <div className="text-sm font-semibold text-blue-800">
                Trade Accepted
              </div>
              <div className="text-xs text-blue-600">
                Both parties have agreed. Cards are being locked in escrow...
              </div>
            </div>
          </div>
        )}

        {/* In Escrow — Release Codes */}
        {trade.status === "in_escrow" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
              <Lock size={20} className="text-yellow-600" />
              <div>
                <div className="text-sm font-semibold text-yellow-800">
                  Cards Locked in Escrow
                </div>
                <div className="text-xs text-yellow-700">
                  Both cards are securely held. Release your card codes to
                  proceed.
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                handleAction(
                  "release",
                  "POST",
                  `trades/${tradeId}/release/`
                )
              }
              disabled={actionLoading !== null}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === "release" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Unlock size={16} />
              )}
              Release Codes
            </button>
          </div>
        )}

        {/* Codes Released — Confirm or Dispute */}
        {trade.status === "codes_released" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
              <Unlock size={20} className="text-yellow-600" />
              <div>
                <div className="text-sm font-semibold text-yellow-800">
                  Codes Released
                </div>
                <div className="text-xs text-yellow-700">
                  Card codes have been revealed. Review the card details above,
                  then confirm the card works or file a dispute.
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() =>
                  handleAction(
                    "confirm",
                    "POST",
                    `trades/${tradeId}/confirm/`
                  )
                }
                disabled={actionLoading !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "confirm" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirm Card Works
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to file a dispute? This action will be reviewed by our team."
                    )
                  ) {
                    handleAction(
                      "dispute",
                      "POST",
                      `trades/${tradeId}/dispute/`,
                      { reason: "Card details are invalid or not working" }
                    );
                  }
                }}
                disabled={actionLoading !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 border border-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "dispute" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Flag size={16} />
                )}
                File Dispute
              </button>
            </div>
          </div>
        )}

        {/* Confirming — Confirm or Dispute */}
        {trade.status === "confirming" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() =>
                handleAction(
                  "confirm",
                  "POST",
                  `trades/${tradeId}/confirm/`
                )
              }
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === "confirm" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Confirm Card Works
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to file a dispute? This action will be reviewed by our team."
                  )
                ) {
                  handleAction(
                    "dispute",
                    "POST",
                    `trades/${tradeId}/dispute/`,
                    { reason: "Card details are invalid or not working" }
                  );
                }
              }}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 border border-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === "dispute" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Flag size={16} />
              )}
              File Dispute
            </button>
          </div>
        )}

        {/* Completed */}
        {trade.status === "completed" && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
            <CheckCircle2 size={20} className="text-green-500" />
            <div>
              <div className="text-sm font-semibold text-green-800">
                Trade Successfully Completed
              </div>
              <div className="text-xs text-green-600">
                Both parties have confirmed their cards. This trade is finalized.
              </div>
            </div>
          </div>
        )}

        {/* Cancelled */}
        {trade.status === "cancelled" && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <XCircle size={20} className="text-gray-400" />
            <div>
              <div className="text-sm font-semibold text-gray-700">
                This Trade Was Cancelled
              </div>
              <div className="text-xs text-gray-500">
                No further actions are available.
              </div>
            </div>
          </div>
        )}

        {/* Disputed */}
        {trade.status === "disputed" && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
            <AlertTriangle size={20} className="text-red-500" />
            <div>
              <div className="text-sm font-semibold text-red-800">
                Dispute Under Review
              </div>
              <div className="text-xs text-red-600">
                Our support team is investigating this dispute. You will receive
                a notification once it is resolved.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
