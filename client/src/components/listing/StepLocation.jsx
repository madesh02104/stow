import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { MapPin, Ruler, Search, Loader2 } from "lucide-react";

// Fix default Leaflet marker icon (broken with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bangalore

// Component to handle map click events
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

// Component to re-center map when coordinates change
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 16, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function StepLocation({ data, onChange }) {
  const update = (field, value) => onChange({ [field]: value });
  const [query, setQuery] = useState(data.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const markerPosition =
    data.latitude && data.longitude ? [data.latitude, data.longitude] : null;

  // Nominatim free geocoding search
  const searchAddress = useCallback(async (text) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=in&limit=5`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    update("address", val);
    // Clear lat/lng when user types manually
    if (data.latitude) {
      onChange({ address: val, latitude: null, longitude: null });
    }
    // Debounced search
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 400);
  };

  const handleSuggestionClick = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setQuery(item.display_name);
    onChange({
      address: item.display_name,
      latitude: lat,
      longitude: lng,
    });
    setSuggestions([]);
  };

  const handleMapClick = useCallback(
    async (latlng) => {
      const lat = latlng.lat;
      const lng = latlng.lng;
      onChange({ latitude: lat, longitude: lng });

      // Reverse geocode with Nominatim (free)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { "Accept-Language": "en" } },
        );
        const result = await res.json();
        if (result.display_name) {
          setQuery(result.display_name);
          onChange({
            address: result.display_name,
            latitude: lat,
            longitude: lng,
          });
        }
      } catch {
        // Keep lat/lng even if reverse geocode fails
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Location & Dimensions
        </h3>
        <p className="text-sm text-slate-body mb-6">
          Where is the space and how big is it?
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Listing Title
        </label>
        <input
          type="text"
          value={data.title || ""}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Secure Garage Storage – Koramangala"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          rows={3}
          value={data.description || ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Describe the space..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none resize-none"
        />
      </div>

      {/* Address with Nominatim autocomplete */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-body mb-2">
          Search for your address or click on the map to set the exact location.
        </p>
        <div className="relative">
          <MapPin
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"
          />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search for address or landmark..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
          />
          {searching && (
            <Loader2
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
            />
          )}
          {!searching && query.length >= 3 && (
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          )}
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((item) => (
              <li
                key={item.place_id}
                onClick={() => handleSuggestionClick(item)}
                className="px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 cursor-pointer border-b border-gray-50 last:border-0"
              >
                <MapPin size={12} className="inline mr-2 text-primary" />
                {item.display_name}
              </li>
            ))}
          </ul>
        )}
        {!data.latitude && data.address && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠ Please select a location from the suggestions or click on the map
          </p>
        )}
      </div>

      {/* Leaflet Map Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Pin on Map <span className="text-red-500">*</span>
        </label>
        <div
          className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
          style={{ height: 260 }}
        >
          <MapContainer
            center={markerPosition || DEFAULT_CENTER}
            zoom={markerPosition ? 16 : 12}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onClick={handleMapClick} />
            {markerPosition && <Marker position={markerPosition} />}
            {data.latitude && data.longitude && (
              <RecenterMap lat={data.latitude} lng={data.longitude} />
            )}
          </MapContainer>
        </div>
        {markerPosition && (
          <p className="text-xs text-green-600 mt-1.5 font-medium">
            ✓ Location set: {markerPosition[0].toFixed(5)},{" "}
            {markerPosition[1].toFixed(5)}
          </p>
        )}
      </div>

      {/* Dimensions — only for storage */}
      {data.type !== "parking" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Ruler size={14} className="inline mr-1" /> Dimensions (in ft)
          </label>
          <div className="grid gap-3 grid-cols-3">
            <div>
              <label className="text-xs text-gray-500">Length</label>
              <input
                type="number"
                min={0}
                value={data.length_ft || ""}
                onChange={(e) => update("length_ft", +e.target.value)}
                placeholder="L"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Width</label>
              <input
                type="number"
                min={0}
                value={data.width_ft || ""}
                onChange={(e) => update("width_ft", +e.target.value)}
                placeholder="W"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Height</label>
              <input
                type="number"
                min={0}
                value={data.height_ft || ""}
                onChange={(e) => update("height_ft", +e.target.value)}
                placeholder="H"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pricing info */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700 mb-1">💡 Pricing</p>
        {data.type === "parking" ? (
          <p className="text-xs text-slate-body">
            Stow uses fixed parking rates per slot (flexible allocation):{" "}
            <span className="font-semibold text-primary">
              2-wheeler: ₹4 (Open) / ₹8 (Covered)
            </span>{" "}
            and{" "}
            <span className="font-semibold text-primary">
              4-wheeler: ₹8 (Open) / ₹12 (Covered)
            </span>
            . Simple flat rate — no hidden charges.
          </p>
        ) : (
          <p className="text-xs text-slate-body">
            Stow uses standard pricing:{" "}
            <span className="font-semibold text-primary">
              ₹2.40 per sq ft per slot
            </span>
            . Price is calculated automatically based on your space dimensions
            and the seeker's booking duration.
          </p>
        )}
      </div>
    </div>
  );
}
