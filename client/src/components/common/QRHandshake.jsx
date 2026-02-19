import React, { useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  QrCode,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Camera,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import API from "../../api";
import QRScanner from "./QRScanner";

/**
 * QRHandshake — Full Chain of Custody QR modal
 *
 * Provider view:  "Generate QR" → shows QR for seeker to scan
 * Seeker view:    "Scan QR"     → opens camera to scan provider's QR
 *
 * Props:
 *   bookingId      – UUID of the booking
 *   custodyState   – current state: Pending | In-Custody | Completed
 *   isProvider     – true if current user is the lister/provider
 *   onClose        – close modal callback
 *   onStateChange  – called after successful state transition with updated booking
 */
export default function QRHandshake({
  bookingId,
  custodyState,
  isProvider,
  onClose,
  onStateChange,
}) {
  const [qrData, setQrData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const isCompleted = custodyState === "Completed";
  const actionLabel = custodyState === "Pending" ? "Drop-off" : "Pick-up";

  /* ---- Provider: Generate QR ---- */
  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const { data } = await API.post(`/custody/${bookingId}/generate-qr`);
      const qrValue = JSON.stringify({
        bookingId,
        scanToken: data.scanToken,
        action: data.action,
      });
      setQrData({ value: qrValue, action: data.action });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate QR");
    }
    setGenerating(false);
  };

  /* ---- Seeker: Handle scanned data ---- */
  const handleScanResult = async (decodedText) => {
    setScanning(false);
    setProcessing(true);
    setError("");
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.bookingId !== bookingId) {
        setError("This QR code is for a different booking");
        setProcessing(false);
        return;
      }

      const { data } = await API.post(`/custody/${bookingId}/scan`, {
        scanToken: parsed.scanToken,
      });

      setSuccess(
        data.custody_state === "In-Custody"
          ? "Drop-off confirmed! Items are now in custody."
          : "Pick-up confirmed! Transaction complete.",
      );
      if (onStateChange) onStateChange(data);
    } catch (err) {
      setError(err.response?.data?.error || "Scan verification failed");
    }
    setProcessing(false);
  };

  const stateSteps = [
    {
      label: "Booked",
      state: "Pending",
      icon: CalendarDays,
      done: custodyState !== "Pending" || success,
    },
    {
      label: "In Custody",
      state: "In-Custody",
      icon: ShieldCheck,
      done:
        custodyState === "Completed" ||
        (custodyState === "In-Custody" && success),
    },
    {
      label: "Completed",
      state: "Completed",
      icon: CheckCircle2,
      done:
        custodyState === "Completed" ||
        (success && success.includes("complete")),
    },
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden"
        style={{ maxHeight: "min(90vh, 650px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" /> Chain of Custody
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* State progress bar */}
          <div className="flex items-center justify-between">
            {stateSteps.map((s, i) => (
              <React.Fragment key={s.state}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      s.done
                        ? "bg-green-500 text-white"
                        : custodyState === s.state && !success
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <s.icon size={18} />
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-semibold ${
                      s.done
                        ? "text-green-600"
                        : custodyState === s.state
                          ? "text-primary"
                          : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < stateSteps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      s.done ? "bg-green-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Success message */}
          {success && (
            <div className="flex flex-col items-center py-6 text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Success!</h4>
              <p className="text-sm text-gray-600">{success}</p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-orange-600 transition"
              >
                Done
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Completed state */}
          {isCompleted && !success && (
            <div className="flex flex-col items-center py-6 text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">
                Transaction Complete
              </h4>
              <p className="text-sm text-gray-600">
                This booking has been fully completed. Both drop-off and pick-up
                were verified via QR.
              </p>
            </div>
          )}

          {/* Provider view — Generate QR */}
          {isProvider && !isCompleted && !success && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-blue-800 mb-1">
                  You are the Provider
                </p>
                <p className="text-xs text-blue-600">
                  Generate a QR code for the seeker to scan to confirm the{" "}
                  <strong>{actionLabel.toLowerCase()}</strong>.
                </p>
              </div>

              {!qrData ? (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <QrCode size={18} />
                  )}
                  {generating
                    ? "Generating…"
                    : `Generate ${actionLabel} QR Code`}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="p-4 bg-white border-2 border-gray-100 rounded-xl shadow-sm">
                      <QRCodeSVG
                        value={qrData.value}
                        size={220}
                        fgColor="#FF681F"
                        level="H"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-800">
                      {qrData.action === "handover"
                        ? "🔽 Drop-off QR"
                        : "🔼 Pick-up QR"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ask the seeker to scan this code with their Stow app
                    </p>
                  </div>
                  <button
                    onClick={handleGenerate}
                    className="w-full py-2 text-sm text-primary font-medium border border-primary/20 rounded-lg hover:bg-primary/5 transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={14} /> Regenerate QR
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Seeker view — Scan QR */}
          {!isProvider && !isCompleted && !success && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-green-800 mb-1">
                  You are the Seeker
                </p>
                <p className="text-xs text-green-600">
                  Scan the QR code shown by the provider to confirm the{" "}
                  <strong>{actionLabel.toLowerCase()}</strong>.
                </p>
              </div>

              {processing ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-sm text-gray-500">Verifying QR code…</p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setError("");
                    setScanning(true);
                  }}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-orange-600 transition flex items-center justify-center gap-2"
                >
                  <Camera size={18} /> Scan {actionLabel} QR Code
                </button>
              )}
            </div>
          )}

          {/* Booking info */}
          {!success && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 text-center">
              Booking ID: {bookingId?.slice(0, 8)}…
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner overlay */}
      {scanning && (
        <QRScanner
          onScan={handleScanResult}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
