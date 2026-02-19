import React, { useState } from "react";
import { Plus, Trash2, Grid3x3 } from "lucide-react";

export default function StepDynamic({ data, onChange }) {
  const subSlots = data.subSlots || [];

  const addSlot = () => {
    onChange({
      subSlots: [
        ...subSlots,
        { label: "", length_ft: "", width_ft: "", height_ft: "" },
      ],
    });
  };

  const removeSlot = (index) => {
    onChange({ subSlots: subSlots.filter((_, i) => i !== index) });
  };

  const updateSlot = (index, field, value) => {
    const updated = subSlots.map((s, i) =>
      i === index ? { ...s, [field]: value } : s,
    );
    onChange({ subSlots: updated });
  };

  const totalArea = (data.length_ft || 0) * (data.width_ft || 0);
  const usedArea = subSlots.reduce(
    (sum, s) =>
      sum + (parseFloat(s.length_ft) || 0) * (parseFloat(s.width_ft) || 0),
    0,
  );
  const remaining = Math.max(0, totalArea - usedArea);

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">
        Dynamic Space Allocation
      </h3>
      <p className="text-sm text-slate-body mb-6">
        Sub-divide unused capacity so multiple seekers can share this space.
      </p>

      {/* Area gauge */}
      <div className="bg-offwhite rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Space Capacity</span>
          <span className="text-xs text-slate-body">
            {usedArea.toLocaleString()} / {totalArea.toLocaleString()} ft²
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${totalArea ? Math.min((usedArea / totalArea) * 100, 100) : 0}%`,
            }}
          />
        </div>
        <p className="text-xs text-slate-body mt-1">
          Remaining:{" "}
          <span className="font-semibold text-green-600">
            {remaining.toLocaleString()} ft²
          </span>
        </p>
      </div>

      {/* Sub-slots list */}
      <div className="space-y-4 mb-4">
        {subSlots.map((slot, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Grid3x3 size={16} className="text-primary" />
                <span className="text-sm font-semibold text-gray-700">
                  Sub-slot {i + 1}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeSlot(i)}
                className="text-red-400 hover:text-red-600 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <input
              type="text"
              value={slot.label}
              onChange={(e) => updateSlot(i, "label", e.target.value)}
              placeholder="Label (e.g. Left corner, Shelf B)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
            />

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min={0}
                value={slot.length_ft}
                onChange={(e) => updateSlot(i, "length_ft", e.target.value)}
                placeholder="L (ft)"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
              <input
                type="number"
                min={0}
                value={slot.width_ft}
                onChange={(e) => updateSlot(i, "width_ft", e.target.value)}
                placeholder="W (ft)"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
              <input
                type="number"
                min={0}
                value={slot.height_ft}
                onChange={(e) => updateSlot(i, "height_ft", e.target.value)}
                placeholder="H (ft)"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSlot}
        className="w-full py-3 border-2 border-dashed border-primary/30 rounded-xl text-primary font-semibold text-sm hover:bg-primary/5 transition flex items-center justify-center gap-2"
      >
        <Plus size={18} /> Add Sub-Slot
      </button>
    </div>
  );
}
