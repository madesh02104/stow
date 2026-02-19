import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api";
import StatusBadge from "../common/StatusBadge";
import SplitListingModal from "./SplitListingModal";
import {
  Package,
  Car,
  MapPin,
  Plus,
  Grid3x3,
  DollarSign,
  Loader2,
  Scissors,
  Ruler,
  Trash2,
  Tag,
  Pencil,
} from "lucide-react";

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [splitTarget, setSplitTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadListings = () => {
    API.get("/listings/user/mine")
      .then(({ data }) => setListings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleSplit = (original, remainder) => {
    // Update the listings array: replace the original, add the remainder
    setListings((prev) =>
      prev
        .map((l) => (l.id === original.id ? { ...l, ...original } : l))
        .concat({
          ...remainder,
          active_bookings: 0,
        }),
    );
    setSplitTarget(null);
  };

  const handleDelete = async (listing) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${listing.title}"? This action cannot be undone.`,
      )
    )
      return;

    try {
      setDeletingId(listing.id);
      await API.delete(`/listings/${listing.id}`);
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    } catch (err) {
      alert(
        err.response?.data?.error || "Failed to delete listing. Try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            My Listings
          </h1>
          <p className="text-sm text-slate-body mt-1">
            Manage your listed spaces
          </p>
        </div>
        <Link
          to="/create-listing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-orange-600 shadow-sm transition"
        >
          <Plus size={16} /> New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="bg-offwhite rounded-2xl p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No listings yet
          </h3>
          <p className="text-sm text-slate-body mb-6">
            Start earning by listing your unused space.
          </p>
          <Link
            to="/create-listing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-orange-600 transition"
          >
            <Plus size={16} /> Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((l) => (
            <div
              key={l.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-primary/20 transition-all"
            >
              <Link to={`/listing/${l.id}`}>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  {l.photos && l.photos.length > 0 ? (
                    <div className="w-full sm:w-28 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={l.photos[0]}
                        alt={l.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full sm:w-28 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      {l.type === "storage" ? (
                        <Package size={28} className="text-primary/40" />
                      ) : (
                        <Car size={28} className="text-primary/40" />
                      )}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          l.type === "storage"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {l.type}
                      </span>
                      <StatusBadge
                        status={l.is_active ? "confirmed" : "cancelled"}
                      />
                      {l.parent_listing_id && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                          Split
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 truncate">
                      {l.title}
                    </h3>
                    <p className="text-xs text-slate-body flex items-center gap-1 mt-1">
                      <MapPin size={12} /> {l.address}
                    </p>

                    {l.subtypes && l.subtypes.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Tag size={11} className="text-gray-400" />
                        {l.subtypes.map((st) => (
                          <span
                            key={st}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
                      <span className="flex items-center gap-1 text-slate-body">
                        <Ruler size={12} className="text-primary" />
                        {l.length_ft} × {l.width_ft} ft
                      </span>
                      <span className="flex items-center gap-1 text-slate-body">
                        <Grid3x3 size={12} className="text-primary" />
                        {l.active_bookings || 0} active booking
                        {l.active_bookings !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1 text-slate-body">
                        <DollarSign size={12} className="text-green-500" />
                        from ₹
                        {(() => {
                          const a = Math.max(4, l.length_ft * l.width_ft);
                          const d = 1 / (1 + 10 * Math.log(4));
                          return Math.max(30, Math.round(2.4 * d * a * 4));
                        })()}
                        /hr
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Actions row */}
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-3">
                <Link
                  to={`/edit-listing/${l.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition"
                >
                  <Pencil size={13} />
                  Edit
                </Link>
                <button
                  onClick={() => setSplitTarget(l)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 border border-primary/10 rounded-lg hover:bg-primary/10 transition"
                >
                  <Scissors size={13} />
                  Split Space
                </button>
                <button
                  onClick={() => handleDelete(l)}
                  disabled={deletingId === l.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                >
                  {deletingId === l.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Split modal */}
      {splitTarget && (
        <SplitListingModal
          listing={splitTarget}
          onClose={() => setSplitTarget(null)}
          onSplit={handleSplit}
        />
      )}
    </div>
  );
}
