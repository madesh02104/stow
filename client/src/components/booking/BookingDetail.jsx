import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";
import TimeSlotPicker from "./TimeSlotPicker";
import PriceCalculator from "./PriceCalculator";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import useUserLocation, { getDistanceKm } from "../../hooks/useUserLocation";
import {
  MapPin,
  Star,
  Lock,
  Cctv,
  Zap,
  Droplets,
  User,
  ShieldCheck,
  Ruler,
  Package,
  Car,
  Loader2,
  Navigation,
  AlertTriangle,
  Camera,
  ImagePlus,
  Trash2,
  TriangleAlert,
  Bike,
  CarFront,
} from "lucide-react";

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function BookingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [itemPhotos, setItemPhotos] = useState([]);
  const [itemDescription, setItemDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const { location: userLocation } = useUserLocation();

  // Calculate distance between user and listing
  const distanceKm =
    userLocation && listing?.latitude && listing?.longitude
      ? getDistanceKm(
          userLocation.lat,
          userLocation.lng,
          listing.latitude,
          listing.longitude,
        )
      : null;
  const isBeyond25Km = distanceKm !== null && distanceKm > 25;

  useEffect(() => {
    API.get(`/listings/${id}`)
      .then(({ data }) => setListing(data))
      .catch(() => setError("Listing not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTimeSelect = (start, end) => {
    setStartTime(start);
    setEndTime(end);
  };

  const handleBook = async () => {
    if (!user) return navigate("/auth");
    if (!startTime || !endTime) return setError("Pick a time range");
    setBooking(true);
    setError("");
    try {
      await API.post("/bookings", {
        listing_id: id,
        start_time: startTime,
        end_time: endTime,
        item_photos: itemPhotos,
        item_description: itemDescription,
      });
      navigate("/bookings");
    } catch (err) {
      setError(err.response?.data?.error || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-20 text-gray-500">Listing not found</div>
    );
  }

  // Hourly display price (depends on type)
  const isParking = listing.type === "parking";
  const isCovered = listing.subtypes?.includes("Covered");
  const getDisplayPrice = () => {
    if (isParking) {
      // Flat rate: rate × 4 slots per hour
      let rate;
      if (listing.vehicle_type === "4-wheeler") {
        rate = isCovered ? 12 : 8;
      } else {
        rate = isCovered ? 8 : 4;
      }
      return rate * 4;
    }
    const a = Math.max(4, listing.length_ft * listing.width_ft);
    const blocks = 4;
    const decay = 1 / (1 + 10 * Math.log(blocks));
    return Math.max(30, Math.round(2.4 * decay * a * blocks));
  };

  const amenityIcons = [
    listing.has_locker && { icon: Lock, label: isParking ? "Lock" : "Locker" },
    listing.has_cctv && { icon: Cctv, label: "CCTV" },
    listing.has_security_guard && {
      icon: ShieldCheck,
      label: "Security Guard",
    },
    listing.has_ev_charge && { icon: Zap, label: "EV Charging" },
    !isParking &&
      listing.is_waterproof && { icon: Droplets, label: "Waterproof" },
  ].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left – Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image / Banner */}
          {listing.photos && listing.photos.length > 0 ? (
            <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden">
              <img
                src={listing.photos[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              {listing.photos.length > 1 && (
                <div className="absolute bottom-3 right-3 flex gap-1.5">
                  {listing.photos.slice(0, 5).map((url, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const el = document.getElementById("detail-banner-img");
                        if (el) el.src = url;
                      }}
                      className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-56 sm:h-72 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center">
              {listing.type === "storage" ? (
                <Package size={64} className="text-primary/30" />
              ) : (
                <Car size={64} className="text-primary/30" />
              )}
            </div>
          )}

          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  listing.type === "storage"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {listing.type}
              </span>
              {listing.subtypes &&
                listing.subtypes.length > 0 &&
                listing.subtypes.map((st) => (
                  <span
                    key={st}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600"
                  >
                    {st}
                  </span>
                ))}
              <div className="flex items-center gap-1 text-sm text-yellow-600">
                <Star size={14} fill="currentColor" />
                <span className="font-semibold">{listing.rating_avg}</span>
                <span className="text-gray-400">({listing.rating_count})</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {listing.title}
            </h1>
            <div className="flex items-center gap-1 text-sm text-slate-body mt-2">
              <MapPin size={14} /> {listing.address}
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                About this space
              </h3>
              <p className="text-sm text-slate-body leading-relaxed">
                {listing.description}
              </p>
            </div>
          )}

          {/* Dimensions / Parking Info */}
          {isParking ? (
            <div className="bg-offwhite rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Car size={16} className="text-primary" /> Parking Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center text-sm">
                <div>
                  <p className="text-xs text-gray-500">Vehicle Type</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    {listing.vehicle_type === "4-wheeler" ? (
                      <CarFront size={16} className="text-primary" />
                    ) : (
                      <Bike size={16} className="text-primary" />
                    )}
                    <p className="font-bold text-gray-900">
                      {listing.vehicle_type || "Any"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Parking Type</p>
                  <p className="font-bold text-gray-900 mt-1">
                    {isCovered ? "Covered" : "Open"}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="inline-block text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full">
                  ₹
                  {listing.vehicle_type === "4-wheeler"
                    ? isCovered
                      ? 12
                      : 8
                    : isCovered
                      ? 8
                      : 4}{" "}
                  per slot
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-offwhite rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Ruler size={16} className="text-primary" /> Dimensions
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-xs text-gray-500">Length</p>
                  <p className="font-bold text-gray-900">
                    {listing.length_ft} ft
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Width</p>
                  <p className="font-bold text-gray-900">
                    {listing.width_ft} ft
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Height</p>
                  <p className="font-bold text-gray-900">
                    {listing.height_ft || "—"} ft
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Amenities */}
          {amenityIcons.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-3">
                {amenityIcons.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-offwhite px-4 py-2 rounded-lg text-sm"
                  >
                    <a.icon size={16} className="text-primary" />
                    <span className="text-gray-700 font-medium">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Map */}
          {listing.latitude && listing.longitude && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> Location
              </h3>
              <div
                className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                style={{ height: 280 }}
              >
                <MapContainer
                  center={[listing.latitude, listing.longitude]}
                  zoom={16}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[listing.latitude, listing.longitude]} />
                </MapContainer>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 text-sm font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition"
              >
                <Navigation size={14} /> Get Directions
              </a>
            </div>
          )}

          {/* Provider */}
          <div className="flex items-center gap-4 bg-offwhite rounded-xl p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {listing.owner_name}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-body">
                {listing.owner_verified && (
                  <span className="flex items-center gap-1 text-green-600">
                    <ShieldCheck size={12} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right – Booking Widget */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-2xl font-extrabold text-primary">
                  from ₹{getDisplayPrice()}
                  <span className="text-sm font-normal text-gray-400">/hr</span>
                </span>
                <p className="text-[11px] text-slate-body mt-0.5">
                  {isParking
                    ? `${isCovered ? "Covered" : "Open"} · ₹${listing.vehicle_type === "4-wheeler" ? (isCovered ? 12 : 8) : isCovered ? 8 : 4}/slot · flat rate`
                    : `${listing.length_ft * listing.width_ft} ft² · longer = cheaper per block`}
                </p>
              </div>
            </div>

            {/* Items to Store */}
            {listing.type === "storage" && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Camera size={15} className="text-primary" /> What are you
                  storing?
                </label>

                {/* Photo upload area */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {itemPhotos.map((url, i) => (
                      <div
                        key={i}
                        className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() =>
                            setItemPhotos((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                    {itemPhotos.length < 4 && (
                      <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition">
                        {uploading ? (
                          <Loader2
                            size={16}
                            className="animate-spin text-gray-400"
                          />
                        ) : (
                          <>
                            <ImagePlus size={18} className="text-gray-400" />
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              Add
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (!files.length) return;
                            setUploading(true);
                            try {
                              const fd = new FormData();
                              files
                                .slice(0, 4 - itemPhotos.length)
                                .forEach((f) => fd.append("photos", f));
                              const { data } = await API.post("/upload", fd, {
                                headers: {
                                  "Content-Type": "multipart/form-data",
                                },
                              });
                              setItemPhotos((prev) =>
                                [...prev, ...data.urls].slice(0, 4),
                              );
                            } catch {
                              /* ignore */
                            }
                            setUploading(false);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Upload up to 4 photos of your items
                  </p>
                </div>

                {/* Description */}
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Briefly describe the items you'll be storing…"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                />

                {/* Warning */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-2.5 mt-2">
                  <TriangleAlert
                    size={14}
                    className="flex-shrink-0 mt-0.5 text-amber-500"
                  />
                  <p>
                    Please{" "}
                    <span className="font-semibold">
                      do not store any valuable items
                    </span>{" "}
                    such as jewellery, electronics, or important documents. Stow
                    is not liable for loss or damage.
                  </p>
                </div>
              </div>
            )}

            {/* Schedule Picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When do you need it?
              </label>
              <TimeSlotPicker
                onSelect={handleTimeSelect}
                selectedStart={startTime}
                selectedEnd={endTime}
              />
            </div>

            {/* Price calculator */}
            <PriceCalculator
              listingId={id}
              startTime={startTime}
              endTime={endTime}
              isParking={isParking}
            />

            {/* Distance Warning */}
            {isBeyond25Km && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 mt-3">
                <AlertTriangle
                  size={18}
                  className="flex-shrink-0 mt-0.5 text-amber-500"
                />
                <div>
                  <p className="font-semibold">Location out of reach</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    This space is ~{Math.round(distanceKm)} km away from you.
                    You can still book, but it may be far to commute.
                  </p>
                </div>
              </div>
            )}

            {/* Distance badge */}
            {distanceKm !== null && !isBeyond25Km && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-3">
                <MapPin size={14} />
                <span className="font-medium">
                  {distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)}m away`
                    : `${distanceKm.toFixed(1)} km away`}
                </span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mt-3">
                {error}
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={booking || !startTime || !endTime}
              className="w-full mt-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {booking ? <Loader2 size={18} className="animate-spin" /> : null}
              {booking ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
