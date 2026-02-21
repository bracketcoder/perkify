"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Camera } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { apiCall } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [needsAvatar, setNeedsAvatar] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/auth/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    const checkAvatar = async () => {
      try {
        const res = await apiCall("auth/profile/");
        if (res.ok) {
          const data = await res.json();
          setNeedsAvatar(!data.has_avatar);
        }
      } catch {
        // ignore
      }
    };
    checkAvatar();
  }, [authorized]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DashboardSidebar />
      {/* Main Content — offset for sidebar */}
      <div className="lg:ml-64 xl:ml-72">
        {/* Top spacing for mobile top bar */}
        <div className="pt-16 lg:pt-0">
          {/* Avatar required banner */}
          {needsAvatar && pathname !== "/dashboard/profile" && (
            <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <Camera size={18} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 flex-1">
                <span className="font-semibold">Profile image required.</span>{" "}
                Upload a photo before you can trade or purchase gift cards.
              </p>
              <Link
                href="/dashboard/profile"
                className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Add Photo
              </Link>
            </div>
          )}
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
