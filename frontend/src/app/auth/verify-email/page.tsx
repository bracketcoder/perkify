"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

const API_BASE = "http://localhost:8000";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  // Auto-read token from URL query parameter
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    }
  }, [searchParams]);

  const verifyToken = async (verificationToken: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-email/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || data.error || "Verification failed. Invalid or expired token."
        );
      }

      setVerified(true);

      // Store tokens if returned
      if (data.access) localStorage.setItem("access_token", data.access);
      if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
      if (data.token) localStorage.setItem("access_token", data.token);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      verifyToken(token.trim());
    }
  };

  const handleResend = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      setError("Please log in first to resend the verification email.");
      return;
    }
    try {
      await fetch(`${API_BASE}/api/auth/resend-verification/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch {
      setError("Failed to resend verification email.");
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
          {!verified ? (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-primary-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Verify Your Email
                </h1>
                <p className="text-gray-500 text-sm">
                  Enter the verification token sent to your email address, or
                  click the link in the email to verify automatically.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-5">
                  <AlertCircle
                    size={18}
                    className="text-red-500 shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Token Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Token
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your verification token"
                    className="input-field text-center"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token.trim()}
                  className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                  {!loading && <ArrowRight size={18} className="ml-2" />}
                </button>
              </form>

              {/* Resend */}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-500 mb-2">
                  Didn&apos;t receive the email?
                </p>
                <button
                  onClick={handleResend}
                  disabled={resent}
                  className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                    resent
                      ? "text-green-600"
                      : "text-primary-600 hover:text-primary-700"
                  }`}
                >
                  {resent ? (
                    <>
                      <CheckCircle2 size={16} />
                      Email resent!
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Resend Email
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                Your account is now verified. You can start swapping and selling
                gift cards on Perkify.
              </p>
              <Link href="/auth/login" className="btn-primary w-full py-3.5">
                Continue to Log In
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </section>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
