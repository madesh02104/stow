import React, { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Package,
  Car,
  Loader2,
  SlidersHorizontal,
  X,
  Lock,
  Cctv,
  Zap,
  Droplets,
  ChevronDown,
} from "lucide-react";
import API from "../api";

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low → High" },
  { value: "price_high", label: "Price: High → Low" },
];

const AREA_RANGES = [
  { value: "", label: "Any Size" },
  { value: "0-25", label: "Small (≤ 25 ft²)" },
  { value: "25-100", label: "Medium (25–100 ft²)" },
  { value: "100-500", label: "Large (100–500 ft²)" },
  { value: "500-", label: "Extra Large (500+ ft²)" },
];

const AMENITY_OPTIONS = [
  { key: "locker", label: "Locker", icon: Lock },
  { key: "cctv", label: "CCTV", icon: Cctv },
  { key: "ev_charge", label: "EV Charging", icon: Zap },
  { key: "waterproof", label: "Waterproof", icon: Droplets },
];

export default function AllListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state from URL
  const [type, setType] = useState(searchParams.get("type") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [areaRange, setAreaRange] = useState(searchParams.get("area") || "");
  const [amenities, setAmenities] = useState(
    searchParams.get("amenities")?.split(",").filter(Boolean) || [],
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "rating");
  const [searchText, setSearchText] = useState(searchParams.get("q") || "");

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  // Keep a ref with the LATEST filter values so fetchListings never has stale closures
  const filtersRef = useRef({
    type,
    city,
    areaRange,
    amenities,
    sort,
    searchText,
  });
  filtersRef.current = { type, city, areaRange, amenities, sort, searchText };

  const pageRef = useRef(page);
  pageRef.current = page;

  // ---- Core fetch — reads from filtersRef so it's never stale ----
  const doFetch = (overrides = {}, append = false) => {
    const f = { ...filtersRef.current, ...overrides };
    const pageNum = append ? pageRef.current + 1 : 0;

    const p = {};
    if (f.type) p.type = f.type;
    if (f.searchText?.trim()) p.search = f.searchText.trim();
    if (f.city?.trim()) p.city = f.city.trim();
    const am = Array.isArray(f.amenities)
      ? f.amenities.join(",")
      : f.amenities || "";
    if (am) p.amenities = am;
    if (f.sort) p.sort = f.sort;
    if (f.areaRange) {
      const parts = f.areaRange.split("-");
      if (parts[0]) p.min_area = parts[0];
      if (parts[1]) p.max_area = parts[1];
    }
    p.limit = LIMIT;
    p.offset = pageNum * LIMIT;

    if (!append) {
      setPage(0);
      setLoading(true);
    }

    const qs = new URLSearchParams(p).toString();
    console.log("[Stow] Fetching:", `/listings?${qs}`);
    API.get(`/listings?${qs}`)
      .then(({ data }) => {
        if (append) {
          setListings((prev) => [...prev, ...data]);
          setPage(pageNum);
        } else {
          setListings(data);
        }
        setHasMore(data.length === LIMIT);
      })
      .catch(() => {
        if (!append) setListings([]);
      })
      .finally(() => setLoading(false));
  };

  // Fetch once on mount
  useEffect(() => {
    doFetch();
  }, []);

  // Re-fetch when type or sort changes (quick-access controls)
  const prevType = useRef(type);
  const prevSort = useRef(sort);
  useEffect(() => {
    if (prevType.current !== type) {
      prevType.current = type;
      doFetch();
    }
  }, [type]);
  useEffect(() => {
    if (prevSort.current !== sort) {
      prevSort.current = sort;
      doFetch();
    }
  }, [sort]);

  const loadMore = () => doFetch({}, true);

  const toggleAmenity = (key) => {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  };

  const clearFilters = () => {
    setType("");
    setCity("");
    setAreaRange("");
    setAmenities([]);
    setSort("rating");
    setSearchText("");
  };

  const activeFilterCount =
    (type ? 1 : 0) +
    (city ? 1 : 0) +
    (areaRange ? 1 : 0) +
    amenities.length +
    (sort !== "rating" ? 1 : 0);

  const getHourlyPrice = (area) => {
    const a = Math.max(4, area);
    const blocks = 4;
    const decay = 1 / (1 + 10 * Math.log(blocks));
    return Math.max(30, Math.round(2.4 * decay * a * blocks));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">All Listings</h1>
        <p className="text-sm text-slate-body mt-1">
          Browse all available storage & parking spaces
        </p>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            doFetch();
          }}
          className="relative flex-1"
        >
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name, area, or landmark..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none text-sm"
          />
        </form>

        {/* Type toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {["", "storage", "parking"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2.5 font-medium transition ${
                type === t
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "" ? "All" : t === "storage" ? "Storage" : "Parking"}
            </button>
          ))}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
            showFilters || activeFilterCount > 0
              ? "border-primary bg-primary/5 text-primary"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 font-medium bg-white focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="bg-offwhite border border-gray-100 rounded-xl p-5 mb-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Advanced Filters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* City / Area */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                City / Area
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Koramangala, Bangalore"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
            </div>

            {/* Area range */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Space Size
              </label>
              <select
                value={areaRange}
                onChange={(e) => setAreaRange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              >
                {AREA_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => toggleAmenity(key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      amenities.includes(key)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                    }`}
                  >
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  clearFilters();
                  // Pass explicit empty overrides so doFetch doesn't read stale ref
                  doFetch({
                    type: "",
                    city: "",
                    areaRange: "",
                    amenities: [],
                    sort: "rating",
                    searchText: "",
                  });
                  setShowFilters(false);
                }}
                className="text-sm text-red-500 hover:underline"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => {
                doFetch();
                setShowFilters(false);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
            >
              <Search size={16} />
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-5">
          {type && (
            <Chip
              label={`Type: ${type}`}
              onRemove={() => {
                setType("");
                doFetch({ type: "" });
              }}
            />
          )}
          {city && (
            <Chip
              label={`City: ${city}`}
              onRemove={() => {
                setCity("");
                doFetch({ city: "" });
              }}
            />
          )}
          {areaRange && (
            <Chip
              label={`Size: ${AREA_RANGES.find((r) => r.value === areaRange)?.label}`}
              onRemove={() => {
                setAreaRange("");
                doFetch({ areaRange: "" });
              }}
            />
          )}
          {amenities.map((a) => (
            <Chip
              key={a}
              label={AMENITY_OPTIONS.find((o) => o.key === a)?.label || a}
              onRemove={() => {
                const updated = amenities.filter((x) => x !== a);
                setAmenities(updated);
                doFetch({ amenities: updated });
              }}
            />
          ))}
          <button
            onClick={() => {
              clearFilters();
              doFetch({
                type: "",
                city: "",
                areaRange: "",
                amenities: [],
                sort: "rating",
                searchText: "",
              });
            }}
            className="text-xs text-red-500 hover:underline self-center ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && listings.length === 0 && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && listings.length === 0 && (
        <div className="text-center py-24">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No listings found
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Try adjusting your filters or search terms.
          </p>
          <button
            onClick={() => {
              clearFilters();
              doFetch({
                type: "",
                city: "",
                areaRange: "",
                amenities: [],
                sort: "rating",
                searchText: "",
              });
            }}
            className="text-sm text-primary font-semibold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Listing Grid */}
      {listings.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((item) => {
              const area =
                item.total_area_ft2 ||
                (item.length_ft && item.width_ft
                  ? item.length_ft * item.width_ft
                  : 4);

              return (
                <Link
                  key={item.id}
                  to={`/listing/${item.id}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden group"
                >
                  {/* Image placeholder */}
                  {item.photos && item.photos.length > 0 ? (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={item.photos[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      {item.type === "storage" ? (
                        <Package size={40} className="text-primary/40" />
                      ) : (
                        <Car size={40} className="text-primary/40" />
                      )}
                    </div>
                  )}

                  <div className="p-4">
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

                    <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary transition line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 mb-3">
                      <MapPin size={12} />
                      <span className="line-clamp-1">{item.address}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-sm">
                        from ₹{getHourlyPrice(area)}
                        <span className="text-gray-400 font-normal text-xs">
                          /hr
                        </span>
                      </span>
                      <span className="text-xs text-gray-400">{area} ft²</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 disabled:opacity-50 transition"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* Small reusable chip component */
function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition">
        <X size={12} />
      </button>
    </span>
  );
}
