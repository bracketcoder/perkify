import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Perkify",
  description:
    "Read the Terms of Service for using the Perkify gift card trading platform.",
};

export default function TermsOfServicePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="relative container-main mx-auto section-padding text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 backdrop-blur border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
            <FileText size={16} />
            Legal Agreement
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Terms of Service
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
              <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By creating an account or using the Perkify platform, you agree to be bound by these
                Terms of Service. If you do not agree to these terms, you may not use our services.
                Perkify reserves the right to update these terms at any time. Continued use of the
                platform after changes constitutes acceptance of the updated terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Account Requirements</h2>
              <p className="text-gray-600 leading-relaxed mb-4">To use Perkify, you must:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Provide accurate and complete registration information</li>
                <li>Verify your email address before listing gift cards</li>
                <li>Maintain the security of your account credentials</li>
                <li>Not create multiple accounts or share account access</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                You are responsible for all activity that occurs under your account. Notify us
                immediately if you suspect unauthorized access.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Gift Card Listings</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                When listing a gift card on Perkify, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>You are the legitimate owner of the gift card</li>
                <li>The gift card has not been previously used, redeemed, or reported stolen</li>
                <li>The balance listed is accurate and the card has not expired</li>
                <li>The card number and PIN you provide are correct</li>
                <li>The gift card was obtained through lawful means</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Listing a partially used, invalid, or stolen gift card is a violation of these terms
                and may result in immediate account suspension or permanent ban.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Trading &amp; Escrow</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Perkify facilitates trades between users using an escrow-style system:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>When a trade is accepted, both gift cards are locked in escrow</li>
                <li>Card details are not revealed until both parties confirm</li>
                <li>Codes are released simultaneously to protect both parties</li>
                <li>Users have a 30-60 minute confirmation window to verify the card works</li>
                <li>If no dispute is filed within the window, the trade finalizes automatically</li>
                <li>Filing a dispute temporarily restricts both accounts pending review</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Fees</h2>
              <p className="text-gray-600 leading-relaxed">
                Perkify charges a 5% platform fee on all transactions. For swaps, each party pays 5%
                of their card&apos;s value. For sales, the seller pays 5% of the sale amount. Fees are
                non-refundable once a trade is completed. Fee rates may change with notice to users.
                Current fee rates are always displayed before confirming a trade.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Trade Limits</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To prevent fraud, trade limits are applied based on your trust tier:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>New users (Tier 0): $200/day limit, 3 trades/day, 1 active trade at a time</li>
                <li>Established users (Tier 1, 5+ successful trades): $500/day, 10 trades/day</li>
                <li>Trusted users (Tier 2, 20+ successful trades): $2,000/day, 25 trades/day</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Limits are automatically increased as you build a positive trade history.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Prohibited Conduct</h2>
              <p className="text-gray-600 leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>List stolen, counterfeit, or fraudulent gift cards</li>
                <li>Manipulate trades, prices, or the reputation system</li>
                <li>Use automated tools or bots to interact with the platform</li>
                <li>Circumvent trade limits or fraud detection systems</li>
                <li>Harass, threaten, or abuse other users</li>
                <li>Attempt to access other users&apos; accounts or data</li>
                <li>Use the platform for money laundering or other illegal purposes</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Account Suspension &amp; Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                Perkify reserves the right to freeze, suspend, or permanently ban accounts that
                violate these Terms of Service. Automated fraud monitoring may temporarily restrict
                accounts flagged for suspicious activity. Administrators can reverse trades within the
                confirmation window if fraud is detected. Users may appeal account actions by
                contacting support.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Dispute Resolution</h2>
              <p className="text-gray-600 leading-relaxed">
                If a dispute arises during a trade, both parties should file a dispute through the
                platform within the confirmation window. Our admin team will review the evidence and
                issue a resolution. Perkify&apos;s decision on disputes is final. Repeated frivolous
                disputes may result in account restrictions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                Perkify provides a platform for users to trade gift cards. We do not guarantee the
                value, validity, or authenticity of gift cards listed by users. While our escrow system
                and fraud prevention measures reduce risk, Perkify is not liable for losses resulting
                from trades between users. Use the platform at your own discretion.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">11. User Responsibility &amp; Legal Compliance</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                By using Perkify, you acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>
                  You are solely responsible for ensuring that your use of the platform complies with
                  all applicable local, state, federal, and international laws and regulations.
                </li>
                <li>
                  Any illegal activity conducted through Perkify — including but not limited to fraud,
                  money laundering, trafficking in stolen goods, or tax evasion — is strictly prohibited
                  and will be reported to the relevant authorities.
                </li>
                <li>
                  Users who engage in illegal activity are subject to prosecution and punishment under
                  applicable local, state, federal, and international laws.
                </li>
                <li>
                  Perkify is not responsible for, and shall not be held liable for, any illegal actions
                  taken by users on or through the platform. Users assume full legal responsibility for
                  their conduct.
                </li>
                <li>
                  Perkify reserves the right to cooperate fully with law enforcement agencies and to
                  disclose user information as required by law or legal process.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">12. Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                For questions about these Terms of Service, contact us at{" "}
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
