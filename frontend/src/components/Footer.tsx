import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

const footerLinks = {
  Platform: [
    { href: "/how-it-works", label: "How It Works" },
    { href: "/marketplace", label: "Browse Marketplace" },
    { href: "/auth/register", label: "Create Account" },
  ],
  Company: [
    { href: "/about", label: "About Perkify" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/marketplace", label: "Marketplace" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/cookie-policy", label: "Cookie Policy" },
  ],
  Support: [
    { href: "/help", label: "Help Center" },
    { href: "/safety-guide", label: "Safety Guide" },
    { href: "/contact", label: "Contact Us" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* CTA Banner */}
      <div className="border-b border-gray-800">
        <div className="container-main mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjYSkiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50" />
            <div className="relative">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                Start Swapping Gift Cards Today
              </h3>
              <p className="text-primary-100 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                Join thousands of users trading gift cards with escrow
                protection. Turn your unused cards into something you actually
                want.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link
                  href="/auth/register"
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-primary-700 bg-white rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:-translate-y-0.5"
                >
                  Start Trading Free
                </Link>
                <Link
                  href="/marketplace"
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all"
                >
                  Browse Marketplace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-main mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-base">P</span>
              </div>
              <span className="text-xl font-bold text-white">Perkify</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-2 max-w-xs">
              Gift Card Swap &amp; Sell Platform
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              The trusted marketplace for swapping and selling unused gift cards
              with escrow protection. Trade with confidence.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-gray-400">
                <Mail size={16} className="text-primary-400 shrink-0" />
                <span>support@perkify.com</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-400">
                <Phone size={16} className="text-primary-400 shrink-0" />
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-400">
                <MapPin size={16} className="text-primary-400 shrink-0" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-main mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Perkify. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-500 hover:text-primary-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-500 hover:text-primary-400 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
