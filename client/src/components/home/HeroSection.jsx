import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Package, Car } from "lucide-react";

export default function HeroSection() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-offwhite via-white to-orange-50"
    >
      {/* Background decorative elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Flexible Slot Allocation
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Unlock the City's <span className="text-primary">Hidden Space</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-body max-w-2xl mx-auto mb-10">
            Book storage or parking near you. Verified handoffs, dynamic space
            allocation, and zero wasted time.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by area, street, or landmark..."
                className="w-full pl-12 pr-28 py-4 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none text-gray-700 placeholder-gray-400 transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/create-listing"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-orange-600 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              <Package size={20} /> List Space
            </Link>
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary font-semibold rounded-xl border-2 border-primary hover:bg-primary hover:text-white transition-all"
            >
              <Car size={20} /> Book Space
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
