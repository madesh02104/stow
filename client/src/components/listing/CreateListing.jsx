import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api";
import StepType from "./StepType";
import StepLocation from "./StepLocation";
import StepAmenities from "./StepAmenities";
import StepPhotos from "./StepPhotos";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";

const STEPS = ["Type", "Details", "Photos", "Amenities"];

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    type: "",
    subtypes: [],
    vehicle_type: "",
    title: "",
    description: "",
    address: "",
    latitude: null,
    longitude: null,
    length_ft: "",
    width_ft: "",
    height_ft: "",
    has_locker: false,
    has_cctv: false,
    has_ev_charge: false,
    is_waterproof: false,
    has_security_guard: false,
    photos: [],
  });

  const update = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const next = () => {
    if (step === 0 && !formData.type) return setError("Select a space type");
    if (step === 0 && formData.type === "parking" && !formData.vehicle_type)
      return setError("Select a vehicle type (2-wheeler or 4-wheeler)");
    if (step === 1) {
      if (!formData.title || !formData.address)
        return setError("Fill all required fields");
      if (
        formData.type === "storage" &&
        (!formData.length_ft || !formData.width_ft)
      )
        return setError("Dimensions are required for storage listings");
      if (!formData.latitude || !formData.longitude)
        return setError("Please select a location on the map");
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await API.post("/listings", formData);
      navigate("/my-listings");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create listing");
    } finally {
      setSaving(false);
    }
  };

  const stepContent = [
    <StepType data={formData} onChange={update} />,
    <StepLocation data={formData} onChange={update} />,
    <StepPhotos data={formData} onChange={update} />,
    <StepAmenities data={formData} onChange={update} />,
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  i <= step
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i < step ? <Check size={18} /> : i + 1}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium ${i <= step ? "text-primary" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-primary" : "bg-gray-200"}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {stepContent[step]}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="flex items-center gap-1 px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-1 px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-orange-600 transition"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-orange-600 disabled:opacity-50 transition"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {saving ? "Publishing..." : "Publish Listing"}
          </button>
        )}
      </div>
    </div>
  );
}
