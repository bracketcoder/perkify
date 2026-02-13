import Link from "next/link";
import { Mail, ArrowLeft, Clock, MessageSquare, Shield } from "lucide-react";

export const metadata = {
  title: "Contact Us — Perkify",
  description:
    "Get in touch with the Perkify team for support, questions, or feedback.",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="relative container-main mx-auto section-padding text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 backdrop-blur border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-6">
            <Mail size={16} />
            Get In Touch
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Contact Us
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            We&apos;re here to help with any questions or concerns
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

          <div className="grid md:grid-cols-2 gap-10">
            {/* Left — Contact info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  How Can We Help?
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Whether you have a question about trading, need help with your
                  account, or want to report an issue — our team is ready to
                  assist.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                    <Mail size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Email Support
                    </h3>
                    <p className="text-gray-600 text-sm mb-1">
                      For general inquiries and account help
                    </p>
                    <a
                      href="mailto:support@perkify.com"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      support@perkify.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Response Time
                    </h3>
                    <p className="text-gray-600 text-sm">
                      We typically respond within 24 hours during business days.
                      Urgent trade disputes are prioritized.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Trade Disputes
                    </h3>
                    <p className="text-gray-600 text-sm">
                      For active trade issues, use the &quot;File Dispute&quot;
                      button on the trade page for faster resolution.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                    <Shield size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Report Fraud
                    </h3>
                    <p className="text-gray-600 text-sm">
                      To report suspicious activity or fraud, email us with
                      details and we&apos;ll investigate immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Quick links */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Before You Contact Us
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Many common questions are already answered in our resources:
                </p>
                <div className="space-y-3">
                  <Link
                    href="/help"
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <MessageSquare
                        size={16}
                        className="text-primary-600"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Help Center
                      </p>
                      <p className="text-xs text-gray-500">
                        FAQs and how-to guides
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/safety-guide"
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <Shield size={16} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Safety Guide
                      </p>
                      <p className="text-xs text-gray-500">
                        Tips for safe trading
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/terms"
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <Mail size={16} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Terms of Service
                      </p>
                      <p className="text-xs text-gray-500">
                        Platform rules and policies
                      </p>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="bg-primary-50 rounded-2xl p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email Us Directly
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Our support team is ready to help.
                </p>
                <a
                  href="mailto:support@perkify.com"
                  className="inline-flex items-center gap-2 btn-primary px-6 py-3"
                >
                  <Mail size={18} />
                  support@perkify.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
