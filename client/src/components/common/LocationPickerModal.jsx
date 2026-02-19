import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  X,
  MapPin,
  Loader2,
  Search,
  Check,
  LocateFixed,
  Navigation,
} from "lucide-react";

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Component to handle map click events
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Component to fly the map to a new center and invalidate size on mount
function MapController({ center }) {
  const map = useMap();

  // Fix map tiles not rendering — invalidate size after mount
  useEffect(() => {
    if (!map || !map.getContainer()) return;
    const t = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        /* map not ready */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    if (!center || !map || !map.getContainer()) return;
    try {
      map.flyTo(center, 15, { duration: 1 });
      const t = setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {
          /* map not ready */
        }
      }, 1200);
      return () => clearTimeout(t);
    } catch {
      /* map not ready */
    }
  }, [center, map]);

  return null;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialCenter,
}) {
  const defaultCenter = initialCenter || { lat: 13.0827, lng: 80.2707 }; // Chennai default
  const [pin, setPin] = useState(defaultCenter);
  const [address, setAddress] = useState("");
  const [resolving, setResolving] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [mapKey, setMapKey] = useState(0); // force re-mount on open

  // Top search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  // Bottom "go to location" input state
  const [goQuery, setGoQuery] = useState("");
  const [goResults, setGoResults] = useState([]);
  const [goSearching, setGoSearching] = useState(false);
  const goDebounceRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const center = initialCenter || { lat: 13.0827, lng: 80.2707 };
      setPin(center);
      setFlyTarget(null);
      setQuery("");
      setResults([]);
      setGoQuery("");
      setGoResults([]);
      setMapKey((k) => k + 1); // force fresh map
      reverseGeocode(center.lat, center.lng);
    }
    // eslint-disable-next-line
  }, [isOpen]);

  // Reverse-geocode whenever pin moves
  const reverseGeocode = useCallback(async (lat, lng) => {
    setResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      const data = await res.json();
      const a = data.address || {};
      const parts = [
        a.suburb || a.neighbourhood || a.hamlet || "",
        a.city || a.town || a.village || a.county || a.state_district || "",
      ].filter(Boolean);
      setAddress(
        parts.join(", ") ||
          data.display_name?.split(",").slice(0, 2).join(", ") ||
          "Selected Location",
      );
    } catch {
      setAddress("Selected Location");
    }
    setResolving(false);
  }, []);

  const handleMapClick = (latlng) => {
    const newPin = { lat: latlng.lat, lng: latlng.lng };
    setPin(newPin);
    reverseGeocode(newPin.lat, newPin.lng);
  };

  // --- Top search bar (debounced) ---
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
        );
        const data = await res.json();
        setResults(
          data.map((d) => ({
            lat: +d.lat,
            lng: +d.lon,
            display: d.display_name,
            short: d.display_name.split(",").slice(0, 2).join(",").trim(),
          })),
        );
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 400);
  }, [query]);

  const handleSearchPick = (item) => {
    const newPin = { lat: item.lat, lng: item.lng };
    setPin(newPin);
    setAddress(item.short);
    setFlyTarget([item.lat, item.lng]);
    setQuery("");
    setResults([]);
  };

  // --- Bottom "Go to location" input (debounced) ---
  useEffect(() => {
    if (goDebounceRef.current) clearTimeout(goDebounceRef.current);
    if (goQuery.trim().length < 2) {
      setGoResults([]);
      return;
    }
    setGoSearching(true);
    goDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(goQuery)}&format=json&limit=5&countrycodes=in`,
        );
        const data = await res.json();
        setGoResults(
          data.map((d) => ({
            lat: +d.lat,
            lng: +d.lon,
            display: d.display_name,
            short: d.display_name.split(",").slice(0, 2).join(",").trim(),
          })),
        );
      } catch {
        setGoResults([]);
      }
      setGoSearching(false);
    }, 400);
  }, [goQuery]);

  const handleGoPick = (item) => {
    const newPin = { lat: item.lat, lng: item.lng };
    setPin(newPin);
    setAddress(item.short);
    setFlyTarget([item.lat, item.lng]);
    setGoQuery("");
    setGoResults([]);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPin(newPin);
        setFlyTarget([newPin.lat, newPin.lng]);
        reverseGeocode(newPin.lat, newPin.lng);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const handleConfirm = () => {
    onConfirm(pin.lat, pin.lng, address);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "min(90vh, 700px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={20} className="text-primary" /> Pick Your Location
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Top search bar */}
        <div className="px-5 pt-4 pb-2 relative flex-shrink-0">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a place to jump to…"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
            />
          </div>
          {/* Search results overlay */}
          {(searching || results.length > 0) && (
            <div className="absolute left-5 right-5 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-40 overflow-y-auto">
              {searching && (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-3 px-3">
                  <Loader2 size={12} className="animate-spin" /> Searching…
                </div>
              )}
              {!searching &&
                results.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearchPick(item)}
                    className="w-full text-left flex items-start gap-2 px-3 py-2.5 hover:bg-primary/5 transition text-sm border-b border-gray-50 last:border-0"
                  >
                    <MapPin
                      size={14}
                      className="text-primary flex-shrink-0 mt-0.5"
                    />
                    <span className="text-gray-700 line-clamp-1">
                      {item.display}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Map — flexible height so Leaflet renders properly */}
        <div
          className="mx-5 mb-3 rounded-xl overflow-hidden border border-gray-200 relative flex-shrink min-h-0"
          style={{ height: 280 }}
        >
          <MapContainer
            key={mapKey}
            center={[pin.lat, pin.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[pin.lat, pin.lng]} />
            <MapClickHandler onMapClick={handleMapClick} />
            <MapController center={flyTarget} />
          </MapContainer>

          {/* Use my location button on map */}
          <button
            onClick={handleUseMyLocation}
            className="absolute bottom-3 right-3 z-[1000] bg-white shadow-md border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition"
          >
            <LocateFixed size={14} className="text-primary" /> Use my location
          </button>
        </div>

        {/* Bottom section — location input + confirm */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex-shrink-0 overflow-y-auto">
          {/* Current resolved address */}
          <div className="flex items-center gap-2 mb-3 text-sm">
            <MapPin size={14} className="text-primary flex-shrink-0" />
            {resolving ? (
              <span className="text-gray-400 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Resolving
                address…
              </span>
            ) : (
              <span className="text-gray-700 font-medium">{address}</span>
            )}
          </div>

          {/* Go to location input */}
          <div className="relative mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Enter a location to move the pin
            </label>
            <div className="relative">
              <Navigation
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={goQuery}
                onChange={(e) => setGoQuery(e.target.value)}
                placeholder="E.g. T. Nagar, Chennai"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
            </div>
            {/* Suggestions dropdown */}
            {(goSearching || goResults.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-36 overflow-y-auto">
                {goSearching && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-3 px-3">
                    <Loader2 size={12} className="animate-spin" /> Searching…
                  </div>
                )}
                {!goSearching &&
                  goResults.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleGoPick(item)}
                      className="w-full text-left flex items-start gap-2 px-3 py-2.5 hover:bg-primary/5 transition text-sm border-b border-gray-50 last:border-0"
                    >
                      <MapPin
                        size={14}
                        className="text-primary flex-shrink-0 mt-0.5"
                      />
                      <span className="text-gray-700 line-clamp-1">
                        {item.display}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-400 mb-3">
            Click on the map to drop a pin, or type a location above to move it
          </p>
          <button
            onClick={handleConfirm}
            disabled={resolving}
            className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Check size={16} /> Confirm Location
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
