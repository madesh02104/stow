import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Package,
  Car,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import API from "../api";

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [input, setInput] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Fetch results when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    API.get(`/listings?search=${encodeURIComponent(query.trim())}&limit=50`)
      .then(({ data }) => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setSearchParams({ q: input.trim() });
    }
  };

  // Decay-based hourly price (same formula used elsewhere)
  const getHourlyPrice = (area) => {
    const a = Math.max(4, area);
    const blocks = 4;
    const decay = 1 / (1 + 10 * Math.log(blocks));
    return Math.max(30, Math.round(2.4 * decay * a * blocks));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back + Search bar */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition mb-4"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search by name, area, street, or landmark..."
            className="w-full pl-12 pr-28 py-3.5 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none text-gray-700 placeholder-gray-400 transition"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results heading */}
      {searched && (
        <p className="text-sm text-slate-body mb-6">
          {loading ? (
            "Searching..."
          ) : (
            <>
              <span className="font-semibold text-gray-900">
                {results.length}
              </span>{" "}
              result{results.length !== 1 ? "s" : ""} for{" "}
              <span className="font-semibold text-gray-900">"{query}"</span>
            </>
          )}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-20">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No listings found
          </h3>
          <p className="text-sm text-gray-500">
            Try a different search term — e.g. a neighbourhood, street name, or
            "storage" / "parking".
          </p>
        </div>
      )}

      {/* Results list */}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((item) => {
            const area =
              item.total_area_ft2 ||
              (item.length_ft && item.width_ft
                ? item.length_ft * item.width_ft
                : 4);

            return (
              <Link
                key={item.id}
                to={`/listing/${item.id}`}
                className="flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group"
              >
                {/* Image / Icon */}
                {item.photos && item.photos.length > 0 ? (
                  <div className="sm:w-48 h-40 sm:h-auto overflow-hidden flex-shrink-0">
                    <img
                      src={item.photos[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="sm:w-48 h-40 sm:h-auto bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center flex-shrink-0">
                    {item.type === "storage" ? (
                      <Package size={40} className="text-primary/40" />
                    ) : (
                      <Car size={40} className="text-primary/40" />
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.type === "storage"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.type}
                    </span>
                    {item.subtypes &&
                      item.subtypes.length > 0 &&
                      item.subtypes.map((st) => (
                        <span
                          key={st}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600"
                        >
                          {st}
                        </span>
                      ))}
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <Star size={12} fill="currentColor" />
                      <span className="font-semibold">{item.rating_avg}</span>
                      {item.rating_count > 0 && (
                        <span className="text-gray-400">
                          ({item.rating_count})
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition mb-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <MapPin size={14} />
                    <span className="line-clamp-1">{item.address}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-primary font-bold">
                      from ₹{getHourlyPrice(area)}
                      <span className="text-gray-400 font-normal text-xs">
                        /hr
                      </span>
                    </span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{area} ft²</span>
                    {item.length_ft && item.width_ft && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">
                          {item.length_ft}×{item.width_ft} ft
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Prompt when nothing searched */}
      {!searched && !loading && (
        <div className="text-center py-20">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            Search for spaces
          </h3>
          <p className="text-sm text-gray-500">
            Enter a location, area name, or listing title to find available
            spaces.
          </p>
        </div>
      )}
    </div>
  );
}
