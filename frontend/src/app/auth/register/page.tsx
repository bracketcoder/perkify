"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const TURNSTILE_SITE_KEY = "0x4AAAAAACcbrWuiO2lrJOCd";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const widgetIdRef = useRef<string | null>(null);

  const onTurnstileLoad = useCallback(() => {
    if (typeof window !== "undefined" && window.turnstile) {
      widgetIdRef.current = window.turnstile.render("#turnstile-container", {
        sitekey: TURNSTILE_SITE_KEY,
        size: "invisible",
        callback: () => {},
      });
    }
  }, []);

  const getTurnstileToken = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.turnstile || widgetIdRef.current === null) {
        reject(new Error("Turnstile not loaded"));
        return;
      }
      window.turnstile.reset(widgetIdRef.current);
      window.turnstile.execute(widgetIdRef.current, {
        callback: (token: string) => {
          resolve(token);
        },
        "error-callback": () => {
          reject(new Error("Bot verification failed. Please try again."));
        },
      });
    });
  };

  const passwordChecks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    {
      label: "Passwords match",
      met: confirmPassword.length > 0 && password === confirmPassword,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreed) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    setLoading(true);

    try {
      const turnstileToken = await getTurnstileToken();

      const res = await fetch(`${API_BASE}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          password_confirm: confirmPassword,
          first_name: firstName,
          last_name: lastName,
          agreed_to_terms: agreed,
          turnstile_token: turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle field-specific errors from DRF
        const messages: string[] = [];
        if (typeof data === "object") {
          for (const key of Object.keys(data)) {
            const val = data[key];
            if (Array.isArray(val)) {
              messages.push(...val);
            } else if (typeof val === "string") {
              messages.push(val);
            }
          }
        }
        throw new Error(messages.join(" ") || "Registration failed.");
      }

      // Redirect to OTP verification page with email
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/30 px-4 py-12">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad"
        strategy="afterInteractive"
        onReady={() => {
          (window as any).onTurnstileLoad = onTurnstileLoad;
          if (window.turnstile) onTurnstileLoad();
        }}
      />
      <div id="turnstile-container" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="Perkify" fill className="object-contain" priority />
            </div>
            <span className="text-2xl font-bold text-gray-900">Perkify</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-500">
            Start swapping and selling gift cards in minutes
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-7 sm:p-8">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-5">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="input-field pl-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            {/* Password Strength */}
            {password.length > 0 && (
              <div className="space-y-2">
                {passwordChecks.map((check, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-xs ${
                      check.met ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <CheckCircle2
                      size={14}
                      className={
                        check.met ? "text-green-500" : "text-gray-300"
                      }
                    />
                    {check.label}
                  </div>
                ))}
              </div>
            )}

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{" "}
                <a href="/terms" className="text-primary-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-primary-600 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <ArrowRight size={18} className="ml-2" />}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
