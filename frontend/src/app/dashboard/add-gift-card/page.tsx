"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  DollarSign,
  Calendar,
  Hash,
  Lock,
  Tag,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  X,
  PlusCircle,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Brand type ───────── */
interface BrandOption {
  id: number;
  name: string;
}

/* ───────── Page ───────── */
export default function AddGiftCardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [form, setForm] = useState({
    brand: "",  // stores brand ID as string
    value: "",
    expiry_date: "",
    card_number: "",
    pin: "",
    listing_type: "swap" as "swap" | "sell" | "both",
    selling_price: "",
    confirm_unused: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch brands from API
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await apiCall("brands/?page_size=100");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.results || [];
          setBrands(list);
        }
      } catch {
        // Silently fail — dropdown will be empty
      }
    };
    fetchBrands();
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.brand) newErrors.brand = "Please select a brand";
    if (!form.value || parseFloat(form.value) <= 0) newErrors.value = "Please enter a valid card value";
    if (!form.expiry_date) {
      newErrors.expiry_date = "Please enter an expiry date";
    } else {
      const expiry = new Date(form.expiry_date);
      if (expiry <= new Date()) {
        newErrors.expiry_date = "Expiry date must be in the future";
      }
    }
    if (!form.card_number) newErrors.card_number = "Please enter the card number";
    if (!form.pin) newErrors.pin = "Please enter the card PIN";

    if ((form.listing_type === "sell" || form.listing_type === "both") && form.selling_price) {
      const price = parseFloat(form.selling_price);
      const value = parseFloat(form.value);
      if (price <= 0) {
        newErrors.selling_price = "Price must be greater than 0";
      } else if (value && price > value) {
        newErrors.selling_price = "Selling price cannot exceed card value";
      }
    }

    if ((form.listing_type === "sell" || form.listing_type === "both") && !form.selling_price) {
      newErrors.selling_price = "Please enter a selling price";
    }

    if (!form.confirm_unused) {
      newErrors.confirm_unused = "You must confirm the card is unused";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setApiError("");

      const formData = new FormData();
      formData.append("brand", form.brand);
      formData.append("value", form.value);
      formData.append("expiry_date", form.expiry_date);
      formData.append("card_number", form.card_number);
      formData.append("pin", form.pin);
      formData.append("listing_type", form.listing_type);
      if (form.selling_price) {
        formData.append("selling_price", form.selling_price);
      }
      formData.append("confirmed_unused", form.confirm_unused ? "true" : "false");
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/gift-cards/", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/my-gift-cards");
        }, 2000);
      } else {
        const data = await res.json().catch(() => null);
        if (data && typeof data === "object") {
          const fieldErrors: Record<string, string> = {};
          Object.entries(data).forEach(([key, val]) => {
            fieldErrors[key] = Array.isArray(val) ? val[0] : String(val);
          });
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          } else {
            setApiError("Failed to add gift card. Please try again.");
          }
        } else {
          setApiError("Failed to add gift card. Please try again.");
        }
      }
    } catch {
      setApiError("Something went wrong. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Gift Card Added!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Your gift card has been successfully listed.
          </p>
          <p className="text-xs text-gray-400">Redirecting to your cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/my-gift-cards"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to My Cards
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add Gift Card</h1>
        <p className="text-gray-500 mt-1">
          List your unused gift card for swapping or selling
        </p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Card Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={form.brand}
                onChange={(e) => updateField("brand", e.target.value)}
                className={`input-field pl-11 appearance-none cursor-pointer ${errors.brand ? "ring-2 ring-red-300 border-red-300" : ""}`}
              >
                <option value="">Select a brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand}</p>}
          </div>

          {/* Value */}
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Value ($) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="50.00"
                  value={form.value}
                  onChange={(e) => updateField("value", e.target.value)}
                  className={`input-field pl-11 ${errors.value ? "ring-2 ring-red-300 border-red-300" : ""}`}
                />
              </div>
              {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => updateField("expiry_date", e.target.value)}
                  className={`input-field pl-11 ${errors.expiry_date ? "ring-2 ring-red-300 border-red-300" : ""}`}
                />
              </div>
              {errors.expiry_date && <p className="text-xs text-red-500 mt-1">{errors.expiry_date}</p>}
            </div>
          </div>

          {/* Card Number & PIN */}
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={form.card_number}
                  onChange={(e) => updateField("card_number", e.target.value)}
                  className={`input-field pl-11 ${errors.card_number ? "ring-2 ring-red-300 border-red-300" : ""}`}
                />
              </div>
              {errors.card_number && <p className="text-xs text-red-500 mt-1">{errors.card_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter card PIN"
                  value={form.pin}
                  onChange={(e) => updateField("pin", e.target.value)}
                  className={`input-field pl-11 ${errors.pin ? "ring-2 ring-red-300 border-red-300" : ""}`}
                />
              </div>
              {errors.pin && <p className="text-xs text-red-500 mt-1">{errors.pin}</p>}
            </div>
          </div>
        </div>

        {/* Listing Options */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Listing Options</h2>

          {/* Listing Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How do you want to list this card? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { value: "swap", label: "Swap", desc: "Trade for another card", icon: "swap" },
                  { value: "sell", label: "Sell", desc: "Sell for cash", icon: "sell" },
                  { value: "both", label: "Both", desc: "Swap or sell", icon: "both" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("listing_type", option.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    form.listing_type === option.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`text-sm font-semibold mb-0.5 ${
                      form.listing_type === option.value ? "text-primary-700" : "text-gray-900"
                    }`}
                  >
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selling Price (only for sell/both) */}
          {(form.listing_type === "sell" || form.listing_type === "both") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Price ($) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="35.00"
                  value={form.selling_price}
                  onChange={(e) => updateField("selling_price", e.target.value)}
                  className={`input-field pl-11 ${errors.selling_price ? "ring-2 ring-red-300 border-red-300" : ""}`}
                />
              </div>
              {errors.selling_price && <p className="text-xs text-red-500 mt-1">{errors.selling_price}</p>}
              {form.value && form.selling_price && (
                <p className="text-xs text-gray-400 mt-1">
                  Discount:{" "}
                  {Math.round(
                    ((parseFloat(form.value) - parseFloat(form.selling_price)) / parseFloat(form.value)) * 100
                  )}
                  % off face value
                </p>
              )}
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Card Image (Optional)</h2>

          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Card preview"
                className="w-48 h-32 object-cover rounded-xl border border-gray-200"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 transition-colors text-center"
            >
              <Upload size={24} className="text-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-600">Click to upload an image</div>
              <div className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</div>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Confirm Unused */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.confirm_unused}
              onChange={(e) => updateField("confirm_unused", e.target.checked)}
              className="mt-1 w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">
                I confirm this gift card is unused and has the full balance available
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Listing a partially used or invalid card may result in account suspension.
              </div>
            </div>
          </label>
          {errors.confirm_unused && <p className="text-xs text-red-500 mt-2">{errors.confirm_unused}</p>}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/my-gift-cards"
            className="px-6 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <PlusCircle size={16} className="mr-2" />
                Add Gift Card
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
