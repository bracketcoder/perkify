import Link from "next/link";
import { Cookie, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Cookie Policy — Perkify",
  description:
    "Understand how Perkify uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="relative container-main mx-auto section-padding text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 backdrop-blur border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
            <Cookie size={16} />
            Cookie Information
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Cookie Policy
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Last updated: February 14, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="container-main mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="prose prose-gray max-w-none space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">What Are Cookies?</h2>
              <p className="text-gray-600 leading-relaxed">
                Cookies are small text files stored on your device when you visit a website. They help
                the site remember your preferences and improve your browsing experience. Perkify uses
                cookies and similar technologies to provide, secure, and improve our platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Cookies We Use</h2>

              <div className="bg-gray-50 rounded-xl p-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-2">
                  Required for the platform to function. These cannot be disabled.
                </p>
                <ul className="list-disc pl-6 text-gray-600 text-sm space-y-1">
                  <li>Authentication tokens (JWT access and refresh tokens)</li>
                  <li>CSRF protection tokens</li>
                  <li>Session security identifiers</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Functional Cookies</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-2">
                  Enhance your experience by remembering preferences.
                </p>
                <ul className="list-disc pl-6 text-gray-600 text-sm space-y-1">
                  <li>Dashboard layout preferences</li>
                  <li>Marketplace filter settings</li>
                  <li>Notification preferences</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Cookies</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-2">
                  Help us detect and prevent fraud and unauthorized access.
                </p>
                <ul className="list-disc pl-6 text-gray-600 text-sm space-y-1">
                  <li>IP address tracking for multi-IP fraud detection</li>
                  <li>Rate limiting counters for authentication endpoints</li>
                  <li>Device fingerprinting for suspicious activity alerts</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Local Storage</h2>
              <p className="text-gray-600 leading-relaxed">
                In addition to cookies, Perkify uses browser local storage to store your JWT
                authentication tokens (access and refresh tokens). These tokens are required to
                maintain your logged-in session and are cleared when you log out.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Managing Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                Most browsers allow you to control cookies through their settings. You can block or
                delete cookies, but this may affect your ability to use Perkify. Disabling essential
                cookies will prevent you from logging in or completing trades. For instructions on
                managing cookies, refer to your browser&apos;s help documentation.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                For questions about our cookie practices, contact us at{" "}
                <a href="mailto:support@perkify.com" className="text-primary-600 hover:text-primary-700 font-medium">
                  support@perkify.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
