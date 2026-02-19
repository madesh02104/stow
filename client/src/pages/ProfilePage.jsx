import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import {
  User,
  Phone,
  Mail,
  Camera,
  Loader2,
  Check,
  ArrowLeft,
  Shield,
  LogOut,
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Load user data into form
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photos", file);

    setUploading(true);
    setError("");
    try {
      const { data } = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.urls?.[0]) {
        setAvatarUrl(data.urls[0]);
      }
    } catch {
      setError("Failed to upload photo. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");

    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const { data } = await API.put("/auth/me", {
        name: name.trim(),
        email: email.trim() || null,
        avatar_url: avatarUrl || null,
      });
      // Update local state with response
      setName(data.name);
      setEmail(data.email || "");
      setAvatarUrl(data.avatar_url || "");
      setSuccess(true);
      // Refresh the user in auth context so header updates
      refreshUser();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">
        My Profile
      </h1>
      <p className="text-sm text-slate-body mb-8">
        Manage your personal details
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-gray-200">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-primary/40" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{name || "Your Name"}</p>
            <p className="text-xs text-slate-body">
              {uploading
                ? "Uploading..."
                : "Tap the camera icon to change photo"}
            </p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none text-sm"
            />
          </div>
        </div>

        {/* Phone (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number
          </label>
          <div className="relative">
            <Phone
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="tel"
              value={phone}
              readOnly
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Shield size={10} /> Phone number cannot be changed
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none text-sm"
            />
          </div>
        </div>

        {/* Member since */}
        {user?.created_at && (
          <div className="bg-offwhite rounded-xl p-4 text-sm text-slate-body">
            Member since{" "}
            <span className="font-semibold text-gray-700">
              {new Date(user.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg flex items-center gap-2">
            <Check size={16} /> Profile updated successfully!
          </div>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Check size={18} />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Logout */}
      <button
        onClick={() => {
          logout();
          navigate("/auth");
        }}
        className="w-full mt-6 py-3 border-2 border-red-200 text-red-500 font-semibold rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2"
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}
