import React, { useEffect, useState } from "react";
import { TrendingDown, Info, Loader2, Car } from "lucide-react";
import API from "../../api";

export default function PriceCalculator({
  listingId,
  startTime,
  endTime,
  isParking,
}) {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startTime || !endTime || !listingId) {
      setPricing(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    API.post("/bookings/preview-price", {
      listing_id: listingId,
      start_time: startTime,
      end_time: endTime,
    })
      .then(({ data }) => {
        if (!cancelled) setPricing(data);
      })
      .catch(() => {
        if (!cancelled) setPricing(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, startTime, endTime]);

  if (!startTime || !endTime) {
    return (
      <div className="bg-offwhite rounded-xl p-4 text-center text-sm text-gray-400">
        Select a time range to see pricing
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-offwhite rounded-xl p-4 flex items-center justify-center gap-2 text-sm text-gray-400">
        <Loader2 size={16} className="animate-spin" /> Calculating…
      </div>
    );
  }

  if (!pricing) return null;

  const hours = Math.floor(pricing.minutes / 60);
  const mins = pricing.minutes % 60;
  const durationText =
    hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;

  // Parking-specific breakdown
  if (pricing.isParking || isParking) {
    return (
      <div className="bg-offwhite rounded-xl p-5">
        <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-1.5">
          <Car size={14} className="text-primary" /> Price Breakdown
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Parking type</span>
            <span className="font-medium">
              {pricing.parkingType ||
                (pricing.baseRate === 8 ? "Covered" : "Open")}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Base rate</span>
            <span className="font-medium">
              ₹{pricing.baseRate || (pricing.parkingType === "Covered" ? 8 : 4)}
              /slot
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Duration</span>
            <span className="font-medium">
              {durationText} ({pricing.blocks} slots)
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Avg per slot</span>
            <span className="font-medium">₹{pricing.perBlock}</span>
          </div>

          {pricing.savingsPercent > 0 && (
            <div className="flex items-center gap-1.5 text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
              <TrendingDown size={14} />
              <span className="text-xs font-medium">
                {pricing.savingsPercent}% duration discount applied
              </span>
            </div>
          )}

          <div className="border-t pt-2 mt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-primary text-lg">₹{pricing.total}</span>
          </div>
        </div>
        <div className="flex items-start gap-1.5 mt-3 text-[11px] text-gray-400">
          <Info size={12} className="mt-0.5 shrink-0" />
          <span>
            Flat rate: ₹4–₹12 per slot (varies by vehicle & parking type). No
            hidden fees.
          </span>
        </div>
      </div>
    );
  }

  // Storage breakdown
  return (
    <div className="bg-offwhite rounded-xl p-5">
      <h4 className="font-semibold text-gray-900 text-sm mb-3">
        Price Breakdown
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Space</span>
          <span className="font-medium">{pricing.area} ft²</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Duration</span>
          <span className="font-medium">
            {durationText} ({pricing.blocks} blocks)
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Effective rate</span>
          <span className="font-medium">
            ₹{pricing.effectiveRate}/ft²/block
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Avg per block</span>
          <span className="font-medium">₹{pricing.perBlock}</span>
        </div>

        {pricing.savingsPercent > 0 && (
          <div className="flex items-center gap-1.5 text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
            <TrendingDown size={14} />
            <span className="text-xs font-medium">
              {pricing.savingsPercent}% duration discount applied
            </span>
          </div>
        )}

        <div className="border-t pt-2 mt-2 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span className="text-primary text-lg">₹{pricing.total}</span>
        </div>
      </div>
      <div className="flex items-start gap-1.5 mt-3 text-[11px] text-gray-400">
        <Info size={12} className="mt-0.5 shrink-0" />
        <span>
          Base: ₹30 for 4 ft² per slot. Longer durations get progressively
          cheaper.
        </span>
      </div>
    </div>
  );
}
