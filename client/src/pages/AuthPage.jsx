import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import { Package } from "lucide-react";

export default function AuthPage() {
  const { user } = useAuth();
  const [view, setView] = useState("login"); // login | register | forgot

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex">
      {/* Left panel – decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-orange-500 to-secondary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

        <div className="relative text-white text-center max-w-md">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package size={32} className="text-white" />
          </div>
          <h2 className="text-4xl font-extrabold mb-4">Stow</h2>
          <p className="text-lg text-white/80 leading-relaxed">
            The peer-to-peer marketplace for hyper-local storage & parking. Book
            with flexible slot allocation and verified handoffs.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-white/60">
            <span>🕐 Flexible slots</span>
            <span>🔒 Chain of Custody</span>
            <span>⚡ Instant Booking</span>
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900">Stow</span>
          </div>

          {view === "login" && <LoginForm onSwitch={setView} />}
          {view === "register" && <RegisterForm onSwitch={setView} />}
          {view === "forgot" && <ForgotPasswordForm onSwitch={setView} />}
        </div>
      </div>
    </div>
  );
}
