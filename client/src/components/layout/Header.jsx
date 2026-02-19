import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Package,
  User,
  Menu,
  X,
  MapPin,
  Loader2,
  Search,
  ChevronDown,
} from "lucide-react";
import useUserLocation from "../../hooks/useUserLocation";
import LocationPickerModal from "../common/LocationPickerModal";

export default function Header() {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const {
    address,
    location: userLoc,
    loading: locLoading,
    updateLocation,
  } = useUserLocation();

  // --- Location search dropdown ---
  const [locOpen, setLocOpen] = useState(false);
  const [locQuery, setLocQuery] = useState("");
  const [locResults, setLocResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const locRef = useRef(null);
  const debounceRef = useRef(null);
  const [mapOpen, setMapOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (locRef.current && !locRef.current.contains(e.target))
        setLocOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced Nominatim forward geocode
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (locQuery.trim().length < 2) {
      setLocResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locQuery)}&format=json&limit=5&countrycodes=in`,
        );
        const data = await res.json();
        setLocResults(
          data.map((d) => ({
            lat: +d.lat,
            lng: +d.lon,
            display: d.display_name,
            short:
              d.display_name.split(",").slice(0, 2).join(",").trim() ||
              d.display_name,
          })),
        );
      } catch {
        setLocResults([]);
      }
      setSearching(false);
    }, 400);
  }, [locQuery]);

  const handlePickLocation = (item) => {
    updateLocation(item.lat, item.lng, item.short);
    setLocOpen(false);
    setLocQuery("");
    setLocResults([]);
    // Reload page so Suggestions re-fetches with new location
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900 group-hover:text-primary transition">
              Stow
            </span>
          </Link>

          {/* User Location — clickable to change */}
          <div
            ref={locRef}
            className="relative hidden md:block ml-2 border-l border-gray-200 pl-3"
          >
            <button
              onClick={() => setLocOpen(!locOpen)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition"
            >
              <MapPin size={13} className="text-primary flex-shrink-0" />
              {locLoading ? (
                <span className="flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Locating…
                </span>
              ) : address ? (
                <span className="max-w-[180px] truncate font-medium text-gray-700">
                  {address}
                </span>
              ) : (
                <span className="text-gray-400">Set location</span>
              )}
              <ChevronDown size={12} className="text-gray-400" />
            </button>

            {/* Dropdown */}
            {locOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-3">
                <div className="relative mb-2">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={locQuery}
                    onChange={(e) => setLocQuery(e.target.value)}
                    placeholder="Search your city or area…"
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                  />
                </div>
                {searching && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-2 px-1">
                    <Loader2 size={12} className="animate-spin" /> Searching…
                  </div>
                )}
                {!searching && locResults.length > 0 && (
                  <ul className="max-h-48 overflow-y-auto">
                    {locResults.map((item, i) => (
                      <li key={i}>
                        <button
                          onClick={() => handlePickLocation(item)}
                          className="w-full text-left flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-primary/5 transition text-sm"
                        >
                          <MapPin
                            size={14}
                            className="text-primary flex-shrink-0 mt-0.5"
                          />
                          <span className="text-gray-700 line-clamp-2">
                            {item.display}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!searching &&
                  locQuery.trim().length >= 2 &&
                  locResults.length === 0 && (
                    <p className="text-xs text-gray-400 py-2 px-1">
                      No results found
                    </p>
                  )}
                {/* Pick on map button */}
                <button
                  onClick={() => {
                    setLocOpen(false);
                    setMapOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2.5 mt-1 rounded-lg border border-dashed border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition"
                >
                  <MapPin size={14} /> Pick on map
                </button>
              </div>
            )}
          </div>

          {/* Map picker modal — rendered outside relative containers so it centers on page */}
          {mapOpen && (
            <LocationPickerModal
              isOpen={mapOpen}
              onClose={() => setMapOpen(false)}
              onConfirm={(lat, lng, addr) => {
                updateLocation(lat, lng, addr);
                setMapOpen(false);
                window.location.reload();
              }}
              initialCenter={userLoc || undefined}
            />
          )}

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary transition"
            >
              Home
            </Link>
            <Link
              to="/listings"
              className="text-gray-600 hover:text-primary transition"
            >
              Browse Spaces
            </Link>
            {user && (
              <>
                <Link
                  to="/create-listing"
                  className="text-gray-600 hover:text-primary transition"
                >
                  List Space
                </Link>
                <Link
                  to="/my-listings"
                  className="text-gray-600 hover:text-primary transition"
                >
                  My Listings
                </Link>
                <Link
                  to="/bookings"
                  className="text-gray-600 hover:text-primary transition"
                >
                  Bookings
                </Link>
                <Link
                  to="/provider-bookings"
                  className="text-gray-600 hover:text-primary transition"
                >
                  Incoming
                </Link>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 hover:opacity-80 transition"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={16} className="text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </Link>
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-gray-600"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t py-4 space-y-3">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="block text-gray-700 hover:text-primary transition py-1"
            >
              Home
            </Link>
            <Link
              to="/listings"
              onClick={() => setOpen(false)}
              className="block text-gray-700 hover:text-primary transition py-1"
            >
              Browse Spaces
            </Link>
            {user && (
              <>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="block text-gray-700 hover:text-primary transition py-1"
                >
                  My Profile
                </Link>
                <Link
                  to="/create-listing"
                  onClick={() => setOpen(false)}
                  className="block text-gray-700 hover:text-primary transition py-1"
                >
                  List Space
                </Link>
                <Link
                  to="/my-listings"
                  onClick={() => setOpen(false)}
                  className="block text-gray-700 hover:text-primary transition py-1"
                >
                  My Listings
                </Link>
                <Link
                  to="/bookings"
                  onClick={() => setOpen(false)}
                  className="block text-gray-700 hover:text-primary transition py-1"
                >
                  Bookings
                </Link>
                <Link
                  to="/provider-bookings"
                  onClick={() => setOpen(false)}
                  className="block text-gray-700 hover:text-primary transition py-1"
                >
                  Incoming Bookings
                </Link>
              </>
            )}
            {!user && (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="block text-primary font-semibold py-1"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
