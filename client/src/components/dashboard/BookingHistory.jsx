import React, { useEffect, useState } from "react";
import API from "../../api";
import StatusBadge from "../common/StatusBadge";
import QRHandshake from "../common/QRHandshake";
import { format, parseISO } from "date-fns";
import {
  Package,
  Car,
  MapPin,
  Clock,
  QrCode,
  Loader2,
  CalendarDays,
  Check,
  ArrowRight,
  Camera,
} from "lucide-react";

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);

  const load = () => {
    API.get("/bookings/mine")
      .then(({ data }) => setBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // Separate upcoming and past
  const now = new Date();
  const upcoming = bookings.filter(
    (b) =>
      new Date(b.end_time) >= now &&
      b.status !== "cancelled" &&
      b.status !== "completed",
  );
  const past = bookings.filter(
    (b) =>
      new Date(b.end_time) < now ||
      b.status === "cancelled" ||
      b.status === "completed",
  );

  const custodyLabel = {
    Pending: { text: "Booked", color: "text-yellow-600", icon: CalendarDays },
    "In-Custody": {
      text: "Handed Over",
      color: "text-blue-600",
      icon: ArrowRight,
    },
    Completed: { text: "Re-gotten", color: "text-green-600", icon: Check },
  };

  const BookingCard = ({ b }) => {
    const custody = custodyLabel[b.custody_state] || custodyLabel.Pending;
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Thumb */}
          <div className="w-full sm:w-24 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            {b.listing_type === "storage" ? (
              <Package size={24} className="text-primary/40" />
            ) : (
              <Car size={24} className="text-primary/40" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge status={b.status} />
              {/* Custody chain */}
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold ${custody.color}`}
              >
                <custody.icon size={12} /> {custody.text}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 truncate text-sm">
              {b.listing_title}
            </h3>
            <p className="text-xs text-slate-body flex items-center gap-1 mt-0.5">
              <MapPin size={11} /> {b.address}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-body">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {format(parseISO(b.start_time), "dd/MM/yyyy, HH:mm")} –{" "}
                {format(parseISO(b.end_time), "dd/MM/yyyy, HH:mm")}
              </span>
              <span className="font-semibold text-primary">
                ₹{b.total_price}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              {b.status === "confirmed" && b.custody_state !== "Completed" && (
                <button
                  onClick={() =>
                    setQrModal({
                      bookingId: b.id,
                      custodyState: b.custody_state,
                      isProvider: false,
                    })
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary/20 transition"
                >
                  <Camera size={12} /> Scan QR
                </button>
              )}
              {b.custody_state === "Completed" && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                  <Check size={12} /> Transaction Complete
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
        Booking History
      </h1>
      <p className="text-sm text-slate-body mb-8">
        Track your past and upcoming reservations.
      </p>

      {bookings.length === 0 ? (
        <div className="bg-offwhite rounded-2xl p-12 text-center">
          <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No bookings yet
          </h3>
          <p className="text-sm text-slate-body">
            Find a space and make your first reservation!
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} b={b} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Past</h2>
              <div className="space-y-3">
                {past.map((b) => (
                  <BookingCard key={b.id} b={b} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* QR Modal */}
      {qrModal && (
        <QRHandshake
          bookingId={qrModal.bookingId}
          custodyState={qrModal.custodyState}
          isProvider={qrModal.isProvider}
          onClose={() => setQrModal(null)}
          onStateChange={() => {
            setQrModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}
