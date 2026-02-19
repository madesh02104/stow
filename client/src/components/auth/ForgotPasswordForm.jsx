import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Phone, ArrowLeft } from "lucide-react";

export default function ForgotPasswordForm({ onSwitch }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    // Simulate sending OTP / reset link
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <button
        type="button"
        onClick={() => onSwitch("login")}
        className="flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft size={16} /> Back to Login
      </button>

      <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
      <p className="text-sm text-slate-body">
        We'll send a reset link to your registered phone number.
      </p>

      {sent ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
          ✅ A password reset link has been sent to your phone. Please check
          your messages.
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="tel"
                placeholder="Enter registered phone"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition"
                {...register("phone", { required: "Phone is required" })}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </>
      )}
    </form>
  );
}
