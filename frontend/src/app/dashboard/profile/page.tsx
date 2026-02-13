"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  BadgeCheck,
  Lock,
  Eye,
  EyeOff,
  Save,
  Star,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { apiCall } from "@/lib/api";

/* ───────── Types ───────── */
interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  is_verified: boolean;
  reputation_score: number;
  total_trades: number;
  successful_trades: number;
  disputes: number;
  trust_tier: string;
  member_since: string;
}

/* ───────── Section wrapper ───────── */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="p-5 sm:p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

/* ───────── Page ───────── */
export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await apiCall("auth/profile/");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setPhone(data.phone || "");
          setLocation(data.location || "");
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setSaveError("");
      setSaveSuccess(false);

      const res = await apiCall("auth/profile/", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone,
          location,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setSaveError(data?.detail || "Failed to update profile");
      }
    } catch {
      setSaveError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }
    if (!newPassword) {
      setPasswordError("Please enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      setPasswordSaving(true);

      const res = await apiCall("auth/change-password/", {
        method: "PUT",
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
          new_password_confirm: confirmPassword,
        }),
      });

      if (res.ok) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setPasswordError(data?.old_password?.[0] || data?.new_password_confirm?.[0] || data?.detail || "Failed to change password");
      }
    } catch {
      setPasswordError("Something went wrong");
    } finally {
      setPasswordSaving(false);
    }
  };

  const getInitials = () => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const getTrustTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "gold":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "silver":
        return "bg-gray-50 text-gray-600 border-gray-200";
      case "platinum":
        return "bg-purple-50 text-purple-600 border-purple-200";
      default:
        return "bg-green-50 text-green-600 border-green-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary-600 animate-spin" />
          <span className="text-sm text-gray-500">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">
          Manage your account information and reputation
        </p>
      </div>

      {/* Profile Information */}
      <Section title="Personal Information" description="Update your name, phone, and location">
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold">
              {getInitials()}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors">
              <Camera size={14} />
            </button>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {firstName} {lastName}
            </h3>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {profile?.is_verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-lg">
                  <BadgeCheck size={14} />
                  Verified
                </span>
              )}
              {profile?.trust_tier && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border ${getTrustTierColor(
                    profile.trust_tier
                  )}`}
                >
                  <Shield size={14} />
                  {profile.trust_tier} Tier
                </span>
              )}
              {profile?.reputation_score !== undefined && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent-50 text-accent-600 text-xs font-semibold rounded-lg">
                  <Star size={14} className="fill-accent-500" />
                  {profile.reputation_score?.toFixed(1)} Rating
                </span>
              )}
              {profile?.member_since && (
                <span className="text-xs text-gray-400">
                  Member since {profile.member_since}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="input-field pl-11 bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="input-field pl-11"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
                className="input-field pl-11"
              />
            </div>
          </div>
        </div>

        {/* Save Feedback */}
        {saveSuccess && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 rounded-xl border border-green-100">
            <CheckCircle2 size={16} className="text-green-500" />
            <span className="text-sm text-green-700">Profile updated successfully!</span>
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-sm text-red-700">{saveError}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setFirstName(profile?.first_name || "");
              setLastName(profile?.last_name || "");
              setPhone(profile?.phone || "");
              setLocation(profile?.location || "");
            }}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </Section>

      {/* Reputation Stats */}
      <Section title="Reputation & Trust" description="Your trading history and trust metrics">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
              <ArrowLeftRight size={20} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{profile?.total_trades || 0}</div>
            <div className="text-xs text-gray-500">Total Trades</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{profile?.successful_trades || 0}</div>
            <div className="text-xs text-gray-500">Successful</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{profile?.disputes || 0}</div>
            <div className="text-xs text-gray-500">Disputes</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center mx-auto mb-2">
              <Star size={20} className="text-accent-600 fill-accent-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {profile?.reputation_score?.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-gray-500">Rating</div>
          </div>
        </div>

        {/* Success Rate */}
        {profile?.total_trades ? (
          <div className="mt-5 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Success Rate</span>
              <span className="text-sm font-bold text-gray-900">
                {Math.round(((profile.successful_trades || 0) / profile.total_trades) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{
                  width: `${Math.round(((profile.successful_trades || 0) / profile.total_trades) * 100)}%`,
                }}
              />
            </div>
          </div>
        ) : null}
      </Section>

      {/* Change Password */}
      <Section title="Change Password" description="Update your password to keep your account secure">
        <div className="space-y-5 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          </div>

          {/* Password Feedback */}
          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="text-sm text-green-700">Password changed successfully!</span>
            </div>
          )}
          {passwordError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-sm text-red-700">{passwordError}</span>
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={passwordSaving}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {passwordSaving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone" description="Irreversible account actions">
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
          <div>
            <div className="text-sm font-medium text-red-800">Delete Account</div>
            <div className="text-xs text-red-600 mt-0.5">
              Permanently delete your account and all associated data. This cannot be undone.
            </div>
          </div>
          <button className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shrink-0">
            Delete
          </button>
        </div>
      </Section>
    </div>
  );
}
