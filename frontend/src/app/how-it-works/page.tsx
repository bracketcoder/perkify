import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Lock,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Repeat,
  DollarSign,
  Clock,
  MessageSquare,
  Star,
  Eye,
  AlertTriangle,
} from "lucide-react";

export const metadata = {
  title: "How It Works — Perkify",
  description:
    "Learn how to swap and sell gift cards on Perkify with escrow protection, AI matching, and fair 5% fees.",
};

/* ───────── Hero ───────── */
function PageHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
      <div className="relative container-main mx-auto section-padding text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 backdrop-blur border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
          <CheckCircle2 size={16} />
          Safe &amp; Simple
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
          How{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-300">
            Perkify
          </span>{" "}
          Works
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          From listing your gift card to completing a secure trade — here&apos;s
          everything you need to know about our escrow-protected platform.
        </p>
      </div>
    </section>
  );
}

/* ───────── Three Steps ───────── */
function DetailedSteps() {
  const steps = [
    {
      step: 1,
      icon: CreditCard,
      title: "List Your Gift Card",
      description:
        "Add your gift card to the marketplace in under a minute. Enter the brand, balance amount, and your card PIN — which is encrypted immediately. Choose whether you want to sell the card for cash or swap it for another brand you prefer.",
      details: [
        "Select from hundreds of supported brands",
        "Enter balance amount and card details",
        "PIN is encrypted end-to-end — never stored in plain text",
        "Set your price or mark it available for swap",
      ],
      gradient: "from-primary-500 to-primary-600",
      bgLight: "bg-primary-50",
    },
    {
      step: 2,
      icon: Sparkles,
      title: "Get Matched by AI or Browse",
      description:
        "Our AI matching engine analyzes your listing and finds the best possible trade or buyer. If you prefer, browse the marketplace yourself, filter by brand or value, and pick a deal that works for you.",
      details: [
        "AI suggests optimal matches based on your preferences",
        "Browse and filter the full marketplace",
        "See seller ratings and trade history",
        "Make or receive offers instantly",
      ],
      gradient: "from-accent-500 to-accent-600",
      bgLight: "bg-accent-50",
    },
    {
      step: 3,
      icon: Repeat,
      title: "Trade with Escrow Protection",
      description:
        "Once both parties accept the trade, Perkify&apos;s escrow system holds both card codes. After mutual confirmation, codes are released simultaneously — so neither party risks being scammed.",
      details: [
        "Both cards held in secure escrow",
        "Simultaneous code release on confirmation",
        "60-minute confirmation window for verification",
        "Automatic dispute resolution if issues arise",
      ],
      gradient: "from-primary-600 to-primary-700",
      bgLight: "bg-primary-50",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-main mx-auto">
        <div className="space-y-16 sm:space-y-20 lg:space-y-24">
          {steps.map((item, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              } items-center gap-10 lg:gap-16`}
            >
              {/* Visual Card */}
              <div className="flex-1 w-full">
                <div
                  className={`${item.bgLight} rounded-3xl p-8 sm:p-12 relative overflow-hidden`}
                >
                  <div className="absolute top-4 right-4 text-[120px] sm:text-[160px] font-black text-black/[0.03] leading-none select-none">
                    {item.step}
                  </div>
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-xl mb-6`}
                  >
                    <item.icon size={32} />
                  </div>
                  <div className="space-y-3">
                    {item.details.map((detail, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-3 text-gray-700"
                      >
                        <CheckCircle2
                          size={18}
                          className="text-primary-500 shrink-0"
                        />
                        <span className="text-sm sm:text-base">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 w-full">
                <div className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-3">
                  Step {item.step} of 3
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {item.title}
                </h2>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Fee Explanation ───────── */
function FeeExplanation() {
  const fees = [
    {
      icon: Repeat,
      title: "Swaps",
      fee: "5% per person",
      description:
        "When two users swap gift cards, each party pays a 5% fee based on their card's value. Fair and balanced.",
      gradient: "from-primary-500 to-primary-600",
      bg: "bg-primary-50",
    },
    {
      icon: DollarSign,
      title: "Sales",
      fee: "5% seller fee",
      description:
        "When selling a gift card for cash, only the seller pays a 5% fee. Buyers pay the listed price — no hidden charges.",
      gradient: "from-accent-500 to-accent-600",
      bg: "bg-accent-50",
    },
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-main mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-600 text-sm font-medium mb-4">
            <DollarSign size={16} />
            Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simple, Fair Fees
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            No hidden costs, no surprise charges. Just a simple 5% fee that keeps
            the platform running.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {fees.map((item, i) => (
            <div key={i} className="card p-7 sm:p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-[80px] -z-0" />
              <div className="relative">
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <item.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full text-primary-600 text-sm font-bold mb-4">
                  {item.fee}
                </div>
                <p className="text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Trust & Safety ───────── */
function TrustAndSafety() {
  const features = [
    {
      icon: Lock,
      title: "Encrypted Card PINs",
      description:
        "Card PINs and codes are encrypted end-to-end. They are only decrypted and revealed after both parties confirm the trade.",
    },
    {
      icon: Shield,
      title: "Escrow Protection",
      description:
        "Both cards are held in escrow during a trade. Codes are released simultaneously so neither party can scam the other.",
    },
    {
      icon: BadgeCheck,
      title: "Verified Users",
      description:
        "Email verification, trust scores, and trade history help you trade with confidence and avoid bad actors.",
    },
    {
      icon: Clock,
      title: "Confirmation Window",
      description:
        "After codes are released, both parties have a 60-minute window to verify the card works before the trade is finalized.",
    },
    {
      icon: AlertTriangle,
      title: "Dispute Resolution",
      description:
        "If something goes wrong, our dedicated support team reviews evidence and resolves disputes fairly for both parties.",
    },
    {
      icon: Star,
      title: "Reputation System",
      description:
        "Rate and review every trade partner. High-reputation users get priority matching and trust badges on their profiles.",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-main mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
            <Shield size={16} />
            Trust &amp; Safety
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Your Safety Comes First
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Multiple layers of protection ensure every gift card trade on Perkify
            is secure
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((f, i) => (
            <div key={i} className="card p-6 sm:p-7">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 mb-4">
                <f.icon size={24} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {f.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── CTA ───────── */
function BottomCTA() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-main mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-gray-600 text-lg max-w-xl mx-auto mb-8">
          Create your free account and start swapping or selling gift cards in
          minutes. Escrow-protected, always.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/auth/register"
            className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
          >
            Sign Up Free
            <ArrowRight size={20} className="ml-2" />
          </Link>
          <Link
            href="/marketplace"
            className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────── Page ───────── */
export default function HowItWorksPage() {
  return (
    <>
      <PageHero />
      <DetailedSteps />
      <FeeExplanation />
      <TrustAndSafety />
      <BottomCTA />
    </>
  );
}
