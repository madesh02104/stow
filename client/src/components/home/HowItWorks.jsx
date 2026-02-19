import React from "react";
import { Search, CalendarCheck, PackageCheck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find",
    description: "Search for available storage or parking spaces near you.",
    color: "bg-primary",
  },
  {
    icon: CalendarCheck,
    title: "Book",
    description:
      "Reserve with flexible slot allocation. Pay only for what you use.",
    color: "bg-secondary",
  },
  {
    icon: PackageCheck,
    title: "Stow",
    description: "Drop off with a verified QR handshake. Secure & tracked.",
    color: "bg-green-500",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            How It Works
          </h2>
          <p className="text-slate-body max-w-lg mx-auto">
            Three simple steps to stow your stuff safely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gray-200 z-0" />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-24 h-24 rounded-2xl ${step.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform`}
                >
                  <step.icon size={36} className="text-white" />
                </div>
                <span className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-2">
                  Step {i + 1}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-body max-w-xs">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
