"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

const API_BASE = "http://localhost:8000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || data.error || "Failed to send reset link."
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/30 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="Perkify" fill className="object-contain" priority />
            </div>
            <span className="text-2xl font-bold text-gray-900">Perkify</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-7 sm:p-8">
          {!submitted ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-primary-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Forgot Password?
                </h1>
                <p className="text-gray-500 text-sm">
                  No worries — enter your email and we&apos;ll send you a reset
                  link.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-5">
                  <AlertCircle
                    size={18}
                    className="text-red-500 shrink-0"
                  />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-field pl-11"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                  {!loading && <ArrowRight size={18} className="ml-2" />}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-500 text-sm mb-2">
                We&apos;ve sent a password reset link to:
              </p>
              <p className="text-gray-900 font-semibold mb-6">{email}</p>
              <p className="text-xs text-gray-400 mb-6">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setError("");
                  }}
                  className="text-primary-600 hover:underline font-medium"
                >
                  try again
                </button>
              </p>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Log In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
