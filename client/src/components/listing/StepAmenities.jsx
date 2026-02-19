import React from "react";
import { Lock, Cctv, Zap, Droplets, ShieldCheck } from "lucide-react";

const storageAmenities = [
  {
    key: "has_locker",
    label: "Locker",
    desc: "Personal locking mechanism",
    icon: Lock,
  },
  {
    key: "has_cctv",
    label: "CCTV",
    desc: "24/7 camera surveillance",
    icon: Cctv,
  },
  {
    key: "has_ev_charge",
    label: "EV Charging",
    desc: "Electric vehicle charger available",
    icon: Zap,
  },
  {
    key: "is_waterproof",
    label: "Waterproof",
    desc: "Protected from rain and leaks",
    icon: Droplets,
  },
];

const parkingAmenities = [
  {
    key: "has_locker",
    label: "Lock",
    desc: "Dedicated lock for your vehicle spot",
    icon: Lock,
  },
  {
    key: "has_cctv",
    label: "CCTV",
    desc: "24/7 camera surveillance",
    icon: Cctv,
  },
  {
    key: "has_security_guard",
    label: "Security Guard",
    desc: "On-site security personnel",
    icon: ShieldCheck,
  },
  {
    key: "has_ev_charge",
    label: "EV Charging",
    desc: "Electric vehicle charger available",
    icon: Zap,
  },
];

export default function StepAmenities({ data, onChange }) {
  const toggle = (key) => onChange({ [key]: !data[key] });
  const amenities =
    data.type === "parking" ? parkingAmenities : storageAmenities;

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Amenities</h3>
      <p className="text-sm text-slate-body mb-6">
        Select the features your space offers.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {amenities.map((a) => {
          const active = !!data[a.key];
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => toggle(a.key)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-primary/30 bg-white"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center transition ${
                  active ? "bg-primary" : "bg-gray-100"
                }`}
              >
                <a.icon
                  size={20}
                  className={active ? "text-white" : "text-gray-500"}
                />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  {a.label}
                </h4>
                <p className="text-xs text-slate-body">{a.desc}</p>
              </div>
              {/* Checkbox indicator */}
              <div className="ml-auto">
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                    active ? "bg-primary border-primary" : "border-gray-300"
                  }`}
                >
                  {active && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
