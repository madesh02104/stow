import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import StepType from "./StepType";
import StepLocation from "./StepLocation";
import StepAmenities from "./StepAmenities";
import StepPhotos from "./StepPhotos";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";

const STEPS = ["Type", "Details", "Photos", "Amenities"];

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    type: "",
    subtypes: [],
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
    photos: [],
  });

  // Load existing listing data
  useEffect(() => {
    API.get(`/listings/${id}`)
      .then(({ data }) => {
        setFormData({
          type: data.type || "",
          subtypes: data.subtypes || [],
          title: data.title || "",
          description: data.description || "",
          address: data.address || "",
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          length_ft: data.length_ft || "",
          width_ft: data.width_ft || "",
          height_ft: data.height_ft || "",
          has_locker: data.has_locker || false,
          has_cctv: data.has_cctv || false,
          has_ev_charge: data.has_ev_charge || false,
          is_waterproof: data.is_waterproof || false,
          photos: data.photos || [],
        });
      })
      .catch(() => setError("Failed to load listing"))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const next = () => {
    if (step === 0 && !formData.type) return setError("Select a space type");
    if (
      step === 1 &&
      (!formData.title ||
        !formData.address ||
        !formData.length_ft ||
        !formData.width_ft)
    )
      return setError("Fill all required fields");
    if (step === 1 && (!formData.latitude || !formData.longitude))
      return setError("Please select a location on the map");
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
      await API.put(`/listings/${id}`, formData);
      navigate("/my-listings");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
    </div>
  );
}
