"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  PlusCircle,
  Store,
  ArrowLeftRight,
  Sparkles,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { apiCall } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  wallet_balance: number;
}

const navSections: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ],
  },
  {
    title: "Gift Cards",
    items: [
      { href: "/dashboard/my-gift-cards", label: "My Cards", icon: CreditCard },
      { href: "/dashboard/add-gift-card", label: "Add Card", icon: PlusCircle },
      { href: "/dashboard/marketplace", label: "Browse", icon: Store },
    ],
  },
  {
    title: "Trading",
    items: [
      { href: "/dashboard/matches", label: "AI Matches", icon: Sparkles },
      { href: "/dashboard/transactions", label: "My Trades", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/dashboard/profile", label: "Profile", icon: User },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    ],
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiCall("auth/profile/");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch {
        // silently fail
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await apiCall("notifications/?read=false");
        if (res.ok) {
          const data = await res.json();
          const count = Array.isArray(data) ? data.length : data.count || 0;
          setNotifCount(count);
        }
      } catch {
        // silently fail
      }
    };

    fetchProfile();
    fetchNotifications();
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/auth/login");
  };

  const getInitials = () => {
    if (!profile) return "U";
    const first = profile.first_name?.charAt(0) || "";
    const last = profile.last_name?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (!profile) return "User";
    const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    return name || "User";
  };

  const getBalance = () => {
    if (!profile) return "$0.00";
    return `$${parseFloat(profile.wallet_balance || "0").toFixed(2)}`;
  };

  // Inject notification badge count dynamically
  const getSections = (): NavSection[] => {
    return navSections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.href === "/dashboard/notifications" && notifCount > 0) {
          return { ...item, badge: notifCount };
        }
        return item;
      }),
    }));
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-9 h-9">
            <Image
              src="/logo.png"
              alt="Perkify"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold text-gray-900">Perkify</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {getDisplayName()}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {profile?.email || "Loading..."}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-xl">
          <Wallet size={16} className="text-primary-600" />
          <span className="text-sm font-semibold text-primary-700">
            {getBalance()}
          </span>
          <span className="text-xs text-primary-500">Balance</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {getSections().map((section, si) => (
          <div key={si}>
            {section.title && (
              <div className="px-4 pt-5 pb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {section.title}
                </span>
              </div>
            )}
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    active
                      ? "bg-primary-50 text-primary-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    size={20}
                    className={
                      active
                        ? "text-primary-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    }
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <ChevronRight size={16} className="text-primary-400" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
        >
          <LogOut
            size={20}
            className="text-gray-400 group-hover:text-red-500"
          />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-16 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image
              src="/logo.png"
              alt="Perkify"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-lg font-bold text-gray-900">Perkify</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 xl:w-72 bg-white border-r border-gray-100 flex-col z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
