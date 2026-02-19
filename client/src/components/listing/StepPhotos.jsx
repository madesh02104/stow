import React, { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import API from "../../api";

export default function StepPhotos({ data, onChange }) {
  const photos = data.photos || [];
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remaining = 6 - photos.length;
    if (remaining <= 0) {
      setError("Maximum 6 photos allowed");
      return;
    }

    const toUpload = files.slice(0, remaining);
    const formData = new FormData();
    toUpload.forEach((f) => formData.append("photos", f));

    setError("");
    setUploading(true);
    try {
      const { data: res } = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange({ photos: [...photos, ...res.urls] });
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      // Reset the input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removePhoto = (index) => {
    onChange({ photos: photos.filter((_, i) => i !== index) });
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Photos</h3>
      <p className="text-sm text-slate-body mb-6">
        Add up to 6 photos of your space. Good photos attract more bookings!
      </p>

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {photos.map((url, i) => (
          <div
            key={i}
            className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 group"
          >
            <img
              src={url}
              alt={`Listing photo ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition opacity-0 group-hover:opacity-100"
            >
              <X size={14} />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold uppercase bg-primary text-white px-2 py-0.5 rounded-full">
                Cover
              </span>
            )}
          </div>
        ))}

        {/* Upload slot */}
        {photos.length < 6 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 hover:border-primary/50 bg-gray-50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={24} className="animate-spin text-primary" />
            ) : (
              <ImagePlus size={24} className="text-gray-400" />
            )}
            <span className="text-xs font-medium text-gray-500">
              {uploading ? "Uploading..." : "Add Photo"}
            </span>
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

      <p className="text-xs text-gray-400">
        JPG, PNG, or WebP · Max 5 MB each · {photos.length}/6 uploaded
      </p>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  );
}
