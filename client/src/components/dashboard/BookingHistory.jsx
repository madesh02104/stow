import React, { useEffect, useState } from "react";
import API from "../../api";
import StatusBadge from "../common/StatusBadge";
import QRHandshake from "../common/QRHandshake";
import { format, parseISO, differenceInHours } from "date-fns";
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
  XCircle,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);

  const load = () => {
    API.get("/bookings/mine")
      .then(({ data }) => setBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancelClick = (b) => {
    const hoursLeft = differenceInHours(new Date(b.start_time), new Date());
    const refundPercent = hoursLeft >= 24 ? 100 : 0;
    setCancelConfirm({
      id: b.id,
      title: b.listing_title,
      hoursLeft,
      refundPercent,
      totalPrice: b.total_price,
    });
  };

  const handleCancelConfirm = async () => {
    if (!cancelConfirm) return;
    setCancellingId(cancelConfirm.id);
    try {
      await API.patch(`/bookings/${cancelConfirm.id}/cancel`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
      setCancelConfirm(null);
    }
  };

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
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {b.status !== "cancelled" && b.custody_state !== "Completed" && (
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
              {/* Cancel button — only for non-cancelled, non-completed, non-in-custody */}
              {b.status !== "cancelled" &&
                b.custody_state !== "Completed" &&
                b.custody_state !== "In-Custody" && (
                  <button
                    onClick={() => handleCancelClick(b)}
                    disabled={cancellingId === b.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-100 transition disabled:opacity-50"
                  >
                    {cancellingId === b.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <XCircle size={12} />
                    )}
                    Cancel Booking
                  </button>
                )}
              {b.custody_state === "Completed" && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                  <Check size={12} /> Transaction Complete
                </span>
              )}
              {/* Refund info for cancelled bookings */}
              {b.status === "cancelled" && b.refund_amount > 0 && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                  <IndianRupee size={11} /> ₹{b.refund_amount} refunded
                </span>
              )}
              {b.status === "cancelled" &&
                (b.refund_amount == null || b.refund_amount == 0) && (
                  <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                    No refund (cancelled late)
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

      {/* Cancel Confirmation Modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Cancel Booking?
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel your booking for{" "}
              <strong>{cancelConfirm.title}</strong>?
            </p>

            {/* Refund info box */}
            <div
              className={`rounded-xl p-4 mb-5 ${
                cancelConfirm.refundPercent === 100
                  ? "bg-green-50 border border-green-200"
                  : "bg-amber-50 border border-amber-200"
              }`}
            >
              {cancelConfirm.refundPercent === 100 ? (
                <div className="flex items-start gap-2">
                  <IndianRupee
                    size={16}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      100% Refund — ₹{cancelConfirm.totalPrice}
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      You're cancelling {cancelConfirm.hoursLeft}+ hours before
                      the slot. Full refund will be processed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    size={16}
                    className="text-amber-600 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      No Refund
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Less than 24 hours until your slot. Cancellations within
                      24 hours are non-refundable.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancellingId}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
              >
                {cancellingId ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={14} />
                )}
                {cancellingId ? "Cancelling…" : "Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
