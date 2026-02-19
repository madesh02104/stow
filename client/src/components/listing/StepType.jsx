import React from "react";
import {
  Package,
  Car,
  Home,
  ArrowDownToLine,
  Warehouse,
  Triangle,
  DoorOpen,
  AlignVerticalSpaceAround,
  Sun,
  Shield,
  Bike,
  CarFront,
} from "lucide-react";

const VEHICLE_TYPES = [
  {
    value: "2-wheeler",
    label: "2 Wheeler",
    desc: "Bike, scooter, cycle",
    icon: Bike,
  },
  {
    value: "4-wheeler",
    label: "4 Wheeler",
    desc: "Car, SUV, van",
    icon: CarFront,
  },
];

const STORAGE_SUBTYPES = [
  { value: "Spare Room", icon: Home },
  { value: "Basement", icon: ArrowDownToLine },
  { value: "Outhouse", icon: Warehouse },
  { value: "Loft", icon: Triangle },
  { value: "Garage", icon: DoorOpen },
  { value: "Stairwell", icon: AlignVerticalSpaceAround },
];

const PARKING_SUBTYPES = [
  { value: "Open", icon: Sun },
  { value: "Covered", icon: Shield },
];

export default function StepType({ data, onChange }) {
  const selected = data.type;
  const subtypes = data.subtypes || [];

  const types = [
    {
      value: "storage",
      label: "Storage",
      desc: "Boxes, luggage, furniture, or goods",
      icon: Package,
    },
    {
      value: "parking",
      label: "Parking",
      desc: "Cars, bikes, scooters, or EVs",
      icon: Car,
    },
  ];

  const handleTypeChange = (type) => {
    onChange({ type, subtypes: [], vehicle_type: "" });
  };

  const toggleSubtype = (value) => {
    const updated = subtypes.includes(value)
      ? subtypes.filter((s) => s !== value)
      : [...subtypes, value];
    onChange({ subtypes: updated });
  };

  const subtypeOptions =
    selected === "storage"
      ? STORAGE_SUBTYPES
      : selected === "parking"
        ? PARKING_SUBTYPES
        : [];

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">
        What type of space?
      </h3>
      <p className="text-sm text-slate-body mb-6">
        Choose whether you're listing storage or parking.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {types.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => handleTypeChange(t.value)}
            className={`p-6 rounded-2xl border-2 text-left transition-all group ${
              selected === t.value
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 hover:border-primary/40 bg-white"
            }`}
          >
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition ${
                selected === t.value
                  ? "bg-primary"
                  : "bg-gray-100 group-hover:bg-primary/10"
              }`}
            >
              <t.icon
                size={28}
                className={
                  selected === t.value
                    ? "text-white"
                    : "text-gray-500 group-hover:text-primary"
                }
              />
            </div>
            <h4 className="font-bold text-gray-900 text-lg">{t.label}</h4>
            <p className="text-sm text-slate-body mt-1">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Vehicle type selector (parking only) */}
      {selected === "parking" && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">
            🚗 Vehicle Allowed
          </h4>
          <p className="text-xs text-slate-body mb-4">
            Select the type of vehicle allowed in your parking space.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {VEHICLE_TYPES.map((vt) => {
              const active = data.vehicle_type === vt.value;
              return (
                <button
                  key={vt.value}
                  type="button"
                  onClick={() => onChange({ vehicle_type: vt.value })}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    active
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-gray-200 hover:border-primary/30 bg-white"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
                      active ? "bg-primary" : "bg-gray-100"
                    }`}
                  >
                    <vt.icon
                      size={20}
                      className={active ? "text-white" : "text-gray-500"}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${active ? "text-gray-900" : "text-gray-600"}`}
                    >
                      {vt.label}
                    </p>
                    <p className="text-[11px] text-gray-400">{vt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtype checkboxes */}
      {selected && subtypeOptions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">
            {selected === "storage" ? "Storage type" : "Parking type"}
          </h4>
          <p className="text-xs text-slate-body mb-4">Select all that apply.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subtypeOptions.map((st) => {
              const active = subtypes.includes(st.value);
              return (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => toggleSubtype(st.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/30 bg-white"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                      active ? "bg-primary" : "bg-gray-100"
                    }`}
                  >
                    <st.icon
                      size={16}
                      className={active ? "text-white" : "text-gray-500"}
                    />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      active ? "text-gray-900" : "text-gray-600"
                    }`}
                  >
                    {st.value}
                  </span>
                  {/* Checkbox */}
                  <div className="ml-auto">
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                        active ? "bg-primary border-primary" : "border-gray-300"
                      }`}
                    >
                      {active && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
