import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "stow_user_location";

/**
 * Read saved location from localStorage.
 * Returns { lat, lng, address } or null.
 */
function getSavedLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.lat && parsed.lng) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Reverse-geocode coords → readable "Suburb, City" string via Nominatim.
 */
async function reverseGeocode(lat, lng) {
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
    return (
      parts.join(", ") ||
      data.display_name?.split(",").slice(0, 2).join(", ") ||
      "Your Location"
    );
  } catch {
    return "Your Location";
  }
}

export default function useUserLocation() {
  const [location, setLocation] = useState(null); // { lat, lng }
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Allow manual update from anywhere (e.g. Header search)
  const updateLocation = useCallback((lat, lng, addr) => {
    const loc = { lat, lng, address: addr };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    setLocation({ lat, lng });
    setAddress(addr);
    setError(null);
  }, []);

  useEffect(() => {
    // 1. Check localStorage first (user previously picked a location)
    const saved = getSavedLocation();
    if (saved) {
      setLocation({ lat: saved.lat, lng: saved.lng });
      setAddress(saved.address || "");
      setLoading(false);
      // If address was missing, reverse-geocode in background
      if (!saved.address) {
        reverseGeocode(saved.lat, saved.lng).then((addr) => {
          setAddress(addr);
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ lat: saved.lat, lng: saved.lng, address: addr }),
          );
        });
      }
      return;
    }

    // 2. No saved location — try browser geolocation
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const addr = await reverseGeocode(coords.lat, coords.lng);

        setLocation(coords);
        setAddress(addr);
        // Save so it persists
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...coords, address: addr }),
        );
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Unable to get your location");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, []);

  return { location, address, loading, error, updateLocation };
}

/**
 * Calculate distance between two lat/lng points in km (Haversine)
 */
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
