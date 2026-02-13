import Link from "next/link";
import {
  HelpCircle,
  ArrowLeft,
  UserPlus,
  CreditCard,
  ArrowLeftRight,
  ShoppingCart,
  ShieldCheck,
  AlertTriangle,
  Star,
  Settings,
} from "lucide-react";

export const metadata = {
  title: "Help Center — Perkify",
  description:
    "Find answers to common questions about swapping, selling, and managing gift cards on Perkify.",
};

const faqs = [
  {
    icon: UserPlus,
    title: "Getting Started",
    items: [
      {
        q: "How do I create an account?",
        a: "Click \"Sign Up\" on the homepage, enter your details, and verify your email address. You'll receive a verification link within a few minutes.",
      },
      {
        q: "Why do I need to verify my email?",
        a: "Email verification is required before you can list or trade gift cards. It helps us maintain a trusted community and prevent fraud.",
      },
      {
        q: "Can I change my username or email later?",
        a: "You can update your profile information from the Profile page in your dashboard at any time.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Listing Gift Cards",
    items: [
      {
        q: "How do I list a gift card?",
        a: 'Go to Dashboard → My Gift Cards → Add Gift Card. Enter the brand, value, expiry date, card number, and PIN. Choose whether you want to swap or sell.',
      },
      {
        q: "Is my card information secure?",
        a: "Absolutely. Card numbers and PINs are encrypted immediately using Fernet symmetric encryption. They are never stored in plain text and are only revealed during escrow release.",
      },
      {
        q: "Can I list a partially used gift card?",
        a: "No. You must confirm that the gift card has not been previously used before listing. Listing a used card violates our Terms of Service.",
      },
    ],
  },
  {
    icon: ArrowLeftRight,
    title: "Swapping Gift Cards",
    items: [
      {
        q: "How does a swap work?",
        a: "When you find a card you want, propose a swap with one of your listed cards. If the other user accepts, both cards are locked in escrow. Codes are released simultaneously once both parties confirm.",
      },
      {
        q: "What fees are charged?",
        a: "Each party pays a 5% platform fee based on their card's value. Fees are displayed before you confirm any trade.",
      },
      {
        q: "What is the confirmation window?",
        a: "After codes are released, you have 30–60 minutes to verify the card works. If no dispute is filed within this window, the trade finalizes automatically.",
      },
    ],
  },
  {
    icon: ShoppingCart,
    title: "Buying & Selling",
    items: [
      {
        q: "How do I sell a gift card?",
        a: 'List your card with the "Sell" option. When a buyer purchases it, you\'ll receive the sale amount minus the 5% platform fee.',
      },
      {
        q: "How do I buy a gift card?",
        a: 'Browse the marketplace for cards listed as "For Sale." Click Buy, confirm the purchase, and the card details will be released after the seller confirms.',
      },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Escrow & Security",
    items: [
      {
        q: "What is escrow protection?",
        a: "When a trade is accepted, both cards are locked in our system. Card details are not revealed until both parties confirm. This prevents either party from backing out after seeing the other's card.",
      },
      {
        q: "What happens if a card doesn't work?",
        a: 'File a dispute within the confirmation window using the "File Dispute" button. Our admin team will review the case and issue a resolution.',
      },
    ],
  },
  {
    icon: AlertTriangle,
    title: "Disputes & Fraud",
    items: [
      {
        q: "How do I file a dispute?",
        a: "During the confirmation window, click \"File Dispute\" on the trade page. Provide details about the issue. Both accounts are temporarily restricted until the dispute is resolved.",
      },
      {
        q: "What are trade limits?",
        a: "New users start with $200/day and 3 trades/day. As you build a positive trade history, limits increase automatically — up to $2,000/day for trusted users.",
      },
    ],
  },
  {
    icon: Star,
    title: "Reputation & Trust",
    items: [
      {
        q: "How does the trust score work?",
        a: "Your trust score is based on completed trades, successful trades, and disputes. Users with positive history earn a Verified badge and higher trade limits.",
      },
      {
        q: "What are trust tiers?",
        a: "Tier 0 (new): $200/day limit. Tier 1 (5+ successful trades): $500/day. Tier 2 (20+ successful trades): $2,000/day. Tiers upgrade automatically.",
      },
    ],
  },
  {
    icon: Settings,
    title: "Account & Settings",
    items: [
      {
        q: "How do I delete my account?",
        a: "Go to Profile → Danger Zone → Delete Account. Your personal data will be removed within 30 days. Anonymized transaction records may be retained for compliance.",
      },
      {
        q: "I forgot my password. What do I do?",
        a: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a password reset link.',
      },
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="relative container-main mx-auto section-padding text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 backdrop-blur border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
            <HelpCircle size={16} />
            Support
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Help Center
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about using Perkify
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

          <div className="space-y-10">
            {faqs.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                    <section.icon size={20} className="text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div
                      key={item.q}
                      className="bg-gray-50 rounded-xl p-5"
                    >
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        {item.q}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Still need help */}
          <div className="mt-12 bg-primary-50 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Still need help?
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Our support team is here to assist you.
            </p>
            <a
              href="mailto:support@perkify.com"
              className="inline-flex items-center gap-2 btn-primary px-6 py-3"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
