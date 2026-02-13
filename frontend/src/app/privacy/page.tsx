import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Perkify",
  description:
    "Learn how Perkify collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="relative container-main mx-auto section-padding text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 backdrop-blur border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
            <Shield size={16} />
            Your Privacy Matters
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Privacy Policy
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
              <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you create an account on Perkify, we collect the following information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Account information: name, email address, username, and password</li>
                <li>Profile information: phone number, location, and avatar (optional)</li>
                <li>Gift card details: brand, value, expiry date, card number, and PIN (encrypted)</li>
                <li>Transaction data: trade history, sales records, and dispute information</li>
                <li>Usage data: IP address, browser type, device information, and page interactions</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide, maintain, and improve our gift card trading platform</li>
                <li>Process trades, sales, and escrow transactions</li>
                <li>Match you with suitable trading partners using our AI matching system</li>
                <li>Send transaction confirmations, trade updates, and security alerts</li>
                <li>Detect and prevent fraud, unauthorized access, and policy violations</li>
                <li>Calculate and maintain trust scores and reputation metrics</li>
                <li>Comply with legal obligations and enforce our Terms of Service</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We take the security of your data seriously:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Gift card numbers and PINs are encrypted using Fernet symmetric encryption and are never stored in plain text</li>
                <li>Passwords are hashed using industry-standard algorithms</li>
                <li>All data is transmitted over HTTPS with TLS encryption</li>
                <li>We implement CSRF, XSS, and clickjacking protections</li>
                <li>Rate limiting is applied to authentication endpoints to prevent brute-force attacks</li>
                <li>Access to sensitive data is restricted to authorized personnel only</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Escrow &amp; Card Data</h2>
              <p className="text-gray-600 leading-relaxed">
                When you list a gift card, the card number and PIN are encrypted immediately upon
                submission. During an escrow trade, card details remain encrypted until both parties
                confirm the trade. After simultaneous code release, both users can view the decrypted
                card details. Card data is permanently deleted from our systems 30 days after a
                completed trade.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Information Sharing</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We do not sell your personal information. We may share limited data in these circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>With your trading partner: username, trust score, and trade history (not email or card details until escrow release)</li>
                <li>With service providers who help us operate the platform (email delivery, hosting)</li>
                <li>When required by law, subpoena, or legal process</li>
                <li>To protect the rights, safety, or property of Perkify and its users</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Fraud Monitoring</h2>
              <p className="text-gray-600 leading-relaxed">
                Our automated fraud detection system monitors for suspicious activity including rapid
                trades, repeated disputes, multiple IP addresses, and abnormal value patterns. Flagged
                accounts may be temporarily restricted pending admin review. This monitoring is essential
                to maintaining a safe trading environment for all users.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Access and download your personal data</li>
                <li>Correct inaccurate information on your profile</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of non-essential communications</li>
                <li>Request information about how your data is processed</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your account data for as long as your account is active. Transaction records
                and audit logs are retained for a minimum of 3 years for legal compliance. If you delete
                your account, personal data is removed within 30 days, though anonymized transaction
                records may be retained for platform analytics.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us
                at{" "}
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
