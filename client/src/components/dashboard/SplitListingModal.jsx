import React, { useState } from "react";
import API from "../../api";
import {
  X,
  Scissors,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Ruler,
  Package,
} from "lucide-react";

export default function SplitListingModal({ listing, onClose, onSplit }) {
  const [newLength, setNewLength] = useState(listing.length_ft);
  const [newWidth, setNewWidth] = useState(listing.width_ft);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const origArea = (listing.length_ft * listing.width_ft).toFixed(1);
  const keptArea = (newLength * newWidth).toFixed(1);
  const remArea = (origArea - keptArea).toFixed(1);

  // Compute remainder dimensions for preview
  let remLen = 0,
    remWid = 0;
  if (
    parseFloat(newLength) < listing.length_ft &&
    parseFloat(newWidth) === parseFloat(listing.width_ft)
  ) {
    remLen = (listing.length_ft - newLength).toFixed(1);
    remWid = listing.width_ft;
  } else if (
    parseFloat(newWidth) < listing.width_ft &&
    parseFloat(newLength) === parseFloat(listing.length_ft)
  ) {
    remLen = listing.length_ft;
    remWid = (listing.width_ft - newWidth).toFixed(1);
  } else if (
    parseFloat(newLength) < listing.length_ft &&
    parseFloat(newWidth) < listing.width_ft
  ) {
    remLen = listing.length_ft;
    remWid = (remArea / remLen).toFixed(1);
  }

  const isValid =
    newLength > 0 &&
    newWidth > 0 &&
    (parseFloat(newLength) < listing.length_ft ||
      parseFloat(newWidth) < listing.width_ft) &&
    parseFloat(newLength) <= listing.length_ft &&
    parseFloat(newWidth) <= listing.width_ft &&
    remArea > 0;

  const handleSplit = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post(`/listings/${listing.id}/split`, {
        new_length_ft: parseFloat(newLength),
        new_width_ft: parseFloat(newWidth),
      });
      onSplit(data.original, data.remainder);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to split listing. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Visual proportions for the diagram
  const maxBar = 200;
  const keptPct = Math.max(0.1, keptArea / origArea);
  const remPct = 1 - keptPct;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Scissors size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-gray-900">Split Space</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Current listing info */}
          <div className="bg-offwhite rounded-xl p-4">
            <p className="text-xs text-slate-body font-medium uppercase tracking-wider mb-1">
              Current Space
            </p>
            <p className="font-bold text-gray-900">{listing.title}</p>
            <p className="text-sm text-slate-body mt-1">
              {listing.length_ft} ft × {listing.width_ft} ft = {origArea} ft²
            </p>
          </div>

          {/* Dimension sliders */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Reduce dimensions to keep
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-body mb-1 flex items-center gap-1">
                  <Ruler size={12} /> Length (ft)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max={listing.length_ft}
                  step="0.1"
                  value={newLength}
                  onChange={(e) =>
                    setNewLength(parseFloat(e.target.value) || 0)
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <input
                  type="range"
                  min="0.1"
                  max={listing.length_ft}
                  step="0.1"
                  value={newLength}
                  onChange={(e) => setNewLength(parseFloat(e.target.value))}
                  className="w-full mt-1 accent-primary"
                />
              </div>
              <div>
                <label className="text-xs text-slate-body mb-1 flex items-center gap-1">
                  <Ruler size={12} /> Width (ft)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max={listing.width_ft}
                  step="0.1"
                  value={newWidth}
                  onChange={(e) => setNewWidth(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <input
                  type="range"
                  min="0.1"
                  max={listing.width_ft}
                  step="0.1"
                  value={newWidth}
                  onChange={(e) => setNewWidth(parseFloat(e.target.value))}
                  className="w-full mt-1 accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Visual split diagram */}
          {isValid && (
            <div className="space-y-3">
              <p className="text-xs text-slate-body font-medium uppercase tracking-wider">
                Split Preview
              </p>
              <div className="flex items-stretch gap-1 h-16 rounded-xl overflow-hidden border border-gray-200">
                <div
                  className="bg-primary/20 flex items-center justify-center text-xs font-bold text-primary transition-all"
                  style={{ width: `${keptPct * 100}%` }}
                >
                  <div className="text-center leading-tight">
                    <div>{keptArea} ft²</div>
                    <div className="text-[10px] font-normal opacity-70">
                      Kept
                    </div>
                  </div>
                </div>
                <div
                  className="bg-secondary/20 flex items-center justify-center text-xs font-bold text-secondary transition-all"
                  style={{ width: `${remPct * 100}%` }}
                >
                  <div className="text-center leading-tight">
                    <div>{remArea} ft²</div>
                    <div className="text-[10px] font-normal opacity-70">
                      New listing
                    </div>
                  </div>
                </div>
              </div>

              {/* Split result summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Package size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      Original (Reduced)
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {newLength} × {newWidth} ft
                  </p>
                  <p className="text-xs text-slate-body">{keptArea} ft²</p>
                </div>
                <div className="bg-secondary/5 border border-secondary/10 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Package size={14} className="text-secondary" />
                    <span className="text-xs font-semibold text-secondary">
                      New Listing
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {remLen} × {remWid} ft
                  </p>
                  <p className="text-xs text-slate-body">{remArea} ft²</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSplit}
            disabled={!isValid || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-orange-600 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Scissors size={16} />
            )}
            Split Space
          </button>
        </div>
      </div>
    </div>
  );
}
