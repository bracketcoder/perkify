import Link from "next/link";
import { Users, ArrowLeft, Shield, Zap, Heart } from "lucide-react";

export const metadata = {
  title: "About — Perkify",
  description:
    "Learn about Perkify — the trusted platform for swapping and selling gift cards.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="relative container-main mx-auto section-padding text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 backdrop-blur border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
            <Users size={16} />
            Our Story
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            About Perkify
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            A smarter way to swap and sell gift cards you don&apos;t need for
            ones you actually want.
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
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                What Is Perkify?
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Perkify is a peer-to-peer platform that lets you swap unwanted
                gift cards with other users or sell them for value. Whether you
                received a gift card to a store you never visit or you&apos;d
                rather have credit somewhere else, Perkify makes it simple to
                find a match and trade securely.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                How It Works
              </h2>
              <p className="text-gray-600 leading-relaxed">
                List your gift card, set whether you want to swap or sell, and
                our AI-powered matching system connects you with the best trade
                partner. Every transaction is protected by our escrow system —
                card details stay encrypted until both parties confirm, and codes
                are released simultaneously so no one is left empty-handed.
              </p>
            </div>

            {/* Values */}
            <div className="grid sm:grid-cols-3 gap-6 !mt-12">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield size={24} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Security First
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Encrypted card data, escrow protection, and real-time fraud
                  monitoring keep every trade safe.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap size={24} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Fast Matching
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Our AI matching algorithm analyzes value, brand preference, and
                  reputation to find the best trade for you.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Fair for Everyone
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  A flat 5% fee on each side of every trade — transparent
                  pricing with no hidden charges.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Our Mission
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Billions of dollars in gift card value go unused every year.
                Perkify exists to change that. We believe everyone should be able
                to turn unwanted gift cards into something they actually value —
                quickly, safely, and with complete peace of mind.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Have questions or feedback? Reach out at{" "}
                <a
                  href="mailto:support@perkify.com"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  support@perkify.com
                </a>
                . We&apos;d love to hear from you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
