import React, { useEffect, useRef, useState, useCallback } from "react";
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

  // Check if camera API is available at all
  const hasCameraAPI =
    isSecure &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function";

  useEffect(() => {
    // Skip camera if not secure context or no camera API
    if (!hasCameraAPI) {
      setStarting(false);
      setCameraFailed(true);
      if (!isSecure) {
        setError(
          "Camera requires a secure (HTTPS) connection. Please use the file upload option below."
        );
      } else {
        setError(
          "Camera is not supported on this browser. Please use the file upload option below."
        );
      }
      return;
    }

    const scannerId = "qr-scanner-region";
    let html5QrCode = null;
    let mounted = true;

    const startScanner = async () => {
      try {
        // First, explicitly request camera permission
        // This triggers the browser permission prompt before html5-qrcode tries
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        // Stop the temporary stream — html5-qrcode will request its own
        stream.getTracks().forEach((track) => track.stop());

        if (!mounted) return;

        // Small delay to ensure the DOM container is fully painted with dimensions
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (!mounted) return;

        html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
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
          () => {} // ignore intermediate scan failures
        );
        if (mounted) {
          setStarting(false);
          setError("");
        }
      } catch (err) {
        console.error("QR Scanner camera error:", err);
        if (mounted) {
          setStarting(false);
          setCameraFailed(true);

          // Provide helpful error messages
          const errMsg =
            err?.message || err?.name || String(err);
          if (
            errMsg.includes("NotAllowedError") ||
            errMsg.includes("Permission")
          ) {
            setError(
              "Camera permission was denied. Please allow camera access in your browser settings, or upload a photo of the QR code."
            );
          } else if (
            errMsg.includes("NotFoundError") ||
            errMsg.includes("DevicesNotFound")
          ) {
            setError(
              "No camera found on this device. Please upload a photo of the QR code instead."
            );
          } else if (
            errMsg.includes("NotReadableError") ||
            errMsg.includes("TrackStartError")
          ) {
            setError(
              "Camera is being used by another app. Close other camera apps and try again, or upload a photo."
            );
          } else {
            setError(
              "Could not start camera. Please upload a photo of the QR code instead."
            );
          }
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current && !stoppedRef.current) {
        stoppedRef.current = true;
        const scanner = scannerRef.current;
        try {
          const state = scanner.getState?.();
          if (state === 2 || state === 3) {
            scanner.stop().catch(() => {});
          }
        } catch {
          // Scanner might already be cleaned up
        }
      }
    };
    // eslint-disable-next-line
  }, []);

  // Handle file-based QR scan
  const handleFileUpload = useCallback(
    async (e) => {
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
          "Could not read QR code from image. Please try again with a clearer photo."
        );
        setScanningFile(false);
      }

      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onScan]
  );

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
        <div className="p-5 space-y-4">
          {/* Camera view — always in DOM so html5-qrcode can measure & inject the video */}
          {!cameraFailed && (
            <div
              className="relative w-full rounded-xl overflow-hidden bg-black"
              style={{ minHeight: 280 }}
            >
              {starting && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-900 rounded-xl">
                  <Loader2 size={32} className="animate-spin text-white" />
                  <p className="text-sm text-gray-300">Starting camera…</p>
                </div>
              )}
              <div
                id="qr-scanner-region"
                ref={containerRef}
                className="w-full"
                style={{ minHeight: 280 }}
              />
            </div>
          )}

          {/* Camera failed — show icon */}
          {cameraFailed && (
            <div className="flex flex-col items-center justify-center py-4 gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <ImageIcon size={28} className="text-amber-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Camera not available
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* File upload — always available as fallback */}
          {(cameraFailed || !starting) && (
            <div className="border-t border-gray-100 pt-4">
              {!cameraFailed && (
                <p className="text-xs text-gray-400 text-center mb-3">
                  Or upload a photo of the QR code
                </p>
              )}
              {scanningFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-primary py-3">
                  <Loader2 size={16} className="animate-spin" /> Reading QR…
                </div>
              ) : (
                <label className="w-full cursor-pointer block">
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

          <p className="text-xs text-gray-400 text-center">
            {cameraFailed
              ? "Take a photo of the provider's QR code and upload it"
              : "Point your camera at the QR code shown by the provider"}
          </p>
        </div>
      </div>
    </div>
  );
}
