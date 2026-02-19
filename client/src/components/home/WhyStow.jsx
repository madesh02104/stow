import React from "react";
import { Clock, ShieldCheck, Scissors, Zap } from "lucide-react";

const reasons = [
  {
    icon: Clock,
    title: "Flexible Slot Allocation",
    desc: "Book in tiny blocks—only pay for the time you actually need, down to the quarter hour.",
  },
  {
    icon: ShieldCheck,
    title: "Chain of Custody",
    desc: "Every handoff is verified with a QR-code handshake. Know exactly who has your stuff.",
  },
  {
    icon: Scissors,
    title: "Split Space on the Fly",
    desc: "After filling a booking, split your leftover space into a new listing with one tap.",
  },
  {
    icon: Zap,
    title: "Instant Booking",
    desc: "No calls, no waiting. Search, pick a slot, and confirm—all within seconds.",
  },
];

export default function WhyStow() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Why <span className="text-primary">Stow</span>?
          </h2>
          <p className="text-slate-body max-w-lg mx-auto">
            Built for the modern city, where every minute and square foot
            counts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r, i) => (
            <div
              key={i}
              className="bg-offwhite rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all group border border-transparent hover:border-primary/20"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition">
                <r.icon
                  size={22}
                  className="text-primary group-hover:text-white transition"
                />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {r.title}
              </h3>
              <p className="text-sm text-slate-body leading-relaxed">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
