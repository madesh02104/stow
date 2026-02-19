import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Package, Car, LocateFixed, Loader2 } from "lucide-react";
import API from "../../api";
import useUserLocation from "../../hooks/useUserLocation";

export default function Suggestions() {
  const [listings, setListings] = useState([]);
  const {
    location,
    address,
    loading: locLoading,
    error: locError,
  } = useUserLocation();
  const [usingNearby, setUsingNearby] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (location) {
      // Fetch ONLY listings within 25 km — never fall back to all listings
      setFetching(true);
      API.get(
        `/listings/nearby?lat=${location.lat}&lng=${location.lng}&radius=25`,
      )
        .then(({ data }) => {
          setListings(data); // may be empty — that's fine
          setUsingNearby(true);
        })
        .catch(() => {
          setListings([]);
          setUsingNearby(true);
        })
        .finally(() => setFetching(false));
    } else if (!locLoading) {
      // Location not available — fall back to all listings
      setFetching(true);
      API.get("/listings?limit=10")
        .then(({ data }) => {
          if (data.length) setListings(data);
        })
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [location, locLoading]);

  return (
    <section className="py-20 bg-offwhite">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              {usingNearby ? "Places Near You" : "Popular Near You"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {locLoading ? (
                <span className="flex items-center gap-1 text-slate-body text-sm">
                  <Loader2 size={14} className="animate-spin" /> Detecting your
                  location…
                </span>
              ) : location ? (
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <LocateFixed size={14} /> {address || "Location detected"}
                  <span className="text-xs text-gray-400 ml-1 font-normal">
                    (change in header)
                  </span>
                </span>
              ) : (
                <p className="text-slate-body text-sm">
                  {locError
                    ? "Location unavailable – showing all spaces"
                    : "Top-rated spaces in your area"}
                </p>
              )}
            </div>
          </div>
          <Link
            to="/listings"
            className="text-primary text-sm font-semibold hover:underline hidden sm:block"
          >
            View all →
          </Link>
        </div>

        {/* Loading state */}
        {(locLoading || fetching) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        )}

        {/* Empty state when no nearby listings */}
        {!locLoading && !fetching && usingNearby && listings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <MapPin size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">
              No spaces found within 25 km
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Try browsing all available spaces instead
            </p>
            <Link
              to="/listings"
              className="inline-block mt-4 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition"
            >
              Browse All Spaces
            </Link>
          </div>
        )}

        {/* Horizontal scrolling cards */}
        {!locLoading && !fetching && listings.length > 0 && (
          <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-4">
            {listings.map((item) => (
              <Link
                key={item.id}
                to={`/listing/${item.id}`}
                className="min-w-[280px] max-w-[300px] bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all flex-shrink-0 overflow-hidden group"
              >
                {/* Image placeholder */}
                <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  {item.type === "storage" ? (
                    <Package size={40} className="text-primary/40" />
                  ) : (
                    <Car size={40} className="text-primary/40" />
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.type === "storage" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                    >
                      {item.type}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <Star size={12} fill="currentColor" />
                      <span className="font-semibold">{item.rating_avg}</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary transition line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 mb-3">
                    <MapPin size={12} />
                    <span className="line-clamp-1">{item.address}</span>
                    {item.distance_km != null && (
                      <span className="ml-auto whitespace-nowrap text-primary font-semibold">
                        {item.distance_km < 1
                          ? `${Math.round(item.distance_km * 1000)}m`
                          : `${Number(item.distance_km).toFixed(1)} km`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold text-sm">
                      from ₹
                      {(() => {
                        const a = Math.max(
                          4,
                          item.total_area_ft2 ||
                            (item.length_ft && item.width_ft
                              ? item.length_ft * item.width_ft
                              : 4),
                        );
                        const d = 1 / (1 + 10 * Math.log(4));
                        return Math.max(30, Math.round(2.4 * d * a * 4));
                      })()}
                      <span className="text-gray-400 font-normal text-xs">
                        /hr
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
