"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const TURNSTILE_SITE_KEY = "0x4AAAAAACcbrWuiO2lrJOCd";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const turnstileRef = useRef<string | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const onTurnstileLoad = useCallback(() => {
    if (typeof window !== "undefined" && window.turnstile) {
      widgetIdRef.current = window.turnstile.render("#turnstile-container", {
        sitekey: TURNSTILE_SITE_KEY,
        size: "invisible",
        callback: (token: string) => {
          turnstileRef.current = token;
        },
      });
    }
  }, []);

  const getTurnstileToken = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.turnstile || widgetIdRef.current === null) {
        reject(new Error("Turnstile not loaded"));
        return;
      }
      // Reset and execute to get a fresh token
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const turnstileToken = await getTurnstileToken();

      const res = await fetch(`${API_BASE}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstile_token: turnstileToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || data.error || "Invalid email or password."
        );
      }

      // Store tokens (API returns { tokens: { access, refresh } })
      const tokens = data.tokens || data;
      if (tokens.access) localStorage.setItem("access_token", tokens.access);
      if (tokens.refresh) localStorage.setItem("refresh_token", tokens.refresh);

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
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
          // If turnstile already loaded before onReady
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
            Welcome Back
          </h1>
          <p className="text-gray-500">
            Log in to manage your gift card trades
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-7 sm:p-8">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-5">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Log In"}
              {!loading && <ArrowRight size={18} className="ml-2" />}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </section>
  );
}
