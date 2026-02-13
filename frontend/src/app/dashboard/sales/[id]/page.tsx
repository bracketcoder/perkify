"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  DollarSign,
  ShoppingCart,
  Tag,
  Copy,
  Check,
  Eye,
  EyeOff,
  Send,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Types ───────── */
type SaleStatus = "pending" | "accepted" | "completed" | "cancelled";

interface SaleDetail {
  id: string;
  card: {
    id: string;
    brand: string;
    value: number;
    status: string;
  };
  buyer: { id: string; username: string };
  seller: { id: string; username: string };
  role: "buyer" | "seller";
  amount: number;
  platform_fee: number;
  status: SaleStatus;
  created_at: string;
  updated_at: string;
}

/* ───────── Progress Steps ───────── */
const progressSteps = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "accepted", label: "Accepted", icon: Send },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

const stepOrder = ["pending", "accepted", "completed"];

function getStepIndex(status: SaleStatus): number {
  const idx = stepOrder.indexOf(status);
  return idx >= 0 ? idx : -1;
}

/* ───────── Card Code Reveal ───────── */
function CardCodeReveal({ cardId }: { cardId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchCode = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await apiCall(`gift-cards/${cardId}/code/`);
      if (!res.ok) throw new Error("Failed to retrieve card code");
      const data = await res.json();
      setCode(data.card_number || data.code || null);
      setPin(data.pin || null);
      setRevealed(true);
    } catch (err: unknown) {
      setFetchError(
        err instanceof Error ? err.message : "Could not retrieve code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mt-6 p-5 bg-green-50 border border-green-100 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
          Your Gift Card Code
        </span>
        {code && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
          >
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            {revealed ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {!code && !loading && !fetchError && (
        <button
          onClick={fetchCode}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-all"
        >
          <Eye size={16} />
          Reveal Card Code
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={20} className="text-green-600 animate-spin" />
          <span className="text-sm text-green-700 ml-2">
            Decrypting card code...
          </span>
        </div>
      )}

      {fetchError && (
        <div className="text-sm text-red-600 py-2">{fetchError}</div>
      )}

      {code && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <div>
              <div className="text-[10px] text-green-600 font-semibold uppercase">
                Card Number
              </div>
              <div className="text-sm font-mono font-bold text-green-800 tracking-wider">
                {revealed ? code : "---- ---- ---- ----"}
              </div>
            </div>
            {revealed && (
              <button
                onClick={() => handleCopy(code, "code")}
                className="p-2 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
              >
                {copied === "code" ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )}
          </div>
          {pin && (
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div>
                <div className="text-[10px] text-green-600 font-semibold uppercase">
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
                  {copied === "pin" ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── Page Component ───────── */
export default function SaleDetailPage() {
  const params = useParams();
  const saleId = params.id as string;

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSale = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiCall(`sales/${saleId}/`);
      if (!res.ok) throw new Error("Failed to fetch sale details");
      const data = await res.json();
      // Normalize API response to match frontend SaleDetail interface
      const gc = data.gift_card || {};
      const normalized: SaleDetail = {
        id: data.sale_id || data.id || saleId,
        card: {
          id: String(gc.id || ""),
          brand: gc.brand_name || gc.brand || "Unknown",
          value: parseFloat(String(gc.value || 0)),
          status: gc.status || "",
        },
        buyer: typeof data.buyer === "string"
          ? { id: "", username: data.buyer }
          : data.buyer || { id: "", username: "Unknown" },
        seller: typeof data.seller === "string"
          ? { id: "", username: data.seller }
          : data.seller || { id: "", username: "Unknown" },
        role: data.role || "buyer",
        amount: parseFloat(String(data.amount || 0)),
        platform_fee: parseFloat(String(data.platform_fee || 0)),
        status: data.status || "pending",
        created_at: data.created_at || "",
        updated_at: data.updated_at || "",
      };
      setSale(normalized);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  const handleConfirmSale = async () => {
    try {
      setActionLoading(true);
      const res = await apiCall(`sales/${saleId}/confirm/`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to confirm sale");
      }
      await fetchSale();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={36} className="text-primary-500 animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Loading sale details...</p>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/sales"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Sales
        </Link>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <XCircle size={36} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Sale Not Found
          </h3>
          <p className="text-gray-500 text-sm">
            {error || "This sale could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(sale.status);
  const isCancelled = sale.status === "cancelled";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href="/dashboard/sales"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <ArrowLeft size={16} />
            Back to Sales
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Sale #{saleId.slice(0, 8)}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Created on{" "}
            {new Date(sale.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              sale.role === "buyer"
                ? "bg-blue-50 text-blue-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {sale.role === "buyer" ? (
              <ShoppingCart size={12} />
            ) : (
              <Tag size={12} />
            )}
            {sale.role === "buyer" ? "Buyer" : "Seller"}
          </span>
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${
              {
                pending: "bg-amber-50 text-amber-600 border-amber-100",
                accepted: "bg-blue-50 text-blue-600 border-blue-100",
                completed: "bg-green-50 text-green-600 border-green-100",
                cancelled: "bg-gray-50 text-gray-500 border-gray-200",
              }[sale.status]
            }`}
          >
            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5 uppercase tracking-wide">
            Sale Progress
          </h2>
          <div className="flex items-center justify-between relative max-w-md mx-auto">
            {/* Background line */}
            <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200" />
            {/* Filled line */}
            <div
              className="absolute top-5 left-10 h-0.5 bg-primary-500 transition-all duration-500"
              style={{
                width:
                  currentStepIdx >= 0
                    ? `${(currentStepIdx / (progressSteps.length - 1)) * 100}%`
                    : "0%",
                maxWidth: "calc(100% - 80px)",
              }}
            />
            {progressSteps.map((step, idx) => {
              const isComplete = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
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
                    className={`text-xs font-medium mt-2 ${
                      isComplete || isCurrent
                        ? "text-primary-600"
                        : "text-gray-400"
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

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
          <XCircle size={24} className="text-gray-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-gray-700">
              Sale Cancelled
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              This sale has been cancelled. No funds were exchanged.
            </p>
          </div>
        </div>
      )}

      {/* Card Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Gift Card Details
        </h3>

        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-lg">
            {sale.card.brand.charAt(0)}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {sale.card.brand}
            </div>
            <div className="text-sm text-gray-500">
              Card ID: {sale.card.id.slice(0, 8)}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">Card Value</div>
            <div className="text-xl font-bold text-gray-900">
              ${Number(sale.card.value || 0).toFixed(2)}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">Amount Paid</div>
            <div
              className={`text-xl font-bold ${
                sale.role === "seller" ? "text-green-600" : "text-gray-900"
              }`}
            >
              {sale.role === "seller" ? "+" : ""}${Number(sale.amount || 0).toFixed(2)}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">Platform Fee</div>
            <div className="text-xl font-bold text-gray-900">
              ${sale.platform_fee?.toFixed(2) ?? "0.00"}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">
              {sale.role === "buyer" ? "Seller" : "Buyer"}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                {(sale.role === "buyer"
                  ? sale.seller.username
                  : sale.buyer.username
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <span className="text-base font-semibold text-gray-900">
                {sale.role === "buyer"
                  ? sale.seller.username
                  : sale.buyer.username}
              </span>
            </div>
          </div>
        </div>

        {/* Buyer gets card code on completion */}
        {sale.role === "buyer" && sale.status === "completed" && (
          <CardCodeReveal cardId={sale.card.id} />
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Actions
        </h3>

        {/* Seller can confirm when pending */}
        {sale.role === "seller" && sale.status === "pending" && (
          <button
            onClick={handleConfirmSale}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {actionLoading ? "Confirming..." : "Confirm Sale"}
          </button>
        )}

        {/* Seller waiting for buyer */}
        {sale.role === "seller" && sale.status === "accepted" && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <Clock size={20} className="text-blue-500" />
            <div>
              <div className="text-sm font-semibold text-blue-800">
                Sale Accepted
              </div>
              <div className="text-xs text-blue-600">
                The buyer has been notified. Waiting for payment processing.
              </div>
            </div>
          </div>
        )}

        {/* Buyer waiting */}
        {sale.role === "buyer" && sale.status === "pending" && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <Clock size={20} className="text-amber-500" />
            <div>
              <div className="text-sm font-semibold text-amber-800">
                Waiting for Seller
              </div>
              <div className="text-xs text-amber-600">
                The seller needs to confirm this sale. You will be notified once
                it is confirmed.
              </div>
            </div>
          </div>
        )}

        {/* Buyer accepted */}
        {sale.role === "buyer" && sale.status === "accepted" && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <Clock size={20} className="text-blue-500" />
            <div>
              <div className="text-sm font-semibold text-blue-800">
                Payment Processing
              </div>
              <div className="text-xs text-blue-600">
                Your payment is being processed. The card code will be available
                once the sale is completed.
              </div>
            </div>
          </div>
        )}

        {/* Completed */}
        {sale.status === "completed" && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
            <CheckCircle2 size={20} className="text-green-500" />
            <div>
              <div className="text-sm font-semibold text-green-800">
                Sale Completed
              </div>
              <div className="text-xs text-green-600">
                {sale.role === "buyer"
                  ? "Your gift card code is available above. Enjoy!"
                  : "Payment has been credited to your wallet."}
              </div>
            </div>
          </div>
        )}

        {/* Cancelled */}
        {sale.status === "cancelled" && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <XCircle size={20} className="text-gray-400" />
            <div>
              <div className="text-sm font-semibold text-gray-700">
                Sale Cancelled
              </div>
              <div className="text-xs text-gray-500">
                No further actions are available for this sale.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
