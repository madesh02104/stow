import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  X,
  Loader2,
  AlertTriangle,
  Upload,
  ImageIcon,
} from "lucide-react";

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  const stoppedRef = useRef(false);
  const fileInputRef = useRef(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [scanningFile, setScanningFile] = useState(false);

  // Check if secure context (HTTPS or localhost) — camera needs it
  const isSecure =
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  useEffect(() => {
    // Skip camera if not secure context — go straight to file upload mode
    if (!isSecure) {
      setStarting(false);
      setCameraFailed(true);
      return;
    }

    const scannerId = "qr-scanner-region";
    let html5QrCode = null;
    let mounted = true;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (stoppedRef.current) return;
            stoppedRef.current = true;
            html5QrCode
              .stop()
              .then(() => {
                if (mounted) onScan(decodedText);
              })
              .catch(() => {
                if (mounted) onScan(decodedText);
              });
          },
          () => {},
        );
        if (mounted) setStarting(false);
      } catch (err) {
        if (mounted) {
          setStarting(false);
          setCameraFailed(true);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current && !stoppedRef.current) {
        stoppedRef.current = true;
        const scanner = scannerRef.current;
        const state = scanner.getState?.();
        if (state === 2 || state === 3) {
          scanner.stop().catch(() => {});
        }
      }
    };
    // eslint-disable-next-line
  }, []);

  // Handle file-based QR scan
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningFile(true);
    setError("");

    try {
      const html5QrCode = new Html5Qrcode("qr-file-scanner");
      const result = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      onScan(result);
    } catch (err) {
      setError(
        "Could not read QR code from image. Please try again with a clearer photo.",
      );
      setScanningFile(false);
    }

    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Camera size={20} className="text-primary" /> Scan QR Code
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Scanner area */}
        <div className="p-5">
          {starting && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-sm text-gray-500">Starting camera…</p>
            </div>
          )}

          {/* Camera view (only when camera works) */}
          {!cameraFailed && (
            <div
              id="qr-scanner-region"
              ref={containerRef}
              className="rounded-xl overflow-hidden"
              style={{ display: starting ? "none" : "block" }}
            />
          )}

          {/* File upload fallback */}
          {cameraFailed && (
            <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <ImageIcon size={28} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  Camera not available
                </p>
                <p className="text-xs text-gray-500">
                  Camera requires HTTPS. Take a{" "}
                  <strong>photo/screenshot</strong> of the QR code and upload it
                  below.
                </p>
              </div>

              {scanningFile ? (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 size={16} className="animate-spin" /> Reading QR…
                </div>
              ) : (
                <label className="w-full cursor-pointer">
                  <div className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-orange-600 transition flex items-center justify-center gap-2">
                    <Upload size={18} /> Upload QR Photo
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Hidden div for file-based scanner */}
          <div id="qr-file-scanner" style={{ display: "none" }} />

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mt-3">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            {cameraFailed
              ? "Take a photo of the provider's QR code and upload it"
              : "Point your camera at the QR code shown by the provider"}
          </p>
        </div>
      </div>
    </div>
  );
}
