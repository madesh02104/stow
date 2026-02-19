import React, { useState, useMemo, useEffect } from "react";
import { addMinutes, format, parseISO, set } from "date-fns";
import { Calendar, Clock, ArrowRight } from "lucide-react";

/**
 * Dropdown-based From / To date + time picker.
 * Generates 15-minute time options from 00:00 to 23:45.
 * Uses internal state so partial selections (date without time) are preserved.
 */
export default function TimeSlotPicker({
  onSelect,
  selectedStart,
  selectedEnd,
}) {
  const today = format(new Date(), "yyyy-MM-dd");

  // Internal state for all four fields
  const [sDate, setSDate] = useState(
    selectedStart ? format(new Date(selectedStart), "yyyy-MM-dd") : today,
  );
  const [sTime, setSTime] = useState(
    selectedStart ? format(new Date(selectedStart), "HH:mm") : "",
  );
  const [eDate, setEDate] = useState(
    selectedEnd ? format(new Date(selectedEnd), "yyyy-MM-dd") : "",
  );
  const [eTime, setETime] = useState(
    selectedEnd ? format(new Date(selectedEnd), "HH:mm") : "",
  );

  // Generate time options in 15-min steps
  const timeOptions = useMemo(() => {
    const opts = [];
    const base = new Date(2000, 0, 1, 0, 0, 0);
    for (let i = 0; i < 96; i++) {
      const t = addMinutes(base, i * 15);
      opts.push({
        value: format(t, "HH:mm"),
        label: format(t, "hh:mm a"),
      });
    }
    return opts;
  }, []);

  // Build ISO string from date + time
  const buildISO = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    const d = parseISO(dateStr);
    return set(d, {
      hours: h,
      minutes: m,
      seconds: 0,
      milliseconds: 0,
    }).toISOString();
  };

  // Notify parent whenever a complete start+end pair exists
  useEffect(() => {
    const start = buildISO(sDate, sTime);
    const end = buildISO(eDate, eTime);
    onSelect && onSelect(start, end);
    // eslint-disable-next-line
  }, [sDate, sTime, eDate, eTime]);

  const handleChange = (field, value) => {
    if (field === "startDate") {
      setSDate(value);
      // Auto-set end date if empty or earlier than new start
      if (!eDate || eDate < value) setEDate(value);
    }
    if (field === "startTime") setSTime(value);
    if (field === "endDate") setEDate(value);
    if (field === "endTime") setETime(value);
  };

  return (
    <div className="space-y-4">
      {/* FROM */}
      <div className="bg-offwhite rounded-xl p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 block">
          From
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-slate-body flex items-center gap-1 mb-1">
              <Calendar size={11} /> Date
            </label>
            <input
              type="date"
              min={today}
              value={sDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              onClick={(e) => e.target.showPicker?.()}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm bg-white cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-body flex items-center gap-1 mb-1">
              <Clock size={11} /> Time
            </label>
            <select
              value={sTime}
              onChange={(e) => handleChange("startTime", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm bg-white appearance-none"
            >
              <option value="">Select</option>
              {timeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <ArrowRight size={14} className="text-primary rotate-90" />
        </div>
      </div>

      {/* TO */}
      <div className="bg-offwhite rounded-xl p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 block">
          To
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-slate-body flex items-center gap-1 mb-1">
              <Calendar size={11} /> Date
            </label>
            <input
              type="date"
              min={sDate || today}
              value={eDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              onClick={(e) => e.target.showPicker?.()}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm bg-white cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-body flex items-center gap-1 mb-1">
              <Clock size={11} /> Time
            </label>
            <select
              value={eTime}
              onChange={(e) => handleChange("endTime", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm bg-white appearance-none"
            >
              <option value="">Select</option>
              {timeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      {selectedStart && selectedEnd && (
        <div className="text-sm text-gray-700 bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between">
          <span>
            <span className="font-semibold text-primary">
              {format(new Date(selectedStart), "dd/MM/yyyy, hh:mm a")}
            </span>
            {" → "}
            <span className="font-semibold text-primary">
              {format(new Date(selectedEnd), "dd/MM/yyyy, hh:mm a")}
            </span>
          </span>
          <span className="text-xs text-slate-body">
            {(() => {
              const mins = Math.round(
                (new Date(selectedEnd) - new Date(selectedStart)) / 60000,
              );
              if (mins < 60) return `${mins}m`;
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              if (h < 24) return `${h}h${m > 0 ? ` ${m}m` : ""}`;
              const d = Math.floor(h / 24);
              const rh = h % 24;
              return `${d}d${rh > 0 ? ` ${rh}h` : ""}${m > 0 ? ` ${m}m` : ""}`;
            })()}
          </span>
        </div>
      )}
    </div>
  );
}
