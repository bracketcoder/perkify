import Link from "next/link";
import {
  ArrowRight,
  Shield,
  DollarSign,
  BadgeCheck,
  Sparkles,
  ChevronRight,
  Zap,
  Gift,
  Star,
  TrendingUp,
  Users,
  Repeat,
  CreditCard,
} from "lucide-react";

/* ───────── Hero Section ───────── */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-400/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div className="relative container-main mx-auto section-padding">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 backdrop-blur border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6 sm:mb-8">
            <Shield size={16} />
            <span>Escrow-Protected Gift Card Trading</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
            Swap &amp; Sell Gift Cards{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-300">
              Instantly
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Perkify is the trusted marketplace to trade, swap, or sell your
            unwanted gift cards. AI-powered matching, escrow protection, and a
            5% fair fee keep every transaction safe and simple.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-primary-400 rounded-xl hover:bg-primary-300 transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-400/30 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
            >
              Start Trading
              <ArrowRight size={20} className="ml-2" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-gray-600 rounded-xl hover:bg-white/5 hover:border-gray-500 transition-all duration-200 w-full sm:w-auto"
            >
              Browse Marketplace
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {[
              { value: "Escrow Protected", icon: Shield, label: "Secure trades" },
              { value: "5% Fair Fee", icon: DollarSign, label: "Per transaction" },
              { value: "Verified Users", icon: BadgeCheck, label: "Trusted traders" },
              { value: "AI Matching", icon: Sparkles, label: "Smart pairing" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/10"
              >
                <item.icon
                  size={20}
                  className="text-primary-400 mx-auto mb-2"
                />
                <div className="text-sm sm:text-base font-bold text-white">
                  {item.value}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── How It Works Preview ───────── */
function HowItWorksPreview() {
  const steps = [
    {
      step: "01",
      icon: CreditCard,
      title: "List Your Card",
      description:
        "Add your gift card details — brand, balance, and encrypted PIN. Set a price or offer it for a swap.",
      color: "from-primary-500 to-primary-600",
    },
    {
      step: "02",
      icon: Sparkles,
      title: "Get Matched",
      description:
        "Our AI matches you with the best trade or buyer. Or browse the marketplace yourself to find the perfect deal.",
      color: "from-accent-500 to-accent-600",
    },
    {
      step: "03",
      icon: Repeat,
      title: "Swap or Sell",
      description:
        "Complete the trade with escrow protection. Both card codes are released simultaneously so nobody gets burned.",
      color: "from-primary-600 to-primary-700",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-main mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-600 text-sm font-medium mb-4">
            <Zap size={16} />
            Simple Process
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Three easy steps to turn your unused gift cards into something you
            actually want
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
          {steps.map((item, i) => (
            <div key={i} className="relative group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-gray-200 to-gray-100 z-0" />
              )}
              <div className="relative card-hover p-6 sm:p-8 text-center z-10">
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${item.color} text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <item.icon size={28} />
                </div>
                <div className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-2">
                  Step {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors group"
          >
            Learn more about how it works
            <ChevronRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────── Featured Brands ───────── */
function FeaturedBrands() {
  const brands = [
    { name: "Amazon", color: "bg-orange-500", cards: "1,200+" },
    { name: "Walmart", color: "bg-blue-600", cards: "980+" },
    { name: "Target", color: "bg-red-600", cards: "750+" },
    { name: "Starbucks", color: "bg-green-700", cards: "620+" },
    { name: "Apple", color: "bg-gray-800", cards: "540+" },
    { name: "Nike", color: "bg-black", cards: "430+" },
    { name: "Best Buy", color: "bg-blue-700", cards: "380+" },
    { name: "Sephora", color: "bg-black", cards: "310+" },
    { name: "Uber", color: "bg-black", cards: "290+" },
    { name: "Netflix", color: "bg-red-700", cards: "270+" },
    { name: "Visa", color: "bg-blue-800", cards: "250+" },
    { name: "Home Depot", color: "bg-orange-600", cards: "220+" },
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-main mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-600 text-sm font-medium mb-4">
            <Gift size={16} />
            Popular Brands
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Featured Brands
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Trade gift cards from hundreds of top brands. New brands added every
            week.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
          {brands.map((brand) => (
            <div
              key={brand.name}
              className="card-hover p-5 sm:p-6 text-center group cursor-pointer"
            >
              <div
                className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 ${brand.color} rounded-2xl text-white text-xl sm:text-2xl font-bold mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                {brand.name.charAt(0)}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                {brand.name}
              </h3>
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 rounded-full">
                <CreditCard size={12} className="text-primary-500" />
                <span className="text-xs font-semibold text-primary-600">
                  {brand.cards}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 sm:mt-12">
          <Link href="/marketplace" className="btn-primary">
            Browse All Cards
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────── Stats Section ───────── */
function Stats() {
  const stats = [
    {
      value: "25,000+",
      label: "Trades Completed",
      icon: TrendingUp,
      description: "Successful gift card trades on the platform",
    },
    {
      value: "12,000+",
      label: "Active Users",
      icon: Users,
      description: "Verified traders in our community",
    },
    {
      value: "98.5%",
      label: "Success Rate",
      icon: Star,
      description: "Trades completed without disputes",
    },
    {
      value: "$2.1M+",
      label: "Total Value Traded",
      icon: DollarSign,
      description: "Gift card value exchanged on Perkify",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-main mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-50 rounded-full text-accent-600 text-sm font-medium mb-4">
            <TrendingUp size={16} />
            Platform Stats
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Our growing community of traders proves that Perkify is the safest
            way to swap and sell gift cards
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="card p-6 sm:p-8 text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 mb-4 group-hover:scale-110 transition-transform duration-300">
                <stat.icon size={24} className="text-primary-600" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-primary-600 mb-2">
                {stat.label}
              </div>
              <p className="text-xs text-gray-400">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Final CTA ───────── */
function FinalCTA() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-main mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Ready to Start Trading?
        </h2>
        <p className="text-gray-600 text-lg max-w-xl mx-auto mb-8">
          Join Perkify today and turn your unused gift cards into something you
          actually want. It&apos;s free, fast, and escrow-protected.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/auth/register"
            className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
          >
            Start Trading
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
export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorksPreview />
      <FeaturedBrands />
      <Stats />
      <FinalCTA />
    </>
  );
}
