import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export const metadata = {
  title: "Safety Guide — Perkify",
  description:
    "Stay safe while trading gift cards on Perkify. Learn how to protect yourself from scams and fraud.",
};

export default function SafetyGuidePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="relative container-main mx-auto section-padding text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 backdrop-blur border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
            <ShieldAlert size={16} />
            Stay Protected
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Safety Guide
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Tips and best practices to trade safely on Perkify
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

          <div className="prose prose-gray max-w-none space-y-10">
            {/* How Perkify protects you */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                How Perkify Protects You
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Perkify is built with multiple layers of protection to keep your
                trades safe:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Escrow Protection",
                    desc: "Card details are encrypted and only released simultaneously after both parties confirm the trade.",
                  },
                  {
                    title: "Encrypted Card Data",
                    desc: "Card numbers and PINs are encrypted with Fernet encryption the moment you submit them — never stored in plain text.",
                  },
                  {
                    title: "Fraud Monitoring",
                    desc: "Our automated system flags suspicious activity like rapid trades, repeated disputes, and abnormal patterns.",
                  },
                  {
                    title: "Trade Limits",
                    desc: "Daily trade limits are enforced based on your trust tier, preventing large-scale fraud from new accounts.",
                  },
                  {
                    title: "Confirmation Window",
                    desc: "You get 30–60 minutes after code release to verify the card works before the trade finalizes.",
                  },
                  {
                    title: "Reputation System",
                    desc: "Trust scores and verified badges help you identify reliable trading partners.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="bg-green-50 border border-green-100 rounded-xl p-5"
                  >
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Do's */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Safe Trading Practices
              </h2>
              <div className="space-y-3">
                {[
                  "Always verify the gift card balance before listing it on Perkify.",
                  "Use the confirmation window to test the card you received before the trade finalizes.",
                  "Check the other user's trust score and trade history before accepting a swap.",
                  "Keep your account credentials secure and never share your password.",
                  "File a dispute immediately if a card you received doesn't work.",
                  "Only trade through the Perkify platform — never share card details outside the escrow system.",
                  "Enable email notifications so you don't miss confirmation deadlines.",
                ].map((tip) => (
                  <div
                    key={tip}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <CheckCircle2
                      size={18}
                      className="text-green-500 shrink-0 mt-0.5"
                    />
                    <p className="text-gray-700 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Don'ts */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                What to Avoid
              </h2>
              <div className="space-y-3">
                {[
                  "Never list a gift card that has already been used or partially redeemed.",
                  "Don't share card details outside of Perkify's escrow system.",
                  "Avoid trading with users who ask to complete the transaction off-platform.",
                  "Don't create multiple accounts to bypass trade limits.",
                  "Never ignore the confirmation window — failing to verify could mean losing your dispute rights.",
                ].map((tip) => (
                  <div
                    key={tip}
                    className="flex items-start gap-3 p-3 bg-red-50 rounded-lg"
                  >
                    <XCircle
                      size={18}
                      className="text-red-500 shrink-0 mt-0.5"
                    />
                    <p className="text-gray-700 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Red flags */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Red Flags to Watch For
              </h2>
              <div className="space-y-3">
                {[
                  "A user asking you to trade outside Perkify or communicate on another platform.",
                  "Gift cards with unusually high values from brand-new accounts with zero trade history.",
                  "Pressure to skip the confirmation window or finalize a trade immediately.",
                  "Offers that seem too good to be true — like a $500 card being swapped for a $100 card.",
                  "Users who repeatedly file disputes or have a high dispute ratio.",
                ].map((flag) => (
                  <div
                    key={flag}
                    className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg"
                  >
                    <AlertTriangle
                      size={18}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <p className="text-gray-700 text-sm">{flag}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Report */}
            <div className="bg-primary-50 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Report Suspicious Activity
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you encounter anything suspicious — a fraudulent card, a user
                behaving dishonestly, or any platform abuse — report it
                immediately. You can file a dispute from the trade page or
                contact our support team directly.
              </p>
              <a
                href="mailto:support@perkify.com"
                className="inline-flex items-center gap-2 btn-primary px-6 py-3"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
