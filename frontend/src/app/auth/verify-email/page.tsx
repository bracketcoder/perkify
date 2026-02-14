"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = searchParams.get("email") || "";

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5 && newOtp.every((d) => d !== "")) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      verifyOtp(pasted);
    }
  };

  const verifyOtp = async (code: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-email/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Verification failed.");
      }

      setVerified(true);

      // Store tokens returned after successful verification
      if (data.tokens) {
        localStorage.setItem("access_token", data.tokens.access);
        localStorage.setItem("refresh_token", data.tokens.refresh);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Verification failed. Please try again."
      );
      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length === 6) {
      verifyOtp(code);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResent(true);
        setCooldown(60);
        setTimeout(() => setResent(false), 3000);
      }
    } catch {
      setError("Failed to resend verification code.");
    }
  };

  // Redirect if no email
  if (!email) {
    return (
      <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/30 px-4 py-12">
        <div className="w-full max-w-md text-center">
          <p className="text-gray-500 mb-4">No email address provided.</p>
          <Link href="/auth/register" className="btn-primary inline-flex py-3 px-6">
            Go to Registration
          </Link>
        </div>
      </section>
    );
  }

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
                  We sent a 6-digit code to
                </p>
                <p className="text-gray-900 font-medium text-sm mt-1">
                  {email}
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
                {/* OTP Inputs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    Enter verification code
                  </label>
                  <div className="flex justify-center gap-3" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl
                                   focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none
                                   transition-all duration-200"
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.some((d) => !d)}
                  className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                  {!loading && <ArrowRight size={18} className="ml-2" />}
                </button>
              </form>

              {/* Resend */}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-500 mb-2">
                  Didn&apos;t receive the code?
                </p>
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                    resent
                      ? "text-green-600"
                      : cooldown > 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-primary-600 hover:text-primary-700"
                  }`}
                >
                  {resent ? (
                    <>
                      <CheckCircle2 size={16} />
                      Code resent!
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <RefreshCw size={16} />
                      Resend in {cooldown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Resend Code
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
              <Link href="/dashboard" className="btn-primary w-full py-3.5">
                Go to Dashboard
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
